// 1. IMPORT ONESIGNAL (Must remain the first line)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// 2. THE 35 UNIQUE CAMPAIGN NOTIFICATIONS WITH GAMEPLAY BUFFS
var campaigns = [
  // --- Modern Gameplay Buff Notifications ---
  { title: "🎁 Surprise Drop!", body: "A random drop just landed in the shop. Check it out!", url: "/shop?ref=periodic-alert-1&buff=exclusive_pack" },
  { title: "⚡ Claim Your Free Coins!", body: "Coins are waiting for you! Don't miss out.", url: "/shop?ref=periodic-alert-2&buff=coin_grant_250" },
  { title: "📦 Restock Alert!", body: "The vault has been freshly restocked with new packs!", url: "/shop?ref=periodic-alert-3&buff=exclusive_pack" },
  { title: "🔥 Limited Offer!", body: "Claim your special discount in the shop right now!", url: "/shop?ref=periodic-alert-4&buff=discount_20" },
  { title: "🍀 Lucky Spin!", body: "Is today your lucky day? Open a pack to find out!", url: "/shop?ref=periodic-alert-5&buff=luck_boost_2x" },
  { title: "💎 Diamond Deal!", body: "Exclusive rewards are active. Tap to enter!", url: "/shop?ref=periodic-alert-6&buff=coin_grant_500" },
  { title: "🗝️ Vault is Open!", body: "The secret vault is waiting for your key!", url: "/shop?ref=periodic-alert-7&buff=exclusive_pack" },
  { title: "👑 Royalty Reward!", body: "Your level progression speed is boosted!", url: "/shop?ref=periodic-alert-8&buff=xp_boost_2x" },
  { title: "🛸 Cosmic Drop!", body: "Rare items have drifted into the store. Grab yours!", url: "/shop?ref=periodic-alert-9&buff=exclusive_pack" },
  { title: "🎉 Daily Mystery!", body: "Solve the mystery and reveal your free reward!", url: "/shop?ref=periodic-alert-10&buff=coin_grant_150" },
  { title: "🍕 Snack Break?", body: "Take a quick break and grab your daily drop!", url: "/shop?ref=periodic-alert-11&buff=coin_grant_100" },
  { title: "⌛ Clock is Ticking!", body: "Don't let your free daily claim expire!", url: "/shop?ref=periodic-alert-12&buff=discount_10" },
  { title: "🌟 Star Treatment!", body: "Get double drop rates in the shop for a limited time!", url: "/shop?ref=periodic-alert-13&buff=luck_boost_2x" },
  { title: "🏆 Champion Pack!", body: "Open the ultimate chest and see what you win!", url: "/shop?ref=periodic-alert-14&buff=exclusive_pack" },
  { title: "🛡️ Secure the Goods!", body: "Protect your streak! Log in to claim your daily gift.", url: "/shop?ref=periodic-alert-15&buff=xp_boost_2x" },
  { title: "🎈 Party Time!", body: "We're celebrating! Open a pack for a bonus reward.", url: "/shop?ref=periodic-alert-16&buff=discount_15" },
  { title: "🎮 Ready Player One?", body: "The pack opening arena is waiting for you.", url: "/shop?ref=periodic-alert-17&buff=luck_boost_1.5x" },
  { title: "🦄 Mythic Hunt!", body: "A mythic card has been spotted. Can you pull it?", url: "/shop?ref=periodic-alert-18&buff=luck_boost_3x" },
  { title: "🚀 Lift Off!", body: "Launch into today's events and boost your balance!", url: "/shop?ref=periodic-alert-19&buff=coin_grant_300" },
  { title: "🤫 Secret Stash!", body: "We hid a special pack in the store. Can you find it?", url: "/shop?ref=periodic-alert-20&buff=exclusive_pack" },

  // --- Classic Retention Notifications ---
  { title: "🔥 Streak At Risk!", body: "Keep your consecutive daily streak alive! Log in to claim your daily bonus.", url: "/shop?ref=classic-streak&buff=coin_grant_100" },
  { title: "👋 We Miss You!", body: "It's been a minute! Drop back in to receive a welcome back luck multiplier.", url: "/shop?ref=classic-comeback&buff=luck_boost_1.5x" },
  { title: "🏷️ Weekly Special!", body: "The weekly shop catalog has refreshed. Enjoy 10% off your next pack!", url: "/shop?ref=classic-weekly&buff=discount_10" },
  { title: "🎲 Free Roll Active!", body: "Your daily free coin allotment has finished generating. Claim them now!", url: "/shop?ref=classic-freeroll&buff=coin_grant_200" },
  { title: "⚡ Flash Sale Event!", body: "Limited-time deals are active right now. Secure an extra discount!", url: "/shop?ref=classic-flash&buff=discount_15" },
  { title: "📦 Hidden Chest Found!", body: "A mysterious unopened chest has drifted into the vault!", url: "/shop?ref=classic-mystery&buff=exclusive_pack" },
  { title: "🌙 Midnight Frenzy!", body: "Are you a night owl? Midnight luck is active for the next hour!", url: "/shop?ref=classic-midnight&buff=luck_boost_2x" },
  { title: "⚔️ Weekend Warrior!", body: "Double XP weekend is officially starting. Speed up your level rewards!", url: "/shop?ref=classic-weekend&buff=xp_boost_2x" },
  { title: "📈 Level Up Push!", body: "You are so close to your next rank. Grab this XP boost to push through!", url: "/shop?ref=classic-level&buff=xp_boost_2x" },
  { title: "🌞 Golden Hour!", body: "The sun is setting, but the drop rates are rising. 3x Luck is live!", url: "/shop?ref=classic-golden&buff=luck_boost_3x" },
  { title: "☔ Coin Rain!", body: "A passing storm just dropped a coin stash on the main page!", url: "/shop?ref=classic-rain&buff=coin_grant_500" },
  { title: "🔑 Lost Key Located!", body: "You found a lost key! Use it to bypass security and open the exclusive vault.", url: "/shop?ref=classic-key&buff=exclusive_pack" },
  { title: "💼 Clean Out the Store!", body: "Your inventory is looking empty. Let's fill it up with some fresh coins!", url: "/shop?ref=classic-inventory&buff=coin_grant_150" },
  { title: "✨ Collector's Edition!", body: "An extremely rare pack variant has appeared. Unlock it before it fades!", url: "/shop?ref=classic-collector&buff=exclusive_pack" },
  { title: "🎰 High Roller Club!", body: "Step up to the tables. A temporary luck multiplier has been credited to you!", url: "/shop?ref=classic-highroller&buff=luck_boost_2x" }
];

// 3. INITIALIZATION & LOOP MANAGEMENT
var loopTimeoutId = null;

function startPeriodicNotificationLoop(isFirstRun) {
  if (loopTimeoutId) clearTimeout(loopTimeoutId);

  var delay;
  if (isFirstRun) {
    // Generate a completely random time within the first 2 minutes (0 to 120,000 ms)
    delay = Math.floor(Math.random() * 120000);
    console.log("[SW] First notification scheduled in " + Math.round(delay / 1000) + " seconds.");
  } else {
    // Standard 10 minutes (600,000 ms) +/- 30 seconds (30,000 ms variance) to make it organic
    var tenMinutes = 600000;
    var variance = Math.floor((Math.random() * 60000) - 30000);
    delay = tenMinutes + variance;
    console.log("[SW] Next notification scheduled in " + Math.round(delay / 1000 / 60) + " minutes.");
  }

  loopTimeoutId = setTimeout(function () {
    triggerPeriodicAlert();
    // Subsequent loops are marked as false (no longer the first run)
    startPeriodicNotificationLoop(false);
  }, delay);
}

function triggerPeriodicAlert() {
  var randomIndex = Math.floor(Math.random() * campaigns.length);
  var campaign = campaigns[randomIndex];

  self.registration.showNotification(campaign.title, {
    body: campaign.body,
    icon: '/images/cup.png',
    badge: '/images/apple-pay.png',
    tag: 'periodic-alert-' + Date.now(),
    data: { url: self.location.origin + campaign.url }
  }).catch(function(err) { 
    console.error("[SW] Periodic alert error:", err); 
  });
}

// 4. EVENT LISTENERS
self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    self.clients.claim().then(function() {
      // Start the loop with "true" to enforce the < 2-minute randomized first drop
      startPeriodicNotificationLoop(true);
    })
  );
});

self.addEventListener('message', function (event) {
  try {
    // Guard against non-object event.data to prevent errors
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.type === 'FORCE_DEV_LOOP_TRIGGER') {
      triggerPeriodicAlert();
    }

    if (event.data.type === 'START_BACKGROUND_TIMER') {
      var delayMs = event.data.delay || 10000;
      var targetUrl = event.data.url || (self.location.origin + "/shop?ref=reward-claim");
      var amount = event.data.amount || 500;

      event.waitUntil(
        new Promise(function (resolve) {
          setTimeout(function () {
            self.registration.showNotification("Ad Completed! 🪙", {
              body: "Your countdown is finished! Tap here to claim your " + amount + " coins.",
              icon: '/images/cup.png',
              badge: '/images/apple-pay.png',
              tag: "reward-claim-" + Date.now(),
              renotify: true,
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
  } catch (err) {
    // Prevent any errors in our handler from propagating and potentially
    // interfering with OneSignal's message handling
    console.error("[SW] Error in message handler:", err);
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
    data: { url: payload.url || '/shop?ref=push-alert' }
  };
  event.waitUntil(self.registration.showNotification(payload.title || "Alert", options));
});

self.addEventListener('notificationclick', function (event) {
  if (event.notification.data && (event.notification.data.custom || event.notification.data.OS_DATA)) return;

  event.notification.close();

  var targetUrl = "/shop?ref=notification-click";

  if (event.notification.data && event.notification.data.url) {
    var rawUrl = event.notification.data.url;
    if (rawUrl !== 'undefined' && rawUrl !== 'null' && rawUrl !== '') {
      targetUrl = rawUrl;

      // Keep existing parameters intact, but append fallback if missing
      if (targetUrl.indexOf('ref=') === -1) {
        targetUrl += (targetUrl.indexOf('?') === -1 ? '?' : '&') + 'ref=notification-click';
      }
    }
  }

  var destinationUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client && new URL(client.url).origin === self.location.origin) {
          client.navigate(destinationUrl);
          var amount = event.notification.data && event.notification.data.amount ? event.notification.data.amount : 500;
          client.postMessage({ type: 'BACKGROUND_TIMER_COMPLETE', amount: amount });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(destinationUrl);
    })
  );
});

self.addEventListener('notificationclose', function (event) {
  // OneSignal may use this event for analytics or cleanup
  // We don't need to do anything specific here, but we should not prevent
  // OneSignal from handling it if they have their own listener
});

self.addEventListener('sync', function (event) {
  // OneSignal may use sync events for background tasks
  // Let it pass through to their handlers if they have any
});

self.addEventListener('periodicsync', function (event) {
  if (event.tag === 'periodic-drops') {
    event.waitUntil(new Promise(function(resolve) { triggerPeriodicAlert(); resolve(); }));
  }
});