/* Confort : cases à cocher, couleurs rapides, doublons, pastilles d'état, raccourcis, déplacement au clavier */

/* ---- cases à cocher ---- */
function insCb(){
  var cs=selCells(),h='<span class="cb" contenteditable="false" data-c="0">☐</span>&nbsp;';
  if(cs.length>1||(cs.length==1&&(!sr||sr.collapsed))){
    cs.forEach(function(td){td.insertAdjacentHTML('afterbegin',h)});
    ser();return;
  }
  if(rest()){document.execCommand('insertHTML',false,h);ser()}
  else toast('Clique d’abord dans une cellule ou une zone de texte.');
}
function toggleCb(cb){
  var on=cb.dataset.c!='1',n,w;
  cb.dataset.c=on?'1':'0';cb.textContent=on?'☑':'☐';
  if(on){                      // barre le texte qui suit la case, jusqu'à la fin de la ligne
    var nodes=[];n=cb.nextSibling;
    while(n&&n.nodeName!='BR'&&!(n.nodeType==1&&(n.classList.contains('cb')||/^(DIV|P|UL|OL|LI|TABLE)$/.test(n.nodeName)))){nodes.push(n);n=n.nextSibling}
    if(nodes.length){w=document.createElement('span');w.className='cdone';cb.parentNode.insertBefore(w,nodes[0]);nodes.forEach(function(x){w.appendChild(x)})}
  }else{
    w=cb.nextSibling;
    while(w&&w.nodeType==3&&!w.textContent.trim())w=w.nextSibling;
    if(w&&w.classList&&w.classList.contains('cdone')){while(w.firstChild)w.parentNode.insertBefore(w.firstChild,w);w.remove()}
  }
  ser();
}

/* ---- couleurs rapides (fond de cellule ou surlignage) ---- */
function quick(v){
  var cs=selCells();
  if(cs.length>1||(cs.length==1&&(!sr||sr.collapsed))){
    cs.forEach(function(td){td.style.background=v;td.style.color=v?'#111':''});
    ser();return;
  }
  fmtT('h',v);
  if(v)fmtT('col','#111');
}

/* ---- pages : dupliquer, pastille d'état ---- */
function dupPage(i){
  ser();
  var s=sec(),p=JSON.parse(JSON.stringify(s.pages[i]));
  p.id=uid();p.title+=' (copie)';p.u=Date.now();delete p.hh;
  (p.boxes||[]).forEach(function(b){b.id=uid()});
  s.pages.splice(i+1,0,p);D.cur.p=i+1;
  save();render();
}
function dot(st,i){
  st=st||0;
  return '<i class="dot s'+st+'" data-st="'+i+'" title="'+['Aucun statut','À faire','Terminée'][st]+' (clic pour changer)">'+(st?'●':'○')+'</i>';
}
function cycSt(i){
  ser();
  var p=sec().pages[i];
  p.st=((p.st||0)+1)%3;p.u=Date.now();
  save();render();
}

/* ---- raccourcis clavier ---- */
async function saveNow(){
  try{ser();await cache();await syncNow();toast($('sts').textContent||'Enregistré.')}catch(e){}
}
function moveBoxKey(e){
  var a=document.activeElement,b=a&&a.closest&&a.closest('.box');
  if(!b)return;
  if(a.closest('.bc')&&!e.altKey)return;          // dans le texte, les flèches déplacent le curseur
  var d=e.shiftKey?10:1,dx=0,dy=0;
  if(e.key=='ArrowLeft')dx=-d;else if(e.key=='ArrowRight')dx=d;
  else if(e.key=='ArrowUp')dy=-d;else if(e.key=='ArrowDown')dy=d;else return;
  e.preventDefault();
  b.style.left=Math.max(0,b.offsetLeft+dx)+'px';
  b.style.top=Math.max(0,b.offsetTop+dy)+'px';
  fit();clearTimeout(tm);tm=setTimeout(ser,300);
}
document.addEventListener('keydown',function(e){
  var k=e.key.toLowerCase(),inField=e.target.closest&&e.target.closest('input,textarea,select,dialog,#sbar');
  if((e.ctrlKey||e.metaKey)&&!e.altKey){
    if(k=='s'){e.preventDefault();saveNow();return}
    if(inField||!$('page'))return;
    if(k=='b'||k=='i'||k=='u'){e.preventDefault();fmtT(k)}
    return;
  }
  if(e.key.indexOf('Arrow')==0&&!inField)moveBoxKey(e);
});
