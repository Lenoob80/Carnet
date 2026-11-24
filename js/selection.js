/* Sélection multiple des objets de la page (zones de texte, images, dessins, tableaux libres) :
   clic, Ctrl/Maj + clic, rectangle de sélection, Ctrl+A, déplacement groupé (avec magnétisme),
   suppression, duplication. Les objets verrouillés ne bougent pas et ne se suppriment pas. */

var BANDMOVED=false;
function boxes(){return [].slice.call(document.querySelectorAll('#page .box'))}
function selected(){return boxes().filter(function(b){return b.classList.contains('msel')})}
function isLocked(b){return b.dataset.lock=='1'}
function updSelUi(){
  var n=selected().length,el=$('selN');
  if(el)el.textContent=n?'('+n+')':'';
}
function setSel(list){
  boxes().forEach(function(b){b.classList.toggle('msel',list.indexOf(b)>=0)});
  updSelUi();
}
function toggleSel(b){b.classList.toggle('msel');updSelUi()}
function clearSel(){setSel([])}

function selectAllBoxes(){
  var all=boxes();
  if(!all.length){toast('Aucun objet sur cette page.');return}
  var a=document.activeElement;
  if(a&&a.blur)a.blur();
  getSelection().removeAllRanges();
  setSel(all);
  toast(all.length+' objet'+(all.length>1?'s':'')+' sélectionné'+(all.length>1?'s':'')+' — Suppr pour tout supprimer');
}
function delSel(){
  var s=selected();
  if(!s.length){toast('Sélectionne d’abord des objets (Ctrl+A pour tout prendre).');return}
  var del=s.filter(function(b){return !isLocked(b)}),skipped=s.length-del.length;
  del.forEach(function(b){b.remove()});
  fit();ser();updSelUi();
  toast(del.length+' objet'+(del.length>1?'s':'')+' supprimé'+(del.length>1?'s':'')+
    (skipped?' ('+skipped+' verrouillé'+(skipped>1?'s':'')+' ignoré'+(skipped>1?'s':'')+')':' — Ctrl+Z pour annuler'));
}
function dupSel(){
  var s=selected();
  if(!s.length)return;
  var made=s.map(function(b){
    var n=b.cloneNode(true);
    n.dataset.id=uid();n.classList.remove('msel');
    n.style.left=(b.offsetLeft+20)+'px';n.style.top=(b.offsetTop+20)+'px';
    b.parentNode.appendChild(n);
    return n;
  });
  fit();ser();setSel(made);
}
var OBJ={all:selectAllBoxes,del:delSel,dup:dupSel};   // les autres commandes sont ajoutées par objets.js

/* ---- déplacement / redimensionnement (un objet ou tout le groupe) ---- */
function startDrag(e,b,mod){
  var touch=e.pointerType=='touch',was=b.classList.contains('msel');
  if(mod&&!touch){toggleSel(b);return}                 // Ctrl/Maj + clic : ajoute ou retire de la sélection
  if(!touch&&!was)setSel([b]);
  var group=(was||!touch)?selected():[b];
  if(group.indexOf(b)<0)group=[b];
  var movable=group.filter(function(g){return !isLocked(g)});
  if(!movable.length){if(touch)toggleSel(b);return}    // tout est verrouillé : on sélectionne seulement
  var sx=e.clientX,sy=e.clientY,moved=false,
      origin=movable.map(function(g){return {g:g,x:g.offsetLeft,y:g.offsetTop}});
  e.preventDefault();
  function mv(ev){
    var dx=ev.clientX-sx,dy=ev.clientY-sy;
    if(!moved&&Math.abs(dx)+Math.abs(dy)<4)return;
    moved=true;
    var r=snapAdj(movable,origin,dx,dy);dx=r.dx;dy=r.dy;
    origin.forEach(function(o){o.g.style.left=Math.max(0,o.x+dx)+'px';o.g.style.top=Math.max(0,o.y+dy)+'px'});
    showGuides(r.gx,r.gy);
  }
  function end(ev){
    document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',end);document.removeEventListener('pointercancel',end);
    clearGuides();
    if(moved){fit();ser()}
    else if(ev.type=='pointerup'){
      if(touch)toggleSel(b);                           // tactile : un appui sur la barre ajoute / retire
      else if(was&&group.length>1)setSel([b]);         // clic sans bouger dans un groupe : garde seulement celui-là
    }
  }
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
}
function startResize(e,b){
  e.preventDefault();
  var group=(b.classList.contains('msel')?selected():[b]).filter(function(g){return !isLocked(g)});
  if(!group.length)return;
  var sx=e.clientX,origin=group.map(function(g){return {g:g,w:g.offsetWidth}});
  function mv(ev){origin.forEach(function(o){o.g.style.width=Math.max(80,o.w+ev.clientX-sx)+'px'})}
  function end(){
    document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',end);document.removeEventListener('pointercancel',end);
    fit();ser();
  }
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
}

/* ---- rectangle de sélection sur le fond de la page ---- */
function startBand(e,mod){
  var pe=$('page'),pr=pe.getBoundingClientRect(),x0=e.clientX-pr.left,y0=e.clientY-pr.top,
      rb=document.createElement('div'),base=mod?selected():[],moved=false;
  rb.className='rband';pe.appendChild(rb);
  var a=document.activeElement;
  if(a&&a.blur&&a.closest&&a.closest('#page'))a.blur();
  e.preventDefault();
  function mv(ev){
    var x=ev.clientX-pr.left,y=ev.clientY-pr.top,l=Math.min(x,x0),t=Math.min(y,y0),w=Math.abs(x-x0),h=Math.abs(y-y0);
    if(w+h>4)moved=true;
    rb.style.left=l+'px';rb.style.top=t+'px';rb.style.width=w+'px';rb.style.height=h+'px';
    var hit=boxes().filter(function(b){
      return base.indexOf(b)<0&&b.offsetLeft<l+w&&b.offsetLeft+b.offsetWidth>l&&b.offsetTop<t+h&&b.offsetTop+b.offsetHeight>t;
    });
    setSel(base.concat(hit));
  }
  function end(){
    document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',end);document.removeEventListener('pointercancel',end);
    rb.remove();
    BANDMOVED=moved;
    if(!moved&&!mod)clearSel();
  }
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
}

document.addEventListener('pointerdown',function(e){
  var t=e.target;
  if(!t.closest||t.closest('.bx')||DR.on||RO())return;
  var b=t.closest('.box'),mod=e.ctrlKey||e.metaKey||e.shiftKey,touch=e.pointerType=='touch';
  if(!b){if(t.id=='page'&&!touch)startBand(e,mod);return}
  if(t.closest('.br')){startResize(e,b);return}
  var onHead=!!t.closest('.bh'),body=b.dataset.k=='i'||b.dataset.k=='d';   // images et dessins : on les déplace en les saisissant
  if(onHead||(body&&!touch)){startDrag(e,b,mod);return}
  // contenu d'une zone de texte : Ctrl + clic l'ajoute à la sélection, un clic normal édite le texte
  if(e.ctrlKey||e.metaKey){e.preventDefault();toggleSel(b);return}
  if(selected().length)clearSel();
});

/* ---- clavier : Ctrl+A, Suppr, Ctrl+D, Échap ---- */
document.addEventListener('keydown',function(e){
  if(!e||typeof e.key!=='string')return;
  var a=document.activeElement,k=e.key.toLowerCase(),ctrl=e.ctrlKey||e.metaKey;
  if(a&&a.closest&&a.closest('input,textarea,select,dialog,#sbar'))return;
  var typing=a&&a.closest&&a.closest('[contenteditable]:not([contenteditable="false"])');
  if(!$('page')||DR.on||RO())return;
  if(ctrl&&k=='a'){
    if(typing){                                         // 1er Ctrl+A : tout le texte de la zone ; 2e : tous les objets
      var s=getSelection().toString().trim(),full=(typing.textContent||'').trim();
      if(!(full&&s==full&&typing.closest('.box')))return;
    }
    e.preventDefault();selectAllBoxes();return;
  }
  if(typing)return;
  if((e.key=='Delete'||e.key=='Backspace')&&selected().length){e.preventDefault();delSel();return}
  if(ctrl&&k=='d'&&selected().length){e.preventDefault();dupSel();return}
  if(e.key=='Escape')clearSel();
});
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-o]');
  if(!b)return;
  var f=OBJ[b.dataset.o];
  if(f)f();
});

/* un clic sur le fond de la page (souris ou doigt) crée une zone de texte à cet endroit */
document.addEventListener('click',function(e){
  var id=e.target.id;
  if((id!=='page'&&id!=='tg')||!$('page')||DR.on||RO())return;
  if(BANDMOVED){BANDMOVED=false;return}                  // on vient de tracer un rectangle de sélection
  var r=$('page').getBoundingClientRect();
  newText(e.clientX-r.left,e.clientY-r.top-20);
});
