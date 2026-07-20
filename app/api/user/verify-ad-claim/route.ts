import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/notifications";

// Cooldown period: exactly 10 minutes in milliseconds
const REWARD_COOLDOWN_MS = 10 * 60 * 1000;
const REWARD_AMOUNT = 50000;

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ eligible: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        pendingReward: true,
        lastAdWatched: true 
      }
    });

    const now = Date.now();
    const timeSinceLastWatch = user?.lastAdWatched ? now - user.lastAdWatched.getTime() : REWARD_COOLDOWN_MS;
    const cooldownMs = Math.max(0, REWARD_COOLDOWN_MS - timeSinceLastWatch);
    const isOnCooldown = cooldownMs > 0;

    return NextResponse.json({ 
      eligible: !!user?.pendingReward,
      onCooldown: isOnCooldown,
      cooldownMs
    });
  } catch (error) {
    console.error("[Verify Ad Claim Error]:", error);
    return NextResponse.json({ eligible: false, onCooldown: false }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        balance: true,
        lastAdWatched: true 
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    if (currentUser.lastAdWatched) {
      const timeSinceLastWatch = now.getTime() - currentUser.lastAdWatched.getTime();
      
      if (timeSinceLastWatch < REWARD_COOLDOWN_MS) {
        const remainingMs = REWARD_COOLDOWN_MS - timeSinceLastWatch;
        const minutes = Math.floor(remainingMs / (60 * 1000));
        const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

        return NextResponse.json({ 
          error: `Reward on cooldown. Available in ${minutes}m ${seconds}s.`,
          cooldownMs: remainingMs,
          success: false
        }, { status: 429 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { 
        balance: { increment: REWARD_AMOUNT },
        lastAdWatched: now,
        pendingReward: false
      }
    });

    await sendPushNotification(
      session.user.id,
      "50,000 Coins Claimed!",
      `You received ${REWARD_AMOUNT.toLocaleString()} coins for supporting us!`,
      "ad-reward",
      "/shop"
    ).catch(err => console.warn("Notification send failed:", err));

    return NextResponse.json({ 
      newBalance: updatedUser.balance,
      success: true,
      message: `Successfully claimed ${REWARD_AMOUNT.toLocaleString()} coins!`
    });

  } catch (error) {
    console.error("[Claim Ad Reward Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}