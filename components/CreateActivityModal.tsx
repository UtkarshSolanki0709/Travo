import AnimatedPressable from "@/components/ui/AnimatedPressable";
import {
  database,
  type Activity,
  type ActivitySize,
  type ActivityVisibility,
} from "@/services/database";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

/** A chip that bounces when toggled */
function AnimatedChip({
  label,
  icon,
  isSelected,
  onPress,
}: {
  label: string;
  icon: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const chipScale = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(chipScale, {
        toValue: 1.15,
        useNativeDriver: true,
        speed: 60,
        bounciness: 8,
      }),
      Animated.spring(chipScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }),
    ]).start();
    onPress();
  }, [chipScale, onPress]);

  return (
    <Animated.View style={{ transform: [{ scale: chipScale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        className={`flex-row items-center rounded-full border px-[15px] py-2 ${
          isSelected
            ? "bg-brand-primary border-brand-primary"
            : "bg-background-surface border-border-divider"
        }`}
      >
        <Ionicons
          name={icon as any}
          size={14}
          color={isSelected ? "white" : "var(--color-text-secondary)"}
        />
        <Text
          className={`ml-2 text-[13px] font-bold ${isSelected ? "text-text-on-primary" : "text-text-secondary"}`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface CreateActivityModalProps {
  visible: boolean;
  onClose: () => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  onActivityCreated?: () => void;
  onActivityUpdated?: () => void;
  initialData?: Activity;
}

const INTERESTS = [
  { icon: "fitness", label: "Fitness" },
  { icon: "restaurant", label: "Food" },
  { icon: "people", label: "Social" },
  { icon: "basketball", label: "Sports" },
  { icon: "color-palette", label: "Arts" },
  { icon: "musical-notes", label: "Music" },
  { icon: "airplane", label: "Travel" },
  { icon: "game-controller", label: "Gaming" },
  { icon: "book", label: "Learning" },
  { icon: "leaf", label: "Outdoor" },
  { icon: "hardware-chip", label: "Tech" },
  { icon: "ellipsis-horizontal", label: "Other" },
];

const SIZE_OPTIONS = [
  {
    value: "duo" as ActivitySize,
    icon: "people-outline",
    label: "Duo",
    subtitle: "2 people",
  },
  {
    value: "trio" as ActivitySize,
    icon: "people",
    label: "Trio",
    subtitle: "3 people",
  },
  {
    value: "group" as ActivitySize,
    icon: "people-circle",
    label: "Group",
    subtitle: "4+ people",
  },
];

const VISIBILITY_OPTIONS = [
  {
    value: "public" as ActivityVisibility,
    icon: "globe-outline",
    label: "Public",
    subtitle: "Anyone can join",
  },
  {
    value: "friends" as ActivityVisibility,
    icon: "people-outline",
    label: "Friends",
    subtitle: "Friends only",
  },
  {
    value: "invite_only" as ActivityVisibility,
    icon: "lock-closed-outline",
    label: "Private",
    subtitle: "Invite only",
  },
];

export default function CreateActivityModal({
  visible,
  onClose,
  initialLocation,
  onActivityCreated,
  onActivityUpdated,
  initialData,
}: CreateActivityModalProps) {
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activityType, setActivityType] = useState("");
  const [sizeType, setSizeType] = useState<ActivitySize>("group");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState("10");
  const [visibility, setVisibility] = useState<ActivityVisibility>(
    initialData?.visibility || "public",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with initialData if editing
  useEffect(() => {
    if (initialData && visible) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setActivityType(initialData.activity_type || "");
      setSizeType(initialData.size_type);
      setSelectedInterests(initialData.interests || []);
      setStartTime(new Date(initialData.start_time));
      setMaxParticipants(initialData.max_participants.toString());
      setVisibility(initialData.visibility);
    } else if (!initialData && visible) {
      resetForm();
    }
  }, [initialData, visible]);

  const toggleInterest = (interest: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const selectionHaptic = () => {
    Haptics.selectionAsync();
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    if (!initialData && !initialLocation) {
      Alert.alert("Error", "Location is required");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialData) {
        await database.updateActivity(initialData.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          activity_type: activityType.trim() || undefined,
          size_type: sizeType,
          interests: selectedInterests.length > 0 ? selectedInterests : [],
          start_time: startTime.toISOString(),
          max_participants: Number.isFinite(parseInt(maxParticipants))
            ? parseInt(maxParticipants)
            : 10,
          visibility,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Activity updated successfully!");
        await onActivityUpdated?.();
      } else {
        await database.createActivity({
          creator_id: user.id,
          title: title.trim(),
          description: description.trim() || undefined,
          activity_type: activityType.trim() || undefined,
          size_type: sizeType,
          interests:
            selectedInterests.length > 0 ? selectedInterests : undefined,
          start_time: startTime.toISOString(),
          latitude: initialLocation!.latitude,
          longitude: initialLocation!.longitude,
          city: initialLocation?.city,
          max_participants: Number.isFinite(parseInt(maxParticipants))
            ? parseInt(maxParticipants)
            : 10,
          visibility,
          status: "upcoming",
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Activity created successfully!");
        await onActivityCreated?.();
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to save activity:", error);
      Alert.alert(
        "Error",
        `Failed to ${initialData ? "update" : "create"} activity.`,
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setActivityType("");
    setSizeType("group");
    setSelectedInterests([]);
    setStartTime(new Date());
    setMaxParticipants("10");
    setVisibility("public");
  };

  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    };
    return date.toLocaleString("en-US", options);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-background-app"
      >
        <LinearGradient
          colors={["#4f46e5", "#7c3aed"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-5 pt-[50px] pb-[25px]"
        >
          <View className="flex-row items-center justify-between mb-[15px]">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onClose();
              }}
              className="bg-white/20 p-2.5 rounded-full"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-[22px] font-extrabold">
              {initialData ? "Edit Activity" : "New Activity"}
            </Text>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={isSubmitting}
              className={`bg-background-surface px-[18px] py-2 rounded-[15px] ${isSubmitting ? "opacity-50" : ""}`}
            >
              <Text className="text-brand-primary font-extrabold text-sm">
                {isSubmitting ? "..." : initialData ? "Update" : "Create"}
              </Text>
            </TouchableOpacity>
          </View>

          {!initialData && initialLocation && (
            <View className="bg-white/15 rounded-[20px] p-3 flex-row items-center border border-white/20">
              <View className="bg-white/20 p-1.5 rounded-[10px] mr-3">
                <Ionicons name="location" size={18} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white/60 text-[10px] font-extrabold uppercase tracking-wide">
                  Location Verified
                </Text>
                <Text
                  className="text-white text-[13px] font-bold"
                  numberOfLines={1}
                >
                  {initialLocation.city || "Selected location"}
                </Text>
              </View>
            </View>
          )}
        </LinearGradient>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-5">
            {/* Title & Description */}
            <View className="mt-[30px]">
              <View className="flex-row items-center mb-[15px]">
                <View className="p-2 rounded-[12px] mr-3 bg-brand-primary/10">
                  <Ionicons
                    name="sparkles"
                    size={20}
                    color="var(--color-primary)"
                  />
                </View>
                <Text className="text-lg font-extrabold text-text-primary">
                  What{"'"}s the plan?
                </Text>
              </View>

              <View className="bg-input-background rounded-[24px] border border-border-divider overflow-hidden">
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Activity Title"
                  placeholderTextColor="var(--color-text-disabled)"
                  className="px-5 py-[18px] text-base font-bold text-text-primary"
                  maxLength={100}
                />
                <View className="h-px bg-border-divider mx-5" />
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Details..."
                  placeholderTextColor="var(--color-text-disabled)"
                  multiline
                  className="px-5 py-[18px] text-[15px] text-text-secondary min-h-[120px]"
                  textAlignVertical="top"
                  maxLength={500}
                />
              </View>
            </View>

            {/* Category & Time */}
            <View className="flex-row gap-3 mt-5">
              <View className="flex-1">
                <Text className="text-[11px] font-extrabold text-text-disabled mb-2 uppercase tracking-tight">
                  Category
                </Text>
                <View className="bg-input-background rounded-[20px] border border-border-divider px-4 py-3.5 min-h-[56px] justify-center focus-within:border-input-focus">
                  <TextInput
                    value={activityType}
                    onChangeText={setActivityType}
                    placeholder="e.g., Sport"
                    placeholderTextColor="var(--color-text-disabled)"
                    className="text-[15px] font-bold text-text-primary"
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-extrabold text-text-disabled mb-2 uppercase tracking-tight">
                  Start Time
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-input-background rounded-[20px] border border-border-divider px-4 py-3.5 min-h-[56px] justify-center"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[15px] font-bold text-text-primary">
                      {startTime.getHours()}:
                      {startTime.getMinutes().toString().padStart(2, "0")}
                    </Text>
                    <Ionicons
                      name="time"
                      size={18}
                      color="var(--color-primary)"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-brand-primary/10 rounded-[20px] border border-brand-primary/20 p-4 mt-5"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="bg-background-surface p-2 rounded-[10px] mr-[15px] shadow-sm">
                    <Ionicons
                      name="calendar"
                      size={20}
                      color="var(--color-primary)"
                    />
                  </View>
                  <View>
                    <Text className="text-[10px] font-extrabold text-brand-primary uppercase">
                      Scheduled For
                    </Text>
                    <Text className="text-[15px] font-extrabold text-text-primary">
                      {formatDateTime(startTime)}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="var(--color-text-disabled)"
                />
              </View>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={startTime}
                mode="datetime"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setStartTime(date);
                }}
              />
            )}

            {/* Capacity */}
            <View className="mt-[30px]">
              <View className="flex-row items-center mb-[15px]">
                <View className="p-2 rounded-[12px] mr-3 bg-status-success/10">
                  <Ionicons
                    name="people"
                    size={20}
                    color="var(--color-success)"
                  />
                </View>
                <Text className="text-lg font-extrabold text-text-primary">
                  Capacity
                </Text>
              </View>

              <View className="flex-row gap-3 mt-5">
                {SIZE_OPTIONS.map((size) => (
                  <TouchableOpacity
                    key={size.value}
                    onPress={() => {
                      selectionHaptic();
                      setSizeType(size.value);
                    }}
                    className={`flex-1 bg-background-surface rounded-[20px] border p-[15px] items-center shadow-sm ${
                      sizeType === size.value
                        ? "bg-status-success/10 border-status-success"
                        : "border-border-divider"
                    }`}
                  >
                    <Ionicons
                      name={size.icon as any}
                      size={22}
                      color={
                        sizeType === size.value
                          ? "var(--color-success)"
                          : "var(--color-text-disabled)"
                      }
                    />
                    <Text
                      className={`text-[12px] font-bold mt-2 ${
                        sizeType === size.value
                          ? "text-status-success"
                          : "text-text-secondary"
                      }`}
                    >
                      {size.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row items-center bg-input-background rounded-[20px] border border-border-divider px-5 py-[15px] mt-[15px] shadow-sm focus-within:border-input-focus">
                <View className="flex-1">
                  <Text className="text-[9px] font-extrabold text-text-disabled uppercase">
                    Maximum Members
                  </Text>
                  <TextInput
                    value={maxParticipants}
                    onChangeText={setMaxParticipants}
                    keyboardType="number-pad"
                    className="text-xl font-extrabold text-text-primary mt-0.5"
                  />
                </View>
                <Ionicons
                  name="person-add"
                  size={20}
                  color="var(--color-success)"
                />
              </View>
            </View>

            {/* Interests */}
            <View className="mt-[30px]">
              <View className="flex-row items-center mb-[15px]">
                <View className="p-2 rounded-[12px] mr-3 bg-status-danger/10">
                  <Ionicons
                    name="heart"
                    size={20}
                    color="var(--color-danger)"
                  />
                </View>
                <Text className="text-lg font-extrabold text-text-primary">
                  Vibe & Interests
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest.label);
                  return (
                    <AnimatedChip
                      key={interest.label}
                      label={interest.label}
                      icon={interest.icon}
                      isSelected={isSelected}
                      onPress={() => toggleInterest(interest.label)}
                    />
                  );
                })}
              </View>
            </View>

            {/* Privacy */}
            <View className="mt-[30px]">
              <View className="flex-row items-center mb-[15px]">
                <View className="p-2 rounded-[12px] mr-3 bg-status-info/10">
                  <Ionicons
                    name="shield-checkmark"
                    size={20}
                    color="var(--color-info)"
                  />
                </View>
                <Text className="text-lg font-extrabold text-text-primary">
                  Privacy Setting
                </Text>
              </View>
              {VISIBILITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    selectionHaptic();
                    setVisibility(option.value);
                  }}
                  className={`flex-row items-center bg-background-surface rounded-[20px] border p-[18px] mb-3 shadow-sm ${
                    visibility === option.value
                      ? "bg-brand-primary/10 border-brand-primary border-2"
                      : "border-border-divider/50"
                  }`}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={22}
                    color={
                      visibility === option.value
                        ? "var(--color-primary)"
                        : "var(--color-text-secondary)"
                    }
                  />
                  <View className="flex-1 ml-[15px]">
                    <Text className="text-[15px] font-bold text-text-primary">
                      {option.label}
                    </Text>
                    <Text className="text-[12px] text-text-secondary mt-0.5">
                      {option.subtitle}
                    </Text>
                  </View>
                  {visibility === option.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="var(--color-primary)"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <AnimatedPressable
              onPress={handleCreate}
              disabled={isSubmitting}
              scaleValue={0.97}
              className="mt-8 mb-5"
            >
              <LinearGradient
                colors={["#4f46e5", "#7c3aed"]}
                className="h-16 rounded-[20px] justify-center items-center shadow-lg"
              >
                <Text className="text-white text-lg font-extrabold uppercase tracking-widest">
                  {isSubmitting
                    ? "Saving..."
                    : initialData
                      ? "Update Activity"
                      : "Launch Activity"}
                </Text>
              </LinearGradient>
            </AnimatedPressable>

            <TouchableOpacity
              onPress={onClose}
              className="px-5 py-3 mb-5 items-center"
            >
              <Text className="text-text-disabled font-bold">
                Cancel and go back
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
