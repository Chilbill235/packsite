import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // Fixed: Using the modern v5 auth helper directly
import { prisma } from "@/lib/prisma";   
import bcrypt from "bcryptjs";            

export async function POST(request: Request) {
  try {
    // Call the v5 auth method directly to securely check the JWT session
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to modify profile data." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, password } = body;
    const updateData: { username?: string; password?: string } = {};

    // Validate and check username availability if changing
    if (username && username.trim() !== "") {
      const existingUser = await prisma.user.findUnique({
        where: { username: username.trim() },
      });

      if (existingUser && existingUser.email !== session.user.email) {
        return NextResponse.json(
          { error: "Username is already taken." },
          { status: 400 }
        );
      }
      updateData.username = username.trim();
    }

    // Securely hash password updates if provided
    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }
      const hashedPassword = await bcrypt.hash(password, 10);
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