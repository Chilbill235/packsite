import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams?.userId;

    if (!userId || userId === "undefined" || userId === "null") {
      return NextResponse.json(
        { error: "User ID or username required" },
        { status: 400 }
      );
    }

    // Search by EITHER database id OR username (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { username: { equals: userId, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        image: true,
        bio: true,
        location: true,
        balance: true,
        xp: true,
        level: true,
        createdAt: true,
        publicProfile: true,
        inventory: true,
        activities: {
          orderBy: { timestamp: "desc" },
          take: 10,
        },
        _count: {
          select: {
            followedBy: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Map _count results back to flat properties if your frontend expects them
    const formattedUser = {
      ...user,
      followersCount: user._count.followedBy,
      followingCount: user._count.following,
      _count: undefined,
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("GET_USER_ERROR", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}