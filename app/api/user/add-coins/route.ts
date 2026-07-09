import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const AD_REWARD = 500;

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { lastAdWatched: true }
  });

  const now = new Date();
  if (user?.lastAdWatched) {
    if (now.getTime() - user.lastAdWatched.getTime() < 30000) {
      return NextResponse.json({ error: "Cooldown" }, { status: 429 });
    }
  }

  const updatedUser = await prisma.user.update({
    where: { email: session.user.email },
    data: { balance: { increment: AD_REWARD }, lastAdWatched: now }
  });

  return NextResponse.json({ newBalance: updatedUser.balance });
}