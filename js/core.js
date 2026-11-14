/* Données, rendu, zones libres, événements, tableaux de semaine, pages hebdomadaires */
var KEY='carnet-bts-v2',OLD='carnet-bts-v1';
var DAYS=['LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI'];
var MOIS=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
var COLORS=['#1b4f8a','#2aa5d8','#2ba84a','#e8622a','#a23bb5','#d4a017'];
var SUBJ=['MATHEMATIQUES<br>Me. DUQUESNE H.','CULTURE GENERALE ET EXPRESSION<br>M. SAUTIERE Y.','ANGLAIS<br>ME. LOYEZ V.','PHYSIQUE-CHIMIE<br>M. CLERY P.','PHYSIQUE-CHIMIE<br>M. MAILLARD P','Electrotechnique<br>INTEGRATION D’UN BIEN<br>M. BERLANCOURT F.','Automatismes<br>AP ET GESTION DE PROJETS<br>M. MIETTE S.','Analyse fonctionnelle et structurelle<br>M. FONTAINE B.','ORGANISATION DE LA MAINTENANCE<br>M. WEMAERE P.','TECHNIQUES DE MAINTENANCE<br>M. LELOUTRE L.','TECHNIQUES DE MAINTENANCE<br>M. WEMAERE P.','AP & Dossier de 1ere année<br>M. MAILLARD P.'];
var D,lastTd=null,tm=null,qcb=null;
function $(i){return document.getElementById(i)}
function uid(){return Math.random().toString(36).slice(2,9)}
function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
function toast(m){var t=$('toast');t.textContent=m;t.style.display='block';setTimeout(function(){t.style.display='none'},4000)}
function isoW(d){d=new Date(d);d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));return Math.ceil(((d-Date.UTC(d.getUTCFullYear(),0,1))/864e5+1)/7)}
function wiy(y){return isoW(Date.UTC(y,11,28))}
function monday(y,w){var j4=new Date(Date.UTC(y,0,4)),d=j4.getUTCDay()||7,m=new Date(j4);m.setUTCDate(j4.getUTCDate()-d+1+(w-1)*7);return m}
function add(d,n){var x=new Date(d);x.setUTCDate(x.getUTCDate()+n);return x}
function fmt(d){return String(d.getUTCDate()).padStart(2,'0')+' '+MOIS[d.getUTCMonth()]}
function blank(t){return {id:uid(),title:t||'Nouvelle page',sub:'',cols:null,rows:null,boxes:[]}}
function weekPage(pre,y,w,subj,nd){
 var m=monday(y,w),cols=['Matières'];
 for(var i=0;i<5;i++)cols.push(nd===false?DAYS[i]:DAYS[i]+' '+fmt(add(m,i)));
 cols.push('PROCHAINE ALTERNANCE');
 var rows=subj.map(function(s){var r=[{t:s,g:0}];for(var i=0;i<6;i++)r.push({t:'',g:0});return r});
 return {id:uid(),y:y,title:'S'+w+' '+pre,sub:nd===false?'Semaine '+w:'Semaine '+w+' : du '+fmt(m)+' au '+fmt(add(m,4))+' '+add(m,4).getUTCFullYear(),cols:cols,rows:rows,boxes:[]}
}
function newNb(n){return {id:uid(),name:n,sections:[{id:uid(),name:'Section 1',color:COLORS[0],pages:[blank('Page 1')]}]}}
function seed(){
 var pages=[blank('Emploi du temps')];
 for(var w=37;w<=51;w+=2)pages.push(weekPage('Rapport BTS',2026,w,SUBJ));
 var s=pages[1];s.rows[0][4].t='EQUATIONS/INEQUATIONS';s.rows[5][1].t='<b>Test de rentrée (non noté)</b>';s.rows[11][1].t='<b>Accueil rentrée</b><br>- Emploi du temps';
 [[0,1],[0,2],[0,3],[1,1],[1,2],[1,3],[1,5]].forEach(function(p){s.rows[p[0]][p[1]].g=1});
 return fix({cur:{n:0,s:1,p:1},nbs:[{id:uid(),name:'Rapport de stage',sections:[{id:uid(),name:'Rapport ENTREPRISE',color:COLORS[0],pages:[]},{id:uid(),name:'Rapport BTS',color:COLORS[1],pages:pages},{id:uid(),name:'Idée',color:COLORS[2],pages:[]}]}]})
}
function fix(d){d.nbs.forEach(function(n){n.sections.forEach(function(s){s.pages.forEach(function(p){if(!p.boxes){p.boxes=[];if(p.notes&&p.notes.replace(/<[^>]*>/g,'').trim()||/<img|<table/.test(p.notes||''))p.boxes.push({id:uid(),k:'t',x:20,y:p.cols?170+p.rows.length*70:110,w:520,c:p.notes});delete p.notes}tabify(p)})})});return d}
function load(){
 try{var v=localStorage.getItem(KEY);if(v)return fix(JSON.parse(v));
  var o=localStorage.getItem(OLD);if(o){var q=JSON.parse(o);return fix({cur:{n:0,s:q.cur.s,p:q.cur.p},nbs:[{id:uid(),name:'Rapport de stage',sections:q.sections}]})}}catch(e){}
 return seed()
}
function save(){if(H(JSON.stringify(D.nbs))!==LH)dirty=true;clearTimeout(pt2);pt2=setTimeout(persist,600)}
function nb(){return D.nbs[D.cur.n]}
function sec(){return nb().sections[D.cur.s]}
function pg(){var s=sec();return s&&s.pages[D.cur.p]}
function clamp(){var c=D.cur;c.n=Math.min(c.n,D.nbs.length-1);var n=nb();c.s=Math.max(0,Math.min(c.s,n.sections.length-1));var s=n.sections[c.s];c.p=s?Math.max(0,Math.min(c.p,s.pages.length-1)):0}
function ask(label,val,cb,only){$('ql').textContent=label;var i=$('qi');i.style.display=only?'none':'block';i.value=val||'';qcb=cb;$('dq').showModal();if(!only){i.focus();i.select()}}
function conf(l,cb){ask(l,'',cb,true)}
$('qok').onclick=function(){var v=$('qi').value,f=qcb;qcb=null;$('dq').close();if(f)f(v)};
$('qno').onclick=function(){qcb=null;$('dq').close()};
$('qi').onkeydown=function(e){if(e.key=='Enter')$('qok').click()};
function render(){
 clamp();var n=nb();if(bulk&&bulk.sig!=D.cur.n+','+(bulk.k=='p'?D.cur.s:''))bulk=null;
 var h='<select id="nsel">'+D.nbs.map(function(x,i){return '<option value="'+i+'"'+(i==D.cur.n?' selected':'')+'>'+esc(x.name)+'</option>'}).join('')+'</select><div class="top"><button class="btn sm" data-a="nnew">＋ Carnet</button><button class="btn sm" data-a="nren">✎ Renommer</button><button class="btn sm" data-a="ndel">🗑</button></div>';
 n.sections.forEach(function(s,i){h+='<div class="sec'+(i==D.cur.s?' on':'')+'" data-s="'+i+'">'+ck('s',i)+gp('s',i)+'<b style="background:'+qa(s.color)+'"></b><span>'+esc(s.name)+'</span><button class="x" data-rs="'+i+'" title="Renommer">✎</button><button class="x" data-ds="'+i+'" title="Supprimer">🗑</button></div>'});
 h+='<button class="link" data-a="snew">+ Nouvelle section</button>'+(bulk&&bulk.k=='s'?bbar():'<button class="link" data-a="bulks">☑ Sélectionner des sections</button>');
 $('secs').innerHTML=h;
 var s=sec(),g='<div class="top"><button class="btn" data-a="pnew">＋ Ajouter une page</button><button class="btn" data-a="gen">Pré-créer des semaines</button></div>'+(bulk&&bulk.k=='p'?bbar():'<div class="top"><button class="btn sm" data-a="bulkp">☑ Sélectionner des pages</button></div>');
 if(s)s.pages.forEach(function(p,i){g+='<div class="pg'+(i==D.cur.p?' on':'')+'" data-p="'+i+'">'+ck('p',i)+gp('p',i)+'<span>'+esc(p.title)+'</span><button class="x" data-rp="'+i+'" title="Renommer">✎</button><button class="x" data-dp="'+i+'" title="Supprimer">🗑</button></div>'});
 $('pgs').innerHTML=g;if(bulk)bsync();
 var p=pg(),m=$('main');
 if(!p){m.innerHTML='<p style="color:var(--muted)">Aucune page ici. Utilise « Ajouter une page ».</p>';return}
 var tb='',tt;
 if(p.tab){tt='<button class="btn sm" data-a="rmtab">Retirer le tableau</button>';tb='<div class="wrap">'+san(p.tab)+'</div>'}
 else tt='<button class="btn sm" data-a="mk">Ajouter un tableau semaine</button>';
 m.innerHTML=FB.replace('%T%',tt)+'<div id="page"><div id="title" contenteditable>'+esc(p.title)+'</div><div id="sub" contenteditable data-ph="Sous-titre">'+esc(p.sub)+'</div></div>';
 var pe=$('page');pe.insertAdjacentHTML('beforeend',tb);
 p.boxes.forEach(function(b){pe.appendChild(mkBox(b))});fit();ser(1);hydrate();
}
function mkBox(b){
 var e=document.createElement('div');e.className='box';e.dataset.id=b.id;e.dataset.k=b.k;e.dataset.ar=b.ar||'';
 e.style.left=b.x+'px';e.style.top=b.y+'px';e.style.width=b.w+'px';
 e.innerHTML='<div class="bh"><span>✥ déplacer</span><button class="bx" title="Supprimer">✕</button></div>'+(b.k=='i'?'<img draggable="false" '+(+b.ar?'style="aspect-ratio:'+(+b.ar)+'" ':'')+(/^idb:/.test(b.c)?'data-ref="'+qa(b.c)+'">':'src="'+qa(b.c)+'">'):'<div class="bc" contenteditable data-ph="Écrire ici…">'+san(b.c)+'</div>')+'<span class="br"></span>';
 return e
}
function fit(){var pe=$('page');if(!pe)return;var m=500;[].forEach.call(pe.querySelectorAll('.box'),function(b){m=Math.max(m,b.offsetTop+b.offsetHeight+120)});pe.style.minHeight=m+'px'}
function nextY(){var pe=$('page'),w=pe.querySelector('.wrap'),y=w?w.offsetTop+w.offsetHeight+20:150;[].forEach.call(pe.querySelectorAll('.box'),function(b){y=Math.max(y,b.offsetTop+b.offsetHeight+12)});return y}
function addBox(k,x,y,w,c,ar){var e=mkBox({id:uid(),k:k,x:x,y:y,w:w,c:c,ar:ar});$('page').appendChild(e);fit();ser();return e}
function newText(x,y){var e=addBox('t',Math.max(0,x),Math.max(0,y),280,'');e.querySelector('.bc').focus()}
function ser(q){
 var p=pg(),pe=$('page');if(!p||!pe)return;
 p.title=$('title').textContent;p.sub=$('sub').textContent;
 var tb=pe.querySelector('table.w');p.tab=tb?clean(tb.outerHTML):null;
 p.boxes=[].map.call(pe.querySelectorAll('.box'),function(e){var i=e.dataset.k=='i';return {id:e.dataset.id,k:e.dataset.k,ar:parseFloat(e.dataset.ar)||0,x:parseInt(e.style.left)||0,y:parseInt(e.style.top)||0,w:parseInt(e.style.width)||200,c:i?(e.querySelector('img').dataset.ref||e.querySelector('img').getAttribute('src')):clean(e.querySelector('.bc').innerHTML)}});
 var js=JSON.stringify([p.title,p.sub,p.tab,p.boxes]),hs=H(js),h=HI[p.id];if(q){p.hh=hs;if(!h)HI[p.id]={s:[js],i:0};return}if(hs!==p.hh){p.hh=hs;p.u=Date.now();if(!h)h=HI[p.id]={s:[],i:-1};if(h.s[h.i]!==js){h.s.length=h.i+1;h.s.push(js);if(h.s.length>16)h.s.shift();h.i=h.s.length-1}save()}
}
function shrink(f,cb){var fr=new FileReader();fr.onload=function(){var im=new Image();im.onload=function(){var k=Math.min(1,1000/im.width),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',0.8),c.width,c.height)};im.src=fr.result};fr.readAsDataURL(f)}
function putImg(f){shrink(f,async function(u,w,h){if(!$('page'))return;var id=uid();try{await storeImg(id,u)}catch(e){toast('Impossible d’enregistrer l’image.');return}addBox('i',30,nextY(),Math.min(360,w),'idb:'+id,w/h);hydrate()})}
document.addEventListener('input',function(e){if(!e.target.closest||!e.target.closest('#page'))return;if(e.target.id=='title'){var s=document.querySelector('.pg.on span');if(s)s.textContent=e.target.textContent}fit();clearTimeout(tm);tm=setTimeout(ser,300)});
document.addEventListener('keydown',function(e){if(e.target.id=='title'&&e.key=='Enter'){e.preventDefault();e.target.blur()}});
document.addEventListener('focusin',function(e){if(e.target.tagName=='TD')lastTd=e.target});
document.addEventListener('focusout',function(e){var b=e.target.closest&&e.target.closest('.box');if(b&&b.dataset.k=='t'){var c=b.querySelector('.bc');if(c&&!c.textContent.trim()&&!c.querySelector('img,table')){b.remove();ser()}}});
document.addEventListener('dblclick',function(e){var t=e.target;if(t.id=='page'||(t.classList&&t.classList.contains('tools'))){var r=$('page').getBoundingClientRect();newText(e.clientX-r.left,e.clientY-r.top)}});
document.addEventListener('paste',function(e){if(!e.target.closest||!e.target.closest('#page'))return;var fs=[].filter.call(e.clipboardData.files||[],function(f){return /^image\//.test(f.type)});if(fs.length){e.preventDefault();fs.forEach(putImg)}});
document.addEventListener('pointerdown',function(e){
 var t=e.target;if(!t.closest||t.closest('.bx'))return;
 var h=t.closest('.bh'),r=t.closest('.br');if(!h&&!r)return;
 var b=t.closest('.box');e.preventDefault();
 var sx=e.clientX,sy=e.clientY,ox=b.offsetLeft,oy=b.offsetTop,ow=b.offsetWidth;
 function mv(ev){var dx=ev.clientX-sx,dy=ev.clientY-sy;if(h){b.style.left=Math.max(0,ox+dx)+'px';b.style.top=Math.max(0,oy+dy)+'px'}else b.style.width=Math.max(80,ow+dx)+'px'}
 function up(){document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);fit();ser()}
 document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up)
});
$('secs').addEventListener('change',function(e){if(e.target.id=='nsel'){ser();D.cur={n:+e.target.value,s:0,p:0};save();render()}});
document.addEventListener('click',function(e){
 var t=e.target,d=t.dataset||{},n=nb();
 var bt=t.closest&&t.closest('[data-f],[data-t]');if(bt){var df=bt.dataset.f;if(df=='undo')undo(-1);else if(df=='redo')undo(1);else if(df)fmtT(df);else tbOp(bt.dataset.t);return}
 if(t.classList.contains('ck')){bpick(t.dataset.k,+t.dataset.i,e.shiftKey);return}
 if(DG||t.classList.contains('gp'))return;
 if(t.classList.contains('bx')){t.closest('.box').remove();fit();ser();return}
 if(d.rs!==undefined){ser();var s=n.sections[+d.rs];ask('Nouveau nom de la section',s.name,function(v){if(v.trim()){s.name=v.trim();save();render()}});return}
 if(d.ds!==undefined){ser();var i=+d.ds;conf('Supprimer la section « '+n.sections[i].name+' » et toutes ses pages ?',function(){n.sections.splice(i,1);D.cur.s=0;D.cur.p=0;save();render()});return}
 if(d.rp!==undefined){ser();var p=sec().pages[+d.rp];ask('Nouveau titre de la page',p.title,function(v){if(v.trim()){p.title=v.trim();p.u=Date.now();save();render()}});return}
 if(d.dp!==undefined){ser();var j=+d.dp,ss=sec();conf('Supprimer la page « '+ss.pages[j].title+' » ?',function(){ss.pages.splice(j,1);D.cur.p=Math.max(0,j-1);save();render()});return}
 var a=t.closest('[data-s]');if(a){if(bulk&&bulk.k=='s'){bpick('s',+a.dataset.s,e.shiftKey);return}ser();D.cur={n:D.cur.n,s:+a.dataset.s,p:0};save();render();return}
 var b=t.closest('[data-p]');if(b){if(bulk&&bulk.k=='p'){bpick('p',+b.dataset.p,e.shiftKey);return}ser();D.cur.p=+b.dataset.p;save();render();return}
 var ac=d.a;if(!ac)return;
 if(ac=='nnew'){ser();ask('Nom du nouveau carnet','Nouveau carnet',function(v){if(v.trim()){D.nbs.push(newNb(v.trim()));D.cur={n:D.nbs.length-1,s:0,p:0};save();render()}});return}
 if(ac=='nren'){ser();ask('Nouveau nom du carnet',n.name,function(v){if(v.trim()){n.name=v.trim();save();render()}});return}
 if(ac=='ndel'){ser();conf('Supprimer le carnet « '+n.name+' » et tout son contenu ?',function(){D.nbs.splice(D.cur.n,1);if(!D.nbs.length)D.nbs.push(newNb('Nouveau carnet'));D.cur={n:0,s:0,p:0};save();render()});return}
 if(ac=='snew'){ser();ask('Nom de la nouvelle section','Nouvelle section',function(v){if(v.trim()){n.sections.push({id:uid(),name:v.trim(),color:COLORS[n.sections.length%COLORS.length],pages:[]});D.cur={n:D.cur.n,s:n.sections.length-1,p:0};save();render()}});return}
 if(ac=='pnew'){if(!sec())return;ser();ask('Titre de la page','Nouvelle page',function(v){if(v.trim()){sec().pages.push(blank(v.trim()));D.cur.p=sec().pages.length-1;save();render()}});return}
 if(ac=='ntab'){if(!$('page'))return;nMode='new';nOpen();return}
 if(ac=='gen'){$('dlg').showModal();return}
 if(ac=='bulkp'||ac=='bulks'){ser();bulk={k:ac=='bulkp'?'p':'s',set:{},sig:D.cur.n+','+(ac=='bulkp'?D.cur.s:'')};bl=-1;render();return}
 if(ac=='bend'){bulk=null;render();return}
 if(ac=='ball'||ac=='bnone'){var L=bulk.k=='p'?sec().pages.length:n.sections.length;for(var q=0;q<L;q++)bulk.set[q]=ac=='ball';bsync();return}
 if(ac=='bdel'){var ids=Object.keys(bulk.set).filter(function(x){return bulk.set[x]}).map(Number),kk=bulk.k;if(!ids.length){toast('Coche d’abord des éléments.');return}
  conf('Supprimer '+ids.length+(kk=='p'?' page(s) ?':' section(s) et toutes leurs pages ?'),function(){if(kk=='p'){var ss=sec();ss.pages=ss.pages.filter(function(_,i){return ids.indexOf(i)<0});D.cur.p=0}else{n.sections=n.sections.filter(function(_,i){return ids.indexOf(i)<0});D.cur.s=0;D.cur.p=0}bulk=null;save();render()});return}
 if(ac=='img'){$('fImg').click();return}
 if(ac=='xls'){$('fXls').click();return}
 if(ac=='print'){ser();window.print();return}
 if(ac=='tb'){newText(30,nextY());return}
 var p2=pg();if(!p2)return;ser();
 if(ac=='mk'){var c0=['Matières'].concat(DAYS,['PROCHAINE ALTERNANCE']);p2.tab=tabHtml(c0,SUBJ.map(function(x){var r=[{t:x,g:0}];for(var i=0;i<6;i++)r.push({t:'',g:0});return r}))}
 if(ac=='rmtab')p2.tab=null;
 save();render()
});
$('fImg').onchange=function(e){[].forEach.call(e.target.files,putImg);e.target.value=''};
$('dNo').onclick=function(){$('dlg').close()};
$('dOk').onclick=function(){
 ser();var s=sec();if(!s)return;
 var pre=$('dPre').value,y=+$('dY').value,y2=+$('dY2').value,a=+$('dA').value,b=+$('dB').value,st=Math.max(1,+$('dS').value);
 var cur=pg(),subj=subjOf(cur),ex=s.pages.map(function(p){return p.title+'|'+(p.y||2026)});
 var w=a,c=0;while((y*100+w)<=(y2*100+b)&&c++<150){var np=weekPage(pre,y,w,subj,$('dDt').checked);if(ex.indexOf(np.title+'|'+y)<0)s.pages.push(tabify(np));w+=st;while(w>wiy(y)){w-=wiy(y);y++}}
 save();$('dlg').close();render()
};
var TH=[],sel=null,sr=null;
var FB='<div id="fb"><button class="btn sm" data-f="undo" title="Annuler (Ctrl+Z)">↶</button><button class="btn sm" data-f="redo" title="Rétablir (Ctrl+Y)">↷</button><button class="btn sm" data-a="tb">T Zone de texte</button><button class="btn sm" data-a="img">🖼 Image</button><button class="btn sm" data-a="xls">📊 Excel / CSV</button><button class="btn sm" data-a="ntab">▦ Tableau</button>%T%<button class="btn sm" data-a="print" title="Imprimer / exporter en PDF">🖨 PDF</button><span style="width:10px"></span><select id="fF"><option value="">Police</option>'+['Calibri','Arial','Verdana','Georgia','Times New Roman','Courier New','Comic Sans MS','Gabriola','Impact'].map(function(f){return '<option>'+f+'</option>'}).join('')+'</select><select id="fS"><option value="">Taille</option>'+[8,9,10,11,12,14,16,18,20,24,28,32,40,48].map(function(n){return '<option>'+n+'</option>'}).join('')+'</select>'
+'<button class="btn sm" data-f="b"><b>G</b></button><button class="btn sm" data-f="i"><i>I</i></button><button class="btn sm" data-f="u"><u>S</u></button>'
+'<label title="Couleur du texte">A <input type="color" id="cT" value="#000000"></label><label title="Surlignage du texte">🖍 <input type="color" id="cH" value="#ffff00"></label><label title="Fond de cellule">▨ <input type="color" id="cB" value="#ffffff"></label>'
+'<button class="btn sm" data-f="l" title="Aligner à gauche">⇤</button><button class="btn sm" data-f="c" title="Centrer">↔</button><button class="btn sm" data-f="r" title="Aligner à droite">⇥</button><span style="width:10px"></span>'
+'<button class="btn sm" data-t="ar">+ Ligne</button><button class="btn sm" data-t="ac">+ Colonne</button><button class="btn sm" data-t="dr">– Ligne</button><button class="btn sm" data-t="dc">– Colonne</button><button class="btn sm" data-t="m">Fusionner</button><button class="btn sm" data-t="s">Scinder</button><button class="btn sm" data-t="g">Griser</button><button class="btn sm" data-t="d" title="Remplir les cellules sélectionnées avec des dates">📅 Dates auto</button></div>';
function clean(h){return h.replace(/class="([^"]*)"/g,function(m,v){v=v.split(/\s+/).filter(function(x){return x&&x!='ms'}).join(' ');return v?'class="'+v+'"':''})}
function tabHtml(cols,rows){return '<table class="w"><thead><tr>'+cols.map(function(c){return '<th contenteditable>'+c+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td contenteditable'+(c.g?' class="g"':'')+'>'+c.t+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table>'}
function tabify(p){if(p.cols){p.tab=tabHtml(p.cols,p.rows);delete p.cols;delete p.rows}return p}
function subjOf(p){if(!p||!p.tab)return SUBJ;var d=document.createElement('div');d.innerHTML=p.tab;var r=[].map.call(d.querySelectorAll('tbody tr'),function(x){return x.cells[0]?x.cells[0].innerHTML:''});return r.length?r:SUBJ}
