/* Mobile : mini-barre flottante au-dessus du clavier, mode lecture seule (anti-clavier) */

/* ---- lecture seule : on lit sans faire surgir le clavier ---- */
function RO(){return document.body.classList.contains('ro')}
function setRO(on){
  document.body.classList.toggle('ro',on);
  var b=$('bRO');
  if(b){b.textContent=on?'🔒':'✏️';b.title=on?'Lecture seule (touche pour modifier)':'Édition (touche pour passer en lecture seule)'}
  if(on&&document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  clearSel();placeFt();
  try{localStorage.setItem('carnet-ro',on?'1':'0')}catch(e){}
}
ACTIONS.ro=function(){setRO(!RO());toast(RO()?'Lecture seule : le clavier ne s’ouvre plus.':'Édition activée.')};
$('bRO').onclick=ACTIONS.ro;
try{setRO(localStorage.getItem('carnet-ro')=='1')}catch(e){setRO(false)}

/* ---- barre flottante : gras, puces, numéros, retrait, alignement, case à cocher ---- */
var FT=document.createElement('div');
FT.id='ftb';
FT.innerHTML=[
  ['data-f="b"','<b>G</b>','Gras'],['data-l="ul"','•','Puces'],['data-l="ol"','1.','Numéros'],
  ['data-l="outd"','⇤','Moins de retrait'],['data-l="ind"','⇥','Plus de retrait'],
  ['data-fa="1"','☰','Alignement : gauche, centre, droite'],['data-f="cb"','☑','Case à cocher']
].map(function(b){return '<button class="btn" '+b[0]+' title="'+b[2]+'">'+b[1]+'</button>'}).join('');
document.body.appendChild(FT);
['mousedown','pointerdown'].forEach(function(ev){FT.addEventListener(ev,function(e){e.preventDefault()})});

function placeFt(){
  var a=document.activeElement,
      ed=a&&a.closest&&a.closest('#page [contenteditable]:not([contenteditable="false"])'),
      show=ed&&!RO()&&!DR.on&&(matchMedia('(pointer:coarse)').matches||innerWidth<900);
  FT.style.display=show?'flex':'none';
  if(!show)return;
  var vv=window.visualViewport,bottom=vv?vv.offsetTop+vv.height:innerHeight;
  FT.style.top=(bottom-FT.offsetHeight)+'px';               // juste au-dessus du clavier
}
['focusin','focusout'].forEach(function(ev){document.addEventListener(ev,function(){setTimeout(placeFt,60)})});
if(window.visualViewport){visualViewport.addEventListener('resize',placeFt);visualViewport.addEventListener('scroll',placeFt)}
