import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface PostsTabsProps {
  activeTab: "posts" | "tagged";
  onTabChange: (tab: "posts" | "tagged") => void;
}

export default function PostsTabs({ activeTab, onTabChange }: PostsTabsProps) {
  return (
    <View className="flex-row mb-4 bg-background-surface rounded-2xl p-1.5 border border-border-divider">
      <TouchableOpacity
        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl gap-2 ${
          activeTab === "posts" ? "bg-brand-primary/10" : ""
        }`}
        onPress={() => onTabChange("posts")}
      >
        <Ionicons
          name="grid-outline"
          size={20}
          className={
            activeTab === "posts" ? "text-brand-primary" : "text-text-secondary"
          }
        />
        <Text
          className={`text-sm font-semibold ${
            activeTab === "posts" ? "text-brand-primary" : "text-text-secondary"
          }`}
        >
          My Posts
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl gap-2 ${
          activeTab === "tagged" ? "bg-brand-primary/10" : ""
        }`}
        onPress={() => onTabChange("tagged")}
      >
        <Ionicons
          name="people-outline"
          size={20}
          className={
            activeTab === "tagged"
              ? "text-brand-primary"
              : "text-text-secondary"
          }
        />
        <Text
          className={`text-sm font-semibold ${
            activeTab === "tagged"
              ? "text-brand-primary"
              : "text-text-secondary"
          }`}
        >
          Tagged
        </Text>
      </TouchableOpacity>
    </View>
  );
}
