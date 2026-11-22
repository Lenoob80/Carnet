/* Liste « À faire » globale : toutes les cases ☐ non cochées de tous les carnets */

function lineAfter(cb){
  var s='',n=cb.nextSibling;
  while(n&&n.nodeName!='BR'&&!(n.nodeType==1&&(n.classList.contains('cb')||/^(DIV|P|UL|OL|LI|TABLE)$/.test(n.nodeName)))){s+=n.textContent;n=n.nextSibling}
  s=s.replace(/\u00a0/g,' ').trim();
  if(!s){                                               // case seule : on prend le texte de la cellule ou de la ligne
    var par=cb.closest('td,th,.bc,div');
    s=(par?par.textContent:'').replace(/[☐☑]/g,'').replace(/\s+/g,' ').trim().slice(0,90);
  }
  return s||'(case sans texte)';
}
function todoItems(){
  var out=[];
  D.nbs.forEach(function(n,ni){n.sections.forEach(function(s,si){s.pages.forEach(function(p,pi){
    var items=[];
    function scan(html){
      if(!html)return;
      var t=document.createElement('template');t.innerHTML=html;
      [].forEach.call(t.content.querySelectorAll('.cb'),function(cb){if(cb.dataset.c!='1')items.push(lineAfter(cb))});
    }
    scan(p.tab);
    (p.boxes||[]).forEach(function(b){if(b.k=='t')scan(b.c)});
    if(items.length)out.push({ni:ni,si:si,pi:pi,title:p.title,path:n.name+' › '+s.name,items:items});
  })})});
  return out;
}
function openTodo(){
  ser();
  var L=todoItems(),total=L.reduce(function(t,g){return t+g.items.length},0),html;
  if(!L.length)html='<p style="color:var(--muted)">Rien à faire : aucune case ☐ non cochée. Ajoute des cases avec « ☑ Case » (onglet Accueil).</p>';
  else html='<p style="margin:0 0 6px;color:var(--muted)">'+total+' tâche'+(total>1?'s':'')+' dans '+L.length+' page'+(L.length>1?'s':'')+'. Touche une ligne pour ouvrir la page.</p>'+
    L.map(function(g){
      return '<div class="mgrp" data-go="1" data-ni="'+g.ni+'" data-si="'+g.si+'" data-pi="'+g.pi+'" style="cursor:pointer">📄 '+esc(g.title)+' <small style="color:var(--muted);font-weight:400">'+esc(g.path)+'</small></div>'+
        g.items.map(function(t){return '<div class="mit" data-go="1" data-ni="'+g.ni+'" data-si="'+g.si+'" data-pi="'+g.pi+'">☐ '+esc(t)+'</div>'}).join('');
    }).join('');
  openModal('☑ À faire ('+total+')',html,function(ev){
    var b=ev.target.closest('[data-go]');if(!b)return;
    D.cur={n:+b.dataset.ni,s:+b.dataset.si,p:+b.dataset.pi};
    closeModal();save();render();
  });
}
ACTIONS.todo=openTodo;
