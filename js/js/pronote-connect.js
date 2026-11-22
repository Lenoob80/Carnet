/* Connexion directe à Pronote (comme Papillon) :
   bibliothèque Pawnote (js/vendor/pawnote.bundle.js, à construire avec pawnote-build/)
   + relais Cloudflare (relay/worker.js) car le navigateur n'a pas le droit d'appeler Pronote tout seul.
   - le mot de passe n'est JAMAIS enregistré : il sert une fois, puis un jeton chiffré reste sur CET appareil ;
   - les données lues (cours, devoirs, notes, moyennes) vont dans D.pro, chiffrées et synchronisées comme le reste.
   Les noms exacts des champs de Pawnote ont été écrits sans pouvoir les essayer : le « Diagnostic » (Réglages)
   montre ce que la bibliothèque renvoie réellement, pour ajuster si besoin. */

var PN={busy:false,msg:'',diag:'',lastOk:0};

/* ---------- état et secrets locaux ---------- */
function pnConf(){return PR().conn||{}}
function pnLinked(){return !!(PR().pnLinked&&pnConf().url&&pnConf().relay)}
function pnLoc(){return kvGet('pn-sess').then(function(s){return s?unseal(s):{}}).catch(function(){return {}})}   // jeton + identifiant d'appareil : jamais synchronisés
function pnSaveLoc(o){return seal(o).then(function(s){return kvSet('pn-sess',s)})}

/* ---------- relais : « fetcher » que Pawnote utilise à la place de fetch ---------- */
function eachHeader(h,fn){
  if(!h)return;
  if(typeof h.forEach=='function'&&!Array.isArray(h)){h.forEach(function(v,k){fn(k,v)});return}
  if(Array.isArray(h))h.forEach(function(p){fn(p[0],p[1])});
  else Object.keys(h).forEach(function(k){fn(k,h[k])});
}
function pnResponse(status,text,headers){
  return {status:status,ok:status>=200&&status<300,content:text,headers:headers,url:'',
    text:function(){return Promise.resolve(text)},json:function(){return Promise.resolve(JSON.parse(text))},
    arrayBuffer:function(){return Promise.resolve(new TextEncoder().encode(text).buffer)}};
}
function relayFetcher(conf){
  var n=0,FORBID=/^(host|content-length|origin|referer|connection|accept-encoding|user-agent|cookie)$/i;
  async function f(req){
    n++;
    var url=String(req.url||req),headers={},method=(req.method||'GET').toUpperCase(),hops=0,body=req.content!=null?req.content:req.body;
    eachHeader(req.headers,function(k,v){
      if(/^cookie$/i.test(k))headers['x-relay-cookie']=v;
      else if(/^user-agent$/i.test(k))headers['x-relay-ua']=v;
      else if(!FORBID.test(k))headers[k]=v;
    });
    headers['x-relay-key']=conf.key||'';
    for(;;){
      var init={method:method,headers:headers,cache:'no-store'};
      if(method!='GET'&&body!=null)init.body=typeof body=='string'?body:JSON.stringify(body);
      var r=await fetch(conf.relay.replace(/\/+$/,'')+'/?u='+encodeURIComponent(url),init);
      if(r.status==401||r.status==403)throw new Error('Relais : '+(await r.text()).slice(0,150));
      var status=+r.headers.get('x-relay-status')||r.status,text=await r.text(),h=new Headers(),loc=r.headers.get('x-relay-location'),sc=r.headers.get('x-relay-set-cookie'),ct=r.headers.get('content-type');
      if(ct)h.set('content-type',ct);
      if(loc)h.set('location',loc);
      if(sc)try{h.set('set-cookie',sc)}catch(e){}
      if(status>=300&&status<400&&loc&&req.redirect!=='manual'&&hops++<5){      // on suit les redirections nous-mêmes
        url=new URL(loc,url).toString();method='GET';body=null;
        if(sc)headers['x-relay-cookie']=sc.split('\n').map(function(c){return c.split(';')[0]}).join('; ');
        continue;
      }
      return pnResponse(status,text,h);
    }
  }
  f.calls=function(){return n};
  return f;
}

/* ---------- bibliothèque Pawnote (chargée à la demande) ---------- */
async function pnLoadLib(){
  if(window.Pawnote)return window.Pawnote;
  try{await loadScript('js/vendor/pawnote.bundle.js')}catch(e){}
  if(!window.Pawnote)throw new Error('LIB');
  return window.Pawnote;
}

/* ---------- connexion : mot de passe (une fois) puis jeton ---------- */
async function pnOpen(mode,conf,creds,demo){
  var PW=await pnLoadLib(),loc=await pnLoc(),fetcher=relayFetcher(conf),session=PW.createSessionHandle(fetcher);
  try{session.fetcher=fetcher}catch(e){}
  var dev=loc.deviceUUID||uid()+uid()+uid(),kind=PW.AccountKind?PW.AccountKind.STUDENT:undefined,refresh;
  if(mode=='password')refresh=await PW.loginCredentials(session,{url:conf.url,deviceUUID:dev,kind:kind,username:creds.username,password:creds.password});
  else if(mode=='qr')refresh=await pnQrLogin(PW,session,dev,creds);
  else refresh=await PW.loginToken(session,{url:conf.url,deviceUUID:dev,kind:kind,username:loc.username,token:loc.token});
  if(!demo){
    if(refresh&&refresh.token){   // le jeton change à chaque connexion : on garde le nouveau tout de suite
      await pnSaveLoc({deviceUUID:dev,url:conf.url,username:refresh.username||creds.username||loc.username,token:refresh.token});
    }else if(mode=='password')PN.noToken=true;
  }
  return {PW:PW,session:session,fetcher:fetcher,refresh:refresh};
}

/* compte ENT (Édifice…) : on passe par le QR code de l'application mobile Pronote + un code à 4 chiffres */
async function pnQrLogin(PW,session,dev,creds){
  if(typeof PW.loginQrCode!='function')throw new Error('loginQrCode introuvable dans la bibliothèque');
  var q=creds.qr,shapes=[
    {deviceUUID:dev,pin:creds.pin,qr:q},
    {deviceUUID:dev,pin:creds.pin,qr:{jeton:q.jeton,login:q.login,url:q.url}},
    {deviceUUID:dev,pin:creds.pin,jeton:q.jeton,login:q.login,url:q.url}
  ],err;
  for(var i=0;i<shapes.length;i++){
    try{return await PW.loginQrCode(session,shapes[i])}
    catch(e){err=e;if(!(e&&(e.name=='TypeError'||/undefined|not a function/i.test(e.message||''))))throw e}   // on ne réessaie que si la forme de l'appel était mauvaise
  }
  throw err;
}

/* ---------- lecture et normalisation des données ---------- */
function pnName(x){return x?(typeof x=='string'?x:(x.name||x.title||x.label||'')):''}
function pnMs(d){if(!d)return null;var t=d instanceof Date?d.getTime():new Date(d).getTime();return isNaN(t)?null:t}
function pnNum(v){
  if(v==null)return null;
  if(typeof v=='number')return isFinite(v)?v:null;
  if(typeof v=='object')return pnNum(v.points!=null?v.points:v.value!=null?v.value:v.grade!=null?v.grade:v.average);
  return toNum(v);
}
function pnWeek(PW,session,date){
  var ins=session.instance||{},fm=ins.firstMonday||ins.firstDate||ins.startDate;
  if(PW.translateToWeekNumber&&fm)try{return PW.translateToWeekNumber(date,fm)}catch(e){}
  return fm?Math.floor((weekStart(date)-weekStart(fm))/(7*864e5))+1:null;
}
function pnLesson(l){
  var s=pnMs(l.startDate||l.start),e=pnMs(l.endDate||l.end);
  if(!s)return null;
  var sum=pnName(l.subject)||l.title||l.name||'Cours',
      loc=[].concat(l.classrooms||l.classroom||[]).map(pnName).join(', '),
      teachers=[].concat(l.teacherNames||l.teachers||[]).map(pnName).join(', '),
      status=l.status||'',cancel=!!(l.canceled||l.cancelled)||/annul|absent/i.test(String(status)+' '+(l.notes||''));
  return {id:'pn-'+(l.id||s+sum),s:s,e:e||s+36e5,sum:sum,loc:loc,desc:[teachers,l.notes||l.memo||'',status&&!cancel?String(status):''].filter(Boolean).join('\n'),cancel:cancel,allDay:false};
}
function pnGrade(g,subject,id){
  var v=pnNum(g.value!=null?g.value:g.grade!=null?g.grade:g.points);
  if(v===null)return null;                                   // absent, dispensé… : pas de note chiffrée
  var mx=pnNum(g.outOf!=null?g.outOf:g.max!=null?g.max:g.scale)||20,cf=pnNum(g.coefficient!=null?g.coefficient:g.coef),d=pnMs(g.date);
  return {id:'pn-'+(g.id||id),src:'pronote',subject:subject||pnName(g.subject)||'Divers',value:v,max:mx>0?mx:20,coef:cf>0?cf:1,
    date:d?isoDay(d):isoDay(Date.now()),label:g.comment||g.title||g.description||'',classAvg:pnNum(g.average),classMax:pnNum(g.max!=null&&g.outOf!=null?g.max:null)};
}
async function pnFetchAll(ctx,log){
  var PW=ctx.PW,session=ctx.session,out={events:[],hw:[],grades:[],avgs:[],user:''},now=new Date(),from=weekStart(now);
  from.setDate(from.getDate()-7);
  var to=new Date(from);to.setDate(to.getDate()+7*5);
  log.push('Fonctions de la bibliothèque : '+Object.keys(PW).filter(function(k){return /timetable|assign|homework|grade|overview|login|period|week/i.test(k)}).join(', '));
  log.push('Contenu de la session : '+Object.keys(session).join(', '));
  try{out.user=pnName(session.user)||pnName(session.userResource)||(session.user&&session.user.name)||''}catch(e){}

  /* emploi du temps */
  try{
    var weeks=[];
    for(var w=0;w<5;w++){var d=new Date(from);d.setDate(from.getDate()+7*w);weeks.push(d)}
    if(typeof PW.timetableFromIntervals=='function'){
      var tt=await PW.timetableFromIntervals(session,from,to);
      if(PW.parseTimetable)PW.parseTimetable(session,tt,{withSuperposedCanceledClasses:false,withCanceledClasses:true,withPlannedClasses:true});
      (tt.classes||[]).forEach(function(l){var e=pnLesson(l);if(e)out.events.push(e)});
    }else if(typeof PW.timetableFromWeek=='function'){
      for(var i=0;i<weeks.length;i++){
        var wn=pnWeek(PW,session,weeks[i]);if(wn==null)throw new Error('numéro de semaine introuvable');
        var t2=await PW.timetableFromWeek(session,wn);
        if(PW.parseTimetable)PW.parseTimetable(session,t2,{withSuperposedCanceledClasses:false,withCanceledClasses:true,withPlannedClasses:true});
        (t2.classes||[]).forEach(function(l){var e=pnLesson(l);if(e)out.events.push(e)});
      }
    }else throw new Error('fonction d’emploi du temps introuvable');
    log.push('✓ Emploi du temps : '+out.events.length+' cours');
  }catch(e){log.push('✗ Emploi du temps : '+(e.message||e))}

  /* devoirs */
  try{
    var fn=PW.assignmentsFromIntervals||PW.homeworkFromIntervals,list=[];
    if(typeof fn=='function')list=await fn(session,from,to);
    else{
      var fw=PW.assignmentsFromWeek||PW.homeworkFromWeek;
      if(typeof fw!='function')throw new Error('fonction de devoirs introuvable');
      for(var j=0;j<5;j++){var d2=new Date(from);d2.setDate(from.getDate()+7*j);var wk=pnWeek(PW,session,d2);if(wk!=null)list=list.concat(await fw(session,wk))}
    }
    (list||[]).forEach(function(a,k){
      var due=pnMs(a.deadline||a.dueDate||a.date);
      out.hw.push({id:'pn-hw-'+(a.id||k),subject:pnName(a.subject)||'Devoir',text:a.description||a.content||a.title||'',due:due||Date.now(),done:!!a.done,src:'Pronote'});
    });
    log.push('✓ Devoirs : '+out.hw.length);
  }catch(e){log.push('✗ Devoirs : '+(e.message||e))}

  /* notes et moyennes */
  try{
    if(typeof PW.gradesOverview!='function')throw new Error('fonction de notes introuvable');
    var ins=session.instance||{},ures=session.userResource||{},periods=[].concat(ins.periods||ures.periods||[]),seen={};
    if(!periods.length&&typeof PW.readDefaultPeriodForGradesOverview=='function'){try{periods=[PW.readDefaultPeriodForGradesOverview(session)]}catch(e){}}
    if(!periods.length)throw new Error('périodes introuvables');
    for(var p=0;p<periods.length;p++){
      var ov;try{ov=await PW.gradesOverview(session,periods[p])}catch(e){log.push('  période '+(p+1)+' : '+(e.message||e));continue}
      (ov.grades||[]).forEach(function(g,gi){
        var sub=pnName(g.subject),ng=pnGrade(g,sub,p+'-'+gi);
        if(ng&&!seen[ng.id]){seen[ng.id]=1;out.grades.push(ng)}
      });
      (ov.subjectsAverages||ov.averages||[]).forEach(function(a){
        out.avgs.push({subject:pnName(a.subject),student:pnNum(a.student!=null?a.student:a.average),klass:pnNum(a.class_average!=null?a.class_average:a.classAverage!=null?a.classAverage:a.class),max:pnNum(a.max),min:pnNum(a.min),period:pnName(periods[p])});
      });
      if(ov.overallAverage!=null)out.overall=pnNum(ov.overallAverage);
    }
    log.push('✓ Notes : '+out.grades.length+' · moyennes par matière : '+out.avgs.length);
  }catch(e){log.push('✗ Notes : '+(e.message||e))}
  log.push('Requêtes passées par le relais : '+ctx.fetcher.calls());
  return out;
}
function pnStore(d){
  var p=PR();
  if(d.events.length)p.events=d.events;
  p.fetched=Date.now();p.pnhw=d.hw;p.pngr=d.grades;p.pnavg=d.avgs;p.pnuser=d.user||p.pnuser||'';p.pnLinked=true;
  touchPR();
}

/* ---------- lancement ---------- */
function pnErr(e){
  var m=e&&e.message?e.message:String(e);
  if(m=='LIB')return 'Bibliothèque Pawnote absente (voir le guide)';
  if(/Failed to fetch|NetworkError|Load failed/i.test(m))return 'Relais injoignable ou bloqué (vérifie son adresse)';
  return m;
}
async function pnConnect(mode,creds,demo){
  if(PN.busy)return;
  var conf=demo?{url:'https://demo.index-education.net/pronote',relay:pnConf().relay,key:pnConf().key}:Object.assign({},pnConf());
  if(mode=='qr'&&creds&&creds.qr)conf.url=creds.qr.url.replace(/\/mobile\.[a-z]+\.html.*$/i,'').replace(/\/+$/,'');
  if(!conf.relay||!conf.url){toast('Renseigne l’adresse de Pronote et celle du relais.');return}
  PN.busy=true;PN.noToken=false;PN.msg='Connexion à Pronote…';paintPro();
  var log=[];
  try{
    var ctx=await pnOpen(mode,conf,creds||{},demo);
    log.push('✓ Connecté'+(demo?' (serveur de démonstration)':''));
    PN.msg='Lecture des données…';paintPro();
    var data=await pnFetchAll(ctx,log);
    if(!demo){pnStore(data);PN.lastOk=Date.now()}
    PN.msg='';
    toast(demo?'Démo : '+data.events.length+' cours, '+data.grades.length+' notes lues (rien enregistré).':'Pronote : '+data.events.length+' cours, '+data.hw.length+' devoirs, '+data.grades.length+' notes.');
    if(PN.noToken)log.push('⚠ Pronote n’a pas fourni de jeton : le mot de passe sera redemandé à chaque connexion.');
    log.push('Premières données : '+JSON.stringify({cours:data.events.slice(0,1),devoir:data.hw.slice(0,1),note:data.grades.slice(0,1),moyenne:data.avgs.slice(0,1)}).slice(0,1500));
  }catch(e){
    PN.msg='⚠ '+pnErr(e);log.push('✗ '+(e&&e.stack?String(e.stack).split('\n').slice(0,3).join(' | '):e));
    if(e&&e.message=='LIB')openLibHelp();
  }
  PN.diag=log.join('\n');PN.busy=false;paintPro();
}
async function pnRefresh(silent){
  var loc=await pnLoc();
  if(!loc.token){if(!silent)toast('Cet appareil n’a pas encore de session Pronote : connecte-toi dans ⚙ Réglages.');return}
  return pnConnect('token',null,false);
}
function openLibHelp(){
  openModal('Bibliothèque Pawnote manquante',
    '<p style="margin:0 0 8px">La connexion directe utilise la bibliothèque Pawnote, qu’il faut <b>construire une fois</b> sur ton ordinateur :</p>'+
    '<ol style="margin:0;padding-left:20px;line-height:1.7"><li>Ouvre un terminal dans le dossier <code>pawnote-build</code>.</li><li><code>npm install</code> puis <code>npm run build</code></li>'+
    '<li>Envoie le fichier créé <code>js/vendor/pawnote.bundle.js</code> sur ton dépôt GitHub.</li><li>Recharge le carnet.</li></ol>');
}

/* ---------- lecture du QR code (capture, caméra ou texte collé) ---------- */
function pnParseQr(text){
  var o;
  try{o=JSON.parse(String(text).trim())}catch(e){return null}
  return o&&o.jeton&&o.login&&o.url?o:null;
}
function pnGotQr(text){
  var o=pnParseQr(text),host='';
  if(!o){toast('Ce n’est pas un QR code Pronote (il doit contenir jeton, login et url).');return false}
  try{host=new URL(o.url).hostname}catch(e){}
  PN.qr=o;PN.qrAt=Date.now();toast('QR code lu ✓ '+host);paintPro();
  return true;
}
async function pnDecodeImage(file){
  var url=URL.createObjectURL(file);
  try{
    var im=await loadImg(url),k=Math.min(1,1200/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');
    c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);
    var x=c.getContext('2d');x.drawImage(im,0,0,c.width,c.height);
    var d=x.getImageData(0,0,c.width,c.height),res=null;
    try{await pnLoadLib()}catch(e){}
    if(window.jsQR)res=window.jsQR(d.data,d.width,d.height);
    if(!res&&'BarcodeDetector' in window){try{var r=await new BarcodeDetector({formats:['qr_code']}).detect(c);if(r&&r[0])res={data:r[0].rawValue}}catch(e){}}
    if(!res){toast('QR code non détecté : recadre la capture sur le QR code, ou colle son contenu.');return}
    pnGotQr(res.data);
  }finally{URL.revokeObjectURL(url)}
}
async function pnCamera(){
  var stream;
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})}catch(e){toast('Caméra indisponible : choisis une capture d’écran du QR code.');return}
  try{await pnLoadLib()}catch(e){}
  if(!window.jsQR){stream.getTracks().forEach(function(t){t.stop()});toast('Lecteur de QR code absent : reconstruis js/vendor/pawnote.bundle.js (guide, étape 2), ou colle le contenu du QR code.');return}
  openModal('📷 Scanner le QR code','<video id="pnv" playsinline muted style="width:100%;border-radius:8px;background:#000"></video><p class="prhelp">Place le QR code Pronote dans l’image.</p>');
  var v=$('pnv'),cv=document.createElement('canvas'),running=true;
  v.srcObject=stream;await v.play();
  function stop(){running=false;stream.getTracks().forEach(function(t){t.stop()})}
  MD.addEventListener('close',stop,{once:true});
  (function loop(){
    if(!running)return;
    if(v.videoWidth){
      cv.width=v.videoWidth;cv.height=v.videoHeight;
      var x=cv.getContext('2d');x.drawImage(v,0,0);
      var d=x.getImageData(0,0,cv.width,cv.height),r=window.jsQR(d.data,cv.width,cv.height);
      if(r&&pnParseQr(r.data)){stop();closeModal();pnGotQr(r.data);return}
    }
    requestAnimationFrame(loop);
  })();
}
var pnqf=document.createElement('input');
pnqf.type='file';pnqf.accept='image/*';pnqf.hidden=true;document.body.appendChild(pnqf);
pnqf.onchange=function(e){var f=e.target.files[0];e.target.value='';if(f)pnDecodeImage(f)};

/* ---------- interface (dans ⚙ Réglages) ---------- */
function pnVal(id){var e=$(id);return e?e.value.trim():''}
function connHtml(){
  var c=pnConf(),p=PR(),linked=pnLinked(),mode=PN.mode||c.mode||'qr',
      st=PN.msg||(linked?'✅ Connecté'+(p.pnuser?' : '+esc(p.pnuser):'')+(p.fetched?' · dernière lecture '+new Date(p.fetched).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''):'Non connecté'),
      qrHost='';
  if(PN.qr)try{qrHost=new URL(PN.qr.url).hostname}catch(e){}
  var relay='<label>Adresse de ton relais Cloudflare</label><input id="pnr" autocomplete="off" placeholder="https://carnet-relais.monpseudo.workers.dev" value="'+qa(c.relay||'')+'">'+
    '<label>Clé du relais</label><input id="pnk" type="password" autocomplete="off" value="'+qa(c.key||'')+'">';
  var qr='<ol class="prhelp" style="padding-left:18px"><li>Sur ordinateur, connecte-toi à Pronote <b>par ton ENT</b> (Édifice…).</li>'+
    '<li>Ouvre les paramètres de ton compte (ton nom en haut à droite → <b>Mon compte</b>, ou la rubrique <b>Mes données</b>), cherche <b>Application mobile</b> / <b>Connexion mobile</b> et clique <b>Générer le QR code</b>. Choisis un <b>code à 4 chiffres</b> et retiens-le.</li>'+
    '<li>Ici : lis le QR code, saisis le code à 4 chiffres, puis connecte-toi. ⚠ Le QR code n’est valable que <b>10 minutes</b> et <b>une seule fois</b>.</li></ol>'+
    '<div class="row"><button class="btn" data-pr="pnqrfile">🖼 Choisir une capture du QR code</button><button class="btn" data-pr="pnqrcam">📷 Scanner avec la caméra</button></div>'+
    '<textarea id="pnj" rows="2" placeholder="…ou colle ici le contenu du QR code ({&quot;jeton&quot;:…})" style="margin-top:8px"></textarea>'+
    '<div class="row" style="margin-top:6px"><button class="btn sm" data-pr="pnqrtxt">Lire le texte collé</button></div>'+
    (PN.qr?'<div class="prnext now">QR code lu ✓ — '+esc(qrHost)+'</div>':'')+
    '<label>Code à 4 chiffres choisi dans Pronote</label><input id="pnq" inputmode="numeric" maxlength="4" autocomplete="off" style="max-width:140px">'+
    relay+'<div class="row" style="margin-top:10px"><button class="btn" data-pr="pnqrlogin" style="border-color:var(--accent)">Se connecter avec le QR code</button></div>';
  var pwd='<p class="prhelp">Pour un compte qui se connecte <b>sans ENT</b>.</p>'+
    '<label>Adresse de ton Pronote</label><input id="pnu" autocomplete="off" placeholder="https://0123456a.index-education.net/pronote" value="'+qa(c.url||'')+'">'+
    '<label>Identifiant</label><input id="pni" autocomplete="username" value="'+qa(c.username||'')+'">'+
    '<label>Mot de passe (non enregistré)</label><input id="pnp" type="password" autocomplete="current-password">'+relay+
    '<div class="row" style="margin-top:10px"><button class="btn" data-pr="pnlogin" style="border-color:var(--accent)">Se connecter</button></div>';
  return '<div class="pset"><h3>🔌 Connexion directe à Pronote (comme Papillon)</h3>'+
    '<p class="prhelp">Ton mot de passe (ou le QR code) sert <b>une seule fois</b> et n’est <b>jamais enregistré</b> : l’app garde ensuite un jeton chiffré sur cet appareil. Les données lues (cours, devoirs, notes, moyennes) sont chiffrées et synchronisées avec le reste du carnet. Procédure complète : <b>GUIDE-PRONOTE.md</b>.</p>'+
    '<div class="prnext'+(linked&&!PN.msg?' now':'')+'">'+st+'</div>'+
    '<div class="prnav"><button class="btn sm'+(mode=='qr'?' on':'')+'" data-pr="pnmode" data-v="qr">🔐 ENT (code QR)</button><button class="btn sm'+(mode=='pwd'?' on':'')+'" data-pr="pnmode" data-v="pwd">🔑 Identifiants Pronote</button></div>'+
    (mode=='qr'?qr:pwd)+
    '<div class="row" style="margin-top:10px"><button class="btn" data-pr="pnsave">Enregistrer les réglages</button><button class="btn" data-pr="pntest">Tester le relais</button>'+
    '<button class="btn" data-pr="pndemo" title="Serveur de démonstration d’Index Éducation : aucun risque pour ton compte">🧪 Essayer avec la démo</button>'+
    (linked?'<button class="btn" data-pr="pnout">Se déconnecter</button>':'')+'</div>'+
    (PN.diag?'<h3>Diagnostic</h3><textarea id="pnd" rows="9" readonly style="font:12px monospace">'+esc(PN.diag)+'</textarea><div class="row" style="margin-top:6px"><button class="btn sm" data-pr="pncopy">Copier le diagnostic</button></div>':'')+
    '</div>';
}
function pnReadConf(){
  var old=pnConf();
  return {url:(pnVal('pnu')||old.url||'').replace(/\/+$/,''),username:pnVal('pni')||old.username||'',relay:pnVal('pnr').replace(/\/+$/,''),key:pnVal('pnk'),mode:PN.mode||old.mode||'qr'};
}
function pnAct(b){
  var a=b.dataset.pr;
  if(a.indexOf('pn')!=0||a=='pnhw')return false;
  if(a=='pnmode'){PN.mode=b.dataset.v;paintPro();return true}
  if(a=='pnsave'){var p=PR();p.conn=pnReadConf();touchPR();toast('Réglages enregistrés.');return true}
  if(a=='pnqrfile'){pnqf.click();return true}
  if(a=='pnqrcam'){pnCamera();return true}
  if(a=='pnqrtxt'){pnGotQr(pnVal('pnj'));return true}
  if(a=='pnqrlogin'){
    var cq=pnReadConf(),pin=pnVal('pnq');
    if(!PN.qr){toast('Lis d’abord le QR code (capture, caméra ou texte collé).');return true}
    if(!/^\d{4}$/.test(pin)){toast('Saisis le code à 4 chiffres choisi dans Pronote.');return true}
    if(!cq.relay){toast('Renseigne l’adresse du relais.');return true}
    var qr=PN.qr,base=qr.url.replace(/\/mobile\.[a-z]+\.html.*$/i,'').replace(/\/+$/,'');
    PR().conn=Object.assign({},cq,{url:base,mode:'qr'});touchPR();
    PN.qr=null;                                    // le QR code ne reste pas en mémoire
    pnConnect('qr',{qr:qr,pin:pin},false);
    return true;
  }
  if(a=='pnlogin'){
    var c=pnReadConf(),pw=pnVal('pnp');
    if(!c.url||!c.username||!pw||!c.relay){toast('Adresse, identifiant, mot de passe et relais sont nécessaires.');return true}
    PR().conn=Object.assign({},c,{mode:'pwd'});touchPR();$('pnp').value='';
    pnConnect('password',{username:c.username,password:pw},false);
    return true;
  }
  if(a=='pndemo'){
    var c2=pnReadConf();
    if(!c2.relay){toast('Renseigne d’abord l’adresse et la clé du relais.');return true}
    PR().conn=Object.assign({},PR().conn||{},{relay:c2.relay,key:c2.key});touchPR();
    pnConnect('password',{username:'demonstration',password:'pronotevs'},true);
    return true;
  }
  if(a=='pntest'){
    var c3=pnReadConf();
    if(!c3.relay){toast('Renseigne l’adresse du relais.');return true}
    PN.msg='Test du relais…';paintPro();
    relayFetcher({relay:c3.relay,key:c3.key})({url:'https://demo.index-education.net/pronote/',method:'GET'}).then(function(r){
      PN.diag='Test du relais : réponse '+r.status+' de Pronote ('+r.content.length+' octets)\n'+(r.status==200?'✓ Le relais fonctionne.':'⚠ Réponse inattendue.');
      PN.msg='';paintPro();
    }).catch(function(e){PN.diag='✗ Relais : '+pnErr(e);PN.msg='';paintPro()});
    return true;
  }
  if(a=='pnout'){
    conf('Se déconnecter de Pronote sur cet appareil ?',function(){
      kvSet('pn-sess',null).then(function(){var p=PR();p.pnLinked=false;touchPR();paintPro();toast('Déconnecté.')});
    });
    return true;
  }
  if(a=='pncopy'){var t=$('pnd');if(t){t.select();try{document.execCommand('copy');toast('Copié.')}catch(e){}}return true}
  return false;
}
