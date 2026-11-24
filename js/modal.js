/* Fenêtre générique (corbeille, à faire, modèles, liens…) */
var MD=document.createElement('dialog'),MDH=null;
MD.id='dgen';
MD.innerHTML='<h3 id="mdT" style="margin:0 0 8px"></h3><div id="mdB"></div>'+
  '<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" id="mdX">Fermer</button></div>';
document.body.appendChild(MD);

function openModal(title,html,handler){
  $('mdB').oninput=null;
  $('mdT').textContent=title;$('mdB').innerHTML=html;MDH=handler||null;
  if(!MD.open)MD.showModal();
}
function closeModal(){if(MD.open)MD.close();MD.classList.remove('help-modal')}
$('mdX').onclick=closeModal;
$('mdB').addEventListener('click',function(e){if(MDH)MDH(e)});
