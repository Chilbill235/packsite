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
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  message: string,
  notificationType?: string // Added optional 4th argument
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

    // If a type was provided (e.g., "reward-claim"), attach it to the notification data payload
    if (notificationType) {
      payload.data = { type: notificationType };
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Notifications] OneSignal API Error:", errorData);
      return;
    }

    console.log(`[Notifications] Successfully sent push notification to user: ${userId}`);
  } catch (error) {
    console.error("[Notifications] Failed to send push notification:", error);
  }
}