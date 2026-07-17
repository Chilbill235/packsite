// app/api/user/add-coins/route.ts
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/notifications"; // Import the helper

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = typeof body.amount === 'number' ? body.amount : 500;
    const userId = session.user.id;

    // 1. Update DB
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { 
        balance: { increment: amount },
        pendingReward: false
      }
    });

    // 2. Trigger notification directly (No internal network fetch needed!)
    await sendPushNotification(
      userId,
      "💎 Coins Claimed! 💎",
      `🪙 You just received ${amount} coins.`,
      "reward-claim"
    );

    return NextResponse.json({ newBalance: updatedUser.balance });
  } catch (error) {
    console.error("[Add Coins Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}