/* Carnet 3.3.2 — correctifs de mise en page sûrs.
   Important : aucun ResizeObserver/MutationObserver ne relance fit en boucle.
   Les coordonnées sauvegardées des blocs ne sont jamais modifiées. */
(function(){
  'use strict';
  var originalFit = window.fit;
  var resizeTimer = null;
  var refreshTimer = null;

  function page(){ return document.getElementById('page'); }
  function getBoxRight(el){
    var x = parseFloat(el.style.left) || 0;
    var w = parseFloat(el.style.width) || el.offsetWidth || 200;
    return x + w;
  }
  function applyLayout(){
    var p = page();
    if(!p) return false;
    var boxes = Array.prototype.slice.call(p.querySelectorAll(':scope > .box'));
    var maxRight = boxes.reduce(function(m,b){ return Math.max(m,getBoxRight(b)); },0);
    var width = Math.max(0,p.clientWidth - 36);
    var automatic = boxes.length > 0 && (maxRight > width || width < 760);
    var flow = p.dataset.workspaceForce === 'free' ? false : p.dataset.workspaceForce === 'flow' ? true : automatic;
    var changed = p.classList.contains('flow-layout') !== flow;
    p.classList.toggle('flow-layout',flow);
    p.dataset.workspaceLayout = flow ? 'flow' : 'free';
    var btn = document.getElementById('workspaceLayoutState');
    if(btn){
      btn.textContent = flow ? '↕ Mise en page adaptée' : '⤢ Disposition libre';
      btn.title = flow ? 'Les blocs sont empilés pour éviter tout débordement. Les positions originales sont conservées.' : 'Les blocs conservent leur position libre.';
      btn.setAttribute('aria-pressed',String(flow));
    }
    return changed;
  }

  /* Un seul passage après le fit normal : pas de second fit déclenché par une
     observation de taille, ce qui évite les boucles de reflow. */
  if(typeof originalFit === 'function'){
    window.fit = function(){
      originalFit();
      applyLayout();
    };
  }

  function addLayoutStatus(){
    var fb = document.getElementById('fb');
    if(!fb || document.getElementById('workspaceLayoutState')) return;
    var tabs = fb.querySelector('.tabs');
    if(!tabs) return;
    var b = document.createElement('button');
    b.type='button'; b.id='workspaceLayoutState'; b.className='btn sm';
    b.textContent='↕ Mise en page adaptée';
    b.title='Disposition du document';
    b.addEventListener('click',function(){
      var p=page(); if(!p) return;
      p.dataset.workspaceForce=p.classList.contains('flow-layout')?'free':'flow';
      applyLayout();
    });
    tabs.appendChild(b);
  }

  function repairTextNode(node){
    var s=node.nodeValue;
    if(!/(Ã.|Â.|â€|Å“|ðŸ)/.test(s)) return false;
    try{
      var decoded=decodeURIComponent(escape(s));
      if(decoded!==s && !/(Ã.|Â.|â€|Å“)/.test(decoded)){ node.nodeValue=decoded; return true; }
    }catch(e){}
    var map={
      'Ã ':'à','Ã¢':'â','Ã¤':'ä','Ã§':'ç','Ã¨':'è','Ã©':'é','Ãª':'ê','Ã«':'ë',
      'Ã®':'î','Ã¯':'ï','Ã´':'ô','Ã¶':'ö','Ã¹':'ù','Ã»':'û','Ã¼':'ü','Ã‰':'É',
      'Ã€':'À','Ã‡':'Ç','Å“':'œ','Å’':'Œ','â€™':'’','â€œ':'“','â€�':'”',
      'â€“':'–','â€”':'—','â€¦':'…','Â ':' ','Â»':'»','Â«':'«'
    };
    var out=s;
    Object.keys(map).forEach(function(k){out=out.split(k).join(map[k]);});
    if(out!==s){node.nodeValue=out;return true;}
    return false;
  }
  function repairEncoding(){
    var root=page(); if(!root) return;
    var count=0, walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT), node;
    while((node=walker.nextNode())) if(repairTextNode(node)) count++;
    if(count){ if(typeof ser==='function')ser(); if(typeof save==='function')save(); if(typeof toast==='function')toast('Accents corrigés dans '+count+' zone(s) de texte.'); }
    else if(typeof toast==='function')toast('Aucun texte avec un encodage incorrect détecté.');
  }
  function registerRepair(){ if(window.ACTIONS) ACTIONS['repair-encoding']=repairEncoding; }

  function refresh(){ addLayoutStatus(); registerRepair(); applyLayout(); }
  function scheduleRefresh(delay){ clearTimeout(refreshTimer); refreshTimer=setTimeout(refresh,delay||0); }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();

  /* Les interactions de navigation déclenchent une seule mise à jour différée. */
  document.addEventListener('click',function(e){
    if(e.target.closest && e.target.closest('[data-tab],[data-p],[data-s]')) scheduleRefresh(80);
  });
  window.addEventListener('resize',function(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(function(){ applyLayout(); },180);
  },{passive:true});

  /* Le ruban peut être créé après le chargement initial : quelques vérifications
     bornées, puis arrêt définitif. Aucun observateur permanent. */
  var tries=0,wait=setInterval(function(){
    tries++; refresh();
    if(document.getElementById('fb') || tries>=12) clearInterval(wait);
  },250);
})();
