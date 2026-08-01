import CreateActivityModal from "@/components/CreateActivityModal";
import { database, type Activity } from "@/services/database";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ActivityDetailsModalProps {
  activity: Activity | null;
  visible: boolean;
  onClose: () => void;
}

export default function ActivityDetailsModal({
  activity,
  visible,
  onClose,
}: ActivityDetailsModalProps) {
  const { user: clerkUser } = useUser();
  const [participants, setParticipants] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userStatus, setUserStatus] = useState<"none" | "pending" | "approved">(
    "none",
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedRequesterId, setSelectedRequesterId] = useState<string | null>(
    null,
  );
  const [displayActivity, setDisplayActivity] = useState<Activity | null>(
    activity,
  );
  const [editModalVisible, setEditModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activity || !clerkUser) return;
    setLoading(true);
    try {
      const isAdminUser = activity.creator_id === clerkUser.id;
      setIsAdmin(isAdminUser);

      const [pData, rData, status, freshActivity] = await Promise.all([
        database.getActivityParticipants(activity.id),
        isAdminUser
          ? database.getJoinRequests(activity.id, clerkUser.id)
          : Promise.resolve([]),
        database.getParticipantStatus(activity.id, clerkUser.id),
        database.getActivityById(activity.id),
      ]);

      setParticipants(pData);
      setRequests(rData);
      setUserStatus(status);
      if (freshActivity) {
        setDisplayActivity(freshActivity);
      }
    } catch (error) {
      console.error("fetchData error:", error);
    } finally {
      setLoading(false);
    }
  }, [activity, clerkUser]);

  // Entrance animation for modal content
  const contentTranslateY = useRef(new Animated.Value(50)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && activity) {
      setDisplayActivity(activity);
      fetchData();
      // Reset and trigger entrance animation
      contentTranslateY.setValue(50);
      contentOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(contentTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 5,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, activity, fetchData, contentTranslateY, contentOpacity]);

  const handleJoinRequest = async () => {
    if (!activity || !clerkUser) return;
    setActionLoading(true);
    try {
      await database.requestToJoinActivity(activity.id, clerkUser.id);
      Alert.alert(
        "Request Sent",
        "Your request to join has been sent to the admin.",
      );
      await fetchData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!activity || !clerkUser) return;
    setActionLoading(true);
    try {
      await database.leaveActivity(activity.id, clerkUser.id);
      Alert.alert("Left Activity", "You have left the activity.");
      await fetchData();
    } catch (error) {
      console.error("handleLeave error:", error);
      Alert.alert("Error", "Failed to leave activity");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = (requesterId: string) => {
    if (!activity || !clerkUser) return;

    Alert.alert(
      "Confirm Approval",
      "Are you sure you want to allow this user to join your activity?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Allow",
          onPress: () => confirmApprove(requesterId),
        },
      ],
    );
  };

  const confirmApprove = async (requesterId: string) => {
    if (!activity || !clerkUser) return;
    try {
      setActionLoading(true);
      await database.approveJoinRequest(activity.id, requesterId, clerkUser.id);
      await fetchData();
    } catch (error) {
      console.error("handleApprove error:", error);
      Alert.alert("Error", "Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = (requesterId: string) => {
    setSelectedRequesterId(requesterId);
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    if (!activity || !clerkUser || !selectedRequesterId) return;

    try {
      setActionLoading(true);
      await database.rejectJoinRequest(
        activity.id,
        selectedRequesterId,
        clerkUser.id,
      );
      // In a real app, we'd save rejectReason somewhere or send it as a notification.
      // For now, we just log it and close the modal.
      console.log(
        `Rejected ${selectedRequesterId} for reason: ${rejectReason}`,
      );

      setRejectModalVisible(false);
      setRejectReason("");
      setSelectedRequesterId(null);
      await fetchData();
    } catch (error) {
      console.error("confirmReject error:", error);
      Alert.alert("Error", "Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    if (!activity) return;

    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDelete,
        },
      ],
    );
  };

  const confirmDelete = async () => {
    if (!activity) return;
    try {
      setActionLoading(true);
      await database.deleteActivity(activity.id);
      onClose();
    } catch (error) {
      console.error("handleDelete error:", error);
      Alert.alert("Error", "Failed to delete activity");
    } finally {
      setActionLoading(false);
    }
  };

  if (!displayActivity) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <Animated.View
          style={[
            { flex: 1, justifyContent: "flex-end" },
            {
              transform: [{ translateY: contentTranslateY }],
              opacity: contentOpacity,
            },
          ]}
        >
          <View className="bg-background-surface rounded-t-3xl h-[90%] overflow-hidden border-t border-border-divider">
            {/* Header */}
            <View
              className="flex-row items-center justify-between px-6 py-4 border-b border-border-divider"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <Text className="text-xl font-bold text-text-primary">
                Activity Details
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons
                  name="close"
                  size={24}
                  color="var(--color-text-secondary)"
                />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
              {loading ? (
                <View className="flex-1 items-center justify-center py-20">
                  <ActivityIndicator
                    size="large"
                    color="var(--color-primary)"
                  />
                </View>
              ) : (
                <>
                  {/* Main Info */}
                  <View className="mb-6">
                    <Text className="text-2xl font-bold text-text-primary mb-2">
                      {displayActivity.title}
                    </Text>
                    <View className="flex-row items-center mb-2">
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color="var(--color-primary)"
                      />
                      <Text className="text-text-secondary ml-2">
                        {format(
                          new Date(displayActivity.start_time),
                          "EEEE, MMMM do, h:mm a",
                        )}
                      </Text>
                    </View>
                    {displayActivity.city && (
                      <View className="flex-row items-center mb-2">
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color="var(--color-primary)"
                        />
                        <Text className="text-text-secondary ml-2">
                          {displayActivity.city}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Description */}
                  {displayActivity.description && (
                    <View className="mb-6">
                      <Text className="text-sm font-bold text-text-primary uppercase mb-2">
                        About
                      </Text>
                      <Text className="text-text-secondary leading-5">
                        {displayActivity.description}
                      </Text>
                    </View>
                  )}

                  {/* Status & Participants Summary */}
                  <View className="flex-row mb-6 bg-background-elevated p-4 rounded-2xl border border-border-divider">
                    <View className="flex-1">
                      <Text className="text-xs text-text-disabled font-bold uppercase">
                        Participants
                      </Text>
                      <Text className="text-lg font-bold text-text-primary">
                        {participants.length} /{" "}
                        {displayActivity.max_participants}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-text-disabled font-bold uppercase">
                        Visibility
                      </Text>
                      <Text className="text-lg font-bold text-text-primary capitalize">
                        {displayActivity.visibility}
                      </Text>
                    </View>
                  </View>

                  {/* Join/Leave Actions (for non-admins) */}
                  {!isAdmin && (
                    <View className="mb-6">
                      {userStatus === "approved" ? (
                        <TouchableOpacity
                          onPress={handleLeave}
                          disabled={actionLoading}
                          className="bg-status-danger/10 py-4 rounded-2xl items-center border border-status-danger/20"
                        >
                          <Text className="text-status-danger font-bold text-base">
                            Leave Activity
                          </Text>
                        </TouchableOpacity>
                      ) : userStatus === "pending" ? (
                        <View className="bg-status-warning/10 py-4 rounded-2xl items-center border border-status-warning/20">
                          <Text className="text-status-warning font-bold text-base">
                            Request Pending
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={handleJoinRequest}
                          disabled={
                            actionLoading ||
                            participants.length >=
                              displayActivity.max_participants
                          }
                          className={`py-4 rounded-2xl items-center shadow-sm ${
                            participants.length >=
                            displayActivity.max_participants
                              ? "bg-background-elevated"
                              : "bg-brand-primary active:bg-brand-primary-pressed"
                          }`}
                        >
                          <Text
                            className={`font-bold text-base ${participants.length >= displayActivity.max_participants ? "text-text-disabled" : "text-text-on-primary"}`}
                          >
                            {participants.length >=
                            displayActivity.max_participants
                              ? "Activity Full"
                              : "Request to Join"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Admin Panel */}
                  {isAdmin && (
                    <View className="mb-6">
                      <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-base font-bold text-text-primary">
                          Admin Dashboard
                        </Text>
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={() => setEditModalVisible(true)}
                            className="flex-row items-center bg-brand-primary/10 px-3 py-1.5 rounded-lg border border-brand-primary/20"
                          >
                            <Ionicons
                              name="create-outline"
                              size={16}
                              color="var(--color-primary)"
                            />
                            <Text className="text-brand-primary font-bold text-xs ml-1.5">
                              Edit
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={handleDelete}
                            className="flex-row items-center bg-status-danger/10 px-3 py-1.5 rounded-lg border border-status-danger/20"
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color="var(--color-danger)"
                            />
                            <Text className="text-status-danger font-bold text-xs ml-1.5">
                              Delete
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Join Requests */}
                      <View className="mb-4">
                        <Text className="text-xs text-text-disabled font-bold uppercase mb-2">
                          Pending Requests ({requests.length})
                        </Text>
                        {requests.length === 0 ? (
                          <Text className="text-text-disabled text-sm italic">
                            No pending requests
                          </Text>
                        ) : (
                          requests.map((req) => (
                            <View
                              key={req.user_id}
                              className="flex-row items-center justify-between py-3 border-b border-border-divider"
                            >
                              <View className="flex-row items-center">
                                <Image
                                  source={{
                                    uri:
                                      req.user?.avatar_url ||
                                      "https://via.placeholder.com/150",
                                  }}
                                  className="w-10 h-10 rounded-full bg-background-elevated"
                                />
                                <View className="ml-3">
                                  <Text className="text-sm font-bold text-text-primary">
                                    {req.user?.display_name || "User"}
                                  </Text>
                                  <Text className="text-xs text-text-secondary">
                                    @{req.user?.username}
                                  </Text>
                                </View>
                              </View>
                              <View className="flex-row gap-2">
                                <TouchableOpacity
                                  onPress={() => handleReject(req.user_id)}
                                  className="p-2 bg-status-danger/10 rounded-full"
                                >
                                  <Ionicons
                                    name="close"
                                    size={18}
                                    color="var(--color-danger)"
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => handleApprove(req.user_id)}
                                  className="p-2 bg-status-success/10 rounded-full"
                                >
                                  <Ionicons
                                    name="checkmark"
                                    size={18}
                                    color="var(--color-success)"
                                  />
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))
                        )}
                      </View>
                    </View>
                  )}

                  {/* Participants List */}
                  <View className="mb-10">
                    <Text className="text-sm font-bold text-text-primary uppercase mb-4">
                      Confirmed Participants
                    </Text>
                    {participants.length === 0 ? (
                      <Text className="text-text-disabled text-sm italic">
                        No participants yet
                      </Text>
                    ) : (
                      participants.map((p) => (
                        <View
                          key={p.user_id}
                          className="flex-row items-center mb-4"
                        >
                          <Image
                            source={{
                              uri:
                                p.user?.avatar_url ||
                                "https://via.placeholder.com/150",
                            }}
                            className="w-12 h-12 rounded-full bg-background-elevated"
                          />
                          <View className="ml-4">
                            <Text className="text-sm font-bold text-text-primary">
                              {p.user?.display_name || "User"}{" "}
                              {p.user_id === displayActivity.creator_id && (
                                <Text className="text-brand-primary font-normal">
                                  (Admin)
                                </Text>
                              )}
                            </Text>
                            <Text className="text-xs text-text-secondary">
                              @{p.user?.username}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Rejection Reason Modal */}
            <Modal
              visible={rejectModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setRejectModalVisible(false)}
            >
              <View className="flex-1 bg-black/50 justify-center px-6">
                <View className="bg-background-surface rounded-3xl p-6 shadow-xl border border-border-divider">
                  <Text className="text-lg font-bold text-text-primary mb-2">
                    Decline Request
                  </Text>
                  <Text className="text-text-secondary text-sm mb-4">
                    Please state the reason for declining this participant.
                  </Text>

                  <TextInput
                    className="bg-input-background border border-border-divider rounded-xl p-4 text-text-primary h-32 focus:border-input-focus"
                    placeholder="Reason..."
                    placeholderTextColor="var(--color-text-disabled)"
                    multiline
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    textAlignVertical="top"
                  />

                  <View className="flex-row gap-3 mt-6">
                    <TouchableOpacity
                      onPress={() => setRejectModalVisible(false)}
                      className="flex-1 py-3 items-center bg-background-elevated rounded-xl border border-border-divider"
                    >
                      <Text className="text-text-secondary font-bold">
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={confirmReject}
                      disabled={actionLoading || !rejectReason.trim()}
                      className={`flex-1 py-3 items-center rounded-xl ${
                        rejectReason.trim()
                          ? "bg-status-danger"
                          : "bg-status-danger/30"
                      }`}
                    >
                      <Text className="text-text-on-primary font-bold">
                        Decline
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Edit Activity Modal */}
            <CreateActivityModal
              visible={editModalVisible}
              onClose={() => setEditModalVisible(false)}
              initialData={displayActivity || undefined}
              onActivityUpdated={async () => {
                setEditModalVisible(false);
                await fetchData();
              }}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
