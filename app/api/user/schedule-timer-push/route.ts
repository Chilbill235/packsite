import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from 'web-push';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { delayMs, title, body: msgBody, url, tag } = body;

    // Use the provided delay (e.g., 10000ms), fallback to 10 seconds if empty
    const delay = delayMs || 10000; 

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY || process.env.PRIVATE_VAPID_KEY;

    if (!publicKey || !privateKey) {
      console.error("[Schedule Push] VAPID keys are missing from environment variables");
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    webpush.setVapidDetails('mailto:admin@packsite.com', publicKey, privateKey);

    // Look up the database subscription for the user ID
    const subscription = await prisma.subscription.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { user: { email: session.user.email || "" } }
        ]
      }
    });

    if (!subscription) {
      console.warn(`[Schedule Push] No active subscription record found in DB for user ID: ${session.user.id}`);
      return NextResponse.json(
        { error: "No notification subscription found. Please enable alerts first." }, 
        { status: 404 }
      );
    }

    console.log(`[Schedule Push] Scheduling push notification for user ${session.user.id} to fire in ${delay}ms...`);

    // Run the scheduler in a non-blocking background timeout
    setTimeout(async () => {
      try {
        const payload = JSON.stringify({
          title: title || "⏱️ Timer Complete! ⏱️",
          body: msgBody || "Your claim is ready. Tap to collect your 500 coins!",
          url: url || "/shop?ref=reward-claim",
          tag: tag || "timer-complete"
        });

        // Safe JSON parsing regardless of whether your Prisma connector stores it as string or JSON object
        const pushConfig = typeof subscription.data === 'string'
          ? JSON.parse(subscription.data)
          : subscription.data;

        await webpush.sendNotification(pushConfig, payload);
        console.log(`[Schedule Push] Successfully delivered scheduled push to user ID: ${session.user.id}`);
      } catch (err: any) {
        console.error(`[Schedule Push Error] Failed to deliver scheduled notification:`, err);
        
        // Clean up expired or stale subscription endpoints automatically
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[Schedule Push] Deleting expired subscription ID: ${subscription.id}`);
          await prisma.subscription.delete({ where: { id: subscription.id } });
        }
      }
    }, delay);

    return NextResponse.json({ success: true, message: `Notification scheduled in ${delay}ms` });
  } catch (error) {
    console.error("[Schedule Push API Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}