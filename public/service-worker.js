// public/service-worker.js
// 只拦截广告请求；其他请求不调用 respondWith，交给浏览器正常处理，
// 避免给每个资源增加一次 Service Worker 转发开销。

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (!event.request.url.includes("adsense")) {
    return;
  }

  event.respondWith(new Response(null, { status: 204 }));
});
