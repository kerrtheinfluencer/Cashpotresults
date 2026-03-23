diff --git a/sw.js b/sw.js
index 0745df73d8d0be131cad7989bf0f4153a476de7f..02973540ef0dc29083581c4f834b476c079401d6 100644
--- a/sw.js
+++ b/sw.js
@@ -1,31 +1,44 @@
-var CACHE="cashpotja-v3";
+var CACHE="cashpotja-v4";
+
+self.addEventListener("install",function(){
+  self.skipWaiting();
+});
+
+self.addEventListener("activate",function(e){
+  e.waitUntil(
+    caches.keys().then(function(keys){
+      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
+    }).then(function(){return self.clients.claim();})
+  );
+});
 
-self.addEventListener("install",function(e){self.skipWaiting()});
-self.addEventListener("activate",function(e){self.clients.claim()});
 self.addEventListener("fetch",function(e){
-  e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request)}));
+  if(e.request.method!=="GET") return;
+  e.respondWith(
+    fetch(e.request,{cache:"no-store"}).catch(function(){return caches.match(e.request);})
+  );
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

         
