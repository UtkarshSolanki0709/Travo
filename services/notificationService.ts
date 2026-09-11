import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";

// Configure how notifications appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  /**
   * Requests device permissions and registers Expo Push Token
   */
  async registerForPushNotificationsAsync(userId?: string): Promise<string | null> {
    if (Platform.OS === "web") return null;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        return null;
      }

      // If running on Android, set notification channel for high-priority alerts
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("travo-alerts", {
          name: "Travo Alerts",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const token = tokenData.data;

      // Persist push token in Supabase user profile for backend / trigger push delivery
      if (userId && token) {
        try {
          await supabase.from("profiles").upsert(
            {
              user_id: userId,
              push_token: token,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } catch (err) {
          console.warn("Could not update push token in Supabase:", err);
        }
      }

      return token;
    } catch (error) {
      console.warn("Error registering for push notifications:", error);
      return null;
    }
  },

  /**
   * Dispatches an immediate local notification banner/sound
   */
  async presentLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.warn("Failed to schedule local notification:", error);
    }
  },
};
