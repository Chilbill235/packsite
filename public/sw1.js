/**
 * PWA Service Worker (sw1.js)
 * Full code: Includes all logic for periodic loops, push notifications, and dynamic ad timers.
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

var CAMPAIGN_POOL = [
  {
    title: "⚡ Flash Deal Active!",
    body: "Prices dropped in the shop! Tap to claim your exclusive discount before time runs out. ⏳",
    tag: "flash-deal",
    url: "/shop?ref=notif_flash"
  },
  {
    title: "💎 Free Reward Waiting!",
    body: "Your daily bonus is ready. Claim your free coins now!",
    tag: "daily-bonus",
    url: "/shop?ref=notif_bonus"
  },
  {
    title: "🎁 Rare Vault Drop!",
    body: "The vault just refreshed! Tap here to see if you got a Legendary Drop. 🌟",
    tag: "vault-drop",
    url: "/shop?ref=reward-claim"
  }
];

// --- 3. PERIODIC 2-4 MINUTE TIMER LOOP LOGIC ---
var loopTimeoutId = null;

function getRandomIntervalMs() {
  var min = 120000;
  var max = 240000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startPeriodicNotificationLoop() {
  if (loopTimeoutId) clearTimeout(loopTimeoutId);
  var nextDelay = getRandomIntervalMs();
  loopTimeoutId = setTimeout(function () {
    triggerPeriodicAlert();
    startPeriodicNotificationLoop();
  }, nextDelay);
}

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
    var isSafari = /^((?!chrome|android).)*safari/i.test(self.navigator.userAgent);
    if (isSafari) return;

    var delayMs = event.data.delay || 10000;
    var targetUrl = event.data.url || (self.location.origin + "/shop");
    // Dynamic amount handler
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
              if (clientList[i].focused) {
                clientList[i].postMessage({ type: 'BACKGROUND_TIMER_COMPLETE', amount: amount });
              }
            }
            resolve();
          }).catch(resolve);
        }, delayMs);
      })
    );
  }
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