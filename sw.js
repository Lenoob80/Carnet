/* Service worker : le carnet s'ouvre et fonctionne sans réseau.
   - fichiers du site : réseau d'abord (toujours à jour), copie locale si pas de réseau
   - bibliothèques cdnjs : copie locale d'abord (versions fixes)
   - api.github.com et tout le reste : jamais intercepté, jamais mis en cache */
var VERSION='carnet-20261125-school-workspace-402';
var SHELL=[
 "./",
 "index.html",
 "manifest.webmanifest",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/apple-touch-icon.png",
 "js/core.js",
 "js/tableaux.js",
 "js/excel.js",
 "js/outils.js",
 "js/pdf.js",
 "js/confort.js",
 "js/modal.js",
 "js/selection.js",
 "js/objets.js",
 "js/dessin.js",
 "js/depot.js",
 "js/corbeille.js",
 "js/todo.js",
 "js/modeles.js",
 "js/liens.js",
 "js/mots.js",
 "js/tableaux2.js",
 "js/listes.js",
 "js/mobile2.js",
 "js/export.js",
 "js/etiquettes.js",
 "js/pomodoro.js",
 "js/rogner.js",
 "js/versions.js",
 "js/jeton.js",
 "js/raccourcis.js",
 "js/aide.js",
 "js/pronote.js",
 "js/pronote-connect.js",
 "js/menus.js",
 "js/couleurs.js",
 "js/pwa.js",
 "js/synchro.js",
 "js/carnet3.js",
 "js/workspacefix.js",
 "js/vendor/pawnote.bundle.js"
];
var CDN=[
 "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(VERSION).then(function(c){
      return Promise.all(
        SHELL.map(function(u){return c.add(u).catch(function(){})}).concat(
        CDN.map(function(u){return c.add(new Request(u,{mode:'cors'})).catch(function(){})}))
      );
    }).then(function(){return self.skipWaiting()})
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==VERSION}).map(function(k){return caches.delete(k)}));
    }).then(function(){return self.clients.claim()})
  );
});

function networkFirst(req){
  return caches.open(VERSION).then(function(cache){
    var timeout=new Promise(function(_,rej){setTimeout(function(){rej(new Error('timeout'))},4000)});
    return Promise.race([fetch(req,{cache:'no-cache'}),timeout]).then(function(res){
      if(res&&res.ok)cache.put(req,res.clone());
      return res;
    }).catch(function(err){
      return cache.match(req,{ignoreSearch:true}).then(function(hit){
        if(hit)return hit;
        if(req.mode==='navigate')return cache.match('index.html').then(function(h){return h||cache.match('./')});
        throw err;
      });
    });
  });
}
function cacheFirst(req){
  return caches.open(VERSION).then(function(cache){
    return cache.match(req).then(function(hit){
      if(hit)return hit;
      return fetch(req).then(function(res){
        if(res&&(res.ok||res.type==='opaque'))cache.put(req,res.clone());
        return res;
      });
    });
  });
}
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin===self.location.origin)e.respondWith(networkFirst(req));
  else if(url.hostname==='cdnjs.cloudflare.com')e.respondWith(cacheFirst(req));
});
