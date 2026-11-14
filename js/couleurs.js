/* Couleurs : palette complète, couleurs récentes, retrait fiable, effacer la mise en forme */

var DEF={text:'#e53935',hl:'#fff176',fill:'#fff176'},LAST={},RECENT=[],
    pop=document.createElement('div');
pop.id='pop';document.body.appendChild(pop);
try{
  LAST=JSON.parse(localStorage.getItem('carnet-last')||'{}');
  RECENT=JSON.parse(localStorage.getItem('carnet-recent')||'[]');
}catch(e){}
Object.keys(LAST).forEach(function(k){document.body.style.setProperty('--c-'+k,LAST[k])});

/* ---- palette : une ligne de gris + 6 nuances de 10 teintes ---- */
function hsl(h,s,l){
  s/=100;l/=100;
  var a=s*Math.min(l,1-l);
  function f(n){var k=(n+h/30)%12,c=l-a*Math.max(-1,Math.min(k-3,9-k,1));return ('0'+Math.round(255*c).toString(16)).slice(-2)}
  return '#'+f(0)+f(8)+f(4);
}
var PAL=(function(){
  var out=[],i,j,v;
  for(i=0;i<10;i++){v=('0'+Math.round(255-i*255/9).toString(16)).slice(-2);out.push('#'+v+v+v)}
  [90,78,66,52,40,28].forEach(function(l){
    [0,24,48,100,165,195,215,260,295,330].forEach(function(h){out.push(hsl(h,80,l))});
  });
  return out;
})();

function lumCss(c){
  var m=/^#([0-9a-f]{6})$/i.exec(c||'');
  if(m){var n=parseInt(m[1],16);return (0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255))/255}
  m=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c||'');
  return m?(0.299*m[1]+0.587*m[2]+0.114*m[3])/255:0.5;
}
function swatch(c){return '<button class="psw" data-pc="'+c+'" style="background:'+c+'" title="'+c+'"></button>'}

/* ---- fenêtre de choix de couleur ---- */
function placePop(anchor,pt){
  pop.style.display='block';
  var w=pop.offsetWidth,h=pop.offsetHeight,x,y,r=anchor&&anchor.getBoundingClientRect();
  if(r){x=r.left;y=r.bottom+4}else{x=pt.x;y=pt.y}
  x=Math.max(8,Math.min(x,innerWidth-w-8));
  if(y+h>innerHeight-8)y=Math.max(8,(r?r.top-4:y)-h);
  pop.style.left=x+'px';pop.style.top=y+'px';
}
function closePop(){pop.style.display='none'}
function openPop(kind,anchor,pt){
  var titles={text:'Couleur du texte',hl:'Surlignage du texte',fill:'Fond de cellule'},
      h='<div class="phd">'+titles[kind]+'</div>'+
        '<button class="pnone" data-pc="">⌀ '+(kind=='text'?'Automatique (retirer la couleur)':'Aucune couleur (retirer)')+'</button>'+
        '<div class="pal">'+PAL.map(swatch).join('')+'</div>';
  if(RECENT.length)h+='<div class="pl">Récentes</div><div class="pal">'+RECENT.map(swatch).join('')+'</div>';
  h+='<label class="pcu">Autre couleur… <input type="color" id="pcc" value="'+(LAST[kind]||DEF[kind])+'"></label>';
  pop.innerHTML=h;pop.dataset.k=kind;
  placePop(anchor,pt);
}

/* ---- application ---- */
function isCellMode(){
  var cs=selCells();
  return cs.length>1||(cs.length==1&&(!sr||sr.collapsed));
}
function remember(kind,v){
  LAST[kind]=v;document.body.style.setProperty('--c-'+kind,v);
  RECENT=[v].concat(RECENT.filter(function(c){return c!=v})).slice(0,10);
  try{localStorage.setItem('carnet-last',JSON.stringify(LAST));localStorage.setItem('carnet-recent',JSON.stringify(RECENT))}catch(e){}
}
function autoContrast(td){   // garde un texte lisible sur un fond coloré
  td.style.color=lumCss(td.style.backgroundColor||td.style.background)>0.55?'#111':'#fff';
  td.dataset.ac='1';
}
function applyColor(kind,v){
  if(v)remember(kind,v);
  if(kind=='fill')return fillCells(v);
  if(!v)return removeColor(kind=='text'?'color':'bg');
  if(kind=='text'){
    selCells().forEach(function(td){delete td.dataset.ac});
    fmtT('col',v);
  }else if(isCellMode())fillCells(v);
  else fmtT('h',v);
}
function fillCells(v){
  var cs=selCells();
  if(!cs.length){toast('Place le curseur dans une cellule d’un tableau.');return}
  cs.forEach(function(td){
    td.classList.remove('g');
    if(v){
      td.style.background=v;
      if(!td.style.color||td.dataset.ac)autoContrast(td);
    }else{
      td.style.background='';
      [].forEach.call(td.querySelectorAll('[style]'),function(e){e.style.removeProperty('background');e.style.removeProperty('background-color')});
      if(td.dataset.ac){td.style.color='';delete td.dataset.ac}
    }
    if(td.getAttribute('style')==='')td.removeAttribute('style');
  });
  ser();
}

/* ---- retrait : fonctionne sur le texte sélectionné ou sur les cellules ---- */
function unwrap(el){
  while(el.firstChild)el.parentNode.insertBefore(el.firstChild,el);
  el.remove();
}
function removeColor(which){
  var props=which=='color'?['color']:['background','background-color'];
  function strip(el){
    props.forEach(function(p){el.style.removeProperty(p)});
    if(which=='color')el.removeAttribute('color');
    if(el.getAttribute('style')==='')el.removeAttribute('style');
  }
  if(isCellMode()){
    selCells().forEach(function(td){
      td.classList.remove('g');
      strip(td);
      [].forEach.call(td.querySelectorAll('[style],font'),strip);
      delete td.dataset.ac;
      if(which=='color'&&td.style.background)autoContrast(td);
    });
    ser();return;
  }
  if(!rest()){toast('Clique d’abord dans le texte.');return}
  var r=getSelection().getRangeAt(0);
  if(r.collapsed){toast('Sélectionne du texte pour retirer sa couleur.');return}
  var n=r.commonAncestorContainer;n=n.nodeType==1?n:n.parentNode;
  var ed=n.closest('[contenteditable]')||n;
  [].slice.call(ed.querySelectorAll('[style],font')).filter(function(el){
    return !/^(TD|TH|TR|TABLE|TBODY|THEAD)$/.test(el.tagName)&&r.intersectsNode(el);
  }).forEach(function(el){
    strip(el);
    if(/^(SPAN|FONT)$/.test(el.tagName)&&!el.attributes.length)unwrap(el);
  });
  ser();
}
function clearFormat(){
  if(isCellMode()){
    selCells().forEach(function(td){
      td.removeAttribute('style');td.classList.remove('g');delete td.dataset.ac;
      [].forEach.call(td.querySelectorAll('[style]'),function(e){e.removeAttribute('style')});
      [].forEach.call(td.querySelectorAll('font,b,i,u,strong,em'),unwrap);
    });
  }else if(rest()){
    document.execCommand('removeFormat');
    removeColor('color');removeColor('bg');
    return;
  }else{toast('Clique d’abord dans le texte ou une cellule.');return}
  ser();
}

/* ---- événements ---- */
pop.addEventListener('mousedown',function(e){if(!/INPUT|LABEL/.test(e.target.tagName))e.preventDefault()});
document.addEventListener('click',function(e){
  var t=e.target,b;
  if((b=t.closest('[data-pop]'))){openPop(b.dataset.pop,b);return}
  if((b=t.closest('[data-cq]'))){applyColor(b.dataset.cq,LAST[b.dataset.cq]||DEF[b.dataset.cq]);return}
  if(t.closest('[data-fc]')){clearFormat();return}
  if((b=t.closest('#pop [data-pc]'))){var k=pop.dataset.k;closePop();applyColor(k,b.dataset.pc);return}
  if((b=t.closest('#pop [data-cx]'))){var c=b.dataset.cx;closePop();ctxDo(c);return}
  if(!t.closest('#pop'))closePop();
});
document.addEventListener('change',function(e){
  if(e.target.id=='pcc'){var k=pop.dataset.k;closePop();applyColor(k,e.target.value)}
});
document.addEventListener('keydown',function(e){if(e.key=='Escape')closePop()});
