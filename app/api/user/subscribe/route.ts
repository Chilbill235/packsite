// app/api/user/subscribe/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await req.json();
  
  // Store the subscription object so your other API can find it
  await prisma.subscription.create({
    data: {
      userId: session.user.id, // Or use email
      data: sub 
    }
  });
  return NextResponse.json({ success: true });
}