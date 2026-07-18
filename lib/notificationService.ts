export interface NotificationService {
  requestPermission(): Promise<NotificationPermission>;
  login(userId: string): Promise<void>;
  sendNotification(userId: string, title: string, message: string, options?: { ref?: string; url?: string }): Promise<{ success: boolean; data?: any; error?: any }>;
}

export class OneSignalNotificationService implements NotificationService {
  private appId: string;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID || process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';
    this.apiKey = process.env.ONESIGNAL_REST_API_KEY || '';
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://packsite.vercel.app';
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('OneSignal' in window)) {
      return Notification.permission;
    }

    // Try to request permission with retries in case OneSignal isn't fully initialized yet
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const granted = await OneSignal.Notifications.requestPermission();
        return granted ? 'granted' : 'denied';
      } catch (error) {
        if (i === maxRetries - 1) {
          // Last attempt failed
          console.error('OneSignal permission request error after', maxRetries, 'attempts:', error);
          return Notification.permission;
        }
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    // This should never be reached due to the return in the loop, but TypeScript wants it
    return Notification.permission;
  }

  async login(userId: string): Promise<void> {
    if (typeof window === 'undefined' || !('OneSignal' in window)) {
      return;
    }

    // Try to login with retries in case OneSignal isn't fully initialized yet
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await OneSignal.login(userId);
        // If we get here, login succeeded
        return;
      } catch (error) {
        if (i === maxRetries - 1) {
          // Last attempt failed
          console.error('OneSignal login error after', maxRetries, 'attempts:', error);
          return;
        }
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }

  async sendNotification(userId: string, title: string, message: string, options: { ref?: string; url?: string } = {}): Promise<{ success: boolean; data?: any; error?: any }> {
    if (!this.appId || !this.apiKey) {
      console.error('[OneSignal Config Error]: Missing app id or REST API key.');
      return {
        success: false,
        data: { error: 'Missing OneSignal configuration' },
        error: 'Missing OneSignal configuration'
      };
    }

    const notificationUrl = options.url || `${this.baseUrl}/shop${options.ref ? `?ref=${options.ref}` : ''}`;

    try {
      const response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Key ${this.apiKey}`,
        },
        body: JSON.stringify({
          app_id: this.appId,
          target_channel: 'push',
          include_aliases: { external_id: [userId] },
          headings: { en: title },
          contents: { en: message },
          url: notificationUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[OneSignal API Error]:', JSON.stringify(data, null, 2));
        return { success: false, data, error: data.errors?.[0] || 'Unknown OneSignal error' };
      }
      return { success: true, data };
    } catch (error) {
      console.error('[Notification Service Error]:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Default export for backward compatibility - we can later change this to use a different provider
export const notificationService = new OneSignalNotificationService();