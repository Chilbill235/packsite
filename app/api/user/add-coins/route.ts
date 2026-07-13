import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from 'web-push';

// Ensure your environment variables are set correctly
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Update user balance
  const updatedUser = await prisma.user.update({
    where: { email: session.user.email },
    data: { balance: { increment: 500 } }
  });

  // Find all subscriptions
  const subscriptions = await prisma.subscription.findMany({ 
    where: { user: { email: session.user.email } } 
  });

  // Trigger push notifications
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

  return NextResponse.json({ newBalance: updatedUser.balance });
}