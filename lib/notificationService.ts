// lib/notificationService.ts

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

export function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

type OneSignalWindow = {
  OneSignal?: {
    init: () => Promise<void>;
    login: (externalId: string) => Promise<void>;
    Notifications: {
      requestPermission: () => Promise<boolean>;
    };
  };
};

export type PermissionDetail =
  | "granted"
  | "denied"
  | "default"
  | "unsupported"
  | "ios-needs-pwa";

export function getPermissionDetail(): PermissionDetail {
  if (typeof window === 'undefined') return "unsupported";

  // iOS Safari non-standalone - special case that still allows banner to show
  if (isIOS() && !isInStandaloneMode()) {
    // Return 'default' so the notification banner shows on localhost/ngrok
    // The banner UI should handle iOS-specific messaging
    return "default";
  }

  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as PermissionDetail;
}

// Track if OneSignal login has been attempted for this session to prevent duplicates
const loginAttempted = false;

export const OneSignalNotificationService = {
  waitForInit: async (timeout = 10000): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    const win = window as unknown as OneSignalWindow & { OneSignalDeferred?: Array<(os: unknown) => void> };
    
    if (win.OneSignal && typeof win.OneSignal.init === 'function') {
      return true;
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const check = () => {
        if (win.OneSignal && typeof win.OneSignal.init === 'function') {
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

  login: async (externalId: string, maxRetries = 3): Promise<void> => {
    if (typeof window === 'undefined') return;
    if (!externalId) return;
    
     
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    for (let i = 0; i < maxRetries; i++) {
      try {
        await new Promise<void>((resolve, reject) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).OneSignalDeferred!.push(async (OneSignal: any) => {
            try {
              await OneSignal.login(externalId);
              console.log("OneSignal login successful for:", externalId);
              resolve();
            } catch (error: unknown) {
              reject(error);
            }
          });
        });
        return; 
      } catch (error: unknown) {
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

    // iOS non-standalone - still allow banner but request native permission
    if (detail === "default" && isIOS() && !isInStandaloneMode()) {
      console.log("[OneSignal] iOS Safari - requesting native notification permission.");
      if ("Notification" in window && Notification.permission === "default") {
        const result = await Notification.requestPermission();
        return result === "granted";
      }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).OneSignalDeferred!.push(async (OneSignal: any) => {
        try {
          await OneSignal.Notifications.requestPermission();
          resolve(Notification.permission === 'granted');
        } catch (e: unknown) {
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
    if (detail === 'default' ) return 'default';  // iOS still shows as default to allow banner
    if (detail === 'unsupported' ) return 'unsupported';
    return Notification.permission;
  }
};

export const notificationService = OneSignalNotificationService;
