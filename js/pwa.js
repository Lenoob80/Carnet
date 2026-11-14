/* PWA : installation sur l'écran d'accueil (iPhone, Android) et fonctionnement hors ligne */
(function(){
  var standalone=navigator.standalone||matchMedia('(display-mode: standalone)').matches,deferred=null;
  if(standalone)document.documentElement.classList.add('standalone');

  /* Android / Chrome : installation en un clic ; iPhone : mode d'emploi (Safari n'a pas de bouton d'installation) */
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e});
  window.addEventListener('appinstalled',function(){deferred=null;toast('Carnet installé sur l’écran d’accueil.')});
  ACTIONS.install=function(){
    if(deferred){deferred.prompt();deferred=null;return}
    var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform=='MacIntel'&&navigator.maxTouchPoints>1);
    openModal('📲 Installer le carnet',
      '<p style="margin:0 0 8px"><b>'+(ios?'Sur iPhone / iPad (dans Safari) :':'Sur iPhone / iPad (dans Safari) :')+'</b></p>'+
      '<ol style="margin:0 0 12px;padding-left:20px;line-height:1.7"><li>Ouvre le site dans <b>Safari</b>.</li>'+
      '<li>Touche le bouton <b>Partager</b> (le carré avec une flèche vers le haut).</li>'+
      '<li>Fais défiler et touche <b>« Sur l’écran d’accueil »</b>.</li><li>Touche <b>Ajouter</b>.</li></ol>'+
      '<p style="margin:0 0 8px"><b>Sur Android / ordinateur (Chrome, Edge) :</b> menu ⋮ → « Installer l’application ».</p>'+
      '<p style="margin:0;color:var(--muted)">L’app installée a son propre stockage : à la première ouverture, reconnecte-toi (e-mail, mot de passe, dépôt, jeton). Tes notes se rechargent depuis GitHub, puis restent disponibles hors ligne.</p>');
  };

  /* garde les données même si l'appareil manque de place */
  if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(function(){});

  window.addEventListener('offline',function(){toast('Hors ligne : tes modifications sont gardées sur l’appareil.')});
  window.addEventListener('online',function(){toast('Connexion retrouvée : synchronisation…')});

  /* service worker : met l'application en cache pour l'ouvrir sans réseau */
  if('serviceWorker' in navigator){
    var had=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',function(){
      if(had)toast('Mise à jour installée : recharge la page pour l’utiliser.');
      had=true;
    });
    window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
  }
})();
