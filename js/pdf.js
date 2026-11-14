/* Export PDF : téléchargement direct (html2canvas + jsPDF, chargés à la demande) */
var H2C='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    JSP='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

function loadScript(src){
  return new Promise(function(ok,ko){
    if(document.querySelector('script[src="'+src+'"]'))return ok();
    var s=document.createElement('script');
    s.src=src;s.crossOrigin='anonymous';s.onload=ok;s.onerror=function(){ko(new Error('chargement de la bibliothèque'))};
    document.head.appendChild(s);
  });
}

async function makePdf(){
  var pe=$('page');if(!pe)return;
  ser();toast('Création du PDF…');
  try{
    await loadScript(H2C);await loadScript(JSP);
    var cv=await html2canvas(pe,{
      scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false,
      onclone:function(doc){
        doc.documentElement.setAttribute('data-theme','light');
        var st=doc.createElement('style');
        st.textContent='.bh,.br{display:none!important}.box,.box:hover{border-color:transparent!important;background:none!important}.ms,.msel{outline:none!important}.guide,#dsvg{display:none!important}#page{background:none!important}';
        doc.head.appendChild(st);
      }
    });
    var landscape=!!pe.querySelector('table.w')||cv.width>cv.height,
        pdf=new window.jspdf.jsPDF({orientation:landscape?'l':'p',unit:'mm',format:'a4'}),
        W=pdf.internal.pageSize.getWidth()-16,
        Hh=pdf.internal.pageSize.getHeight()-16,
        ratio=W/cv.width,sliceH=Math.floor(Hh/ratio),y=0,first=true;
    while(y<cv.height){
      var h=Math.min(sliceH,cv.height-y),c=document.createElement('canvas'),x;
      c.width=cv.width;c.height=h;x=c.getContext('2d');
      x.fillStyle='#fff';x.fillRect(0,0,c.width,h);
      x.drawImage(cv,0,y,cv.width,h,0,0,cv.width,h);
      if(!first)pdf.addPage();
      first=false;
      pdf.addImage(c.toDataURL('image/jpeg',0.92),'JPEG',8,8,W,h*ratio);
      y+=h;
    }
    var p=pg();
    pdf.save(((p&&p.title)||'page').replace(/[\\/:*?"<>|]+/g,'-')+'.pdf');
    toast('PDF téléchargé.');
  }catch(e){toast('PDF impossible ('+(e.message||e)+'). Essaie Ctrl+P.')}
}
