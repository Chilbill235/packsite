// public/sw1.js
self.addEventListener('push', function (event) {
  let data = { title: "New Notification", body: "You have a new update!" };
  
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body,
    icon: '/icon.png', // Ensure this file exists in your public folder
    badge: '/badge.png'
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});