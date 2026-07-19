// lib/notificationService.ts

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

export function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export type PermissionDetail =
  | "granted"
  | "denied"
  | "default"
  | "unsupported"
  | "ios-needs-pwa";

export function getPermissionDetail(): PermissionDetail {
  if (typeof window === 'undefined') return "unsupported";

  // iOS Safari non-standalone - can't push at all
  if (isIOS() && !isInStandaloneMode()) {
    return "ios-needs-pwa";
  }

  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as PermissionDetail;
}

// Track if OneSignal login has been attempted for this session to prevent duplicates
let loginAttempted = false;

export const OneSignalNotificationService = {
  waitForInit: async (timeout = 10000): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
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

  login: async (externalId: string, maxRetries = 3) => {
    if (typeof window === 'undefined') return;
    if (!externalId) return;
    
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
        return; 
      } catch (error) {
        if (i === maxRetries - 1) {
          console.error('OneSignal login error after', maxRetries, 'attempts:', error);
          return;
        }
        await new Promise(res => setTimeout(res, 1000));
      }
    }
  },

  requestPermission: async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    const detail = getPermissionDetail();

    // iOS non-standalone - silently fail (UI should show "ios-needs-pwa" guidance instead)
    if (detail === "ios-needs-pwa") {
      console.log("[OneSignal] iOS Safari requires PWA to be added to Home Screen for push notifications.");
      return false;
    }

    // Already granted
    if (detail === "granted") return true;

    // Already denied / unsupported
    if (detail === "denied" || detail === "unsupported") return false;

    // detail === "default" - proceed with OneSignal SDK
    const initialized = await OneSignalNotificationService.waitForInit();
    if (!initialized) {
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

  getPermissionDetail: (): PermissionDetail => getPermissionDetail(),

  getPermissionStatus: (): NotificationPermission | "unsupported" => {
    if (typeof window === 'undefined' ) return "unsupported";
    const detail = getPermissionDetail();
    if (detail === 'ios-needs-pwa' ) return 'unsupported';
    if (detail === 'unsupported' ) return 'unsupported';
    return Notification.permission;
  }
};

export const notificationService = OneSignalNotificationService;
