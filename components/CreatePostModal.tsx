import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface PlaceResult {
  id?: string;
  place_id?: string;
  place_name: string;
  text?: string;
  context?: { id: string; text: string }[];
  // Add other fields as needed
}

interface CreatePostModalProps {
  visible: boolean;
  postText: string;
  postMedia: { uri: string; type: "image" | "video" } | null;
  venueName: string;
  locationName: string;
  venueResults: PlaceResult[];
  locationResults: PlaceResult[];
  isSearchingVenue: boolean;
  isSearchingLocation: boolean;
  creating: boolean;
  videoPlayer: ReturnType<typeof useVideoPlayer> | null;
  onClose: () => void;
  onPostTextChange: (text: string) => void;
  onPickMedia: () => void;
  onRemoveMedia: () => void;
  onVenueSearch: (query: string) => void;
  onLocationSearch: (query: string) => void;
  postCity?: string;
  postCountry?: string;
  visibility: "public" | "friends";
  onVisibilityChange: (value: "public" | "friends") => void;
  onSelectVenue: (place: PlaceResult) => void;
  onSelectLocation: (place: PlaceResult) => void;
  onCreatePost: () => void;
}

export default function CreatePostModal({
  visible,
  postText,
  postMedia,
  venueName,
  locationName,
  venueResults,
  locationResults,
  isSearchingVenue,
  isSearchingLocation,
  creating,
  videoPlayer,
  postCity,
  postCountry,
  visibility,
  onVisibilityChange,
  onClose,
  onPostTextChange,
  onPickMedia,
  onRemoveMedia,
  onVenueSearch,
  onLocationSearch,
  onSelectVenue,
  onSelectLocation,
  onCreatePost,
}: CreatePostModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black/50 justify-end"
      >
        <View className="bg-background-surface rounded-t-3xl h-[80%] p-6 border-t border-border-divider">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-xl font-bold text-text-primary">
              Create New Post
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={24}
                color="var(--color-text-secondary)"
              />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1">
            <TouchableOpacity
              className="w-full aspect-[4/3] bg-background-elevated rounded-2xl border-2 border-dashed border-border-divider justify-center items-center mb-5 overflow-hidden"
              onPress={onPickMedia}
            >
              {postMedia ? (
                <View className="w-full h-full relative">
                  {postMedia.type === "video" ? (
                    videoPlayer ? (
                      <VideoView
                        style={{ width: "100%", height: "100%" }}
                        player={videoPlayer}
                        allowsFullscreen
                        allowsPictureInPicture
                        nativeControls
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-background-elevated">
                        <ActivityIndicator
                          size="small"
                          color="var(--color-primary)"
                        />
                      </View>
                    )
                  ) : (
                    <Image
                      source={{ uri: postMedia.uri }}
                      className="w-full h-full"
                    />
                  )}
                  <TouchableOpacity
                    className="absolute top-2.5 right-2.5 bg-background-surface rounded-xl"
                    onPress={onRemoveMedia}
                  >
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color="var(--color-danger)"
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Ionicons
                    name="image-outline"
                    size={48}
                    color="var(--color-text-disabled)"
                  />
                  <Text className="mt-3 text-text-secondary text-[15px]">
                    Add Photo or Video
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TextInput
              className="bg-input-background border border-border-divider rounded-xl p-3 mb-3 text-base text-text-primary h-[120px] focus:border-input-focus"
              placeholder="What's on your mind?..."
              placeholderTextColor="var(--color-text-disabled)"
              multiline
              textAlignVertical="top"
              value={postText}
              onChangeText={onPostTextChange}
            />

            <View className="flex-row items-center mb-4 px-1 gap-4">
              <TouchableOpacity
                onPress={() => onVisibilityChange("public")}
                className={`flex-row items-center px-4 py-2 rounded-full border ${visibility === "public" ? "bg-brand-primary/10 border-brand-primary" : "bg-background-surface border-border-divider"}`}
              >
                <Ionicons
                  name="globe-outline"
                  size={14}
                  color={
                    visibility === "public"
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)"
                  }
                />
                <Text
                  className={`text-[12px] font-medium ml-1.5 ${visibility === "public" ? "text-brand-primary" : "text-text-secondary"}`}
                >
                  Public
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onVisibilityChange("friends")}
                className={`flex-row items-center px-4 py-2 rounded-full border ${visibility === "friends" ? "bg-brand-primary/10 border-brand-primary" : "bg-background-surface border-border-divider"}`}
              >
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={
                    visibility === "friends"
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)"
                  }
                />
                <Text
                  className={`text-[12px] font-medium ml-1.5 ${visibility === "friends" ? "text-brand-primary" : "text-text-secondary"}`}
                >
                  Friends
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center bg-background-elevated rounded-xl px-3 border border-border-divider">
              <Ionicons
                name="location-outline"
                size={20}
                color="var(--color-primary)"
              />
              <TextInput
                className="flex-1 p-3 text-base text-text-primary"
                placeholder="Place (e.g. Starburst Cafe, Eiffel Tower)"
                placeholderTextColor="var(--color-text-disabled)"
                value={venueName}
                onChangeText={onVenueSearch}
              />
              {isSearchingVenue && (
                <ActivityIndicator size="small" color="var(--color-primary)" />
              )}
            </View>

            {(postCity || postCountry) && (
              <View className="flex-row items-center mt-2 px-1">
                <View className="bg-brand-primary/10 px-2.5 py-1 rounded-full border border-brand-primary flex-row items-center">
                  <Ionicons
                    name="map-outline"
                    size={12}
                    color="var(--color-primary)"
                  />
                  <Text className="text-[11px] text-brand-primary font-medium ml-1">
                    {[postCity, postCountry].filter(Boolean).join(", ")}
                  </Text>
                </View>
              </View>
            )}

            {venueResults.length > 0 && (
              <View className="bg-background-surface rounded-xl mt-1 border border-border-divider overflow-hidden shadow-custom">
                {venueResults.map((item, index) => {
                  const primaryLabel = item.text ?? item.place_name ?? "";
                  return (
                    <TouchableOpacity
                      key={item.place_id || item.id || index}
                      className="flex-row items-center p-3 border-b border-border-divider gap-2.5 active:bg-background-elevated"
                      onPress={() => onSelectVenue(item)}
                    >
                      <Ionicons
                        name="pin-outline"
                        size={16}
                        color="var(--color-text-secondary)"
                      />
                      <View className="flex-1">
                        <Text
                          className="text-[14px] font-semibold text-text-primary"
                          numberOfLines={1}
                        >
                          {primaryLabel}
                        </Text>
                        {item.place_name &&
                          item.place_name !== primaryLabel && (
                            <Text
                              className="text-[11px] text-text-secondary"
                              numberOfLines={1}
                            >
                              {item.place_name}
                            </Text>
                          )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View className="flex-row items-center bg-background-elevated rounded-xl px-3 border border-border-divider mt-3">
              <Ionicons
                name="globe-outline"
                size={20}
                color="var(--color-primary)"
              />
              <TextInput
                className="flex-1 p-3 text-base text-text-primary"
                placeholder="Search location..."
                placeholderTextColor="var(--color-text-disabled)"
                value={locationName}
                onChangeText={onLocationSearch}
              />
              {isSearchingLocation && (
                <ActivityIndicator size="small" color="var(--color-primary)" />
              )}
            </View>

            {locationResults.length > 0 && (
              <View className="bg-background-surface rounded-xl mt-1 border border-border-divider overflow-hidden shadow-custom">
                {locationResults.map((item, index) => {
                  const primaryLabel = item.text ?? item.place_name ?? "";
                  return (
                    <TouchableOpacity
                      key={item.place_id || item.id || index}
                      className="flex-row items-center p-3 border-b border-border-divider gap-2.5 active:bg-background-elevated"
                      onPress={() => onSelectLocation(item)}
                    >
                      <Ionicons
                        name="map-outline"
                        size={16}
                        color="var(--color-text-secondary)"
                      />
                      <View className="flex-1">
                        <Text
                          className="text-[14px] font-semibold text-text-primary"
                          numberOfLines={1}
                        >
                          {primaryLabel}
                        </Text>
                        {item.place_name &&
                          item.place_name !== primaryLabel && (
                            <Text
                              className="text-[11px] text-text-secondary"
                              numberOfLines={1}
                            >
                              {item.place_name}
                            </Text>
                          )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View className="pt-5 border-t border-border-divider">
            <TouchableOpacity
              className="bg-brand-primary active:bg-brand-primary-pressed p-3.5 rounded-xl items-center shadow-custom"
              onPress={onCreatePost}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-text-on-primary font-bold text-lg">
                  Share Post
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
