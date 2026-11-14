/* Modèles de pages : enregistrer une page type et la réutiliser dans n'importe quelle section */

function saveTemplate(){
  var p=pg();
  if(!p){toast('Ouvre d’abord la page à enregistrer comme modèle.');return}
  ser();
  ask('Nom du modèle',p.title,function(v){
    v=v.trim();if(!v)return;
    D.tpl=D.tpl||[];
    D.tpl.push({id:uid(),name:v,at:Date.now(),data:{title:p.title,sub:p.sub,tab:p.tab,boxes:JSON.parse(JSON.stringify(p.boxes||[]))}});
    save();toast('Modèle « '+v+' » enregistré.');openTemplates();
  });
}
function useTemplate(id){
  var t=(D.tpl||[]).find(function(x){return x.id==id}),s=sec();
  if(!t||!s){toast('Crée d’abord une section pour y ajouter la page.');return}
  ser();
  var d=JSON.parse(JSON.stringify(t.data));
  d.boxes=(d.boxes||[]).map(function(b){b.id=uid();return b});
  var p={id:uid(),title:d.title||t.name,sub:d.sub||'',tab:d.tab||null,boxes:d.boxes,u:Date.now()};
  s.pages.push(p);D.cur.p=s.pages.length-1;
  save();render();closeModal();
  toast('Page créée depuis « '+t.name+' ».');
}
function openTemplates(){
  var T=(D.tpl||[]).slice().sort(function(a,b){return b.at-a.at}),
      html='<div style="margin-bottom:8px"><button class="btn" data-tp="save">💾 Enregistrer la page actuelle comme modèle</button></div>';
  if(!T.length)html+='<p style="color:var(--muted)">Aucun modèle pour l’instant. Prépare une page (semaine type, compte rendu de TP, plan de rapport…) puis enregistre-la ici.</p>';
  else html+=T.map(function(t){
    return '<div class="mrow"><span>📋</span><div class="mi"><b>'+esc(t.name)+'</b><small>'+((t.data.boxes||[]).length)+' objet(s)'+(t.data.tab?' · avec tableau':'')+'</small></div>'+
      '<button class="btn sm" data-tp="use" data-id="'+t.id+'">Nouvelle page</button>'+
      '<button class="btn sm" data-tp="del" data-id="'+t.id+'" title="Supprimer le modèle">✕</button></div>';
  }).join('');
  openModal('📋 Modèles de pages',html,function(ev){
    var b=ev.target.closest('[data-tp]');if(!b)return;
    var a=b.dataset.tp,id=b.dataset.id;
    if(a=='save')saveTemplate();
    else if(a=='use')useTemplate(id);
    else if(a=='del')conf('Supprimer ce modèle ?',function(){D.tpl=D.tpl.filter(function(x){return x.id!=id});save();openTemplates()});
  });
}
ACTIONS.tpl=openTemplates;
