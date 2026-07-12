import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await req.json();
  
  await prisma.subscription.create({
    data: {
      userId: session.user.id,
      data: subscription,
    }
  });

  return NextResponse.json({ success: true });
}