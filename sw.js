const CACHE='cashpotja-v2';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{self.clients.claim()});
self.addEventListener('fetch',e=>{
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))
});
self.addEventListener('push',e=>{
  const data=e.data?e.data.json():{title:'New Cash Pot Result!',body:'Check the latest numbers'};
  e.waitUntil(self.registration.showNotification(data.title,{body:data.body,vibrate:[200,100,200],data:{url:'./'}}))
});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow(e.notification.data.url||'./'))});
