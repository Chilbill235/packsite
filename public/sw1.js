// --- LIFECYCLE HANDLERS ---
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); 
});

// --- CONSTANTS & CONFIGS ---
const APP_ICON = '/images/cup.png';
const APP_BADGE = '/images/apple-pay.png'; 

const CAMPAIGN_NOTIFICATION_POOL = [
  {
    title: "⚡ Flash Deal Active!",
    body: "Prices just dropped in the shop! Tap to claim your exclusive discount before the timer runs out. ⏳",
    tag: "flash-deal",
    url: "/shop?ref=notif_flash"
  },
  {
    title: "💎 Free Reward Waiting!",
    body: "Your daily bonus is ready to be collected. Claim your free coins now!",
    tag: "daily-bonus",
    url: "/shop?ref=notif_bonus"
  },
  {
    title: "🎁 Mystery Box Unlocked",
    body: "A new legendary crate was added to your inventory. Open it in the shop to see what's inside! 👀",
    tag: "mystery-box",
    url: "/shop?ref=notif_mystery"
  },
  {
    title: "🔥 Back in Stock!",
    body: "The premium packs you viewed are back on the shelves. Grab yours before they sell out again!",
    tag: "restock",
    url: "/shop?ref=notif_restock"
  }
];

function getRandomNotification() {
  const randomIndex = Math.floor(Math.random() * CAMPAIGN_NOTIFICATION_POOL.length);
  return CAMPAIGN_NOTIFICATION_POOL[randomIndex];
}

function buildNotificationOptions(payload) {
  return {
    body: payload.body || "Tap to see what's new!",
    icon: APP_ICON,
    badge: APP_BADGE,
    image: payload.image || '/images/banner.png', 
    requireInteraction: true, 
    vibrate: [200, 50, 100, 50, 200], 
    tag: payload.tag || 'general-broadcast', 
    renotify: true, 
    data: {
      url: payload.url || '/shop'
    },
    actions: [
      {
        action: 'open-shop',
        title: '🛍️ Open Shop 🛍️',
      },
      {
        action: 'close',
        title: '❌ Dismiss ❌',
      }
    ]
  };
}

// --- PUSH EVENT LISTENER (SERVER-TRIGGERED) ---
self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.warn("Could not parse JSON payload, falling back to random local campaign.", e);
    data = getRandomNotification(); 
  }

  const title = data.title || "Special Alert";
  const options = buildNotificationOptions(data);

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// --- BACKGROUND MESSAGING HANDLER FOR AD TIMER ---
// This listens to the React page and sets a strictly isolated background timer.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'START_BACKGROUND_TIMER') {
    const delayMs = event.data.delay || 10000;
    
    // Set a reliable timeout that executes even if the main site tab goes out of focus
    setTimeout(() => {
      self.registration.showNotification("Ad Completed! 🪙", {
        body: "Your countdown is done! Tap here to return and claim your 500 coins.",
        icon: APP_ICON,
        badge: APP_BADGE,
        tag: "reward-claim-ready",
        renotify: true,
        vibrate: [200, 100, 200],
        data: { url: self.location.origin + "/shop" }
      });
    }, delayMs);
  }
});

// --- DYNAMIC LOCAL RUNTIME SCHEDULING ---
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'random-shop-alert') {
    const randomCampaign = getRandomNotification();
    event.waitUntil(
      self.registration.showNotification(
        randomCampaign.title,
        buildNotificationOptions(randomCampaign)
      )
    );
  }
});

// --- CLICK INTERACTION HANDLER ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/shop';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          const clientUrl = new URL(client.url);
          const redirectUrl = new URL(targetUrl, self.location.origin);
          
          if (clientUrl.origin === redirectUrl.origin) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});