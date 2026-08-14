import { CustomTabBar } from "@/components/ui/CustomTabBar";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen
        name="map/index"
        options={{
          title: "Map",
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: "Activities",
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
      {/* Hide the old index tab */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
