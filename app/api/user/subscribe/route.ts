import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  
  // 1. Explicitly check for user ID to satisfy TypeScript
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await req.json();
  
  // 2. Perform the creation
  try {
    await prisma.subscription.create({
      data: {
        userId: session.user.id, // Now TS knows this is a string
        data: subscription,      // This is the JSON field in your schema
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}