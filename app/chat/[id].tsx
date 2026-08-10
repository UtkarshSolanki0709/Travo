import { chatService, type Message } from "@/services/chatService";
import { socketService } from "@/services/socketService";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user: clerkUser } = useUser();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Connect to Socket.io backend
  useEffect(() => {
    if (clerkUser?.id) {
      socketService.connect(clerkUser.id);
    }
  }, [clerkUser?.id]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !clerkUser?.id) return;
    try {
      const msgList = await chatService.getMessages(
        conversationId,
        clerkUser.id,
      );
      setMessages(msgList);

      // Mark delivered & read
      await chatService.markMessagesDelivered(conversationId, clerkUser.id);
      await chatService.markMessagesRead(conversationId, clerkUser.id);
      socketService.emitMarkAsSeen({ conversationId, userId: clerkUser.id });
    } catch (error) {
      console.error("fetchMessages error details:", JSON.stringify(error, null, 2), error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, clerkUser?.id]);

  const fetchMessagesRef = useRef(fetchMessages);
  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
  }, [fetchMessages]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to real-time incoming messages & receipts via Socket.io
  useEffect(() => {
    if (!conversationId || !clerkUser?.id) return;

    const unsubscribe = chatService.subscribeToMessages(
      conversationId,
      (newMsg) => {
        setMessages((prev) => {
          // Check if message already exists by ID or client_temp_id
          const exists = prev.some(
            (m) =>
              m.id === newMsg.id ||
              (m.client_temp_id &&
                m.client_temp_id === newMsg.client_temp_id),
          );
          if (exists) {
            return prev.map((m) =>
              m.id === newMsg.id ||
              (m.client_temp_id && m.client_temp_id === newMsg.client_temp_id)
                ? { ...m, ...newMsg }
                : m,
            );
          }
          return [...prev, newMsg];
        });

        // Mark as read immediately if actively viewing
        chatService.markMessagesRead(conversationId, clerkUser.id);
        socketService.emitMarkAsSeen({ conversationId, userId: clerkUser.id });
      },
      (receipt) => {
        if (!receipt) return;
        const msgId = receipt.message_id || receipt.messageId;
        const status = receipt.status || "read";

        setMessages((prev) =>
          prev.map((m) =>
            msgId && m.id === msgId
              ? { ...m, status }
              : m,
          ),
        );
      },
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId, clerkUser?.id]);

  const handleSend = async () => {
    if (!inputText.trim() || !conversationId || !clerkUser?.id || sending)
      return;

    const textToSend = inputText.trim();
    const tempId = `temp-${Date.now()}`;
    setInputText("");
    setSending(true);

    // Optimistic UI message
    const tempMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: clerkUser.id,
      text: textToSend,
      client_temp_id: tempId,
      created_at: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const sentMsg = await chatService.sendMessage(
        conversationId,
        clerkUser.id,
        textToSend,
        undefined,
        undefined,
        tempId,
      );

      if (!sentMsg.sender && clerkUser) {
        sentMsg.sender = {
          id: clerkUser.id,
          username: clerkUser.username || clerkUser.firstName || "user",
          display_name: clerkUser.fullName || undefined,
          avatar_url: clerkUser.imageUrl || undefined,
        };
      }

      // Broadcast sent message over Socket.io
      socketService.emitSendMessage(sentMsg);

      // Replace temp message with server response
      setMessages((prev) =>
        prev.map((m) => (m.client_temp_id === tempId ? sentMsg : m)),
      );
    } catch (error: any) {
      console.error("handleSend error:", error);
      // Remove failed temp message from list and alert user
      setMessages((prev) => prev.filter((m) => m.client_temp_id !== tempId));
      Alert.alert(
        "Send Error",
        error?.message || "Failed to send message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const renderStatusTicks = (status?: Message["status"]) => {
    switch (status) {
      case "sending":
        return <Ionicons name="time-outline" size={14} color="#94a3b8" />;
      case "sent":
        return <Ionicons name="checkmark" size={14} color="#94a3b8" />;
      case "delivered":
        return <Ionicons name="checkmark-done" size={14} color="#94a3b8" />;
      case "read":
        return <Ionicons name="checkmark-done" size={14} color="#3b82f6" />;
      default:
        return <Ionicons name="checkmark" size={14} color="#94a3b8" />;
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === clerkUser?.id;

    return (
      <View
        className={`flex-row my-1 px-4 ${
          isMe ? "justify-end" : "justify-start"
        }`}
      >
        {!isMe && item.sender && (
          <Image
            source={{
              uri: item.sender.avatar_url || "https://via.placeholder.com/150",
            }}
            className="w-8 h-8 rounded-full bg-slate-200 mr-2 self-end mb-1"
          />
        )}

        <View
          className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
            isMe
              ? "bg-indigo-600 rounded-br-none"
              : "bg-white border border-slate-100 rounded-bl-none shadow-sm"
          }`}
        >
          {!isMe && item.sender && (
            <Text className="text-xs font-bold text-indigo-600 mb-1">
              {item.sender.display_name || item.sender.username}
            </Text>
          )}

          <Text
            className={`text-base ${isMe ? "text-white" : "text-slate-900"}`}
          >
            {item.text}
          </Text>

          <View className="flex-row items-center justify-end mt-1 gap-1">
            <Text
              className={`text-[10px] ${
                isMe ? "text-indigo-200" : "text-slate-400"
              }`}
            >
              {format(new Date(item.created_at), "h:mm a")}
            </Text>

            {isMe && renderStatusTicks(item.status)}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-50"
    >
      {/* Header */}
      <View className="bg-white border-b border-slate-200 pt-12 pb-3 px-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>

          <Text className="text-lg font-bold text-slate-900">Chat</Text>
        </View>

        <TouchableOpacity className="p-1">
          <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Message List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-slate-400 text-sm">
                Say hello to start the conversation!
              </Text>
            </View>
          }
        />
      )}

      {/* Input Bar */}
      <View className="bg-white p-3 border-t border-slate-200 flex-row items-center">
        <TouchableOpacity className="p-2 mr-1">
          <Ionicons name="add-circle-outline" size={24} color="#6366f1" />
        </TouchableOpacity>

        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          className="flex-1 bg-slate-100 px-4 py-2.5 rounded-full text-slate-900 text-base max-h-24 mr-2"
          multiline
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          className={`p-2.5 rounded-full ${
            inputText.trim() ? "bg-indigo-600" : "bg-slate-200"
          }`}
        >
          <Ionicons
            name="send"
            size={18}
            color={inputText.trim() ? "#ffffff" : "#94a3b8"}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
