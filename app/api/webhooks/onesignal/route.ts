import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Get the secret from the URL query parameters
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  // Verify the secret against your .env file
  if (secret !== process.env.ONESIGNAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If secret matches, proceed with processing
  const payload = await req.json();
  console.log("Webhook received:", payload);
  
  return NextResponse.json({ success: true });
}