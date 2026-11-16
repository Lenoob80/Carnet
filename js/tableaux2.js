/* Tableaux (suite) : poignée de redimensionnement, ajuster / pleine largeur / centrer,
   dupliquer une ligne ou une colonne, trier par colonne */

function curTable(){
  if(sel&&sel.t&&sel.t.isConnected)return sel.t;
  var pe=$('page');
  return pe?pe.querySelector('table'):null;
}

/* ---- colonnes : on s'assure d'avoir un <colgroup> avec une largeur par colonne ---- */
function ensureCols(t){
  var g=grid(t),n=(g[0]||[]).length,cg=t.querySelector('colgroup');
  if(cg&&cg.children.length==n)return cg;
  if(cg)cg.remove();
  var w=[],sum=0,c,r;
  for(c=0;c<n;c++){
    var cell=null;
    for(r=0;r<g.length&&!cell;r++){var x=g[r]&&g[r][c];if(x&&x.td.colSpan==1)cell=x.td}
    w[c]=cell?Math.round(cell.getBoundingClientRect().width):80;
    sum+=w[c];
  }
  cg=document.createElement('colgroup');
  w.forEach(function(v){var col=document.createElement('col');col.style.width=v+'px';cg.appendChild(col)});
  t.insertBefore(cg,t.firstChild);
  t.style.tableLayout='fixed';t.style.width=sum+'px';
  return cg;
}

/* ---- poignée en bas à droite de la cellule sélectionnée (souris, doigt, stylet) ---- */
var RZ=document.createElement('div');
RZ.id='rzh';RZ.textContent='⤡';RZ.title='Glisse pour ajuster la largeur de la colonne et la hauteur de la ligne';
document.body.appendChild(RZ);

function placeRz(){
  var cs=selCells();
  if(cs.length!=1||DR.on||RO()){RZ.style.display='none';return}
  var r=cs[0].getBoundingClientRect();
  if(r.right<0||r.bottom<0||r.right>innerWidth||r.bottom>innerHeight){RZ.style.display='none';return}
  RZ.style.display='block';
  RZ.style.left=(r.right-9)+'px';RZ.style.top=(r.bottom-9)+'px';
}
RZ.addEventListener('pointerdown',function(e){
  e.preventDefault();e.stopPropagation();
  var td=selCells()[0];if(!td)return;
  var t=td.closest('table'),g=grid(t),x=pos(g,td),ci=x.c+td.colSpan-1,
      tr=t.rows[x.r+td.rowSpan-1],col=ensureCols(t).children[ci],
      sx=e.clientX,sy=e.clientY,w0=parseFloat(col.style.width)||80,h0=tr.getBoundingClientRect().height;
  RZ.setPointerCapture(e.pointerId);
  function mv(ev){
    col.style.width=Math.max(30,Math.round(w0+ev.clientX-sx))+'px';
    tr.style.height=Math.max(18,Math.round(h0+ev.clientY-sy))+'px';
    fixW(t);placeRz();
  }
  function end(){
    RZ.removeEventListener('pointermove',mv);RZ.removeEventListener('pointerup',end);RZ.removeEventListener('pointercancel',end);
    ser();
  }
  RZ.addEventListener('pointermove',mv);RZ.addEventListener('pointerup',end);RZ.addEventListener('pointercancel',end);
});
document.addEventListener('selectionchange',function(){setTimeout(placeRz,0)});
document.addEventListener('scroll',placeRz,true);
window.addEventListener('resize',placeRz);
POST.push(placeRz);

/* ---- tirer directement sur un trait du tableau : le curseur change, on glisse (souris / stylet) ---- */
var EDGE=5,EDRAG=false;
function edgeAt(e){
  if(e.pointerType=='touch'||DR.on||RO())return null;
  var td=e.target.closest&&e.target.closest('#page td,#page th');
  if(!td)return null;
  var t=td.closest('table'),x=pos(grid(t),td);
  if(!x)return null;
  var r=td.getBoundingClientRect(),
      dl=e.clientX-r.left,dr=r.right-e.clientX,dt=e.clientY-r.top,db=r.bottom-e.clientY,
      dx=Math.min(dl,dr),dy=Math.min(dt,db);
  if(dx<=EDGE&&dx<=dy){                                  // trait vertical : largeur de colonne
    var i=dr<=dl?x.c+td.colSpan-1:x.c-1;
    return i>=0?{t:t,k:'c',i:i}:null;
  }
  if(dy<=EDGE){                                          // trait horizontal : hauteur de ligne
    var j=db<=dt?x.r+td.rowSpan-1:x.r-1;
    return j>=0?{t:t,k:'r',i:j}:null;
  }
  return null;
}
document.addEventListener('pointermove',function(e){
  if(EDRAG||e.buttons)return;
  var ed=edgeAt(e),cl=document.body.classList;
  cl.toggle('rz-col',!!ed&&ed.k=='c');cl.toggle('rz-row',!!ed&&ed.k=='r');
});
document.addEventListener('pointerdown',function(e){
  if(e.button!==0)return;
  var ed=edgeAt(e);
  if(!ed)return;
  e.preventDefault();e.stopPropagation();EDRAG=true;
  var t=ed.t,sx=e.clientX,sy=e.clientY,col,tr,w0,h0;
  if(ed.k=='c'){col=ensureCols(t).children[ed.i];w0=parseFloat(col.style.width)||80}
  else{tr=t.rows[ed.i];h0=tr.getBoundingClientRect().height}
  document.body.classList.add(ed.k=='c'?'rz-col':'rz-row');
  function mv(ev){
    if(ed.k=='c'){col.style.width=Math.max(30,Math.round(w0+ev.clientX-sx))+'px';fixW(t)}
    else tr.style.height=Math.max(18,Math.round(h0+ev.clientY-sy))+'px';
    placeRz();
  }
  function end(){
    document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',end);document.removeEventListener('pointercancel',end);
    EDRAG=false;document.body.classList.remove('rz-col','rz-row');ser();
  }
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
},true);

/* ---- dupliquer une ligne / une colonne (contenu, couleurs et bordures compris) ---- */
function dupRow(t,g,r){
  var nr=t.insertRow(r+1),seen=[];
  (g[r]||[]).forEach(function(x){
    if(!x||seen.indexOf(x.td)>=0)return;
    seen.push(x.td);
    if(x.r<r||x.td.rowSpan>1){x.td.rowSpan++;return}      // cellule fusionnée en hauteur : on l'étire
    nr.appendChild(x.td.cloneNode(true));
  });
  if(t.rows[r].style.height)nr.style.height=t.rows[r].style.height;
}
function dupCol(t,g,c){
  var seen=[];
  g.forEach(function(row){
    var x=row&&row[c];
    if(!x||seen.indexOf(x.td)>=0)return;
    seen.push(x.td);
    if(x.td.colSpan>1){x.td.colSpan++;return}
    var cl=x.td.cloneNode(true);cl.rowSpan=x.td.rowSpan;
    x.td.after(cl);
  });
  var cg=t.querySelector('colgroup');
  if(cg&&cg.children[c]){cg.insertBefore(cg.children[c].cloneNode(true),cg.children[c+1]||null);fixW(t)}
}

/* ---- tri : dates (jj/mm/aaaa, « Lun 07 Sept »…), nombres, sinon ordre alphabétique ---- */
var MOISRX=/(\d{1,2})\s*(janv|fevr|mars|avr|mai|juin|juil|aout|sept|oct|nov|dec)[a-z]*\.?\s*(\d{4})?/,
    MOISN=['janv','fevr','mars','avr','mai','juin','juil','aout','sept','oct','nov','dec'];
function parseDateFr(s){
  s=nz(s);var m;
  if((m=/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/.exec(s)))return Date.UTC(+m[3]<100?2000+ +m[3]:+m[3],m[2]-1,+m[1]);
  if((m=/(\d{4})-(\d{2})-(\d{2})/.exec(s)))return Date.UTC(+m[1],m[2]-1,+m[3]);
  if((m=MOISRX.exec(s)))return Date.UTC(m[3]?+m[3]:2000,MOISN.indexOf(m[2]),+m[1]);
  return null;
}
function sortMode(keys){
  var full=keys.filter(function(k){return k!==''});
  if(!full.length)return 'text';
  if(full.every(function(k){return parseDateFr(k)!==null}))return 'date';
  if(full.every(function(k){return /^[-+]?[\d\s]*[.,]?\d+\s*[%€$a-zA-Zµ°Ω]*$/.test(k)}))return 'num';
  return 'text';
}
function sortKey(k,mode){
  if(k==='')return null;
  if(mode=='date')return parseDateFr(k);
  if(mode=='num')return parseFloat(k.replace(/\s/g,'').replace(',','.'));
  return k;
}
function sortRows(dir){
  var q=rect();
  if(!q){toast('Clique d’abord dans la colonne à trier.');return}
  var t=sel.t,rows=[].slice.call(t.rows),c=q.c1,r1,r2,header=false;
  if(q.r2>q.r1){r1=q.r1;r2=q.r2}                       // plusieurs lignes sélectionnées : on ne trie que celles-là
  else{r1=1;r2=rows.length-1;header=true}               // sinon tout le tableau, 1re ligne = en-tête
  if(r2<=r1){toast('Pas assez de lignes à trier.');return}
  var part=rows.slice(r1,r2+1),parent=part[0].parentNode;
  if(part.some(function(tr){return tr.parentNode!==parent})){toast('Sélectionne des lignes du même bloc.');return}
  if(part.some(function(tr){return [].some.call(tr.cells,function(td){return td.rowSpan>1})})){toast('Scinde d’abord les cellules fusionnées en hauteur.');return}
  var keys=part.map(function(tr){var x=q.g[tr.rowIndex]&&q.g[tr.rowIndex][c];return x?x.td.textContent.trim():''}),
      mode=sortMode(keys),
      items=part.map(function(tr,i){return {tr:tr,k:sortKey(keys[i],mode),i:i}});
  items.sort(function(a,b){
    if(a.k===null||b.k===null)return a.k===b.k?a.i-b.i:(a.k===null?1:-1);       // les cases vides en dernier
    var d=mode=='text'?a.k.localeCompare(b.k,'fr',{numeric:true,sensitivity:'base'}):a.k-b.k;
    return (dir=='desc'?-d:d)||a.i-b.i;
  });
  var anchor=part[part.length-1].nextSibling;
  items.forEach(function(it){parent.insertBefore(it.tr,anchor)});
  sel=null;marks();ser();
  toast('Trié ('+({date:'dates',num:'nombres',text:'texte'}[mode])+')'+(header?' — 1re ligne = en-tête':''));
}

/* ---- commandes reliées à tbOp() ---- */
var TB2={};
function needRect(){var q=rect();if(!q)toast('Clique d’abord dans une cellule du tableau.');return q}
TB2.dupr=function(){var q=needRect();if(!q)return;dupRow(sel.t,q.g,q.r2);ser()};
TB2.dupc=function(){var q=needRect();if(!q)return;dupCol(sel.t,q.g,q.c2);ser()};
TB2.fit=function(){
  var t=curTable();if(!t){toast('Aucun tableau.');return}
  var cg=t.querySelector('colgroup');if(cg)cg.remove();
  t.style.tableLayout='auto';t.style.width='auto';t.style.minWidth='0';ser();
};
TB2.full=function(){
  var t=curTable();if(!t){toast('Aucun tableau.');return}
  t.style.width='100%';t.style.tableLayout='fixed';t.style.minWidth='';ser();
};
TB2.ctr=function(){
  var t=curTable();if(!t){toast('Aucun tableau.');return}
  var on=t.style.marginLeft=='auto';
  t.style.marginLeft=t.style.marginRight=on?'':'auto';
  ser();toast(on?'Tableau aligné à gauche.':'Tableau centré (visible quand il est moins large que la page : « Ajuster au texte »).');
};
TB2.cw=function(){
  var q=needRect();if(!q)return;
  var td=sel.a,t=sel.t,x=pos(q.g,td),ci=x.c+td.colSpan-1,col=ensureCols(t).children[ci];
  ask('Largeur de la colonne (en pixels)',Math.round(parseFloat(col.style.width)||80),function(v){
    var n=Math.max(30,+v||0);if(!n)return;
    col.style.width=n+'px';fixW(t);ser();
  });
};
TB2.rh=function(){
  var q=needRect();if(!q)return;
  var td=sel.a,t=sel.t,x=pos(q.g,td),tr=t.rows[x.r+td.rowSpan-1];
  ask('Hauteur de la ligne (en pixels)',Math.round(tr.getBoundingClientRect().height),function(v){
    var n=Math.max(18,+v||0);if(!n)return;
    tr.style.height=n+'px';ser();
  });
};
TB2.sa=function(){sortRows('asc')};
TB2.sz=function(){sortRows('desc')};
