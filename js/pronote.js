/* Onglet Pronote : emploi du temps de la semaine, devoirs, notes et moyennes.
   Source : le calendrier iCal que Pronote publie (lien ou fichier .ics) + saisies à la main.
   Tout est stocké dans D.pro : chiffré et synchronisé comme le reste du carnet.
   Pronote ne donne PAS ici : notes, absences, messagerie, vie scolaire (voir « Réglages »). */

var PV={tab:'home',off:0,hw:'todo',busy:false,msg:''};
function PR(){return D.pro||(D.pro={})}
function touchPR(){PR().u=Date.now();save()}

/* ---------- dates ---------- */
function hm(ms){return new Date(ms).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
function dmy(ms){return new Date(ms).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}
function dayStart(d){var x=new Date(d);x.setHours(0,0,0,0);return x}
function weekStart(d){var x=dayStart(d);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
function sameDay(a,b){return dayStart(a).getTime()==dayStart(b).getTime()}
function fr(v){return String(Math.round(v*100)/100).replace('.',',')}
/* Les descriptions Pronote sont parfois du HTML brut : on les convertit en texte lisible. */
function plainText(v){
  var t=String(v==null?'':v);
  t=t.replace(/<br\s*\/?\s*>/gi,'\n')
     .replace(/<\/(?:div|p|li|tr|h[1-6])\s*>/gi,'\n')
     .replace(/<li\b[^>]*>/gi,'• ')
     .replace(/<[^>]*>/g,' ')
     .replace(/[ \t]+/g,' ')
     .replace(/\n\s*\n+/g,'\n')
     .trim();
  var box=document.createElement('textarea');
  box.innerHTML=t;
  return (box.value||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
}
function toNum(v){var n=parseFloat(String(v).replace(',','.').replace(/\s/g,''));return isNaN(n)?null:n}
function isoDay(ms){var d=new Date(ms);return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}

/* ---------- lecture d'un calendrier iCal (.ics) ---------- */
function icsUnfold(t){return t.replace(/\r\n/g,'\n').replace(/\r/g,'\n').replace(/\n[ \t]/g,'')}
function icsUnesc(s){return (s||'').replace(/\\n/gi,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\')}
function icsDate(v){                                   // 20261109T080000Z | 20261109T080000 | 20261109
  var m=/^(\d{4})(\d\d)(\d\d)(?:T(\d\d)(\d\d)(\d\d)?(Z)?)?$/.exec(v.trim());
  if(!m)return null;
  if(!m[4])return {ms:new Date(+m[1],m[2]-1,+m[3]).getTime(),allDay:true};
  var s=+(m[6]||0);
  return {ms:m[7]?Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5],s):new Date(+m[1],m[2]-1,+m[3],+m[4],+m[5],s).getTime()};
}
function parseICS(text){
  var out=[],ev=null;
  icsUnfold(text).split('\n').forEach(function(line){
    if(line=='BEGIN:VEVENT'){ev={};return}
    if(line=='END:VEVENT'){
      if(ev&&ev.s){
        if(!ev.e)ev.e=ev.allDay?ev.s+864e5:ev.s+36e5;
        var cancelled=ev.status=='CANCELLED'||/annul|prof\.?\s*absent|absent/i.test(ev.sum||'');
        out.push({id:ev.uid||(ev.s+'-'+(ev.sum||'')),s:ev.s,e:ev.e,sum:ev.sum||'(sans titre)',loc:ev.loc||'',desc:ev.desc||'',cancel:cancelled,allDay:!!ev.allDay});
      }
      ev=null;return;
    }
    if(!ev)return;
    var i=line.indexOf(':');if(i<0)return;
    var name=line.slice(0,i).split(';')[0].toUpperCase(),val=line.slice(i+1),d;
    if(name=='DTSTART'){d=icsDate(val);if(d){ev.s=d.ms;ev.allDay=d.allDay}}
    else if(name=='DTEND'){d=icsDate(val);if(d)ev.e=d.ms}
    else if(name=='SUMMARY')ev.sum=icsUnesc(val);
    else if(name=='LOCATION')ev.loc=icsUnesc(val);
    else if(name=='DESCRIPTION')ev.desc=icsUnesc(val);
    else if(name=='STATUS')ev.status=val.trim().toUpperCase();
    else if(name=='UID')ev.uid=val.trim();
  });
  return out;
}
/* « Devoirs : … » / « Travail à faire : … » dans la description d'une séance (si l'établissement les publie) */
function hwFrom(e){
  var m=/(?:^|\n)\s*(?:devoirs?|travail\s+à\s+faire|à\s+faire)\s*[:\-–]\s*([\s\S]+?)(?:\n\s*\n|$)/i.exec(e.desc||'');
  return m?m[1].trim():'';
}
function importICS(text){
  var all=parseICS(text),now=Date.now(),
      keep=all.filter(function(e){return e.e>=now-14*864e5&&e.s<=now+150*864e5});   // on garde 2 semaines passées, 5 mois à venir
  if(!all.length){toast('Aucun cours trouvé : ce n’est pas un calendrier iCal valide.');return false}
  var p=PR();p.events=keep;p.fetched=now;touchPR();
  toast(keep.length+' cours importés.');
  return true;
}

/* ---------- actualisation depuis le lien ---------- */
async function refreshPro(silent){
  if(typeof pnLinked=='function'&&pnLinked())return pnRefresh(silent);
  var p=PR();
  if(!p.url){if(!silent)toast('Ajoute d’abord ton lien iCal dans ⚙ Réglages.');return}
  if(PV.busy)return;
  PV.busy=true;PV.msg='Actualisation…';paintPro();
  try{
    var ctl=new AbortController(),to=setTimeout(function(){ctl.abort()},15000),
        url=p.url.trim().replace(/^webcal:/i,'https:').replace(/^http:/i,'https:');
    var r=await fetch(url,{signal:ctl.signal,cache:'no-store'});
    clearTimeout(to);
    if(!r.ok)throw new Error('HTTP '+r.status);
    if(importICS(await r.text()))PV.msg='';
  }catch(e){
    PV.msg='⚠ Lien non lisible depuis le navigateur';
    if(!silent)openBlocked(e);
  }
  PV.busy=false;paintPro();
}
function openBlocked(e){
  openModal('Le navigateur a bloqué le lien',
    '<p style="margin:0 0 8px">Pronote n’autorise pas la lecture directe de son calendrier depuis un autre site (protection du navigateur, ou lien incorrect). <b>Ce n’est pas un bug de ton carnet.</b></p>'+
    '<p style="margin:0 0 8px">Deux solutions :</p><ol style="margin:0 0 10px;padding-left:20px;line-height:1.6">'+
    '<li><b>Importer le fichier</b> : ouvre ton lien iCal dans un autre onglet (le fichier .ics se télécharge), puis choisis-le avec « Importer un fichier .ics » dans ⚙ Réglages.</li>'+
    '<li><b>Mise à jour automatique</b> par ton dépôt GitHub : dis-moi si tu veux que je te prépare le petit programme planifié.</li></ol>'+
    '<div class="row"><button class="btn" data-pr="gofile" style="border-color:var(--accent)">Importer un fichier .ics</button></div>'+
    '<p style="margin:10px 0 0;color:var(--muted);font-size:12px">Détail technique : '+esc(e&&e.message?e.message:String(e))+'</p>',
    function(ev){var b=ev.target.closest('[data-pr]');if(b)proAct(b)});
}

/* ---------- devoirs ---------- */
function allHw(){
  var p=PR(),out=[];
  (p.events||[]).forEach(function(e){
    var t=hwFrom(e);
    if(t)out.push({id:'ics-'+e.id,subject:e.sum,text:t,due:e.s,src:'Pronote',done:!!(p.hwdone&&p.hwdone['ics-'+e.id])});
  });
  (p.pnhw||[]).forEach(function(h){out.push({id:h.id,subject:h.subject,text:h.text,due:h.due,src:'Pronote',done:!!h.done||!!(p.hwdone&&p.hwdone[h.id])})});
  (p.hw||[]).forEach(function(h){out.push({id:h.id,subject:h.subject,text:h.text,due:h.due,src:'manuel',done:!!h.done,manual:true})});
  return out;
}
function setHwDone(id,on){
  var p=PR(),h=(p.hw||[]).filter(function(x){return x.id==id})[0];
  if(h){h.done=on;h.u=Date.now()}
  else{p.hwdone=p.hwdone||{};p.hwdone[id]=on}
  touchPR();
}
function openHw(){
  openModal('Ajouter un devoir',
    '<label>Matière</label><input id="hs" autocomplete="off"><label>À faire</label><input id="ht" autocomplete="off">'+
    '<label>Pour le</label><input id="hd" type="date" value="'+isoDay(Date.now()+864e5)+'">'+
    '<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-pr="hwsave" style="border-color:var(--accent)">Ajouter</button></div>',
    function(ev){var b=ev.target.closest('[data-pr]');if(b)proAct(b)});
}

/* ---------- notes ---------- */
function allGrades(){return (PR().grades||[]).concat(PR().pngr||[])}
function subjects(){
  var s={};allGrades().forEach(function(g){s[g.subject]=1});
  return Object.keys(s).sort(function(a,b){return a.localeCompare(b,'fr')});
}
function avgOf(list){
  var num=0,den=0;
  list.forEach(function(g){var c=g.coef>0?g.coef:1;num+=g.value/g.max*20*c;den+=c});
  return den?num/den:null;
}
function generalAvg(){
  var p=PR(),num=0,den=0;
  subjects().forEach(function(s){
    var a=avgOf(allGrades().filter(function(g){return g.subject==s})),c=(p.coefs&&p.coefs[s])||1;
    if(a!==null){num+=a*c;den+=c}
  });
  return den?num/den:null;
}
function gcolor(v){return v<8?'#e53935':v<10?'#fb8c00':'#43a047'}
function spark(list){
  var v=list.slice().sort(function(a,b){return a.date<b.date?-1:1}).map(function(g){return g.value/g.max*20});
  if(v.length<2)return '';
  var w=70,h=22,pts=v.map(function(x,i){return Math.round(i*w/(v.length-1))+','+Math.round(h-x/20*h)}).join(' ');
  return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><polyline points="'+pts+'" fill="none" stroke="var(--accent)" stroke-width="2"/></svg>';
}
function openGrade(id){
  var p=PR(),g=id?(p.grades||[]).filter(function(x){return x.id==id})[0]:null;
  openModal(g?'Modifier la note':'Ajouter une note',
    '<label>Matière</label><input id="gs" list="gsl" autocomplete="off" value="'+qa(g?g.subject:'')+'"><datalist id="gsl">'+subjects().map(function(s){return '<option value="'+qa(s)+'">'}).join('')+'</datalist>'+
    '<div class="row"><div><label>Note</label><input id="gv" inputmode="decimal" value="'+(g?g.value:'')+'"></div><div><label>Sur</label><input id="gm" inputmode="decimal" value="'+(g?g.max:20)+'"></div><div><label>Coef.</label><input id="gc" inputmode="decimal" value="'+(g?g.coef:1)+'"></div></div>'+
    '<div class="row"><div><label>Date</label><input id="gd" type="date" value="'+(g?g.date:isoDay(Date.now()))+'"></div><div style="flex:2"><label>Libellé (facultatif)</label><input id="gl" value="'+qa(g?g.label||'':'')+'"></div></div>'+
    '<div class="row" style="margin-top:12px;justify-content:flex-end">'+(g?'<button class="btn" data-pr="gdel" data-id="'+g.id+'">Supprimer</button>':'')+
    '<button class="btn" data-pr="gsave" data-id="'+(g?g.id:'')+'" style="border-color:var(--accent)">Enregistrer</button></div>',
    function(ev){var b=ev.target.closest('[data-pr]');if(b)proAct(b)});
}
function openCoefs(){
  var p=PR();
  openModal('Coefficients des matières',
    (subjects().map(function(s){return '<div class="mrow"><div class="mi">'+esc(s)+'</div><input data-cf="'+qa(s)+'" inputmode="decimal" value="'+((p.coefs&&p.coefs[s])||1)+'" style="width:80px"></div>'}).join('')||'<p>Ajoute d’abord des notes.</p>')+
    '<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-pr="coefsave" style="border-color:var(--accent)">Enregistrer</button></div>',
    function(ev){var b=ev.target.closest('[data-pr]');if(b)proAct(b)});
}
function openGradeImport(){
  openModal('Importer des notes',
    '<p style="margin:0 0 6px;color:var(--muted);font-size:13px">Une note par ligne : <code>Matière ; note ; sur ; coef ; date ; libellé</code> (sur, coef, date et libellé facultatifs). Tu peux coller un tableau copié depuis un tableur.</p>'+
    '<textarea id="gimp" rows="8" placeholder="Maths ; 14,5 ; 20 ; 3 ; 2026-11-05 ; DS 1"></textarea>'+
    '<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn" data-pr="gimport" style="border-color:var(--accent)">Importer</button></div>',
    function(ev){var b=ev.target.closest('[data-pr]');if(b)proAct(b)});
}
function importGrades(text){
  var p=PR(),n=0;p.grades=p.grades||[];
  text.split('\n').forEach(function(line){
    var c=line.split(/[;\t|]/).map(function(x){return x.trim()});
    if(c.length<2)return;
    var v=toNum(c[1]);if(v===null||!c[0])return;
    var d=/^\d{4}-\d\d-\d\d$/.test(c[4]||'')?c[4]:isoDay(Date.now());
    p.grades.push({id:uid(),subject:c[0],value:v,max:toNum(c[2])||20,coef:toNum(c[3])||1,date:d,label:c[5]||'',u:Date.now()});n++;
  });
  if(n)touchPR();
  return n;
}

/* ---------- actions (clics) ---------- */
function proAct(b){
  if(typeof pnAct=='function'&&pnAct(b))return;
  var a=b.dataset.pr,id=b.dataset.id,p=PR();
  if(a=='tab'){PV.tab=b.dataset.v;paintPro();return}
  if(a=='prev'||a=='next'||a=='today'){PV.off=a=='today'?0:PV.off+(a=='next'?1:-1);paintPro();return}
  if(a=='refresh'){refreshPro(false);return}
  if(a=='hwf'){PV.hw=b.dataset.v;paintPro();return}
  if(a=='hwtoggle'){setHwDone(id,!!b.checked);paintPro();return}
  if(a=='hwadd'){openHw();return}
  if(a=='hwdel'){p.hw=(p.hw||[]).filter(function(h){return h.id!=id});touchPR();paintPro();return}
  if(a=='hwsave'){
    var s=$('hs').value.trim(),t=$('ht').value.trim();
    if(!t){toast('Écris ce qu’il y a à faire.');return}
    p.hw=p.hw||[];p.hw.push({id:uid(),subject:s||'Divers',text:t,due:new Date($('hd').value+'T12:00:00').getTime()||Date.now(),done:false,u:Date.now()});
    touchPR();closeModal();paintPro();return;
  }
  if(a=='gadd'){openGrade('');return}
  if(a=='gedit'){openGrade(id);return}
  if(a=='gdel'){p.grades=(p.grades||[]).filter(function(g){return g.id!=id});touchPR();closeModal();paintPro();return}
  if(a=='gsave'){
    var sub=$('gs').value.trim(),v=toNum($('gv').value),mx=toNum($('gm').value)||20,cf=toNum($('gc').value);
    if(!sub||v===null){toast('Matière et note obligatoires.');return}
    p.grades=p.grades||[];
    var g=id?p.grades.filter(function(x){return x.id==id})[0]:null;
    if(!g){g={id:uid()};p.grades.push(g)}
    Object.assign(g,{subject:sub,value:v,max:mx,coef:cf===null?1:cf,date:$('gd').value||isoDay(Date.now()),label:$('gl').value.trim(),u:Date.now()});
    touchPR();closeModal();paintPro();return;
  }
  if(a=='gcoefs'){openCoefs();return}
  if(a=='coefsave'){
    p.coefs=p.coefs||{};
    [].forEach.call(document.querySelectorAll('#mdB [data-cf]'),function(i){var c=toNum(i.value);p.coefs[i.dataset.cf]=c>0?c:1});
    touchPR();closeModal();paintPro();return;
  }
  if(a=='gimp'){openGradeImport();return}
  if(a=='gimport'){var n=importGrades($('gimp').value);toast(n?n+' note'+(n>1?'s':'')+' importée'+(n>1?'s':'')+'.':'Aucune ligne reconnue.');if(n){closeModal();paintPro()}return}
  if(a=='setsave'){
    p.url=$('pru').value.trim();p.home=$('prh').value.trim();touchPR();
    toast('Réglages enregistrés.');
    if(p.url)refreshPro(false);else paintPro();
    return;
  }
  if(a=='eye'){var i=$('pru');i.type=i.type=='password'?'text':'password';return}
  if(a=='gofile'){closeModal();$('prf').click();return}
  if(a=='icstxt'){var t=$('prt').value;if(t.trim()&&importICS(t)){$('prt').value='';paintPro()}return}
  if(a=='clear'){conf('Effacer toutes les données Pronote (cours, devoirs, notes, lien) ?',function(){D.pro={u:Date.now()};save();paintPro()});return}
}

/* ---------- affichage ---------- */
function emptyHtml(t,x){return '<div class="prempty"><div style="font-size:34px">🎓</div><b>'+t+'</b><p>'+x+'</p><button class="btn" data-pr="tab" data-v="set" style="border-color:var(--accent)">⚙ Ouvrir les réglages</button></div>'}
function lessonGapHtml(prev,next){
  var mins=Math.round((next.s-prev.e)/60000);
  if(mins<15)return '';
  var start=new Date(prev.e),end=new Date(next.s),mid=(start.getHours()*60+start.getMinutes()+end.getHours()*60+end.getMinutes())/2;
  var lunch=mins>=35&&mid>=11*60&&mid<=14*60+30;
  var label=lunch?'Pause déjeuner':(mins>=60?'Temps libre':'Pause');
  var duration=mins>=60?Math.floor(mins/60)+' h'+(mins%60?' '+mins%60+' min':''):mins+' min';
  return '<div class="pgap '+(lunch?'lunch':'')+'"><span class="pgapicon">'+(lunch?'🍽':'☕')+'</span><span class="pgapbody"><b>'+label+'</b><small>'+hm(prev.e)+' – '+hm(next.s)+'</small></span><strong>'+duration+'</strong></div>';
}
function daySummary(list){
  var valid=list.filter(function(e){return !e.cancel&&!e.allDay}),mins=valid.reduce(function(n,e){return n+Math.max(0,e.e-e.s)/60000},0);
  return valid.length+' cours · '+(mins>=60?Math.floor(mins/60)+' h'+(Math.round(mins%60)?' '+Math.round(mins%60)+' min':''):Math.round(mins)+' min');
}
function homeHtml(){
  var p=PR(),events=(p.events||[]).filter(function(e){return !e.cancel}).sort(function(a,b){return a.s-b.s}),now=Date.now(),today=events.filter(function(e){return sameDay(e.s,now)}),next=events.filter(function(e){return e.e>now})[0],todo=allHw().filter(function(h){return !h.done}).sort(function(a,b){return a.due-b.due}),gen=generalAvg(),last=p.fetched?new Date(p.fetched).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'Jamais';
  var nextCard=next?'<div class="dash-next"><div class="dash-kicker">'+(next.s<=now?'COURS EN COURS':'PROCHAIN COURS')+'</div><div class="dash-time">'+hm(next.s)+' – '+hm(next.e)+'</div><h3>'+esc(next.sum)+'</h3><div class="pl">'+(next.loc?'📍 '+esc(next.loc):'')+'</div></div>':'<div class="dash-next"><div class="dash-kicker">PROCHAIN COURS</div><h3>Aucun cours à venir</h3><div class="pl">Profite de ton temps libre !</div></div>';
  return '<div class="dashhead"><div><div class="dash-kicker">TON ESPACE SCOLAIRE</div><h2>Bonjour Jordann 👋</h2><div class="prs">Voici ton résumé scolaire.</div></div><button class="btn" data-pr="refresh">↻ Synchroniser</button></div>'+nextCard+
  '<div class="dashstats"><div class="dashstat"><span>📅</span><b>'+today.length+'</b><small>Cours aujourd’hui</small></div><div class="dashstat"><span>📚</span><b>'+todo.length+'</b><small>Devoirs à faire</small></div><div class="dashstat"><span>📊</span><b>'+(gen===null?'—':fr(gen)+'/20')+'</b><small>Moyenne calculée</small></div><div class="dashstat"><span>🔄</span><b class="dashdate">'+esc(last)+'</b><small>Dernière synchro</small></div></div>'+
  '<div class="dashcols"><section class="dashpanel"><div class="dashpanelhead"><h3>📅 Aujourd’hui</h3><button class="link" data-pr="tab" data-v="week">Voir l’agenda →</button></div>'+(today.length?today.map(function(e,i){return (i?lessonGapHtml(today[i-1],e):'')+'<div class="dashlesson"><small>'+hm(e.s)+' – '+hm(e.e)+'</small><b>'+esc(e.sum)+'</b><span>'+ (e.loc?'📍 '+esc(e.loc):'')+'</span></div>'}).join(''):'<p class="prhelp">Aucun cours prévu aujourd’hui.</p>')+'</section>'+
  '<section class="dashpanel"><div class="dashpanelhead"><h3>📚 À ne pas oublier</h3><button class="link" data-pr="tab" data-v="hw">Tous les devoirs →</button></div>'+(todo.length?todo.slice(0,5).map(function(h){return '<div class="dashhw"><b>'+esc(h.subject)+'</b><span>'+esc(plainText(h.text))+'</span><small>'+new Date(h.due).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})+'</small></div>'}).join(''):'<p class="prhelp">Aucun devoir en attente 🎉</p>')+'</section></div>'+
  '<div class="dashfoot"><span class="syncdot"></span> Synchronisation automatique toutes les 15 minutes lorsque Carnet est ouvert. <button class="link" data-pr="tab" data-v="set">Réglages</button></div>';
}
function weekHtml(){
  var p=PR(),ev=p.events||[];
  if(!ev.length)return emptyHtml('Aucun emploi du temps pour l’instant','Connecte-toi à Pronote dans ⚙ Réglages pour récupérer tes cours.');
  var mon=weekStart(new Date());mon.setDate(mon.getDate()+7*PV.off);
  var days=[],i,now=Date.now();
  for(i=0;i<7;i++){var d=new Date(mon);d.setDate(mon.getDate()+i);days.push(d)}
  var per=days.map(function(d){return ev.filter(function(e){return e.s<dayStart(d).getTime()+864e5&&e.e>dayStart(d).getTime()}).sort(function(a,b){return a.s-b.s})});
  var upto=per[5].length||per[6].length?7:5;
  var cur=ev.filter(function(e){return !e.cancel&&e.s<=now&&now<e.e})[0],nxt=ev.filter(function(e){return !e.cancel&&e.s>now}).sort(function(a,b){return a.s-b.s})[0];
  var banner=cur?'<div class="prnext now">🟢 En cours : <b>'+esc(cur.sum)+'</b>'+(cur.loc?' · '+esc(cur.loc):'')+' · jusqu’à '+hm(cur.e)+'</div>':nxt?'<div class="prnext">⏭ Prochain cours : <b>'+esc(nxt.sum)+'</b>'+(nxt.loc?' · '+esc(nxt.loc):'')+' · '+(sameDay(nxt.s,now)?'aujourd’hui':'le '+dmy(nxt.s))+' à '+hm(nxt.s)+'</div>':'';
  var head=PV.off==0?'Cette semaine':(PV.off==1?'Semaine prochaine':PV.off==-1?'Semaine dernière':'');
  return banner+'<div class="prnav weeknav"><div><div class="dash-kicker">PLANNING SCOLAIRE</div><b>'+head+' <span style="color:var(--muted);font-weight:400">· du '+dmy(mon.getTime())+' au '+dmy(days[upto-1].getTime())+'</span></b></div><span style="flex:1"></span><button class="btn sm" data-pr="prev">‹</button><button class="btn sm" data-pr="today">Aujourd’hui</button><button class="btn sm" data-pr="next">›</button></div>'+
  '<div class="pweek modern-week" style="--cols:'+upto+'">'+days.slice(0,upto).map(function(d,k){
    var list=per[k],valid=list.filter(function(e){return !e.cancel&&!e.allDay}),duration=valid.reduce(function(n,e){return n+Math.max(0,e.e-e.s)/60000},0),items='';
    list.forEach(function(e,j){if(j&&list[j-1].e<e.s&&!list[j-1].allDay&&!e.allDay)items+=lessonGapHtml(list[j-1],e);
      var hw=hwFrom(e),ongoing=e.s<=now&&now<e.e;
      items+='<article class="pe modern-pe'+(e.cancel?' cancel':'')+(ongoing?' now':'')+'"><div class="pe-top"><span class="pt">'+(e.allDay?'Toute la journée':hm(e.s)+' – '+hm(e.e))+'</span>'+(ongoing?'<span class="live-pill">EN COURS</span>':'')+'</div><div class="ps">'+esc(e.sum)+'</div>'+(e.loc?'<div class="pl">📍 '+esc(e.loc)+'</div>':'')+(e.cancel?'<div class="pl">⛔ Cours annulé</div>':'')+(hw?'<div class="pl">📚 '+esc(hw.slice(0,90))+'</div>':'')+(e.desc&&!hw?'<details><summary>Voir les détails</summary><div class="pl" style="white-space:pre-wrap">'+esc(e.desc)+'</div></details>':'')+'</article>';
    });
    return '<section class="pday modern-day'+(sameDay(d,now)?' today':'')+'"><header class="pdh"><span>'+['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'][k]+'</span><b>'+d.getDate()+'</b></header><div class="daymeta">'+(list.length?list.length+' cours · '+Math.floor(duration/60)+' h'+(Math.round(duration%60)?' '+Math.round(duration%60)+' min':''):'Journée libre')+'</div><div class="dayevents">'+(items||'<div class="day-empty">Aucun cours prévu ✨</div>')+'</div></section>';
  }).join('')+'</div><div class="agenda-legend"><span><i class="legend-course"></i> Cours</span><span><i class="legend-break"></i> Pause calculée entre deux cours</span><span>Les pauses sont estimées à partir des horaires des cours.</span></div>';
}
function hwHtml(){
  var list=allHw(),today=dayStart(new Date()).getTime(),f=PV.hw;
  list=list.filter(function(h){return f=='all'||(f=='todo'?!h.done:h.done)}).sort(function(a,b){return a.due-b.due});
  var todo=list.filter(function(h){return !h.done}),done=list.filter(function(h){return h.done});
  function card(h){
    var late=!h.done&&h.due<today,txt=plainText(h.text);
    return '<article class="hw-card'+(h.done?' is-done':'')+(late?' is-late':'')+'">'+
      '<label class="hw-check"><input type="checkbox" data-pr="hwtoggle" data-id="'+qa(h.id)+'"'+(h.done?' checked':'')+'><span class="hw-checkmark"></span></label>'+
      '<div class="hw-content"><div class="hw-title">'+esc(h.subject||'Devoir')+'</div>'+
      (txt?'<p class="hw-text">'+esc(txt)+'</p>':'')+
      '<div class="hw-meta"><span class="hw-date">'+(h.src=='Pronote'?'📅 ':'📝 ')+new Date(h.due).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})+'</span>'+
      (late?'<span class="hw-badge late">En retard</span>':'')+(h.src=='Pronote'?'<span class="hw-badge">Pronote</span>':'<span class="hw-badge personal">Personnel</span>')+'</div></div>'+
      (h.manual?'<button class="btn sm hw-delete" data-pr="hwdel" data-id="'+qa(h.id)+'" title="Supprimer ce devoir" aria-label="Supprimer">×</button>':'')+
      '</article>';
  }
  var content='';
  if(f=='todo'||f=='all'){
    content+='<section class="hw-group"><div class="hw-group-head"><h3>À faire</h3><span>'+todo.length+'</span></div>'+
      (todo.length?todo.map(card).join(''):'<div class="hw-empty">🎉 Aucun devoir en attente.</div>')+'</section>';
  }
  if(f=='done'||f=='all'){
    content+='<section class="hw-group"><div class="hw-group-head"><h3>Terminés</h3><span>'+done.length+'</span></div>'+
      (done.length?done.map(card).join(''):'<div class="hw-empty">Les devoirs terminés apparaîtront ici.</div>')+'</section>';
  }
  return '<div class="hw-toolbar"><div class="hw-filters">'+
    '<button class="btn sm'+(f=='todo'?' on':'')+'" data-pr="hwf" data-v="todo">À faire</button>'+
    '<button class="btn sm'+(f=='done'?' on':'')+'" data-pr="hwf" data-v="done">Terminés</button>'+
    '<button class="btn sm'+(f=='all'?' on':'')+'" data-pr="hwf" data-v="all">Tous</button></div>'+
    '<button class="btn" data-pr="hwadd" style="border-color:var(--accent)">＋ Ajouter un devoir</button></div>'+
    '<div class="hw-summary"><b>'+todo.length+'</b> devoir'+(todo.length>1?'s':'')+' restant'+(todo.length>1?'s':'')+
    (todo.some(function(h){return h.due<today})?' · <span class="hw-overdue">'+todo.filter(function(h){return h.due<today}).length+' en retard</span>':'')+'</div>'+
    (content||'<div class="hw-empty">Aucun devoir à afficher.</div>');
}
function notesHtml(){
  var p=PR(),subs=subjects(),gen=generalAvg(),all=allGrades();
  if(!subs.length)return '<div class="prempty"><div style="font-size:34px">📊</div><b>Aucune note pour le moment</b><p>Ajoute une note ou importe un tableau pour suivre tes résultats.</p>'+
    '<div class="row" style="justify-content:center"><button class="btn" data-pr="gadd" style="border-color:var(--accent)">＋ Ajouter une note</button><button class="btn" data-pr="gimp">Importer des notes</button></div></div>';
  return '<div class="grades-top"><div class="grades-average"><span class="grades-average-label">MOYENNE GÉNÉRALE</span><strong>'+fr(gen)+'</strong><span>/ 20</span></div>'+
    '<div class="grades-actions"><button class="btn sm" data-pr="gcoefs">Coefficients</button><button class="btn sm" data-pr="gimp">Importer</button><button class="btn" data-pr="gadd" style="border-color:var(--accent)">＋ Ajouter une note</button></div></div>'+
    '<div class="grades-caption">'+all.length+' note'+(all.length>1?'s':'')+' répartie'+(all.length>1?'s':'')+' dans '+subs.length+' matière'+(subs.length>1?'s':'')+'</div>'+
    '<div class="grades-list">'+subs.map(function(sub){
      var gl=all.filter(function(g){return g.subject==sub}),a=avgOf(gl),pa=(p.pnavg||[]).filter(function(x){return x.subject==sub&&x.klass!=null})[0];
      var ordered=gl.slice().sort(function(x,y){return x.date<y.date?1:-1});
      return '<details class="grade-card"><summary><div class="grade-card-main"><div class="grade-subject">'+esc(sub)+'</div>'+
        '<div class="grade-progress"><i style="width:'+Math.max(2,Math.min(100,a/20*100))+'%;background:'+gcolor(a)+'"></i></div>'+
        '<div class="grade-score" style="color:'+gcolor(a)+'">'+fr(a)+'/20</div></div>'+
        '<div class="grade-card-foot">'+gl.length+' note'+(gl.length>1?'s':'')+(pa?' · classe '+fr(pa.klass)+'/20':'')+' <span>Voir le détail⌄</span></div></summary>'+
        '<div class="grade-details">'+ordered.map(function(g){
          return '<div class="grade-item"><div><b>'+fr(g.value)+'/'+g.max+'</b><small>'+new Date(g.date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})+
            (g.label?' · '+esc(g.label):'')+'</small></div><div class="grade-item-right"><span class="grade-coef">coef. '+fr(g.coef||1)+'</span>'+
            (g.src=='pronote'?'<span class="pnb">Pronote</span>':'<button class="btn sm" data-pr="gedit" data-id="'+qa(g.id)+'" title="Modifier cette note">Modifier</button>')+'</div></div>';
        }).join('')+'</div></details>';
    }).join('')+'</div>';
}
function homeUrl(){
  var p=PR(),m=/^(https?:\/\/[^?#]*?\/pronote\/)/i.exec(p.url||'');
  return p.home||(m?m[1]:'');
}
function setHtml(){
  var p=PR();
  return (typeof connHtml=='function'?connHtml():'')+'<div class="pset"><h3>Alternative : lien du calendrier Pronote (iCal)</h3>'+
    '<p class="prhelp">Sur Pronote (espace élève) : <b>Emploi du temps → icône iCal</b> → copie le lien. <b>Ce lien est comme un mot de passe</b> : il est stocké chiffré avec tes notes, ne le partage pas.</p>'+
    '<div class="row"><input id="pru" type="password" autocomplete="off" placeholder="https://…/pronote/ical/Edt_….ics?icalsecurise=…" value="'+qa(p.url||'')+'" style="flex:1"><button class="btn" data-pr="eye" title="Afficher / masquer">👁</button></div>'+
    '<label>Adresse de ton Pronote (pour le raccourci « Ouvrir Pronote », facultatif)</label><input id="prh" autocomplete="off" placeholder="https://…/pronote/" value="'+qa(p.home||'')+'">'+
    '<div class="row" style="margin-top:10px"><button class="btn" data-pr="setsave" style="border-color:var(--accent)">Enregistrer et actualiser</button></div>'+
    (p.fetched?'<p class="prhelp">Dernière mise à jour : '+new Date(p.fetched).toLocaleString('fr-FR')+' · '+(p.events||[]).length+' cours</p>':'')+
    '<h3>Importer le calendrier à la main</h3><p class="prhelp">Si le lien direct est bloqué par le navigateur : télécharge le fichier .ics depuis ton lien, puis importe-le (à refaire pour mettre à jour).</p>'+
    '<div class="row"><button class="btn" data-pr="gofile">📂 Importer un fichier .ics</button></div>'+
    '<textarea id="prt" rows="3" placeholder="…ou colle ici le contenu du fichier .ics" style="margin-top:8px"></textarea><div class="row" style="margin-top:6px"><button class="btn sm" data-pr="icstxt">Importer le texte collé</button></div>'+
    '<h3>Ce que Pronote permet de récupérer</h3><ul class="prhelp"><li>✅ <b>Cours</b>, salles, <b>annulations</b>, changements de dernière minute</li><li>✅ <b>Devoirs / cahier de textes</b> si ton établissement les publie dans le calendrier</li>'+
    '<li>✋ <b>Notes</b> : ajoute-les ici (saisie ou import) pour avoir moyennes et courbes</li><li>❌ Absences, messagerie, vie scolaire, bulletins : non disponibles hors de Pronote'+(homeUrl()?' — <a href="'+qa(homeUrl())+'" target="_blank" rel="noopener">↗ ouvrir Pronote</a>':'')+'</li></ul>'+
    '<h3>Données</h3><div class="row"><button class="btn sm" data-pr="clear">🗑 Effacer les données Pronote</button></div></div>';
}
function paintPro(){
  var el=$('pro');
  if(!el||!document.body.classList.contains('pro')||!D)return;
  var p=PR(),sc=el.scrollTop,h=homeUrl(),
      tabs=[['home','⌂ Accueil'],['week','📅 Agenda'],['hw','📚 Devoirs'],['notes','📊 Notes'],['set','⚙ Réglages']],
      body=PV.tab=='home'?homeHtml():PV.tab=='week'?weekHtml():PV.tab=='hw'?hwHtml():PV.tab=='notes'?notesHtml():setHtml(),
      st=PV.msg||(p.fetched?'mis à jour '+new Date(p.fetched).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'');
  el.innerHTML='<div class="prh"><h2>🎓 Pronote</h2><span class="prs">'+esc(st)+'</span><span style="flex:1"></span>'+
    (h?'<a class="btn sm" href="'+qa(h)+'" target="_blank" rel="noopener">↗ Pronote</a>':'')+
    '<button class="btn sm" data-pr="refresh" title="Relire le calendrier">↻ Actualiser</button></div>'+
    '<div class="prt">'+tabs.map(function(t){return '<button class="'+(PV.tab==t[0]?'on':'')+'" data-pr="tab" data-v="'+t[0]+'">'+t[1]+'</button>'}).join('')+'</div>'+
    '<div class="prb">'+body+'</div>';
  el.scrollTop=sc;
}

/* ---------- changement de vue : Carnet ↔ Pronote ---------- */
function setView(v){
  document.body.classList.toggle('pro',v=='pro');
  [].forEach.call(document.querySelectorAll('#vsw button'),function(b){b.classList.toggle('on',b.dataset.v==v)});
  if(v=='pro'){
    try{ser()}catch(e){}
    paintPro();
    var p=PR();
    if((p.url||(typeof pnLinked=='function'&&pnLinked()))&&Date.now()-(p.fetched||0)>20*60e3)refreshPro(true);   // actualisation silencieuse
  }
  try{localStorage.setItem('carnet-view',v)}catch(e){}
}
$('vsw').addEventListener('click',function(e){var b=e.target.closest('[data-v]');if(b)setView(b.dataset.v)});
$('pro').addEventListener('click',function(e){var b=e.target.closest('[data-pr]');if(b&&b.type!='checkbox')proAct(b)});
$('pro').addEventListener('change',function(e){var b=e.target.closest('[data-pr="hwtoggle"]');if(b)proAct(b)});
var prf=document.createElement('input');
prf.type='file';prf.id='prf';prf.accept='.ics,text/calendar';prf.hidden=true;document.body.appendChild(prf);
prf.onchange=function(e){
  var f=e.target.files[0];e.target.value='';if(!f)return;
  var r=new FileReader();r.onload=function(){if(importICS(String(r.result)))paintPro()};r.readAsText(f);
};
ACTIONS.pronote=function(){setView('pro')};
/* Synchronisation périodique : uniquement tant que l'application est ouverte et visible. */
if(!window.__carnetPronoteTimer){
  window.__carnetPronoteTimer=setInterval(function(){
    if(document.visibilityState==='visible'&&typeof pnLinked==='function'&&pnLinked()&&typeof pnRefresh==='function')pnRefresh(true);
  },15*60*1000);
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='visible'&&typeof pnLinked==='function'&&pnLinked()&&Date.now()-(PR().fetched||0)>15*60*1000&&typeof pnRefresh==='function')pnRefresh(true);
  });
}

var viewRestored=false;
POST.push(function(){
  if(viewRestored)return;viewRestored=true;
  var v='note';try{v=localStorage.getItem('carnet-view')||'note'}catch(e){}
  if(v=='pro')setView('pro');
});

/* ---------- synchronisation : fusion des données Pronote entre appareils ---------- */
function newer(b,l,r){return (l.u||0)>=(r.u||0)?l:r}
function mergePro(b,l,r){
  var o=Object.assign({},(l.u||0)>=(r.u||0)?l:r),lf=(l.fetched||0)>=(r.fetched||0)?l:r;
  o.events=lf.events||[];o.fetched=Math.max(l.fetched||0,r.fetched||0);
  ['pnhw','pngr','pnavg','pnuser','pnLinked','conn'].forEach(function(k){if(lf[k]!==undefined)o[k]=lf[k];else if(l[k]!==undefined)o[k]=l[k];else o[k]=r[k]});
  o.grades=mArr(b.grades||[],l.grades||[],r.grades||[],newer);
  o.hw=mArr(b.hw||[],l.hw||[],r.hw||[],newer);
  o.hwdone=Object.assign({},r.hwdone||{},l.hwdone||{});
  o.coefs=Object.assign({},r.coefs||{},l.coefs||{});
  return o;
}


/* Actualisation automatique : toutes les 15 min tant que l'application est ouverte.
   Les navigateurs suspendent les onglets en arrière-plan : on rattrape à la reprise. */
var PR_AUTO_MS=15*60*1000;
function prAutoRefresh(){
  if(document.hidden||PN.busy)return;
  var p=PR();
  if(typeof pnLinked=='function'&&pnLinked()&&Date.now()-(p.fetched||0)>=PR_AUTO_MS)pnRefresh(true);
}
setInterval(prAutoRefresh,60*1000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(prAutoRefresh,1200)});
window.addEventListener('focus',function(){setTimeout(prAutoRefresh,1200)});
