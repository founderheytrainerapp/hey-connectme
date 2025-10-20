import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EXPO_PUSH_TOKEN_KEY = "expo_push_token";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  sound?: boolean;
  badge?: number;
  categoryIdentifier?: string;
}

export interface ScheduledNotificationInput {
  title: string;
  body: string;
  data?: any;
  trigger: Notifications.NotificationTriggerInput;
  categoryIdentifier?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<void> {
    try {
      await this.registerForPushNotifications();
      this.setupNotificationCategories();
    } catch (error) {
      console.error("Failed to initialize notification service:", error);
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn("Must use physical device for Push Notifications");
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Push notification permission denied");
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId:
          process.env.PROJECT_ID || "87b4a87b-5e77-45c4-9ac8-de32ed9c38b9",
      });

      this.expoPushToken = tokenData.data;

      // Store token locally
      await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, this.expoPushToken);

      // Configure Android notification channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
          sound: "default",
        });

        // Create additional channels for different notification types
        await Notifications.setNotificationChannelAsync("workouts", {
          name: "Workout Reminders",
          importance: Notifications.AndroidImportance.HIGH,
          description: "Notifications about workout reminders and progress",
          vibrationPattern: [0, 250, 250, 250],
          sound: "default",
        });

        await Notifications.setNotificationChannelAsync("progress", {
          name: "Progress Updates",
          importance: Notifications.AndroidImportance.DEFAULT,
          description: "Updates about your fitness progress",
          sound: "default",
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error("Error registering for push notifications:", error);
      return null;
    }
  }

  private setupNotificationCategories(): void {
    // Define notification categories with actions
    Notifications.setNotificationCategoryAsync("workout_reminder", [
      {
        identifier: "start_workout",
        buttonTitle: "Start Workout",
        options: { opensAppToForeground: true },
      },
      {
        identifier: "snooze",
        buttonTitle: "Snooze 10min",
        options: { opensAppToForeground: false },
      },
    ]);

    Notifications.setNotificationCategoryAsync("progress_update", [
      {
        identifier: "view_progress",
        buttonTitle: "View Progress",
        options: { opensAppToForeground: true },
      },
    ]);
  }

  async getExpoPushToken(): Promise<string | null> {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    try {
      const storedToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
      if (storedToken) {
        this.expoPushToken = storedToken;
        return storedToken;
      }

      return await this.registerForPushNotifications();
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  }

  async sendLocalNotification(
    notification: NotificationData
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
          badge: notification.badge,
          categoryIdentifier: notification.categoryIdentifier,
        },
        trigger: null, // Send immediately
      });

      return identifier;
    } catch (error) {
      console.error("Error sending local notification:", error);
      return null;
    }
  }

  async scheduleNotification(
    notification: ScheduledNotificationInput
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: true,
          categoryIdentifier: notification.categoryIdentifier,
        },
        trigger: notification.trigger,
      });

      return identifier;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      return null;
    }
  }

  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error("Error canceling notification:", error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error canceling all notifications:", error);
    }
  }

  async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error getting scheduled notifications:", error);
      return [];
    }
  }

  // Helper methods for common notification types
  async scheduleWorkoutReminder(
    title: string,
    body: string,
    date: Date
  ): Promise<string | null> {
    return this.scheduleNotification({
      title,
      body,
      trigger: { date } as Notifications.DateTriggerInput,
      categoryIdentifier: "workout_reminder",
      data: { type: "workout_reminder" },
    });
  }

  async scheduleProgressUpdate(
    title: string,
    body: string,
    intervalSeconds: number
  ): Promise<string | null> {
    return this.scheduleNotification({
      title,
      body,
      trigger: { seconds: intervalSeconds, repeats: true } as Notifications.TimeIntervalTriggerInput,
      categoryIdentifier: "progress_update",
      data: { type: "progress_update" },
    });
  }

  async checkPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.getPermissionsAsync();
  }

  async requestPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.requestPermissionsAsync();
  }

  // Badge management
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error("Error setting badge count:", error);
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }
}

export const notificationService = new NotificationService();
