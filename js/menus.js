/* Menus : barre d'outils en onglets (Accueil / Insérer / Tableau / Page) et menu clic droit sur les tableaux */

var FONTS=['Calibri','Arial','Verdana','Georgia','Times New Roman','Courier New','Comic Sans MS','Gabriola','Impact'],
    SIZES=[8,9,10,11,12,14,16,18,20,24,28,32,40,48];

function fbtn(attr,txt,title){
  return '<button class="btn sm" '+attr+(title?' title="'+title+'"':'')+'>'+txt+'</button>';
}
function fgrp(label,html){
  return '<div class="fg"><span class="fl">'+label+'</span><div class="fr">'+html+'</div></div>';
}
/* bouton de couleur en deux parties : appliquer la dernière couleur / ouvrir la palette */
function split(kind,glyph,title){
  return '<span class="split">'+
    '<button class="btn sm" data-cq="'+kind+'" title="'+title+' : dernière couleur utilisée"><span class="gl">'+glyph+'</span><i class="bar" style="background:var(--c-'+kind+')"></i></button>'+
    '<button class="btn sm" data-pop="'+kind+'" title="'+title+' : choisir une couleur">▾</button></span>';
}
function panel(id,groups){
  return '<div class="tp" data-tp="'+id+'">'+groups.join('')+'</div>';
}

var TABS=[['home','Accueil'],['insert','Insérer'],['table','Tableau'],['page','Page']];

var FB='<div id="fb"><div class="tabs">'+
  TABS.map(function(t){return '<button class="tab" data-tab="'+t[0]+'">'+t[1]+'</button>'}).join('')+'</div>'+

  panel('home',[
    fgrp('Historique',
      fbtn('data-f="undo"','↶','Annuler (Ctrl+Z)')+fbtn('data-f="redo"','↷','Rétablir (Ctrl+Y)')),
    fgrp('Police',
      '<select id="fF"><option value="">Police</option>'+FONTS.map(function(f){return '<option>'+f+'</option>'}).join('')+'</select>'+
      '<select id="fS"><option value="">Taille</option>'+SIZES.map(function(n){return '<option>'+n+'</option>'}).join('')+'</select>'+
      fbtn('data-f="b"','<b>G</b>','Gras (Ctrl+B)')+fbtn('data-f="i"','<i>I</i>','Italique (Ctrl+I)')+fbtn('data-f="u"','<u>S</u>','Souligné (Ctrl+U)')),
    fgrp('Couleurs',
      split('text','A','Couleur du texte')+split('hl','🖍','Surlignage')+split('fill','▨','Fond de cellule')+
      fbtn('data-fc="1"','⌫ Effacer le format','Retirer toute la mise en forme')),
    fgrp('Paragraphe',
      fbtn('data-f="l"','⇤','Aligner à gauche')+fbtn('data-f="c"','↔','Centrer')+fbtn('data-f="r"','⇥','Aligner à droite')+
      fbtn('data-f="cb"','☑ Case','Insérer une case à cocher'))
  ])+

  panel('insert',[
    fgrp('Ajouter',
      fbtn('data-a="tb"','T Texte','Zone de texte (ou double-clic sur la page)')+fbtn('data-a="img"','🖼 Image')+
      fbtn('data-a="xls"','📊 Excel / CSV')+fbtn('data-a="ntab"','▦ Tableau')+'%T%')
  ])+

  panel('table',[
    fgrp('Lignes et colonnes',
      fbtn('data-t="ar"','+ Ligne')+fbtn('data-t="ac"','+ Colonne')+fbtn('data-t="dr"','– Ligne')+fbtn('data-t="dc"','– Colonne')),
    fgrp('Cellules',
      fbtn('data-t="m"','Fusionner')+fbtn('data-t="s"','Scinder')+
      fbtn('data-t="x"','⬚ Plage','Étendre la sélection : touche ensuite la cellule de fin')+fbtn('data-t="g"','Griser')),
    fgrp('Dates',
      fbtn('data-t="d"','📅 Dates auto','Remplir les cellules sélectionnées avec des dates'))
  ])+

  panel('page',[
    fgrp('Affichage',
      fbtn('data-a="focus"','⤢ Focus','Masquer / afficher les colonnes de gauche')),
    fgrp('Document',
      fbtn('data-a="pdf"','⬇ PDF','Télécharger la page en PDF')+fbtn('data-a="save"','💾 Enregistrer','Enregistrer et synchroniser (Ctrl+S)'))
  ])+
'</div>';

document.body.dataset.tab='home';
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-tab]');
  if(b)document.body.dataset.tab=b.dataset.tab;
});

/* ---- menu clic droit sur une cellule ---- */
var CTX={x:0,y:0};
document.addEventListener('contextmenu',function(e){
  var td=e.target.closest&&e.target.closest('#page td,#page th');
  if(!td)return;
  e.preventDefault();
  if(selCells().indexOf(td)<0){sel={t:td.closest('table'),a:td,b:td};marks()}
  var items=[
    ['ar','Insérer une ligne dessous'],['ac','Insérer une colonne à droite'],
    ['dr','Supprimer la ligne'],['dc','Supprimer la colonne'],['-'],
    ['m','Fusionner les cellules'],['s','Scinder la cellule'],['-'],
    ['pf','Fond de cellule…'],['pt','Couleur du texte…'],['cf','Effacer la mise en forme']
  ];
  pop.innerHTML=items.map(function(i){
    return i[0]=='-'?'<hr style="border:0;border-top:1px solid var(--line);margin:4px 0">':'<button class="ci" data-cx="'+i[0]+'">'+i[1]+'</button>';
  }).join('');
  pop.dataset.k='ctx';
  CTX={x:e.clientX,y:e.clientY};
  placePop(null,CTX);
});
function ctxDo(c){
  if(c=='cf')clearFormat();
  else if(c=='pf')openPop('fill',null,CTX);
  else if(c=='pt')openPop('text',null,CTX);
  else tbOp(c);
}
