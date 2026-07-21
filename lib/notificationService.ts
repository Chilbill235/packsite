declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
    OneSignal?: any;
  }
}

/**
 * Safely request notification permission using OneSignal SDK with Native Browser Fallback
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "default";
  }

  if (Notification.permission !== "default") {
    return Notification.permission;
  }

  try {
    const permission = await Notification.requestPermission();

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        if (OneSignal?.Notifications?.requestPermission) {
          await OneSignal.Notifications.requestPermission();
        }
      } catch (err) {
        console.warn("[Notification Service] OneSignal permission sync warning:", err);
      }
    });

    return permission;
  } catch (error) {
    console.error("[Notification Service] Request permission error:", error);
    return Notification.permission;
  }
}

/**
 * Helper function to safely wait for OneSignal.init() to complete before running operations
 */
function runAfterOneSignalInit(callback: (OneSignal: any) => void | Promise<void>, attempts = 0) {
  if (typeof window === "undefined") return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];

  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      if (!OneSignal) return;

      // Safely poll if OneSignal's internal User context / LoginManager is not ready
      if (!OneSignal.User && attempts < 15) {
        setTimeout(() => {
          runAfterOneSignalInit(callback, attempts + 1);
        }, 300);
        return;
      }

      await callback(OneSignal);
    } catch (error) {
      console.warn("[Notification Service] Deferred execution warning:", error);
    }
  });
}

/**
 * Log a user into OneSignal safely for external ID targeting.
 */
export async function loginToOneSignal(
  externalUserId: string | number | undefined | null
): Promise<void> {
  if (typeof window === "undefined" || !externalUserId) return;

  const userIdString = String(externalUserId).trim();
  if (!userIdString || userIdString === "undefined" || userIdString === "null") return;

  runAfterOneSignalInit(async (OneSignal) => {
    try {
      // Check if user is already logged in
      if (OneSignal.User?.externalId === userIdString) return;

      // OneSignal v16 API uses OneSignal.User.login()
      if (typeof OneSignal.User?.login === "function") {
        await OneSignal.User.login(userIdString);
        console.log(`[Notification Service] Logged in user: ${userIdString}`);
      } else if (typeof OneSignal.login === "function") {
        // Fallback for older OneSignal versions
        await OneSignal.login(userIdString);
        console.log(`[Notification Service] Logged in user: ${userIdString}`);
      }
    } catch (error) {
      console.warn("[Notification Service] Login bypassed safely:", error);
    }
  });
}

/**
 * Log out current user from OneSignal safely.
 */
export async function logoutFromOneSignal(): Promise<void> {
  if (typeof window === "undefined") return;

  runAfterOneSignalInit(async (OneSignal) => {
    try {
      // OneSignal v16 uses OneSignal.User.logout()
      if (typeof OneSignal.User?.logout === "function") {
        await OneSignal.User.logout();
        console.log("[Notification Service] Logged out successfully.");
      } else if (typeof OneSignal.logout === "function") {
        // Fallback for older OneSignal versions
        await OneSignal.logout();
        console.log("[Notification Service] Logged out successfully.");
      }
    } catch (error) {
      console.warn("[Notification Service] Logout bypassed safely:", error);
    }
  });
}

export const notificationService = {
  requestPermission,
  login: loginToOneSignal,
  logout: logoutFromOneSignal,
};

export default notificationService;