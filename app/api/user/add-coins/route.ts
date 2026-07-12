import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
// Force a direct import to ensure the singleton is correctly referenced
import { prisma } from "@/lib/prisma"; 
import webpush from 'web-push';

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Safety check: if prisma is undefined, the import failed or circular dep exists
  if (!prisma) {
    console.error("Prisma client is undefined in add-coins/route.ts");
    return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  }

  // Use the verified prisma client
  const updatedUser = await prisma.user.update({
    where: { email: session.user.email },
    data: { balance: { increment: 500 } }
  });

  const subscriptions = await prisma.subscription.findMany({ 
    where: { user: { email: session.user.email } } 
  });
  
  // ... rest of your code