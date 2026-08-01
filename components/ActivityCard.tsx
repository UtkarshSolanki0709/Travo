import type { Activity } from "@/services/database";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Text, TouchableOpacity, View } from "react-native";

interface ActivityCardProps {
  activity: Activity;
  onPress: () => void;
  distance?: number; // in km
  participantCount?: number;
  isJoined?: boolean;
  isPending?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ActivityCard({
  activity,
  onPress,
  distance,
  participantCount = 0,
  isJoined = false,
  isPending = false,
  onEdit,
  onDelete,
}: ActivityCardProps) {
  const startTime = new Date(activity.start_time);
  const now = new Date();
  const isUpcoming = startTime > now;
  const timeUntil = isUpcoming
    ? Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60 * 60))
    : 0;

  const getSizeIcon = () => {
    switch (activity.size_type) {
      case "duo":
        return "people-outline";
      case "trio":
        return "people-outline";
      case "group":
        return "people-circle-outline";
      default:
        return "people-outline";
    }
  };

  const getStatusColor = () => {
    switch (activity.status) {
      case "upcoming":
        return { bg: "bg-status-info/10", text: "text-status-info" };
      case "ongoing":
        return { bg: "bg-status-success/10", text: "text-status-success" };
      case "completed":
        return { bg: "bg-background-elevated", text: "text-text-secondary" };
      case "cancelled":
        return { bg: "bg-status-danger/10", text: "text-status-danger" };
      default:
        return { bg: "bg-background-elevated", text: "text-text-secondary" };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-background-surface rounded-2xl p-4 mb-3 shadow-sm border border-border-divider"
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <Text
            className="text-lg font-bold text-text-primary"
            numberOfLines={1}
          >
            {activity.title}
          </Text>
          {activity.activity_type && (
            <Text className="text-xs text-brand-primary font-semibold mt-1">
              {activity.activity_type}
            </Text>
          )}
        </View>
        <View className={`px-2 py-1 rounded-lg ${getStatusColor().bg}`}>
          <Text
            className={`text-xs font-semibold capitalize ${getStatusColor().text}`}
          >
            {activity.status}
          </Text>
        </View>
      </View>

      {/* Description */}
      {activity.description && (
        <Text className="text-sm text-text-secondary mb-3" numberOfLines={2}>
          {activity.description}
        </Text>
      )}

      {/* Info Row */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons
            name="time-outline"
            size={16}
            color="var(--color-text-secondary)"
          />
          <Text className="text-xs text-text-secondary ml-1">
            {format(startTime, "MMM d, h:mm a")}
          </Text>
        </View>
        {distance !== undefined && (
          <View className="flex-row items-center">
            <Ionicons
              name="location-outline"
              size={16}
              color="var(--color-text-secondary)"
            />
            <Text className="text-xs text-text-secondary ml-1">
              {distance < 1
                ? `${Math.round(distance * 1000)}m`
                : `${distance.toFixed(1)}km`}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-3">
          <View className="flex-row items-center">
            <Ionicons
              name={getSizeIcon()}
              size={18}
              color="var(--color-primary)"
            />
            <Text className="text-xs text-text-primary ml-1 font-semibold">
              {participantCount}/{activity.max_participants}
            </Text>
          </View>
          {isUpcoming && timeUntil > 0 && (
            <Text className="text-xs text-text-disabled">in {timeUntil}h</Text>
          )}
        </View>

        {/* Join Status Badge */}
        {isJoined && (
          <View className="bg-status-success/10 px-2 py-1 rounded-lg">
            <Text className="text-xs font-semibold text-status-success">
              Joined
            </Text>
          </View>
        )}
        {isPending && (
          <View className="bg-status-warning/10 px-2 py-1 rounded-lg">
            <Text className="text-xs font-semibold text-status-warning">
              Pending
            </Text>
          </View>
        )}
      </View>

      {/* Interests Tags */}
      {activity.interests && activity.interests.length > 0 && (
        <View className="flex-row flex-wrap mt-3 gap-2">
          {activity.interests.slice(0, 3).map((interest) => (
            <View
              key={interest}
              className="bg-brand-primary/10 px-2 py-1 rounded-lg"
            >
              <Text className="text-xs text-brand-primary font-medium">
                {interest}
              </Text>
            </View>
          ))}
          {activity.interests.length > 3 && (
            <View className="bg-background-elevated px-2 py-1 rounded-lg">
              <Text className="text-xs text-text-secondary">
                +{activity.interests.length - 3}
              </Text>
            </View>
          )}
        </View>
      )}
      {/* Admin Actions */}
      {(onEdit || onDelete) && (
        <View className="flex-row gap-2 mt-4 pt-4 border-t border-border-divider">
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              className="flex-1 flex-row items-center justify-center bg-background-elevated active:bg-background-surface py-2.5 rounded-xl border border-border-divider"
            >
              <Ionicons
                name="create-outline"
                size={16}
                color="var(--color-primary)"
              />
              <Text className="text-brand-primary font-bold text-xs ml-2">
                Update
              </Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              className="flex-1 flex-row items-center justify-center bg-status-danger h-10 rounded-xl"
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color="var(--color-text-on-primary)"
              />
              <Text className="text-text-on-primary font-bold text-xs ml-2">
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
