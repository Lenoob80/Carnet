/* Dates automatiques, sélection multiple, export / import */
var nMode='new',JL=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],JC=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],MC=['Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];
function fd(d,f){var j=d.getUTCDay(),dd=String(d.getUTCDate()).padStart(2,'0'),m=d.getUTCMonth();return f=='n'?dd+'/'+String(m+1).padStart(2,'0')+'/'+d.getUTCFullYear():f=='l'?JL[j]+' '+dd+' '+MOIS[m]:f=='c'?JC[j]+' '+dd+' '+MC[m]:f=='j'?JL[j]:dd+' '+MOIS[m]+' '+d.getUTCFullYear()}
function seqD(st,n,step,nw){var o=[],d=new Date(st+'T00:00:00Z');if(isNaN(d))d=new Date(new Date().toISOString().slice(0,10)+'T00:00:00Z');function sk(){while(nw&&(d.getUTCDay()==0||d.getUTCDay()==6))d.setUTCDate(d.getUTCDate()+1)}sk();for(var i=0;i<n;i++){o.push(new Date(d));d.setUTCDate(d.getUTCDate()+step);sk()}return o}
function nShow(){$('nDt').style.display=(nMode=='fill'||$('nM').value)?'block':'none'}
function nOpen(){var f=nMode=='fill';$('dnT').textContent=f?'Remplir avec des dates':'Nouveau tableau';[].forEach.call(document.querySelectorAll('#dn .nf'),function(e){e.style.display=f?'none':''});$('nOk').textContent=f?'Remplir':'Créer le tableau';if(!$('nD').value)$('nD').value=new Date().toISOString().slice(0,10);nShow();$('dn').showModal()}
$('nM').onchange=nShow;$('nNo').onclick=function(){$('dn').close()};
$('nOk').onclick=function(){
 var f=$('nF').value,st=$('nD').value,p=Math.max(1,+$('nP').value||1),nw=$('nW').checked;
 if(nMode=='fill'){var cs=selCells(),ds=seqD(st,cs.length,p,nw);cs.forEach(function(td,i){td.textContent=fd(ds[i],f)});$('dn').close();sel=null;marks();ser();return}
 var R=Math.min(100,Math.max(1,+$('nR').value||1)),C=Math.min(30,Math.max(1,+$('nC').value||1)),m=$('nM').value,dc=m=='c'?seqD(st,C-1,p,nw):[],dr=m=='r'?seqD(st,R,p,nw):[],h='<table class="t1"><tbody><tr>';
 for(var c=0;c<C;c++)h+='<th>'+(m=='c'?(c?fd(dc[c-1],f):''):m=='r'&&c==0?'Date':'Titre '+(c+1))+'</th>';
 h+='</tr>';
 for(var r=0;r<R;r++){h+='<tr>';for(var c2=0;c2<C;c2++)h+='<td>'+(m=='r'&&c2==0?'<b>'+fd(dr[r],f)+'</b>':'')+'</td>';h+='</tr>'}
 h+='</tbody></table>';
 $('dn').close();if($('page'))addBox('t',30,nextY(),Math.min(C*110+16,900),h)
};
var bulk=null,bl=-1;
function bbar(){return '<div class="top"><button class="btn sm" data-a="ball">Tout</button><button class="btn sm" data-a="bnone">Aucun</button><button class="btn sm" id="bdel" data-a="bdel">🗑 Supprimer (0)</button><button class="btn sm" data-a="bend">Terminer</button></div><div style="color:var(--muted);font-size:12px;margin-bottom:6px">Maj + clic : sélectionne une plage.</div>'}
function ck(k,i){return bulk&&bulk.k==k?'<input type="checkbox" class="ck" data-k="'+k+'" data-i="'+i+'"'+(bulk.set[i]?' checked':'')+'>':''}
function bpick(k,i,sh){var set=bulk.set,on=!set[i];if(sh&&bl>=0){for(var x=Math.min(bl,i);x<=Math.max(bl,i);x++)set[x]=on}else set[i]=on;bl=i;setTimeout(bsync,0)}
function bsync(){if(!bulk)return 0;var n=0;for(var x in bulk.set)if(bulk.set[x])n++;[].forEach.call(document.querySelectorAll('.ck'),function(c){c.checked=!!bulk.set[c.dataset.i]});var b=$('bdel');if(b)b.textContent='🗑 Supprimer ('+n+')';return n}
function dxMode(x){$('dxA').readOnly=x;$('dxF').style.display=x?'none':'';$('dxOk').style.display=x?'none':'';$('dxC').style.display=x?'':'none';$('dxD').style.display=x?'':'none'}
$('bX').onclick=function(){ser();$('dxT').textContent='Exporter mes carnets';$('dxP').textContent='Copie ce texte (ou télécharge-le), puis colle-le avec « Importer » dans l’autre version.';$('dxA').value='Préparation de l’export…';dxMode(true);$('dx').showModal();expData().then(function(t){$('dxA').value=t})};
$('bI').onclick=function(){$('dxT').textContent='Importer des carnets';$('dxP').textContent='Colle le texte exporté ou choisis le fichier. Cela remplace tous les carnets actuels.';$('dxA').value='';dxMode(false);$('dx').showModal()};
$('dxNo').onclick=function(){$('dx').close()};
$('dxC').onclick=function(){$('dxA').select();try{navigator.clipboard.writeText($('dxA').value)}catch(e){}try{document.execCommand('copy')}catch(e){}toast('Copié.')};
$('dxD').onclick=function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([$('dxA').value],{type:'application/json'}));a.download='carnet-sauvegarde.json';a.click()};
$('dxF').onchange=function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(){$('dxA').value=r.result};r.readAsText(f)};
$('dxOk').onclick=function(){var o;try{o=JSON.parse($('dxA').value)}catch(e){toast('Texte invalide.');return}var nbs=o.nbs||(o.sections&&[{id:uid(),name:'Rapport de stage',sections:o.sections}]);if(!nbs||!nbs.length){toast('Aucun carnet trouvé.');return}$('dx').close();conf('Remplacer tous les carnets par ceux importés ?',function(){D.nbs=fix({nbs:nbs}).nbs;D.cur={n:0,s:0,p:0};migImgs().then(function(){save();render()})})};
