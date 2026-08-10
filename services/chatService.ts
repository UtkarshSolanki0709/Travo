import { supabase } from "@/lib/supabase";
import { socketService } from "@/services/socketService";
import * as Crypto from "expo-crypto";

export interface Conversation {
  id: string;
  type: "direct" | "group";
  activity_id?: string;
  title?: string;
  avatar_url?: string;
  last_message_text?: string;
  last_message_at?: string;
  created_at: string;
  unread_count?: number;
  other_user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export type MessageStatus = "sending" | "sent" | "delivered" | "read";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text?: string;
  media_url?: string;
  media_type?: "image" | "video" | "audio" | "location";
  client_temp_id?: string;
  created_at: string;
  status?: MessageStatus;
  sender?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  created_at: string;
  friend_user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export const chatService = {
  /**
   * Syncs activity group chats for any approved activity participant
   */
  async syncActivityGroupChats(userId: string) {
    if (!userId) return;
    try {
      const { data: userActs } = await supabase
        .from("activity_participants")
        .select("activity_id, is_host, activity:activities(id, title)")
        .eq("user_id", userId)
        .eq("status", "approved");

      if (!userActs || userActs.length === 0) return;

      for (const actItem of userActs) {
        const act = (actItem as any).activity;
        if (!act) continue;

        let { data: conv } = await supabase
          .from("conversations")
          .select("id, title")
          .eq("activity_id", act.id)
          .eq("type", "group")
          .maybeSingle();

        let convId = conv?.id;

        if (!convId) {
          const { data: newConv } = await supabase
            .from("conversations")
            .insert({
              type: "group",
              activity_id: act.id,
              title: act.title,
            })
            .select("id")
            .maybeSingle();

          if (newConv) {
            convId = newConv.id;
          }
        }

        if (convId) {
          await supabase.from("conversation_participants").upsert(
            {
              conversation_id: convId,
              user_id: userId,
              role: actItem.is_host ? "admin" : "member",
            },
            { onConflict: "conversation_id,user_id" },
          );
        }
      }
    } catch (err) {
      console.error("syncActivityGroupChats error:", err);
    }
  },

  /**
   * Fetch all conversations for a user with unread counts & other user details
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    if (!userId) return [];

    // Run sync in background without blocking conversation fetch
    this.syncActivityGroupChats(userId).catch((err) =>
      console.error("syncActivityGroupChats background error:", err),
    );

    // Get participant rows
    const { data: partData, error: partError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at, conversation:conversations(*)")
      .eq("user_id", userId);

    if (partError) throw partError;
    if (!partData || partData.length === 0) return [];

    const conversations: Conversation[] = [];

    for (const item of partData) {
      const conv = item.conversation as any;
      if (!conv) continue;

      if (conv.type === "group" && !conv.title && conv.activity_id) {
        const { data: act } = await supabase
          .from("activities")
          .select("title")
          .eq("id", conv.activity_id)
          .maybeSingle();
        if (act?.title) {
          conv.title = act.title;
        }
      }

      let otherUser = undefined;

      // If 1-on-1 direct chat, fetch the other participant's profile
      if (conv.type === "direct") {
        const { data: otherPart } = await supabase
          .from("conversation_participants")
          .select("user:users(*)")
          .eq("conversation_id", conv.id)
          .neq("user_id", userId)
          .maybeSingle();

        if (otherPart && (otherPart as any).user) {
          otherUser = (otherPart as any).user;
        }
      }

      // Count unread messages
      let unreadCount = 0;
      if (item.last_read_at) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .gt("created_at", item.last_read_at)
          .neq("sender_id", userId);

        unreadCount = count || 0;
      } else {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", userId);

        unreadCount = count || 0;
      }

      conversations.push({
        ...conv,
        unread_count: unreadCount,
        other_user: otherUser,
      });
    }

    // Sort by last message date
    return conversations.sort((a, b) => {
      const timeA = new Date(a.last_message_at || a.created_at).getTime();
      const timeB = new Date(b.last_message_at || b.created_at).getTime();
      return timeB - timeA;
    });
  },

  /**
   * Get or create a 1-on-1 direct conversation between two users
   */
  async getOrCreateDirectConversation(
    userId: string,
    targetUserId: string,
  ): Promise<string> {
    // Check if conversation already exists
    const { data: myConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id, conversation:conversations!inner(type)")
      .eq("user_id", userId)
      .eq("conversation.type", "direct");

    if (myConvs && myConvs.length > 0) {
      const convIds = myConvs.map((c) => c.conversation_id);
      const { data: targetMatch } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", targetUserId)
        .in("conversation_id", convIds)
        .maybeSingle();

      if (targetMatch) {
        return targetMatch.conversation_id;
      }
    }

    // Create new direct conversation
    const convId = Crypto.randomUUID();
    const { error: convError } = await supabase.from("conversations").insert({
      id: convId,
      type: "direct",
      created_at: new Date().toISOString(),
    });

    if (convError) throw convError;

    // Add both participants
    await supabase.from("conversation_participants").insert([
      { conversation_id: convId, user_id: userId, role: "member" },
      { conversation_id: convId, user_id: targetUserId, role: "member" },
    ]);

    return convId;
  },

  /**
   * Fetch messages for a specific conversation
   */
  async getMessages(
    conversationId: string,
    currentUserId: string,
  ): Promise<Message[]> {
    let data: any[] | null = null;

    // Try primary query with embedded sender & receipts
    const { data: primaryData, error: primaryError } = await supabase
      .from("messages")
      .select(
        "*, sender:users!messages_sender_id_fkey(*), receipts:message_receipts(*)",
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!primaryError && primaryData) {
      data = primaryData;
    } else {
      // Fallback query if constraint name differs on remote Supabase
      console.warn("Primary getMessages select failed, trying fallback...", primaryError);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("messages")
        .select("*, receipts:message_receipts(*)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (fallbackError) {
        console.error("getMessages DB error:", fallbackError);
        throw fallbackError;
      }

      // Fetch senders for fallback messages
      if (fallbackData && fallbackData.length > 0) {
        const senderIds = Array.from(
          new Set(fallbackData.map((m: any) => m.sender_id).filter(Boolean)),
        );
        const { data: usersData } = await supabase
          .from("users")
          .select("*")
          .in("id", senderIds);

        const usersMap = new Map((usersData || []).map((u) => [u.id, u]));

        data = fallbackData.map((m: any) => ({
          ...m,
          sender: usersMap.get(m.sender_id),
        }));
      } else {
        data = fallbackData;
      }
    }

    return (data || []).map((msg: any) => {
      let status: MessageStatus = "sent";

      if (msg.sender_id === currentUserId && msg.receipts) {
        const hasRead = msg.receipts.some((r: any) => r.status === "read");
        const hasDelivered = msg.receipts.some(
          (r: any) => r.status === "delivered",
        );

        if (hasRead) status = "read";
        else if (hasDelivered) status = "delivered";
      }

      return {
        ...msg,
        status,
      };
    });
  },

  /**
   * Send a new message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
    mediaUrl?: string,
    mediaType?: "image" | "video" | "audio" | "location",
    clientTempId?: string,
  ): Promise<Message> {
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("messages")
      .insert({
        id,
        conversation_id: conversationId,
        sender_id: senderId,
        text,
        media_url: mediaUrl,
        media_type: mediaType,
        client_temp_id: clientTempId,
        created_at: now,
      })
      .select("*")
      .single();

    if (error) {
      console.error("sendMessage DB error:", error);
      throw error;
    }

    // Fetch sender info separately if needed
    const { data: sender } = await supabase
      .from("users")
      .select("*")
      .eq("id", senderId)
      .maybeSingle();

    return {
      ...data,
      sender: sender || undefined,
      status: "sent",
    };
  },

  /**
   * Mark incoming messages as delivered to current user
   */
  async markMessagesDelivered(conversationId: string, userId: string) {
    const { data: messages } = await supabase
      .from("messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId);

    if (!messages || messages.length === 0) return;

    const receipts = messages.map((msg) => ({
      message_id: msg.id,
      user_id: userId,
      status: "delivered",
      updated_at: new Date().toISOString(),
    }));

    await supabase
      .from("message_receipts")
      .upsert(receipts, { onConflict: "message_id,user_id" });
  },

  /**
   * Mark incoming messages as read by current user
   */
  async markMessagesRead(conversationId: string, userId: string) {
    const now = new Date().toISOString();

    await supabase
      .from("conversation_participants")
      .update({ last_read_at: now })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    const { data: messages } = await supabase
      .from("messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId);

    if (!messages || messages.length === 0) return;

    const receipts = messages.map((msg) => ({
      message_id: msg.id,
      user_id: userId,
      status: "read",
      updated_at: now,
    }));

    await supabase
      .from("message_receipts")
      .upsert(receipts, { onConflict: "message_id,user_id" });
  },

  /**
   * Real-time subscription to incoming messages & receipts (Socket.io + Supabase Realtime Hybrid)
   */
  subscribeToMessages(
    conversationId: string,
    onMessage: (msg: Message) => void,
    onReceipt: (receipt: any) => void,
  ) {
    // 1. Socket.io listeners
    const unsubSocketMsg = socketService.onNewMessage((payload) => {
      if (!payload) return;
      const targetConvId = payload.conversation_id || payload.conversationId;
      if (!targetConvId || targetConvId === conversationId) {
        onMessage({
          ...payload,
          status: "sent",
        } as Message);
      }
    });

    const unsubSocketSeen = socketService.onMessagesMarkedAsSeen((payload) => {
      if (!payload) return;
      const targetConvId = payload.conversation_id || payload.conversationId;
      if (!targetConvId || targetConvId === conversationId) {
        onReceipt(payload);
      }
    });

    // 2. Join Socket room for this conversation
    socketService.joinConversation(conversationId);

    // 3. Supabase Realtime Fallback Listener
    const channelTopic = `chat_room_${conversationId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const channel = supabase.channel(channelTopic);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          if (!payload?.new) return;
          let sender = undefined;
          if (payload.new.sender_id) {
            const { data } = await supabase
              .from("users")
              .select("*")
              .eq("id", payload.new.sender_id)
              .maybeSingle();
            sender = data || undefined;
          }

          onMessage({
            ...payload.new,
            status: "sent",
            sender,
          } as Message);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_receipts",
        },
        (payload) => {
          if (payload?.new) {
            onReceipt(payload.new);
          }
        },
      )
      .subscribe((status, err) => {
        if (err || status !== "SUBSCRIBED") {
          console.log("Supabase Realtime fallback status:", status, err || "");
        }
      });

    return () => {
      unsubSocketMsg();
      unsubSocketSeen();
      socketService.leaveConversation(conversationId);
      supabase.removeChannel(channel);
    };
  },
};
