import { chatService, type Conversation } from "@/services/chatService";
import { database, type User } from "@/services/database";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
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
        className="flex-row items-center p-4 bg-white mb-2 rounded-2xl border border-slate-100 shadow-sm"
      >
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            className="w-12 h-12 rounded-full bg-slate-100"
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center">
            <Ionicons
              name={isGroup ? "people" : "person"}
              size={22}
              color="#6366f1"
            />
          </View>
        )}

        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
              {title}
            </Text>
            {item.last_message_at && (
              <Text className="text-xs text-slate-400">
                {format(new Date(item.last_message_at), "h:mm a")}
              </Text>
            )}
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-slate-500 text-sm flex-1 mr-2" numberOfLines={1}>
              {item.last_message_text || "No messages yet"}
            </Text>

            {!!item.unread_count && item.unread_count > 0 && (
              <View className="bg-indigo-600 px-2 py-0.5 rounded-full">
                <Text className="text-white text-xs font-bold">
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
    <View className="flex-row items-center justify-between p-4 bg-white mb-2 rounded-2xl border border-slate-100">
      <View className="flex-row items-center">
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            className="w-12 h-12 rounded-full bg-slate-100"
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-slate-200 items-center justify-center">
            <Text className="text-slate-600 font-bold text-lg">
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View className="ml-3">
          <Text className="text-base font-bold text-slate-900">
            {item.display_name || item.username}
          </Text>
          <Text className="text-xs text-slate-400">@{item.username}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleStartDirectChat(item.id)}
        className="bg-indigo-50 px-4 py-2 rounded-xl flex-row items-center border border-indigo-100"
      >
        <Ionicons name="chatbubble-ellipses-outline" size={16} color="#4f46e5" />
        <Text className="text-indigo-600 font-bold text-xs ml-1.5">
          Message
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white border-b border-slate-200 pt-12 pb-4 px-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-slate-900">Chats</Text>

          <TouchableOpacity
            onPress={() => setIsAddFriendModalVisible(true)}
            className="bg-indigo-50 p-2.5 rounded-full border border-indigo-100"
          >
            <Ionicons name="person-add-outline" size={20} color="#4f46e5" />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View className="flex-row gap-2 bg-slate-100 p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => setActiveTab("chats")}
            className={`flex-1 py-2 rounded-lg ${
              activeTab === "chats" ? "bg-white shadow-sm" : ""
            }`}
          >
            <Text
              className={`text-center font-semibold text-sm ${
                activeTab === "chats" ? "text-indigo-600" : "text-slate-600"
              }`}
            >
              Messages
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("friends")}
            className={`flex-1 py-2 rounded-lg ${
              activeTab === "friends" ? "bg-white shadow-sm" : ""
            }`}
          >
            <View className="flex-row items-center justify-center">
              <Text
                className={`font-semibold text-sm ${
                  activeTab === "friends" ? "text-indigo-600" : "text-slate-600"
                }`}
              >
                Friends
              </Text>
              {pendingRequests.length > 0 && (
                <View className="bg-red-500 w-2 h-2 rounded-full ml-1.5" />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : activeTab === "chats" ? (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="chatbubbles-outline" size={64} color="#cbd5e1" />
              <Text className="text-slate-500 mt-4 text-base text-center">
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View>
              {/* Pending Friend Requests Section */}
              {pendingRequests.length > 0 && (
                <View className="mb-6">
                  <Text className="text-xs font-bold text-slate-400 uppercase mb-3">
                    Friend Requests ({pendingRequests.length})
                  </Text>
                  {pendingRequests.map((req) => (
                    <View
                      key={req.id}
                      className="flex-row items-center justify-between p-4 bg-white mb-2 rounded-2xl border border-indigo-100 bg-indigo-50/50"
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        <Image
                          source={{
                            uri:
                              req.requester?.avatar_url ||
                              "https://via.placeholder.com/150",
                          }}
                          className="w-10 h-10 rounded-full bg-slate-200"
                        />
                        <View className="ml-3 flex-1">
                          <Text
                            className="text-sm font-bold text-slate-900"
                            numberOfLines={1}
                          >
                            {req.requester?.display_name ||
                              req.requester?.username}
                          </Text>
                          <Text className="text-xs text-slate-500">
                            @{req.requester?.username}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => handleDeclineRequest(req.id)}
                          className="p-2 bg-red-100 rounded-full"
                        >
                          <Ionicons name="close" size={18} color="#ef4444" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            handleAcceptRequest(
                              req.id,
                              req.requester_id,
                            )
                          }
                          className="p-2 bg-green-100 rounded-full"
                        >
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color="#10b981"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Active Friends List Header */}
              <Text className="text-xs font-bold text-slate-400 uppercase mb-3">
                My Friends ({friends.length})
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Ionicons name="people-outline" size={56} color="#cbd5e1" />
              <Text className="text-slate-500 mt-3 text-base text-center">
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
          <View className="bg-white rounded-t-3xl h-[80%] p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-slate-900">
                Find Friends
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsAddFriendModalVisible(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="flex-row items-center bg-slate-100 px-4 py-3 rounded-2xl mb-4">
              <Ionicons name="search" size={20} color="#94a3b8" />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearchUsers}
                placeholder="Search by username or display name..."
                placeholderTextColor="#94a3b8"
                className="flex-1 ml-3 text-slate-900 text-base"
                autoCapitalize="none"
              />
            </View>

            {/* Search Results List */}
            {searchLoading ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View className="flex-row items-center justify-between py-3 border-b border-slate-100">
                    <View className="flex-row items-center flex-1 mr-2">
                      <Image
                        source={{
                          uri:
                            item.avatar_url ||
                            "https://via.placeholder.com/150",
                        }}
                        className="w-10 h-10 rounded-full bg-slate-200"
                      />
                      <View className="ml-3 flex-1">
                        <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                          {item.display_name || item.username}
                        </Text>
                        <Text className="text-xs text-slate-500">
                          @{item.username}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleSendFriendRequest(item.id)}
                      className="bg-indigo-600 px-4 py-2 rounded-xl"
                    >
                      <Text className="text-white font-bold text-xs">
                        Add Friend
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  searchQuery.trim() ? (
                    <Text className="text-center text-slate-400 py-8">
                      No users found
                    </Text>
                  ) : null
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
