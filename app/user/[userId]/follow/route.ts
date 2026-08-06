import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
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