import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma";   
import bcrypt from "bcryptjs";            

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to modify profile data." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, currentPassword, newPassword, image } = body;
    const updateData: { username?: string; password?: string; image?: string } = {};

    // Validate and check username availability if changing
    if (name && name.trim() !== "") {
      const existingUser = await prisma.user.findUnique({
        where: { username: name.trim() },
      });

      if (existingUser && existingUser.email !== session.user.email) {
        return NextResponse.json(
          { error: "Username is already taken." },
          { status: 400 }
        );
      }
      updateData.username = name.trim();
    }

    // Update avatar image URL if provided
    if (image !== undefined) {
      const trimmedImage = String(image).trim();
      if (trimmedImage) {
        updateData.image = trimmedImage;
      }
    }

    // Securely verify and hash password updates if requested
    if (newPassword && newPassword.trim() !== "") {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password." },
          { status: 400 }
        );
      }

      // Fetch user's current stored password hash
      const userRecord = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { password: true },
      });

      if (!userRecord || !userRecord.password) {
        return NextResponse.json(
          { error: "User account security record not found." },
          { status: 400 }
        );
      }

      const passwordMatch = await bcrypt.compare(currentPassword, userRecord.password);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: "Incorrect current security key." },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No profile update information was provided." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        balance: true,
        image: true,
        level: true,
        xp: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error inside profile update pipeline:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while modifying profile records." },
      { status: 500 }
    );
  }
}
