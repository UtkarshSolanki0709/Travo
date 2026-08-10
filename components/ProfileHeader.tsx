import { View, Text, TouchableOpacity } from 'react-native';
import { Camera, User as UserIcon, Edit3, PlusCircle } from 'lucide-react-native';
import { getAvatarUrl } from '@/lib/cloudinary';
import { User } from '@/services/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { COLORS } from '@/lib/theme';

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
        <Avatar isSelf={true} className="size-24">
          {displayData?.avatar_url ? (
            <AvatarImage source={{ uri: getAvatarUrl(displayData.avatar_url, 200) }} />
          ) : (
            <AvatarFallback>
              <UserIcon size={48} color={COLORS.primary} />
            </AvatarFallback>
          )}
        </Avatar>
        {isEditing && (
          <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full justify-center items-center border-2 border-white">
            <Camera size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {!isEditing && (
        <>
          <Text className="text-display-xl font-display text-foreground text-center">
            {userData?.display_name || userData?.username || 'Traveler'}
          </Text>
          <Text className="text-body-md text-muted-foreground font-body mt-1">
            {userData?.city ? `${userData.city}, ` : ''}{userData?.country || 'No location set'}
          </Text>
          {userData?.bio && (
            <Text className="text-body-md text-foreground text-center font-body mt-3 px-5 leading-5">
              {userData.bio}
            </Text>
          )}

          <Card className="flex-row items-center justify-center mt-6 py-3 px-6 rounded-radius-lg">
            <View className="items-center px-5">
              <Text className="text-heading-lg font-heading text-foreground">{friendsCount}</Text>
              <Text className="text-body-sm text-muted-foreground font-body mt-0.5 uppercase tracking-wide">Friends</Text>
            </View>
            <View className="w-px h-[30px] bg-border" />
            <View className="items-center px-5">
              <Text className="text-heading-lg font-heading text-foreground">{activitiesCount}</Text>
              <Text className="text-body-sm text-muted-foreground font-body mt-0.5 uppercase tracking-wide">Activities</Text>
            </View>
          </Card>

          <View className="flex-row gap-3 mt-4">
            <Button variant="secondary" size="default" onPress={onEditPress}>
              <Edit3 size={16} color={COLORS.primary} />
              <Text className="text-primary font-semibold text-body-sm font-body">Edit Profile</Text>
            </Button>

            <Button variant="default" size="default" onPress={onCreatePostPress}>
              <PlusCircle size={16} color="#fff" />
              <Text className="text-white font-semibold text-body-sm font-body">Add Post</Text>
            </Button>
          </View>
        </>
      )}
    </View>
  );
}