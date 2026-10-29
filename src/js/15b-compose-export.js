// =====================================================================
// Micrograph Figure Kit — 15b. Compose export
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Figure files built locally: PNG with dpi, TIFF, PDF, raster SVG, CSV; save and copy buttons.
//    pngWithDpi, tiffBlob, pdfBlob, saveOut and csvNum are also used by modules 11, 14 and 17b.
// =====================================================================
// ---- Figure export: PNG with dpi (pHYs chunk), uncompressed RGB TIFF, clipboard ----
// CRC-32 used for the PNG pHYs chunk.
function crc32(buf) {
  let crc=0xFFFFFFFF;
  for (let n=0;n<buf.length;n++) { let c=(crc^buf[n])&0xFF; for (let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; crc=(crc>>>8)^c; }
  return (crc^0xFFFFFFFF)>>>0;
}
// Insert a pHYs chunk so Word inserts the PNG at the right size.
async function pngWithDpi(blob, dpi) {
  const b=new Uint8Array(await blob.arrayBuffer()), ppm=Math.round(dpi/0.0254);
  const ch=new Uint8Array(21), dv=new DataView(ch.buffer);
  dv.setUint32(0,9); ch.set([0x70,0x48,0x59,0x73],4); dv.setUint32(8,ppm); dv.setUint32(12,ppm); ch[16]=1; dv.setUint32(17,crc32(ch.subarray(4,17)));
  return new Blob([b.subarray(0,33),ch,b.subarray(33)],{type:'image/png'});
}
// Uncompressed RGB TIFF with resolution tags.
function tiffBlob(canvas, dpi, bg) {
  const w=canvas.width, h=canvas.height, flat=document.createElement('canvas'); flat.width=w; flat.height=h;
  const fc=flat.getContext('2d'); fc.fillStyle=bg==='black'?'#000':'#fff'; fc.fillRect(0,0,w,h); fc.drawImage(canvas,0,0);
  const px=fc.getImageData(0,0,w,h).data;
  const n=12, ifdSize=2+n*12+4, bpsOff=8+ifdSize, resOff=bpsOff+6, dataOff=resOff+16;
  const buf=new ArrayBuffer(dataOff+w*h*3), dv=new DataView(buf);
  dv.setUint8(0,0x49); dv.setUint8(1,0x49); dv.setUint16(2,42,true); dv.setUint32(4,8,true);
  let p=8; dv.setUint16(p,n,true); p+=2;
  const tag=(t,type,count,val)=>{ dv.setUint16(p,t,true); dv.setUint16(p+2,type,true); dv.setUint32(p+4,count,true); if (type===3&&count===1) dv.setUint16(p+8,val,true); else dv.setUint32(p+8,val,true); p+=12; };
  tag(256,4,1,w); tag(257,4,1,h); tag(258,3,3,bpsOff); tag(259,3,1,1); tag(262,3,1,2); tag(273,4,1,dataOff);
  tag(277,3,1,3); tag(278,4,1,h); tag(279,4,1,w*h*3); tag(282,5,1,resOff); tag(283,5,1,resOff+8); tag(296,3,1,2);
  dv.setUint32(p,0,true);
  dv.setUint16(bpsOff,8,true); dv.setUint16(bpsOff+2,8,true); dv.setUint16(bpsOff+4,8,true);
  dv.setUint32(resOff,dpi,true); dv.setUint32(resOff+4,1,true); dv.setUint32(resOff+8,dpi,true); dv.setUint32(resOff+12,1,true);
  const out=new Uint8Array(buf,dataOff);
  for (let i=0,j=0;i<px.length;i+=4,j+=3) { out[j]=px[i]; out[j+1]=px[i+1]; out[j+2]=px[i+2]; }
  return new Blob([buf],{type:'image/tiff'});
}
// ---- PDF / SVG / CSV export (built locally, no libraries) ----
function flatRGB(canvas,bg) {
  const w=canvas.width, h=canvas.height, f=document.createElement('canvas'); f.width=w; f.height=h;
  const c=f.getContext('2d'); c.fillStyle=bg==='black'?'#000':'#fff'; c.fillRect(0,0,w,h); c.drawImage(canvas,0,0);
  const px=c.getImageData(0,0,w,h).data, out=new Uint8Array(w*h*3);
  for (let i=0,j=0;i<px.length;i+=4,j+=3) { out[j]=px[i]; out[j+1]=px[i+1]; out[j+2]=px[i+2]; }
  return out;
}
async function zDeflate(bytes) { if (!window.CompressionStream) return null; try { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()); } catch(_) { return null; } }
// One-page PDF; the page is the printed size (px / dpi), the image is lossless.
async function pdfBlob(canvas,dpi,bg) {
  const w=canvas.width, h=canvas.height, f=n=>String(+n.toFixed(3)), pw=f(w/dpi*72), ph=f(h/dpi*72);
  const raw=flatRGB(canvas,bg), z=await zDeflate(raw), data=z||raw, enc=new TextEncoder(), parts=[], offs=[]; let len=0;
  const put=x=>{ const b=typeof x==='string'?enc.encode(x):x; parts.push(b); len+=b.length; };
  const obj=(n,body)=>{ offs[n]=len; put(n+' 0 obj\n'); if (typeof body==='function') body(); else put(body); put('\nendobj\n'); };
  const content='q '+pw+' 0 0 '+ph+' 0 0 cm /Im0 Do Q';
  put('%PDF-1.4\n'); put(new Uint8Array([37,226,227,207,211,10]));
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
  obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+pw+' '+ph+'] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
  obj(4,()=>{ put('<< /Type /XObject /Subtype /Image /Width '+w+' /Height '+h+' /ColorSpace /DeviceRGB /BitsPerComponent 8'+(z?' /Filter /FlateDecode':'')+' /Length '+data.length+' >>\nstream\n'); put(data); put('\nendstream'); });
  obj(5,'<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream');
  const xref=len; put('xref\n0 6\n0000000000 65535 f \n'+[1,2,3,4,5].map(n=>String(offs[n]).padStart(10,'0')+' 00000 n \n').join(''));
  put('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
  return new Blob(parts,{type:'application/pdf'});
}
// Raster SVG at the printed size (mm): fallback when vector export (26-svg-export.js) is not possible.
async function svgBlob(canvas,dpi) {
  const w=canvas.width, h=canvas.height, mm=v=>String(+(v/dpi*25.4).toFixed(2));
  const url=await new Promise(async (res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(await canvasBlob(canvas)); });
  return new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+mm(w)+'mm" height="'+mm(h)+'mm" viewBox="0 0 '+w+' '+h+'">\n<image width="'+w+'" height="'+h+'" xlink:href="'+url+'"/>\n</svg>\n'],{type:'image/svg+xml'});
}
function csvBlob(rows) { return new Blob(['\uFEFF'+csvJoin(rows)],{type:'text/csv'}); }
async function saveOut(blobOrPromise,name) {
  try { const blob=await blobOrPromise; let r=null;
    if (state.outputDirHandle) { try { name=await freeDirName(state.outputDirHandle,name); await writeBlobToDirectory(state.outputDirHandle,blob,name); r={method:'directory'}; } catch(_) { r=null; } }
    if (!r) r=await saveBlob(blob,name,blob.type); if (r.method!=='cancelled') showToast('Saved: '+name);
  } catch(e) { showToast('Save failed: '+e.message,4200); }
}
const csvNum=v=>v==null||!isFinite(v)?'':String(+Number(v).toPrecision(6));
async function saveFigure(kind) {
  if (!compose.canvas) return;
  const c=compose.cfg;
  try {
    let blob, name;
    if (kind==='tif') { blob=tiffBlob(compose.canvas,c.dpi,c.bg); name='SEM_figure.tif'; }
    else { blob=await pngWithDpi(await canvasBlob(compose.canvas),c.dpi); name='SEM_figure.png'; }
    let r;
    if (state.outputDirHandle) { try { name=await freeDirName(state.outputDirHandle,name); await writeBlobToDirectory(state.outputDirHandle,blob,name); r={method:'directory'}; } catch (_) { r=null; } }
    if (!r) r=await saveBlob(blob,name,blob.type);
    if (r.method!=='cancelled') showToast('Saved: '+name);
  } catch (e) { showToast('Save failed: '+e.message,4200); }
}
els.compSavePng.onclick=()=>saveFigure('png');
$('#compSavePdf').onclick=()=>{ if (!compose.canvas) { showToast('No panels yet.'); return; } saveOut(pdfBlob(compose.canvas,compose.cfg.dpi,compose.cfg.bg),'SEM_figure.pdf'); };
$('#compSaveSvg').onclick=()=>{ if (!compose.canvas) { showToast('No panels yet.'); return; } saveOut(svgVector(()=>{ renderCompose(); return compose.canvas; },compose.cfg.dpi,compose.canvas),'SEM_figure.svg'); };
$('#compSaveCsv').onclick=()=>{
  if (!compose.cells.length) { showToast('No panels yet.'); return; }
  const dpi=compose.cfg.dpi, mm=v=>csvNum(v/dpi*25.4), rows=[['Panel','File','Source scale','Output scale','µm per px (source)','X (mm)','Y (mm)','Width (mm)','Height (mm)']];
  compose.cells.forEach((c,i)=>rows.push([i+1, c.it.name, c.it.sourceScaleText||'', c.it.targetScaleText||c.it.sourceScaleText||'', csvNum(measUmPerPx(c.it)), mm(c.dx), mm(c.dy), mm(c.dw), mm(c.dh)]));
  rows.push([]); rows.push(['Figure', '', '', '', '', '', '', mm(compose.canvas?.width||0), mm(compose.canvas?.height||0)]);
  saveOut(csvBlob(rows),'SEM_figure_panels.csv');
};
els.compSaveTif.onclick=()=>saveFigure('tif');
els.compCopy.onclick=async()=>{
  try {
    const blob=await canvasBlob(compose.canvas);
    await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
    showToast('Figure copied. Paste it into Word or PowerPoint.');
  } catch (e) { showToast('Copy is not allowed here; use Save PNG instead.',4200); }
};
