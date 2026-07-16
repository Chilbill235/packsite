import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; // Adjust based on your auth setup
import { prisma } from "@/lib/prisma"; // Adjust path to your prisma client

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the user and their reward status
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, pendingReward: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the user is eligible (pendingReward is true)
    if (user.pendingReward) {
      // SECURITY: Reset the flag immediately so this endpoint cannot be called again
      await prisma.user.update({
        where: { id: user.id },
        data: { pendingReward: false },
      });

      return NextResponse.json({ eligible: true });
    }

    // If already false, they are not eligible
    return NextResponse.json({ eligible: false });

  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}