import { getOptimizedUrl, getVideoThumbUrl } from "@/lib/cloudinary";
import { Post } from "@/services/database";
import { COLORS } from "@/lib/theme";
import { Play, LucideIcon } from "lucide-react-native";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 64) / 3;

interface PostsGridProps {
  posts: Post[];
  loading: boolean;
  emptyMessage: string;
  emptyIcon?: LucideIcon;
  onPostPress: (post: Post) => void;
}

export default function PostsGrid({
  posts,
  loading,
  emptyMessage,
  emptyIcon: EmptyIcon,
  onPostPress,
}: PostsGridProps) {
  if (loading) {
    return (
      <View className="p-10">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View className="w-full p-10 items-center justify-center">
        {EmptyIcon ? (
          <EmptyIcon size={48} color={COLORS.textSecondary} opacity={0.5} />
        ) : null}
        <Text className="mt-3 text-muted-foreground text-body-sm font-body">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-2 mb-10">
      {posts.map((post) => (
        <TouchableOpacity
          key={post.id}
          style={{ width: Math.round(COLUMN_WIDTH), height: Math.round(COLUMN_WIDTH) }}
          className="rounded-radius-md overflow-hidden bg-surface border border-border shadow-elevation-1"
          onPress={() => onPostPress(post)}
        >
          {post.media_url ? (
            <Image
              source={{
                uri:
                  post.media_type === "video"
                    ? getVideoThumbUrl(post.media_url, {
                        width: 300,
                        height: 300,
                      })
                    : getOptimizedUrl(post.media_url, {
                        width: 300,
                        height: 300,
                      }),
              }}
              className="w-full h-full"
            />
          ) : (
            <View className="flex-1 p-2 bg-surface-elevated justify-center">
              <Text
                numberOfLines={3}
                className="text-xs text-muted-foreground text-center font-body"
              >
                {post.text}
              </Text>
            </View>
          )}
          {post.media_type === "video" && (
            <View className="absolute top-1.5 right-1.5 bg-black/40 w-6 h-6 rounded-full justify-center items-center">
              <Play size={12} color="#fff" fill="#fff" />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}
