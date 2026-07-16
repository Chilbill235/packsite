import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // 1. Authenticate using Next-Auth v5
    const session = await auth(); 
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Safely capture your environment variables
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@packsite.com';

    // Guardrail: Provide clean logs if keys are missing from .env
    if (!publicKey || !privateKey) {
      console.error("❌ [VAPID ERROR] Missing keys in environment variables!");
      console.error(`- VAPID_PUBLIC_KEY: ${publicKey ? '✅ Detected' : '❌ MISSING'}`);
      console.error(`- VAPID_PRIVATE_KEY: ${privateKey ? '✅ Detected' : '❌ MISSING'}`);
      
      return NextResponse.json(
        { error: 'VAPID Keys are missing from server configuration.' },
        { status: 500 }
      );
    }

    // 3. Set VAPID details on-demand
    webpush.setVapidDetails(subject, publicKey, privateKey);

    // 4. Fetch the user's active push subscriptions using your correct model "subscription"
    const userSubscriptions = await prisma.subscription.findMany({
      where: { userId },
    });

    if (!userSubscriptions || userSubscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No active push notifications subscription found for this user.' },
        { status: 404 }
      );
    }

    // 5. Define the push payload
    const notificationPayload = JSON.stringify({
      title: 'PackSite Test Alert! 📦',
      body: 'This is an instant test push notification. Your service worker is receiving pushes correctly!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        url: '/shop', 
      },
    });

    // 6. Dispatch the test notifications
    const pushPromises = userSubscriptions.map(async (sub) => {
      // Safely typecast and parse subscription details from your dynamic Json "data" field
      const subscriptionData = sub.data as any;

      if (!subscriptionData || !subscriptionData.endpoint || !subscriptionData.keys) {
        console.warn(`Skipping invalid subscription format for subscription ID: ${sub.id}`);
        return;
      }

      const pushConfig = {
        endpoint: subscriptionData.endpoint,
        keys: {
          p256dh: subscriptionData.keys.p256dh,
          auth: subscriptionData.keys.auth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, notificationPayload);
      } catch (error: any) {
        // Automatically prune expired or revoked browser subscriptions (410 Gone / 404 Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.subscription.delete({
            where: { id: sub.id },
          });
        }
        throw error;
      }
    });

    await Promise.allSettled(pushPromises);

    return NextResponse.json({ success: true, message: 'Test alert triggered successfully!' });
  } catch (error: any) {
    console.error('Error triggering test push:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}