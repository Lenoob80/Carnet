/* Rogner une image : on retire un pourcentage sur chaque bord, avec aperçu en direct.
   Pour annoter (flèche, entourer), utilise « ✏ Dessiner » : le dessin se pose par-dessus l'image. */

function loadImg(url){
  return new Promise(function(ok,ko){var im=new Image();im.onload=function(){ok(im)};im.onerror=ko;im.src=url});
}
async function openCrop(box){
  var img=box.querySelector('img'),ref=img&&img.dataset.ref;
  if(!ref){toast('Cette image ne peut pas être rognée.');return}
  var id=ref.slice(4),url=await imgUrl(id);
  if(!url){toast('Image introuvable.');return}
  var names=['Haut','Droite','Bas','Gauche'],v=[0,0,0,0];
  openModal('✂ Rogner l’image',
    '<div style="text-align:center;background:var(--sel);padding:6px;border-radius:8px"><img id="cpv" src="'+url+'" style="max-width:100%;max-height:38vh"></div>'+
    names.map(function(n,i){return '<label style="display:flex;gap:8px;align-items:center;margin-top:8px"><span style="width:70px">'+n+'</span><input type="range" min="0" max="90" value="0" data-cr="'+i+'" style="flex:1"><span id="cv'+i+'" style="width:44px;text-align:right">0 %</span></label>'}).join('')+
    '<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-crok="1" style="border-color:var(--accent)">Appliquer</button></div>',
    async function(ev){
      if(!ev.target.closest('[data-crok]'))return;
      var im=await loadImg(url),W=im.naturalWidth,H2=im.naturalHeight,
          sx=W*v[3]/100,sy=H2*v[0]/100,sw=W*(1-(v[1]+v[3])/100),sh=H2*(1-(v[0]+v[2])/100);
      if(sw<8||sh<8){toast('Il ne reste presque rien de l’image.');return}
      var c=document.createElement('canvas');
      c.width=Math.round(sw);c.height=Math.round(sh);
      var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
      x.drawImage(im,sx,sy,sw,sh,0,0,c.width,c.height);
      var nid=uid();
      await storeImg(nid,c.toDataURL('image/jpeg',0.9));
      img.dataset.ref='idb:'+nid;img.src=URLS[nid];
      var ar=sw/sh;box.dataset.ar=ar;img.style.aspectRatio=ar;
      ser();closeModal();toast('Image rognée.');
    });
  $('mdB').oninput=function(e){
    var r=e.target.closest('[data-cr]');if(!r)return;
    var i=+r.dataset.cr;v[i]=+r.value;$('cv'+i).textContent=v[i]+' %';
    if(v[0]+v[2]>95)v[2]=95-v[0];if(v[1]+v[3]>95)v[3]=95-v[1];
    $('cpv').style.clipPath='inset('+v[0]+'% '+v[1]+'% '+v[2]+'% '+v[3]+'%)';
  };
}
OBJ.crop=function(){
  var s=selected().filter(function(b){return b.dataset.k=='i'});
  if(s.length!=1){toast('Sélectionne une seule image à rogner.');return}
  if(isLocked(s[0])){toast('Objet verrouillé.');return}
  openCrop(s[0]);
};
