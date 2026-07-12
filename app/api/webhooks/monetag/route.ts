// app/api/webhooks/monetag/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming your Prisma setup

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // These parameters are passed by Monetag based on your S2S setup
  const userId = searchParams.get('userId'); 
  const payout = searchParams.get('payout');
  const status = searchParams.get('status');

  // Verify the request and update your database
  if (status === 'complete' && userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: 10 } } // Adjust based on your logic
    });
    return NextResponse.json({ message: "Reward credited" });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}