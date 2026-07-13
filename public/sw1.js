// public/sw1.js
self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    console.error("Push data error", e);
  }

  const options = {
    body: data.body || "Your reward is ready!",
    icon: '/icon.png',
    badge: '/badge.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Ad Reward", options)
  );
});

// Optional: Handle clicking the notification to bring the user back
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // Or the specific shop URL
  );
});