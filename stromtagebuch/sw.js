const CACHE="stromtagebuch-v40";
const OCR_CACHE="stromtagebuch-ocr-v10";
const ASSETS=["./","./index.html","./manifest.webmanifest","./icon.svg"];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});

self.addEventListener("activate",event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE&&key!==OCR_CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);
  const sameOrigin=url.origin===self.location.origin;
  const isPage=event.request.mode==="navigate" || url.pathname.endsWith("/stromtagebuch/") || url.pathname.endsWith("/stromtagebuch/index.html");
  const isOcrAsset=
    (url.hostname==="cdn.jsdelivr.net" && url.pathname.toLowerCase().includes("tesseract")) ||
    url.hostname==="tessdata.projectnaptha.com" ||
    (url.hostname==="raw.githubusercontent.com" && url.pathname.toLowerCase().includes("tessdata_ssd")) ||
    (url.hostname==="unpkg.com" && url.pathname.toLowerCase().includes("tesseract"));

  if(isPage){
    event.respondWith(
      fetch(event.request,{cache:"no-store"}).then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put("./index.html",copy));
        return response;
      }).catch(()=>caches.match("./index.html").then(r=>r||caches.match("./")))
    );
    return;
  }

  if(isOcrAsset){
    event.respondWith(
      caches.open(OCR_CACHE).then(cache=>
        cache.match(event.request).then(cached=>
          cached || fetch(event.request).then(response=>{
            cache.put(event.request,response.clone()).catch(()=>{});
            return response;
          })
        )
      )
    );
    return;
  }

  if(sameOrigin){
    event.respondWith(
      caches.match(event.request).then(cached=>{
        const network=fetch(event.request).then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
          return response;
        }).catch(()=>cached);
        return cached||network;
      })
    );
  }
});