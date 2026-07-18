// app/api/send-notification/route.ts
import { NextResponse, NextRequest } from "next/server";
import { sendPushNotification } from "@/lib/notifications"; // Use the same helper

export async function POST(request: NextRequest) {
  try {
    const { userId, title, message, ref } = await request.json();

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await sendPushNotification(userId, title, message, ref);

    if (!result.success) {
      return NextResponse.json({ error: "Notification failed", details: result.data }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
