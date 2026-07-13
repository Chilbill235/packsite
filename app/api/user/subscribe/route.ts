// app/api/user/subscribe/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await req.json();
  
  // Use upsert to avoid unique constraint violations
  await prisma.subscription.upsert({
    where: { userId: session.user.id },
    update: { data: sub },
    create: {
      userId: session.user.id,
      data: sub
    }
  });
  
  return NextResponse.json({ success: true });
}
