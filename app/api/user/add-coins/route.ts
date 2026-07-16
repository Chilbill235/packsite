import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from 'web-push';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { balance: { increment: 500 } }
    });

    // Use keys without NEXT_PUBLIC_ prefix
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (publicKey && privateKey) {
      webpush.setVapidDetails('mailto:admin@packsite.com', publicKey, privateKey);

      const subscriptions = await prisma.subscription.findMany({ 
        where: { user: { email: session.user.email } } 
      });

      await Promise.all(subscriptions.map(async (sub) => {
        try {
          // --- FIX: Include the exact payload flags expected by the Service Worker ---
          await webpush.sendNotification(sub.data as any, JSON.stringify({
            title: "💎 Coins Claimed! 💎",
            body: "🪙 You just received 500 coins. 🪙",
            url: "/shop?ref=reward-claim",
            tag: "reward-claim-ready",
            isAdTimer: true
          }));
        } catch (err: any) {
          if (err.statusCode === 410) {
            await prisma.subscription.delete({ where: { id: sub.id } });
          }
        }
      }));
    }

    return NextResponse.json({ newBalance: updatedUser.balance });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}