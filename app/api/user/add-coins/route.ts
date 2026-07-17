import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = typeof body.amount === 'number' ? body.amount : 500;
    const userId = session.user.id;

    // 1. Update DB (Atomic update)
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { 
        balance: { increment: amount },
        pendingReward: false
      }
    });

    // 2. Call your internal notification service
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          title: "💎 Coins Claimed! 💎",
          message: `🪙 You just received ${amount} coins.`,
          ref: "reward-claim"
        }),
      });
    } catch (err) {
      console.error("[Notification Trigger Failed]:", err);
    }

    return NextResponse.json({ newBalance: updatedUser.balance });
  } catch (error) {
    console.error("[Add Coins Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}