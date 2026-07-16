import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Lazily initialize VAPID details to prevent build-time crashes when env vars are absent
function initWebPush() {
  const privateKey = process.env.PRIVATE_VAPID_KEY;
  const publicKey = "BEtKdyDMRqNtEXn-VObKK2cdNlmnSSk3oz1_KXET_MDVUBPDGrofEvpAYaNBQpGp3-MS45qj_KV9nBbzxzftDtU";

  if (!privateKey) {
    throw new Error("PRIVATE_VAPID_KEY environment variable is not defined.");
  }

  webpush.setVapidDetails(
    'mailto:your-email@example.com', // Change to your actual email
    publicKey,
    privateKey
  );
}

export async function POST(request: Request) {
  try {
    const { subscription, delayMs, title, body, tag, url } = await request.json();

    if (!subscription) {
      return NextResponse.json({ error: "No subscription details provided." }, { status: 400 });
    }

    // Initialize only when a request runs (safeguards build step)
    initWebPush();

    // Server-side non-blocking delay
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
  } catch (error: any) {
    console.error("Error setting up scheduled push route:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}