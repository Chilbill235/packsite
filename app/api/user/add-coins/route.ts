import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from 'web-push';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get the dynamic amount from the request body
    // If not provided, it defaults to 500
    const body = await request.json();
    const amount = typeof body.amount === 'number' ? body.amount : 500;

    const email = session.user.email;
    const userId = session.user.id;

    // 2. Update the user's balance
    // Note: removed pendingReward check so this can be used for any bonus type
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { 
        balance: { increment: amount }
      }
    });

    // 3. Fetch VAPID keys
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY || process.env.PRIVATE_VAPID_KEY;

    if (publicKey && privateKey) {
      webpush.setVapidDetails('mailto:admin@packsite.com', publicKey, privateKey);

      // 4. Find subscription
      const subscription = await prisma.subscription.findFirst({ 
        where: { userId } 
      });

      if (subscription) {
        try {
          // 5. Send notification with dynamic amount
          const payload = JSON.stringify({
            title: "💎 Coins Claimed! 💎",
            body: `🪙 You just received ${amount} coins.`,
            url: "/shop",
            tag: "reward-claim-ready"
          });

          const pushSubscription = typeof subscription.data === 'string' 
            ? JSON.parse(subscription.data) 
            : subscription.data;

          await webpush.sendNotification(pushSubscription, payload);
        } catch (err: any) {
          console.error(`[Push Service] Failed to send to user ${userId}:`, err);
          // If subscription is invalid, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.subscription.delete({ where: { id: subscription.id } });
          }
        }
      }
    }

    return NextResponse.json({ newBalance: updatedUser.balance });
  } catch (error) {
    console.error("[Add Coins Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}