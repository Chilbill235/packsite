import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // Updated to NextAuth v5 / Auth.js standard
import { prisma } from "@/lib/prisma";

// GET: Check if the current user is already following the target user
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ isFollowing: false }, { status: 200 });
    }

    const { userId: targetUserId } = await params;
    const currentUserId = session.user.id;

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!existingFollow });
  } catch (error) {
    console.error("FOLLOW_CHECK_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Follow or unfollow the target user
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth(); // Use auth() instead of getServerSession
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: targetUserId } = await params;
    const currentUserId = session.user.id;

    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const { action } = await req.json();

    if (action === "follow") {
      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
        create: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
        update: {},
      });
    } else if (action === "unfollow") {
      await prisma.follow.deleteMany({
        where: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FOLLOW_ROUTE_ERROR", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}