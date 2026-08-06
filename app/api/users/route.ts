import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    // We don't require authentication to view public profiles, but we can limit to authenticated users if desired.
    // Let's allow anyone to fetch the list of public users.

    const users = await prisma.user.findMany({
      where: {
        publicProfile: true,
      },
      select: {
        id: true,
        username: true,
        image: true,
        balance: true,
        xp: true,
        level: true,
      },
      take: 10,
      orderBy: {
        balance: "desc",
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("FETCH_USERS_ERROR", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}