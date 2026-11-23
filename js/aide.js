/* Aide : visite guidée, centre d'aide, raccourcis, palette d'actions,
   pages vides qui expliquent quoi faire, indications dans la colonne de gauche */

function isMobile(){return matchMedia('(max-width:760px)').matches}

/* ============ visite guidée ============ */
var TOUR=[
  {t:'Bienvenue 👋',x:'Ton carnet est <b>chiffré</b> sur ton appareil puis synchronisé avec ton dépôt GitHub. Ce petit tour dure une minute : tu peux le relancer à tout moment avec ❓.',sel:null},
  {t:'Carnets, sections, pages',x:'Ici tu choisis ton <b>carnet</b> (le classeur), ta <b>section</b> (l’onglet de couleur) et ta <b>page</b>. « ＋ Ajouter une page » en crée une. Glisse ⠿ pour réorganiser, ✎ pour renommer, 🗑 pour supprimer (récupérable 30 jours dans la corbeille).',sel:function(){return isMobile()?'#bMenu':'#side'}},
  {t:'Écrire où tu veux',x:'<b>Clique n’importe où</b> sur la page : une zone de texte apparaît à cet endroit. Tu peux aussi coller une image (Ctrl+V), en glisser depuis ton ordinateur, ou dessiner. Chaque zone se déplace avec sa barre ✥.',sel:'#page'},
  {t:'La barre d’outils',x:'Cinq onglets : <b>Accueil</b> (texte, couleurs, listes), <b>Insérer</b> (tableau, image, dessin, liens), <b>Tableau</b>, <b>Disposition</b> (aligner, verrouiller, ordre) et <b>Page</b> (PDF, Word, historique, modèles…). Passe la souris sur un bouton pour voir ce qu’il fait.',sel:function(){return isMobile()?'#bTools':'#fb'}},
  {t:'Trouver une page ou une action',x:'La recherche trouve du texte dans <b>toutes</b> tes pages (Ctrl+K). Et <b>⌘ Actions</b> (Ctrl+/) te laisse taper ce que tu veux faire : « tableau », « puces », « pdf »…',sel:'#q'},
  {t:'Synchronisation et jeton',x:'<b>✓ Synchronisé</b> confirme que tes notes sont à l’abri. Le bouton <b>🔑</b> montre les jours restants avant l’expiration de ton jeton GitHub. Tout marche aussi <b>sans réseau</b> : la synchro reprend toute seule.',sel:function(){return isMobile()?'#bMenu':'#stt'}},
  {t:'Besoin d’aide ?',x:'Le bouton <b>❓</b> ouvre l’aide : guide pas à pas, raccourcis clavier et solutions aux problèmes courants. Bonne prise de notes !',sel:'#bHelp'}
];
var tourI=0,tourBox=document.createElement('div');
tourBox.id='tour';
tourBox.innerHTML='<div id="tourhl"></div><div id="tourcard"><div id="tourt"></div><div id="tourx"></div><div id="tourd"></div>'+
  '<div class="row" style="margin-top:10px"><button class="btn sm" data-tour="skip">Passer</button><span style="flex:1"></span>'+
  '<button class="btn sm" data-tour="prev">←</button><button class="btn sm" data-tour="next" style="border-color:var(--accent)">Suivant</button></div></div>';
document.body.appendChild(tourBox);

function showTour(){
  var s=TOUR[tourI],sel=typeof s.sel=='function'?s.sel():s.sel,el=sel&&document.querySelector(sel),
      hl=$('tourhl'),card=$('tourcard');
  $('tourt').textContent=s.t;$('tourx').innerHTML=s.x;
  $('tourd').innerHTML=TOUR.map(function(_,i){return '<i class="'+(i==tourI?'on':'')+'"></i>'}).join('');
  tourBox.querySelector('[data-tour="prev"]').style.visibility=tourI?'visible':'hidden';
  tourBox.querySelector('[data-tour="next"]').textContent=tourI==TOUR.length-1?'Terminer ✓':'Suivant';
  tourBox.style.display='block';
  var r=el&&el.getBoundingClientRect();
  if(r&&r.width>0&&r.height>0){
    hl.style.display='block';
    hl.style.left=(r.left-6)+'px';hl.style.top=(r.top-6)+'px';hl.style.width=(r.width+12)+'px';hl.style.height=(r.height+12)+'px';
    var ch=card.offsetHeight,cw=card.offsetWidth,top;
    if(r.height>innerHeight*0.45)top=innerHeight-ch-16;                    // grande zone : la bulle reste en bas
    else if(r.bottom+ch+18<innerHeight)top=r.bottom+14;
    else top=Math.max(8,r.top-ch-14);
    card.style.top=top+'px';card.style.left=Math.max(8,Math.min(r.left,innerWidth-cw-8))+'px';card.style.transform='none';
  }else{                                                                   // pas de cible : bulle au centre
    hl.style.display='none';
    card.style.top='50%';card.style.left='50%';card.style.transform='translate(-50%,-50%)';
  }
}
function startTour(){closeModal();tourI=0;showTour()}
function endTour(){
  tourBox.style.display='none';
  try{localStorage.setItem('carnet-tour','1')}catch(e){}
}
tourBox.addEventListener('click',function(e){
  var b=e.target.closest('[data-tour]');if(!b)return;
  var a=b.dataset.tour;
  if(a=='skip')endTour();
  else if(a=='prev'){tourI=Math.max(0,tourI-1);showTour()}
  else if(tourI>=TOUR.length-1)endTour();
  else{tourI++;showTour()}
});
window.addEventListener('resize',function(){if(tourBox.style.display=='block')showTour()});
document.addEventListener('keydown',function(e){
  if(tourBox.style.display!='block')return;
  if(e.key=='Escape')endTour();else if(e.key=='ArrowRight'||e.key=='Enter'){e.preventDefault();tourBox.querySelector('[data-tour="next"]').click()}
  else if(e.key=='ArrowLeft')tourBox.querySelector('[data-tour="prev"]').click();
});

/* ============ centre d'aide ============ */
var HELP=[
  {id:'start',t:'🚀 Démarrer en 30 secondes',h:'<ol><li><b>Clique n’importe où</b> sur la page : une zone de texte apparaît, écris.</li>'+
    '<li>Une image ? Bouton <b>🖼 Image</b> (onglet Insérer), <b>Ctrl+V</b> pour coller une capture, ou glisse un fichier sur la page.</li>'+
    '<li>Un tableau ? Onglet <b>Insérer → ▦ Tableau</b>. Un fichier Excel ? <b>📊 Excel / CSV</b> (couleurs et cellules fusionnées conservées).</li>'+
    '<li>Rien à enregistrer : tout est <b>sauvegardé et synchronisé automatiquement</b> (regarde « ✓ Synchronisé » en bas à gauche).</li></ol>'},
  {id:'pages',t:'📓 Carnets, sections et pages',h:'<ul><li><b>Carnet</b> = un classeur (menu en haut à gauche, « ＋ Carnet »). <b>Section</b> = un onglet de couleur. <b>Page</b> = une feuille.</li>'+
    '<li>Sur chaque page : <b>✎</b> renommer, <b>⧉</b> dupliquer, <b>🗑</b> supprimer, <b>⠿</b> glisser pour réordonner ou pour la déplacer dans une autre section (dépose-la sur la section).</li>'+
    '<li>Le rond à gauche d’une page est un <b>statut</b> : ○ aucun, orange « à faire », vert « terminée ».</li>'+
    '<li><b>Pré-créer des semaines</b> crée S37, S39… et accepte les regroupements (ex. « 37, 39, 42-43-44, 45 »).</li>'+
    '<li>Supprimé par erreur ? <b>🗑 Corbeille</b> garde pages, sections et carnets 30 jours.</li></ul>'},
  {id:'write',t:'✍ Écrire et mettre en forme',h:'<ul><li><b>Accueil</b> : style (Titre 1, 2, 3), police, taille, gras / italique / souligné, alignement.</li>'+
    '<li><b>Couleurs</b> : A (texte), 🖍 (surlignage), ▨ (fond de cellule). Un clic sur la lettre applique la dernière couleur, ▾ ouvre la palette. « Aucune couleur » en haut de la palette la retire. <b>⌫ Effacer le format</b> remet tout à zéro.</li>'+
    '<li><b>Listes</b> : « • ▾ » (puces, flèches, plan 1. a. i.…), « 1. » pour numéroter. <b>Tab</b> / <b>Maj+Tab</b> changent de niveau.</li>'+
    '<li><b>Insérer</b> : date et heure, symboles Ω ± ≈ ≤ ≥, exposant / indice, encadrés 💡 ⚠️ 📌, cases à cocher ☑.</li></ul>'},
  {id:'tables',t:'▦ Tableaux',h:'<ul><li><b>Sélectionner plusieurs cellules</b> : glisse la souris, ou Maj + clic. Sur téléphone : touche une cellule, « ⬚ Plage », puis la cellule de fin.</li>'+
    '<li><b>Redimensionner</b> : passe sur un trait (le curseur change) et tire. Ou onglet Tableau → Largeur… / Hauteur… (valable pour toute la sélection).</li>'+
    '<li>Onglet <b>Tableau</b> : ajouter / supprimer / dupliquer lignes et colonnes, fusionner, scinder, trier (A→Z, dates, nombres), dates automatiques.</li>'+
    '<li><b>Clic droit</b> sur une cellule : menu rapide.</li></ul>'},
  {id:'objects',t:'🖼 Images, dessin et objets libres',h:'<ul><li>Chaque zone de texte, image ou dessin est un <b>objet</b> : tire sa barre <b>✥</b> pour le déplacer, le coin pour l’agrandir.</li>'+
    '<li><b>Sélection multiple</b> : trace un rectangle sur le fond, Ctrl/Maj + clic, ou <b>Ctrl+A</b>. Puis <b>Suppr</b> (tout supprimer), <b>Ctrl+D</b> (dupliquer), flèches (déplacer).</li>'+
    '<li>Onglet <b>Disposition</b> : premier plan / arrière-plan, verrouiller, aligner, répartir, grille et magnétisme, ✂ rogner une image.</li>'+
    '<li><b>✏ Dessiner</b> : souris, doigt ou stylet. Pour annoter une photo, dessine par-dessus.</li></ul>'},
  {id:'organize',t:'🗂 S’organiser',h:'<ul><li><b>☑ À faire</b> : toutes les cases non cochées de tous tes carnets. <b>🏷 Étiquettes</b> : #C1, #Maintenance… et filtre par compétence.</li>'+
    '<li><b>🔗 Lien</b> vers une page, <b>📑 Sommaire</b> des pages ou des titres, <b>📋 Modèles</b> de pages.</li>'+
    '<li><b>⬇ PDF</b> (Ctrl+P), <b>📄 Word / Markdown</b> pour exporter une page, une section ou un carnet. <b>🍅 Minuteur</b> Pomodoro en haut.</li></ul>'},
  {id:'sync',t:'☁ Synchronisation, sécurité et sauvegardes',h:'<ul><li>Tes notes sont <b>chiffrées sur ton appareil</b> (AES) avec ton e-mail et ton mot de passe avant d’être envoyées sur ton dépôt privé. <b>Il n’y a aucun moyen de récupérer un mot de passe perdu</b> : note-le.</li>'+
    '<li>Plusieurs appareils : les modifications se retrouvent en une dizaine de secondes ; si deux appareils modifient en même temps, tout est fusionné.</li>'+
    '<li><b>🔑</b> montre les jours restants du jeton GitHub (clic pour saisir la date ou changer le jeton).</li>'+
    '<li><b>🕘 Historique</b> : versions précédentes et points de restauration (📸). <b>📦 Données</b> : poids et compression des images.</li>'+
    '<li>Sans réseau, tout fonctionne : les modifications partent dès que la connexion revient.</li></ul>'},
  {id:'iphone',t:'📱 Sur iPhone',h:'<ul><li><b>Installer</b> : ouvre le site dans Safari → Partager → « Sur l’écran d’accueil ». À la première ouverture de l’icône, reconnecte-toi.</li>'+
    '<li><b>☰</b> ouvre carnets et pages, <b>🛠</b> la barre d’outils, <b>🔒</b> passe en lecture seule (le clavier ne s’ouvre plus quand tu fais défiler).</li>'+
    '<li>En écrivant, une mini-barre au-dessus du clavier donne gras, puces, numéros, retrait, alignement et case à cocher.</li></ul>'},
  {id:'pronote',t:'🎓 Onglet Pronote',h:'<ul><li>Le bouton <b>🎓</b> (en haut à gauche) bascule entre <b>📓 Carnet</b> et <b>🎓 Pronote</b>.</li>'+
    '<li><b>Compte ENT (Édifice…)</b> : onglet « 🔐 ENT (code QR) » dans ⚙ Réglages. Génère un QR code dans Pronote (Mon compte → Application mobile), choisis un code à 4 chiffres, lis le QR (capture ou caméra) et connecte-toi.</li>'+
    '<li><b>Connexion directe</b> (comme Papillon) : identifiant et mot de passe Pronote, ou QR code. Il faut un petit <b>relais Cloudflare</b> à toi et la bibliothèque Pawnote : tout est expliqué dans <b>GUIDE-PRONOTE.md</b>. Le mot de passe n’est jamais enregistré.</li>'+
    '<li>Tu obtiens l’emploi du temps, les devoirs, les <b>notes et moyennes</b> (avec ta moyenne calculée selon les coefficients).</li>'+
    '<li>Bouton <b>🧪 Essayer avec la démo</b> pour tester sans risque. <b>Diagnostic</b> en cas de problème.</li>'+
    '<li>Alternative sans relais : lien ou fichier <b>iCal</b> (cours et devoirs seulement) ; les notes se saisissent à la main.</li></ul>'},
  {id:'keys',t:'⌨ Raccourcis clavier',h:'<table class="keys">'+[
    ['Ctrl + K','Rechercher dans toutes les pages'],['Ctrl + /','⌘ Actions : taper ce que tu veux faire'],['F1','Cette aide'],
    ['Ctrl + S','Enregistrer et synchroniser'],['Ctrl + P','Télécharger la page en PDF'],['Ctrl + Z / Ctrl + Y','Annuler / rétablir (15 derniers états)'],
    ['Ctrl + B / I / U','Gras / italique / souligné'],['Tab / Maj + Tab','Niveau suivant / précédent dans une liste'],
    ['Ctrl + ;  /  Ctrl + Maj + ;','Insérer la date / l’heure'],['Alt + ← / →','Page précédente / suivante'],
    ['Ctrl + A','Sélectionner tous les objets (2e fois dans une zone de texte)'],['Suppr','Supprimer les objets sélectionnés'],
    ['Ctrl + D','Dupliquer la sélection'],['Flèches (+ Maj)','Déplacer l’objet sélectionné (1 px, 10 px)'],['Échap','Désélectionner / fermer']
  ].map(function(k){return '<tr><td><kbd>'+k[0]+'</kbd></td><td>'+k[1]+'</td></tr>'}).join('')+'</table>'},
  {id:'faq',t:'🛟 Problèmes fréquents',h:'<ul><li><b>« Jeton refusé »</b> : le jeton a expiré. Clique sur 🔑 → « Changer le jeton ».</li>'+
    '<li><b>« Données illisibles »</b> : l’e-mail ou le mot de passe n’est pas celui utilisé à la création.</li>'+
    '<li><b>Rien ne se synchronise</b> : regarde l’état en bas à gauche (hors ligne, erreur…). Ctrl+S force une synchro.</li>'+
    '<li><b>Un bouton ne réagit pas</b> : clique d’abord dans le texte ou la cellule concernée (la mise en forme s’applique là où se trouve le curseur).</li>'+
    '<li><b>Page blanche ou ancienne version</b> : recharge la page ; sur iPhone, ferme l’app et rouvre-la avec du réseau.</li></ul>'}
];
function openHelp(open){
  openModal('❓ Aide',
    '<div class="row" style="margin-bottom:8px"><button class="btn sm" data-h="tour">▶ Visite guidée</button><button class="btn sm" data-h="palette">⌘ Chercher une action</button></div>'+
    '<input id="hq" placeholder="Chercher dans l’aide…" autocomplete="off" style="margin-bottom:8px"><div id="hl">'+
    HELP.map(function(s){return '<details class="hsec"'+(s.id==open||(!open&&s.id=='start')?' open':'')+'><summary>'+s.t+'</summary>'+s.h+'</details>'}).join('')+'</div>',
    function(ev){
      var b=ev.target.closest('[data-h]');if(!b)return;
      closeModal();
      if(b.dataset.h=='tour')startTour();else openPalette();
    });
  $('hq').oninput=function(){
    var q=nz(this.value);
    [].forEach.call(document.querySelectorAll('#hl details'),function(d){
      var hit=!q||nz(d.textContent).indexOf(q)>=0;
      d.style.display=hit?'':'none';
      if(q&&hit)d.open=true;
    });
  };
}

/* ============ palette d'actions (Ctrl+/) ============ */
function commands(){
  var out=[];
  [].forEach.call(document.querySelectorAll('#fb .tp'),function(panel){
    var tab=panel.dataset.tp,group=(TABS.filter(function(t){return t[0]==tab})[0]||[0,tab])[1];
    [].forEach.call(panel.querySelectorAll('button'),function(b){
      var d=b.dataset;
      if(!(d.a||d.f||d.t||d.o||d.l||d.cq||d.pop||d.fc!==undefined))return;
      var name=b.textContent.replace(/\s+/g,' ').trim(),title=b.title||'';
      if(name.length<=3||/^[^\p{L}\p{N}]*$/u.test(name))name=title.replace(/\s*\(.*\)\s*$/,'')||name;
      if(!name)return;
      out.push({el:b,tab:tab,group:group,name:name,title:title});
    });
  });
  return out;
}
function openPalette(){
  var cmds=commands(),cur=0,shown=[];
  function paint(q){
    q=nz(q||'');
    shown=cmds.filter(function(c){return !q||nz(c.name+' '+c.title+' '+c.group).indexOf(q)>=0}).slice(0,14);
    if(cur>=shown.length)cur=0;
    $('pall').innerHTML=shown.map(function(c,i){
      return '<div class="mit'+(i==cur?' on':'')+'" data-i="'+i+'"><b>'+esc(c.name)+'</b> <small style="color:var(--muted)">'+esc(c.group)+(c.title&&c.title!=c.name?' · '+esc(c.title):'')+'</small></div>';
    }).join('')||'<p style="color:var(--muted)">Aucune action trouvée.</p>';
  }
  function run(i){
    var c=shown[i];if(!c)return;
    closeModal();
    document.body.dataset.tab=c.tab;document.body.classList.add('tools');
    setTimeout(function(){c.el.click()},60);
  }
  openModal('⌘ Que veux-tu faire ?','<input id="pal" placeholder="ex. tableau, puces, couleur, pdf, date…" autocomplete="off"><div id="pall" style="margin-top:8px"></div>',
    function(ev){var it=ev.target.closest('[data-i]');if(it)run(+it.dataset.i)});
  paint('');
  var inp=$('pal');
  inp.oninput=function(){cur=0;paint(this.value)};
  inp.onkeydown=function(e){
    if(e.key=='ArrowDown'){e.preventDefault();cur=Math.min(shown.length-1,cur+1);paint(this.value)}
    else if(e.key=='ArrowUp'){e.preventDefault();cur=Math.max(0,cur-1);paint(this.value)}
    else if(e.key=='Enter'){e.preventDefault();run(cur)}
  };
  inp.focus();
}

/* ============ page vide : on explique quoi faire ============ */
var TIPS=['Ctrl+A puis Suppr vide la page en un coup (Ctrl+Z pour annuler).','Glisse une image depuis ton ordinateur directement sur la page.',
  'Tire sur un trait du tableau pour changer la taille d’une colonne ou d’une ligne.','Ctrl+K cherche dans toutes tes pages, Ctrl+/ cherche une action.',
  'Écris #C1 ou #Maintenance dans un texte : 🏷 Étiquettes retrouve tout.','Un clic droit sur une cellule ouvre un menu de tableau.'];
function paintEmpty(){
  var pe=$('page'),p=pg(),old=pe&&pe.querySelector('.emptycard');
  var empty=pe&&p&&!pe.querySelector('.box')&&!pe.querySelector('table')&&!RO()&&!DR.on;
  if(!empty){if(old)old.remove();return}
  if(old)return;
  var d=document.createElement('div');
  d.className='emptycard';
  d.innerHTML='<div style="font-weight:600;margin-bottom:4px">✨ Page vide : par où commencer ?</div>'+
    '<div style="color:var(--muted);margin-bottom:10px">Clique n’importe où sur la page pour écrire, ou choisis :</div>'+
    '<div class="eg"><button class="btn" data-a="tb">✍ Écrire</button><button class="btn" data-a="ntab">▦ Tableau</button><button class="btn" data-a="mk">📅 Semaine</button>'+
    '<button class="btn" data-a="img">🖼 Image</button><button class="btn" data-a="draw">✏ Dessiner</button><button class="btn" data-a="tpl">📋 Modèle</button></div>'+
    '<div style="color:var(--muted);margin-top:10px;font-size:12px">💡 '+TIPS[Math.floor(Math.random()*TIPS.length)]+' · <a href="#" data-a="help" style="color:var(--accent)">❓ Aide</a></div>';
  pe.appendChild(d);
}
function paintHints(){
  var pg2=$('pgs');if(!pg2)return;
  var old=pg2.querySelector('.hint');if(old)old.remove();
  if(pg2.querySelector('.pg')||!sec())return;
  var h=document.createElement('div');
  h.className='hint';
  h.innerHTML='Cette section est vide.<br>Touche <b>＋ Ajouter une page</b>, ou <b>📋 Modèles</b> pour partir d’une page type.';
  pg2.appendChild(h);
}
POST.push(paintEmpty);POST.push(paintHints);

/* ============ branchements ============ */
ACTIONS.help=function(){openHelp()};
ACTIONS.tour=startTour;
ACTIONS.palette=openPalette;
ACTIONS.keys=function(){openHelp('keys')};
$('bHelp').onclick=function(){openHelp()};
document.addEventListener('keydown',function(e){
  var ctrl=e.ctrlKey||e.metaKey;
  if(ctrl&&e.key=='/'){e.preventDefault();openPalette()}
  else if(e.key=='F1'){e.preventDefault();openHelp()}
});
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('a[data-a]');   // lien « Aide » dans la page vide
  if(a){e.preventDefault();ACTIONS[a.dataset.a]&&ACTIONS[a.dataset.a]()}
});
/* première utilisation : la visite guidée se lance toute seule, une seule fois */
var tourAuto=false;
POST.push(function(){
  var seen=false;try{seen=localStorage.getItem('carnet-tour')=='1'}catch(e){}
  if(seen||tourAuto||$('lock').style.display=='flex')return;
  tourAuto=true;setTimeout(startTour,900);
});
