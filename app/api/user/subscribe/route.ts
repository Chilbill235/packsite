import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // 1. Verify the user session
  const session = await auth();

  // Log session to Vercel/Terminal to debug
  console.log("DEBUG - Full Session in API:", JSON.stringify(session));

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", details: "No session ID found" }, 
      { status: 401 }
    );
  }

  try {
    // 2. Parse the push subscription data from the request body
    const subscriptionData = await req.json();

    // 3. Save to the database
    // Ensure 'subscription' exists in your schema and Prisma client is generated
    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        // Assuming your schema expects the subscription object as 'data'
        data: subscriptionData, 
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Subscription save error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: "Could not save subscription" }, 
      { status: 500 }
    );
  }
}