import ActivityCard from "@/components/ActivityCard";
import ActivityDetailsModal from "@/components/ActivityDetailsModal";
import CreateActivityModal from "@/components/CreateActivityModal";
import { useMapContext } from "@/context/MapContext";
import { database, type Activity } from "@/services/database";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Tab = "nearby" | "my_activities" | "joined";

const ActivitiesScreen = () => {
  const { user } = useUser();
  const { userLocation } = useMapContext();
  const [activeTab, setActiveTab] = useState<Tab>("nearby");
  const [nearbyActivities, setNearbyActivities] = useState<Activity[]>([]);
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [joinedActivities, setJoinedActivities] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const lastFetchedLocation = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const lastFetchTimestamp = useRef<number>(0);
  const FETCH_DISTANCE_THRESHOLD = 0.5; // km
  const FETCH_TIME_THRESHOLD = 30000; // 30s

  const fetchNearbyActivities = useCallback(
    async (options?: { forceImmediate?: boolean }) => {
      if (!userLocation) return;

      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimestamp.current;

      if (!options?.forceImmediate && lastFetchedLocation.current) {
        const distanceMoved = database.calculateDistance(
          lastFetchedLocation.current.latitude,
          lastFetchedLocation.current.longitude,
          userLocation.latitude,
          userLocation.longitude,
        );

        if (
          distanceMoved < FETCH_DISTANCE_THRESHOLD &&
          timeSinceLastFetch < FETCH_TIME_THRESHOLD
        ) {
          return;
        }
      }

      try {
        const activities = await database.getActivities({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radiusKm: 50,
          status: "upcoming",
        });
        setNearbyActivities(activities);
        lastFetchedLocation.current = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        };
        lastFetchTimestamp.current = now;
      } catch (error) {
        console.error("Failed to fetch nearby activities:", error);
      }
    },
    [userLocation],
  );

  const fetchUserActivities = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [{ created, joined }, pending] = await Promise.all([
        database.getUserActivities(user.id),
        database.getPendingRequestsForUser(user.id),
      ]);
      setMyActivities(created);
      setJoinedActivities(joined);
      setPendingRequests(pending);
    } catch (error) {
      console.error("Failed to fetch user activities:", error);
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchNearbyActivities({ forceImmediate: true }),
      fetchUserActivities(),
    ]);
    setRefreshing(false);
  }, [fetchNearbyActivities, fetchUserActivities]);

  useFocusEffect(
    useCallback(() => {
      fetchNearbyActivities({ forceImmediate: true });
      fetchUserActivities();
    }, [fetchNearbyActivities, fetchUserActivities]),
  );

  const displayActivities = useMemo(() => {
    switch (activeTab) {
      case "nearby":
        return nearbyActivities;
      case "my_activities":
        return myActivities;
      case "joined":
        return joinedActivities;
      default:
        return [];
    }
  }, [activeTab, nearbyActivities, myActivities, joinedActivities]);

  const calculateDistance = (activity: Activity) => {
    if (!userLocation) return undefined;
    return database.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      activity.latitude,
      activity.longitude,
    );
  };

  const handleActivityPress = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setIsEditModalVisible(true);
  };

  const handleDelete = async (activityId: string) => {
    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await database.deleteActivity(activityId);
              await fetchUserActivities();
              await fetchNearbyActivities({ forceImmediate: true });
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Failed to delete activity");
            }
          },
        },
      ],
    );
  };

  const renderActivity = ({ item }: { item: Activity }) => {
    const isAdmin = item.creator_id === user?.id;

    return (
      <ActivityCard
        activity={item}
        onPress={() => handleActivityPress(item)}
        distance={calculateDistance(item)}
        participantCount={item.participant_count || 0}
        isJoined={activeTab === "joined"}
        onEdit={
          activeTab === "my_activities" && isAdmin
            ? () => handleEdit(item)
            : undefined
        }
        onDelete={
          activeTab === "my_activities" && isAdmin
            ? () => handleDelete(item.id)
            : undefined
        }
      />
    );
  };

  const renderEmptyState = () => {
    let message = "";
    let icon: keyof typeof Ionicons.glyphMap = "location-outline";

    switch (activeTab) {
      case "nearby":
        message = userLocation
          ? "No activities nearby. Be the first to create one!"
          : "Enable location to see nearby activities";
        icon = "location-outline";
        break;
      case "my_activities":
        message = "You haven't created any activities yet";
        icon = "add-circle-outline";
        break;
      case "joined":
        message = "You haven't joined any activities yet";
        icon = "people-outline";
        break;
    }

    return (
      <View className="flex-1 items-center justify-center px-8 py-12">
        <Ionicons name={icon} size={64} color="var(--color-text-disabled)" />
        <Text className="text-center text-text-secondary mt-4 text-base">
          {message}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background-app">
      {/* Header */}
      <View className="bg-background-surface border-b border-border-divider pt-12 pb-4 px-4">
        <Text className="text-2xl font-bold text-text-primary mb-4">
          Activities
        </Text>

        {/* Tabs */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setActiveTab("nearby")}
            className={`flex-1 py-2 rounded-lg ${
              activeTab === "nearby"
                ? "bg-brand-primary"
                : "bg-background-elevated"
            }`}
          >
            <Text
              className={`text-center font-semibold text-sm ${
                activeTab === "nearby"
                  ? "text-text-on-primary"
                  : "text-text-secondary"
              }`}
            >
              Nearby
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("my_activities")}
            className={`flex-1 py-2 rounded-lg ${
              activeTab === "my_activities"
                ? "bg-brand-primary"
                : "bg-background-elevated"
            }`}
          >
            <Text
              className={`text-center font-semibold text-sm ${
                activeTab === "my_activities"
                  ? "text-text-on-primary"
                  : "text-text-secondary"
              }`}
            >
              My Activities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("joined")}
            className={`flex-1 py-2 rounded-lg ${
              activeTab === "joined"
                ? "bg-brand-primary"
                : "bg-background-elevated"
            }`}
          >
            <Text
              className={`text-center font-semibold text-sm ${
                activeTab === "joined"
                  ? "text-text-on-primary"
                  : "text-text-secondary"
              }`}
            >
              Joined
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications / Pending Requests Banner */}
      {pendingRequests.length > 0 && (
        <TouchableOpacity
          onPress={() => setActiveTab("my_activities")}
          className="bg-background-elevated mx-4 mt-4 p-4 rounded-2xl flex-row items-center border border-border-divider"
        >
          <View className="bg-brand-primary p-2 rounded-full">
            <Ionicons
              name="people"
              size={20}
              color="var(--color-text-on-primary)"
            />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-text-primary font-bold">
              Join Requests Pending
            </Text>
            <Text className="text-text-secondary text-xs">
              {pendingRequests.length} user(s) are trying to join your
              activities.
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="var(--color-primary)"
          />
        </TouchableOpacity>
      )}

      {/* Activities List */}
      <FlatList
        data={displayActivities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <ActivityDetailsModal
        activity={selectedActivity}
        visible={!!selectedActivity}
        onClose={() => {
          setSelectedActivity(null);
          onRefresh();
        }}
      />
      <CreateActivityModal
        visible={isEditModalVisible}
        onClose={() => {
          setIsEditModalVisible(false);
          setEditingActivity(null);
        }}
        initialData={editingActivity || undefined}
        onActivityUpdated={async () => {
          setIsEditModalVisible(false);
          setEditingActivity(null);
          await fetchUserActivities();
          await fetchNearbyActivities({ forceImmediate: true });
        }}
      />
    </View>
  );
};

export default ActivitiesScreen;
