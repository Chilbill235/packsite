import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        inventory: {
          include: { item: true }
        },
        openings: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Dynamically calculate total drops unboxed from actual opening history logs
    const totalDropsUnboxed = user.openings.length;

    // Dynamically calculate net inventory value
    const netInventoryValue = user.inventory.reduce((sum, inv) => sum + (inv.item?.value || 0), 0);

    return NextResponse.json({
      ...user,
      totalDropsUnboxed,
      netInventoryValue,
    });
  } catch (error: any) {
    console.error("Profile API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}