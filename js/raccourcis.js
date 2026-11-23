/* Raccourcis : Ctrl+P = PDF direct, Alt+← / Alt+→ = page précédente / suivante, Ctrl+; = date, Ctrl+Maj+; = heure */

function goRel(d){
  var s=sec();if(!s)return;
  var i=D.cur.p+d;
  if(i<0||i>=s.pages.length){toast(d<0?'Première page de la section.':'Dernière page de la section.');return}
  ser();D.cur.p=i;save();render();window.scrollTo(0,0);
}
document.addEventListener('keydown',function(e){
  var a=document.activeElement,ctrl=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
  if(ctrl&&k=='p'&&!e.shiftKey&&!e.altKey&&$('page')){e.preventDefault();makePdf();return}
  if(!$('page')||(a&&a.closest&&a.closest('input,textarea,select,dialog,#sbar')))return;
  if(ctrl&&!e.altKey&&(e.key==';'||(e.shiftKey&&e.key==':'))){e.preventDefault();e.shiftKey?insTime():insDate();return}
  if(e.altKey&&!ctrl&&(e.key=='ArrowLeft'||e.key=='ArrowRight')){
    if(selected().length||(a&&a.closest&&a.closest('.box')))return;   // sinon Alt+flèche déplace l'objet
    e.preventDefault();goRel(e.key=='ArrowLeft'?-1:1);
  }
});
