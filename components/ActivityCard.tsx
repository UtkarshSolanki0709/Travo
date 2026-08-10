import type { Activity } from "@/services/database";
import { Clock, MapPin, Users, Edit3, Trash2 } from "lucide-react-native";
import { format } from "date-fns";
import { Text, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COLORS } from "@/lib/theme";

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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const scale = useSharedValue(1);

  const startTime = new Date(activity.start_time);
  const now = new Date();
  const isUpcoming = startTime > now;
  const timeUntil = isUpcoming
    ? Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60 * 60))
    : 0;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 150 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const getStatusVariant = (): "default" | "secondary" | "outline" | "destructive" => {
    switch (activity.status) {
      case "upcoming":
        return "default";
      case "ongoing":
        return "secondary";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, { marginBottom: 12 }]}
    >
      <Card className="p-4">
        {/* Header */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-heading-md font-heading text-foreground" numberOfLines={1}>
              {activity.title}
            </Text>
            {activity.activity_type && (
              <Text className="text-body-sm font-semibold text-primary font-body mt-0.5">
                {activity.activity_type}
              </Text>
            )}
          </View>
          <Badge variant={getStatusVariant()}>
            <Text className="capitalize text-body-sm font-body">{activity.status}</Text>
          </Badge>
        </View>

        {/* Description */}
        {activity.description && (
          <Text className="text-body-md text-muted-foreground font-body mb-3" numberOfLines={2}>
            {activity.description}
          </Text>
        )}

        {/* Info Row */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Clock size={16} color={COLORS.textSecondary} />
            <Text className="text-body-sm text-muted-foreground font-body ml-1.5">
              {format(startTime, "MMM d, h:mm a")}
            </Text>
          </View>
          {distance !== undefined && (
            <View className="flex-row items-center">
              <MapPin size={16} color={COLORS.textSecondary} />
              <Text className="text-body-sm text-muted-foreground font-body ml-1.5">
                {distance < 1
                  ? `${Math.round(distance * 1000)}m`
                  : `${distance.toFixed(1)}km`}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Row */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center">
              <Users size={18} color={COLORS.primary} />
              <Text className="text-body-sm text-foreground font-semibold font-body ml-1.5">
                {participantCount}/{activity.max_participants}
              </Text>
            </View>
            {isUpcoming && timeUntil > 0 && (
              <Text className="text-body-sm text-muted-foreground font-body">in {timeUntil}h</Text>
            )}
          </View>

          {/* Join Status Badge */}
          {isJoined && (
            <Badge variant="secondary">
              <Text className="text-body-sm font-body">Joined</Text>
            </Badge>
          )}
          {isPending && (
            <Badge variant="accent">
              <Text className="text-body-sm font-body">Pending</Text>
            </Badge>
          )}
        </View>

        {/* Interests Tags */}
        {activity.interests && activity.interests.length > 0 && (
          <View className="flex-row flex-wrap mt-3 gap-1.5">
            {activity.interests.slice(0, 3).map((interest) => (
              <Badge key={interest} category={interest}>
                <Text className="text-body-sm font-body">{interest}</Text>
              </Badge>
            ))}
            {activity.interests.length > 3 && (
              <Badge variant="outline">
                <Text className="text-body-sm font-body">+{activity.interests.length - 3}</Text>
              </Badge>
            )}
          </View>
        )}

        {/* Admin Actions */}
        {(onEdit || onDelete) && (
          <View className="flex-row gap-2 mt-4 pt-3 border-t border-border">
            {onEdit && (
              <Pressable
                onPress={onEdit}
                className="flex-1 flex-row items-center justify-center bg-primary/10 py-2.5 rounded-radius-md border border-primary/20"
              >
                <Edit3 size={16} color={COLORS.primary} />
                <Text className="text-primary font-semibold text-body-sm font-body ml-1.5">
                  Update
                </Text>
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                onPress={onDelete}
                className="flex-1 flex-row items-center justify-center bg-destructive/10 py-2.5 rounded-radius-md border border-destructive/20"
              >
                <Trash2 size={16} color={COLORS.destructive} />
                <Text className="text-destructive font-semibold text-body-sm font-body ml-1.5">
                  Delete
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </Card>
    </AnimatedPressable>
  );
}
