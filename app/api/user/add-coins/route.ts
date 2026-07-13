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

    // 1. Update balance
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { balance: { increment: 500 } }
    });

    // 2. Trigger push notifications
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (publicKey && privateKey) {
      webpush.setVapidDetails('mailto:admin@packsite.com', publicKey, privateKey);

      const subscriptions = await prisma.subscription.findMany({ 
        where: { user: { email: session.user.email } } 
      });

      await Promise.all(
        subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(sub.data as any, JSON.stringify({
              title: "Coins Claimed! 💎",
              body: "You just received 500 coins.",
              url: "/shop"
            }));
          } catch (err: any) {
            // Automatically remove expired subscriptions
            if (err.statusCode === 410) {
              await prisma.subscription.delete({ where: { id: sub.id } });
            }
          }
        })
      );
    }

    return NextResponse.json({ newBalance: updatedUser.balance });
  } catch (error) {
    console.error("API Error in /add-coins:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}