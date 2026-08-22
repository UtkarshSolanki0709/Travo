import { useUser } from "@clerk/expo";
import { CustomTabBar } from "@/components/ui/CustomTabBar";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { AppState } from "react-native";
import { flushOutbox } from "@/services/outbox";
import { socketService } from "@/services/socketService";

export default function TabLayout() {
  const { user } = useUser();

  // Offline outbox: retry unsent messages when the app foregrounds
  // or the chat socket (re)connects.
  useEffect(() => {
    if (!user?.id) return;
    const tryFlush = () => flushOutbox(user.id);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") tryFlush();
    });
    const offReconnect = socketService.onReconnect(tryFlush);
    tryFlush();

    return () => {
      sub.remove();
      offReconnect();
    };
  }, [user?.id]);

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
