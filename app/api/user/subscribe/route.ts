import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Double check the user ID from the database using email 
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY || process.env.PRIVATE_VAPID_KEY;

    if (!publicKey || !privateKey) {
      console.error("[Subscription API] VAPID keys missing in environment variables");
      return NextResponse.json({ error: "VAPID keys not configured on server" }, { status: 500 });
    }

    webpush.setVapidDetails('mailto:admin@packsite.com', publicKey, privateKey);

    const body = await req.json();
    const subscriptionData = body.subscription || body; 
    
    if (!subscriptionData || !subscriptionData.endpoint) {
      return NextResponse.json({ error: "No valid subscription object received" }, { status: 400 });
    }

    // 2. Clean Upsert matching your 'data' Json schema perfectly
    await prisma.subscription.upsert({
      where: { userId: dbUser.id },
      update: { 
        data: subscriptionData // Handled as raw Json by Prisma
      },
      create: { 
        userId: dbUser.id, 
        data: subscriptionData 
      }
    });
    
    console.log(`[Subscription DB] Successfully registered credentials for: ${dbUser.email} (ID: ${dbUser.id})`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Subscription API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}