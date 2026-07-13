self.addEventListener('push', function(event) {
  let data = {};
  try {
    // Expecting a payload like: { title, body, url, tag }
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error("Push data error", e);
  }

  const options = {
    body: data.body || "Your reward is ready!",
    icon: '/icon-192.png', // Ensure high-res icon
    badge: '/badge-72.png', // Monochromatic badge for status bar
    image: data.image || '/promo-banner.png', // Large hero image
    requireInteraction: true,
    dir: 'ltr',
    lang: 'en-US',
    vibrate: [200, 100, 200], // Cool "pulse" vibration pattern
    tag: data.tag || 'ad-reward', // Prevents multiple notifications stacking
    renotify: true,
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open-shop',
        title: '💎 Claim Now',
      },
      {
        action: 'close',
        title: 'Dismiss',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Ad Reward", options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Focus or open the URL provided in the push payload
  const url = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});