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

    const userId = params.userId;

    // Fetch the user with public data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        image: true,
        bio: true,
        location: true,
        // Only show balance, xp, level if the profile is public or if it's the same user
        balance: requestingUserId === userId ? true : undefined,
        xp: requestingUserId === userId ? true : undefined,
        level: requestingUserId === userId ? true : undefined,
        createdAt: true,
        publicProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If the profile is not public and the requesting user is not the owner, limit the data
    if (!user.publicProfile && requestingUserId !== userId) {
      // Return only basic info: username, image, and maybe a message
      return NextResponse.json({
        id: user.id,
        username: user.username,
        image: user.image,
        // Hide other fields
        bio: "",
        location: "",
        balance: 0,
        xp: 0,
        level: 1,
        createdAt: user.createdAt,
      });
    }

    // If public or same user, return the data we selected (which will have the fields we requested)
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("FETCH_USER_PROFILE_ERROR", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}