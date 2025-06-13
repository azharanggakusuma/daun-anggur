const CACHE_NAME = 'grapecheck-cache-v1';
// Daftar URL aset utama yang akan disimpan di cache
const URLS_TO_CACHE = [
  '/',
  '/riwayat',
  '/penyakit',
  '/tentang',
  '/static/css/style.css',
  '/static/js/theme.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'
];

// Event 'install': Dipanggil saat service worker pertama kali diinstal
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache dibuka');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Event 'fetch': Dipanggil setiap kali ada permintaan jaringan dari aplikasi
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika permintaan ada di cache, kembalikan dari cache
        if (response) {
          return response;
        }
        // Jika tidak, lakukan permintaan ke jaringan
        return fetch(event.request);
      })
  );
});

// Event 'activate': Membersihkan cache lama jika ada versi baru
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});