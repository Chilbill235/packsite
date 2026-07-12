import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const AD_REWARD = 500;

export async function POST() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch user status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { lastAdWatched: true }
    });

    // 2. Check cooldown (30 seconds)
    const now = new Date();
    if (user?.lastAdWatched) {
      const diff = now.getTime() - user.lastAdWatched.getTime();
      if (diff < 30000) {
        return NextResponse.json({ error: "Cooldown active" }, { status: 429 });
      }
    }

    // 3. Update user
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { 
        balance: { increment: AD_REWARD }, 
        lastAdWatched: now 
      }
    });

    return NextResponse.json({ newBalance: updatedUser.balance });
  } catch (error) {
    console.error("Database update failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}