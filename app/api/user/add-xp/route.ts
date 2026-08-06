import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = typeof body.amount === 'number' ? body.amount : 50;
    const userId = session.user.id;

    // Update DB
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        xp: { increment: amount },
      }
    });

    return NextResponse.json({ newXp: updatedUser.xp });
  } catch (error) {
    console.error("[Add XP Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}