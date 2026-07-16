import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from 'web-push';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const userId = session.user.id;

    // 1. Update the user's balance
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { balance: { increment: 500 } }
    });

    // 2. Fetch VAPID keys to verify config
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY || process.env.PRIVATE_VAPID_KEY;

    if (publicKey && privateKey) {
      webpush.setVapidDetails('mailto:admin@packsite.com', publicKey, privateKey);

      // 3. Find subscription by userId to match how it's saved in your /api/user/subscribe endpoint
      const subscription = await prisma.subscription.findUnique({ 
        where: { userId } 
      });

      if (subscription) {
        console.log(`[Push Service] Active subscription record found in DB for user ID: ${userId}`);

        try {
          // 4. Construct the payload matching what the Service Worker listens for
          const payload = JSON.stringify({
            title: "💎 Coins Claimed! 💎",
            body: "🪙 You just received 500 coins.",
            url: "/shop?ref=reward-claim",
            tag: "reward-claim-ready"
          });

          // Ensure database data is cast cleanly
          const pushSubscription = typeof subscription.data === 'string' 
            ? JSON.parse(subscription.data) 
            : subscription.data;

          // 5. Send the push notification
          await webpush.sendNotification(pushSubscription, payload);
          console.log(`[Push Service] Successfully dispatched push to endpoint: ${pushSubscription.endpoint}`);

        } catch (err: any) {
          console.error(`[Push Service] Failed to send to subscription for user ID ${userId}:`, err);
          
          // Cleanup expired or dead browser endpoints
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[Push Service] Removing expired subscription for user ID: ${userId}`);
            await prisma.subscription.delete({ where: { userId } });
          }
        }
      } else {
        console.warn(`[Push Service] No active subscription record found in DB for user ID: ${userId}. (Did they enable notifications?)`);
      }
    } else {
      console.warn("[Push Service] Skipping push dispatch: VAPID keys are missing from environment variables.");
    }

    return NextResponse.json({ newBalance: updatedUser.balance });
  } catch (error) {
    console.error("[Add Coins Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}