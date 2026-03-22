var CACHE="cashpotja-v3";

self.addEventListener("install",function(e){self.skipWaiting()});
self.addEventListener("activate",function(e){self.clients.claim()});
self.addEventListener("fetch",function(e){
  e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request)}));
});

self.addEventListener("push",function(e){
  var data={title:"New Cash Pot Result!",body:"Check the latest numbers",url:"./"};
  try{data=e.data.json()}catch(err){}
  e.waitUntil(
    self.registration.showNotification(data.title,{
      body:data.body,
      icon:"./img/icon-192.png",
      badge:"./img/icon-192.png",
      vibrate:[200,100,200],
      tag:"cashpot-result",
      renotify:true,
      data:{url:data.url||"./"}
    })
  );
});

self.addEventListener("notificationclick",function(e){
  e.notification.close();
  var url=e.notification.data&&e.notification.data.url?e.notification.data.url:"./";
  e.waitUntil(
    clients.matchAll({type:"window"}).then(function(list){
      for(var i=0;i<list.length;i++){
        if(list[i].url.indexOf("cashpot")>=0||list[i].url.indexOf("Cashpotresults")>=0){
          list[i].focus();
          return;
        }
      }
      clients.openWindow(url);
    })
  );
});
