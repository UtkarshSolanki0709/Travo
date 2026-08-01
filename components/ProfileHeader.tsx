import { getAvatarUrl } from "@/lib/cloudinary";
import { User } from "@/services/database";
import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ProfileHeaderProps {
  userData: User | null;
  friendsCount: number;
  activitiesCount: number;
  isEditing: boolean;
  onEditPress: () => void;
  onCreatePostPress: () => void;
  onAvatarPress?: () => void;
  editingData?: Partial<User>;
}

export default function ProfileHeader({
  userData,
  friendsCount,
  activitiesCount,
  isEditing,
  onEditPress,
  onCreatePostPress,
  onAvatarPress,
  editingData,
}: ProfileHeaderProps) {
  const displayData = isEditing ? editingData : userData;

  return (
    <View className="items-center mb-8">
      <TouchableOpacity
        onPress={isEditing ? onAvatarPress : undefined}
        className="relative mb-4"
      >
        <View className="p-1 bg-background-surface rounded-full shadow-custom w-[110px] h-[110px] justify-center items-center overflow-hidden">
          {displayData?.avatar_url ? (
            <Image
              source={{ uri: getAvatarUrl(displayData.avatar_url, 200) }}
              className="w-[100px] h-[100px] rounded-full"
            />
          ) : (
            <Ionicons
              name="person-circle"
              size={100}
              color="var(--color-primary)"
            />
          )}
        </View>
        {isEditing && (
          <View className="absolute bottom-1 right-1 bg-brand-primary w-8 h-8 rounded-full justify-center items-center border-2 border-background-surface">
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {!isEditing && (
        <>
          <Text className="text-2xl font-bold text-text-primary text-center">
            {userData?.display_name || userData?.username || "Traveler"}
          </Text>
          <Text className="text-[15px] text-text-secondary mt-1">
            {userData?.city ? `${userData.city}, ` : ""}
            {userData?.country || "No location set"}
          </Text>
          {userData?.bio && (
            <Text className="text-sm text-text-secondary text-center mt-3 px-5 leading-5">
              {userData.bio}
            </Text>
          )}

          <View className="flex-row items-center justify-center mt-6 bg-background-surface py-3 px-6 rounded-2xl border border-border-divider shadow-sm">
            <View className="items-center px-5">
              <Text className="text-xl font-bold text-text-primary">
                {friendsCount}
              </Text>
              <Text className="text-xs text-text-secondary mt-0.5 uppercase tracking-wide">
                Friends
              </Text>
            </View>
            <View className="w-px h-[30px] bg-border-divider" />
            <View className="items-center px-5">
              <Text className="text-xl font-bold text-text-primary">
                {activitiesCount}
              </Text>
              <Text className="text-xs text-text-secondary mt-0.5 uppercase tracking-wide">
                Activities
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity
              className="flex-row items-center mt-3 px-4 py-2 rounded-full bg-background-elevated border border-border-divider"
              onPress={onEditPress}
            >
              <Ionicons
                name="create-outline"
                size={16}
                className="text-brand-primary"
              />
              <Text className="ml-1.5 text-brand-primary font-semibold text-sm">
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center mt-3 px-4 py-2 rounded-full bg-brand-primary active:bg-brand-primary-pressed border border-brand-primary"
              onPress={onCreatePostPress}
            >
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text className="ml-1.5 text-text-on-primary font-semibold text-sm">
                Add Post
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
