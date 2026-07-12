import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // These parameters depend on what you configure in the Monetag dashboard
  const userId = searchParams.get('userId'); 
  const status = searchParams.get('status');

  // Verify the status is "complete" and we have the userId
  if (status === 'complete' && userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: 10 } } // Increment by your reward amount
      });
      return NextResponse.json({ message: "Coins awarded successfully" });
    } catch (error) {
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid status" }, { status: 400 });
}