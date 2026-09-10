/* ============================================================
   Service Worker — オフラインで遊べるようにするための仕組み
   ファイルを更新したら VERSION の数字を1つ上げてください。
   ============================================================ */
const VERSION = 'jigsaw-v31';
const ASSETS = [
  "./",
  "index.html",
  "images.js",
  "carve.js",
  "assets/carve/cat.jpg",
  "assets/carve/poodle.jpg",
  "assets/carve/mucha.jpg",
  "manifest.json",
  "robots.txt",
  "icon.svg",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png",
  "assets/photos/234A0841.jpg",
  "assets/photos/7J9A0070.jpg",
  "assets/photos/7J9A1913.jpg",
  "assets/photos/IMG_7794.jpg",
  "assets/photos/bear.jpg",
  "assets/photos/grace.jpg",
  "assets/photos/hall.jpg",
  "assets/photos/keiba.jpg",
  "assets/photos/p4170.jpg",
  "assets/photos/p5422.jpg",
  "assets/photos/p5749.jpg",
  "assets/photos/p6035.jpg",
  "assets/photos/p7913.jpg",
  "assets/photos/p8440.jpg",
  "assets/photos/paddock.jpg",
  "assets/photos/s2-2.jpg",
  "assets/photos/s2.jpg",
  "assets/photos/s3-2.jpg",
  "assets/photos/s3-3.jpg",
  "assets/photos/s3.jpg",
  "assets/photos/screen_2x.jpg",
  "assets/photos/street_cat.jpg"
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('プリキャッシュに失敗:', err))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 取り出し方を2種類に分ける
   ・HTML と JS（アプリの中身）……ネット優先。更新をすぐ反映する
   ・画像 …………………………………保存優先。表示が速く、通信も節約できる
   どちらもネットが無いときは保存済みを使うので、オフラインでも遊べる */
const isCode = url => /\.(html|js|json)$/.test(url.pathname) || url.pathname.endsWith('/');

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate' || isCode(url)) {
    // ネット優先
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('index.html')))
    );
    return;
  }

  // 画像などは保存優先（裏で最新に更新しておく）
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
