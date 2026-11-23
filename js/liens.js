/* Liens entre pages et sommaire automatique */

function allPages(){
  var out=[];
  D.nbs.forEach(function(n,ni){n.sections.forEach(function(s,si){s.pages.forEach(function(p,pi){
    out.push({ni:ni,si:si,pi:pi,p:p,path:n.name+' › '+s.name});
  })})});
  return out;
}
function goPage(id){
  ser();
  var f=allPages().find(function(x){return x.p.id==id});
  if(!f){toast('Cette page n’existe plus.');return}
  D.cur={n:f.ni,s:f.si,p:f.pi};
  save();render();
}
function linkHtml(p){
  return '<a class="plink" contenteditable="false" data-pl="'+p.id+'">📄 '+esc(p.title)+'</a>';
}
function insertLink(p){
  var h=linkHtml(p)+'&nbsp;';
  if(rest()){document.execCommand('insertHTML',false,h);ser()}
  else addBox('t',30,nextY(),260,h);
}
function openLinkPicker(){
  if(!$('page')){toast('Ouvre d’abord une page.');return}
  function list(q){
    q=nz(q||'');
    return allPages().filter(function(x){return !q||nz(x.p.title+' '+x.path).indexOf(q)>=0}).slice(0,60).map(function(x){
      return '<div class="mit" data-pl="'+x.p.id+'"><b>'+esc(x.p.title)+'</b> <small style="color:var(--muted)">'+esc(x.path)+'</small></div>';
    }).join('')||'<p style="color:var(--muted)">Aucune page.</p>';
  }
  openModal('🔗 Lien vers une page','<input id="lkq" placeholder="Filtrer les pages…" autocomplete="off" style="margin-bottom:8px"><div id="lkl">'+list('')+'</div>',function(ev){
    var it=ev.target.closest('[data-pl]');if(!it)return;
    var f=allPages().find(function(x){return x.p.id==it.dataset.pl});
    closeModal();if(f)insertLink(f.p);
  });
  $('lkq').oninput=function(){$('lkl').innerHTML=list(this.value)};
}

/* sommaire : une zone de texte avec un lien vers chaque page (mis à jour si la page en a déjà un) */
function makeToc(scope){
  ser();
  var n=nb(),html;
  function line(p){return '<div>'+linkHtml(p)+'</div>'}
  if(scope=='sec')html='<div data-toc="1"><b>Sommaire — '+esc(sec().name)+'</b></div>'+sec().pages.map(line).join('');
  else html='<div data-toc="1"><b>Sommaire — '+esc(n.name)+'</b></div>'+
    n.sections.map(function(s){return '<div><b>'+esc(s.name)+'</b></div>'+s.pages.map(line).join('')}).join('');
  var ex=document.querySelector('#page .box .bc [data-toc]');
  if(ex){ex.closest('.bc').innerHTML=html;ser();toast('Sommaire mis à jour.')}
  else addBox('t',30,nextY(),320,html);
}
function openToc(){
  if(!$('page')){toast('Ouvre d’abord une page.');return}
  openModal('📑 Sommaire','<p style="margin:0 0 10px;color:var(--muted)">Crée une zone avec un lien vers chaque page. Si la page a déjà un sommaire, il est mis à jour.</p>'+
    '<div class="row"><button class="btn" data-sc="sec">Pages de cette section</button><button class="btn" data-sc="nb">Toutes les pages de ce carnet</button></div>',
    function(ev){var b=ev.target.closest('[data-sc]');if(!b)return;closeModal();makeToc(b.dataset.sc)});
}

/* les titres des liens suivent les pages renommées ; un lien vers une page supprimée est signalé */
function refreshLinks(){
  var pages={};allPages().forEach(function(x){pages[x.p.id]=x.p});
  [].forEach.call(document.querySelectorAll('#page .plink'),function(a){
    var p=pages[a.dataset.pl];
    a.classList.toggle('dead',!p);
    a.textContent=p?'📄 '+p.title:'⚠ page supprimée';
  });
}
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('.plink');
  if(a&&!a.classList.contains('dead')){e.preventDefault();goPage(a.dataset.pl)}
});
POST.push(refreshLinks);
ACTIONS.link=openLinkPicker;
ACTIONS.toc=openToc;
