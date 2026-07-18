// lib/notificationService.ts

// Window.OneSignalDeferred and the PacksiteOneSignal type are declared in
// types/global.d.ts. We use the v16 OneSignalDeferred queue pattern here;
// the legacy window.OneSignal.push() pattern crashes the v16 SDK.

/** Detect iOS device */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

/** Detect if PWA is in standalone mode (added to Home Screen) */
export function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Returns detailed permission state to help UI decide what to show.
 * - "granted" – push allowed
 * - "denied" – user denied or blocked
 * - "default" – not yet asked
 * - "unsupported" – browser doesn't support push at all
 * - "ios-needs-pwa" – iOS Safari not in standalone mode; user must add to Home Screen first
 */
export type PermissionDetail =
  | "granted"
  | "denied"
  | "default"
  | "unsupported"
  | "ios-needs-pwa";

export function getPermissionDetail(): PermissionDetail {
  if (typeof window === 'undefined') return "unsupported";

  // iOS Safari non-standalone → can't push at all
  if (isIOS() && !isInStandaloneMode()) {
    return "ios-needs-pwa";
  }

  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as PermissionDetail;
}

export const OneSignalNotificationService = {
  /**
   * Waits for the OneSignal SDK to be fully initialized.
   * Resolves with the OneSignal instance, or null if initialization fails.
   */
  waitForInit: async (timeout = 10000): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    // If OneSignalDeferred already has items and they've been processed,
    // the SDK should already be available
    if ((window as any).OneSignal && (window as any).OneSignal.init) {
      return true;
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const check = () => {
        if ((window as any).OneSignal && (window as any).OneSignal.init) {
          resolve(true);
          return;
        }
        if (Date.now() - startTime > timeout) {
          console.warn("[OneSignal] SDK init timed out.");
          resolve(false);
          return;
        }
        setTimeout(check, 200);
      };
      check();
    });
  },

  /**
   * Logs a user into OneSignal safely using the required v16 OneSignalDeferred pattern.
   */
  login: async (externalId: string, maxRetries = 3) => {
    // Ensure we are in a browser environment
    if (typeof window === 'undefined') return;

    // Initialize the OneSignalDeferred queue if not already present (v16 pattern)
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    for (let i = 0; i < maxRetries; i++) {
      try {
        await new Promise<void>((resolve, reject) => {
          window.OneSignalDeferred!.push(async (OneSignal) => {
            try {
              await OneSignal.login(externalId);
              console.log("OneSignal login successful for:", externalId);
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });
        return; // Success, exit the function
      } catch (error) {
        if (i === maxRetries - 1) {
          console.error('OneSignal login error after', maxRetries, 'attempts:', error);
          return;
        }
        await new Promise(res => setTimeout(res, 1000));
      }
    }
  },

  /**
   * Requests notification permission from the user.
   * On iOS, this only works when the PWA is added to the home screen (standalone mode).
   * Returns true if permission was granted.
   */
  requestPermission: async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    // Use getPermissionDetail for consistent iOS detection logic
    const detail = getPermissionDetail();

    // iOS non-standalone → silently fail (UI should show "ios-needs-pwa" guidance instead)
    if (detail === "ios-needs-pwa") {
      console.log("[OneSignal] iOS Safari requires PWA to be added to Home Screen for push notifications.");
      return false;
    }

    // Already granted
    if (detail === "granted") return true;

    // Already denied / unsupported
    if (detail === "denied" || detail === "unsupported") return false;

    // detail === "default" → proceed with OneSignal SDK
    // First ensure OneSignal SDK is initialized
    const initialized = await OneSignalNotificationService.waitForInit();
    if (!initialized) {
      // Fallback to standard Notification API if OneSignal isn't ready
      if ("Notification" in window && Notification.permission === "default") {
        const result = await Notification.requestPermission();
        return result === "granted";
      }
      return Notification.permission === "granted";
    }

    return new Promise((resolve) => {
      window.OneSignalDeferred!.push(async (OneSignal) => {
        try {
          await OneSignal.Notifications.requestPermission();
          resolve(Notification.permission === 'granted');
        } catch (e) {
          console.error("Permission request failed", e);
          // Fallback to standard Notification API
          if ("Notification" in window && Notification.permission === "default") {
            const result = await Notification.requestPermission();
            resolve(result === "granted");
          } else {
            resolve(false);
          }
        }
      });
    });
  },

  /**
   * Returns the current notification permission status.
   * On iOS non-standalone, always returns "unsupported".
   */
  getPermissionDetail: (): PermissionDetail => getPermissionDetail(),

  getPermissionStatus: (): NotificationPermission | "unsupported" => {
    if (typeof window === 'undefined' ) return "unsupported";
    const detail = getPermissionDetail();
    if (detail === 'ios-needs-pwa' ) return 'unsupported';
    if (detail === 'unsupported' ) return 'unsupported';
    return Notification.permission;
  }
};

// Explicit export to resolve the 'import { notificationService }' error in page.tsx
export const notificationService = OneSignalNotificationService;
