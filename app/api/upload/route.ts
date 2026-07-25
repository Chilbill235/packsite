import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    
    const name = formData.get("name") as string | null;
    const bio = formData.get("bio") as string | null;
    const location = formData.get("location") as string | null;
    const theme = formData.get("theme") as string | null;
    
    const pushNotifications = formData.get("pushNotifications") === "true";
    const emailNotifications = formData.get("emailNotifications") === "true";
    const showInventory = formData.get("showInventory") === "true";
    const showBalance = formData.get("showBalance") === "true";
    const showActivity = formData.get("showActivity") === "true";
    const publicProfile = formData.get("publicProfile") === "true";

    const currentPassword = formData.get("currentPassword") as string | null;
    const newPassword = formData.get("newPassword") as string | null;

    let imageUrl = formData.get("image") as string | null;
    const file = formData.get("file") as File | null;

    // Handle uploaded file or mobile camera roll images from browse/file picker
    if (file && file.size > 0) {
      if (file instanceof File) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64String = buffer.toString("base64");
        const mimeType = file.type || "image/jpeg";
        
        imageUrl = `data:${mimeType};base64,${base64String}`;
      }
    }

    // Ignore client-side blob URLs if passed directly without proper conversion
    if (imageUrl && imageUrl.startsWith("blob:")) {
      imageUrl = null; 
    }

    // Handle password update if requested
    let passwordUpdateData = {};
    if (newPassword && newPassword.trim() !== "") {
      const userRecord = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!userRecord || !userRecord.password) {
        return NextResponse.json({ error: "User account or security key record not found." }, { status: 400 });
      }

      if (!currentPassword) {
        return NextResponse.json({ error: "Current security key is required to set a new one." }, { status: 400 });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, userRecord.password);
      if (!passwordMatch) {
        return NextResponse.json({ error: "Incorrect current security key." }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New security key must be at least 6 characters." }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      passwordUpdateData = { password: hashedPassword };
    }

    // Update user record with all settings, preferences, and metadata
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { username: name }),
        ...(bio !== null && { bio }),
        ...(location !== null && { location }),
        ...(imageUrl && { image: imageUrl }),
        ...(theme && { theme }),
        pushNotifications,
        emailNotifications,
        showInventory,
        showBalance,
        showActivity,
        publicProfile,
        ...passwordUpdateData,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Profile update error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "User session expired or user record not found. Please re-login." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}