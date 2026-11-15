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
function splitBtn(kind,glyph,title){
  return '<span class="split">'+
    '<button class="btn sm" data-cq="'+kind+'" title="'+title+' : dernière couleur utilisée"><span class="gl">'+glyph+'</span><i class="bar" style="background:var(--c-'+kind+')"></i></button>'+
    '<button class="btn sm" data-pop="'+kind+'" title="'+title+' : choisir une couleur">▾</button></span>';
}
function panel(id,groups){
  return '<div class="tp" data-tp="'+id+'">'+groups.join('')+'</div>';
}

var TABS=[['home','Accueil'],['insert','Insérer'],['table','Tableau'],['layout','Disposition'],['page','Page']];

var FB='<div id="fb"><div class="tabs">'+
  TABS.map(function(t){return '<button class="tab" data-tab="'+t[0]+'">'+t[1]+'</button>'}).join('')+'</div>'+

  panel('home',[
    fgrp('Historique',
      fbtn('data-f="undo"','↶','Annuler (Ctrl+Z)')+fbtn('data-f="redo"','↷','Rétablir (Ctrl+Y)')),
    fgrp('Style',
      '<select id="fH"><option value="">Style</option><option value="p">Texte normal</option><option value="h1">Titre 1</option><option value="h2">Titre 2</option><option value="h3">Titre 3</option></select>'),
    fgrp('Police',
      '<select id="fF"><option value="">Police</option>'+FONTS.map(function(f){return '<option>'+f+'</option>'}).join('')+'</select>'+
      '<select id="fS"><option value="">Taille</option>'+SIZES.map(function(n){return '<option>'+n+'</option>'}).join('')+'</select>'+
      fbtn('data-f="b"','<b>G</b>','Gras (Ctrl+B)')+fbtn('data-f="i"','<i>I</i>','Italique (Ctrl+I)')+fbtn('data-f="u"','<u>S</u>','Souligné (Ctrl+U)')),
    fgrp('Couleurs',
      splitBtn('text','A','Couleur du texte')+splitBtn('hl','🖍','Surlignage')+splitBtn('fill','▨','Fond de cellule')+
      fbtn('data-fc="1"','⌫ Effacer le format','Retirer toute la mise en forme')),
    fgrp('Listes',
      fbtn('data-l="lp"','• ▾','Puces et styles de liste')+fbtn('data-l="ol"','1.','Liste numérotée')+
      fbtn('data-l="outd"','⇤','Niveau précédent (Maj+Tab)')+fbtn('data-l="ind"','⇥','Niveau suivant (Tab)')),
    fgrp('Paragraphe',
      fbtn('data-f="l"','⇤','Aligner à gauche')+fbtn('data-f="c"','↔','Centrer')+fbtn('data-f="r"','⇥','Aligner à droite')+
      fbtn('data-f="cb"','☑ Case','Insérer une case à cocher')),
    fgrp('Objets',
      fbtn('data-o="all"','⬚ Tout','Sélectionner tous les objets de la page (Ctrl+A)')+
      fbtn('data-o="dup"','⧉ Dupliquer','Dupliquer la sélection (Ctrl+D)')+
      fbtn('data-o="del"','🗑 Supprimer <span id="selN"></span>','Supprimer la sélection (Suppr)'))
  ])+

  panel('insert',[
    fgrp('Ajouter',
      fbtn('data-a="tb"','T Texte','Zone de texte (ou double-clic sur la page)')+fbtn('data-a="img"','🖼 Image','Ou glisse des images depuis l’ordinateur sur la page')+
      fbtn('data-a="xls"','📊 Excel / CSV','Ou glisse le fichier sur la page')+fbtn('data-a="ntab"','▦ Tableau')+'%T%'),
    fgrp('Texte',
      fbtn('data-l="date"','📅 Date','Date du jour (Ctrl+;)')+fbtn('data-l="time"','🕒 Heure','Heure (Ctrl+Maj+;)')+
      fbtn('data-l="sym"','Ω Symboles','Ω ± ≈ ≤ ≥ Δ π √ …')+fbtn('data-l="sup"','x²','Exposant')+fbtn('data-l="sub"','x₂','Indice')),
    fgrp('Encadrés',
      fbtn('data-l="c_tip"','💡 Astuce')+fbtn('data-l="c_warn"','⚠️ Attention')+fbtn('data-l="c_note"','📌 À retenir')),
    fgrp('Dessin',
      fbtn('data-a="draw"','✏ Dessiner','Dessin à main levée (souris, doigt ou stylet)')),
    fgrp('Liens',
      fbtn('data-a="link"','🔗 Lien vers une page','Insère un lien cliquable vers une autre page')+
      fbtn('data-a="toc"','📑 Sommaire des pages','Crée (ou met à jour) un sommaire des pages')+
      fbtn('data-a="tocp"','📑 Sommaire des titres','Liens vers les Titres 1, 2, 3 de cette page'))
  ])+

  panel('table',[
    fgrp('Lignes et colonnes',
      fbtn('data-t="ar"','+ Ligne')+fbtn('data-t="ac"','+ Colonne')+fbtn('data-t="dr"','– Ligne')+fbtn('data-t="dc"','– Colonne')+
      fbtn('data-t="dupr"','⧉ Ligne','Dupliquer la ligne')+fbtn('data-t="dupc"','⧉ Colonne','Dupliquer la colonne')),
    fgrp('Cellules',
      fbtn('data-t="m"','Fusionner')+fbtn('data-t="s"','Scinder')+
      fbtn('data-t="x"','⬚ Plage','Étendre la sélection : touche ensuite la cellule de fin')+fbtn('data-t="g"','Griser')),
    fgrp('Taille',
      fbtn('data-t="cw"','↔ Largeur…','Largeur de la colonne en pixels (ou tire la poignée ⤡)')+fbtn('data-t="rh"','↕ Hauteur…','Hauteur de la ligne en pixels')+
      fbtn('data-t="fit"','Ajuster au texte')+fbtn('data-t="full"','Pleine largeur')+fbtn('data-t="ctr"','Centrer')),
    fgrp('Trier',
      fbtn('data-t="sa"','A→Z ↑','Trier la colonne (texte, nombres ou dates)')+fbtn('data-t="sz"','Z→A ↓')),
    fgrp('Dates',
      fbtn('data-t="d"','📅 Dates auto','Remplir les cellules sélectionnées avec des dates'))
  ])+

  panel('layout',[
    fgrp('Ordre',
      fbtn('data-o="front"','⤒ Premier plan')+fbtn('data-o="fwd"','↑ Avancer')+fbtn('data-o="bwd"','↓ Reculer')+fbtn('data-o="back"','⤓ Arrière-plan')),
    fgrp('Verrou',
      fbtn('data-o="lock"','🔒 Verrouiller','L’objet ne bouge plus et ne se supprime plus')+fbtn('data-o="unlock"','🔓 Déverrouiller')),
    fgrp('Aligner',
      fbtn('data-o="al_l"','Gauche')+fbtn('data-o="al_c"','Centre')+fbtn('data-o="al_r"','Droite')+
      fbtn('data-o="al_t"','Haut')+fbtn('data-o="al_m"','Milieu')+fbtn('data-o="al_b"','Bas')),
    fgrp('Répartir',
      fbtn('data-o="dist_h"','⇔ Horizontal','Espaces égaux (3 objets ou plus)')+fbtn('data-o="dist_v"','⇕ Vertical')),
    fgrp('Repères',
      fbtn('data-o="snap"','🧲 Magnétisme','Les objets s’accrochent aux bords des autres')+fbtn('data-o="grid"','▦ Grille','Affiche une grille et y accroche les objets')),
    fgrp('Image',
      fbtn('data-o="crop"','✂ Rogner','Retirer les bords de l’image sélectionnée'))
  ])+

  panel('page',[
    fgrp('Affichage',
      fbtn('data-a="focus"','⤢ Focus','Masquer / afficher les colonnes de gauche')+fbtn('data-a="wc"','🔢 Mots','Nombre de mots et de caractères')+
      fbtn('data-a="ro"','🔒 Lecture','Lecture seule : le clavier ne s’ouvre plus')),
    fgrp('Document',
      fbtn('data-a="pdf"','⬇ PDF','Télécharger la page en PDF (Ctrl+P)')+fbtn('data-a="export"','📄 Word / Markdown','Exporter une page, une section ou un carnet')+
      fbtn('data-a="save"','💾 Enregistrer','Enregistrer et synchroniser (Ctrl+S)')),
    fgrp('Carnet',
      fbtn('data-a="tpl"','📋 Modèles','Enregistrer une page type, créer une page depuis un modèle')+
      fbtn('data-a="todo"','☑ À faire','Toutes les cases non cochées de tous les carnets')+
      fbtn('data-a="tags"','🏷 Étiquettes','Filtrer par compétence (#C1, #Maintenance…)')+
      fbtn('data-a="trash"','🗑 Corbeille','Pages, sections et carnets supprimés (30 jours)')),
    fgrp('Sauvegardes',
      fbtn('data-a="hist"','🕘 Historique','Versions précédentes et points de restauration')+
      fbtn('data-a="weight"','📦 Données','Poids des données, compresser les images')),
    fgrp('Outils',
      fbtn('data-a="pomo"','🍅 Minuteur','Pomodoro : 25 min de travail, 5 min de pause')+
      fbtn('data-a="install"','📲 Installer','Ajouter le carnet à l’écran d’accueil'))
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
