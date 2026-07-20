import { NextResponse } from 'next/server';

// Campaign pool for push notifications
const CAMPAIGN_POOL = [
  { title: "Flash Deal Active!", body: "Prices dropped in the shop! Tap to claim your exclusive discount.", url: "/shop?ref=flash-deal" },
  { title: "Free Reward Waiting!", body: "Your daily bonus is ready. Claim your free coins now!", url: "/shop?ref=daily-bonus" },
  { title: "Rare Vault Drop!", body: "The vault just refreshed! Tap here to see if you got a Legendary Drop.", url: "/shop?ref=vault-drop" },
  { title: "Weekend Sale!", body: "Get 20% more coins with every purchase this weekend!", url: "/shop?ref=weekend-sale" },
  { title: "New Item Alert!", body: "A new legendary pack has been added. Check it out!", url: "/shop?ref=new-item" },
  { title: "Level Up Bonus!", body: "Your account is growing! Claim your progress reward.", url: "/shop?ref=level-up" },
  { title: "Community Event!", body: "Join the server event for a chance to win exclusive skins.", url: "/shop?ref=community-event" },
  { title: "Mystery Box!", body: "A mystery pack has appeared in your inventory. Open it now!", url: "/shop?ref=mystery-box" },
  { title: "VIP Access!", body: "You've been selected for early access to the new shop features.", url: "/shop?ref=vip-access" },
  { title: "Double Coins!", body: "Double coin rewards for the next hour. Don't miss out!", url: "/shop?ref=double-coins" },
  { title: "Limited Inventory!", body: "Items are selling out fast. Grab your favorites before they're gone.", url: "/shop?ref=limited-stock" },
  { title: "Seasonal Update!", body: "The season is changing. Discover our new themed packs.", url: "/shop?ref=seasonal" },
  { title: "Best Seller!", body: "The top-rated pack is back in stock. Check the shop!", url: "/shop?ref=best-seller" },
  { title: "Creator Collaboration!", body: "Special creator packs are now available.", url: "/shop?ref=creator-collab" },
  { title: "Anniversary Sale!", body: "We are celebrating one year! Massive discounts today.", url: "/shop?ref=anniversary" },
  { title: "Daily Streak!", body: "You're on a roll! Keep your streak alive with today's reward.", url: "/shop?ref=streak" },
  { title: "Inventory Clearance!", body: "Old stock must go. Heavily discounted legacy packs.", url: "/shop?ref=clearance" },
  { title: "Surprise Gift!", body: "A small gift is waiting for you in the shop.", url: "/shop?ref=surprise" },
  { title: "Night Owl Special!", body: "Night owl? Grab some discounted coins while the sun is down.", url: "/shop?ref=night-owl" },
  { title: "Pack Refresh!", body: "The entire shop inventory has been refreshed.", url: "/shop?ref=refresh" }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cronKey = searchParams.get('key');
    
    if (process.env.CRON_SECRET && cronKey !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = CAMPAIGN_POOL[Math.floor(Math.random() * CAMPAIGN_POOL.length)];

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
      return NextResponse.json({ error: 'Missing OneSignal keys in environment variables.' }, { status: 500 });
    }

    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ['Subscribed Users'],
        headings: { en: campaign.title },
        contents: { en: campaign.body },
        url: `https://packsite.vercel.app${campaign.url}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'OneSignal API Error', details: data }, { status: response.status });
    }

    return NextResponse.json({ success: true, notificationId: data.id, sentCampaign: campaign.title });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
