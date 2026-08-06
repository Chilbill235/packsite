import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const REWARD_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const AD_SECRET = process.env.NEXTAUTH_SECRET || "yBJPdybgTUmoFtlacrrXA2KKpNF8Hzv81vTl6i6g3fkeboEnofsjLWucRQx-kIU_2UDmEiypwkmPXS6Jqz9CUGKLfPmTI4d28wBQ";

// Store in-memory ad tokens -> { userId, startTime, claimed }
export const activeAdSessions = new Map<
  string,
  { userId: string; startTime: number; claimed: boolean }
>();

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, lastAdWatched: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check DB Cooldown
    const now = Date.now();
    if (user.lastAdWatched) {
      const timeSinceLastWatch = now - user.lastAdWatched.getTime();
      if (timeSinceLastWatch < REWARD_COOLDOWN_MS) {
        const remainingMs = REWARD_COOLDOWN_MS - timeSinceLastWatch;
        return NextResponse.json(
          {
            error: "Ad on cooldown.",
            cooldownMs: remainingMs,
          },
          { status: 429 }
        );
      }
    }

    // Generate cryptographic single-use ad token
    const timestamp = now;
    const rawToken = `${user.id}:${timestamp}:${crypto.randomBytes(16).toString("hex")}`;
    const token = crypto
      .createHmac("sha256", AD_SECRET)
      .update(rawToken)
      .digest("hex");

    // Save session in memory
    activeAdSessions.set(token, {
      userId: user.id,
      startTime: timestamp,
      claimed: false,
    });

    // Mark pending reward flag in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { pendingReward: true },
    });

    return NextResponse.json({ success: true, adToken: token });
  } catch (error) {
    console.error("[Initiate Ad Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}