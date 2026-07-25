// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // <-- Updated import for NextAuth v5
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // Call auth() directly in NextAuth v5
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
    
    // Parse settings toggles
    const pushNotifications = formData.get("pushNotifications") === "true";
    const emailNotifications = formData.get("emailNotifications") === "true";
    const showInventory = formData.get("showInventory") === "true";
    const showBalance = formData.get("showBalance") === "true";
    const showActivity = formData.get("showActivity") === "true";
    const publicProfile = formData.get("publicProfile") === "true";

    let imageUrl = formData.get("image") as string | null;
    const file = formData.get("file") as File | null;

    if (file && file.size > 0) {
      // If you upload files to S3/Cloudflare/Vercel Blob, put that logic here:
      // imageUrl = await uploadToStorage(file);
    }

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
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}