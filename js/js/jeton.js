/* Jeton GitHub : alerte avant expiration (date lue chez GitHub si disponible, sinon saisie à la connexion) */

function parseExp(s){
  if(!s)return null;
  var d=new Date(/^\d{4}-\d\d-\d\d$/.test(s)?s+'T23:59:59':s.replace(' UTC','Z').replace(' ','T'));
  return isNaN(d)?null:d;
}
function noteExp(h){
  if(!h||!CFG)return;
  var d=parseExp(h);if(!d)return;
  var iso=d.toISOString().slice(0,10);
  if(CFG.exp===iso)return;
  CFG.exp=iso;
  seal(CFG).then(function(s){localStorage.setItem('carnet-cfg',s)}).catch(function(){});
  checkExp();
}
function checkExp(){
  var old=$('expb');if(old)old.remove();
  if(!CFG||!CFG.exp)return;
  var d=parseExp(CFG.exp);if(!d)return;
  var days=Math.ceil((d-Date.now())/864e5);
  if(days>14)return;
  var bar=document.createElement('div');
  bar.id='expb';bar.className=days<0?'bad':'';
  bar.innerHTML=(days<0?'⛔ Ton jeton GitHub a expiré.':'⚠ Ton jeton GitHub expire '+(days<=0?'aujourd’hui':'dans '+days+' jour'+(days>1?'s':'')))+
    ' <button class="btn sm" id="expk">🔑 Changer le jeton</button>';
  document.body.insertBefore(bar,$('app'));
  $('expk').onclick=function(){$('bK').click()};
}
setInterval(checkExp,6*3600e3);
