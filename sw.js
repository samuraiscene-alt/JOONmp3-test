'use strict';
const CACHE = 'joonmp3-v4-library-20261012-14';
const FILES = ['./', './index.html', './converter-worker.js', './manifest.webmanifest', './manifest.webmanifest?v=412', './icons/joonmp3-icon.png', './icons/joonmp3-home-v412.png', './apple-touch-icon-v411.png', './apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE && (key.startsWith('joonmp3-bg-test-') || key.startsWith('joonmp3-v2-') || key.startsWith('joonmp3-v3-') || key.startsWith('joonmp3-v4-'))).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname) || event.request.headers.has('range')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put('./index.html', copy))); }
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
