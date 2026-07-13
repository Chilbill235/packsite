import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from 'web-push';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update user balance first - this is the core requirement
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { balance: { increment: 500 } }
    });

    // Optional: Only attempt push if keys are actually present
    if (process.env.VAPID_SUBJECT && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      try {
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT,
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );

        const subscriptions = await prisma.subscription.findMany({ 
          where: { user: { email: session.user.email } } 
        });

        if (subscriptions.length > 0) {
          await Promise.all(
            subscriptions.map(sub => 
              webpush.sendNotification(sub.data as any, JSON.stringify({
                title: "Coins Claimed!",
                body: "You just received 500 coins."
              })).catch(err => console.error("Push failed:", err))
            )
          );
        }
      } catch (pushErr) {
        console.error("Non-fatal push notification error:", pushErr);
      }
    }

    return NextResponse.json({ newBalance: updatedUser.balance });
  } catch (error) {
    console.error("API Error in /add-coins:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}