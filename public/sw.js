self.addEventListener("push", event => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, url } = data;

  const promise = self.registration.showNotification(title, {
    body,
    icon: "/web-app-manifest-192x192.png",
    badge: "/web-app-manifest-192x192.png",
    data: { url },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  });

  event.waitUntil(promise);
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then(clients => {
      const existing = clients.find(c => c.url.includes(url) && "focus" in c);
      if (existing) {
        existing.focus();
      } else {
        self.clients.openWindow(url);
      }
    }),
  );
});
