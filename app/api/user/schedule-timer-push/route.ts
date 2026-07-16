import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure your VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  "BEtKdyDMRqNtEXn-VObKK2cdNlmnSSk3oz1_KXET_MDVUBPDGrofEvpAYaNBQpGp3-MS45qj_KV9nBbzxzftDtU", // Public Key
  process.env.PRIVATE_VAPID_KEY || "" // Your Private Key (Stored in environment variables)
);

export async function POST(request: Request) {
  try {
    const { subscription, delayMs, title, body, tag, url } = await request.json();

    if (!subscription) {
      return NextResponse.json({ error: "No subscription details provided." }, { status: 400 });
    }

    // Server-side non-blocking delay
    // The server handles the 10s wait, and then triggers Apple's APNs to wake up the phone
    setTimeout(async () => {
      try {
        const payload = JSON.stringify({
          title,
          body,
          tag,
          url,
          isAdTimer: true
        });

        await webpush.sendNotification(subscription, payload);
      } catch (err) {
        console.error("Failed to deliver scheduled background push to Safari:", err);
      }
    }, delayMs);

    return NextResponse.json({ success: true, message: "Push notification scheduled." });
  } catch (error) {
    console.error("Error setting up scheduled push route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}