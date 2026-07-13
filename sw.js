const CACHE_NAME = 'barun-math-v3';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // 유튜브/외부 요청은 서비스워커가 손대지 않고 그대로 네트워크로
  if (url.origin !== self.location.origin) return;

  // 앱 화면(HTML)은 항상 최신 내용을 먼저 시도하고, 오프라인일 때만 캐시로 대체
  // -> 영상 목록을 새로 고쳐도 캐시 때문에 안 보이는 문제 방지
  const isAppShell = event.request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/');

  if (isAppShell) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 아이콘/매니페스트 등 잘 안 바뀌는 파일은 기존처럼 캐시 우선
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});
