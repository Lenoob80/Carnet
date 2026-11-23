/* Chiffrement, connexion, synchro GitHub, images (IndexedDB), annuler, recherche, glisser-déposer, thème */
/* ===== Sécurité (chiffrement) + synchro GitHub + images IndexedDB + annuler + recherche ===== */
var K=null,CFG=null,SHA=null,ETAG=null,BASE=null,LH=0,dirty=false,busy=false,pt2=null,needR=false,idle=null,chg=false,DB=null,PEND={},URLS={},HI={},TE=new TextEncoder(),TD=new TextDecoder();
function H(s){var h=5381;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return h}
function b64(u){var s='';for(var i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)}
function ub(s){var b=atob(s.replace(/\s/g,'')),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
async function derive(email,pw){var salt=new Uint8Array(await crypto.subtle.digest('SHA-256',TE.encode('carnet:'+email))),km=await crypto.subtle.importKey('raw',TE.encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:600000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function seal(o){var iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},K,TE.encode(JSON.stringify(o))));return JSON.stringify({v:1,iv:b64(iv),ct:b64(ct)})}
async function unseal(t){var o=JSON.parse(t);return JSON.parse(TD.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(o.iv)},K,ub(o.ct))))}
async function sealB(u){var iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},K,u)),o=new Uint8Array(12+ct.length);o.set(iv);o.set(ct,12);return o}
async function unsealB(u){return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:u.subarray(0,12)},K,u.subarray(12)))}
/* ---- IndexedDB : document en cache + images ---- */
function idb(){return DB||(DB=new Promise(function(ok,ko){var r=indexedDB.open('carnet',1);r.onupgradeneeded=function(){r.result.createObjectStore('kv');r.result.createObjectStore('img')};r.onsuccess=function(){ok(r.result)};r.onerror=function(){ko(r.error)}}))}
function idbOp(st,mode,fn){return idb().then(function(d){return new Promise(function(ok,ko){var t=d.transaction(st,mode),q=fn(t.objectStore(st));t.oncomplete=function(){ok(q&&q.result)};t.onerror=function(){ko(t.error)}})})}
function kvGet(k){return idbOp('kv','readonly',function(s){return s.get(k)})}
function kvSet(k,v){return idbOp('kv','readwrite',function(s){return s.put(v,k)})}
function imGet(k){return idbOp('img','readonly',function(s){return s.get(k)})}
function imSet(k,v){return idbOp('img','readwrite',function(s){return s.put(v,k)})}
function setSt(t){$('sts').textContent=t}
function gh(path,o){o=o||{};o.headers=Object.assign({Authorization:'Bearer '+CFG.t,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},o.headers||{});return fetch('https://api.github.com/repos/'+CFG.r+path,o)}
async function ghFile(p){var r=await gh('/contents/'+p);if(!r.ok)return null;var j=await r.json(),c=j.content;if(!c){var b=await gh('/git/blobs/'+j.sha);c=(await b.json()).content}return c}
/* ---- images ---- */
async function storeImg(id,du){var u=ub(du.split(',')[1]);await imSet(id,await sealB(u));PEND[id]=1;await kvSet('pend',Object.keys(PEND));URLS[id]=URL.createObjectURL(new Blob([u],{type:'image/jpeg'}))}
async function imgUrl(id){if(URLS[id])return URLS[id];var sb=await imGet(id);if(!sb&&CFG){var t=await ghFile('img/'+id+'.enc');if(t){sb=ub(t);await imSet(id,sb)}}if(!sb)return null;var u=await unsealB(sb);return URLS[id]=URL.createObjectURL(new Blob([u],{type:'image/jpeg'}))}
function hydrate(){[].forEach.call(document.querySelectorAll('img[data-ref]'),function(im){imgUrl(im.dataset.ref.slice(4)).then(function(u){if(u)im.src=u;else im.alt='Image introuvable'}).catch(function(){im.alt='Image illisible'})})}
async function migImgs(){var ch=false;for(var a of D.nbs)for(var s of a.sections)for(var p of s.pages)for(var b of (p.boxes||[]))if(b.k=='i'&&/^data:/.test(b.c)){var id=uid();await storeImg(id,b.c);b.c='idb:'+id;ch=true}return ch}
async function expData(){var c=JSON.parse(JSON.stringify(D.nbs));for(var a of c)for(var s of a.sections)for(var p of s.pages)for(var b of (p.boxes||[]))if(b.k=='i'&&/^idb:/.test(b.c)){var id=b.c.slice(4);await imgUrl(id);var sb=await imGet(id);if(sb)b.c='data:image/jpeg;base64,'+b64(await unsealB(sb))}return JSON.stringify({v:1,nbs:c})}
async function upImgs(){var ids=Object.keys(PEND);for(var i=0;i<ids.length;i++){var sb=await imGet(ids[i]);if(sb){var r=await gh('/contents/img/'+ids[i]+'.enc',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'img',content:b64(sb)})});if(r.status==401)throw new Error('Jeton refusé (401)');if(!r.ok&&r.status!=422&&r.status!=409)throw new Error('GitHub '+r.status)}delete PEND[ids[i]]}await kvSet('pend',Object.keys(PEND))}
/* ---- GitHub ---- */
async function pull(){
 var h={};if(ETAG)h['If-None-Match']=ETAG;
 var r=await gh('/contents/'+CFG.p,{headers:h});
 if(r.status==304)return 'same';
 if(r.status==404){SHA=null;return 'none'}
 if(r.status==401)throw new Error('Jeton refusé (401)');
 if(!r.ok)throw new Error('GitHub '+r.status);
 ETAG=r.headers.get('ETag');try{noteExp(r.headers.get('github-authentication-token-expiration'))}catch(e){}var j=await r.json();SHA=j.sha;var c=j.content;
 if(!c){var b=await gh('/git/blobs/'+j.sha);c=(await b.json()).content}
 try{return await unseal(TD.decode(ub(c)))}catch(e){throw new Error('Données illisibles : e-mail ou mot de passe différents de ceux utilisés à la création.')}
}
async function push(doc,msg){
 var body={message:msg||'sync',content:b64(TE.encode(await seal(doc)))};if(SHA)body.sha=SHA;
 var r=await gh('/contents/'+CFG.p,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(r.status==409||r.status==422)return 'conflict';
 if(r.status==401)throw new Error('Jeton refusé (401)');
 if(!r.ok)throw new Error('GitHub '+r.status);
 SHA=(await r.json()).content.sha;ETAG=null;return 'ok'
}
function byId(a){var o={};(a||[]).forEach(function(x){o[x.id]=x});return o}
function mArr(B,L,R,fn){var b=byId(B),l=byId(L),r=byId(R),out=[],seen={};L.forEach(function(x){seen[x.id]=1;if(r[x.id])out.push(fn(b[x.id],x,r[x.id]));else if(!b[x.id])out.push(x)});R.forEach(function(x){if(!seen[x.id]&&!b[x.id])out.push(x)});return out}
function pick(b,l,r,k){return b&&l[k]!==b[k]?l[k]:r[k]}
function mP(b,l,r){return (l.u||0)>=(r.u||0)?l:r}
function mS(b,l,r){var o=Object.assign({},l);o.name=pick(b,l,r,'name');o.color=pick(b,l,r,'color');o.pages=mArr(b?b.pages:[],l.pages,r.pages,mP);return o}
function mN(b,l,r){var o=Object.assign({},l);o.name=pick(b,l,r,'name');o.sections=mArr(b?b.sections:[],l.sections,r.sections,mS);return o}
function cids(){var n=nb(),s=n&&n.sections[D.cur.s],p=s&&s.pages[D.cur.p];return [n&&n.id,s&&s.id,p&&p.id]}
function relocate(c){var ni=D.nbs.findIndex(function(x){return x.id==c[0]});if(ni<0)return;var n=D.nbs[ni],si=n.sections.findIndex(function(x){return x.id==c[1]});if(si<0){D.cur={n:ni,s:0,p:0};return}var pi=n.sections[si].pages.findIndex(function(x){return x.id==c[2]});D.cur={n:ni,s:si,p:Math.max(0,pi)}}
function editing(){var a=document.activeElement;return !!(a&&a.closest&&a.closest('#page'))||(typeof DR!='undefined'&&DR.on)}
/* le document synchronisé contient les carnets, la corbeille et les modèles */
function docStr(){return JSON.stringify({nbs:D.nbs,trash:D.trash||[],tpl:D.tpl||[],pro:D.pro||{},c3:D.c3||{}})}
function docOf(){return {v:1,nbs:D.nbs,trash:D.trash||[],tpl:D.tpl||[],pro:D.pro||{},c3:D.c3||{}}}
function baseDoc(){var b=null;try{b=BASE?JSON.parse(BASE):null}catch(e){}if(Array.isArray(b))b={nbs:b};return b||{}}
function keepLocal(b,l,r){return l}
function adopt(rem){D.nbs=rem.nbs;D.trash=rem.trash||[];D.tpl=rem.tpl||[];D.pro=rem.pro||{};D.c3=rem.c3||{};BASE=docStr();LH=H(BASE)}
function mergeDoc(rem){
  var b=baseDoc();
  D.nbs=mArr(b.nbs||[],D.nbs,rem.nbs,mN);
  D.trash=mArr(b.trash||[],D.trash||[],rem.trash||[],keepLocal);
  D.tpl=mArr(b.tpl||[],D.tpl||[],rem.tpl||[],keepLocal);
  D.pro=mergePro(b.pro||{},D.pro||{},rem.pro||{});
  var lc=D.c3||{},rc=rem.c3||{};D.c3=(lc.u||0)>=(rc.u||0)?lc:rc;
}
function purgeTrash(){var lim=Date.now()-30*864e5;D.trash=(D.trash||[]).filter(function(e){return e.at>lim})}
async function cache(){if(!K)return;try{await kvSet('data',await seal({v:1,nbs:D.nbs,trash:D.trash||[],tpl:D.tpl||[],pro:D.pro||{},c3:D.c3||{},cur:D.cur,base:BASE,dirty:dirty}))}catch(e){toast('Stockage local indisponible.')}}
async function persist(){await cache();if(dirty)syncNow()}
async function syncNow(){
 if(busy||!CFG||!K)return;busy=true;setSt('⟳ Synchronisation…');
 try{
  try{ser()}catch(e){}
  await upImgs();
  var done=false;
  for(var i=0;i<3&&!done;i++){
   var rem=await pull();try{ser()}catch(e){}
   var need=dirty,c=cids();
   if(rem&&typeof rem=='object'){
    if(!dirty){adopt(rem);relocate(c);needR=true;done=true;break}
    mergeDoc(rem);relocate(c);needR=true;need=true
   }else if(rem=='none')need=true;
   if(!need){done=true;break}
   purgeTrash();
   var snap=docStr(),res=await push(docOf());
   if(res=='ok'){BASE=snap;LH=H(snap);dirty=docStr()!==snap;done=true}else ETAG=null
  }
  setSt(done?'✓ Synchronisé':'⚠ Conflit, nouvel essai…');
  if(needR&&!editing()){needR=false;render()}
  await cache()
 }catch(e){setSt(navigator.onLine?'⚠ '+e.message:'⚠ Hors ligne : modifications gardées')}
 busy=false
}
async function boot(){
 var c=await kvGet('data'),legacy=false,loc=null;
 if(!c){c=localStorage.getItem('carnet-data');legacy=!!c}
 if(c){try{loc=await unseal(c)}catch(x){}}
 PEND={};((await kvGet('pend'))||[]).forEach(function(i){PEND[i]=1});
 if(loc){D={cur:loc.cur||{n:0,s:0,p:0},nbs:loc.nbs,trash:loc.trash||[],tpl:loc.tpl||[],pro:loc.pro||{},c3:loc.c3||{}};BASE=loc.base||null;dirty=!!loc.dirty;ETAG=null}
 else{var rem=await pull();
  if(rem&&typeof rem=='object'){D={cur:{n:0,s:0,p:0},nbs:rem.nbs,trash:rem.trash||[],tpl:rem.tpl||[],pro:rem.pro||{},c3:rem.c3||{}};BASE=docStr();dirty=false}
  else{D={cur:{n:0,s:0,p:0},nbs:[newNb('Rapport de stage')],trash:[],tpl:[],pro:{},c3:{}};BASE=null;dirty=true}}
 D.nbs=fix({nbs:D.nbs}).nbs;purgeTrash();LH=BASE?H(BASE):0;
 if(await migImgs())dirty=true;
 render();await cache();if(legacy)localStorage.removeItem('carnet-data');
 $('bL').style.display='';$('bK').style.display='';bump();checkExp();
 setInterval(function(){if(!document.hidden)syncNow()},10000);syncNow()
}
/* ---- écran de connexion ---- */
function lerr(m){$('lkErr').textContent=m;$('lkGo').disabled=false}
function setLk(has,c){chg=c;$('lkSet').style.display=(!has||c)?'block':'none';$('lkCh').style.display=(has&&!c)?'inline':'none';$('lkMsg').textContent=!has?'Première connexion sur cet appareil.':c?'Saisis le nouveau jeton (et le dépôt si besoin).':'Connecte-toi pour ouvrir ton carnet.';$('lkR').placeholder=c?'(vide = garder le dépôt actuel)':'monpseudo/carnet-data'}
function gate(){var has=!!localStorage.getItem('carnet-cfg'),c=false;try{c=has&&sessionStorage.getItem('carnet-chg')=='1';sessionStorage.removeItem('carnet-chg')}catch(e){}$('lock').style.display='flex';setLk(has,c)}
$('lkCh').onclick=function(){setLk(true,true)};
$('lkGo').onclick=async function(){
 var e=$('lkE').value.trim().toLowerCase(),p=$('lkP').value;if(!e||!p){lerr('Renseigne l’e-mail et le mot de passe.');return}
 $('lkGo').disabled=true;$('lkErr').textContent='Vérification…';
 try{
  K=await derive(e,p);var raw=localStorage.getItem('carnet-cfg'),fresh=false;CFG=null;
  if(raw){try{CFG=await unseal(raw)}catch(x){K=null;return lerr('E-mail ou mot de passe incorrect.')}}
  if(!raw||chg){var rp=$('lkR').value.trim()||(CFG&&CFG.r)||'',tk=$('lkT').value.trim(),pa=(CFG&&CFG.p)||'carnet.enc';
   if(!/^[\w.-]+\/[\w.-]+$/.test(rp)||!tk){K=null;CFG=null;return lerr('Renseigne le jeton'+(raw?'.':' et le dépôt (pseudo/nom).'))}
   CFG={r:rp,t:tk,p:pa,exp:$('lkX').value||''};var rr=await gh('');
   if(rr.status==401){K=null;CFG=null;return lerr('Jeton refusé (401).')}
   if(!rr.ok){K=null;CFG=null;return lerr('Dépôt introuvable ou jeton sans accès ('+rr.status+').')}
   fresh=true}
  await boot();
  if(fresh)localStorage.setItem('carnet-cfg',await seal(CFG));
  $('lock').style.display='none';$('lkP').value='';$('lkT').value=''
 }catch(x){K=null;lerr('Erreur : '+x.message)}
};
['lkE','lkP','lkR','lkT'].forEach(function(i){$(i).onkeydown=function(e){if(e.key=='Enter')$('lkGo').click()}});
function bump(){clearTimeout(idle);if(K)idle=setTimeout(lockNow,15*60000)}
['click','keydown','pointerdown','touchstart'].forEach(function(ev){document.addEventListener(ev,bump,{passive:true})});
async function lockNow(){try{ser();await cache();if(dirty&&navigator.onLine)await Promise.race([syncNow(),new Promise(function(r){setTimeout(r,4000)})])}catch(e){}location.reload()}
$('bL').onclick=lockNow;
function goChangeToken(){try{sessionStorage.setItem('carnet-chg','1')}catch(e){}lockNow()}
$('bK').onclick=function(){openTokenInfo()};
document.addEventListener('visibilitychange',function(){if(!K)return;if(document.hidden){try{ser()}catch(e){}cache()}else syncNow()});
window.addEventListener('online',function(){syncNow()});
/* ---- annuler / rétablir (15 derniers états de la page) ---- */
function undo(d){ser();var p=pg();if(!p)return;var h=HI[p.id];if(!h)return;var j=h.i+d;if(j<0||j>=h.s.length){toast(d<0?'Rien à annuler.':'Rien à rétablir.');return}h.i=j;var o=JSON.parse(h.s[j]);p.title=o[0];p.sub=o[1];p.tab=o[2];p.boxes=o[3];p.u=Date.now();save();render()}
document.addEventListener('keydown',function(e){
 if(!(e.ctrlKey||e.metaKey)||e.altKey)return;var k=e.key.toLowerCase();
 if(k=='k'){e.preventDefault();$('q').focus();$('q').select();return}
 if(k!='z'&&k!='y')return;
 if(!$('page')||(e.target.closest&&e.target.closest('input,textarea,select,dialog,#sbar')))return;
 e.preventDefault();undo(k=='z'&&!e.shiftKey?-1:1)});
/* ---- recherche globale ---- */
function nz(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function tx(h){return String(h||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ')}
function doSearch(){
 var v=$('q').value.trim(),R=$('res');if(!v||!D||!K){R.style.display='none';return}
 try{ser()}catch(e){}
 var W=nz(v).split(/\s+/),out=[];
 D.nbs.forEach(function(n,ni){n.sections.forEach(function(s,si){s.pages.forEach(function(p,pi){
  var full=[p.title,p.sub,(p.tags||[]).map(function(t){return '#'+t}).join(' '),tx(p.tab)].concat((p.boxes||[]).filter(function(b){return b.k=='t'}).map(function(b){return tx(b.c)})).join(' • '),f=nz(full);
  if(W.every(function(w){return f.indexOf(w)>=0})){var i=f.indexOf(W[0]);out.push({ni:ni,si:si,pi:pi,t:p.title,path:n.name+' › '+s.name,sn:full.slice(Math.max(0,i-30),i+80),inT:nz(p.title).indexOf(W[0])>=0?1:0})}})})});
 out.sort(function(a,b){return b.inT-a.inT});
 R.innerHTML=out.slice(0,30).map(function(x){return '<div class="rs" data-ni="'+x.ni+'" data-si="'+x.si+'" data-pi="'+x.pi+'"><b>'+esc(x.t)+'</b><span>'+esc(x.path)+'</span><div>'+esc(x.sn)+'</div></div>'}).join('')||'<div class="rs">Aucun résultat</div>';
 R.style.display='block'
}
var st3=null;
$('q').oninput=function(){clearTimeout(st3);st3=setTimeout(doSearch,200)};
$('q').onfocus=function(){if($('q').value.trim())doSearch()};
$('q').onkeydown=function(e){if(e.key=='Escape'){$('q').value='';$('res').style.display='none'}if(e.key=='Enter'){var f=document.querySelector('#res .rs[data-ni]');if(f)f.click()}};
$('res').onclick=function(e){var r=e.target.closest('.rs');if(!r||r.dataset.ni===undefined)return;ser();D.cur={n:+r.dataset.ni,s:+r.dataset.si,p:+r.dataset.pi};save();render();$('res').style.display='none'};
document.addEventListener('click',function(e){if(!e.target.closest('#sbar'))$('res').style.display='none'});
/* ---- sécurité du HTML affiché (défense en profondeur ; la CSP bloque déjà les scripts) ---- */
function qa(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
function san(h){
 var t=document.createElement('template');t.innerHTML=h;
 t.content.querySelectorAll('script,iframe,object,embed,link,meta,base,form,style,svg,math,frame,frameset').forEach(function(e){e.remove()});
 t.content.querySelectorAll('*').forEach(function(e){[].slice.call(e.attributes).forEach(function(a){var n=a.name.toLowerCase();if(n.indexOf('on')==0||(/^(href|src|xlink:href|action|formaction|srcset)$/.test(n)&&/^\s*(javascript|vbscript|data:text)/i.test(a.value)))e.removeAttribute(a.name)})});
 return t.innerHTML}
/* ---- réorganisation par glisser-déposer (souris et tactile) ---- */
var DG=0;
function gp(k,i){return bulk?'':'<i class="gp" data-g="'+k+'" data-i="'+i+'" title="Glisser pour déplacer">⠿</i>'}
function moveItem(kind,from,tgt,pos){
 var n=nb(),keep=cids();
 if(kind=='s'){var t=+tgt.dataset.s,it=n.sections.splice(from,1)[0];if(from<t)t--;n.sections.splice(pos=='after'?t+1:t,0,it)}
 else{var src=sec().pages,item=src[from];
  if(tgt.classList.contains('sec')){var ts=+tgt.dataset.s;if(ts==D.cur.s)return;src.splice(from,1);n.sections[ts].pages.push(item)}
  else{var t2=+tgt.dataset.p;src.splice(from,1);if(from<t2)t2--;src.splice(pos=='after'?t2+1:t2,0,item)}
  if(from==D.cur.p)keep[2]=item.id}
 var found=null;n.sections.forEach(function(sx,i){sx.pages.forEach(function(p,j){if(p.id==keep[2])found={s:i,p:j}})});
 if(found)D.cur={n:D.cur.n,s:found.s,p:found.p};else D.cur.s=Math.max(0,n.sections.findIndex(function(x){return x.id==keep[1]}));
 save();render()
}
document.addEventListener('pointerdown',function(e){
 var g=e.target.closest&&e.target.closest('.gp');if(!g)return;e.preventDefault();
 var kind=g.dataset.g,from=+g.dataset.i,row=g.closest('.pg,.sec'),tgt=null,pos='';ser();row.style.opacity='.5';
 function clr(){[].forEach.call(document.querySelectorAll('.dt,.db,.dm'),function(x){x.classList.remove('dt','db','dm')})}
 function mv(ev){clr();tgt=null;var el=document.elementFromPoint(ev.clientX,ev.clientY),r=el&&el.closest&&el.closest(kind=='p'?'.pg,.sec':'.sec');if(!r||r===row)return;var rc=r.getBoundingClientRect();tgt=r;
  if(r.classList.contains('sec')&&kind=='p'){pos='in';r.classList.add('dm')}else{pos=ev.clientY<rc.top+rc.height/2?'before':'after';r.classList.add(pos=='before'?'dt':'db')}}
 function up(){document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);clr();row.style.opacity='';DG=1;setTimeout(function(){DG=0},350);if(tgt)moveItem(kind,from,tgt,pos)}
 document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up)
});
/* ---- thème clair / sombre manuel ---- */
function effTheme(){return document.documentElement.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}
function showTh(){$('bT').textContent=effTheme()=='dark'?'☀️':'🌙'}
try{var sv=localStorage.getItem('carnet-theme');if(sv)document.documentElement.setAttribute('data-theme',sv)}catch(e){}
showTh();
$('bT').onclick=function(){var n=effTheme()=='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);try{localStorage.setItem('carnet-theme',n)}catch(e){}showTh()};
gate();
