// =====================================================================
// Micrograph Figure Kit — 13. Canvas interaction
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Result preview: select, move, resize. Source preview: crop tool and Pick bar.
// =====================================================================
function canvasPoint(canvas, e) {
  const r=canvas.getBoundingClientRect();
  return {x:(e.clientX-r.left)*canvas.width/r.width, y:(e.clientY-r.top)*canvas.height/r.height, k:canvas.width/r.width};
}
function distSeg(p,h) {
  const dx=h.x2-h.x1, dy=h.y2-h.y1, L2=dx*dx+dy*dy||1;
  const t=clamp(((p.x-h.x1)*dx+(p.y-h.y1)*dy)/L2,0,1);
  return Math.hypot(p.x-(h.x1+t*dx), p.y-(h.y1+t*dy));
}
// Topmost hit box under the pointer.
function findHit(hits, p) {
  const tol=6*p.k;
  for (let i=hits.length-1;i>=0;i--) {
    const h=hits[i];
    if (h.seg) { if (distSeg(p,h)<=(h.sw||2)/2+8*p.k) return h; continue; }
    const q=unrotPt(h,p);
    if (q.x>=h.x-tol && q.x<=h.x+h.w+tol && q.y>=h.y-tol && q.y<=h.y+h.h+tol) return h;
  }
  return null;
}
function findHandle(item, p) {
  const sh=selHit(item); if (!sh) return null;
  const tol=9*p.k, rh=rotHandlePos(sh,p.k);
  if (rh && Math.hypot(p.x-rh.x,p.y-rh.y)<=tol+2*p.k) return {id:'rot', x:rh.x, y:rh.y};
  return objHandles(sh).find(q=>Math.abs(p.x-q.x)<=tol && Math.abs(p.y-q.y)<=tol)||null;
}
const HANDLE_CURSOR={nw:'nwse-resize',se:'nwse-resize',ne:'nesw-resize',sw:'nesw-resize',n:'ns-resize',s:'ns-resize',e:'ew-resize',w:'ew-resize',p1:'crosshair',p2:'crosshair',move:'move','new':'crosshair',rot:'grab'};

function moveObj(o, dx, dy) {
  if ('x1' in o) { o.x1+=dx; o.x2+=dx; o.y1+=dy; o.y2+=dy; }
  else { o.x+=dx; o.y+=dy; if (o.type==='text') { o.x=clamp(o.x,0,1); o.y=clamp(o.y,0,1); } }
}
function resizeObj(d, p, shift) {
  const o=d.o, s=d.orig, W=d.W, H=d.H, id=d.handle;
  if (id==='rot') {
    const b=d.hit; if (!b) return; let ang=Math.atan2(p.y-(b.y+b.h/2), p.x-(b.x+b.w/2))*180/Math.PI+90;
    ang=shift?Math.round(ang/15)*15:Math.round(ang); ang=((ang%360)+540)%360-180; o.rot=ang===-180?180:ang; return;
  }
  if (id==='p1' || id==='p2') {
    const ax=(id==='p1'?s.x2:s.x1)*W, ay=(id==='p1'?s.y2:s.y1)*H;
    let px=p.x, py=p.y;
    if (shift) { const st=Math.PI/12, ang=Math.round(Math.atan2(py-ay,px-ax)/st)*st, L=Math.hypot(px-ax,py-ay); px=ax+L*Math.cos(ang); py=ay+L*Math.sin(ang); }
    if (id==='p1') { o.x1=px/W; o.y1=py/H; } else { o.x2=px/W; o.y2=py/H; }
    return;
  }
  if (o.type==='text') {
    const h0=Math.max(4,d.hit.h), f=Math.max(0.05,(h0+(p.y-d.start.y))/h0);
    const ppt=d.ppt||selectedItem()?.renderMeta?.ppt||1; o.size=Math.max(1,Math.round(d.hit.fs*f/ppt*2)/2); return;
  }
  let x0=s.x*W, y0=s.y*H, x1=(s.x+s.w)*W, y1=(s.y+s.h)*H;
  const dx=p.x-d.start.x, dy=p.y-d.start.y;
  if (id.includes('w')) x0+=dx; if (id.includes('e')) x1+=dx;
  if (id.includes('n')) y0+=dy; if (id.includes('s')) y1+=dy;
  if (shift || o.lock) {
    const side = (id==='e'||id==='w') ? Math.abs(x1-x0) : (id==='n'||id==='s') ? Math.abs(y1-y0) : Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
    const sx=Math.sign(x1-x0)||1, sy=Math.sign(y1-y0)||1;
    if (id.includes('w')) x0=x1-sx*side; else x1=x0+sx*side;
    if (id.includes('n')) y0=y1-sy*side; else y1=y0+sy*side;
  }
  o.x=Math.min(x0,x1)/W; o.y=Math.min(y0,y1)/H; o.w=Math.max(4,Math.abs(x1-x0))/W; o.h=Math.max(4,Math.abs(y1-y0))/H;
  if (o.type==='inset' && o.ar) { if (id==='n'||id==='s') o.w=o.h*H*o.ar/W; else o.h=o.w*W/o.ar/H; } // keep the source aspect ratio
}

let resultDrag=null, dragFrame=0;
// Dragging one member of a multi-selection moves the whole group.
function groupFor(item, o) {
  const m=multiIds(item); if (m.length<2 || !m.includes(o.id)) return null;
  const hits=item.renderMeta?.hits||[];
  return m.map(id=>{ const x=item.objects.find(q=>q.id===id); return x?{o:x, orig:{...x}, hit:hits.find(h=>h.kind==='obj'&&h.id===id)}:null; }).filter(Boolean);
}
function moveGroup(d, dx, dy) {
  for (const en of d.group||[{o:d.o, orig:d.orig, hit:d.hit}]) {
    const o=en.o;
    if (o.type==='text') { if (!en.hit) continue; o.x=clamp(en.hit.x/d.W+dx,0,1); o.y=clamp(en.hit.y/d.H+dy,0,1); }
    else { Object.assign(o,en.orig); moveObj(o,dx,dy); }
  }
}
function redrawResultFast(it) {
  if (!dragFrame) dragFrame=requestAnimationFrame(()=>{ dragFrame=0; try { renderInto(it); paintResult(it); syncObjProps(it); } catch(_) {} });
}
els.resultCanvas.addEventListener('pointerdown', e=>{
  state.lastCanvas='result';
  const it=selectedItem(); if (!it?.outputCanvas || !it.renderMeta) return;
  const p=canvasPoint(els.resultCanvas,e), W=it.renderMeta.crop.w, H=it.renderMeta.crop.h;
  const hd=findHandle(it,p);
  let d;
  if (hd) { const o=selObj(it); d={mode:'handle', handle:hd.id, o, orig:{...o}, start:p, hit:selHit(it)}; }
  else {
    const hit=findHit(it.renderMeta.hits,p);
    if (!hit) { if (it.selObj || it.multi?.length) { it.selObj=null; it.multi=[]; paintResult(it); renderObjList(it); } return; }
    if (hit.kind==='obj' && (e.ctrlKey||e.metaKey||e.shiftKey)) { toggleMulti(it,hit.id); paintResult(it); renderObjList(it); return; }
    if (hit.kind==='obj') { const o=it.objects.find(x=>x.id===hit.id); if (!o) return; const mm=multiIds(it); if (!mm.includes(o.id)) it.multi=[o.id]; it.selObj=o.id; d={mode:'move', o, orig:{...o}, start:p, hit, group:groupFor(it,o)}; }
    else { it.selObj=null; d={mode:hit.kind==='panel'?'panel':'scale', hit, dx:p.x-hit.x, dy:p.y-hit.y}; }
  }
  e.preventDefault();
  els.resultCanvas.setPointerCapture(e.pointerId);
  resultDrag={...d, W, H};
  paintResult(it); renderObjList(it);
});
els.resultCanvas.addEventListener('pointermove', e=>{
  const it=selectedItem(); if (!it?.renderMeta) return;
  const p=canvasPoint(els.resultCanvas,e);
  if (!resultDrag) {
    const hd=findHandle(it,p);
    els.resultCanvas.style.cursor=hd?HANDLE_CURSOR[hd.id]:(findHit(it.renderMeta.hits,p)?'move':'default');
    return;
  }
  const d=resultDrag, W=d.W, H=d.H;
  if (d.mode==='scale' || d.mode==='panel') {
    const nx=clamp(p.x-d.dx,0,Math.max(0,W-d.hit.w)), ny=clamp(p.y-d.dy,0,Math.max(0,H-d.hit.h));
    it[d.mode==='panel'?'panelPos':'scalePos']={x:nx/W, y:ny/H};
  } else if (d.mode==='move') {
    const dx=(p.x-d.start.x)/W, dy=(p.y-d.start.y)/H;
    moveGroup(d,dx,dy);
  } else resizeObj(d,p,e.shiftKey);
  redrawResultFast(it);
});
const endResultDrag=()=>{ if (!resultDrag) return; resultDrag=null; renderUI(); };
els.resultCanvas.addEventListener('pointerup', endResultDrag);
els.resultCanvas.addEventListener('pointercancel', endResultDrag);

// ---- Crop tool (on the Source preview) ----
function aspectRatio() { const v=els.cropAspect.value; return v==='free'?0:Number(v); }
// Which edge/corner of the crop the pointer is on.
function cropMode(p, cr) {
  const t=14*p.k, x0=cr.x, y0=cr.y, x1=cr.x+cr.w, y1=cr.y+cr.h;
  const nx0=Math.abs(p.x-x0)<=t, nx1=Math.abs(p.x-x1)<=t, ny0=Math.abs(p.y-y0)<=t, ny1=Math.abs(p.y-y1)<=t;
  const inX=p.x>=x0-t && p.x<=x1+t, inY=p.y>=y0-t && p.y<=y1+t;
  if (ny0&&nx0) return 'nw'; if (ny0&&nx1) return 'ne'; if (ny1&&nx0) return 'sw'; if (ny1&&nx1) return 'se';
  if (ny0&&inX) return 'n'; if (ny1&&inX) return 's'; if (nx0&&inY) return 'w'; if (nx1&&inY) return 'e';
  if (p.x>x0 && p.x<x1 && p.y>y0 && p.y<y1) return 'move';
  return 'new';
}
function snapV(v, cands, tol) { let best=v, bd=tol; for (const c of cands) { const d=Math.abs(v-c); if (d<=bd) { bd=d; best=c; } } return best; }
// Apply a crop drag with aspect lock and snapping.
function adjustCrop(mode, s, dx, dy, W, H, it, tol) {
  const ys=[0,H]; if (it.analysis?.footerDetected) ys.push(it.analysis.footerY);
  if (mode==='move') {
    let x=clamp(s.x+dx,0,W-s.w), y=clamp(s.y+dy,0,H-s.h);
    if (tol) {
      const sx=snapV(x,[0],tol); x = sx!==x ? sx : snapV(x+s.w,[W],tol)-s.w;
      const sy=snapV(y,[0],tol); y = sy!==y ? sy : snapV(y+s.h,ys,tol)-s.h;
    }
    return {x, y, w:s.w, h:s.h};
  }
  let x0=s.x, y0=s.y, x1=s.x+s.w, y1=s.y+s.h;
  if (mode.includes('w')) x0+=dx; if (mode.includes('e')) x1+=dx;
  if (mode.includes('n')) y0+=dy; if (mode.includes('s')) y1+=dy;
  x0=clamp(x0,0,W); x1=clamp(x1,0,W); y0=clamp(y0,0,H); y1=clamp(y1,0,H);
  if (tol) {
    if (mode.includes('w')) x0=snapV(x0,[0,W],tol); if (mode.includes('e')) x1=snapV(x1,[0,W],tol);
    if (mode.includes('n')) y0=snapV(y0,ys,tol); if (mode.includes('s')) y1=snapV(y1,ys,tol);
  }
  const ratio=aspectRatio();
  if (ratio) {
    let w=Math.abs(x1-x0), h=Math.abs(y1-y0);
    if (mode==='n'||mode==='s') w=h*ratio; else if (mode==='e'||mode==='w') h=w/ratio; else if (w/ratio>h) h=w/ratio; else w=h*ratio;
    const sx=x1>=x0?1:-1, sy=y1>=y0?1:-1;
    if (mode.includes('w')) x0=x1-sx*w; else x1=x0+sx*w;
    if (mode.includes('n')) y0=y1-sy*h; else y1=y0+sy*h;
  }
  return {x:Math.min(x0,x1), y:Math.min(y0,y1), w:Math.abs(x1-x0), h:Math.abs(y1-y0)};
}
// Magnifier next to the pointer while cropping.
function showLoupe(cx, cy, p, it) {
  const L=els.cropLoupe, wrap=L.parentElement, wr=wrap.getBoundingClientRect(), S=L.width, zoom=5;
  const reg=S*p.k/zoom, ox=p.x-reg/2, oy=p.y-reg/2, f=S/reg, lc=L.getContext('2d');
  lc.imageSmoothingEnabled=false; lc.fillStyle='#111'; lc.fillRect(0,0,S,S);
  lc.drawImage(sourceBitmap(it), ox, oy, reg, reg, 0, 0, S, S);
  const cr=getCrop(it);
  lc.fillStyle='rgba(0,0,0,.45)';
  const rx0=(cr.x-ox)*f, ry0=(cr.y-oy)*f, rx1=(cr.x+cr.w-ox)*f, ry1=(cr.y+cr.h-oy)*f;
  lc.fillRect(0,0,S,Math.max(0,ry0)); lc.fillRect(0,ry1,S,S-ry1); lc.fillRect(0,ry0,Math.max(0,rx0),ry1-ry0); lc.fillRect(rx1,ry0,S-rx1,ry1-ry0);
  lc.strokeStyle='#ffd60a'; lc.lineWidth=1.5; lc.strokeRect(rx0,ry0,rx1-rx0,ry1-ry0);
  lc.strokeStyle='rgba(255,59,48,.85)'; lc.lineWidth=1; lc.beginPath(); lc.moveTo(S/2,0); lc.lineTo(S/2,S); lc.moveTo(0,S/2); lc.lineTo(S,S/2); lc.stroke();
  lc.fillStyle='rgba(0,0,0,.65)'; lc.fillRect(0,S-20,S,20);
  lc.fillStyle='#fff'; lc.font='11px ui-monospace, monospace'; lc.textBaseline='alphabetic';
  lc.fillText('x '+Math.round(p.x)+'  y '+Math.round(p.y), 6, S-6);
  let left=cx-wr.left+wrap.scrollLeft+22, top=cy-wr.top+wrap.scrollTop-S-22;
  if (left+S>wrap.scrollLeft+wrap.clientWidth) left=cx-wr.left+wrap.scrollLeft-S-22;
  if (top<wrap.scrollTop) top=cy-wr.top+wrap.scrollTop+22;
  L.style.left=left+'px'; L.style.top=top+'px'; L.hidden=false;
}
let cropDrag=null, cropFrame=0, lastCropEvt=null, pickDrag=null;
// "Pick bar": drag a box around the scale bar (and its label) on the Source preview.
function setPickBar(on) {
  state.pickBar=!!on;
  const b=document.getElementById('pickBarBtn'); if (b) { b.classList.toggle('active',state.pickBar); b.setAttribute('aria-pressed',String(state.pickBar)); }
  els.sourceCanvas.style.cursor=state.pickBar?'crosshair':'';
  if (state.pickBar && state.cropTool) els.cropToolBtn.click();
  if (state.pickBar) showToast(window.semI18n?.t('Drag a box around the scale bar and its label on the Source image.') ?? 'Drag a box around the scale bar and its label on the Source image.', 3500);
}
async function pickBarFromRect(it, r) {
  const ov=detectOverlayBar(it.imageData, r);
  const T=s=>window.semI18n?.t(s)??s;
  if (!ov) { showToast(T('No scale bar found in the box. Draw it closer around the bar line.'),4000); return; }
  if (typeof histCheck==='function') histCheck();
  const a=it.analysis||(it.analysis={footerY:it.imageData.height, footerDetected:false, labelCands:[], notes:[]});
  a.overlay=ov; a.bar={x:ov.bar.x, y:ov.bar.y, w:ov.bar.w, h:ov.bar.h, kind:'picked'}; a.labelCands=ov.label?[ov.label]:[];
  a.notes=(a.notes||[]).filter(n=>!/Scale bar was not detected|Optical-microscope scale bar found|Scale bar picked/.test(n));
  a.notes.push('Scale bar picked by hand.');
  it._erased=null; it._base=null; it.barPxOverride=null; it.targetBarPx=null; it.plain=false; it.noScale=false; it.ocrDismissed=false;
  if (!a.footerDetected) { const p=ov.pol; it.scaleStyle={...(it.scaleStyle||{}), hl:true, hlColor:p>0?'#000000':'#ffffff', color:p>0?'#ffffff':'#000000'}; }
  setPickBar(false);
  if (typeof histSchedule==='function') histSchedule();
  if (ov.label) {
    it.sourceManual=false;
    await processItem(it,0,1,settings()); setProgress(0,'');
    if (it.status==='ok') showToast(T('Scale bar picked')+`: ${ov.bar.w}px → ${it.sourceScaleText}`);
    else showToast(it.error,4500);
  } else {
    it.sourceManual=true; it.outputCanvas=null; it.outputBlob=null; it.error='';
    if (it.sourceScaleText) { try { finalizeAndRender(it); } catch(e) { it.status='error'; it.error=e.message; } } else it.status='waiting';
    renderUI(); if (!it.sourceScaleText) els.srcScaleInput?.focus();
    showToast(T('Bar measured')+`: ${ov.bar.w}px. `+(it.sourceScaleText?`${T('Scale value kept')}: ${it.sourceScaleText}.`:T('No label found — enter the scale value in Calibration and click Apply calibration.')),5000);
  }
}
els.sourceCanvas.addEventListener('pointerdown', e=>{
  state.lastCanvas='source';
  if (state.pickBar) {
    const it=selectedItem(); if (!it?.imageData) return;
    const p=canvasPoint(els.sourceCanvas,e);
    pickDrag={s:{x:p.x,y:p.y}, r:{x:p.x,y:p.y,w:0,h:0}};
    e.preventDefault(); els.sourceCanvas.setPointerCapture(e.pointerId); return;
  }
  if (!state.cropTool) return;
  const it=selectedItem(); if (!it?.imageData) return;
  const p=canvasPoint(els.sourceCanvas,e), cr=getCrop(it);
  let mode=cropMode(p,cr);
  if (mode==='new') cropDrag={mode:'se', start:p, s:{x:clamp(p.x,0,it.imageData.width), y:clamp(p.y,0,it.imageData.height), w:0, h:0}, isNew:true};
  else cropDrag={mode, start:p, s:cr};
  state.cropMode=cropDrag.mode; state.cropDragging=true;
  e.preventDefault();
  els.sourceCanvas.setPointerCapture(e.pointerId);
  drawSource(it); showLoupe(e.clientX,e.clientY,p,it);
});
els.sourceCanvas.addEventListener('pointermove', e=>{
  const it=selectedItem(); if (!it?.imageData) return;
  const p=canvasPoint(els.sourceCanvas,e);
  if (pickDrag) {
    const W=it.imageData.width, H=it.imageData.height, x=clamp(p.x,0,W), y=clamp(p.y,0,H);
    pickDrag.r={x:Math.min(x,pickDrag.s.x), y:Math.min(y,pickDrag.s.y), w:Math.abs(x-pickDrag.s.x), h:Math.abs(y-pickDrag.s.y)};
    drawSource(it); return;
  }
  if (state.pickBar) { els.sourceCanvas.style.cursor='crosshair'; return; }
  if (!cropDrag) { els.sourceCanvas.style.cursor=state.cropTool?HANDLE_CURSOR[cropMode(p,getCrop(it))]:''; return; }
  const W=it.imageData.width, H=it.imageData.height, d=cropDrag;
  const r=adjustCrop(d.mode,d.s,p.x-d.start.x,p.y-d.start.y,W,H,it,e.altKey?0:10*p.k);
  lastCropEvt={cx:e.clientX, cy:e.clientY, p};
  const ok=r.x>=-0.5 && r.y>=-0.5 && r.x+r.w<=W+0.5 && r.y+r.h<=H+0.5 && !(d.isNew && (r.w<8||r.h<8));
  if (ok) it.crop={x:Math.round(r.x), y:Math.round(r.y), w:Math.max(8,Math.round(r.w)), h:Math.max(8,Math.round(r.h))};
  if (!cropFrame) cropFrame=requestAnimationFrame(()=>{ cropFrame=0; drawSource(it); updateCropInputs(it); if (lastCropEvt) showLoupe(lastCropEvt.cx,lastCropEvt.cy,lastCropEvt.p,it); });
});
const endCropDrag=()=>{
  if (!cropDrag) return;
  cropDrag=null; state.cropDragging=false; els.cropLoupe.hidden=true;
  const it=selectedItem(); if (it) onCropChanged(it);
};
const endPickDrag=e=>{
  if (!pickDrag) return false;
  const r=pickDrag.r; pickDrag=null;
  const it=selectedItem(); if (!it?.imageData) return true;
  drawSource(it);
  if (e.type==='pointerup') { if (r.w>=6 && r.h>=3) pickBarFromRect(it,r); else showToast(window.semI18n?.t('Draw a larger box around the bar.')??'Draw a larger box around the bar.'); }
  return true;
};
els.sourceCanvas.addEventListener('pointerup', e=>{ if (!endPickDrag(e)) endCropDrag(e); });
els.sourceCanvas.addEventListener('pointercancel', e=>{ if (!endPickDrag(e)) endCropDrag(e); });

document.addEventListener('keydown', e=>{
  const tag=(e.target.tagName||'').toLowerCase();
  if (['input','textarea','select'].includes(tag) || e.target.isContentEditable) return;
  if (state.tab==='compose') {
    const doc=compose.doc, o=selObj(doc); if (!o || state.lastCanvas!=='compose') return;
    if (e.key==='Delete' || e.key==='Backspace') { e.preventDefault(); deleteObj(doc,o); return; }
    const mv={ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]}[e.key]; if (!mv) return;
    e.preventDefault(); const st=e.shiftKey?10:1, D=objDims(doc);
    moveObj(o, mv[0]*st/D.w, mv[1]*st/D.h); objRerender(0); return;
  }
  const it=selectedItem(); if (!it) return;
  const arrows={ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]}, st=e.shiftKey?10:1, a=arrows[e.key];
  const o=selObj(it);
  if (state.lastCanvas==='result' && o) {
    if (e.key==='Delete' || e.key==='Backspace') { e.preventDefault(); deleteObj(it,o); return; }
    if (!a) return;
    e.preventDefault();
    const cr=it.renderMeta?.crop||getCrop(it);
    moveObj(o, a[0]*st/cr.w, a[1]*st/cr.h); rerenderSelectedSoon(0);
    return;
  }
  if (state.lastCanvas==='source' && state.cropTool && it.imageData && a) {
    e.preventDefault();
    const W=it.imageData.width, H=it.imageData.height;
    const r=adjustCrop(state.cropMode||'move', getCrop(it), a[0]*st, a[1]*st, W, H, it, 0);
    if (r.w>=8 && r.h>=8 && r.x>=0 && r.y>=0 && r.x+r.w<=W && r.y+r.h<=H) { it.crop={x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.w), h:Math.round(r.h)}; onCropChanged(it); }
  }
});

function onCropChanged(it) {
  if (renderable(it) && it.status!=='working') { try { renderInto(it); } catch(e) { it.error=e.message; } }
  renderUI();
}

