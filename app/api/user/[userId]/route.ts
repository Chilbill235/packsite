import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "User identifier required" }, { status: 400 });
    }

    const session = await auth();
    const requestingUserId = session?.user?.id;

    // Search user by ID or unique username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { username: userId }],
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
        showInventory: true,
        showBalance: true,
        showActivity: true,
        inventory: {
          include: {
            item: true,
          },
        },
        openings: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            item: true,
            pack: true,
          },
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

    // Determine viewer state
    let isFollowing = false;
    if (requestingUserId && requestingUserId !== user.id) {
      const followRecord = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: requestingUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!followRecord;
    }

    const isOwner = requestingUserId === user.id;

    // Respect privacy settings if not owner or non-public
    const canSeeDetails = user.publicProfile || isOwner;

    // Format real inventory items
    const formattedInventory = (canSeeDetails && user.showInventory)
      ? user.inventory.map((inv) => ({
          id: inv.id,
          name: inv.item.name,
          type: "Item",
          rarity: inv.item.rarity,
          value: inv.item.value,
          image: inv.item.image,
          quantity: 1,
        }))
      : [];

    // Format real activity logs from openings
    const formattedActivities = (canSeeDetails && user.showActivity)
      ? user.openings.map((op) => ({
          id: op.id,
          type: "PURCHASE",
          description: `Opened ${op.pack.name} and pulled ${op.item.name} ($${op.item.value})`,
          timestamp: new Date(op.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }))
      : [];

    return NextResponse.json({
      id: user.id,
      username: user.username,
      image: user.image,
      bio: canSeeDetails ? user.bio : "",
      location: canSeeDetails ? user.location : "",
      balance: (canSeeDetails && user.showBalance) ? user.balance : 0,
      xp: canSeeDetails ? user.xp : 0,
      level: canSeeDetails ? user.level : 1,
      createdAt: user.createdAt,
      publicProfile: user.publicProfile,
      followersCount: user._count.followedBy,
      followingCount: user._count.following,
      isFollowing,
      inventory: formattedInventory,
      activities: formattedActivities,
    });
  } catch (error: any) {
    console.error("FETCH_USER_PROFILE_ERROR", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}