import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

interface SubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function POST(request: Request) {
  try {
    const session = await auth(); 
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@packsite.com';

    if (!publicKey || !privateKey) {
      console.error('[VAPID ERROR] Missing keys in environment variables');
      return NextResponse.json(
        { error: 'VAPID Keys are missing from server configuration.' },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const userSubscriptions = await prisma.subscription.findMany({
      where: { userId },
    });

    if (!userSubscriptions || userSubscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No active push notifications subscription found for this user.' },
        { status: 404 }
      );
    }

    const notificationPayload = JSON.stringify({
      title: 'PackSite Test Alert!',
      body: 'This is an instant test push notification.',
      data: { url: '/shop' },
    });

    const pushPromises = userSubscriptions.map(async (sub) => {
      const rawData = sub.data as unknown as SubscriptionData;

      if (!rawData || !rawData.endpoint || !rawData.keys) {
        console.warn('Skipping invalid subscription format for subscription ID: ' + sub.id);
        return;
      }

      const pushConfig = {
        endpoint: rawData.endpoint,
        keys: {
          p256dh: rawData.keys.p256dh,
          auth: rawData.keys.auth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, notificationPayload);
      } catch (error: unknown) {
        const err = error as { statusCode?: number };
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.subscription.delete({ where: { id: sub.id } });
        }
      }
    });

    await Promise.allSettled(pushPromises);

    return NextResponse.json({ success: true, message: 'Test alert triggered successfully!' });
  } catch (error: unknown) {
    console.error('Error triggering test push:', error);
    const err = error as { message?: string };
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
