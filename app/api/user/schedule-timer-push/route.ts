import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function initWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!privateKey || !publicKey) {
    throw new Error("VAPID Keys are missing from environment variables.");
  }

  webpush.setVapidDetails('mailto:admin@packsite.com', publicKey, privateKey);
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bodyData = await request.json();
    const { subscription } = bodyData;

    if (!subscription) {
      return NextResponse.json({ error: "No subscription details provided." }, { status: 400 });
    }

    // Save the browser's push subscription directly to the database tied to the user!
    await prisma.subscription.upsert({
      where: {
        // Assumes your schema has a unique constraint or lookup for subscriptions,
        // otherwise a standard prisma.subscription.create matches your setup:
        endpoint: subscription.endpoint, 
      },
      update: { data: subscription },
      create: {
        endpoint: subscription.endpoint,
        data: subscription,
        user: { connect: { email: session.user.email } }
      }
    });

    initWebPush();

    // If a delay request is present (Safari backup fallback helper)
    if (bodyData.delayMs) {
      setTimeout(async () => {
        try {
          await webpush.sendNotification(
            subscription,
            JSON.stringify({
              title: bodyData.title || "Alert",
              body: bodyData.body || "Notification active!",
              tag: bodyData.tag,
              url: bodyData.url,
              isAdTimer: true
            })
          );
        } catch (err) {
          console.error("Delayed push delivery failure:", err);
        }
      }, bodyData.delayMs);
    }

    return NextResponse.json({ success: true, message: "Subscribed and saved successfully." });
  } catch (error: any) {
    console.error("Subscription endpoint error:", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}