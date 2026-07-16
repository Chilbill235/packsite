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

    // 1. Update the user's balance and reset the reward flag to false
    // This prevents users from repeatedly claiming the same ad reward.
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { 
        balance: { increment: 500 },
        pendingReward: false 
      }
    });

    // 2. Fetch VAPID keys
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY || process.env.PRIVATE_VAPID_KEY;

    if (publicKey && privateKey) {
      webpush.setVapidDetails('mailto:admin@packsite.com', publicKey, privateKey);

      // 3. Find subscription using findFirst to avoid Schema/Client validation errors
      const subscription = await prisma.subscription.findFirst({ 
        where: { userId } 
      });

      if (subscription) {
        console.log(`[Push Service] Active subscription record found for user: ${userId}`);

        try {
          const payload = JSON.stringify({
            title: "💎 Coins Claimed! 💎",
            body: "🪙 You just received 500 coins.",
            url: "/shop",
            tag: "reward-claim-ready"
          });

          const pushSubscription = typeof subscription.data === 'string' 
            ? JSON.parse(subscription.data) 
            : subscription.data;

          await webpush.sendNotification(pushSubscription, payload);
          console.log(`[Push Service] Successfully dispatched push.`);

        } catch (err: any) {
          console.error(`[Push Service] Failed to send to user ${userId}:`, err);
          
          // Cleanup expired or dead browser endpoints
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[Push Service] Removing expired subscription.`);
            await prisma.subscription.delete({ where: { id: subscription.id } });
          }
        }
      }
    } else {
      console.warn("[Push Service] Skipping push dispatch: VAPID keys missing.");
    }

    return NextResponse.json({ newBalance: updatedUser.balance });
  } catch (error) {
    console.error("[Add Coins Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}