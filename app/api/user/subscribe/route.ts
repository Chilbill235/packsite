import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from 'web-push';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      console.error("VAPID keys missing in environment variables");
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    webpush.setVapidDetails(
      'mailto:admin@packsite.com',
      publicKey,
      privateKey
    );

    const sub = await req.json();
    
    // Uses upsert to manage the unique constraint on userId
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: { data: sub },
      create: {
        userId: session.user.id,
        data: sub
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}