import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: session?.user?.email || "" },
        { id: session?.user?.id || "" },
      ],
    },
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      location: true,
      balance: true, // 👈 Fixed: using 'balance' instead of 'coins'
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, image, bio, location, currentPassword, newPassword } =
      await req.json();

    const currentUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: session?.user?.email || "" },
          { id: session?.user?.id || "" },
        ],
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    if (name) updateData.username = name;
    if (image !== undefined) updateData.image = image;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password." },
          { status: 400 }
        );
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        currentUser.password || ""
      );

      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 }
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        username: updatedUser.username,
        image: updatedUser.image,
        bio: updatedUser.bio,
        location: updatedUser.location,
        balance: updatedUser.balance, // 👈 Fixed: returning 'balance' instead of 'coins'
      },
    });
  } catch (error: any) {
    console.error("PROFILE_UPDATE_ERROR", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}