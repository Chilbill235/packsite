// app/api/send-notification/route.ts
import { NextResponse, NextRequest } from "next/server";
import { sendPushNotification } from "@/lib/notifications";

interface NotificationData {
  ref?: string;
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, message, notificationType, url, ref, type } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const resolvedType = notificationType || ref || type;
    
    // Create an object to hold metadata to be sent to OneSignal
    const additionalData: NotificationData = { 
        ref: resolvedType,
        url: url 
    };

    // Pass the additionalData to your helper function
    await sendPushNotification(userId, title, message, additionalData.ref, additionalData.url);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[send-notification] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}