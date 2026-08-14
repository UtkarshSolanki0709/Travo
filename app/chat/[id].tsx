import { chatService, type Message, type QuotedMessage } from "@/services/chatService";
import { socketService } from "@/services/socketService";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { COLORS } from "@/lib/theme";
import { useUser } from "@clerk/clerk-expo";
import {
  ArrowLeft,
  MoreVertical,
  Send,
  Check,
  CheckCheck,
  Clock,
  PlusCircle,
  X,
  Reply,
  Copy,
  Edit3,
  Trash2,
  Ban,
  Image as ImageIcon,
  Film,
} from "lucide-react-native";
import { format } from "date-fns";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageBackground,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user: clerkUser } = useUser();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Message Action Sheet & State
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);

  // Typing Status
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

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

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription to incoming messages, edits, deletes, receipts & typing
  useEffect(() => {
    if (!conversationId || !clerkUser?.id) return;

    const unsubscribe = chatService.subscribeToMessages(
      conversationId,
      (newMsg) => {
        setMessages((prev) => {
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
      (editedMsg) => {
        if (!editedMsg) return;
        setMessages((prev) =>
          prev.map((m) => (m.id === editedMsg.id ? { ...m, ...editedMsg } : m)),
        );
      },
      (deleteData) => {
        if (!deleteData) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === deleteData.messageId
              ? { ...m, is_deleted: true, text: "This message was deleted", media_url: undefined }
              : m,
          ),
        );
      },
      (typingData) => {
        if (typingData.userId !== clerkUser.id) {
          setIsOtherUserTyping(typingData.isTyping);
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId, clerkUser?.id]);

  // Typing status handling
  const handleInputChange = (text: string) => {
    setInputText(text);

    if (!conversationId || !clerkUser?.id) return;

    socketService.emitTyping({
      conversationId,
      userId: clerkUser.id,
      isTyping: text.trim().length > 0,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.emitTyping({
        conversationId,
        userId: clerkUser.id,
        isTyping: false,
      });
    }, 2000);
  };

  // Handle Send Message or Save Edit
  const handleSend = async () => {
    if (!inputText.trim() || !conversationId || !clerkUser?.id || sending) return;

    const textToSend = inputText.trim();

    // Mode A: Edit existing message
    if (editingMessage) {
      const msgToEdit = editingMessage;
      setEditingMessage(null);
      setInputText("");
      try {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgToEdit.id
              ? { ...m, text: textToSend, is_edited: true, edited_at: new Date().toISOString() }
              : m,
          ),
        );
        await chatService.editMessage(msgToEdit.id, clerkUser.id, textToSend);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error: any) {
        Alert.alert("Edit Error", error?.message || "Failed to edit message.");
        fetchMessages();
      }
      return;
    }

    // Mode B: Send new message (with optional quoted reply)
    const tempId = `temp-${Date.now()}`;
    const quotedReply: QuotedMessage | undefined = replyingToMessage
      ? {
          id: replyingToMessage.id,
          text: replyingToMessage.text,
          sender_name:
            replyingToMessage.sender?.display_name ||
            replyingToMessage.sender?.username ||
            "User",
          media_type: replyingToMessage.media_type,
        }
      : undefined;

    const replyToId = replyingToMessage?.id;
    setReplyingToMessage(null);
    setInputText("");
    setSending(true);

    const tempMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: clerkUser.id,
      text: textToSend,
      reply_to_message_id: replyToId,
      reply_to_message: quotedReply,
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
        replyToId,
        quotedReply,
      );

      if (!sentMsg.sender && clerkUser) {
        sentMsg.sender = {
          id: clerkUser.id,
          username: clerkUser.username || clerkUser.firstName || "user",
          display_name: clerkUser.fullName || undefined,
          avatar_url: clerkUser.imageUrl || undefined,
        };
      }

      socketService.emitSendMessage(sentMsg);

      setMessages((prev) =>
        prev.map((m) => (m.client_temp_id === tempId ? sentMsg : m)),
      );
    } catch (error: any) {
      console.error("handleSend error:", error);
      setMessages((prev) => prev.filter((m) => m.client_temp_id !== tempId));
      Alert.alert(
        "Send Error",
        error?.message || "Failed to send message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  // Attach Image or Video
  const handlePickMedia = async () => {
    if (!conversationId || !clerkUser?.id || uploadingMedia) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const type = asset.type === "video" ? "video" : "image";
      setUploadingMedia(true);

      const cloudinaryUrl = await uploadToCloudinary(asset.uri, type);

      const sentMsg = await chatService.sendMessage(
        conversationId,
        clerkUser.id,
        inputText.trim(),
        cloudinaryUrl,
        type,
      );

      if (!sentMsg.sender && clerkUser) {
        sentMsg.sender = {
          id: clerkUser.id,
          username: clerkUser.username || clerkUser.firstName || "user",
          display_name: clerkUser.fullName || undefined,
          avatar_url: clerkUser.imageUrl || undefined,
        };
      }

      socketService.emitSendMessage(sentMsg);
      setInputText("");
      setMessages((prev) => [...prev, sentMsg]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error("handlePickMedia error:", error);
      Alert.alert("Upload Error", "Failed to upload and send attachment.");
    } finally {
      setUploadingMedia(false);
    }
  };

  // Long-press message handler
  const handleLongPressMessage = (message: Message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMessage(message);
    setIsActionMenuVisible(true);
  };

  // Actions Sheet Commands
  const handleCopyText = async () => {
    if (selectedMessage?.text) {
      await Clipboard.setStringAsync(selectedMessage.text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsActionMenuVisible(false);
    setSelectedMessage(null);
  };

  const handleStartReply = () => {
    if (selectedMessage) {
      setReplyingToMessage(selectedMessage);
      setEditingMessage(null);
    }
    setIsActionMenuVisible(false);
    setSelectedMessage(null);
  };

  const handleStartEdit = () => {
    if (selectedMessage) {
      setEditingMessage(selectedMessage);
      setInputText(selectedMessage.text || "");
      setReplyingToMessage(null);
    }
    setIsActionMenuVisible(false);
    setSelectedMessage(null);
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMessage || !clerkUser?.id || !conversationId) return;
    const msgId = selectedMessage.id;
    setIsActionMenuVisible(false);
    setSelectedMessage(null);

    try {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, is_deleted: true, text: "This message was deleted", media_url: undefined }
            : m,
        ),
      );
      await chatService.deleteMessageForEveryone(msgId, clerkUser.id, conversationId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert("Delete Error", "Failed to delete message for everyone.");
      fetchMessages();
    }
  };

  const handleDeleteForMe = async () => {
    if (!selectedMessage || !clerkUser?.id) return;
    const msgId = selectedMessage.id;
    setIsActionMenuVisible(false);
    setSelectedMessage(null);

    try {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      await chatService.deleteMessageForMe(msgId, clerkUser.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert("Delete Error", "Failed to delete message for me.");
      fetchMessages();
    }
  };

  const renderStatusTicks = (status?: Message["status"]) => {
    switch (status) {
      case "sending":
        return <Clock size={12} color={COLORS.primaryLight} />;
      case "sent":
        return <Check size={12} color="white" />;
      case "delivered":
        return <CheckCheck size={12} color="white" />;
      case "read":
        return <CheckCheck size={12} color={COLORS.accent} />;
      default:
        return <Check size={12} color="white" />;
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === clerkUser?.id;

    return (
      <Pressable
        onLongPress={() => handleLongPressMessage(item)}
        className={`flex-row my-1.5 px-4 ${
          isMe ? "justify-end" : "justify-start"
        }`}
      >
        {!isMe && (
          <Avatar isSelf={false} className="size-8 mr-2 self-end mb-1">
            {item.sender?.avatar_url ? (
              <AvatarImage source={{ uri: item.sender.avatar_url }} />
            ) : (
              <AvatarFallback>
                <Text className="text-xs font-bold font-body text-foreground">
                  {(item.sender?.username || "U").charAt(0).toUpperCase()}
                </Text>
              </AvatarFallback>
            )}
          </Avatar>
        )}

        <View
          className={`max-w-[78%] px-4 py-2.5 rounded-radius-lg ${
            isMe
              ? "bg-primary rounded-br-none shadow-elevation-1"
              : "bg-surface border border-border rounded-bl-none shadow-elevation-1"
          }`}
        >
          {!isMe && item.sender && (
            <Text className="text-body-sm font-bold text-primary mb-0.5 font-body">
              {item.sender.display_name || item.sender.username}
            </Text>
          )}

          {/* Quoted Reply Box */}
          {item.reply_to_message && (
            <View
              className={`p-2 rounded-radius-md mb-2 border-l-4 ${
                isMe
                  ? "bg-black/15 border-l-white"
                  : "bg-surface-elevated border-l-primary"
              }`}
            >
              <Text
                className={`text-body-sm font-bold font-body ${
                  isMe ? "text-white" : "text-primary"
                }`}
                numberOfLines={1}
              >
                {item.reply_to_message.sender_name || "User"}
              </Text>
              <Text
                className={`text-body-sm font-body ${
                  isMe ? "text-white/80" : "text-muted-foreground"
                }`}
                numberOfLines={1}
              >
                {item.reply_to_message.media_type
                  ? `[${item.reply_to_message.media_type.toUpperCase()}] ${item.reply_to_message.text || ""}`
                  : item.reply_to_message.text}
              </Text>
            </View>
          )}

          {/* Media Attachment */}
          {item.media_url && !item.is_deleted && (
            <View className="mb-2 rounded-radius-md overflow-hidden bg-black/10">
              {item.media_type === "video" ? (
                <View className="w-56 h-40 bg-black justify-center items-center">
                  <Film size={32} color="#fff" />
                </View>
              ) : (
                <Image
                  source={{ uri: item.media_url }}
                  className="w-56 h-40 rounded-radius-md"
                  resizeMode="cover"
                />
              )}
            </View>
          )}

          {/* Message Text */}
          {item.is_deleted ? (
            <View className="flex-row items-center gap-1.5 py-0.5">
              <Ban size={14} color={isMe ? "rgba(255,255,255,0.7)" : COLORS.textSecondary} />
              <Text
                className={`text-body-md italic font-body ${
                  isMe ? "text-white/80" : "text-muted-foreground"
                }`}
              >
                This message was deleted
              </Text>
            </View>
          ) : (
            <Text
              className={`text-body-lg font-body ${
                isMe ? "text-white" : "text-foreground"
              }`}
            >
              {item.text}
            </Text>
          )}

          {/* Footer timestamp & status */}
          <View className="flex-row items-center justify-end mt-1 gap-1">
            {item.is_edited && !item.is_deleted && (
              <Text
                className={`text-[10px] font-body mr-1 ${
                  isMe ? "text-white/70" : "text-muted-foreground"
                }`}
              >
                (edited)
              </Text>
            )}
            <Text
              className={`text-[10px] font-body ${
                isMe ? "text-white/80" : "text-muted-foreground"
              }`}
            >
              {format(new Date(item.created_at), "h:mm a")}
            </Text>

            {isMe && renderStatusTicks(item.status)}
          </View>
        </View>
      </Pressable>
    );
  };

  const insets = useSafeAreaInsets();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  const keyboardSpacerStyle = useAnimatedStyle(() => ({
    height: Math.abs(keyboardHeight.value),
  }));

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/chats");
    }
  };

  return (
    <View style={{ flex: 1 }} className="flex-1 bg-background">
      <ImageBackground
        source={require("@/assets/textures/paper-texture.png")}
        imageStyle={{ opacity: 0.05 }}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-surface border-b border-border pt-12 pb-3 px-4 flex-row items-center justify-between shadow-elevation-1">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleBack} className="mr-3 p-1">
              <ArrowLeft size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <View>
              <Text className="text-heading-lg font-display text-foreground">Chat</Text>
              {isOtherUserTyping && (
                <Text className="text-body-sm text-primary font-semibold font-body">
                  typing...
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity className="p-1">
            <MoreVertical size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Message List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
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
                <Text className="text-muted-foreground font-body text-body-md">
                  Say hello to start the conversation!
                </Text>
              </View>
            }
          />
        )}

        {/* Quoted Reply Banner */}
        {replyingToMessage && (
          <View className="bg-surface px-4 py-2 border-t border-border flex-row items-center justify-between border-l-4 border-l-primary">
            <View className="flex-1 mr-2">
              <View className="flex-row items-center gap-1.5">
                <Reply size={14} color={COLORS.primary} />
                <Text className="text-body-sm font-bold text-primary font-body">
                  Replying to {replyingToMessage.sender?.display_name || replyingToMessage.sender?.username || "User"}
                </Text>
              </View>
              <Text className="text-body-sm text-muted-foreground font-body" numberOfLines={1}>
                {replyingToMessage.text}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingToMessage(null)}>
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Editing Message Banner */}
        {editingMessage && (
          <View className="bg-primary/10 px-4 py-2 border-t border-border flex-row items-center justify-between border-l-4 border-l-primary">
            <View className="flex-1 mr-2">
              <View className="flex-row items-center gap-1.5">
                <Edit3 size={14} color={COLORS.primary} />
                <Text className="text-body-sm font-bold text-primary font-body">
                  Editing Message
                </Text>
              </View>
              <Text className="text-body-sm text-muted-foreground font-body" numberOfLines={1}>
                {editingMessage.text}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setEditingMessage(null);
                setInputText("");
              }}
            >
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input Bar */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          className="bg-surface p-3 border-t border-border flex-row items-center shadow-elevation-2"
        >
          <TouchableOpacity
            onPress={handlePickMedia}
            disabled={uploadingMedia}
            className="p-2 mr-1"
          >
            {uploadingMedia ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <PlusCircle size={22} color={COLORS.primary} />
            )}
          </TouchableOpacity>

          <TextInput
            value={inputText}
            onChangeText={handleInputChange}
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            placeholderTextColor={COLORS.textSecondary}
            className="flex-1 bg-surface-elevated px-4 py-2.5 rounded-radius-full text-foreground text-body-md font-body max-h-24 mr-2 border border-border"
            multiline
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || sending || uploadingMedia}
            className={`p-2.5 rounded-full ${
              inputText.trim() ? "bg-primary" : "bg-muted"
            }`}
          >
            <Send
              size={18}
              color={inputText.trim() ? "#ffffff" : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Animated Keyboard Spacer for Android & iOS */}
        <Animated.View style={keyboardSpacerStyle} />

        {/* Message Action Sheet Modal */}
        <Modal
          visible={isActionMenuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsActionMenuVisible(false)}
        >
          <Pressable
            className="flex-1 bg-black/40 justify-end"
            onPress={() => setIsActionMenuVisible(false)}
          >
            <Card className="rounded-t-radius-lg p-5 bg-surface border-t border-border">
              <Text className="text-body-sm font-bold text-muted-foreground uppercase mb-4 font-body">
                Message Options
              </Text>

              {/* Reply */}
              <TouchableOpacity
                onPress={handleStartReply}
                className="flex-row items-center py-3.5 border-b border-border gap-3"
              >
                <Reply size={20} color={COLORS.primary} />
                <Text className="text-body-md font-medium text-foreground font-body">
                  Reply
                </Text>
              </TouchableOpacity>

              {/* Copy */}
              {selectedMessage?.text && !selectedMessage.is_deleted && (
                <TouchableOpacity
                  onPress={handleCopyText}
                  className="flex-row items-center py-3.5 border-b border-border gap-3"
                >
                  <Copy size={20} color={COLORS.primary} />
                  <Text className="text-body-md font-medium text-foreground font-body">
                    Copy Text
                  </Text>
                </TouchableOpacity>
              )}

              {/* Edit (Own message only & not deleted) */}
              {selectedMessage?.sender_id === clerkUser?.id &&
                !selectedMessage?.is_deleted && (
                  <TouchableOpacity
                    onPress={handleStartEdit}
                    className="flex-row items-center py-3.5 border-b border-border gap-3"
                  >
                    <Edit3 size={20} color={COLORS.primary} />
                    <Text className="text-body-md font-medium text-foreground font-body">
                      Edit Message
                    </Text>
                  </TouchableOpacity>
                )}

              {/* Delete for Me */}
              <TouchableOpacity
                onPress={handleDeleteForMe}
                className="flex-row items-center py-3.5 border-b border-border gap-3"
              >
                <Trash2 size={20} color={COLORS.destructive} />
                <Text className="text-body-md font-medium text-destructive font-body">
                  Delete for Me
                </Text>
              </TouchableOpacity>

              {/* Delete for Everyone (Own message only) */}
              {selectedMessage?.sender_id === clerkUser?.id &&
                !selectedMessage?.is_deleted && (
                  <TouchableOpacity
                    onPress={handleDeleteForEveryone}
                    className="flex-row items-center py-3.5 gap-3"
                  >
                    <Ban size={20} color={COLORS.destructive} />
                    <Text className="text-body-md font-bold text-destructive font-body">
                      Delete for Everyone
                    </Text>
                  </TouchableOpacity>
                )}

              <Button
                variant="secondary"
                size="default"
                className="mt-4 w-full"
                onPress={() => setIsActionMenuVisible(false)}
              >
                <Text className="text-primary font-semibold text-body-md font-body">
                  Cancel
                </Text>
              </Button>
            </Card>
          </Pressable>
        </Modal>
      </ImageBackground>
    </View>
  );
}
