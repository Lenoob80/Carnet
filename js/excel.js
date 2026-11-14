/* Import Excel / CSV avec couleurs, polices et cellules fusionnées */
/* ---- import Excel avec styles, couleurs, fusions ---- */
function tint(hex,t){var r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,h=0,s=0,d=mx-mn;
 if(d){s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx==r?(g-b)/d+(g<b?6:0):mx==g?(b-r)/d+2:(r-g)/d+4;h/=6}
 l=t<0?l*(1+t):l*(1-t)+t;
 function f(p,q,k){if(k<0)k+=1;if(k>1)k-=1;return k<1/6?p+(q-p)*6*k:k<.5?q:k<2/3?p+(q-p)*(2/3-k)*6:p}
 var q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return '#'+[f(p,q,h+1/3),f(p,q,h),f(p,q,h-1/3)].map(function(v){return ('0'+Math.round(v*255).toString(16)).slice(-2)}).join('')}
var IDX=['#000000','#ffffff','#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff'];
function colOf(el){if(!el||el.getAttribute('auto'))return null;var v=el.getAttribute('rgb'),t=el.getAttribute('theme'),i=el.getAttribute('indexed'),n=parseFloat(el.getAttribute('tint'))||0,h=null;
 if(v){if(/^[0-9a-f]{6,8}$/i.test(v))h='#'+v.slice(-6)}else if(t!==null){var k=+t;k=k==0?1:k==1?0:k==2?3:k==3?2:k;h=TH[k]||null}else if(i!==null&&+i<16)h=IDX[+i%8];
 return h&&n?tint(h,n):h}
function fontOf(el){function q(t){return el.getElementsByTagName(t)[0]}function fl(t){var e=q(t);return e?!/^(0|false)$/.test(e.getAttribute('val')||''):undefined}var n=q('name')||q('rFont'),s=q('sz');return {b:fl('b'),i:fl('i'),u:q('u')?1:0,sz:s?+s.getAttribute('val'):0,col:colOf(q('color')),n:n&&n.getAttribute('val')}}
function fcss(f,k){var c='';if(f.n)c+="font-family:'"+f.n.replace(/['"<>;&\\]/g,'')+"',sans-serif;";if(f.sz)c+='font-size:'+Math.round(f.sz*1.333*k*10)/10+'px;';if(f.b)c+='font-weight:bold;';if(f.i)c+='font-style:italic;';if(f.u)c+='text-decoration:underline;';if(f.col)c+='color:'+f.col+';';return c}
function sstHtml(si,k){var h='';[].forEach.call(si.children,function(ch){var nm=ch.tagName;if(nm=='t')h+=esc(ch.textContent).replace(/\n/g,'<br>');else if(nm=='r'){var rp=ch.getElementsByTagName('rPr')[0],t=ch.getElementsByTagName('t')[0];h+='<span style="'+(rp?fcss(fontOf(rp),k):'')+'">'+esc(t?t.textContent:'').replace(/\n/g,'<br>')+'</span>'}});return h}
function a1(s){var m=/^([A-Z]+)(\d+)$/.exec(s),c=0;m[1].split('').forEach(function(h){c=c*26+h.charCodeAt(0)-64});return [m[2]-1,c-1]}
function impX(buf){
 var wb=XLSX.read(buf,{type:'array'});
 return JSZip.loadAsync(buf).then(function(z){
  function rd(p){var f=z.file(p);return f?f.async('string'):Promise.resolve('')}
  return Promise.all(['xl/workbook.xml','xl/_rels/workbook.xml.rels','xl/styles.xml','xl/sharedStrings.xml','xl/theme/theme1.xml'].map(rd)).then(function(a){
   var X=a.map(function(s){return s?new DOMParser().parseFromString(s,'application/xml'):null}),W=X[0],R=X[1],S=X[2],T=X[3],H=X[4];
   if(!W||!S)throw 0;
   var sc=H&&H.getElementsByTagName('a:clrScheme')[0];
   TH=sc?[].map.call(sc.children,function(c){var e=c.firstElementChild;return '#'+(e.getAttribute('val')||e.getAttribute('lastClr'))}):[];
   function all(tag){return [].slice.call(S.getElementsByTagName(tag)[0].children)}
   var fonts=all('fonts').map(fontOf),
   fills=all('fills').map(function(f){var p=f.getElementsByTagName('patternFill')[0];return p&&p.getAttribute('patternType')=='solid'?colOf(p.getElementsByTagName('fgColor')[0]):null}),
   bords=all('borders').map(function(b){var o={};['left','right','top','bottom'].forEach(function(sd){var e=b.getElementsByTagName(sd)[0],st=e&&e.getAttribute('style');o[sd]=st?'border-'+sd+':'+(/medium|thick/.test(st)?2:1)+'px solid '+(colOf(e.getElementsByTagName('color')[0])||'#000')+';':''});return o}),
   xfs=all('cellXfs').map(function(x){var al=x.getElementsByTagName('alignment')[0];return {f:+x.getAttribute('fontId')||0,fi:+x.getAttribute('fillId')||0,b:+x.getAttribute('borderId')||0,h:al&&al.getAttribute('horizontal'),v:al&&al.getAttribute('vertical')}}),
   sst=T?[].slice.call(T.getElementsByTagName('si')):[],rel={};
   [].forEach.call(R?R.getElementsByTagName('Relationship'):[],function(r){rel[r.getAttribute('Id')]=r.getAttribute('Target')});
   var shs=[].slice.call(W.getElementsByTagName('sheet')).filter(function(s){return !/hidden/i.test(s.getAttribute('state')||'')}).slice(0,5);
   return Promise.all(shs.map(function(sh){return rd((rel[sh.getAttribute('r:id')]||'').replace(/^\/?(xl\/)?/,'xl/'))})).then(function(xs){
    var out=0;
    xs.forEach(function(xm,si){if(!xm)return;
     var Q=new DOMParser().parseFromString(xm,'application/xml'),nm=shs[si].getAttribute('name'),ws=wb.Sheets[nm]||{},cells={},hR={},hC={},cW={},rH={},mg=[],r1=1e9,r2=-1,c1=1e9,c2=-1;
     [].forEach.call(Q.getElementsByTagName('col'),function(c){var lo=+c.getAttribute('min'),hi=Math.min(+c.getAttribute('max'),200),w=+c.getAttribute('width')||8.43;for(var i=lo-1;i<hi;i++){cW[i]=Math.round(w*7+5);if(c.getAttribute('hidden')=='1')hC[i]=1}});
     [].forEach.call(Q.getElementsByTagName('row'),function(rw){var r=+rw.getAttribute('r')-1;if(rw.getAttribute('hidden')=='1')hR[r]=1;if(rw.getAttribute('ht'))rH[r]=+rw.getAttribute('ht')*1.333;
      [].forEach.call(rw.getElementsByTagName('c'),function(c){var p=c.getAttribute('r');if(!p)return;var rc=a1(p),t=c.getAttribute('t'),v=c.getElementsByTagName('v')[0],is=c.getElementsByTagName('is')[0],o={s:+c.getAttribute('s')||0,r:rc[0],c:rc[1]};
       if(t=='s'&&v)o.si=sst[+v.textContent];else if(is)o.si=is;else{var w=ws[p];o.h=w?esc(w.w!=null?w.w:w.v).replace(/\n/g,'<br>'):(v?esc(v.textContent):'')}
       cells[rc[0]+','+rc[1]]=o})});
     [].forEach.call(Q.getElementsByTagName('mergeCell'),function(m){var q=m.getAttribute('ref').split(':');if(q.length<2)return;var A=a1(q[0]),B=a1(q[1]);mg.push([A[0],A[1],B[0],B[1]])});
     Object.keys(cells).forEach(function(key){var o=cells[key],xf=xfs[o.s]||xfs[0];if((o.si&&(o.si.textContent||'').trim())||(o.h&&o.h.replace(/<br>/g,'').trim())||fills[xf.fi]){r1=Math.min(r1,o.r);r2=Math.max(r2,o.r);c1=Math.min(c1,o.c);c2=Math.max(c2,o.c)}});
     if(r2<0)return;
     mg=mg.filter(function(m){return m[0]>=r1&&m[0]<=r2&&m[1]>=c1&&m[1]<=c2});
     mg.forEach(function(m){r2=Math.max(r2,m[2]);c2=Math.max(c2,m[3])});
     r2=Math.min(r2,r1+300);c2=Math.min(c2,c1+60);
     var rows=[],cols=[],sum=0;
     for(var r=r1;r<=r2;r++)if(!hR[r])rows.push(r);
     for(var c=c1;c<=c2;c++)if(!hC[c]){cols.push(c);sum+=cW[c]||64}
     var k=Math.min(1,880/sum),mO={},cov={};
     mg.forEach(function(m){if(rows.indexOf(m[0])<0||cols.indexOf(m[1])<0)return;mO[m[0]+','+m[1]]={rs:rows.filter(function(r){return r>=m[0]&&r<=m[2]}).length,cs:cols.filter(function(c){return c>=m[1]&&c<=m[3]}).length,r2:m[2],c2:m[3]};
      rows.forEach(function(r){if(r>=m[0]&&r<=m[2])cols.forEach(function(c){if(c>=m[1]&&c<=m[3]&&!(r==m[0]&&c==m[1]))cov[r+','+c]=1})})});
     function xo(r,c){var o=cells[r+','+c];return xfs[o?o.s:0]||xfs[0]}
     var h='<table class="xl" style="width:'+Math.round(sum*k)+'px"><colgroup>'+cols.map(function(c){return '<col style="width:'+Math.round((cW[c]||64)*k)+'px">'}).join('')+'</colgroup><tbody>';
     rows.forEach(function(r){h+='<tr'+(rH[r]?' style="height:'+Math.round(rH[r]*k)+'px"':'')+'>';
      cols.forEach(function(c){var key=r+','+c;if(cov[key])return;var o=cells[key]||{s:0},mm=mO[key],xf=xfs[o.s]||xfs[0],bd=bords[xf.b]||{},bg=fills[xf.fi],rt=mm?xo(r,mm.c2):xf,bt=mm?xo(mm.r2,c):xf;
       var css='background:'+(bg||'#fff')+';'+fcss(fonts[xf.f]||{},k)+'text-align:'+(xf.h=='center'||xf.h=='right'?xf.h:'left')+';vertical-align:'+({top:'top',center:'middle'}[xf.v]||'bottom')+';'+(bd.left||'')+(bd.top||'')+((bords[rt.b]||{}).right||'')+((bords[bt.b]||{}).bottom||'');
       h+='<td'+(mm&&mm.rs>1?' rowspan="'+mm.rs+'"':'')+(mm&&mm.cs>1?' colspan="'+mm.cs+'"':'')+' style="'+css+'">'+(o.si?sstHtml(o.si,k):(o.h||''))+'</td>'});
      h+='</tr>'});
     h+='</tbody></table>';
     addBox('t',30,nextY(),Math.round(sum*k)+16,(shs.length>1?'<p><b>'+esc(nm)+'</b></p>':'')+h);out++});
    if(!out)throw 0})})})
}
function impPlain(buf){
 if(typeof XLSX=='undefined')throw 0;
 var wb=XLSX.read(buf,{type:'array'}),h='';
 wb.SheetNames.forEach(function(nm){var rows=XLSX.utils.sheet_to_json(wb.Sheets[nm],{header:1,defval:'',raw:false}).filter(function(r){return r.some(function(c){return String(c).trim()})});if(!rows.length)return;var mc=0;rows.forEach(function(r){r.forEach(function(c,i){if(String(c).trim())mc=Math.max(mc,i+1)})});
  if(wb.SheetNames.length>1)h+='<p><b>'+esc(nm)+'</b></p>';
  h+='<table><tbody>'+rows.map(function(r,i){var g=i?'td':'th';return '<tr>'+r.slice(0,mc).map(function(c){return '<'+g+'>'+esc(c)+'</'+g+'>'}).join('')+'</tr>'}).join('')+'</tbody></table>'});
 if(!h)throw 0;addBox('t',30,nextY(),Math.min(720,$('page').offsetWidth-60),h)
}
$('fXls').onchange=function(e){
 var f=e.target.files[0];e.target.value='';if(!f||!$('page'))return;
 var fr=new FileReader();fr.onload=function(){var buf=fr.result,go=(/\.xlsx$/i.test(f.name)&&window.JSZip&&window.XLSX)?impX(buf):Promise.reject();
  go.catch(function(){return impPlain(buf)}).catch(function(){toast('Fichier illisible.')})};
 fr.readAsArrayBuffer(f)
};
