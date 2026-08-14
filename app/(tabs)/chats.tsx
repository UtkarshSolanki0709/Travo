import { chatService, type Conversation } from "@/services/chatService";
import { database, type User } from "@/services/database";
import { COLORS } from "@/lib/theme";
import { useUser } from "@clerk/clerk-expo";
import {
  UserPlus,
  Users,
  User as UserIcon,
  MessageCircle,
  X,
  Check,
  MessageSquare,
  UserCheck,
  UserMinus,
  Clock,
} from "lucide-react-native";
import { format } from "date-fns";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
} from "react-native";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TabType = "chats" | "friends";

export default function ChatsScreen() {
  const { user: clerkUser } = useUser();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("chats");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Add Friend Modal
  const [isAddFriendModalVisible, setIsAddFriendModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch conversations & friends
  const fetchData = useCallback(async () => {
    if (!clerkUser?.id) return;
    try {
      const [convs, friendList, pendingList] = await Promise.all([
        chatService.getConversations(clerkUser.id),
        database.getFriends(clerkUser.id),
        database.getPendingFriendRequests(clerkUser.id),
      ]);

      setConversations(convs);
      setFriends(friendList);
      setPendingRequests(pendingList);
    } catch (error) {
      console.error("fetchData error in ChatsScreen:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clerkUser?.id]);

  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  useFocusEffect(
    useCallback(() => {
      fetchDataRef.current();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleOpenConversation = (conversationId: string) => {
    router.push({
      pathname: "/chat/[id]",
      params: { id: conversationId },
    });
  };

  const handleStartDirectChat = async (targetUserId: string) => {
    if (!clerkUser?.id) return;
    try {
      const convId = await chatService.getOrCreateDirectConversation(
        clerkUser.id,
        targetUserId,
      );
      router.push({
        pathname: "/chat/[id]",
        params: { id: convId },
      });
    } catch (error) {
      console.error("handleStartDirectChat error:", error);
      Alert.alert("Error", "Failed to open conversation");
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || !clerkUser?.id) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await database.searchUsers(query, clerkUser.id);
      setSearchResults(results);
    } catch (error) {
      console.error("handleSearchUsers error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!clerkUser?.id) return;
    try {
      await database.sendFriendRequest(clerkUser.id, targetUserId);
      Alert.alert("Request Sent", "Friend request sent successfully!");
      setIsAddFriendModalVisible(false);
      setSearchQuery("");
      setSearchResults([]);
      await fetchData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send request");
    }
  };

  const handleAcceptRequest = async (
    friendshipId: string,
    requesterId: string,
  ) => {
    if (!clerkUser?.id) return;
    try {
      await database.acceptFriendRequest(
        friendshipId,
        requesterId,
        clerkUser.id,
      );
      Alert.alert("Success", "Friend request accepted!");
      await fetchData();
    } catch (error) {
      console.error("handleAcceptRequest error:", error);
      Alert.alert("Error", "Failed to accept request");
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    try {
      await database.declineFriendRequest(friendshipId);
      await fetchData();
    } catch (error) {
      console.error("handleDeclineRequest error:", error);
    }
  };

  const handleRemoveFriend = (friend: User) => {
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${friend.display_name || friend.username} from your friends list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (!clerkUser?.id) return;
            try {
              await database.removeFriend(clerkUser.id, friend.id);
              await fetchData();
              Alert.alert("Success", "Friend removed");
            } catch (error) {
              console.error("handleRemoveFriend error:", error);
              Alert.alert("Error", "Failed to remove friend");
            }
          },
        },
      ],
    );
  };

  const getSearchUserStatus = (targetId: string) => {
    if (friends.some((f) => f.id === targetId)) {
      return "friends";
    }
    const pendingReq = pendingRequests.find(
      (r) => r.requester_id === targetId || r.addressee_id === targetId,
    );
    if (pendingReq) {
      if (pendingReq.requester_id === clerkUser?.id) {
        return "pending_sent";
      } else {
        return { type: "pending_received", request: pendingReq };
      }
    }
    return "none";
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const isGroup = item.type === "group";
    const title = isGroup
      ? item.title || "Activity Group Chat"
      : item.other_user?.display_name || item.other_user?.username || "Chat";
    const avatar = isGroup
      ? item.avatar_url
      : item.other_user?.avatar_url;

    return (
      <TouchableOpacity
        onPress={() => handleOpenConversation(item.id)}
        className="flex-row items-center p-4 bg-surface mb-2.5 rounded-radius-lg border border-border shadow-elevation-1"
      >
        <Avatar isSelf={false}>
          {avatar ? (
            <AvatarImage source={{ uri: avatar }} />
          ) : (
            <AvatarFallback>
              {isGroup ? (
                <Users size={20} color={COLORS.primary} />
              ) : (
                <UserIcon size={20} color={COLORS.primary} />
              )}
            </AvatarFallback>
          )}
        </Avatar>

        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-heading-md font-heading text-foreground flex-1 mr-2" numberOfLines={1}>
              {title}
            </Text>
            {item.last_message_at && (
              <Text className="text-body-sm text-muted-foreground font-body">
                {format(new Date(item.last_message_at), "h:mm a")}
              </Text>
            )}
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-muted-foreground text-body-sm font-body flex-1 mr-2" numberOfLines={1}>
              {item.last_message_text || "No messages yet"}
            </Text>

            {!!item.unread_count && item.unread_count > 0 && (
              <View className="bg-primary px-2 py-0.5 rounded-full">
                <Text className="text-white text-xs font-bold font-body">
                  {item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFriendItem = ({ item }: { item: User }) => (
    <View className="flex-row items-center justify-between p-4 bg-surface mb-2.5 rounded-radius-lg border border-border shadow-elevation-1">
      <View className="flex-row items-center flex-1 mr-2">
        <Avatar isSelf={false}>
          {item.avatar_url ? (
            <AvatarImage source={{ uri: item.avatar_url }} />
          ) : (
            <AvatarFallback>
              <Text className="text-foreground font-bold font-body text-body-md">
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </AvatarFallback>
          )}
        </Avatar>
        <View className="ml-3 flex-1">
          <Text className="text-heading-md font-heading text-foreground" numberOfLines={1}>
            {item.display_name || item.username}
          </Text>
          <Text className="text-body-sm text-muted-foreground font-body">@{item.username}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={() => handleStartDirectChat(item.id)}
          className="bg-primary/10 px-3.5 py-2 rounded-radius-md flex-row items-center border border-primary/20"
        >
          <MessageSquare size={16} color={COLORS.primary} />
          <Text className="text-primary font-semibold text-body-sm font-body ml-1.5">
            Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleRemoveFriend(item)}
          className="p-2 bg-destructive/10 rounded-radius-md border border-destructive/20"
        >
          <UserMinus size={16} color={COLORS.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <ImageBackground
        source={require("@/assets/textures/paper-texture.png")}
        imageStyle={{ opacity: 0.05 }}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-surface border-b border-border pt-12 pb-4 px-4 shadow-elevation-1">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-heading-xl font-display text-foreground">Chats</Text>

            <TouchableOpacity
              onPress={() => setIsAddFriendModalVisible(true)}
              className="bg-primary/10 p-2.5 rounded-full border border-primary/20"
            >
              <UserPlus size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View className="flex-row gap-2 bg-surface-elevated p-1 rounded-radius-md border border-border">
            <TouchableOpacity
              onPress={() => setActiveTab("chats")}
              className={`flex-1 py-2 rounded-radius-md ${
                activeTab === "chats" ? "bg-primary shadow-sm" : ""
              }`}
            >
              <Text
                className={`text-center font-semibold text-body-sm font-body ${
                  activeTab === "chats" ? "text-white" : "text-muted-foreground"
                }`}
              >
                Messages
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("friends")}
              className={`flex-1 py-2 rounded-radius-md ${
                activeTab === "friends" ? "bg-primary shadow-sm" : ""
              }`}
            >
              <View className="flex-row items-center justify-center">
                <Text
                  className={`font-semibold text-body-sm font-body ${
                    activeTab === "friends" ? "text-white" : "text-muted-foreground"
                  }`}
                >
                  Friends
                </Text>
                {pendingRequests.length > 0 && (
                  <View className="bg-secondary w-2 h-2 rounded-full ml-1.5" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : activeTab === "chats" ? (
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <MessageCircle size={56} color={COLORS.textSecondary} opacity={0.5} />
                <Text className="text-muted-foreground mt-4 text-body-md font-body text-center">
                  No active conversations. Join an activity or message a friend to get started!
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            ListHeaderComponent={
              <View>
                {/* Pending Friend Requests Section */}
                {pendingRequests.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-body-sm font-bold text-muted-foreground uppercase mb-3 font-body">
                      Friend Requests ({pendingRequests.length})
                    </Text>
                    {pendingRequests.map((req) => (
                      <View
                        key={req.id}
                        className="flex-row items-center justify-between p-4 bg-primary/5 mb-2 rounded-radius-lg border border-primary/20"
                      >
                        <View className="flex-row items-center flex-1 mr-2">
                          <Avatar isSelf={false}>
                            {req.requester?.avatar_url ? (
                              <AvatarImage source={{ uri: req.requester.avatar_url }} />
                            ) : (
                              <AvatarFallback>
                                <UserIcon size={20} color={COLORS.primary} />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <View className="ml-3 flex-1">
                            <Text
                              className="text-body-md font-bold text-foreground font-body"
                              numberOfLines={1}
                            >
                              {req.requester?.display_name ||
                                req.requester?.username}
                            </Text>
                            <Text className="text-body-sm text-muted-foreground font-body">
                              @{req.requester?.username}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={() => handleDeclineRequest(req.id)}
                            className="p-2 bg-destructive/10 rounded-full border border-destructive/20"
                          >
                            <X size={18} color={COLORS.destructive} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              handleAcceptRequest(
                                req.id,
                                req.requester_id,
                              )
                            }
                            className="p-2 bg-primary/10 rounded-full border border-primary/20"
                          >
                            <Check
                              size={18}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Active Friends List Header */}
                <Text className="text-body-sm font-bold text-muted-foreground uppercase mb-3 font-body">
                  My Friends ({friends.length})
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-12">
                <Users size={56} color={COLORS.textSecondary} opacity={0.5} />
                <Text className="text-muted-foreground mt-3 text-body-md font-body text-center">
                  You haven&apos;t added any friends yet. Tap the button above to search users!
                </Text>
              </View>
            }
          />
        )}

        {/* Add Friend Modal */}
        <Modal
          visible={isAddFriendModalVisible}
          animationType="slide"
          transparent
        >
          <View className="flex-1 bg-black/50 justify-end">
            <Card className="rounded-t-radius-lg h-[80%] p-6 bg-surface">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-heading-xl font-heading text-foreground">
                  Find Friends
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsAddFriendModalVisible(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  <X size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View className="mb-4">
                <Input
                  value={searchQuery}
                  onChangeText={handleSearchUsers}
                  placeholder="Search by username or display name..."
                  autoCapitalize="none"
                />
              </View>

              {/* Search Results List */}
              {searchLoading ? (
                <View className="py-10 items-center">
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const status = getSearchUserStatus(item.id);

                    return (
                      <View className="flex-row items-center justify-between py-3 border-b border-border">
                        <View className="flex-row items-center flex-1 mr-2">
                          <Avatar isSelf={false}>
                            {item.avatar_url ? (
                              <AvatarImage source={{ uri: item.avatar_url }} />
                            ) : (
                              <AvatarFallback>
                                <UserIcon size={20} color={COLORS.primary} />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <View className="ml-3 flex-1">
                            <Text className="text-body-md font-bold text-foreground font-body" numberOfLines={1}>
                              {item.display_name || item.username}
                            </Text>
                            <Text className="text-body-sm text-muted-foreground font-body">
                              @{item.username}
                            </Text>
                          </View>
                        </View>

                        {status === "friends" ? (
                          <TouchableOpacity
                            onPress={() => {
                              setIsAddFriendModalVisible(false);
                              handleStartDirectChat(item.id);
                            }}
                            className="bg-primary/10 px-3.5 py-2 rounded-radius-md flex-row items-center border border-primary/20"
                          >
                            <MessageSquare size={14} color={COLORS.primary} />
                            <Text className="text-primary font-semibold text-body-sm font-body ml-1.5">
                              Message
                            </Text>
                          </TouchableOpacity>
                        ) : status === "pending_sent" ? (
                          <View className="bg-surface-elevated px-3 py-2 rounded-radius-md flex-row items-center border border-border">
                            <Clock size={14} color={COLORS.textSecondary} />
                            <Text className="text-muted-foreground font-semibold text-body-sm font-body ml-1.5">
                              Requested
                            </Text>
                          </View>
                        ) : typeof status === "object" && status.type === "pending_received" ? (
                          <TouchableOpacity
                            onPress={() => {
                              setIsAddFriendModalVisible(false);
                              handleAcceptRequest(status.request.id, status.request.requester_id);
                            }}
                            className="bg-primary px-3.5 py-2 rounded-radius-md flex-row items-center"
                          >
                            <UserCheck size={14} color="white" />
                            <Text className="text-white font-semibold text-body-sm font-body ml-1.5">
                              Accept
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <Button
                            onPress={() => handleSendFriendRequest(item.id)}
                            variant="default"
                            size="sm"
                          >
                            <Text className="text-white font-semibold text-body-sm font-body">
                              Add Friend
                            </Text>
                          </Button>
                        )}
                      </View>
                    );
                  }}
                  ListEmptyComponent={
                    searchQuery.trim() ? (
                      <Text className="text-center text-muted-foreground font-body py-8">
                        No users found
                      </Text>
                    ) : null
                  }
                />
              )}
            </Card>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}
