/* Export Word (.docx) et Markdown (.md) d'une page, d'une section ou d'un carnet.
   Le HTML des pages est converti en « blocs » (titres, paragraphes, listes, tableaux, images),
   puis écrit soit en Markdown, soit en document Word (créé à la main avec JSZip). */

/* ---------- HTML → blocs ---------- */
function htmlFrag(html){var t=document.createElement('template');t.innerHTML=html||'';return t.content}
function hexOf(c){
  if(!c)return null;
  var m=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);
  if(m)return [m[1],m[2],m[3]].map(function(n){return ('0'+(+n).toString(16)).slice(-2)}).join('');
  m=/^#([0-9a-f]{6})$/i.exec(c);if(m)return m[1].toLowerCase();
  m=/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(c);if(m)return m[1]+m[1]+m[2]+m[2]+m[3]+m[3];
  return null;
}
function fmtOf(el,f){
  var n=Object.assign({},f),tag=el.nodeName,st=el.style||{},cl=el.classList;
  if(tag=='B'||tag=='STRONG'||st.fontWeight=='bold'||+st.fontWeight>=600)n.b=true;
  if(tag=='I'||tag=='EM'||st.fontStyle=='italic')n.i=true;
  if(tag=='U'||/underline/.test(st.textDecoration||''))n.u=true;
  if(tag=='S'||tag=='STRIKE'||tag=='DEL'||/line-through/.test(st.textDecoration||'')||(cl&&cl.contains('cdone')))n.s=true;
  if(tag=='SUB')n.sub=true;
  if(tag=='SUP')n.sup=true;
  var col=hexOf(st.color)||hexOf(el.getAttribute&&el.getAttribute('color'));
  if(col&&col!='000000'&&col!='111111')n.color=col;               // le noir est la couleur par défaut
  return n;
}
var BLOCKRX=/^(UL|OL|TABLE|DIV|P|H1|H2|H3)$/;
function pushInline(n,f,out){
  if(n.nodeType==3){var t=n.textContent.replace(/\u00a0/g,' ');if(t)out.push(Object.assign({t:t},f));return}
  if(n.nodeType!=1)return;
  if(n.nodeName=='BR'){out.push({br:1});return}
  if(BLOCKRX.test(n.nodeName))return;
  if(n.classList.contains('plink')){out.push(Object.assign({t:n.textContent,color:'7719aa',u:true},f));return}
  var g=fmtOf(n,f);
  [].forEach.call(n.childNodes,function(c){pushInline(c,g,out)});
}
function blocksOf(root,f,align){
  var out=[],cur=[];
  f=f||{};
  function flush(){
    if(cur.some(function(r){return r.br||(r.t&&r.t.trim())}))out.push({t:'p',runs:cur,align:align});
    cur=[];
  }
  [].forEach.call(root.childNodes,function(n){
    if(n.nodeType==1&&BLOCKRX.test(n.nodeName)){
      flush();
      var tag=n.nodeName,al=(n.style&&n.style.textAlign)||align;
      if(/^H[123]$/.test(tag)){var rs=[];[].forEach.call(n.childNodes,function(c){pushInline(c,{},rs)});out.push({t:'h',l:+tag[1],runs:rs})}
      else if(tag=='UL'||tag=='OL')listBlocks(n,0,out);
      else if(tag=='TABLE')out.push(tableBlock(n));
      else{
        var inner=blocksOf(n,fmtOf(n,f),al),cl=n.classList;
        var call=cl.contains('tip')?'tip':cl.contains('warn')?'warn':cl.contains('note')?'note':null;
        inner.forEach(function(b){if(call)b.callout=call;out.push(b)});
      }
    }else pushInline(n,f,cur);
  });
  flush();
  return out;
}
function listBlocks(l,lvl,out){
  var ord=l.nodeName=='OL',i=0;
  [].forEach.call(l.children,function(li){
    if(li.nodeName!='LI')return;
    i++;
    var cur=[],nested=[];
    [].forEach.call(li.childNodes,function(n){
      if(n.nodeType==1&&/^(UL|OL)$/.test(n.nodeName))nested.push(n);
      else if(n.nodeType==1&&/^(DIV|P)$/.test(n.nodeName))[].forEach.call(n.childNodes,function(c){pushInline(c,{},cur)});
      else pushInline(n,{},cur);
    });
    out.push({t:'li',lvl:lvl,ord:ord,n:i,runs:cur});
    nested.forEach(function(x){listBlocks(x,lvl+1,out)});
  });
}
function tableBlock(t){
  var g=grid(t),rows=[],cols=(g[0]||[]).length,r,c;
  for(r=0;r<g.length;r++){
    if(!g[r])continue;
    var row=[];
    for(c=0;c<cols;c++){
      var x=g[r][c];if(!x)continue;
      if(x.r==r&&x.c==c){
        var st=x.td.style||{};
        row.push({blocks:blocksOf(x.td,fmtOf(x.td,x.td.nodeName=='TH'?{b:true}:{}),st.textAlign),cs:x.td.colSpan,rs:x.td.rowSpan,bg:hexOf(st.backgroundColor||st.background)});
      }else if(x.c==c&&x.r<r)row.push({cont:true,cs:x.td.colSpan});
    }
    rows.push(row);
  }
  return {t:'table',rows:rows,cols:cols};
}
function pageBlocks(p,shift){
  var out=[{t:'h',l:1+(shift||0),runs:[{t:p.title}]}];
  if(p.sub)out.push({t:'p',runs:[{t:p.sub,i:true,color:'808080'}]});
  if(p.tags&&p.tags.length)out.push({t:'p',runs:[{t:p.tags.map(function(x){return '#'+x}).join('  '),color:'7719aa'}]});
  if(p.tab){var tb=htmlFrag(p.tab).querySelector('table');if(tb)out.push(tableBlock(tb))}
  (p.boxes||[]).slice().sort(function(a,b){return a.y-b.y||a.x-b.x}).forEach(function(b){
    if(b.k=='t')blocksOf(htmlFrag(b.c)).forEach(function(x){out.push(x)});
    else if(b.k=='i')out.push({t:'img',ref:b.c,w:b.w,ar:b.ar});
    else if(b.k=='d')out.push({t:'draw',svg:b.c,w:b.w,ar:b.ar});
  });
  return out;
}

/* ---------- blocs → Markdown ---------- */
function mdRuns(rs){
  return rs.map(function(r){
    if(r.br)return '  \n';
    var m=/^(\s*)([\s\S]*?)(\s*)$/.exec(r.t||''),t=m[2].replace(/([\\`*_{}\[\]|])/g,'\\$1');
    if(!t)return r.t||'';
    if(r.s)t='~~'+t+'~~';
    if(r.b&&r.i)t='***'+t+'***';else if(r.b)t='**'+t+'**';else if(r.i)t='*'+t+'*';
    if(r.sub)t='<sub>'+t+'</sub>';
    if(r.sup)t='<sup>'+t+'</sup>';
    if(r.u&&!r.color)t='<u>'+t+'</u>';
    return m[1]+t+m[3];
  }).join('').replace(/\s+$/,'');
}
function mdCell(c){
  if(c.cont)return '';
  return c.blocks.map(function(b){return mdRuns(b.runs||[])}).join('<br>').replace(/\n/g,' ').replace(/\|/g,'\\|');
}
async function toMarkdown(blocks){
  var out=[],files=[],prevLi=false;
  for(var i=0;i<blocks.length;i++){
    var b=blocks[i],s='';
    if(b.t=='h')s=new Array(Math.min(6,b.l)+1).join('#')+' '+mdRuns(b.runs);
    else if(b.t=='p')s=mdRuns(b.runs);
    else if(b.t=='li')s=new Array(b.lvl+1).join('  ')+(b.ord?b.n+'. ':'- ')+mdRuns(b.runs);
    else if(b.t=='table'){
      var rows=b.rows.map(function(r){var cells=[];r.forEach(function(c){cells.push(mdCell(c));for(var k=1;k<(c.cs||1);k++)cells.push('')});return cells}),
          n=Math.max.apply(null,rows.map(function(r){return r.length})),lines=[];
      rows.forEach(function(r,ri){
        while(r.length<n)r.push('');
        lines.push('| '+r.join(' | ')+' |');
        if(ri==0)lines.push('|'+new Array(n+1).join(' --- |'));
      });
      s=lines.join('\n');
    }else if(b.t=='img'){
      var by=await imageBytes(b.ref);
      if(by){files.push({name:'images/image-'+(files.length+1)+'.jpg',bytes:by});s='![image]('+files[files.length-1].name+')'}
    }else if(b.t=='draw')s='*(dessin)*';
    if(!s)continue;
    if(b.t=='li'&&prevLi)out[out.length-1]+='\n'+s;else out.push(s);
    prevLi=b.t=='li';
  }
  return {text:out.join('\n\n')+'\n',files:files};
}

/* ---------- images ---------- */
async function imageBytes(ref){
  if(/^data:/.test(ref))return ub(ref.split(',')[1]);
  if(!/^idb:/.test(ref))return null;
  var id=ref.slice(4);await imgUrl(id);
  var sb=await imGet(id);
  return sb?await unsealB(sb):null;
}
async function dimsOf(bytes){
  try{var bm=await createImageBitmap(new Blob([bytes]));return {w:bm.width,h:bm.height}}catch(e){return null}
}
function svgPng(svg){
  return new Promise(function(ok){
    var im=new Image();
    im.onload=function(){
      var s=2,c=document.createElement('canvas');c.width=im.width*s;c.height=im.height*s;
      var x=c.getContext('2d');x.scale(s,s);x.drawImage(im,0,0);
      c.toBlob(function(b){b.arrayBuffer().then(function(a){ok({bytes:new Uint8Array(a),w:im.width,h:im.height})})},'image/png');
    };
    im.onerror=function(){ok(null)};
    im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgClean(svg));
  });
}

/* ---------- blocs → Word (.docx) ---------- */
var W_NS='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"',
    CALLFILL={tip:'E8F5E9',warn:'FFF3E0',note:'E3F2FD'},
    JC={left:'left',center:'center',right:'right'};
function xe(s){return String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function rXml(r){
  if(r.br)return '<w:r><w:br/></w:r>';
  var pr='';                                   // ordre imposé par le schéma Word : b, i, strike, color, u, vertAlign
  if(r.b)pr+='<w:b/>';
  if(r.i)pr+='<w:i/>';
  if(r.s)pr+='<w:strike/>';
  if(r.color)pr+='<w:color w:val="'+r.color.toUpperCase()+'"/>';
  if(r.u)pr+='<w:u w:val="single"/>';
  if(r.sup)pr+='<w:vertAlign w:val="superscript"/>';
  if(r.sub)pr+='<w:vertAlign w:val="subscript"/>';
  return '<w:r>'+(pr?'<w:rPr>'+pr+'</w:rPr>':'')+'<w:t xml:space="preserve">'+xe(r.t||'')+'</w:t></w:r>';
}
function pXml(b,numId){
  var pr='';                                   // ordre : pStyle, numPr, shd, jc
  if(b.t=='h')pr+='<w:pStyle w:val="Heading'+Math.min(4,b.l)+'"/>';
  if(b.t=='li')pr+='<w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="'+Math.min(b.lvl,2)+'"/><w:numId w:val="'+(b.ord?numId:1)+'"/></w:numPr>';
  if(b.callout)pr+='<w:shd w:val="clear" w:color="auto" w:fill="'+CALLFILL[b.callout]+'"/>';
  if(b.align&&JC[b.align])pr+='<w:jc w:val="'+JC[b.align]+'"/>';
  return '<w:p>'+(pr?'<w:pPr>'+pr+'</w:pPr>':'')+(b.runs||[]).map(rXml).join('')+'</w:p>';
}
function tblXml(b){
  var x='<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/></w:tblPr><w:tblGrid>';
  for(var i=0;i<b.cols;i++)x+='<w:gridCol w:w="'+Math.round(9000/Math.max(1,b.cols))+'"/>';
  x+='</w:tblGrid>';
  b.rows.forEach(function(row){
    x+='<w:tr>';
    row.forEach(function(c){
      var pr='';
      if(c.cs>1)pr+='<w:gridSpan w:val="'+c.cs+'"/>';
      if(c.cont)pr+='<w:vMerge/>';else if(c.rs>1)pr+='<w:vMerge w:val="restart"/>';
      if(c.bg)pr+='<w:shd w:val="clear" w:color="auto" w:fill="'+c.bg.toUpperCase()+'"/>';
      var body=c.cont?'<w:p/>':(c.blocks&&c.blocks.length?c.blocks.map(function(p){return pXml(p,2)}).join(''):'<w:p/>');
      x+='<w:tc>'+(pr?'<w:tcPr>'+pr+'</w:tcPr>':'')+body+'</w:tc>';
    });
    x+='</w:tr>';
  });
  return x+'</w:tbl>';
}
async function imgXml(b,imgs){
  var bytes=null,ext='jpeg',w=b.w||300,ar=b.ar;
  if(b.t=='img')bytes=await imageBytes(b.ref);
  else{var r=await svgPng(b.svg);if(r){bytes=r.bytes;ext='png';w=Math.min(w,r.w);ar=r.w/r.h}}
  if(!bytes)return pXml({t:'p',runs:[{t:'[image indisponible]',i:true}]});
  if(!ar){var d=await dimsOf(bytes);ar=d?d.w/d.h:1}
  w=Math.min(w,620);
  var cx=Math.round(w*9525),cy=Math.round(w/ar*9525),n=imgs.length+1,id='rId'+(10+imgs.length);
  imgs.push({name:'image'+n+'.'+ext,bytes:bytes,id:id});
  return '<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="'+cx+'" cy="'+cy+'"/><wp:docPr id="'+n+'" name="Image '+n+'"/>'+
    '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="'+n+'" name="image'+n+'.'+ext+'"/><pic:cNvPicPr/></pic:nvPicPr>'+
    '<pic:blipFill><a:blip r:embed="'+id+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'+
    '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
}
function lvlXml(i,fmt,text){
  return '<w:lvl w:ilvl="'+i+'"><w:start w:val="1"/><w:numFmt w:val="'+fmt+'"/><w:lvlText w:val="'+text+'"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="'+(720+i*360)+'" w:hanging="360"/></w:pPr></w:lvl>';
}
function stylesXml(){
  function h(n,sz,col){return '<w:style w:type="paragraph" w:styleId="Heading'+n+'"><w:name w:val="heading '+n+'"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="'+(n-1)+'"/></w:pPr><w:rPr><w:b/><w:color w:val="'+col+'"/><w:sz w:val="'+sz+'"/></w:rPr></w:style>'}
  var bd=['top','left','bottom','right','insideH','insideV'].map(function(s){return '<w:'+s+' w:val="single" w:sz="4" w:space="0" w:color="999999"/>'}).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+
    '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:lang w:val="fr-FR"/></w:rPr></w:rPrDefault>'+
    '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'+
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'+
    h(1,36,'2F3E8F')+h(2,30,'2F3E8F')+h(3,26,'2F3E8F')+h(4,24,'2F3E8F')+
    '<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:contextualSpacing/></w:pPr></w:style>'+
    '<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders>'+bd+'</w:tblBorders><w:tblCellMar><w:left w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>';
}
async function buildDocx(blocks){
  var imgs=[],body='',nums='',ordN=2,cur=2;
  for(var i=0;i<blocks.length;i++){
    var b=blocks[i];
    if(b.t=='li'&&b.ord&&b.lvl==0&&b.n==1){ordN++;cur=ordN;nums+='<w:num w:numId="'+ordN+'"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>'}
    if(b.t=='li')body+=pXml(b,cur);
    else if(b.t=='table')body+=tblXml(b)+'<w:p/>';
    else if(b.t=='pb')body+='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    else if(b.t=='img'||b.t=='draw')body+=await imgXml(b,imgs);
    else body+=pXml(b);
  }
  var head='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      doc=head+'<w:document '+W_NS+'><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>',
      numbering=head+'<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+
        '<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>'+lvlXml(0,'bullet','•')+lvlXml(1,'bullet','–')+lvlXml(2,'bullet','▪')+'</w:abstractNum>'+
        '<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>'+lvlXml(0,'decimal','%1.')+lvlXml(1,'lowerLetter','%2.')+lvlXml(2,'lowerRoman','%3.')+'</w:abstractNum>'+
        '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>'+nums+'</w:numbering>',
      rels=head+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>'+
        imgs.map(function(m){return '<Relationship Id="'+m.id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/'+m.name+'"/>'}).join('')+'</Relationships>',
      types=head+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/>'+
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'+
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'+
        '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>',
      z=new JSZip();
  z.file('[Content_Types].xml',types);
  z.file('_rels/.rels',head+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/document.xml',doc);z.file('word/styles.xml',stylesXml());z.file('word/numbering.xml',numbering);z.file('word/_rels/document.xml.rels',rels);
  imgs.forEach(function(m){z.file('word/media/'+m.name,m.bytes)});
  return z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}

/* ---------- interface ---------- */
function dlBlob(blob,name){
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;
  document.body.appendChild(a);a.click();
  setTimeout(function(){a.remove();URL.revokeObjectURL(a.href)},1500);
}
function slug(s){return String(s||'carnet').replace(/[\\/:*?"<>|]+/g,'-').trim()||'carnet'}
async function runExport(scope,fmt){
  if(!window.JSZip){toast('Bibliothèque ZIP non chargée.');return}
  ser();toast('Préparation de l’export…');
  try{
    var blocks=[],name,pages=[];
    if(scope=='page'){var p=pg();if(!p){toast('Aucune page ouverte.');return}name=p.title;blocks=pageBlocks(p,0)}
    else if(scope=='sec'){
      var s=sec();if(!s){toast('Aucune section.');return}
      name=s.name;
      s.pages.forEach(function(p,i){if(i)blocks.push({t:'pb'});pageBlocks(p,0).forEach(function(b){blocks.push(b)})});
    }else{
      var n=nb();name=n.name;
      n.sections.forEach(function(s,si){
        if(si)blocks.push({t:'pb'});
        blocks.push({t:'h',l:1,runs:[{t:s.name}]});
        s.pages.forEach(function(p,i){if(i)blocks.push({t:'pb'});pageBlocks(p,1).forEach(function(b){blocks.push(b)})});
      });
    }
    var file=slug(name);
    if(fmt=='docx'){dlBlob(await buildDocx(blocks),file+'.docx')}
    else{
      var md=await toMarkdown(blocks);
      if(md.files.length){
        var z=new JSZip();z.file(file+'.md',md.text);md.files.forEach(function(f){z.file(f.name,f.bytes)});
        dlBlob(await z.generateAsync({type:'blob'}),file+'.zip');
      }else dlBlob(new Blob([md.text],{type:'text/markdown;charset=utf-8'}),file+'.md');
    }
    toast('Export terminé : '+file+'.'+(fmt=='docx'?'docx':(md.files.length?'zip':'md')));
  }catch(e){toast('Export impossible ('+(e.message||e)+').')}
}
function openExport(){
  var p=pg(),s=sec(),n=nb();
  openModal('⬇ Exporter',
    '<p style="margin:0 0 10px;color:var(--muted)">Word (.docx) pour ta mise en page finale, Markdown (.md) pour du texte brut. Les images sont incluses (en .zip pour Markdown).</p>'+
    [['page','Cette page'+(p?' : '+esc(p.title):'')],['sec','Cette section'+(s?' : '+esc(s.name)+' ('+s.pages.length+' pages)':'')],['nb','Ce carnet : '+esc(n.name)]].map(function(x){
      return '<div class="mrow"><div class="mi"><b>'+x[1]+'</b></div><button class="btn sm" data-ex="'+x[0]+'" data-fm="docx">Word</button><button class="btn sm" data-ex="'+x[0]+'" data-fm="md">Markdown</button></div>';
    }).join(''),
    function(ev){
      var b=ev.target.closest('[data-ex]');if(!b)return;
      closeModal();runExport(b.dataset.ex,b.dataset.fm);
    });
}
ACTIONS.export=openExport;
