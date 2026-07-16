import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Set the reward status to true in the database
    await prisma.user.update({
      where: { email: session.user.email },
      data: { pendingReward: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ad completion error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}