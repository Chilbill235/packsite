// app/api/user/subscribe/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from 'web-push';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY || process.env.PRIVATE_VAPID_KEY;

    if (!publicKey || !privateKey) {
      console.error("VAPID keys missing in environment variables");
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    webpush.setVapidDetails('mailto:admin@packsite.com', publicKey, privateKey);

    const body = await req.json();
    // Safely extract the nested subscription object if it exists, otherwise use the top level
    const subscriptionData = body.subscription || body; 
    
    if (!subscriptionData || !subscriptionData.endpoint) {
      return NextResponse.json({ error: "No valid subscription object received" }, { status: 400 });
    }

    // Save/update the subscription matched against the authenticated user's ID
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: { data: subscriptionData },
      create: { 
        userId: session.user.id, 
        data: subscriptionData 
      }
    });
    
    console.log(`[Subscription DB] Saved subscription for user ID: ${session.user.id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}