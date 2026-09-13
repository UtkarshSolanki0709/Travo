import { getOptimizedUrl, getVideoThumbUrl } from "@/lib/cloudinary";
import { Post } from "@/services/database";
import { COLORS } from "@/lib/theme";
import { Play, LucideIcon } from "lucide-react-native";
import { memo, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";

interface PostsGridProps {
  posts: Post[];
  loading: boolean;
  emptyMessage: string;
  emptyIcon?: LucideIcon;
  onPostPress: (post: Post) => void;
}

const PostGridItem = memo(function PostGridItem({
  post,
  columnWidth,
  onPress,
}: {
  post: Post;
  columnWidth: number;
  onPress: (post: Post) => void;
}) {
  const handlePress = useCallback(() => onPress(post), [onPress, post]);

  return (
    <TouchableOpacity
      style={{ width: Math.round(columnWidth), height: Math.round(columnWidth), marginBottom: 8 }}
      className="rounded-radius-md overflow-hidden bg-surface border border-border shadow-elevation-1"
      onPress={handlePress}
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
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
          recyclingKey={post.id}
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
  );
});

export default function PostsGrid({
  posts,
  loading,
  emptyMessage,
  emptyIcon: EmptyIcon,
  onPostPress,
}: PostsGridProps) {
  const { width } = useWindowDimensions();
  const columnWidth = (width - 64) / 3;

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostGridItem post={item} columnWidth={columnWidth} onPress={onPostPress} />
    ),
    [columnWidth, onPostPress],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

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
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={3}
      columnWrapperStyle={{ gap: 8 }}
      contentContainerStyle={{ marginBottom: 40 }}
      scrollEnabled={false}
      removeClippedSubviews
      initialNumToRender={9}
      maxToRenderPerBatch={6}
      windowSize={5}
    />
  );
}
