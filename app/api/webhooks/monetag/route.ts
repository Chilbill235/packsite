import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Reward amount for ad completion
const REWARD_AMOUNT = 50000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // These parameters depend on what you configure in the Monetag dashboard
  const userId = searchParams.get("userId"); 
  const status = searchParams.get("status");

  // Verify the status is "complete" and we have the userId
  if (status === "complete" && userId) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          balance: { increment: REWARD_AMOUNT },
          lastAdWatched: new Date(),
          pendingReward: false
        }
      });
      return NextResponse.json({ 
        message: "Coins awarded successfully",
        newBalance: updatedUser.balance 
      });
    } catch (error) {
      console.error("[Monetag Webhook Error]:", error);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid status" }, { status: 400 });
}
