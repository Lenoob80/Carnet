/* Carnet 3.3.4 — stabilité de l'espace de travail.
   Ne réécrit jamais les coordonnées enregistrées : le mode flux ne change que l'affichage. */
(function(){
  'use strict';
  var originalFit = window.fit;
  var resizeTimer = null;
  var refreshTimer = null;

  function page(){ return document.getElementById('page'); }
  function boxesOf(p){ return Array.prototype.slice.call(p.querySelectorAll(':scope > .box')); }
  function applyLayout(){
    var p = page();
    if(!p || !p.isConnected) return false;
    var width = p.clientWidth;
    if(width < 100) return false; // attendre que l'éditeur soit réellement visible
    var boxes = boxesOf(p);
    var right = 0;
    boxes.forEach(function(b){
      var left = Number.parseFloat(b.style.left);
      var w = Number.parseFloat(b.style.width);
      if(!Number.isFinite(left)) left = b.offsetLeft || 0;
      if(!Number.isFinite(w) || w <= 0) w = b.offsetWidth || 200;
      right = Math.max(right, left + w);
    });
    var forced = p.dataset.workspaceForce;
    var needsFlow = boxes.length > 0 && (right > width - 20 || width < 760);
    var flow = forced === 'free' ? false : forced === 'flow' ? true : needsFlow;
    p.classList.toggle('flow-layout', flow);
    p.dataset.workspaceLayout = flow ? 'flow' : 'free';
    var btn = document.getElementById('workspaceLayoutState');
    if(btn){
      btn.textContent = flow ? '↕ Mise en page adaptée' : '⤢ Disposition libre';
      btn.title = flow ? 'Les blocs sont empilés pour rester visibles. Leurs positions enregistrées sont conservées.' : 'Les blocs gardent leur position libre.';
      btn.setAttribute('aria-pressed', String(flow));
    }
    return true;
  }
  if(typeof originalFit === 'function'){
    window.fit = function(){
      originalFit();
      requestAnimationFrame(applyLayout);
    };
  }
  function addLayoutStatus(){
    var fb = document.getElementById('fb');
    if(!fb) return;
    var tabs = fb.querySelector('.tabs');
    if(tabs && !document.getElementById('workspaceLayoutState')){
      var b = document.createElement('button');
      b.type='button'; b.id='workspaceLayoutState'; b.className='btn sm';
      b.textContent='↕ Mise en page adaptée';
      b.title='Disposition du document';
      b.addEventListener('click',function(){
        var p=page(); if(!p) return;
        p.dataset.workspaceForce=p.dataset.workspaceLayout==='flow'?'free':'flow';
        applyLayout();
      });
      tabs.appendChild(b);
    }
    var pageTools = fb.querySelector('.tp[data-tp="page"]');
    if(pageTools && !pageTools.querySelector('[data-a="repair-encoding"]')){
      var repair=document.createElement('button');
      repair.type='button'; repair.className='btn sm'; repair.dataset.a='repair-encoding';
      repair.textContent='Aa Corriger les accents';
      repair.title='Corriger les caractères mal encodés dans la page (après vérification)';
      pageTools.appendChild(repair);
    }
  }
  function repairTextNode(node){
    var s=node.nodeValue;
    if(!/(Ã.|Â.|â€|Å“|ðŸ)/.test(s)) return false;
    try{
      var decoded=decodeURIComponent(escape(s));
      if(decoded!==s && !/(Ã.|Â.|â€|Å“)/.test(decoded)){ node.nodeValue=decoded; return true; }
    }catch(e){}
    var map={'Ã ':'à','Ã¢':'â','Ã¤':'ä','Ã§':'ç','Ã¨':'è','Ã©':'é','Ãª':'ê','Ã«':'ë','Ã®':'î','Ã¯':'ï','Ã´':'ô','Ã¶':'ö','Ã¹':'ù','Ã»':'û','Ã¼':'ü','Ã‰':'É','Ã€':'À','Ã‡':'Ç','Å“':'œ','Å’':'Œ','â€™':'’','â€œ':'“','â€�':'”','â€“':'–','â€”':'—','â€¦':'…','Â ':' ','Â»':'»','Â«':'«'};
    var out=s; Object.keys(map).forEach(function(k){out=out.split(k).join(map[k]);});
    if(out!==s){node.nodeValue=out;return true;} return false;
  }
  function repairEncoding(){
    var root=page(); if(!root) return;
    if(!confirm('Corriger les caractères mal encodés dans le texte de cette page ? Une sauvegarde sera déclenchée.')) return;
    var count=0,walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),node;
    while((node=walker.nextNode())) if(repairTextNode(node)) count++;
    if(count){ if(typeof ser==='function')ser(); if(typeof save==='function')save(); if(typeof toast==='function')toast('Accents corrigés dans '+count+' zone(s).'); }
    else if(typeof toast==='function')toast('Aucun texte mal encodé détecté.');
  }
  function registerRepair(){ if(window.ACTIONS) ACTIONS['repair-encoding']=repairEncoding; }
  function refresh(){ addLayoutStatus(); registerRepair(); applyLayout(); }
  function scheduleRefresh(delay){ clearTimeout(refreshTimer); refreshTimer=setTimeout(function(){requestAnimationFrame(refresh)},delay||0); }
  window.CarnetWorkspaceRefresh=function(){scheduleRefresh(0);};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();
  document.addEventListener('click',function(e){
    if(e.target.closest && e.target.closest('[data-tab],[data-p],[data-s],[data-c3="notebook"]')) scheduleRefresh(60);
  });
  window.addEventListener('resize',function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(function(){applyLayout()},140)},{passive:true});
  // Vérifications bornées : le ruban peut être créé au premier rendu, puis on s'arrête.
  var tries=0,wait=setInterval(function(){tries++;refresh();if(document.getElementById('fb')||tries>=20)clearInterval(wait)},200);
})();
