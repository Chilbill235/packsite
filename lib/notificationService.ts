// lib/notificationService.ts

/**
 * Interface to support TypeScript for the OneSignal window object
 */
declare global {
  interface Window {
    OneSignal: any;
  }
}

export const OneSignalNotificationService = {
  /**
   * Logs a user into OneSignal safely using the required push pattern.
   */
  login: async (externalId: string, maxRetries = 3) => {
    // Ensure we are in a browser environment
    if (typeof window === 'undefined') return;

    // Initialize the OneSignal array if not already present
    window.OneSignal = window.OneSignal || [];

    for (let i = 0; i < maxRetries; i++) {
      try {
        // Use the .push() pattern to safely queue the login command
        await new Promise<void>((resolve, reject) => {
          window.OneSignal.push(() => {
            try {
              window.OneSignal.login(externalId);
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
        // Wait 1 second before retrying[cite: 1]
        await new Promise(res => setTimeout(res, 1000));
      }
    }
  },

  /**
   * Requests notification permission from the user.
   */
  requestPermission: async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.OneSignal) return false;
    
    return new Promise((resolve) => {
      window.OneSignal.push(async () => {
        try {
          await window.OneSignal.Notifications.requestPermission();
          resolve(Notification.permission === 'granted');
        } catch (e) {
          console.error("Permission request failed", e);
          resolve(false);
        }
      });
    });
  }
};

// Explicit export to resolve the 'import { notificationService }' error in page.tsx[cite: 1]
export const notificationService = OneSignalNotificationService;