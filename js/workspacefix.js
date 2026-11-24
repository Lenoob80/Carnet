/* Carnet 3.3.1 — correctifs de mise en page du carnet.
   Ne modifie jamais les coordonnées enregistrées des blocs : le mode fluide est visuel uniquement. */
(function(){
  'use strict';
  var originalFit = window.fit;
  var lastMode = null;

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
    /* Quand les blocs dépassent la zone disponible, on les empile comme des blocs OneNote.
       Les coordonnées d'origine restent dans les styles inline et sont donc sauvegardées intactes. */
    var automatic = boxes.length > 0 && (maxRight > width || width < 760);
    var flow = p.dataset.workspaceForce === 'free' ? false : p.dataset.workspaceForce === 'flow' ? true : automatic;
    p.classList.toggle('flow-layout',flow);
    p.dataset.workspaceLayout = flow ? 'flow' : 'free';
    var btn = document.getElementById('workspaceLayoutState');
    if(btn){
      btn.textContent = flow ? '↕ Mise en page adaptée' : '⤢ Disposition libre';
      btn.title = flow ? 'Les blocs sont empilés pour éviter tout débordement. Les positions originales sont conservées.' : 'Les blocs conservent leur position libre.';
      btn.setAttribute('aria-pressed',String(flow));
    }
    if(lastMode !== flow){ lastMode=flow; return true; }
    return false;
  }

  if(typeof originalFit === 'function'){
    window.fit = function(){
      originalFit();
      if(applyLayout()) requestAnimationFrame(function(){ if(page()) originalFit(); });
    };
  }

  function addLayoutStatus(){
    var fb = document.getElementById('fb');
    if(!fb || document.getElementById('workspaceLayoutState')) return;
    var tabs = fb.querySelector('.tabs');
    if(tabs){
      var b = document.createElement('button');
      b.type='button'; b.id='workspaceLayoutState'; b.className='btn sm';
      b.textContent='↕ Mise en page adaptée';
      b.title='Disposition du document';
      b.addEventListener('click',function(){
        var p=page(); if(!p) return;
        var isFlow=p.classList.contains('flow-layout');
        p.dataset.workspaceForce=isFlow?'free':'flow';
        applyLayout();
        b.textContent=p.classList.contains('flow-layout')?'↕ Mise en page adaptée':'⤢ Disposition libre';
        b.setAttribute('aria-pressed',String(p.classList.contains('flow-layout')));
        if(typeof fit==='function') fit();
      });
      tabs.appendChild(b);
    }
  }

  /* Ajoute une action volontaire pour réparer les accents déjà enregistrés en mojibake.
     Aucun contenu n'est modifié automatiquement. */
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
  function registerRepair(){
    if(!window.ACTIONS) return;
    ACTIONS['repair-encoding']=repairEncoding;
  }

  function refresh(){
    addLayoutStatus(); registerRepair();
    if(typeof applyLayout==='function') applyLayout();
  }
  document.addEventListener('DOMContentLoaded',refresh);
  if(window.MutationObserver){
    var mo=new MutationObserver(function(records){
      for(var i=0;i<records.length;i++){
        if(records[i].target && (records[i].target.id==='main' || (records[i].target.closest && records[i].target.closest('#main')))){
          refresh(); break;
        }
      }
    });
    document.addEventListener('DOMContentLoaded',function(){var main=document.getElementById('main');if(main)mo.observe(main,{childList:true,subtree:true});});
  }
  document.addEventListener('click',function(e){
    if(e.target.closest && e.target.closest('[data-tab]')) setTimeout(refresh,0);
    if(e.target.closest && e.target.closest('[data-p],[data-s]')) setTimeout(refresh,80);
  });
  window.addEventListener('resize',function(){
    clearTimeout(window.__carnetLayoutTimer);
    window.__carnetLayoutTimer=setTimeout(function(){
      var changed=applyLayout();
      if(changed && typeof originalFit==='function') originalFit();
    },100);
  });
  if(window.ResizeObserver){
    var ro=new ResizeObserver(function(){
      var changed=applyLayout();
      if(changed && typeof originalFit==='function') requestAnimationFrame(originalFit);
    });
    document.addEventListener('DOMContentLoaded',function(){
      var main=document.getElementById('main'); if(main) ro.observe(main);
    });
  }
  /* Core appelle fit() pendant le rendu. Ce hook attend aussi les changements de page. */
  var tries=0,wait=setInterval(function(){
    tries++; refresh();
    if(document.getElementById('page') || tries>30) clearInterval(wait);
  },150);
})();
