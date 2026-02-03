const CACHE_NAME = 'npc-gen-v12';

const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/data-loader.js',
  './js/generator.js',
  './js/storage.js',
  './js/ui.js',
  './data/races.json',
  './data/archetypes.json',
  './data/actions.json',
  './data/traits.json',
  './data/reactions.json',
  './data/faces.json',
  './data/names_human.json',
  './data/names_elf.json',
  './data/names_dwarf.json',
  './data/names_halfling.json',
  './data/names_tiefling.json',
  './data/physical_sentences.json',
  './data/psych_good.json',
  './data/psych_neutral.json',
  './data/psych_evil.json',
  './data/faces/face_01.png',
  './data/faces/face_02.png',
  './data/faces/face_03.png',
  './data/faces/face_04.png',
  './data/faces/face_05.png',
  './data/faces/face_06.png',
  './data/faces/face_07.png',
  './data/faces/face_08.png',
  './data/faces/face_09.png',
  './data/faces/face_10.png',
  './data/faces/face_11.png',
  './data/faces/face_12.png',
  './data/faces/face_13.png',
  './data/faces/face_14.png',
  './data/faces/face_15.png',
  './data/faces/face_16.png',
  './data/faces/face_17.png',
  './data/faces/face_18.png',
  './data/faces/face_19.png',
  './data/faces/face_20.png',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});











