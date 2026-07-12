// app/api/user/subscribe/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // Ensure this imports from your main auth file
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  // Validate that the session and the user ID exist
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await req.json();

  try {
    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        data: subscription,
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}