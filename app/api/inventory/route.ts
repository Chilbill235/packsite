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
      where: { email: session.user.email } 
    });
  
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const inventory = await prisma.inventory.findMany({
      where: { userId: user.id },
      include: { item: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ inventory });
  } catch (error: any) {
    console.error("Inventory API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}