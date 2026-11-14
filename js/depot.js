/* Dépôt de fichiers : glisse des images (ou un Excel / CSV) depuis l'ordinateur directement sur la page */

function hasFiles(e){return e.dataTransfer&&[].indexOf.call(e.dataTransfer.types||[],'Files')>=0}
function inPage(e){return e.target.closest&&e.target.closest('#page')}

document.addEventListener('dragover',function(e){
  if(!hasFiles(e))return;
  e.preventDefault();                                   // autorise le dépôt (et évite d'ouvrir le fichier dans le navigateur)
  var pe=$('page');if(pe)pe.classList.toggle('dropping',!!inPage(e));
});
document.addEventListener('dragleave',function(e){
  var pe=$('page');if(pe&&(!e.relatedTarget||!pe.contains(e.relatedTarget)))pe.classList.remove('dropping');
});
document.addEventListener('drop',function(e){
  if(!hasFiles(e))return;
  e.preventDefault();
  var pe=$('page');if(pe)pe.classList.remove('dropping');
  if(!pe||!inPage(e)){toast('Dépose les fichiers sur la page.');return}
  var r=pe.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,off=0;
  [].slice.call(e.dataTransfer.files).forEach(function(f){
    if(/^image\//.test(f.type)){putImgAt(f,Math.max(0,x+off),Math.max(0,y+off));off+=24}
    else if(/\.(xlsx|xls|csv)$/i.test(f.name))importExcelFile(f);
    else toast('Type de fichier non géré : '+f.name);
  });
});
