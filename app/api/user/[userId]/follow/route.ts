import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: targetIdentifier } = await params;
    
    if (!targetIdentifier) {
      return NextResponse.json({ error: "Target user required" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const action = body?.action;

    if (!action || !["follow", "unfollow"].includes(action)) {
      return NextResponse.json({ error: "Invalid action provided" }, { status: 400 });
    }

    // Resolve target user by ID or Username (case-insensitive)
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: targetIdentifier },
          { username: { equals: targetIdentifier, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const followerId = session.user.id;
    const followingId = targetUser.id;

    if (followerId === followingId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check current follow relationship status in the database
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (action === "follow") {
      if (existingFollow) {
        return NextResponse.json(
          { error: "You are already following this user", isFollowing: true },
          { status: 400 }
        );
      }

      await prisma.follow.create({
        data: { followerId, followingId },
      });

      return NextResponse.json({ success: true, isFollowing: true, action });
    } else {
      if (!existingFollow) {
        return NextResponse.json(
          { error: "You are not following this user", isFollowing: false },
          { status: 400 }
        );
      }

      await prisma.follow.delete({
        where: {
          followerId_followingId: { followerId, followingId },
        },
      });

      return NextResponse.json({ success: true, isFollowing: false, action });
    }
  } catch (error: any) {
    console.error("FOLLOW_ROUTE_ERROR", error);
    return NextResponse.json(
      { error: "Failed to update follow status" },
      { status: 500 }
    );
  }
}