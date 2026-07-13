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

    const openings = await prisma.opening.findMany({
      where: { userId: user.id },
      include: {
        item: true,
        pack: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ openings });
  } catch (error) {
    console.error("API Error in /api/openings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}