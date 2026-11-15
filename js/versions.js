/* Historique des versions (commits GitHub du dépôt de données), points de restauration,
   et allègement des données (compression des anciennes images) */

var VH={page:1,items:[],snapOnly:false};

/* ---- lecture de l'historique ---- */
async function listCommits(page){
  var r=await gh('/commits?path='+encodeURIComponent(CFG.p)+'&per_page=40&page='+page);
  if(!r.ok)throw new Error('GitHub '+r.status);
  return r.json();
}
async function docAt(sha){
  var r=await gh('/contents/'+CFG.p+'?ref='+sha);
  if(!r.ok)throw new Error('GitHub '+r.status);
  var j=await r.json(),c=j.content;
  if(!c){c=(await (await gh('/git/blobs/'+j.sha)).json()).content}
  try{return await unseal(TD.decode(ub(c)))}catch(e){throw new Error('version illisible')}
}
function fmtDt(s){
  var d=new Date(s);
  return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}

/* ---- point de restauration : un commit daté et nommé ---- */
async function makeSnapshot(label){
  if(busy){toast('Synchronisation en cours, réessaie dans un instant.');return}
  await syncNow();
  busy=true;
  try{
    try{ser()}catch(e){}
    await pull();
    var snap=docStr(),res=await push(docOf(),'📸 '+label);
    if(res=='ok'){BASE=snap;LH=H(snap);dirty=false;await cache();toast('📸 Point de restauration « '+label+' » enregistré.')}
    else toast('Conflit : réessaie.');
  }catch(e){toast('Impossible : '+(e.message||e))}
  busy=false;
}

/* ---- restauration : toujours une COPIE, jamais d'écrasement ---- */
function stamp(){return ' (version du '+new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})+')'}
function freshPage(p,suffix){
  var c=JSON.parse(JSON.stringify(p));
  c.id=uid();c.title+=suffix||'';c.u=Date.now();delete c.hh;
  (c.boxes||[]).forEach(function(b){b.id=uid()});
  return c;
}
function freshSection(s,suffix){
  var c=JSON.parse(JSON.stringify(s));
  c.id=uid();c.name+=suffix||'';c.pages=c.pages.map(function(p){return freshPage(p,'')});
  return c;
}
function freshNotebook(n,suffix){
  var c=JSON.parse(JSON.stringify(n));
  c.id=uid();c.name+=suffix||'';c.sections=c.sections.map(function(s){return freshSection(s,'')});
  return c;
}
function showSnapshot(doc,label){
  var html='<button class="btn sm" data-vh="back">← Retour à la liste</button><div class="mgrp">Version du '+esc(label)+'</div>'+
    doc.nbs.map(function(n,ni){
      return '<div class="mrow"><span>📓</span><div class="mi"><b>'+esc(n.name)+'</b></div><button class="btn sm" data-vh="rn" data-ni="'+ni+'">Restaurer le carnet</button></div>'+
        n.sections.map(function(s,si){
          return '<div class="mrow" style="padding-left:18px"><span>📁</span><div class="mi">'+esc(s.name)+'</div><button class="btn sm" data-vh="rs" data-ni="'+ni+'" data-si="'+si+'">Restaurer la section</button></div>'+
            s.pages.map(function(p,pi){
              return '<div class="mrow" style="padding-left:40px"><span>📄</span><div class="mi">'+esc(p.title)+'</div><button class="btn sm" data-vh="rp" data-ni="'+ni+'" data-si="'+si+'" data-pi="'+pi+'">Restaurer</button></div>';
            }).join('');
        }).join('');
    }).join('')+'<p style="color:var(--muted);margin-top:10px">« Restaurer » ajoute une copie dans le carnet actuel : rien n’est écrasé.</p>';
  openModal('🕘 Version du '+label,html,function(ev){
    var b=ev.target.closest('[data-vh]');if(!b)return;
    var a=b.dataset.vh,n=doc.nbs[+b.dataset.ni];
    if(a=='back'){openHistory();return}
    ser();
    if(a=='rn'){D.nbs.push(freshNotebook(n,stamp()));D.cur={n:D.nbs.length-1,s:0,p:0}}
    else if(a=='rs'){nb().sections.push(freshSection(n.sections[+b.dataset.si],stamp()));D.cur={n:D.cur.n,s:nb().sections.length-1,p:0}}
    else if(a=='rp'){
      var s=sec()||(nb().sections[0]),p=n.sections[+b.dataset.si].pages[+b.dataset.pi];
      if(!s){toast('Crée d’abord une section.');return}
      s.pages.push(freshPage(p,stamp()));D.cur.p=s.pages.length-1;
    }
    save();render();toast('Copie restaurée.');
  });
}
async function openHistory(more){
  if(!CFG){toast('Pas de connexion à GitHub.');return}
  if(!more){VH.page=1;VH.items=[]}
  function paint(){
    var items=VH.items.filter(function(c){return !VH.snapOnly||/^📸/.test(c.commit.message)});
    openModal('🕘 Historique des versions',
      '<div class="row" style="margin-bottom:8px"><button class="btn" data-vh="snap">📸 Créer un point de restauration</button>'+
      '<label style="display:flex;gap:6px;align-items:center;margin:0"><input type="checkbox" id="vsn"'+(VH.snapOnly?' checked':'')+' style="width:auto"> Points de restauration seulement</label></div>'+
      (items.length?items.map(function(c){
        var snap=/^📸/.test(c.commit.message);
        return '<div class="mrow"><div class="mi"><b>'+(snap?esc(c.commit.message):'Synchronisation')+'</b><small>'+fmtDt(c.commit.author.date)+'</small></div><button class="btn sm" data-vh="view" data-sha="'+c.sha+'" data-d="'+fmtDt(c.commit.author.date)+'">Voir</button></div>';
      }).join(''):'<p style="color:var(--muted)">Aucune version à afficher.</p>')+
      '<div style="margin-top:8px"><button class="btn sm" data-vh="more">Charger les versions plus anciennes…</button></div>',
      async function(ev){
        var b=ev.target.closest('[data-vh]');if(!b)return;
        var a=b.dataset.vh;
        if(a=='snap')ask('Nom du point de restauration','Avant modification',function(v){if(v.trim()){closeModal();makeSnapshot(v.trim())}});
        else if(a=='more'){VH.page++;openHistory(true)}
        else if(a=='view'){
          toast('Chargement de la version…');
          try{showSnapshot(await docAt(b.dataset.sha),b.dataset.d)}catch(e){toast('Impossible : '+(e.message||e))}
        }
      });
    var cb=$('vsn');if(cb)cb.onchange=function(){VH.snapOnly=this.checked;paint()};
  }
  try{
    toast('Chargement de l’historique…');
    var list=await listCommits(VH.page);
    VH.items=VH.items.concat(list);
    if(!list.length&&more)toast('Pas de versions plus anciennes.');
    paint();
  }catch(e){toast('Historique indisponible ('+(e.message||e)+').')}
}
ACTIONS.hist=function(){openHistory()};

/* ---- poids des données et compression des images ---- */
function eachPage(fn){
  D.nbs.forEach(function(n){n.sections.forEach(function(s){s.pages.forEach(fn)})});
  (D.trash||[]).forEach(function(e){
    if(e.kind=='page')fn(e.data);
    else if(e.kind=='section')(e.data.pages||[]).forEach(fn);
    else(e.data.sections||[]).forEach(function(s){(s.pages||[]).forEach(fn)});
  });
  (D.tpl||[]).forEach(function(t){fn(t.data)});
}
function imageIds(){
  var ids={};
  eachPage(function(p){(p.boxes||[]).forEach(function(b){if(b.k=='i'&&/^idb:/.test(b.c))ids[b.c.slice(4)]=1})});
  return Object.keys(ids);
}
async function compressImages(minKB){
  ser();
  var ids=imageIds(),map={},done=0,before=0,after=0,i;
  for(i=0;i<ids.length;i++){
    var sb=await imGet(ids[i]);
    if(!sb||sb.length<minKB*1024)continue;
    var bytes=await unsealB(sb),blobUrl=URL.createObjectURL(new Blob([bytes],{type:'image/jpeg'}));
    try{
      var im=await loadImg(blobUrl),k=Math.min(1,900/im.naturalWidth),c=document.createElement('canvas');
      c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);
      var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);
      var du=c.toDataURL('image/jpeg',0.7),nb2=ub(du.split(',')[1]);
      if(nb2.length>bytes.length*0.85)continue;               // gain trop faible : on garde l'original
      var nid=uid();await storeImg(nid,du);
      map[ids[i]]=nid;done++;before+=bytes.length;after+=nb2.length;
    }catch(e){}finally{URL.revokeObjectURL(blobUrl)}
    $('wtp')&&($('wtp').textContent='Compression… '+(i+1)+' / '+ids.length);
  }
  if(done){
    eachPage(function(p){(p.boxes||[]).forEach(function(b){if(b.k=='i'&&/^idb:/.test(b.c)&&map[b.c.slice(4)])b.c='idb:'+map[b.c.slice(4)]})});
    save();render();
  }
  return {done:done,before:before,after:after};
}
function mo(n){return (n/1048576).toFixed(1).replace('.',',')+' Mo'}
async function openWeight(){
  ser();
  var ids=imageIds(),total=0,big=0,i;
  for(i=0;i<ids.length;i++){var sb=await imGet(ids[i]);if(sb){total+=sb.length;if(sb.length>300*1024)big++}}
  var docKB=Math.round(docStr().length/1024);
  openModal('📦 Poids des données',
    '<div class="mrow"><div class="mi"><b>Texte et tableaux (envoyés à chaque synchro)</b><small>'+docKB+' Ko</small></div></div>'+
    '<div class="mrow"><div class="mi"><b>Images ('+ids.length+')</b><small>'+mo(total)+' sur cet appareil · '+big+' de plus de 300 Ko</small></div></div>'+
    '<p style="color:var(--muted)">Les images sont envoyées une seule fois. Compresser les plus lourdes (réduites à 900 px, qualité 70 %) accélère le chargement sur 4G et allège le dépôt. Les anciennes versions restent sur GitHub.</p>'+
    '<div class="row"><button class="btn" data-wt="go"'+(big?'':' disabled')+'>Compresser les '+big+' image'+(big>1?'s':'')+' de plus de 300 Ko</button></div><div id="wtp" style="margin-top:8px;color:var(--muted)"></div>',
    async function(ev){
      if(!ev.target.closest('[data-wt]'))return;
      var r=await compressImages(300);
      toast(r.done?r.done+' image'+(r.done>1?'s':'')+' compressée'+(r.done>1?'s':'')+' : '+mo(r.before)+' → '+mo(r.after):'Rien à compresser.');
      openWeight();
    });
}
ACTIONS.weight=openWeight;
