/* Onglet Pronote : emploi du temps de la semaine, devoirs, notes et moyennes.
   Source : le calendrier iCal que Pronote publie (lien ou fichier .ics) + saisies à la main.
   Tout est stocké dans D.pro : chiffré et synchronisé comme le reste du carnet.
   Pronote ne donne PAS ici : notes, absences, messagerie, vie scolaire (voir « Réglages »). */

var PV={tab:'week',off:0,hw:'todo',busy:false,msg:''};
function PR(){return D.pro||(D.pro={})}
function touchPR(){PR().u=Date.now();save()}

/* ---------- dates ---------- */
function hm(ms){return new Date(ms).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
function dmy(ms){return new Date(ms).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}
function dayStart(d){var x=new Date(d);x.setHours(0,0,0,0);return x}
function weekStart(d){var x=dayStart(d);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
function sameDay(a,b){return dayStart(a).getTime()==dayStart(b).getTime()}
function fr(v){return String(Math.round(v*100)/100).replace('.',',')}
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
function subjects(){
  var s={};(PR().grades||[]).forEach(function(g){s[g.subject]=1});
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
    var a=avgOf((p.grades||[]).filter(function(g){return g.subject==s})),c=(p.coefs&&p.coefs[s])||1;
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
function weekHtml(){
  var p=PR(),ev=p.events||[];
  if(!ev.length)return emptyHtml('Aucun emploi du temps pour l’instant','Colle ton lien iCal Pronote (ou importe le fichier .ics) dans les réglages.');
  var mon=weekStart(new Date());mon.setDate(mon.getDate()+7*PV.off);
  var days=[],i,now=Date.now();
  for(i=0;i<7;i++){var d=new Date(mon);d.setDate(mon.getDate()+i);days.push(d)}
  var per=days.map(function(d){
    return ev.filter(function(e){return e.s<dayStart(d).getTime()+864e5&&e.e>dayStart(d).getTime()}).sort(function(a,b){return a.s-b.s});
  });
  var upto=per[5].length||per[6].length?7:5;
  var cur=ev.filter(function(e){return !e.cancel&&e.s<=now&&now<e.e})[0],
      nxt=ev.filter(function(e){return !e.cancel&&e.s>now}).sort(function(a,b){return a.s-b.s})[0],
      banner=cur?'<div class="prnext now">En cours : <b>'+esc(cur.sum)+'</b>'+(cur.loc?' · '+esc(cur.loc):'')+' · jusqu’à '+hm(cur.e)+'</div>':
              nxt?'<div class="prnext">Prochain cours : <b>'+esc(nxt.sum)+'</b>'+(nxt.loc?' · '+esc(nxt.loc):'')+' · '+(sameDay(nxt.s,now)?'aujourd’hui':'le '+dmy(nxt.s))+' à '+hm(nxt.s)+'</div>':'';
  var head=PV.off==0?'Cette semaine':(PV.off==1?'Semaine prochaine':PV.off==-1?'Semaine dernière':'');
  return banner+'<div class="prnav"><button class="btn sm" data-pr="prev">‹</button><button class="btn sm" data-pr="today">Aujourd’hui</button><button class="btn sm" data-pr="next">›</button>'+
    '<b>'+head+' <span style="color:var(--muted);font-weight:400">du '+dmy(mon.getTime())+' au '+dmy(days[upto-1].getTime())+'</span></b></div>'+
    '<div class="pweek" style="--cols:'+upto+'">'+days.slice(0,upto).map(function(d,k){
      return '<div class="pday'+(sameDay(d,now)?' today':'')+'"><div class="pdh">'+['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'][k]+' '+d.getDate()+'</div>'+
        (per[k].map(function(e){
          var hw=hwFrom(e);
          return '<div class="pe'+(e.cancel?' cancel':'')+(e.s<=now&&now<e.e?' now':'')+'"><div class="pt">'+(e.allDay?'Journée':hm(e.s)+' – '+hm(e.e))+'</div><div class="ps">'+esc(e.sum)+'</div>'+
            (e.loc?'<div class="pl">📍 '+esc(e.loc)+'</div>':'')+(e.cancel?'<div class="pl">⛔ annulé</div>':'')+
            (hw?'<div class="pl">📚 '+esc(hw.slice(0,90))+'</div>':'')+
            (e.desc&&!hw?'<details><summary>détails</summary><div class="pl" style="white-space:pre-wrap">'+esc(e.desc)+'</div></details>':'')+'</div>';
        }).join('')||'<div class="pl" style="padding:6px">—</div>')+'</div>';
    }).join('')+'</div>';
}
function hwHtml(){
  var list=allHw(),today=dayStart(new Date()).getTime(),f=PV.hw;
  list=list.filter(function(h){return f=='all'||(f=='todo'?!h.done:h.done)}).sort(function(a,b){return a.due-b.due});
  return '<div class="prnav"><button class="btn sm'+(f=='todo'?' on':'')+'" data-pr="hwf" data-v="todo">À faire</button><button class="btn sm'+(f=='done'?' on':'')+'" data-pr="hwf" data-v="done">Faits</button>'+
    '<button class="btn sm'+(f=='all'?' on':'')+'" data-pr="hwf" data-v="all">Tous</button><span style="flex:1"></span><button class="btn sm" data-pr="hwadd" style="border-color:var(--accent)">＋ Ajouter un devoir</button></div>'+
    (list.length?list.map(function(h){
      var late=!h.done&&h.due<today;
      return '<div class="mrow'+(h.done?' hwdone':'')+'"><input type="checkbox" data-pr="hwtoggle" data-id="'+qa(h.id)+'"'+(h.done?' checked':'')+' style="width:20px;height:20px">'+
        '<div class="mi"><b>'+esc(h.subject)+'</b> — '+esc(h.text)+'<small'+(late?' style="color:#e53935"':'')+'>'+(h.src=='Pronote'?'séance du ':'pour le ')+new Date(h.due).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})+(late?' · en retard':'')+' · '+h.src+'</small></div>'+
        (h.manual?'<button class="btn sm" data-pr="hwdel" data-id="'+h.id+'" title="Supprimer">✕</button>':'')+'</div>';
    }).join(''):'<div class="prempty"><p>'+(f=='todo'?'Aucun devoir à faire 🎉':'Rien à afficher.')+'<br><span style="color:var(--muted)">Les devoirs de Pronote apparaissent ici s’ils sont publiés dans ton calendrier iCal ; sinon ajoute-les à la main.</span></p></div>');
}
function notesHtml(){
  var p=PR(),subs=subjects(),gen=generalAvg();
  if(!subs.length)return '<div class="prempty"><div style="font-size:34px">📊</div><b>Aucune note</b><p>Pronote ne donne pas les notes au calendrier : ajoute-les à la main ou colle-les en lot.</p>'+
    '<div class="row" style="justify-content:center"><button class="btn" data-pr="gadd" style="border-color:var(--accent)">＋ Ajouter une note</button><button class="btn" data-pr="gimp">Importer…</button></div></div>';
  return '<div class="prnav"><div class="pgen" style="background:'+gcolor(gen)+'">'+fr(gen)+'<small>/20 · moyenne générale</small></div><span style="flex:1"></span>'+
    '<button class="btn sm" data-pr="gcoefs">Coefficients</button><button class="btn sm" data-pr="gimp">Importer…</button><button class="btn sm" data-pr="gadd" style="border-color:var(--accent)">＋ Note</button></div>'+
    subs.map(function(s){
      var gl=p.grades.filter(function(g){return g.subject==s}),a=avgOf(gl);
      return '<details class="psub"><summary><span class="pn">'+esc(s)+'</span><span class="pbar"><i style="width:'+Math.max(2,a/20*100)+'%;background:'+gcolor(a)+'"></i></span><b style="color:'+gcolor(a)+'">'+fr(a)+'</b>'+spark(gl)+'</summary>'+
        gl.slice().sort(function(x,y){return x.date<y.date?1:-1}).map(function(g){
          return '<div class="mrow"><div class="mi"><b>'+fr(g.value)+'/'+g.max+'</b> <small style="display:inline">coef '+g.coef+' · '+new Date(g.date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+(g.label?' · '+esc(g.label):'')+'</small></div><button class="btn sm" data-pr="gedit" data-id="'+g.id+'">✎</button></div>';
        }).join('')+'</details>';
    }).join('');
}
function homeUrl(){
  var p=PR(),m=/^(https?:\/\/[^?#]*?\/pronote\/)/i.exec(p.url||'');
  return p.home||(m?m[1]:'');
}
function setHtml(){
  var p=PR();
  return '<div class="pset"><h3>Lien du calendrier Pronote (iCal)</h3>'+
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
      tabs=[['week','📅 Semaine'],['hw','📚 Devoirs'],['notes','📊 Notes'],['set','⚙ Réglages']],
      body=PV.tab=='week'?weekHtml():PV.tab=='hw'?hwHtml():PV.tab=='notes'?notesHtml():setHtml(),
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
    if(p.url&&Date.now()-(p.fetched||0)>30*60e3)refreshPro(true);   // actualisation silencieuse
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
  o.grades=mArr(b.grades||[],l.grades||[],r.grades||[],newer);
  o.hw=mArr(b.hw||[],l.hw||[],r.hw||[],newer);
  o.hwdone=Object.assign({},r.hwdone||{},l.hwdone||{});
  o.coefs=Object.assign({},r.coefs||{},l.coefs||{});
  return o;
}
