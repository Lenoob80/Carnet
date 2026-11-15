/* Rédaction : listes à plusieurs niveaux (Tab / Maj+Tab), titres, date et heure, encadrés, symboles, sommaire des titres */

/* ---- styles de listes ---- */
var LSTY=[
  ['ls-disc','●  Puces rondes','ul'],['ls-square','■  Puces carrées','ul'],['ls-arrow','➔  Flèches','ul'],
  ['ls-dec','1.  Chiffres','ol'],['ls-alpha','a.  Lettres','ol'],['ls-roman','i.  Chiffres romains','ol'],
  ['ml-num','1. → a. → i.  Plan à plusieurs niveaux','ol'],['ml-bul','● → ○ → ■  Puces à plusieurs niveaux','ul']
];
function curList(){
  var s=getSelection();if(!s.rangeCount)return null;
  var n=s.anchorNode;n=n&&(n.nodeType==1?n:n.parentNode);
  return n&&n.closest?n.closest('ul,ol'):null;
}
function topList(l){
  var p;
  while(l&&l.parentNode&&l.parentNode.closest&&(p=l.parentNode.closest('ul,ol')))l=p;
  return l;
}
function listToggle(kind){
  if(!rest()){toast('Clique d’abord dans un texte.');return}
  document.execCommand(kind=='ul'?'insertUnorderedList':'insertOrderedList');
  ser();
}
function setListStyle(cls){
  if(!rest()){toast('Clique d’abord dans un texte.');return}
  var l=curList();
  if(cls=='off'){if(l)document.execCommand(l.tagName=='UL'?'insertUnorderedList':'insertOrderedList');ser();return}
  var want=LSTY.filter(function(s){return s[0]==cls})[0][2];
  if(!l||l.tagName.toLowerCase()!=want)document.execCommand(want=='ul'?'insertUnorderedList':'insertOrderedList');
  l=curList();if(!l)return;
  var top=topList(l);
  LSTY.forEach(function(s){top.classList.remove(s[0])});
  top.classList.add(cls);
  ser();
}
function indentList(d){
  if(!rest()){toast('Clique d’abord dans un texte.');return}
  document.execCommand(d>0?'indent':'outdent');ser();
}
function openListPop(anchor){
  pop.innerHTML='<div class="phd">Style de liste</div>'+
    LSTY.map(function(s){return '<button class="ci" data-ls="'+s[0]+'">'+s[1]+'</button>'}).join('')+
    '<button class="ci" data-ls="off">✕  Retirer la liste</button>'+
    '<div class="pl">Tab / Maj+Tab : niveau suivant / précédent</div>';
  pop.dataset.k='list';placePop(anchor);
}
document.addEventListener('keydown',function(e){
  if(e.key!='Tab'||e.ctrlKey||e.altKey||e.metaKey)return;
  var a=document.activeElement,ed=a&&a.closest&&a.closest('#page [contenteditable]:not([contenteditable="false"])');
  if(!ed)return;
  var s=getSelection(),n=s.anchorNode;n=n&&(n.nodeType==1?n:n.parentNode);
  if(n&&n.closest&&n.closest('li')){e.preventDefault();document.execCommand(e.shiftKey?'outdent':'indent');ser()}
});

/* ---- titres ---- */
document.addEventListener('change',function(e){
  if(e.target.id!='fH')return;
  var v=e.target.value;e.target.value='';
  if(!v)return;
  if(!rest()){toast('Clique d’abord dans un texte.');return}
  document.execCommand('formatBlock',false,v=='p'?'<div>':'<'+v+'>');
  ser();
});

/* ---- date, heure, mise en forme simple ---- */
function insText(txt){
  if(rest()){document.execCommand('insertText',false,txt);ser();return}
  var cs=selCells();
  if(cs.length){cs.forEach(function(td){td.appendChild(document.createTextNode(txt))});ser();return}
  toast('Clique d’abord dans un texte ou une cellule.');
}
function insDate(){insText(new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}))}
function insTime(){insText(new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}))}
function execCmd(c){if(rest()){document.execCommand(c);ser()}else toast('Sélectionne d’abord du texte.')}

/* ---- encadrés (astuce, attention, à retenir) ---- */
var CALL={tip:['💡','Astuce'],warn:['⚠️','Attention'],note:['📌','À retenir']};
function caretEnd(el){
  var r=document.createRange();r.selectNodeContents(el);r.collapse(false);
  var s=getSelection();s.removeAllRanges();s.addRange(r);
}
function insCallout(k){
  var c=CALL[k],h='<div class="callout '+k+'"><b>'+c[0]+' '+c[1]+' :</b>&nbsp;</div>';
  if(rest()){document.execCommand('insertHTML',false,h);ser();return}
  var e=addBox('t',30,nextY(),320,h),d=e.querySelector('.callout');
  d.closest('.bc').focus();caretEnd(d);
}

/* ---- symboles scientifiques ---- */
var SYM='Ω ± ≈ ≠ ≤ ≥ Δ π √ ∞ ° µ × ÷ ² ³ ½ ¼ ¾ ‰ α β γ λ θ φ ω Σ ∫ ∂ ∝ ⌀ → ← ↔ ⇒ ∈ ∑ ⊥ ∥ ∠ ‖ ∆ ρ τ ε η'.split(' ');
function openSym(anchor){
  pop.innerHTML='<div class="phd">Symboles</div><div class="symg">'+
    SYM.map(function(c){return '<button class="pch" data-ch="'+c+'">'+c+'</button>'}).join('')+'</div>'+
    '<div class="pl">Exposant / indice : boutons x² et x₂ (onglet Insérer)</div>';
  pop.dataset.k='sym';placePop(anchor);
}

/* ---- sommaire des titres de la page ---- */
function pageHeadings(){
  var pe=$('page');if(!pe)return [];
  var hs=[].slice.call(pe.querySelectorAll('h1,h2,h3')).filter(function(h){return !h.closest('[data-tocp]')});
  hs.forEach(function(h){if(!h.dataset.hid)h.dataset.hid=uid()});
  return hs.sort(function(a,b){return a.getBoundingClientRect().top-b.getBoundingClientRect().top});
}
function makeTocPage(){
  var pe=$('page');
  if(!pe){toast('Ouvre d’abord une page.');return}
  var hs=pageHeadings();
  if(!hs.length){toast('Aucun titre : mets du texte en « Titre 1 / 2 / 3 » (liste Style, onglet Accueil).');return}
  ser();
  var html='<div data-tocp="1"><b>Sommaire de la page</b></div>'+hs.map(function(h){
    var l=+h.tagName[1],pad=(l-1)*16;
    return '<div style="margin-left:'+pad+'px"><a class="plink anc" contenteditable="false" data-ha="'+h.dataset.hid+'">'+esc(h.textContent.trim()||'(titre vide)')+'</a></div>';
  }).join('');
  var ex=pe.querySelector('.box .bc [data-tocp]');
  if(ex){ex.closest('.bc').innerHTML=html;ser();toast('Sommaire mis à jour.')}
  else addBox('t',30,Math.max(0,pe.querySelector('.wrap')?pe.querySelector('.wrap').offsetTop+pe.querySelector('.wrap').offsetHeight+20:nextY()),320,html);
}
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('.anc');
  if(!a)return;
  e.preventDefault();
  var h=document.querySelector('#page [data-hid="'+a.dataset.ha+'"]');
  if(!h){toast('Titre introuvable : mets à jour le sommaire.');return}
  h.scrollIntoView({behavior:'smooth',block:'center'});
  h.classList.add('flash');setTimeout(function(){h.classList.remove('flash')},1300);
});

/* ---- boutons de la barre d'outils (data-l) et fenêtres ---- */
var LCMD={
  ul:function(){listToggle('ul')},ol:function(){listToggle('ol')},
  ind:function(){indentList(1)},outd:function(){indentList(-1)},
  date:insDate,time:insTime,
  sub:function(){execCmd('subscript')},sup:function(){execCmd('superscript')},
  c_tip:function(){insCallout('tip')},c_warn:function(){insCallout('warn')},c_note:function(){insCallout('note')}
};
var ali=0;
document.addEventListener('click',function(e){
  var t=e.target,b;
  if((b=t.closest('[data-l]'))){
    var k=b.dataset.l;
    if(k=='sym')openSym(b);else if(k=='lp')openListPop(b);else if(LCMD[k])LCMD[k]();
    return;
  }
  if(t.closest('[data-fa]')){ali=(ali+1)%3;fmtT(['l','c','r'][ali]);return}
  if((b=t.closest('#pop [data-ls]'))){closePop();setListStyle(b.dataset.ls);return}
  if((b=t.closest('#pop [data-ch]'))){if(rest()){document.execCommand('insertText',false,b.dataset.ch);ser()}return}
});
ACTIONS.tocp=makeTocPage;
