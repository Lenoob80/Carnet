/* Mobile : tiroir de navigation (carnets / sections / pages) et barre d'outils repliable */
$('bMenu').onclick=function(){document.body.classList.toggle('nav')};
$('bd').onclick=function(){document.body.classList.remove('nav')};
$('bTools').onclick=function(){document.body.classList.toggle('tools')};
$('bTools').onmousedown=function(e){e.preventDefault()};   // garde la sélection du texte
document.addEventListener('click',function(e){
  // ouvrir une page referme le tiroir (pas les boutons ✎ ⧉ 🗑 ⠿ ni les pastilles)
  var r=e.target.closest&&e.target.closest('#pgs .pg');
  if(r&&!e.target.closest('.x,.gp,.dot,.ck'))document.body.classList.remove('nav');
});
