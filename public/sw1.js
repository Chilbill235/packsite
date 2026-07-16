/**
 * PWA Service Worker (sw1.js)
 * Classic JavaScript format to avoid browser module parsing errors.
 */

// --- 1. LIFE-CYCLE EVENTS ---
self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    self.clients.claim().then(function() {
      // Start background looping schedule when Service Worker is activated
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
    url: "/shop?ref=reward-claim" // Points to claiming trigger URL
  }
];

// --- 3. PERIODIC 2-4 MINUTE TIMER LOOP LOGIC ---
var loopTimeoutId = null;

function getRandomIntervalMs() {
  // Random time between 2 minutes (120,000ms) and 4 minutes (240,000ms)
  var min = 120000;
  var max = 240000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startPeriodicNotificationLoop() {
  if (loopTimeoutId) clearTimeout(loopTimeoutId);

  var nextDelay = getRandomIntervalMs();
  console.log("[SW Loop] Next notification scheduled in " + (nextDelay / 1000) + " seconds.");

  loopTimeoutId = setTimeout(function () {
    triggerPeriodicAlert();
    // Recursively reschedule the next loop
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
  }).catch(function(err) {
    console.error("[SW Loop] Failed to show periodic alert:", err);
  });
}

// Support for standard browser-triggered Periodic Background Sync
self.addEventListener('periodicsync', function (event) {
  if (event.tag === 'periodic-drops') {
    event.waitUntil(
      new Promise(function(resolve) {
        triggerPeriodicAlert();
        resolve();
      })
    );
  }
});

// --- 4. MESSAGE EVENT LISTENER (TIMER MANAGEMENT) ---
self.addEventListener('message', function (event) {
  if (!event.data) return;

  // Manual developer command to trigger the 2-4 min loop immediately
  if (event.data.type === 'FORCE_DEV_LOOP_TRIGGER') {
    triggerPeriodicAlert();
    startPeriodicNotificationLoop(); // Resets and continues the background loop
  }

  // Background timer logic sent from ShopPage (ad watched reward)
  if (event.data.type === 'START_BACKGROUND_TIMER') {
    var isSafari = /^((?!chrome|android).)*safari/i.test(self.navigator.userAgent);
    if (isSafari) return; // Guard Safari background constraints

    var delayMs = event.data.delay || 10000;
    var targetUrl = event.data.url || (self.location.origin + "/shop");

    event.waitUntil(
      new Promise(function (resolve) {
        setTimeout(function () {
          
          self.registration.showNotification("Ad Completed! 🪙", {
            body: "Your countdown is finished! Tap here to claim your 500 coins.",
            icon: APP_ICON,
            badge: APP_BADGE,
            tag: "reward-claim-ready",
            renotify: true,
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: { url: targetUrl }
          }).then(function() {
            // Notify any open app windows simultaneously
            return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
              if (clientList[i].focused) {
                clientList[i].postMessage({ type: 'BACKGROUND_TIMER_COMPLETE' });
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
          
          // Small safety delay to let the page settle before passing the claim trigger
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