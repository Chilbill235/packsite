// app/api/user/add-coins/route.ts
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = typeof body.amount === 'number' ? body.amount : 500;
    const suppressNotification = body.suppressNotification === true;
    const userId = session.user.id;

    // Update DB
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { 
        balance: { increment: amount },
        pendingReward: false
      }
    });

    // Trigger notification only if not suppressed
    if (!suppressNotification) {
      await sendPushNotification(
        userId,
        "Coins Claimed!",
        "You received " + amount + " coins!",
        "reward-claim",
        "/shop?ref=reward-claim"
      ).catch(err => console.warn("Notification send failed:", err));
    }

    return NextResponse.json({ newBalance: updatedUser.balance });
  } catch (error) {
    console.error("[Add Coins Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
