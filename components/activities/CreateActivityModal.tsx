import {
  database,
  type Activity,
  type ActivitySize,
  type ActivityVisibility,
} from "@/services/database";
import { useUser } from "@clerk/expo";
import {
  X,
  MapPin,
  Sparkles,
  Clock,
  Calendar,
  Users,
  UserPlus,
  Heart,
  ShieldCheck,
  Lock,
  Globe,
  CheckCircle2,
  Dumbbell,
  Utensils,
  Trophy,
  Palette,
  Music,
  Plane,
  Gamepad2,
  BookOpen,
  Trees,
  Cpu,
  MoreHorizontal,
  User,
} from "lucide-react-native";
import { COLORS } from "@/lib/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
  { icon: Dumbbell, label: "Fitness" },
  { icon: Utensils, label: "Food" },
  { icon: Users, label: "Social" },
  { icon: Trophy, label: "Sports" },
  { icon: Palette, label: "Arts" },
  { icon: Music, label: "Music" },
  { icon: Plane, label: "Travel" },
  { icon: Gamepad2, label: "Gaming" },
  { icon: BookOpen, label: "Learning" },
  { icon: Trees, label: "Outdoor" },
  { icon: Cpu, label: "Tech" },
  { icon: MoreHorizontal, label: "Other" },
];

const SIZE_OPTIONS = [
  {
    value: "duo" as ActivitySize,
    Icon: User,
    label: "Duo",
    subtitle: "2 people",
  },
  {
    value: "trio" as ActivitySize,
    Icon: Users,
    label: "Trio",
    subtitle: "3 people",
  },
  {
    value: "group" as ActivitySize,
    Icon: Users,
    label: "Group",
    subtitle: "4+ people",
  },
];

const VISIBILITY_OPTIONS = [
  {
    value: "public" as ActivityVisibility,
    Icon: Globe,
    label: "Public",
    subtitle: "Anyone can join",
  },
  {
    value: "friends" as ActivityVisibility,
    Icon: Users,
    label: "Friends",
    subtitle: "Friends only",
  },
  {
    value: "invite_only" as ActivityVisibility,
    Icon: Lock,
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
  const [startTime, setStartTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState("10");
  const [sizeType, setSizeType] = useState<ActivitySize>("group");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [visibility, setVisibility] =
    useState<ActivityVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setStartTime(new Date(initialData.start_time));
      setMaxParticipants(initialData.max_participants.toString());
      setSizeType(initialData.size_type);
      setSelectedInterests(initialData.interests || []);
      setVisibility(initialData.visibility);
    } else {

      setTitle("");
      setDescription("");
      setStartTime(new Date(Date.now() + 3600000));
      setMaxParticipants("10");
      setSizeType("group");
      setSelectedInterests([]);
      setVisibility("public");
    }
  }, [initialData, visible]);

  const selectionHaptic = () => {
    Haptics.selectionAsync();
  };

  const toggleInterest = (label: string) => {
    selectionHaptic();
    if (selectedInterests.includes(label)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== label));
    } else {
      setSelectedInterests([...selectedInterests, label]);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Title Required", "Please enter an activity title.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to create an activity.");
      return;
    }

    const participantsNum = parseInt(maxParticipants, 10);
    if (isNaN(participantsNum) || participantsNum < 2) {
      Alert.alert("Invalid Capacity", "Minimum 2 participants required.");
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (initialData) {
        await database.updateActivity(initialData.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          start_time: startTime.toISOString(),
          max_participants: participantsNum,
          size_type: sizeType,
          interests: selectedInterests,
          visibility,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
        if (onActivityUpdated) onActivityUpdated();
      } else {
        if (!initialLocation) {
          Alert.alert(
            "Location Required",
            "Please select a location on the map first.",
          );
          setIsSubmitting(false);
          return;
        }

        await database.createActivity({
          creator_id: user.id,
          title: title.trim(),
          description: description.trim() || undefined,
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          city: initialLocation.city,
          start_time: startTime.toISOString(),
          max_participants: participantsNum,
          size_type: sizeType,
          interests: selectedInterests,
          visibility,
          status: "upcoming",
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
        if (onActivityCreated) onActivityCreated();
      }
    } catch (error: any) {
      console.error("Create/Update activity error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        error.message || "Failed to save activity. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <LinearGradient
          colors={COLORS.twilight.colors}
          start={COLORS.twilight.start}
          end={COLORS.twilight.end}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onClose();
              }}
              style={styles.closeButton}
            >
              <X size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {initialData ? "Edit Activity" : "New Activity"}
            </Text>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={isSubmitting}
              style={[styles.createButton, isSubmitting && { opacity: 0.5 }]}
            >
              <Text style={styles.createButtonText}>
                {isSubmitting ? "..." : initialData ? "Update" : "Create"}
              </Text>
            </TouchableOpacity>
          </View>

          {!initialData && initialLocation && (
            <View style={styles.locationBadge}>
              <View style={styles.locationIconWrapper}>
                <MapPin size={16} color="white" />
              </View>
              <View style={styles.locationTextWrapper}>
                <Text style={styles.locationLabel}>Location Verified</Text>
                <Text style={styles.locationValue} numberOfLines={1}>
                  {initialLocation.city || "Selected location"}
                </Text>
              </View>
            </View>
          )}
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.padding}>
            {/* Title & Description */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View
                  style={[styles.sectionIcon, { backgroundColor: COLORS.primary + "15" }]}
                >
                  <Sparkles size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.sectionTitle}>What{"'"}s the plan?</Text>
              </View>

              <View style={styles.inputCard}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Activity Title"
                  placeholderTextColor="#94a3b8"
                  style={styles.titleInput}
                  maxLength={100}
                />
                <View style={styles.divider} />
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add details (meeting point, what to bring, etc.)"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  style={styles.descInput}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View
                  style={[styles.sectionIcon, { backgroundColor: COLORS.primary + "15" }]}
                >
                  <Clock size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.sectionTitle}>When is it happening?</Text>
              </View>

              <View style={styles.row}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.flex1, styles.dateBox]}
                >
                  <View style={styles.rowBetween}>
                    <Text style={styles.textInputBold}>
                      {format(startTime, "MMM d, yyyy")}
                    </Text>
                    <Calendar size={18} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.flex1, styles.dateBox]}
                >
                  <View style={styles.rowBetween}>
                    <Text style={styles.textInputBold}>
                      {format(startTime, "h:mm a")}
                    </Text>
                    <Clock size={18} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

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
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View
                  style={[styles.sectionIcon, { backgroundColor: "#ecfdf5" }]}
                >
                  <Users size={20} color="#10b981" />
                </View>
                <Text style={styles.sectionTitle}>Capacity</Text>
              </View>

              <View style={styles.row}>
                {SIZE_OPTIONS.map((size) => (
                  <TouchableOpacity
                    key={size.value}
                    onPress={() => {
                      selectionHaptic();
                      setSizeType(size.value);
                    }}
                    style={[
                      styles.sizeOption,
                      sizeType === size.value && styles.sizeOptionSelected,
                    ]}
                  >
                    <size.Icon
                      size={22}
                      color={sizeType === size.value ? "#10b981" : "#94a3b8"}
                    />
                    <Text
                      style={[
                        styles.sizeLabelSmall,
                        sizeType === size.value && { color: "#10b981" },
                      ]}
                    >
                      {size.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.capacityInput}>
                <View style={styles.flex1}>
                  <Text style={styles.labelSmall}>Maximum Members</Text>
                  <TextInput
                    value={maxParticipants}
                    onChangeText={setMaxParticipants}
                    keyboardType="number-pad"
                    style={styles.capacityValue}
                  />
                </View>
                <UserPlus size={20} color="#10b981" />
              </View>
            </View>

            {/* Interests */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View
                  style={[styles.sectionIcon, { backgroundColor: "#fff1f2" }]}
                >
                  <Heart size={20} color="#f43f5e" />
                </View>
                <Text style={styles.sectionTitle}>Vibe & Interests</Text>
              </View>
              <View style={styles.tagContainer}>
                {INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest.label);
                  return (
                    <TouchableOpacity
                      key={interest.label}
                      onPress={() => toggleInterest(interest.label)}
                      style={[styles.tag, isSelected && styles.tagSelected]}
                    >
                      <interest.icon
                        size={14}
                        color={isSelected ? "white" : "#64748b"}
                      />
                      <Text
                        style={[
                          styles.tagText,
                          isSelected && { color: "white" },
                        ]}
                      >
                        {interest.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Privacy */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View
                  style={[styles.sectionIcon, { backgroundColor: "#eff6ff" }]}
                >
                  <ShieldCheck size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.sectionTitle}>Privacy Setting</Text>
              </View>
              {VISIBILITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    selectionHaptic();
                    setVisibility(option.value);
                  }}
                  style={[
                    styles.privacyBox,
                    visibility === option.value && styles.privacyBoxSelected,
                  ]}
                >
                  <option.Icon
                    size={22}
                    color={visibility === option.value ? COLORS.primary : "#64748b"}
                  />
                  <View style={styles.privacyText}>
                    <Text style={styles.privacyLabel}>{option.label}</Text>
                    <Text style={styles.privacySub}>{option.subtitle}</Text>
                  </View>
                  {visibility === option.value && (
                    <CheckCircle2
                      size={20}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Footer */}
            <TouchableOpacity onPress={handleCreate} disabled={isSubmitting}>
              <LinearGradient
                colors={COLORS.sunrise.colors}
                start={COLORS.sunrise.start}
                end={COLORS.sunrise.end}
                style={styles.launchBtn}
              >
                <Text style={styles.launchBtnText}>
                  {isSubmitting
                    ? "Saving..."
                    : initialData
                      ? "Update Activity"
                      : "Launch Activity"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Poppins_700Bold",
  },
  createButton: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 10,
    borderRadius: 12,
  },
  locationIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  locationTextWrapper: {
    flex: 1,
  },
  locationLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    fontWeight: "500",
  },
  locationValue: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  padding: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    fontFamily: "Inter_600SemiBold",
  },
  inputCard: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  titleInput: {
    padding: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  descInput: {
    padding: 16,
    fontSize: 14,
    color: "#334155",
    minHeight: 80,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  dateBox: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textInputBold: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  sizeOption: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "white",
  },
  sizeOptionSelected: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  sizeLabelSmall: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 4,
  },
  capacityInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginTop: 12,
  },
  labelSmall: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },
  capacityValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    padding: 0,
    marginTop: 2,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
  },
  tagSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#475569",
  },
  privacyBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "white",
    marginBottom: 8,
  },
  privacyBoxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  privacyText: {
    flex: 1,
    marginLeft: 12,
  },
  privacyLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  privacySub: {
    fontSize: 12,
    color: "#64748b",
  },
  launchBtn: {
    padding: 16,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 12,
  },
  launchBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
});
