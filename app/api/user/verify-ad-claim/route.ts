import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // Imports the auth() function
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. In v5, use the 'auth()' function directly to get the session
    const session = await auth(); 
    
    // 2. Validate the session
    if (!session?.user?.email) {
      return NextResponse.json({ eligible: false }, { status: 401 });
    }

    // 3. Database lookup
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { pendingReward: true }
    });

    return NextResponse.json({ eligible: !!user?.pendingReward });
  } catch (error) {
    return NextResponse.json({ eligible: false }, { status: 500 });
  }
}