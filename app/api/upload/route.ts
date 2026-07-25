// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    let imageUrl = formData.get("image") as string | null;
    const file = formData.get("file") as File | null;

    // Handle uploaded file or mobile camera roll images
    if (file && file.size > 0) {
      // If the client sent a local blob URL string disguised or passed as a file, 
      // or standard binary upload data from a camera roll / file picker:
      if (file instanceof File) {
        // Convert the File/Blob into an array buffer and handle storage upload 
        // or transform it into a base64 Data URL / external cloud upload (e.g., Vercel Blob, S3, Cloudinary).
        // Below is a robust base64 conversion fallback suitable for handling direct camera roll buffers:
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64String = buffer.toString("base64");
        const mimeType = file.type || "image/jpeg";
        
        imageUrl = `data:${mimeType};base64,${base64String}`;
      }
    }

    // Safety check: if 'image' field accidentally contains a client-side blob URL string (e.g., "blob:https://..."),
    // blob URLs cannot be resolved server-side. Ignore it or keep the old image if no valid file/data was provided.
    if (imageUrl && imageUrl.startsWith("blob:")) {
      imageUrl = null; 
    }

    // Verify user exists before attempting update
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
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Profile update error:", error);

    // Record not found in Prisma (Code P2025)
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