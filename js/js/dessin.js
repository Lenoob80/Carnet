/* Dessin à main levée (souris, doigt ou stylet) : les traits deviennent un objet de la page (déplaçable, redimensionnable) */

var NS='http://www.w3.org/2000/svg',
    DR={on:false,color:'#111111',w:3,hl:false,eraser:false,strokes:[],cur:null,erasing:false,penSeen:false,svg:null,tool:null},
    DCOL=['#111111','#e53935','#1e88e5','#43a047','#fb8c00','#8e24aa'];

function dfmt(n){return Math.round(n*10)/10}
function pathD(p){
  if(p.length<2)return 'M'+p[0][0]+' '+p[0][1]+' l0.01 0';
  var d='M'+p[0][0]+' '+p[0][1];
  for(var i=1;i<p.length-1;i++)d+=' Q'+p[i][0]+' '+p[i][1]+' '+dfmt((p[i][0]+p[i+1][0])/2)+' '+dfmt((p[i][1]+p[i+1][1])/2);
  return d+' L'+p[p.length-1][0]+' '+p[p.length-1][1];
}
/* n'accepte que du SVG simple (traits) : évite tout contenu actif venu d'ailleurs */
function svgClean(s){
  try{
    var doc=new DOMParser().parseFromString(s,'image/svg+xml'),root=doc.documentElement;
    if(root.nodeName!='svg'||doc.querySelector('parsererror'))return '';
    var ok={svg:['viewBox','width','height','xmlns'],path:['d','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','opacity'],g:['opacity']};
    (function walk(el){
      [].slice.call(el.children).forEach(function(c){if(!ok[c.nodeName]){c.remove();return}walk(c)});
      [].slice.call(el.attributes).forEach(function(a){if(ok[el.nodeName].indexOf(a.name)<0)el.removeAttribute(a.name)});
    })(root);
    return new XMLSerializer().serializeToString(root);
  }catch(e){return ''}
}

function toolHtml(){
  return DCOL.map(function(c){return '<button class="dcol'+(c==DR.color&&!DR.hl?' on':'')+'" data-dc="'+c+'" style="background:'+c+'" title="Stylo"></button>'}).join('')+
    '<button class="dcol hlb'+(DR.hl?' on':'')+'" data-dh="1" style="background:#fdd835" title="Surligneur"></button>'+
    '<span class="dsep"></span>'+
    [2,4,8].map(function(w){return '<button class="btn sm'+(DR.w==w?' on':'')+'" data-dw="'+w+'" title="Épaisseur '+w+'"><i style="display:block;width:22px;height:'+w+'px;background:currentColor;border-radius:4px"></i></button>'}).join('')+
    '<span class="dsep"></span>'+
    '<button class="btn sm'+(DR.eraser?' on':'')+'" data-de="1" title="Gomme (efface un trait entier)">⌫ Gomme</button>'+
    '<button class="btn sm" data-du="1" title="Annuler le dernier trait">↶ Trait</button>'+
    '<button class="btn sm" data-dok="1" style="border-color:var(--accent)">✓ Terminer</button>'+
    '<button class="btn sm" data-dno="1">✕</button>';
}
function paintTool(){if(DR.tool)DR.tool.innerHTML=toolHtml()}

function svgPt(e){var r=DR.svg.getBoundingClientRect();return [dfmt(e.clientX-r.left),dfmt(e.clientY-r.top)]}
function eraseAt(pt){
  DR.strokes=DR.strokes.filter(function(s){
    var hit=s.pts.some(function(p){return Math.abs(p[0]-pt[0])<12&&Math.abs(p[1]-pt[1])<12});
    if(hit)s.el.remove();
    return !hit;
  });
}

function startDraw(){
  var pe=$('page');
  if(!pe){toast('Ouvre d’abord une page.');return}
  if(DR.on)return;
  clearSel();
  DR.on=true;DR.strokes=[];DR.cur=null;DR.eraser=false;
  var svg=document.createElementNS(NS,'svg');
  svg.id='dsvg';svg.style.height=pe.offsetHeight+'px';
  pe.appendChild(svg);DR.svg=svg;
  svg.addEventListener('pointerdown',function(e){
    if(e.pointerType=='pen')DR.penSeen=true;
    if(e.pointerType=='touch'&&DR.penSeen)return;            // le stylet est utilisé : on ignore la paume
    e.preventDefault();svg.setPointerCapture(e.pointerId);
    var pt=svgPt(e);
    if(DR.eraser){DR.erasing=true;eraseAt(pt);return}
    var path=document.createElementNS(NS,'path'),s={pts:[pt],color:DR.color,w:DR.hl?DR.w*4:DR.w,op:DR.hl?0.4:1,el:path};
    path.setAttribute('fill','none');path.setAttribute('stroke',s.color);path.setAttribute('stroke-width',s.w);
    path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');
    if(s.op<1)path.setAttribute('opacity',s.op);
    path.setAttribute('d',pathD(s.pts));
    svg.appendChild(path);DR.cur=s;
  });
  svg.addEventListener('pointermove',function(e){
    if(DR.erasing){eraseAt(svgPt(e));return}
    if(!DR.cur)return;
    var pt=svgPt(e),l=DR.cur.pts[DR.cur.pts.length-1];
    if(Math.abs(pt[0]-l[0])+Math.abs(pt[1]-l[1])<1.5)return;
    DR.cur.pts.push(pt);DR.cur.el.setAttribute('d',pathD(DR.cur.pts));
  });
  function up(){if(DR.cur){DR.strokes.push(DR.cur);DR.cur=null}DR.erasing=false}
  svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);

  var tool=document.createElement('div');
  tool.id='dtool';DR.tool=tool;document.body.appendChild(tool);paintTool();
  tool.addEventListener('mousedown',function(e){e.preventDefault()});
  tool.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;var d=b.dataset;
    if(d.dc){DR.color=d.dc;DR.hl=false;DR.eraser=false}
    else if(d.dh){DR.hl=true;DR.eraser=false}
    else if(d.dw){DR.w=+d.dw}
    else if(d.de){DR.eraser=!DR.eraser}
    else if(d.du){var s=DR.strokes.pop();if(s)s.el.remove()}
    else if(d.dok){endDraw(true);return}
    else if(d.dno){endDraw(false);return}
    paintTool();
  });
  toast('Dessine avec la souris, le doigt ou le stylet, puis « Terminer ».');
}

function endDraw(keep){
  var st=DR.strokes;
  if(DR.svg)DR.svg.remove();
  if(DR.tool)DR.tool.remove();
  DR.on=false;DR.svg=null;DR.tool=null;DR.cur=null;DR.erasing=false;
  if(!keep||!st.length||!$('page'))return;
  var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  st.forEach(function(s){
    var pad=s.w/2+1;
    s.pts.forEach(function(p){x0=Math.min(x0,p[0]-pad);y0=Math.min(y0,p[1]-pad);x1=Math.max(x1,p[0]+pad);y1=Math.max(y1,p[1]+pad)});
  });
  x0=Math.max(0,Math.floor(x0));y0=Math.max(0,Math.floor(y0));
  var W=Math.max(8,Math.ceil(x1-x0)),HH=Math.max(8,Math.ceil(y1-y0));
  var paths=st.map(function(s){
    var pts=s.pts.map(function(p){return [dfmt(p[0]-x0),dfmt(p[1]-y0)]});
    return '<path d="'+pathD(pts)+'" fill="none" stroke="'+s.color+'" stroke-width="'+s.w+'" stroke-linecap="round" stroke-linejoin="round"'+(s.op<1?' opacity="'+s.op+'"':'')+'/>';
  }).join('');
  var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+HH+'" width="'+W+'" height="'+HH+'">'+paths+'</svg>';
  var e=addBox('d',x0,y0,W,svg,W/HH);
  setSel([e]);
}
document.addEventListener('keydown',function(e){if(DR.on&&e.key=='Escape')endDraw(false)});
POST.push(function(){if(DR.on)endDraw(false)});
ACTIONS.draw=startDraw;
