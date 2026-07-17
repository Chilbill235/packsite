// 1. IMPORT ONESIGNAL (Must remain the first line)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// 2. INITIALIZATION & LOOP MANAGEMENT
var loopTimeoutId = null;

function startPeriodicNotificationLoop() {
  if (loopTimeoutId) clearTimeout(loopTimeoutId);
  loopTimeoutId = setTimeout(function () {
    triggerPeriodicAlert();
    startPeriodicNotificationLoop();
  }, 10 * 60 * 1000); // 10 minutes
}

function triggerPeriodicAlert() {
  var campaign = { title: "🎁 Surprise!", body: "Tap to visit the shop!", url: "/shop" };
  self.registration.showNotification(campaign.title, {
    body: campaign.body,
    icon: '/images/cup.png',
    badge: '/images/apple-pay.png',
    tag: 'periodic-alert-' + Date.now(), // Unique tag per trigger
    data: { url: self.location.origin + campaign.url }
  }).catch(function(err) { console.error("[SW] Periodic alert error:", err); });
}

// 3. EVENT LISTENERS
self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    self.clients.claim().then(function() {
      // Start the loop only once on activation
      startPeriodicNotificationLoop();
    })
  );
});

self.addEventListener('message', function (event) {
  if (!event.data) return;

  // Handle manual trigger
  if (event.data.type === 'FORCE_DEV_LOOP_TRIGGER') {
    triggerPeriodicAlert();
  }

  // Handle Ad Timer
  if (event.data.type === 'START_BACKGROUND_TIMER') {
    var delayMs = event.data.delay || 10000;
    var targetUrl = event.data.url || (self.location.origin + "/shop");
    var amount = event.data.amount || 500; 

    event.waitUntil(
      new Promise(function (resolve) {
        setTimeout(function () {
          self.registration.showNotification("Ad Completed! 🪙", {
            body: "Your countdown is finished! Tap here to claim your " + amount + " coins.",
            icon: '/images/cup.png',
            badge: '/images/apple-pay.png',
            tag: "reward-claim-" + Date.now(), // UNIQUE TAG
            renotify: true,
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: { url: targetUrl, amount: amount }
          })
          .then(function() {
            return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          })
          .then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
              clientList[i].postMessage({ type: 'BACKGROUND_TIMER_COMPLETE', amount: amount });
            }
            resolve();
          })
          .catch(function(err) {
            console.error("[SW] Notification display error:", err);
            resolve();
          });
        }, delayMs);
      })
    );
  }
});

self.addEventListener('push', function (event) {
  var payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { return; }
  if (payload.custom || (payload.data && payload.data.custom)) return; 

  var options = {
    body: payload.body || "Tap to return to the app!",
    icon: '/images/cup.png',
    badge: '/images/apple-pay.png',
    tag: payload.tag || 'general-broadcast-' + Date.now(),
    renotify: true,
    data: { url: payload.url || '/shop' }
  };
  event.waitUntil(self.registration.showNotification(payload.title || "Alert", options));
});

self.addEventListener('notificationclick', function (event) {
  if (event.notification.data && (event.notification.data.custom || event.notification.data.OS_DATA)) return; 
  
  event.notification.close();
  var targetUrl = event.notification.data ? event.notification.data.url : '/shop';
  var destinationUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client && new URL(client.url).origin === self.location.origin) {
          client.navigate(destinationUrl);
          client.postMessage({ type: 'BACKGROUND_TIMER_COMPLETE' });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(destinationUrl);
    })
  );
});

self.addEventListener('periodicsync', function (event) {
  if (event.tag === 'periodic-drops') {
    event.waitUntil(new Promise(function(resolve) { triggerPeriodicAlert(); resolve(); }));
  }
});