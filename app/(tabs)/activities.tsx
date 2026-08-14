import ActivityCard from "@/components/ActivityCard";
import ActivityDetailsModal from "@/components/ActivityDetailsModal";
import CreateActivityModal from "@/components/CreateActivityModal";
import { useMapContext } from "@/context/MapContext";
import { database, type Activity } from "@/services/database";
import { COLORS } from "@/lib/theme";
import { useUser } from "@clerk/expo";
import { MapPin, PlusCircle, Users, ChevronRight } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
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

  const fetchNearbyActivitiesRef = useRef(fetchNearbyActivities);
  fetchNearbyActivitiesRef.current = fetchNearbyActivities;

  const fetchUserActivitiesRef = useRef(fetchUserActivities);
  fetchUserActivitiesRef.current = fetchUserActivities;

  useFocusEffect(
    useCallback(() => {
      fetchNearbyActivitiesRef.current({ forceImmediate: true });
      fetchUserActivitiesRef.current();
    }, []),
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
    let IconComponent = MapPin;

    switch (activeTab) {
      case "nearby":
        message = userLocation
          ? "No activities nearby. Be the first to create one!"
          : "Enable location to see nearby activities";
        IconComponent = MapPin;
        break;
      case "my_activities":
        message = "You haven't created any activities yet";
        IconComponent = PlusCircle;
        break;
      case "joined":
        message = "You haven't joined any activities yet";
        IconComponent = Users;
        break;
    }

    return (
      <View className="flex-1 items-center justify-center px-8 py-16">
        <IconComponent size={56} color={COLORS.textSecondary} opacity={0.5} />
        <Text className="text-center text-muted-foreground mt-4 text-body-md font-body">
          {message}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <ImageBackground
        source={require("@/assets/textures/paper-texture.png")}
        imageStyle={{ opacity: 0.05 }}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-surface border-b border-border pt-12 pb-4 px-4 shadow-elevation-1">
          <Text className="text-heading-xl font-display text-foreground mb-4">
            Activities
          </Text>

          {/* Tabs */}
          <View className="flex-row gap-2 bg-surface-elevated p-1 rounded-radius-md border border-border">
            <TouchableOpacity
              onPress={() => setActiveTab("nearby")}
              className={`flex-1 py-2 rounded-radius-md ${
                activeTab === "nearby" ? "bg-primary shadow-sm" : ""
              }`}
            >
              <Text
                className={`text-center font-semibold text-body-sm font-body ${
                  activeTab === "nearby" ? "text-white" : "text-muted-foreground"
                }`}
              >
                Nearby
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("my_activities")}
              className={`flex-1 py-2 rounded-radius-md ${
                activeTab === "my_activities" ? "bg-primary shadow-sm" : ""
              }`}
            >
              <Text
                className={`text-center font-semibold text-body-sm font-body ${
                  activeTab === "my_activities" ? "text-white" : "text-muted-foreground"
                }`}
              >
                My Activities
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("joined")}
              className={`flex-1 py-2 rounded-radius-md ${
                activeTab === "joined" ? "bg-primary shadow-sm" : ""
              }`}
            >
              <Text
                className={`text-center font-semibold text-body-sm font-body ${
                  activeTab === "joined" ? "text-white" : "text-muted-foreground"
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
            className="bg-primary/10 mx-4 mt-4 p-4 rounded-radius-lg flex-row items-center border border-primary/20"
          >
            <View className="bg-primary p-2.5 rounded-full">
              <Users size={18} color="white" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-foreground font-bold font-body text-body-md">
                Join Requests Pending
              </Text>
              <Text className="text-muted-foreground text-body-sm font-body">
                {pendingRequests.length} user(s) are trying to join your activities.
              </Text>
            </View>
            <ChevronRight size={20} color={COLORS.primary} />
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
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
      </ImageBackground>
    </View>
  );
};

export default ActivitiesScreen;
