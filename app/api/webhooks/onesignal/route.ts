import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

const WEBHOOK_SECRET = process.env.ONESIGNAL_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const eventType = searchParams.get('event');
    
    // Check multiple locations for the ID
    const userId = payload.external_user_id || payload.custom_data?.userId || payload.email;

    console.log(`[Webhook Debug] Event: ${eventType} | Found UserID: ${userId}`);

    if (eventType === 'clicked') {
      const ref = payload.custom_data?.ref;

      if (ref === 'reward-claim' && userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { balance: { increment: 0 } }
        });
        console.log(`[Webhook] Success: 500 coins granted to ${userId}`);
      } else if (!userId) {
        console.warn("[Webhook] Clicked but no UserID found in payload!");
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}