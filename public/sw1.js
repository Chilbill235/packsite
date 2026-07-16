// --- CONSTANTS & CONFIGS ---
const APP_ICON = '/images/cup.png';
const APP_BADGE = '/images/apple-pay.png'; // Ideal for android status bars

// Pool of highly engaging, randomized shop-related notifications
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

// Helper to select a random notification from our pool
function getRandomNotification() {
  const randomIndex = Math.floor(Math.random() * CAMPAIGN_NOTIFICATION_POOL.length);
  return CAMPAIGN_NOTIFICATION_POOL[randomIndex];
}

// Helper to build robust, beautiful notification options
function buildNotificationOptions(payload) {
  return {
    body: payload.body || "Tap to see what's new!",
    icon: APP_ICON,
    badge: APP_BADGE,
    image: payload.image || '/images/banner.png', // Large hero card image
    requireInteraction: true, // Forces modal sticky state on desktop/Android
    vibrate: [200, 50, 100, 50, 200], // Premium triple-pulse vibration
    tag: payload.tag || 'general-broadcast', // Replaces old notification of the same type
    renotify: true, // Vibrates/alerts again even if tag matches
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
        title: 'Dismiss',
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
    data = getRandomNotification(); // Fallback to random interactive local alert if server push empty
  }

  const title = data.title || "Special Alert";
  const options = buildNotificationOptions(data);

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// --- DYNAMIC LOCAL RUNTIME SCHEDULING (OPTIONAL BACKGROUND FLOWS) ---
// When the app goes to sleep or background checks sync, trigger randomized notifications.
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

  // Grab the exact redirect URL from metadata properties
  const targetUrl = event.notification.data?.url || '/shop';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Try to find a tab that is already open to our domain
      for (const client of clientList) {
        if ('focus' in client) {
          // If the page matches or is already on our host, focus it and redirect
          const clientUrl = new URL(client.url);
          const redirectUrl = new URL(targetUrl, self.location.origin);
          
          if (clientUrl.origin === redirectUrl.origin) {
            client.navigate(targetUrl); // Redirect existing tab directly to /shop
            return client.focus();
          }
        }
      }
      // 2. If no matching window is open, open a brand new tab to the route
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});