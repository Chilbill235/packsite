import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updatedUser = await prisma.user.update({
    where: { email: session.user.email },
    data: { balance: { increment: 500 } }
  });

  // Find all subscriptions for this user
  const subscriptions = await prisma.subscription.findMany({ 
    where: { user: { email: session.user.email } } 
  });

  // Trigger push notifications
  subscriptions.forEach(sub => {
    webpush.sendNotification(sub.data as any, JSON.stringify({
      title: "Coins Claimed!",
      body: "You just received 500 coins."
    })).catch(console.error);
  });

  return NextResponse.json({ newBalance: updatedUser.balance });
}