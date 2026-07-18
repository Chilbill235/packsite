// Environment variables needed for OneSignal Server-Side API
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "";

/**
 * Sends a push notification to a specific user via OneSignal's REST API.
 * 
 * @param userId The unique ID of the user
 * @param title The title of the push notification
 * @param message The body/content of the push notification
 * @param notificationType Optional type/category passed as custom data
 * @param url Optional URL to open when notification is clicked
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  message: string,
  notificationType?: string,
  url?: string
): Promise<void> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn("[Notifications] Missing OneSignal App ID or REST API Key. Notification skipped.");
    return;
  }

  try {
    const payload: any = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [userId], 
      headings: { en: title },
      contents: { en: message },
    };

    // Build data object with type and optional URL
    const data: any = {};
    if (notificationType) {
      data.type = notificationType;
    }
    if (url) {
      data.url = url;
    }
    
    if (Object.keys(data).length > 0) {
      payload.data = data;
    }

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle OneSignal subscription-10 error gracefully
      const isSubscriptionDisabled = errorData.errors && 
                                     errorData.errors[0] && 
                                     errorData.errors[0].code === 'subscription-10';
      
      if (isSubscriptionDisabled) {
        console.warn(
          "[Notifications] User subscription is disabled:",
          { userId, notificationType, error: errorData.errors[0] }
        );
      } else {
        console.error(
          "[Notifications] OneSignal API Error:",
          errorData
        );
      }
      return;
    }

    console.log(`[Notifications] Successfully sent push notification to user: ${userId}`);
  } catch (error) {
    console.error("[Notifications] Failed to send push notification:", error);
  }
}