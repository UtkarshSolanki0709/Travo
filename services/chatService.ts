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

export interface QuotedMessage {
  id: string;
  text?: string;
  sender_name?: string;
  media_type?: string;
}

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
  reply_to_message_id?: string;
  reply_to_message?: QuotedMessage;
  is_edited?: boolean;
  edited_at?: string;
  is_deleted?: boolean;
  deleted_for_user_ids?: string[];
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

    this.syncActivityGroupChats(userId).catch((err) =>
      console.error("syncActivityGroupChats background error:", err),
    );

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

    const convId = Crypto.randomUUID();
    const { error: convError } = await supabase.from("conversations").insert({
      id: convId,
      type: "direct",
      created_at: new Date().toISOString(),
    });

    if (convError) throw convError;

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

    const { data: primaryData, error: primaryError } = await supabase
      .from("messages")
      .select(
        "*, sender:users!messages_sender_id_fkey(*), receipts:message_receipts(*)",
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!primaryError && primaryData) {
      data = primaryData;
    } else {
      console.warn("Primary getMessages select failed, trying fallback...", primaryError);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("messages")
        .select("*, receipts:message_receipts(*)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (fallbackError) {
        console.error("getMessages DB error:", fallbackError);
        throw fallbackError;
      }

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

    const filtered = (data || []).filter((msg: any) => {
      if (
        msg.deleted_for_user_ids &&
        Array.isArray(msg.deleted_for_user_ids) &&
        msg.deleted_for_user_ids.includes(currentUserId)
      ) {
        return false;
      }
      return true;
    });

    // Fetched newest-first (limit 200) — restore chronological order
    filtered.reverse();

    return filtered.map((msg: any) => {
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
    replyToMessageId?: string,
    replyToMessage?: QuotedMessage,
  ): Promise<Message> {
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    const insertPayload: any = {
      id,
      conversation_id: conversationId,
      sender_id: senderId,
      text,
      media_url: mediaUrl,
      media_type: mediaType,
      client_temp_id: clientTempId,
      created_at: now,
    };

    if (replyToMessageId) {
      insertPayload.reply_to_message_id = replyToMessageId;
    }
    if (replyToMessage) {
      insertPayload.reply_to_message = replyToMessage;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      console.error("sendMessage DB error:", error);
      throw error;
    }

    // Update conversation last_message_text & last_message_at
    const previewText = mediaType
      ? `[${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}] ${text || ""}`.trim()
      : text;

    await supabase
      .from("conversations")
      .update({
        last_message_text: previewText,
        last_message_at: now,
      })
      .eq("id", conversationId);

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
   * Edit a sent message
   */
  async editMessage(
    messageId: string,
    userId: string,
    newText: string,
  ): Promise<Message> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("messages")
      .update({
        text: newText,
        is_edited: true,
        edited_at: now,
      })
      .eq("id", messageId)
      .eq("sender_id", userId)
      .select("*")
      .single();

    if (error) {
      console.error("editMessage DB error:", error);
      throw error;
    }

    const { data: sender } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const updatedMessage = {
      ...data,
      sender: sender || undefined,
    };

    // Broadcast edit over socket
    socketService.emitEditMessage(updatedMessage);

    return updatedMessage;
  },

  /**
   * Delete message for everyone (Soft delete)
   */
  async deleteMessageForEveryone(
    messageId: string,
    userId: string,
    conversationId: string,
  ): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .update({
        text: "This message was deleted",
        media_url: null,
        media_type: null,
        is_deleted: true,
      })
      .eq("id", messageId)
      .eq("sender_id", userId)
      .select("*")
      .single();

    if (error) {
      console.error("deleteMessageForEveryone DB error:", error);
      throw error;
    }

    // Update conversation last_message_text if this was the last message
    const { data: latestMsgs } = await supabase
      .from("messages")
      .select("id, text")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (latestMsgs && latestMsgs[0]?.id === messageId) {
      await supabase
        .from("conversations")
        .update({
          last_message_text: "This message was deleted",
        })
        .eq("id", conversationId);
    }

    const deletedMessage = {
      ...data,
    };

    socketService.emitDeleteMessage({
      messageId,
      conversationId,
      deleteForEveryone: true,
      deletedMessage,
    });

    return deletedMessage;
  },

  /**
   * Delete message for current user only
   */
  async deleteMessageForMe(messageId: string, userId: string): Promise<void> {
    const { data: msg } = await supabase
      .from("messages")
      .select("deleted_for_user_ids")
      .eq("id", messageId)
      .single();

    const existingIds = (msg?.deleted_for_user_ids as string[]) || [];
    if (!existingIds.includes(userId)) {
      const updatedIds = [...existingIds, userId];
      await supabase
        .from("messages")
        .update({ deleted_for_user_ids: updatedIds })
        .eq("id", messageId);
    }
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
   * Real-time subscription to incoming messages & receipts & updates
   */
  subscribeToMessages(
    conversationId: string,
    onMessage: (msg: Message) => void,
    onReceipt: (receipt: any) => void,
    onMessageEdited?: (msg: Message) => void,
    onMessageDeleted?: (data: { messageId: string; deleteForEveryone: boolean }) => void,
    onTyping?: (data: { userId: string; isTyping: boolean }) => void,
  ) {
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

    const unsubSocketEdit = socketService.onMessageEdited((payload) => {
      if (!payload) return;
      const targetConvId = payload.conversation_id || payload.conversationId;
      if (!targetConvId || targetConvId === conversationId) {
        onMessageEdited?.(payload);
      }
    });

    const unsubSocketDelete = socketService.onMessageDeleted((payload) => {
      if (!payload) return;
      const targetConvId = payload.conversationId || payload.conversation_id;
      if (!targetConvId || targetConvId === conversationId) {
        onMessageDeleted?.(payload);
      }
    });

    const unsubSocketTyping = socketService.onTypingStatus((payload) => {
      if (!payload) return;
      const targetConvId = payload.conversationId || (payload as any).conversation_id;
      if (!targetConvId || targetConvId === conversationId) {
        onTyping?.(payload);
      }
    });

    socketService.joinConversation(conversationId);

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
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload?.new) {
            if (payload.new.is_deleted) {
              onMessageDeleted?.({
                messageId: payload.new.id,
                deleteForEveryone: true,
              });
            } else if (payload.new.is_edited) {
              onMessageEdited?.(payload.new as Message);
            }
          }
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
      unsubSocketEdit();
      unsubSocketDelete();
      unsubSocketTyping();
      socketService.leaveConversation(conversationId);
      supabase.removeChannel(channel);
    };
  },
};
