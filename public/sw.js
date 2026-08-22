self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  const { title, body, personaId } = payload;

  event.waitUntil(
    self.registration.showNotification(title || "디스키온 Love", {
      body: body || "",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: personaId ? `nudge-${personaId}` : undefined,
      data: { personaId, body },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { personaId, body } = event.notification.data || {};
  const url = personaId
    ? `/?nudge=${encodeURIComponent(personaId)}&msg=${encodeURIComponent(body || "")}`
    : "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
