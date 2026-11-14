/* Corbeille : pages, sections et carnets supprimés, récupérables pendant 30 jours (synchronisée entre appareils) */

var KIND={page:['📄','Page'],section:['📁','Section'],notebook:['📓','Carnet']};

function trashAdd(kind,data,from){
  D.trash=D.trash||[];
  D.trash.push({id:uid(),kind:kind,at:Date.now(),from:from||{},label:data.title||data.name||'(sans nom)',data:JSON.parse(JSON.stringify(data))});
}
function restoreTrash(id){
  var e=(D.trash||[]).find(function(x){return x.id==id});
  if(!e)return;
  ser();
  var data=JSON.parse(JSON.stringify(e.data));
  if(e.kind=='notebook')D.nbs.push(data);
  else{
    var nb=D.nbs.find(function(n){return n.id==e.from.nb})||D.nbs[0];
    if(!nb){nb=newNb('Restauré');D.nbs.push(nb)}
    if(e.kind=='section')nb.sections.push(data);
    else{
      var sc=nb.sections.find(function(s){return s.id==e.from.sec})||nb.sections[0];
      if(!sc){sc={id:uid(),name:'Restauré',color:COLORS[0],pages:[]};nb.sections.push(sc)}
      sc.pages.push(data);
    }
  }
  D.trash=D.trash.filter(function(x){return x.id!=id});
  save();render();
  toast('« '+e.label+' » restauré.');
}
function openTrash(){
  purgeTrash();
  var T=(D.trash||[]).slice().sort(function(a,b){return b.at-a.at}),html;
  if(!T.length)html='<p style="color:var(--muted)">La corbeille est vide. Les pages, sections et carnets supprimés restent ici 30 jours.</p>';
  else html='<p style="color:var(--muted);margin:0 0 6px">Conservés 30 jours, puis supprimés définitivement.</p>'+
    T.map(function(e){
      var k=KIND[e.kind]||['•',''],left=Math.max(0,Math.ceil((e.at+30*864e5-Date.now())/864e5)),
          extra=e.kind=='section'?' · '+(e.data.pages||[]).length+' page(s)':e.kind=='notebook'?' · '+(e.data.sections||[]).length+' section(s)':'';
      return '<div class="mrow"><span>'+k[0]+'</span><div class="mi"><b>'+esc(e.label)+'</b><small>'+k[1]+extra+' · supprimé le '+new Date(e.at).toLocaleDateString('fr-FR')+' · encore '+left+' j</small></div>'+
        '<button class="btn sm" data-tr="rest" data-id="'+e.id+'">Restaurer</button>'+
        '<button class="btn sm" data-tr="del" data-id="'+e.id+'" title="Supprimer définitivement">✕</button></div>';
    }).join('')+'<div style="margin-top:10px"><button class="btn sm" data-tr="empty">Vider la corbeille</button></div>';
  openModal('🗑 Corbeille',html,function(ev){
    var b=ev.target.closest('[data-tr]');if(!b)return;
    var a=b.dataset.tr,id=b.dataset.id;
    if(a=='rest'){restoreTrash(id);openTrash()}
    else if(a=='del'){D.trash=D.trash.filter(function(x){return x.id!=id});save();openTrash()}
    else if(a=='empty')conf('Vider définitivement la corbeille ?',function(){D.trash=[];save();openTrash()});
  });
}
ACTIONS.trash=openTrash;
POST.push(function(){
  var b=document.querySelector('[data-a="trash"]');
  if(b){var n=(D.trash||[]).length;b.textContent='🗑 Corbeille'+(n?' ('+n+')':'')}
});
