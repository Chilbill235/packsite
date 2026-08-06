import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    const requestingUserId = session?.user?.id;

    // Fetch the user with all relevant fields (excluding password)
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If the profile is public or the viewer is the owner, show full data
    const isOwner = requestingUserId === userId;
    if (user.publicProfile || isOwner) {
      // Return the user data (balance, xp, level etc are included)
      return NextResponse.json(user);
    }

    // Profile is private and viewer is not the owner: return limited info
    return NextResponse.json({
      id: user.id,
      username: user.username,
      image: user.image,
      bio: "", // hide bio
      location: "", // hide location
      balance: 0, // hide balance
      xp: 0, // hide xp
      level: 1, // hide level
      createdAt: user.createdAt,
      publicProfile: false,
    });
  } catch (error: any) {
    console.error("FETCH_USER_PROFILE_ERROR", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}