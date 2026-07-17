// lib/notifications.ts
export async function sendPushNotification(
  userId: string, 
  title: string, 
  message: string, 
  ref: string = ""
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://packsite.vercel.app";
    const notificationUrl = `${baseUrl}/shop${ref ? `?ref=${ref}` : ""}`;

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        target_channel: "push",
        include_aliases: { "external_id": [userId] },
        headings: { en: title },
        contents: { en: message },
        url: notificationUrl,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("[OneSignal API Error]:", JSON.stringify(data, null, 2));
      return { success: false, data };
    }
    return { success: true, data };
  } catch (error) {
    console.error("[Notification Service Error]:", error);
    return { success: false, error };
  }
}