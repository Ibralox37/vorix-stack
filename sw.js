/* =====================================================================
   Vorix Stack – Service Worker
   Macht das Spiel installierbar und offline spielbar.

   WICHTIG – nicht ändern:
   Unter derselben Adresse (ibralox37.github.io) liegen auch Timer Challenge,
   Spotter und Jump over the Wall. Dieser Service Worker löscht deshalb NUR
   seine eigenen Speicher (Name beginnt mit "vorix-stack-"). Fremde Speicher nie anfassen!
   ===================================================================== */

const SPIEL = 'vorix-stack-spiel-1';      // bei jeder neuen Version die Zahl erhöhen
const SCHRIFT = 'vorix-stack-schrift-1';  // Schriftarten
const DATEIEN = ['./', './index.html', './manifest.json', './vorix-logo-hell.png',
  './favicon.png', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const SCHRIFT_SERVER = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', ereignis => {
  ereignis.waitUntil(caches.open(SPIEL).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ereignis => {
  ereignis.waitUntil(
    caches.keys()
      .then(namen => Promise.all(namen
        .filter(n => n.startsWith('vorix-stack-') && n !== SPIEL && n !== SCHRIFT)   // nur eigene alte Speicher
        .map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ereignis => {
  const anfrage = ereignis.request;
  if (anfrage.method !== 'GET') return;
  const url = new URL(anfrage.url);
  // Eigene Dateien: zuerst aus dem Internet (damit Updates sofort da sind), ohne Internet aus dem Speicher
  if (url.origin === self.location.origin) {
    ereignis.respondWith(
      fetch(anfrage)
        .then(antwort => {
          if (antwort.ok) { const kopie = antwort.clone(); caches.open(SPIEL).then(c => c.put(anfrage, kopie)); }
          return antwort;
        })
        .catch(() => caches.match(anfrage).then(t => t || caches.match('./index.html')))
    );
    return;
  }
  // Schriftarten: einmal laden und merken
  if (SCHRIFT_SERVER.includes(url.hostname)) {
    ereignis.respondWith(
      caches.open(SCHRIFT).then(c => c.match(anfrage).then(treffer => treffer || fetch(anfrage).then(antwort => {
        if (antwort.ok) c.put(anfrage, antwort.clone());
        return antwort;
      })))
    );
  }
});
