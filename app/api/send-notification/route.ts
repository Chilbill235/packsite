import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, title, message, ref } = await request.json();

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure we have a valid base URL. Fallback to production if env var is missing.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://packsite.vercel.app";
    
    // Explicitly build the URL: only append query params if ref is a valid string
    let notificationUrl = `${baseUrl}/shop`;
    if (ref && typeof ref === 'string') {
      notificationUrl += `?ref=${ref}`;
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        target_channel: "push", 
        include_aliases: {
          "external_id": [userId]
        },
        headings: { en: title },
        contents: { en: message },
        url: notificationUrl, // Now an absolute, fully formed URL[cite: 1]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[OneSignal API Error]:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: "Notification failed", details: data }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Notification Service Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}