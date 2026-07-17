// 1. IMPORT ONLY
importScripts("/OneSignalSDKWorker.js");

// 2. THE MESSAGE LISTENER (Must be at the root level, no async, no if-blocks around it)
self.addEventListener('message', (event) => {
    // Basic safety check
    if (!event.data || !event.data.type) return;

    if (event.data.type === 'START_BACKGROUND_TIMER') {
        const { delay, url, amount } = event.data;
        
        event.waitUntil(
            new Promise((resolve) => {
                setTimeout(() => {
                    self.registration.showNotification("Ad Completed! 🪙", {
                        body: `Claim your ${amount} coins!`,
                        icon: '/images/cup.png',
                        tag: "reward-claim-ready",
                        data: { url: url || '/shop' }
                    }).then(() => self.clients.matchAll({ type: 'window' }))
                      .then((clients) => {
                        clients.forEach(c => c.postMessage({ type: 'BACKGROUND_TIMER_COMPLETE' }));
                        resolve();
                      }).catch(resolve);
                }, delay || 10000);
            })
        );
    }
});