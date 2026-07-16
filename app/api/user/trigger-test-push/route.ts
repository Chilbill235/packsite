import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth'; // Imports the unified Next-Auth v5 helper

// Initialize VAPID details for web-push
webpush.setVapidDetails(
  `mailto:${process.env.WEB_PUSH_EMAIL || 'admin@packsite.com'}`,
  process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY!,
  process.env.WEB_PUSH_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Authenticate using Next-Auth v5's universal auth() helper
    const session = await auth(); 
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Fetch the user's active push subscriptions from Prisma
    const userSubscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (!userSubscriptions || userSubscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No active push notifications subscription found for this user.' },
        { status: 404 }
      );
    }

    // 3. Define the push payload
    const notificationPayload = JSON.stringify({
      title: 'PackSite Test Alert! 📦',
      body: 'This is an instant test push notification. Your service worker is receiving pushes correctly!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        url: '/shop', 
      },
    });

    // 4. Dispatch the test notifications
    const pushPromises = userSubscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, notificationPayload);
      } catch (error: any) {
        // Automatically clean up expired or revoked browser subscriptions (410 Gone / 404 Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          });
        }
        throw error;
      }
    });

    // Run dispatch operations concurrently
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