/* Minuteur Pomodoro dans la barre du haut : 25 min de travail / 5 min de pause (réglable) */

var PM={mode:'work',endAt:0,left:25*60,running:false,work:25,brk:5,cycles:0},pmt=null;
try{var pmsv=JSON.parse(localStorage.getItem('carnet-pomo')||'null');if(pmsv)PM=Object.assign(PM,pmsv)}catch(e){}

function pmSave(){try{localStorage.setItem('carnet-pomo',JSON.stringify(PM))}catch(e){}}
function pmLeft(){return PM.running?Math.max(0,Math.round((PM.endAt-Date.now())/1000)):PM.left}
function pmFmt(s){return ('0'+Math.floor(s/60)).slice(-2)+':'+('0'+(s%60)).slice(-2)}
function pmPaint(){
  var b=$('pm');if(!b)return;
  var s=pmLeft();
  b.textContent=(PM.mode=='work'?'🍅':'☕')+(PM.running||s!=PM.work*60?' '+pmFmt(s):'');
  b.classList.toggle('on',PM.running);
  document.title=PM.running?(PM.mode=='work'?'🍅 ':'☕ ')+pmFmt(s)+' – Carnet':'Mon carnet';
  if($('pmt'))$('pmt').textContent=pmFmt(s);
}
function beep(){
  try{
    var a=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();
    o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.setValueAtTime(0.2,a.currentTime);
    o.start();o.stop(a.currentTime+0.5);
  }catch(e){}
  if(navigator.vibrate)navigator.vibrate([200,100,200]);
}
function pmTick(){
  if(PM.running&&pmLeft()<=0){
    beep();
    if(PM.mode=='work'){PM.cycles++;PM.mode='break';PM.left=PM.brk*60;toast('🍅 Bravo ! Pause de '+PM.brk+' min.')}
    else{PM.mode='work';PM.left=PM.work*60;toast('☕ Pause terminée : on reprend.')}
    PM.endAt=Date.now()+PM.left*1000;pmSave();
  }
  pmPaint();
}
function pmStart(){PM.running=true;PM.endAt=Date.now()+PM.left*1000;pmSave();pmPaint()}
function pmPause(){PM.left=pmLeft();PM.running=false;pmSave();pmPaint()}
function pmReset(){PM.running=false;PM.mode='work';PM.left=PM.work*60;pmSave();pmPaint()}
function pmSkip(){
  PM.mode=PM.mode=='work'?'break':'work';PM.left=(PM.mode=='work'?PM.work:PM.brk)*60;
  PM.running=false;pmSave();pmPaint();
}
function openPomo(){
  openModal('🍅 Minuteur Pomodoro',
    '<div style="text-align:center"><div id="pmt" style="font-size:54px;font-weight:700;letter-spacing:2px">'+pmFmt(pmLeft())+'</div>'+
    '<div style="color:var(--muted);margin-bottom:12px">'+(PM.mode=='work'?'Travail':'Pause')+' · '+PM.cycles+' pomodoro'+(PM.cycles>1?'s':'')+' terminé'+(PM.cycles>1?'s':'')+'</div>'+
    '<div class="row" style="justify-content:center"><button class="btn" data-pm="'+(PM.running?'pause':'start')+'" style="border-color:var(--accent)">'+(PM.running?'⏸ Pause':'▶ Démarrer')+'</button>'+
    '<button class="btn" data-pm="skip">⏭ Passer</button><button class="btn" data-pm="reset">↺ Remettre à zéro</button></div></div>'+
    '<div class="row" style="margin-top:14px"><div><label>Travail (min)</label><input id="pmw" type="number" min="1" max="120" value="'+PM.work+'"></div>'+
    '<div><label>Pause (min)</label><input id="pmb" type="number" min="1" max="60" value="'+PM.brk+'"></div></div>',
    function(ev){
      var b=ev.target.closest('[data-pm]');if(!b)return;
      var a=b.dataset.pm;
      if(a=='start')pmStart();else if(a=='pause')pmPause();else if(a=='reset')pmReset();else if(a=='skip')pmSkip();
      openPomo();
    });
  $('pmw').onchange=function(){PM.work=Math.max(1,+this.value||25);if(!PM.running&&PM.mode=='work')PM.left=PM.work*60;pmSave();pmPaint()};
  $('pmb').onchange=function(){PM.brk=Math.max(1,+this.value||5);if(!PM.running&&PM.mode=='break')PM.left=PM.brk*60;pmSave();pmPaint()};
}
$('pm').onclick=openPomo;
ACTIONS.pomo=openPomo;
pmt=setInterval(pmTick,1000);pmPaint();
