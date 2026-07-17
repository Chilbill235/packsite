/**
 * PWA Service Worker (sw1.js)
 * Full code: Includes all logic for periodic loops, push notifications, and dynamic ad timers.
 * Fully compatible with iOS, Safari, Chrome, and desktop platforms.
 */

// --- 1. LIFE-CYCLE EVENTS ---
self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    self.clients.claim().then(function() {
      startPeriodicNotificationLoop();
    })
  );
});

// --- 2. STATE AND CONFIGURATION ---
var APP_ICON = '/images/cup.png';
var APP_BADGE = '/images/apple-pay.png';

// Each URL contains a unique ref parameter for specific router handling in ShopPage.tsx
var CAMPAIGN_POOL = [
  { title: "⚡ Flash Deal Active!", body: "Prices dropped in the shop! Tap to claim your exclusive discount.", tag: "flash-deal", url: "/shop?ref=flash-deal" },
  { title: "💎 Free Reward Waiting!", body: "Your daily bonus is ready. Claim your free coins now!", tag: "daily-bonus", url: "/shop?ref=daily-bonus" },
  { title: "🎁 Rare Vault Drop!", body: "The vault just refreshed! Tap here to see if you got a Legendary Drop.", tag: "vault-drop", url: "/shop?ref=vault-drop" },
  { title: "🔥 Weekend Sale!", body: "Get 20% more coins with every purchase this weekend!", tag: "weekend-sale", url: "/shop?ref=weekend-sale" },
  { title: "🆕 New Item Alert!", body: "A new legendary pack has been added. Check it out!", tag: "new-item", url: "/shop?ref=new-item" },
  { title: "📈 Level Up Bonus!", body: "Your account is growing! Claim your progress reward.", tag: "level-up", url: "/shop?ref=level-up" },
  { title: "🎮 Community Event!", body: "Join the server event for a chance to win exclusive skins.", tag: "community-event", url: "/shop?ref=community-event" },
  { title: "📦 Mystery Box!", body: "A mystery pack has appeared in your inventory. Open it now!", tag: "mystery-box", url: "/shop?ref=mystery-box" },
  { title: "🌟 VIP Access!", body: "You've been selected for early access to the new shop features.", tag: "vip-access", url: "/shop?ref=vip-access" },
  { title: "💰 Double Coins!", body: "Double coin rewards for the next hour. Don't miss out!", tag: "double-coins", url: "/shop?ref=double-coins" },
  { title: "⏳ Limited Inventory!", body: "Items are selling out fast. Grab your favorites before they're gone.", tag: "limited-stock", url: "/shop?ref=limited-stock" },
  { title: "🍂 Seasonal Update!", body: "The season is changing. Discover our new themed packs.", tag: "seasonal", url: "/shop?ref=seasonal" },
  { title: "🏆 Best Seller!", body: "The top-rated pack is back in stock. Check the shop!", tag: "best-seller", url: "/shop?ref=best-seller" },
  { title: "🤝 Creator Collaboration!", body: "Special creator packs are now available.", tag: "creator-collab", url: "/shop?ref=creator-collab" },
  { title: "🎈 Anniversary Sale!", body: "We are celebrating one year! Massive discounts today.", tag: "anniversary", url: "/shop?ref=anniversary" },
  { title: "🔥 Daily Streak!", body: "You're on a roll! Keep your streak alive with today's reward.", tag: "streak", url: "/shop?ref=streak" },
  { title: "🧹 Inventory Clearance!", body: "Old stock must go. Heavily discounted legacy packs.", tag: "clearance", url: "/shop?ref=clearance" },
  { title: "💌 Surprise Gift!", body: "A small gift is waiting for you in the shop.", tag: "surprise", url: "/shop?ref=surprise" },
  { title: "🌙 Night Owl Special!", body: "Night owl? Grab some discounted coins while the sun is down.", tag: "night-owl", url: "/shop?ref=night-owl" },
  { title: "🔄 Pack Refresh!", body: "The entire shop inventory has been refreshed.", tag: "refresh", url: "/shop?ref=refresh" }
];

// --- 3. PERIODIC 10 MINUTE TIMER LOOP LOGIC ---
var loopTimeoutId = null;

// Fixed interval of 10 minutes (600000 ms) for periodic notifications
function getIntervalMs() {
  return 10 * 60 * 1000; // 10 minutes
}

function startPeriodicNotificationLoop() {
  if (loopTimeoutId) clearTimeout(loopTimeoutId);
  var nextDelay = getIntervalMs();
  loopTimeoutId = setTimeout(function () {
    triggerPeriodicAlert();
    startPeriodicNotificationLoop();
  }, nextDelay);
}

// Ensure the timer is restarted when the service worker wakes up from other than to keep it is added to start it on any message if not already.

function triggerPeriodicAlert() {
  var campaign = CAMPAIGN_POOL[Math.floor(Math.random() * CAMPAIGN_POOL.length)];
  self.registration.showNotification(campaign.title, {
    body: campaign.body,
    icon: APP_ICON,
    badge: APP_BADGE,
    tag: campaign.tag,
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { url: self.location.origin + campaign.url }
  }).catch(function(err) { console.error("[SW Loop] Failed to show periodic alert:", err); });
}

self.addEventListener('periodicsync', function (event) {
  if (event.tag === 'periodic-drops') {
    event.waitUntil(new Promise(function(resolve) { triggerPeriodicAlert(); resolve(); }));
  }
});

// --- 4. MESSAGE EVENT LISTENER (TIMER MANAGEMENT) ---
self.addEventListener('message', function (event) {
  if (!event.data) return;

  if (event.data.type === 'FORCE_DEV_LOOP_TRIGGER') {
    triggerPeriodicAlert();
    startPeriodicNotificationLoop();
  }

  if (event.data.type === 'START_BACKGROUND_TIMER') {
    var delayMs = event.data.delay || 10000;
    var targetUrl = event.data.url || (self.location.origin + "/shop");
    var amount = event.data.amount || 500; 

    event.waitUntil(
      new Promise(function (resolve) {
        setTimeout(function () {
          self.registration.showNotification("Ad Completed! 🪙", {
            body: "Your countdown is finished! Tap here to claim your " + amount + " coins.",
            icon: APP_ICON,
            badge: APP_BADGE,
            tag: "reward-claim-ready",
            renotify: true,
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: { url: targetUrl, amount: amount }
          }).then(function() {
            return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
              clientList[i].postMessage({ type: 'BACKGROUND_TIMER_COMPLETE', amount: amount });
            }
            resolve();
          }).catch(resolve);
        }, delayMs);
      })
    );
  }
  // Ensure periodic notification loop is kept alive
  startPeriodicNotificationLoop();
});

// --- 5. PUSH NOTIFICATION EVENTS ---
self.addEventListener('push', function (event) {
  var payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = CAMPAIGN_POOL[Math.floor(Math.random() * CAMPAIGN_POOL.length)];
  }

  var options = {
    body: payload.body || "Tap to return to the app!",
    icon: APP_ICON,
    badge: APP_BADGE,
    tag: payload.tag || 'general-broadcast',
    renotify: true,
    data: { url: payload.url || '/shop' }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "Alert", options)
  );
  // Keep periodic notification timer alive after push
  startPeriodicNotificationLoop();
});

// --- 6. NOTIFICATION CLICK ROUTING ---
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var targetUrl = event.notification.data ? event.notification.data.url : '/shop';
  var destinationUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client && new URL(client.url).origin === self.location.origin) {
          client.navigate(destinationUrl);
          // Send message to trigger logic if needed
          setTimeout(function () {
            client.postMessage({ type: 'BACKGROUND_TIMER_COMPLETE' });
          }, 800);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(destinationUrl);
      }
    })
  );
});