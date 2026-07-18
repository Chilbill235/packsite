// Define OneSignal on the Window interface to prevent TypeScript errors
declare global {
  interface Window {
    OneSignal: any;
  }
}

class NotificationService {
  private isInitialized = false;

  /**
   * Requests permission from the browser to display notifications.
   * Returns true if permission is granted, false otherwise.
   */
  public async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Notifications are not supported in this environment.");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  /**
   * Logs the user into the notification service (OneSignal) using their unique ID.
   * @param userId The ID of the authenticated user
   */
  public async login(userId: string): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      // The service worker utilizes OneSignal SDK for campaign deliveries
      if (window.OneSignal) {
        await window.OneSignal.login(userId);
        console.log(`[NotificationService] User ${userId} logged in successfully.`);
      } else {
        console.warn("[NotificationService] OneSignal is not loaded on the window object.");
      }
    } catch (error) {
      console.error("[NotificationService] Failed to login to notification service:", error);
    }
  }

  /**
   * Optional: Safely initialize OneSignal if it hasn't been initialized elsewhere
   */
  public async initOneSignal(appId: string): Promise<void> {
    if (typeof window === "undefined" || this.isInitialized) return;

    window.OneSignal = window.OneSignal || [];
    window.OneSignal.push(() => {
      window.OneSignal.init({
        appId: appId,
        // Configured to work seamlessly with the custom service worker setup
        notifyButton: {
          enable: false,
        },
      });
    });
    this.isInitialized = true;
  }
}

// Export a singleton instance so the same state is shared across your app
export const notificationService = new NotificationService();