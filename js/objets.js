/* Objets : ordre (premier plan / arrière-plan), verrouillage, alignement, répartition, grille et magnétisme */

var SNAP={on:true,grid:false},GRID=20,SNAPTH=6;
try{var sv=JSON.parse(localStorage.getItem('carnet-snap')||'null');if(sv)SNAP=sv}catch(e){}

/* ---- ordre ---- */
function zOrder(){
  return boxes().sort(function(a,b){return (parseInt(a.dataset.z)||0)-(parseInt(b.dataset.z)||0)});
}
function applyZ(arr){
  arr.forEach(function(b,i){b.dataset.z=10+i;b.style.zIndex=10+i});
  ser();
}
function zMove(kind){
  var sl=selected();
  if(!sl.length){toast('Sélectionne d’abord un objet.');return}
  var arr=zOrder(),isS=function(b){return sl.indexOf(b)>=0},i,t;
  if(kind=='front')arr=arr.filter(function(b){return !isS(b)}).concat(arr.filter(isS));
  else if(kind=='back')arr=arr.filter(isS).concat(arr.filter(function(b){return !isS(b)}));
  else if(kind=='fwd'){for(i=arr.length-2;i>=0;i--)if(isS(arr[i])&&!isS(arr[i+1])){t=arr[i];arr[i]=arr[i+1];arr[i+1]=t}}
  else{for(i=1;i<arr.length;i++)if(isS(arr[i])&&!isS(arr[i-1])){t=arr[i];arr[i]=arr[i-1];arr[i-1]=t}}
  applyZ(arr);
}

/* ---- verrouillage ---- */
function lockSel(on){
  var sl=selected();
  if(!sl.length){toast('Sélectionne d’abord un objet.');return}
  sl.forEach(function(b){
    if(on){b.dataset.lock='1';b.classList.add('locked')}
    else{delete b.dataset.lock;b.classList.remove('locked')}
  });
  ser();
  toast(sl.length+' objet'+(sl.length>1?'s':'')+(on?' verrouillé':' déverrouillé')+(sl.length>1?'s':''));
}

/* ---- alignement / répartition ---- */
function alignSel(mode){
  var s=selected().filter(function(b){return !isLocked(b)});
  if(s.length<2){toast('Sélectionne au moins 2 objets.');return}
  var L=1e9,T=1e9,R=-1e9,B=-1e9;
  s.forEach(function(b){L=Math.min(L,b.offsetLeft);T=Math.min(T,b.offsetTop);R=Math.max(R,b.offsetLeft+b.offsetWidth);B=Math.max(B,b.offsetTop+b.offsetHeight)});
  s.forEach(function(b){
    var w=b.offsetWidth,h=b.offsetHeight;
    if(mode=='l')b.style.left=L+'px';
    else if(mode=='c')b.style.left=Math.round((L+R)/2-w/2)+'px';
    else if(mode=='r')b.style.left=(R-w)+'px';
    else if(mode=='t')b.style.top=T+'px';
    else if(mode=='m')b.style.top=Math.round((T+B)/2-h/2)+'px';
    else if(mode=='b')b.style.top=(B-h)+'px';
  });
  fit();ser();
}
function distribute(axis){
  var s=selected().filter(function(b){return !isLocked(b)});
  if(s.length<3){toast('Sélectionne au moins 3 objets.');return}
  var h=axis=='h',pos=h?'offsetLeft':'offsetTop',size=h?'offsetWidth':'offsetHeight',
      arr=s.slice().sort(function(a,b){return a[pos]-b[pos]}),
      first=arr[0][pos],last=arr[arr.length-1],end=last[pos]+last[size],
      total=arr.reduce(function(t,b){return t+b[size]},0),
      gap=(end-first-total)/(arr.length-1),cur=first;
  arr.forEach(function(b){b.style[h?'left':'top']=Math.round(cur)+'px';cur+=b[size]+gap});
  fit();ser();
}

/* ---- grille et magnétisme ---- */
function setSnapUi(){
  document.body.dataset.snap=SNAP.on?'1':'0';
  document.body.dataset.grid=SNAP.grid?'1':'0';
  var pe=$('page');if(pe)pe.classList.toggle('gridon',SNAP.grid);
  try{localStorage.setItem('carnet-snap',JSON.stringify(SNAP))}catch(e){}
}
function toggleSnap(){SNAP.on=!SNAP.on;setSnapUi();toast('Magnétisme '+(SNAP.on?'activé':'désactivé'))}
function toggleGrid(){SNAP.grid=!SNAP.grid;setSnapUi();toast(SNAP.grid?'Grille affichée : les objets s’y accrochent':'Grille masquée')}
POST.push(setSnapUi);setSnapUi();

/* repères : lignes roses quand un bord ou le centre s'aligne avec un autre objet */
function showGuides(gx,gy){
  var pe=$('page');if(!pe)return;
  var v=pe.querySelector('.guide.gv'),h=pe.querySelector('.guide.gh');
  if(gx==null){if(v)v.remove()}else{
    if(!v){v=document.createElement('div');v.className='guide gv';pe.appendChild(v)}
    v.style.left=gx+'px';v.style.height=pe.offsetHeight+'px';
  }
  if(gy==null){if(h)h.remove()}else{
    if(!h){h=document.createElement('div');h.className='guide gh';pe.appendChild(h)}
    h.style.top=gy+'px';h.style.width=pe.offsetWidth+'px';
  }
}
function clearGuides(){[].forEach.call(document.querySelectorAll('.guide'),function(g){g.remove()})}

function snapAdj(group,origin,dx,dy){
  var res={dx:dx,dy:dy,gx:null,gy:null};
  if(!SNAP.on)return res;
  var L=1e9,T=1e9,R=-1e9,B=-1e9;
  origin.forEach(function(o){
    L=Math.min(L,o.x+dx);T=Math.min(T,o.y+dy);
    R=Math.max(R,o.x+dx+o.g.offsetWidth);B=Math.max(B,o.y+dy+o.g.offsetHeight);
  });
  var xs=[0],ys=[0];
  boxes().forEach(function(b){
    if(group.indexOf(b)>=0)return;
    xs.push(b.offsetLeft,b.offsetLeft+b.offsetWidth/2,b.offsetLeft+b.offsetWidth);
    ys.push(b.offsetTop,b.offsetTop+b.offsetHeight/2,b.offsetTop+b.offsetHeight);
  });
  function best(vals,cands){
    var bd=SNAPTH+1,line=null;
    vals.forEach(function(v){cands.forEach(function(c){if(Math.abs(c-v)<Math.abs(bd)){bd=c-v;line=c}})});
    return Math.abs(bd)<=SNAPTH?{d:bd,line:line}:null;
  }
  var sx=best([L,(L+R)/2,R],xs),sy=best([T,(T+B)/2,B],ys);
  if(sx){res.dx+=sx.d;res.gx=sx.line}else if(SNAP.grid)res.dx+=Math.round(L/GRID)*GRID-L;
  if(sy){res.dy+=sy.d;res.gy=sy.line}else if(SNAP.grid)res.dy+=Math.round(T/GRID)*GRID-T;
  return res;
}

/* ---- commandes reliées aux boutons (data-o) ---- */
OBJ.front=function(){zMove('front')};OBJ.back=function(){zMove('back')};
OBJ.fwd=function(){zMove('fwd')};OBJ.bwd=function(){zMove('bwd')};
OBJ.lock=function(){lockSel(true)};OBJ.unlock=function(){lockSel(false)};
OBJ.al_l=function(){alignSel('l')};OBJ.al_c=function(){alignSel('c')};OBJ.al_r=function(){alignSel('r')};
OBJ.al_t=function(){alignSel('t')};OBJ.al_m=function(){alignSel('m')};OBJ.al_b=function(){alignSel('b')};
OBJ.dist_h=function(){distribute('h')};OBJ.dist_v=function(){distribute('v')};
OBJ.snap=toggleSnap;OBJ.grid=toggleGrid;
