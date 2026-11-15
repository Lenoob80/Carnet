/* Étiquettes (#C1, #Maintenance…) sur les pages, et filtre pour retrouver tout ce qui concerne une compétence.
   Les #mots écrits dans le texte ou dans les tableaux comptent aussi. */

var TAGRX=/#([\p{L}\p{N}_-]{2,})/gu;

function paintTags(){
  var p=pg(),sub=$('sub');
  if(!p||!sub)return;
  var old=$('tg');if(old)old.remove();
  var d=document.createElement('div');
  d.id='tg';
  d.innerHTML=(p.tags||[]).map(function(t){
    return '<span class="chip" data-tag="'+qa(t)+'">#'+esc(t)+'<b data-tx="'+qa(t)+'" title="Retirer">×</b></span>';
  }).join('')+'<button class="chip add" data-tadd="1">+ étiquette</button>';
  sub.insertAdjacentElement('afterend',d);
}
function addTags(p,str){
  var add=str.split(/[\s,;]+/).map(function(t){return t.replace(/^#/,'').trim()}).filter(Boolean);
  p.tags=p.tags||[];
  add.forEach(function(t){if(p.tags.indexOf(t)<0)p.tags.push(t)});
  p.u=Date.now();save();paintTags();
}
function pageTexts(p){
  return [p.title,p.sub,tx(p.tab)].concat((p.boxes||[]).filter(function(b){return b.k=='t'}).map(function(b){return tx(b.c)}));
}
/* tout ce qui est étiqueté : { clé: {name, pages:[{ni,si,pi,p,path,snip}]} } */
function collectTags(){
  var map={};
  allPages().forEach(function(x){
    var seen={};
    function add(name,snip){
      var k=nz(name);
      if(seen[k]){if(snip&&!seen[k].snip)seen[k].snip=snip;return}
      var e=map[k]||(map[k]={name:name,pages:[]});
      seen[k]={ni:x.ni,si:x.si,pi:x.pi,p:x.p,path:x.path,snip:snip||''};
      e.pages.push(seen[k]);
    }
    (x.p.tags||[]).forEach(function(t){add(t,'')});
    var txt=pageTexts(x.p).join(' • '),m;
    TAGRX.lastIndex=0;
    while((m=TAGRX.exec(txt)))add(m[1],txt.slice(Math.max(0,m.index-25),m.index+60));
  });
  return map;
}
function openTags(sel){
  var map=collectTags(),keys=Object.keys(map).sort(function(a,b){return map[b].pages.length-map[a].pages.length}),html;
  if(!keys.length)html='<p style="color:var(--muted)">Aucune étiquette. Ajoute-en sous le titre d’une page avec « + étiquette », ou écris #C1, #Maintenance… dans ton texte.</p>';
  else{
    html='<div id="tgl">'+keys.map(function(k){
      return '<button class="chip'+(k==sel?' on':'')+'" data-tf="'+k+'">#'+esc(map[k].name)+' <small>'+map[k].pages.length+'</small></button>';
    }).join(' ')+'</div>';
    if(sel&&map[sel])html+='<div class="mgrp">#'+esc(map[sel].name)+' — '+map[sel].pages.length+' page'+(map[sel].pages.length>1?'s':'')+'</div>'+
      map[sel].pages.map(function(x){
        return '<div class="mit" data-go="1" data-ni="'+x.ni+'" data-si="'+x.si+'" data-pi="'+x.pi+'"><b>'+esc(x.p.title)+'</b> <small style="color:var(--muted)">'+esc(x.path)+'</small>'+
          (x.snip?'<small style="display:block;color:var(--muted)">…'+esc(x.snip)+'…</small>':'')+'</div>';
      }).join('');
    else html+='<p style="color:var(--muted);margin-top:10px">Touche une étiquette pour voir les pages concernées.</p>';
  }
  openModal('🏷 Étiquettes',html,function(ev){
    var f=ev.target.closest('[data-tf]');
    if(f){openTags(f.dataset.tf);return}
    var g=ev.target.closest('[data-go]');
    if(g){D.cur={n:+g.dataset.ni,s:+g.dataset.si,p:+g.dataset.pi};closeModal();save();render()}
  });
}
document.addEventListener('click',function(e){
  var t=e.target,b;
  if(!t.closest)return;
  if(t.closest('[data-tadd]')){
    var p=pg();if(!p)return;
    ask('Étiquette(s) (séparées par des espaces, ex. C1 Maintenance)','',function(v){if(v.trim())addTags(p,v)});
  }else if((b=t.closest('[data-tx]'))){
    var q=pg();if(!q)return;
    q.tags=(q.tags||[]).filter(function(x){return x!=b.dataset.tx});q.u=Date.now();save();paintTags();
  }else if((b=t.closest('#tg [data-tag]')))openTags(nz(b.dataset.tag));
});
POST.push(paintTags);
ACTIONS.tags=function(){openTags()};
