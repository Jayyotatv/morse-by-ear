/* Offline support: pages are network first, everything else is served from cache and refreshed in the background. */
const V='mbe-v1';
const CORE=['./','index.html','learn.html','practice.html','chart.html','guide.html','404.html','manifest.webmanifest',
  'assets/site.css','assets/morse.js','assets/courses.js','assets/learn.js','assets/practice.js',
  'assets/favicon-32.png','assets/icon-192.png','assets/apple-touch-icon.png',
  'assets/img/morsetelegraph.jpg','assets/img/morsetelegraph-800.jpg','assets/img/scr188-800.jpg','assets/img/richmond-800.jpg',
  'assets/img/nw7us-800.jpg','assets/img/paddle-800.jpg','assets/img/straightkey-800.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{const copy=res.clone();caches.open(V).then(c=>c.put(r,copy));return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(hit=>{
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const copy=res.clone();caches.open(V).then(c=>c.put(r,copy))}return res}).catch(()=>hit);
    return hit||net;
  }));
});
