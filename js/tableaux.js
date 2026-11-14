/* Tableaux (lignes, colonnes, fusion) et mise en forme du texte */
/* ---- tables : grille, lignes, colonnes, fusion ---- */
function grid(t){var g=[];[].forEach.call(t.rows,function(tr,r){g[r]=g[r]||[];var c=0;[].forEach.call(tr.cells,function(td){while(g[r][c])c++;for(var i=0;i<td.rowSpan;i++){g[r+i]=g[r+i]||[];for(var j=0;j<td.colSpan;j++)g[r+i][c+j]={td:td,r:r,c:c}}c+=td.colSpan})});return g}
function pos(g,td){for(var r=0;r<g.length;r++){var row=g[r]||[];for(var c=0;c<row.length;c++)if(row[c]&&row[c].td===td)return row[c]}return null}
function rect(){if(!sel||!sel.t.isConnected)return null;var g=grid(sel.t),A=pos(g,sel.a),B=pos(g,sel.b);if(!A||!B)return null;
 var r1=Math.min(A.r,B.r),c1=Math.min(A.c,B.c),r2=Math.max(A.r+A.td.rowSpan-1,B.r+B.td.rowSpan-1),c2=Math.max(A.c+A.td.colSpan-1,B.c+B.td.colSpan-1),ch=1;
 while(ch){ch=0;for(var r=r1;r<=r2;r++)for(var c=c1;c<=c2;c++){var x=g[r]&&g[r][c];if(!x)continue;var xr=x.r+x.td.rowSpan-1,xc=x.c+x.td.colSpan-1;if(x.r<r1){r1=x.r;ch=1}if(xr>r2){r2=xr;ch=1}if(x.c<c1){c1=x.c;ch=1}if(xc>c2){c2=xc;ch=1}}}
 return {g:g,r1:r1,r2:r2,c1:c1,c2:c2}}
function selCells(){var q=rect(),o=[];if(!q)return o;for(var r=q.r1;r<=q.r2;r++)for(var c=q.c1;c<=q.c2;c++){var x=q.g[r]&&q.g[r][c];if(x&&o.indexOf(x.td)<0)o.push(x.td)}return o}
function marks(){[].forEach.call(document.querySelectorAll('.ms'),function(e){e.classList.remove('ms')});var cs=selCells();if(cs.length>1)cs.forEach(function(e){e.classList.add('ms')})}
function mkTd(t){var d=document.createElement('td');if(t.classList.contains('w'))d.setAttribute('contenteditable','');return d}
function fixW(t){var cg=t.querySelector('colgroup');if(!cg)return;var s=0;[].forEach.call(cg.children,function(c){s+=parseInt(c.style.width)||80});t.style.width=s+'px'}
function addRow(t,g,idx){var nr=t.insertRow(idx),n=(g[0]||[]).length,seen=[];for(var c=0;c<n;c++){var a=g[idx-1]&&g[idx-1][c],b=g[idx]&&g[idx][c];if(a&&b&&a.td===b.td){if(seen.indexOf(a.td)<0){seen.push(a.td);a.td.rowSpan++}}else nr.appendChild(mkTd(t))}}
function addCol(t,g,idx){var seen=[];g.forEach(function(row,r){if(!row||!t.rows[r])return;var a=row[idx-1],b=row[idx];if(a&&b&&a.td===b.td){if(seen.indexOf(a.td)<0){seen.push(a.td);a.td.colSpan++}}else{var ref=null;for(var c=idx;c<row.length;c++){var y=row[c];if(y&&y.r==r){ref=y.td;break}}t.rows[r].insertBefore(mkTd(t),ref)}});var cg=t.querySelector('colgroup');if(cg){var cl=document.createElement('col');cl.style.width='80px';cg.insertBefore(cl,cg.children[idx]||null);fixW(t)}}
function delRow(t,g,r){var tr=t.rows[r];if(!tr||t.rows.length<2)return;var seen=[];(g[r]||[]).forEach(function(x){if(!x||seen.indexOf(x.td)>=0)return;seen.push(x.td);if(x.r<r)x.td.rowSpan=Math.max(1,x.td.rowSpan-1);else if(x.td.rowSpan>1&&t.rows[r+1]){var ref=null,row=g[r+1]||[];for(var c=x.c+1;c<row.length;c++){var y=row[c];if(y&&y.r==r+1){ref=y.td;break}}x.td.rowSpan--;t.rows[r+1].insertBefore(x.td,ref)}});tr.remove()}
function delCol(t,g,c){if((g[0]||[]).length<2)return;var seen=[];g.forEach(function(row){var x=row&&row[c];if(!x||seen.indexOf(x.td)>=0)return;seen.push(x.td);if(x.td.colSpan>1)x.td.colSpan--;else x.td.remove()});var cg=t.querySelector('colgroup');if(cg&&cg.children[c])cg.children[c].remove();fixW(t)}
function merge(){var q=rect();if(!q)return;var f=q.g[q.r1][q.c1].td,o=selCells();if(o.length<2)return;o.forEach(function(td){if(td!==f){if(td.textContent.trim())f.innerHTML+=(f.textContent.trim()?'<br>':'')+td.innerHTML;td.remove()}});f.rowSpan=q.r2-q.r1+1;f.colSpan=q.c2-q.c1+1}
function split(){var q=rect();if(!q)return;var td=sel.a,x=pos(q.g,td);if(!x||(td.rowSpan<2&&td.colSpan<2))return;var rs=td.rowSpan,cs=td.colSpan;td.rowSpan=1;td.colSpan=1;
 for(var r=x.r;r<x.r+rs;r++)for(var c=x.c;c<x.c+cs;c++){if(r==x.r&&c==x.c)continue;var ref=null,row=q.g[r]||[];for(var k=c+1;k<row.length;k++){var y=row[k];if(y&&y.r==r&&y.td!==td){ref=y.td;break}}if(t0(sel.t).rows[r])t0(sel.t).rows[r].insertBefore(mkTd(sel.t),ref)}}
function t0(t){return t}
function tbOp(op){var q=rect();if(!q){toast('Clique d’abord dans une cellule du tableau.');return}if(op=='x'){rangeMode=true;toast('Touche maintenant la cellule de fin.');return}if(op=='d'){nMode='fill';nOpen();return}var t=sel.t;
 if(op=='ar')addRow(t,q.g,q.r2+1);
 else if(op=='ac')addCol(t,q.g,q.c2+1);
 else if(op=='dr'){for(var r=q.r2;r>=q.r1;r--)delRow(t,grid(t),r)}
 else if(op=='dc'){for(var c=q.c2;c>=q.c1;c--)delCol(t,grid(t),c)}
 else if(op=='m')merge();else if(op=='s')split();
 else if(op=='g')selCells().forEach(function(td){var on=td.classList.contains('g')||td.style.background=='rgb(128, 128, 128)';td.classList.remove('g');td.style.background=on?'':'#808080'});
 sel=null;marks();ser()}
/* ---- mise en forme du texte ---- */
function cellOf(n){n=n&&(n.nodeType==1?n:n.parentNode);return n&&n.closest?n.closest('td,th'):null}
document.addEventListener('selectionchange',function(){var s=getSelection();if(!s.rangeCount)return;var r=s.getRangeAt(0),n=r.commonAncestorContainer;n=n.nodeType==1?n:n.parentNode;if(!n.closest||!n.closest('#page'))return;sr=r.cloneRange();
 var a=cellOf(s.anchorNode),b=cellOf(s.focusNode);if(rangeMode&&a&&sel&&a.closest('table')===sel.t&&a!==sel.a){sel={t:sel.t,a:sel.a,b:a};rangeMode=false;marks();return}if(a&&b&&a.closest('table')===b.closest('table'))sel={t:a.closest('table'),a:a,b:b};else sel=a?{t:a.closest('table'),a:a,b:a}:null;marks()});
document.addEventListener('mousedown',function(e){var f=e.target.closest&&e.target.closest('#fb,#pop');if(f&&!/SELECT|INPUT|LABEL/.test(e.target.tagName))e.preventDefault()});
function rest(){if(!sr)return false;var n=sr.commonAncestorContainer;n=n.nodeType==1?n:n.parentNode;var ed=n.closest&&n.closest('[contenteditable]');if(!ed)return false;ed.focus({preventScroll:true});var s=getSelection();s.removeAllRanges();s.addRange(sr);return true}
var PROP={b:'fontWeight',i:'fontStyle',u:'textDecoration',col:'color',fam:'fontFamily',sz:'fontSize',h:'background'};
function fmtT(k,v){
 var cs=selCells(),cell=cs.length>1||(cs.length==1&&(!sr||sr.collapsed));
 if(cell){cs.forEach(function(td){var st=td.style,p=PROP[k];
  if(k=='b')st.fontWeight=st.fontWeight=='bold'?'normal':'bold';
  else if(k=='i')st.fontStyle=st.fontStyle=='italic'?'normal':'italic';
  else if(k=='u')st.textDecoration=st.textDecoration=='underline'?'none':'underline';
  else if(k=='sz')st.fontSize=v+'px';
  else if(p)st[p]=v;
  else st.textAlign={l:'left',c:'center',r:'right'}[k];
  if(p&&k!='h')[].forEach.call(td.querySelectorAll('[style]'),function(e){e.style[p]=''})})}
 else if(rest()){var X=function(c,a){document.execCommand(c,false,a)};
  if(k=='b')X('bold');else if(k=='i')X('italic');else if(k=='u')X('underline');
  else if(k=='col'){X('styleWithCSS',true);X('foreColor',v)}
  else if(k=='h'){X('styleWithCSS',true);X('hiliteColor',v||'transparent')}
  else if(k=='fam'){X('styleWithCSS',true);X('fontName',v)}
  else if(k=='sz'){X('styleWithCSS',false);X('fontSize','7');[].forEach.call(document.querySelectorAll('#page font[size="7"]'),function(f){var sp=document.createElement('span');sp.style.fontSize=v+'px';while(f.firstChild)sp.appendChild(f.firstChild);f.replaceWith(sp)})}
  else X({l:'justifyLeft',c:'justifyCenter',r:'justifyRight'}[k])}
 ser()}
document.addEventListener('change',function(e){var i=e.target.id,v=e.target.value;
 if(i=='fF'&&v)fmtT('fam',v);if(i=='fS'&&v)fmtT('sz',v);if(i=='cT')fmtT('col',v);if(i=='cH')fmtT('h',v);
 if(i=='cB'){selCells().forEach(function(td){td.style.background=v});ser()}
 if(i=='fF'||i=='fS')e.target.value=''});
