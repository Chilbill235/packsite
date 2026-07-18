// app/api/send-notification/route.ts
import { NextResponse, NextRequest } from "next/server";
import { sendPushNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const { userId, title, message, notificationType, url } = await request.json();

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await sendPushNotification(userId, title, message, notificationType || "general", url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[send-notification] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
