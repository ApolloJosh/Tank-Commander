/* Tank Commander service worker — offline play + installability.
   Bump CACHE_V on every deploy so players get the new build. */
const CACHE_V='tc-v9.6.0';
const CORE=['./','./index.html'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE_V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;                       // never touch API POSTs (auth/sync/rivals)
  if(e.request.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname==='/'){
    // network-first: fresh deploys win, cache is the offline fallback
    e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE_V).then(c=>c.put(e.request,cp));return r;})
      .catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
    return;
  }
  if(/fonts\.(googleapis|gstatic)\.com/.test(u.host)||/\.(png|json|svg)$/.test(u.pathname)){
    // cache-first for fonts/icons/manifest
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone();caches.open(CACHE_V).then(c=>c.put(e.request,cp));return res;})));
  }
});
