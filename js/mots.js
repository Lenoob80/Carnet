/* Compteur de mots : en direct dans la barre du haut, et le détail avec le bouton « Mots » */

function pageText(){
  var pe=$('page');if(!pe)return '';
  var c=pe.cloneNode(true);
  [].forEach.call(c.querySelectorAll('.bh,.br,.rband,.guide,svg'),function(e){e.remove()});
  return c.textContent||'';
}
function countWords(t){
  var m=t.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu);
  return m?m.length:0;
}
function updWc(){
  var el=$('wc');if(!el)return;
  var t=pageText(),w=countWords(t),s=getSelection(),sw=0;
  if(s.rangeCount&&!s.isCollapsed){
    var n=s.anchorNode;n=n&&(n.nodeType==1?n:n.parentNode);
    if(n&&n.closest&&n.closest('#page'))sw=countWords(s.toString());
  }
  el.textContent=$('page')?'📝 '+(sw?sw+' / ':'')+w+' mot'+(w>1?'s':''):'';
  el.title=t.replace(/\s+/g,' ').trim().length+' caractères';
}
var wct=null;
function laterWc(){clearTimeout(wct);wct=setTimeout(updWc,300)}
document.addEventListener('input',function(e){if(e.target.closest&&e.target.closest('#page'))laterWc()});
document.addEventListener('selectionchange',laterWc);
POST.push(updWc);
ACTIONS.wc=function(){
  var t=pageText(),w=countWords(t),c=t.replace(/\s+/g,' ').trim().length;
  toast(w+' mot'+(w>1?'s':'')+' · '+c+' caractères · '+boxes().length+' objet'+(boxes().length>1?'s':''));
};
