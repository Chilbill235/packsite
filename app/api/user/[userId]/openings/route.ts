import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const requestingUserId = session?.user?.id;

    const { userId } = await params;

    // Fetch the user to check if profile is public
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { publicProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If the profile is not public and the requesting user is not the owner, return empty openings
    if (!user.publicProfile && requestingUserId !== userId) {
      return NextResponse.json({ openings: [] });
    }

    // Fetch openings for the user
    const openings = await prisma.opening.findMany({
      where: { userId },
      include: {
        item: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ openings });
  } catch (error: any) {
    console.error("FETCH_USER_OPENINGS_ERROR", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch openings" },
      { status: 500 }
    );
  }
}