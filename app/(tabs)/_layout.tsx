import { useUser } from "@clerk/expo";
import { CustomTabBar } from "@/components/ui/CustomTabBar";
import { Tabs } from "expo-router";
import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { flushOutbox } from "@/services/outbox";
import { socketService } from "@/services/socketService";
import { analytics } from "@/services/analytics";

export default function TabLayout() {
  const { user } = useUser();

  
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

  const renderTabBar = useCallback(
    (props: React.ComponentProps<typeof CustomTabBar>) => <CustomTabBar {...props} />,
    [],
  );

  return (
    <Tabs
      tabBar={renderTabBar}
      screenListeners={{
        state: (e) => {
          const state = e.data?.state;
          const route = state?.routes?.[state.index ?? 0];
          if (route?.name) {
            void analytics.track("tab_view", { tab: route.name });
          }
        },
      }}
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
