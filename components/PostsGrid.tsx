import { getOptimizedUrl, getVideoThumbUrl } from "@/lib/cloudinary";
import { Post } from "@/services/database";
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
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
  emptyIcon: ComponentProps<typeof Ionicons>["name"];
  onPostPress: (post: Post) => void;
}

export default function PostsGrid({
  posts,
  loading,
  emptyMessage,
  emptyIcon,
  onPostPress,
}: PostsGridProps) {
  if (loading) {
    return (
      <View className="p-10">
        <ActivityIndicator size="large" color="var(--color-primary)" />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View className="w-full p-10 items-center justify-center">
        <Ionicons
          name={emptyIcon}
          size={48}
          color="var(--color-text-disabled)"
        />
        <Text className="mt-3 text-text-disabled text-sm">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-2 mb-10">
      {posts.map((post) => (
        <TouchableOpacity
          key={post.id}
          style={{
            width: Math.round(COLUMN_WIDTH),
            height: Math.round(COLUMN_WIDTH),
          }}
          className="rounded-xl overflow-hidden bg-background-surface border border-border-divider"
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
            <View className="flex-1 p-2 bg-background-elevated justify-center">
              <Text
                numberOfLines={3}
                className="text-[10px] text-text-secondary text-center"
              >
                {post.text}
              </Text>
            </View>
          )}
          {post.media_type === "video" && (
            <View className="absolute top-1.5 right-1.5 bg-black/40 w-6 h-6 rounded-xl justify-center items-center">
              <Ionicons name="play" size={14} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}
