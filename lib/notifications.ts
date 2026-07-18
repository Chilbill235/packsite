// lib/notifications.ts
export async function sendPushNotification(
  userId: string, 
  title: string, 
  message: string, 
  ref: string = ""
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://packsite.vercel.app";
    const appId = process.env.ONESIGNAL_APP_ID || process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;
    const notificationUrl = `${baseUrl}/shop${ref ? `?ref=${ref}` : ""}`;

    if (!appId || !apiKey) {
      console.error("[OneSignal Config Error]: Missing app id or REST API key.");
      return {
        success: false,
        data: {
          error: "Missing OneSignal configuration",
          missing: {
            appId: !appId,
            apiKey: !apiKey,
          },
        },
      };
    }

    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
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
