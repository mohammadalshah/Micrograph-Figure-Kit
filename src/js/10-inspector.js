// =====================================================================
// Micrograph Figure Kit — 10. Preview and inspector UI
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Source/result canvases, object list and the right-hand inspector.
// =====================================================================
function statusLabel(item) {
  if (item.status==='working') return ['Working','working'];
  if (item.status==='ok') return [item.plain?'Picture':'Ready','ok'];
  if (item.status==='error') return ['Error','error'];
  return ['Waiting','waiting'];
}

// Paint the Source preview with the crop overlay.
function drawSource(item) {
  const c=els.sourceCanvas, id=item.imageData;
  if (c.width!==id.width || c.height!==id.height) { c.width=id.width; c.height=id.height; }
  const ctx=c.getContext('2d');
  ctx.drawImage(sourceBitmap(item),0,0);
  const lw=Math.max(2,Math.round(id.width/500));
  const a=item.analysis;
  if (els.showDetection.checked && a) {
    ctx.save(); ctx.lineWidth=lw;
    if (a.footerDetected) { ctx.strokeStyle='#ff3b30'; ctx.beginPath(); ctx.moveTo(0,a.footerY+.5); ctx.lineTo(id.width,a.footerY+.5); ctx.stroke(); }
    if (a.bar) { ctx.strokeStyle='#00d084'; ctx.strokeRect(a.bar.x-.5,a.bar.y-.5,a.bar.w+1,a.bar.h+1); }
    ctx.strokeStyle='#3b82f6';
    for (const l of a.labelCands||[]) ctx.strokeRect(l.x-1.5,l.y-1.5,l.w+3,l.h+3);
    ctx.restore();
  }
  if (pickDrag && pickDrag.r.w>0) {
    const rr=c.getBoundingClientRect(), k=rr.width ? c.width/rr.width : lw/2, r=pickDrag.r;
    ctx.save(); ctx.fillStyle='rgba(255,204,0,.15)'; ctx.fillRect(r.x,r.y,r.w,r.h);
    ctx.strokeStyle='#ffcc00'; ctx.lineWidth=2*k; ctx.setLineDash([6*k,4*k]); ctx.strokeRect(r.x,r.y,r.w,r.h); ctx.restore();
  }
  const cr=getCrop(item);
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.5)';
  ctx.fillRect(0,0,id.width,cr.y);
  ctx.fillRect(0,cr.y+cr.h,id.width,id.height-cr.y-cr.h);
  ctx.fillRect(0,cr.y,cr.x,cr.h);
  ctx.fillRect(cr.x+cr.w,cr.y,id.width-cr.x-cr.w,cr.h);
  if (state.cropTool) {
    const rr=c.getBoundingClientRect(), k=rr.width ? c.width/rr.width : lw/2;
    ctx.strokeStyle='#fff'; ctx.lineWidth=1.5*k; ctx.setLineDash([6*k,4*k]);
    ctx.strokeRect(cr.x,cr.y,cr.w,cr.h);
    ctx.setLineDash([]);
    if (state.cropDragging) {
      ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=k; ctx.beginPath();
      for (let i=1;i<3;i++) { const gx=cr.x+cr.w*i/3, gy=cr.y+cr.h*i/3; ctx.moveTo(gx,cr.y); ctx.lineTo(gx,cr.y+cr.h); ctx.moveTo(cr.x,gy); ctx.lineTo(cr.x+cr.w,gy); }
      ctx.stroke();
    }
    const hs=12*k, eb=24*k, et=6*k;
    ctx.fillStyle='#fff'; ctx.strokeStyle='#111827'; ctx.lineWidth=k;
    for (const [px,py] of [[cr.x,cr.y],[cr.x+cr.w,cr.y],[cr.x,cr.y+cr.h],[cr.x+cr.w,cr.y+cr.h]]) { ctx.fillRect(px-hs/2,py-hs/2,hs,hs); ctx.strokeRect(px-hs/2,py-hs/2,hs,hs); }
    for (const [px,py,hor] of [[cr.x+cr.w/2,cr.y,1],[cr.x+cr.w/2,cr.y+cr.h,1],[cr.x,cr.y+cr.h/2,0],[cr.x+cr.w,cr.y+cr.h/2,0]]) {
      const bw=hor?eb:et, bh=hor?et:eb; ctx.fillRect(px-bw/2,py-bh/2,bw,bh); ctx.strokeRect(px-bw/2,py-bh/2,bw,bh);
    }
    if (state.cropDragging) {
      const t=cr.w+' × '+cr.h+' px', fsz=13*k;
      ctx.font='600 '+fsz+'px ui-monospace, monospace';
      const tw=ctx.measureText(t).width, lx=cr.x+8*k, ly=cr.y+8*k;
      ctx.fillStyle='rgba(17,24,39,.8)'; ctx.fillRect(lx,ly,tw+12*k,fsz+10*k);
      ctx.fillStyle='#fff'; ctx.textBaseline='top'; ctx.fillText(t,lx+6*k,ly+5*k);
    }
  }
  ctx.restore();
}

// Canvas px per CSS px (for constant-size handles).
function displayK(c) { const r=c.getBoundingClientRect(); return r.width ? c.width/r.width : 1; }
// Item whose objects are being edited (image or composed figure).
function objTarget() { return state.tab==='compose' ? compose.doc : selectedItem(); }
function objDims(t) { return t?.isFigure ? {w:compose.canvas?.width||1000, h:compose.canvas?.height||1000} : (t?.renderMeta?.crop||getCrop(t)); }
function objRefresh(t) { if (t?.isFigure) { finishCompose(); paintCompose(); renderObjList(t); } else renderUI(); }
function objRerender(delay) { if (state.tab==='compose') { clearTimeout(objRerender._t); objRerender._t=setTimeout(()=>objRefresh(compose.doc), delay??60); } else rerenderSelectedSoon(delay); }
// Selection outline and resize handles.
function drawSelection(ctx, c, sh) {
  const k=displayK(c), hs=10*k;
  ctx.save(); ctx.strokeStyle='#3b82f6'; ctx.lineWidth=1.5*k; ctx.setLineDash([5*k,4*k]);
  if (sh.rot) objRotate(ctx,sh.x+sh.w/2,sh.y+sh.h/2,sh.rot);
  if (sh.seg) { ctx.beginPath(); ctx.moveTo(sh.x1,sh.y1); ctx.lineTo(sh.x2,sh.y2); ctx.stroke(); } else ctx.strokeRect(sh.x,sh.y,sh.w,sh.h);
  ctx.setLineDash([]);
  for (const p of objHandles(sh)) { ctx.fillStyle='#fff'; ctx.fillRect(p.x-hs/2,p.y-hs/2,hs,hs); ctx.strokeRect(p.x-hs/2,p.y-hs/2,hs,hs); }
  if (rotHandlePos(sh,k)) { const cx=sh.x+sh.w/2, ty=sh.y-24*k;
    ctx.beginPath(); ctx.moveTo(cx,sh.y); ctx.lineTo(cx,ty+hs*0.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,ty,hs*0.6,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,ty,hs*0.3,-Math.PI*0.9,Math.PI*0.4); ctx.stroke(); }
  ctx.restore();
}
function selObj(item) { return item?.selObj ? (item.objects.find(o=>o.id===item.selObj)||null) : null; }
// ---- Multi-selection (Ctrl/⌘/Shift + click) ----
// item.multi holds the ids in click order; the first one is the alignment anchor.
function multiIds(item) {
  if (!item) return [];
  const ids=new Set(item.objects.map(o=>o.id));
  let m=(item.multi||[]).filter(id=>ids.has(id));
  if (item.selObj && !m.includes(item.selObj)) m=[item.selObj];
  if (!item.selObj && m.length<2) m=[];
  item.multi=m; return m;
}
function toggleMulti(item, id) {
  const m=multiIds(item).slice(), i=m.indexOf(id);
  if (i>=0) m.splice(i,1); else m.push(id);
  item.multi=m; item.selObj=m.includes(id)?id:(m[m.length-1]||null);
}
function drawMulti(ctx, c, item) {
  const m=multiIds(item); if (m.length<2) return;
  const k=displayK(c); ctx.save(); ctx.strokeStyle='#f59e0b'; ctx.lineWidth=2*k; ctx.setLineDash([4*k,3*k]);
  for (const h of item.renderMeta?.hits||[]) if (h.kind==='obj' && m.includes(h.id) && h.id!==item.selObj) ctx.strokeRect(h.x-2*k,h.y-2*k,h.w+4*k,h.h+4*k);
  ctx.restore();
}
// Move one object so its hit box shifts by (dx, dy) canvas px.
function shiftObjPx(o, hit, dx, dy, W, H) {
  if (o.type==='text') { o.x=clamp((hit.x+dx)/W,0,1); o.y=clamp((hit.y+dy)/H,0,1); }
  else moveObj(o, dx/W, dy/H);
}
function alignObjects(item, mode) {
  const m=multiIds(item); if (m.length<2) return;
  const hits=item.renderMeta?.hits||[], W=objDims(item).w, H=objDims(item).h;
  const list=m.map(id=>({o:item.objects.find(x=>x.id===id), h:hits.find(x=>x.kind==='obj'&&x.id===id)})).filter(e=>e.o&&e.h).map(e=>({...e, b:rotBounds(e.h)}));
  if (list.length<2) return;
  const a=list[0].b;
  if (mode==='size') {
    const src=list[0].o; if (src.type!=='text') { showToast('The first selected object must be a text.'); return; }
    for (const e of list) if (e.o.type==='text') e.o.size=src.size;
    objRerender(0); return;
  }
  if (mode==='distH' || mode==='distV') {
    if (list.length<3) { showToast('Select at least 3 objects to distribute.'); return; }
    const hz=mode==='distH', pos=h=>hz?h.x:h.y, len=h=>hz?h.w:h.h;
    const s=list.slice().sort((p,q)=>pos(p.b)-pos(q.b));
    const start=pos(s[0].b), end=pos(s[s.length-1].b)+len(s[s.length-1].b);
    const gap=(end-start-s.reduce((t,e)=>t+len(e.b),0))/(s.length-1);
    let cur=start;
    for (const e of s) { const d=cur-pos(e.b); shiftObjPx(e.o,e.h,hz?d:0,hz?0:d,W,H); cur+=len(e.b)+gap; }
    objRerender(0); return;
  }
  for (const e of list.slice(1)) {
    const h=e.b; let dx=0, dy=0;
    if (mode==='row') dy=(a.y+a.h/2)-(h.y+h.h/2);
    else if (mode==='top') dy=a.y-h.y;
    else if (mode==='bottom') dy=(a.y+a.h)-(h.y+h.h);
    else if (mode==='col') dx=(a.x+a.w/2)-(h.x+h.w/2);
    else if (mode==='left') dx=a.x-h.x;
    else if (mode==='right') dx=(a.x+a.w)-(h.x+h.w);
    shiftObjPx(e.o,e.h,dx,dy,W,H);
  }
  objRerender(0);
}
// Axis-aligned bounds of a (possibly rotated) hit box.
function rotBounds(h) {
  if (!h.rot) return {x:h.x, y:h.y, w:h.w, h:h.h};
  const c=Math.abs(Math.cos(h.rot)), s=Math.abs(Math.sin(h.rot)), w=h.w*c+h.h*s, hh=h.w*s+h.h*c;
  return {x:h.x+h.w/2-w/2, y:h.y+h.h/2-hh/2, w, h:hh};
}
// Rotation handle above the top edge of texts and shapes (PowerPoint style), in canvas px.
function rotHandlePos(sh, k) {
  if (!sh || sh.seg || !['text','rect','ellipse'].includes(sh.type)) return null;
  const cx=sh.x+sh.w/2, cy=sh.y+sh.h/2, ly=sh.y-24*k-cy, a=sh.rot||0;
  return {x:cx-ly*Math.sin(a), y:cy+ly*Math.cos(a)};
}
function syncAlignRow(item) {
  const n=multiIds(item).length, row=$('#alignRow'); if (!row) return;
  row.classList.toggle('off', n<2);
  $('#alignInfo').textContent=n<2 ? 'Ctrl + click texts or objects (on the image or in the list above) to select several and align them.' : n+' selected — aligned to the first one you picked (solid outline is the last).';
}
function selHit(item) { return item?.selObj ? ((item.renderMeta?.hits||[]).find(h=>h.kind==='obj'&&h.id===item.selObj)||null) : null; }
function objHandles(h) {
  if (h.rot) return []; // rotated: resize with Width/Height in the properties
  if (h.seg) return [{id:'p1',x:h.x1,y:h.y1},{id:'p2',x:h.x2,y:h.y2}];
  if (h.type==='text') return [{id:'se',x:h.x+h.w,y:h.y+h.h}];
  const x=h.x, y=h.y, w=h.w, hh=h.h;
  return [{id:'nw',x,y},{id:'ne',x:x+w,y},{id:'sw',x,y:y+hh},{id:'se',x:x+w,y:y+hh},{id:'n',x:x+w/2,y},{id:'s',x:x+w/2,y:y+hh},{id:'w',x,y:y+hh/2},{id:'e',x:x+w,y:y+hh/2}];
}
// Paint the Result preview with the selection.
function paintResult(item) {
  const c=els.resultCanvas;
  if (!item?.outputCanvas) { c.width=1; c.height=1; c.getContext('2d').clearRect(0,0,1,1); els.outputDims.textContent='—'; return; }
  if (c.width!==item.outputCanvas.width || c.height!==item.outputCanvas.height) { c.width=item.outputCanvas.width; c.height=item.outputCanvas.height; }
  const ctx=c.getContext('2d');
  ctx.drawImage(item.outputCanvas,0,0);
  const sh=selHit(item);
  if (sh) drawSelection(ctx,c,sh);
  drawMulti(ctx,c,item);
  if (typeof measOverlay==='function') measOverlay(ctx,c,item);
  els.outputDims.textContent=item.outputCanvas.width+' × '+item.outputCanvas.height+'px';
}

function syncScaleField(inputEl, sel, scaleText) {
  if (!scaleText) { setVal(inputEl,''); return; }
  try { const p=parseScaleText(scaleText); setVal(inputEl, fmtNum(p.value)); if (document.activeElement!==sel) setActiveUnit(sel, p.unit); }
  catch (_) { setVal(inputEl,''); }
}

function updateCropInputs(item) {
  if (!item?.imageData) { [els.cropX,els.cropY,els.cropW,els.cropH].forEach(e=>setVal(e,'')); return; }
  const cr=getCrop(item);
  setVal(els.cropX,cr.x); setVal(els.cropY,cr.y); setVal(els.cropW,cr.w); setVal(els.cropH,cr.h);
}

const OBJ_NAMES={text:'Text', rect:'Rectangle', ellipse:'Circle', arrow:'Arrow', line:'Line', inset:'Inset'};
function objLabel(o) {
  if (o.type==='text') {
    const t=String(o.text||'').replace(/<[^>]+>/g,'').replace(/[\^_]\{([^{}]*)\}/g,'$1').replace(/\s+/g,' ').trim();
    return 'T  '+(t.length>18?t.slice(0,18)+'…':(t||'(empty)'));
  }
  if (o.insetSrc) return 'Inset area';
  if (o.type==='inset') return 'Inset';
  return o.dashed ? 'Dashed '+OBJ_NAMES[o.type].toLowerCase() : OBJ_NAMES[o.type];
}
// text / shape / arrow / line — decides which property fields are shown.
function objGroup(o) { return o.type==='inset'?'inset':o.type==='text'?'text':(o.type==='rect'||o.type==='ellipse')?'shape':o.type; }
function setChk(el,v) { if (document.activeElement!==el) el.checked=!!v; }
function fillObjFont() {
  const sel=els.objFont; if (!sel) return;
  const cur=sel.value;
  sel.innerHTML='<option value="">Same as scale label</option>';
  for (const o of els.fontFamily.options) { if (o.disabled) continue; const n=document.createElement('option'); n.value=o.value; n.textContent=o.textContent; sel.appendChild(n); }
  sel.value=cur; if (sel.value!==cur) sel.value='';
}
// Chips listing the objects on the current image.
function renderObjList(item) {
  els.objList.innerHTML='';
  const mm=multiIds(item);
  if (item) for (const o of item.objects) {
    if (o.type==='erase') continue;
    const b=document.createElement('button'); b.type='button';
    b.className='file-chip'+(o.id===item.selObj?' active':'')+(mm.length>1&&mm.includes(o.id)?' multi':''); b.textContent=objLabel(o);
    b.onclick=e=>{ if (e.ctrlKey||e.metaKey||e.shiftKey) toggleMulti(item,o.id); else { item.selObj=o.id; if (!mm.includes(o.id)) item.multi=[o.id]; } state.lastCanvas=item.isFigure?'compose':'result'; objRefresh(item); };
    els.objList.appendChild(b);
  }
  syncAlignRow(item);
  syncObjProps(item);
}
// Fill the property panel from the selected object.
function syncObjProps(item) {
  const o=selObj(item); els.objProps.hidden=!o; if (!o) return;
  const g=objGroup(o), cr=objDims(item);
  els.objCopyAll.hidden=!!item.isFigure;
  els.objProps.querySelectorAll('[data-for]').forEach(el=>{ el.hidden=!el.dataset.for.split(' ').includes(g); });
  els.objTypeLabel.textContent=o.type==='text'?'Text':objLabel(o);
  setVal(els.objColor,o.color); setChk(els.objOutline,o.outline); setVal(els.objOutlineColor,o.outlineColor);
  if (g==='text') {
    setVal(els.objText,o.text); if (document.activeElement!==els.objFont) els.objFont.value=o.font||''; setVal(els.objSize,o.size||0);
    setChk(els.objBold,o.bold); setChk(els.objItalic,o.italic); setChk(els.objUnderline,o.underline); setChk(els.objStrike,o.strike);
    setChk(els.objBg,o.bg); setVal(els.objBgColor,o.bgColor);
  } else { setVal(els.objStrokeW,o.sw); setChk(els.objDashed,o.dashed); }
  if (g==='shape') {
    setVal(els.objW,Math.round(o.w*cr.w)); setVal(els.objH,Math.round(o.h*cr.h));
    setChk(els.objFill,o.fill); setVal(els.objFillColor,o.fillColor); setVal(els.objFillOpacity,o.fillOpacity); setChk(els.objLock,o.lock);
  }
  if (g==='inset') { setVal(els.objW,Math.round(o.w*cr.w)); setChk(document.getElementById('objLines'),o.lines!==false); }
  if (g==='arrow'||g==='line') setVal(els.objLen,Math.round(Math.hypot((o.x2-o.x1)*cr.w,(o.y2-o.y1)*cr.h)));
  if (g==='arrow') { setVal(els.objHead,o.head||0); setChk(els.objDouble,o.double); }
  if (g==='arrow'||g==='line') setVal(els.objRot,Math.round(Math.atan2(-(o.y2-o.y1)*cr.h,(o.x2-o.x1)*cr.w)*180/Math.PI));
  else setVal(els.objRot,Math.round(Number(o.rot)||0));
}

// Fill the inspector from the selected item.
function syncSelectedControls(item) {
  const cfg=settings();
  syncScaleField(els.selectedScaleInput, els.selectedScaleUnitToggle, item?.targetScaleText||item?.sourceScaleText||'');
  syncScaleField(els.srcScaleInput, els.srcScaleUnitToggle, item?.sourceScaleText||'');
  setVal(els.origBarInput, originalBarPx(item)||'');
  setVal(els.selectedBarLengthInput, item?.targetBarPx||originalBarPx(item)||'');
  setVal(els.selectedBarThicknessInput, item?.targetBarThicknessPx||'');
  if (els.panelLabelInput) setVal(els.panelLabelInput, item?.panelLabel||'');
  if (els.panelLabelInput) els.panelLabelInput.placeholder = item ? `auto: ${panelText(state.items.indexOf(item), cfg.panelFormat)}` : 'auto';
  window.lblClean?.sync();
  updateCropInputs(item);
  if (state.tab!=='compose') renderObjList(item);
}

function syncPreview(item) {
  if (!item?.imageData) {
    els.sourceCanvas.width=1; els.sourceCanvas.height=1;
    paintResult(null);
    els.sourceDims.textContent='';
    els.selectedWarning.hidden=!item?.error;
    els.selectedWarning.textContent=item?.error||'';
    syncOcrBadge(null);
    syncSelectedControls(null);
    return;
  }
  drawSource(item);
  els.sourceDims.textContent=`${item.imageData.width} × ${item.imageData.height}px`;
  paintResult(item);
  const a=item.analysis;
  els.metricFooter.textContent=a?.footerDetected?`y = ${a.footerY}px`:'not found';
  els.metricBar.textContent=originalBarPx(item)?`${originalBarPx(item)}px${item.barPxOverride?' (manual)':''}`:'—';
  els.metricOcr.textContent=item.ocrRaw||'—';
  els.metricOcr.title=item.ocrRaw||'';
  syncOcrBadge(item);
  let cfg=settings(), show=(t)=>{ try { return displayScale(t,cfg); } catch(_) { return t||'—'; } };
  els.metricSourceScale.textContent=item.sourceScaleText?show(item.sourceScaleText):'—';
  els.metricOutputScale.textContent=(item.targetScaleText||item.sourceScaleText)?show(item.targetScaleText||item.sourceScaleText):'—';
  els.metricOutputBar.textContent=(item.targetBarPx||originalBarPx(item))?`${item.targetBarPx||originalBarPx(item)}px`:'—';
  syncSelectedControls(item);
  els.downloadSelectedBtn.disabled=!item.outputCanvas;
  const msgs=[item.error, ...(a?.notes||[]), ...(item.status==='ok'?(item.renderMeta?.warnings||[]):[])].filter(Boolean);
  els.selectedWarning.hidden=!msgs.length;
  els.selectedWarning.textContent=[...new Set(msgs)].join('\n');
}

// Yellow badge on the Result preview when OCR was unsure about the scale label.
function syncOcrBadge(item) {
  const uns=ocrUnsure(item), T=s=>window.semI18n?.t(s)??s, ob=document.getElementById('ocrBadge');
  els.metricOcr.parentElement.classList.toggle('ocr-unsure',uns);
  if (!ob) return;
  ob.hidden=!uns; if (!uns) return;
  ob.innerHTML=''; const tx=document.createElement('span'); tx.style.cssText='overflow:hidden;text-overflow:ellipsis';
  tx.textContent='⚠ '+T('Check scale')+': “'+item.ocrRaw+'” → '+item.sourceScaleText+' · '+Math.round(item.ocrConf)+'%';
  const x=document.createElement('span'); x.textContent='×'; x.title=T('Hide for this image'); x.style.cssText='flex:none;margin-left:2px;padding:0 4px;font-size:14px;line-height:1;border-radius:999px';
  ob.append(tx,x);
  ob.title=T('OCR is not sure about the scale label. Click to check the source scale in Calibration.');
  ob.onclick=e=>{ if (e.target===x) { item.ocrDismissed=true; syncOcrBadge(item); return; } const i=els.srcScaleInput; if (!i) return; let d=i.closest('details'); while (d) { d.open=true; d=d.parentElement?.closest('details'); }
    i.focus(); i.select?.(); i.classList.add('ocr-unsure-input'); setTimeout(()=>i.classList.remove('ocr-unsure-input'),3000); };
}
// Refresh the whole Clean tab.
// Reorder state.items (drag in the file strip or ◀ ▶ buttons), then redraw so auto letters follow the new order.
function moveItemTo(id, targetId, after) {
  const from=state.items.findIndex(x=>x.id===id); if (from<0) return;
  const [it]=state.items.splice(from,1);
  let to=state.items.findIndex(x=>x.id===targetId); if (to<0) to=state.items.length; else if (after) to++;
  state.items.splice(to,0,it);
  if (typeof compose!=='undefined') compose.order=state.items.filter(x=>compose.order.includes(x.id)).map(x=>x.id).concat(compose.order.filter(i=>!state.items.some(x=>x.id===i)));
  rerenderAllNow();
}
function moveItemBy(id, dir) {
  const i=state.items.findIndex(x=>x.id===id), j=i+dir; if (i<0 || j<0 || j>=state.items.length) return;
  moveItemTo(id, state.items[j].id, dir>0);
}
function renderUI() {
  syncAdjUI(); if (typeof syncBatch==='function') syncBatch(); if (typeof renderMeasCard==='function') renderMeasCard();
  const n=state.items.length, ok=state.items.filter(x=>x.status==='ok').length, err=state.items.filter(x=>x.status==='error').length;
  els.emptyState.hidden=n>0; els.workspace.hidden=n===0;
  els.processBtn.disabled=!n||state.busy||!state.items.some(x=>x.imageData);
  const newCount=state.items.filter(isUnprocessed).length;
  els.processNewBtn.disabled=state.busy||!newCount;
  els.processNewBtn.textContent=newCount?`Process new (${newCount})`:'Process new';
  els.processOneBtn.disabled=state.busy||!selectedItem()?.imageData;
  { const b=$('#plainToggleBtn'), it=selectedItem(); if (b) { b.disabled=state.busy||!it?.imageData; b.textContent=it?.plain?'Treat as image with scale bar':'Treat as picture (no scale bar)'; } }
  els.saveAllBtn.disabled=!ok||state.busy;
  for (const s of ['#saveAllTifBtn','#saveAllPdfBtn','#saveAllSvgBtn']) { const b=$(s); if (b) b.disabled=!ok||state.busy; }
  els.selectOutputFolderBtn.disabled=state.busy;
  els.outputFolderStatus.textContent = state.outputDirHandle ? `Output folder: ${state.outputDirHandle.name}` : 'Output folder: browser default';
  els.zipBtn.disabled=!ok||state.busy; els.auditBtn.disabled=!ok;
  els.summaryText.textContent=n?`${n} file(s) • ready: ${ok}${err?` • errors: ${err}`:''}`:'Add at least one image.';

  els.fileStrip.innerHTML='';
  // Each file chip has its own ▶ button to (re)process just that image.
  for (const item of state.items) {
    const wrap=document.createElement('div'); wrap.className='chip-wrap';
    const b=document.createElement('button');
    b.type='button';
    b.className=`file-chip ${item.id===state.selectedId?'active ':''}${item.status==='ok'?'ok':item.status==='error'?'error':isUnprocessed(item)?'new':''}`;
    b.textContent=item.name; b.title=item.name+(isUnprocessed(item)?' (not processed yet)':'');
    b.onclick=()=>{ state.selectedId=item.id; renderUI(); };
    const r=document.createElement('button');
    r.type='button'; r.className='chip-run'; r.textContent='▶';
    r.title=isUnprocessed(item)?'Process this image':'Process this image again';
    r.disabled=state.busy||!item.imageData;
    r.onclick=()=>{ state.selectedId=item.id; runProcess([item]); };
    wrap.append(b,r);
    // Drag a chip onto another to change the image order (affects auto panel letters and Compose order).
    wrap.draggable=true; wrap.title='Drag to change the order';
    wrap.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/x-sem-item',item.id); e.dataTransfer.effectAllowed='move'; wrap.classList.add('dragging'); });
    wrap.addEventListener('dragend',()=>wrap.classList.remove('dragging'));
    wrap.addEventListener('dragover',e=>{ if (![...e.dataTransfer.types].includes('text/x-sem-item')) return; e.preventDefault(); const r=wrap.getBoundingClientRect(); wrap.classList.toggle('drop-before',e.clientX<r.left+r.width/2); wrap.classList.toggle('drop-after',e.clientX>=r.left+r.width/2); });
    wrap.addEventListener('dragleave',()=>wrap.classList.remove('drop-before','drop-after'));
    wrap.addEventListener('drop',e=>{
      const id=e.dataTransfer.getData('text/x-sem-item'); const after=wrap.classList.contains('drop-after'); wrap.classList.remove('drop-before','drop-after');
      if (!id || id===item.id) return; e.preventDefault(); moveItemTo(id,item.id,after);
    });
    els.fileStrip.appendChild(wrap);
  }

  els.fileTableBody.innerHTML='';
  for (const item of state.items) {
    const [label,cls]=statusLabel(item); const tr=document.createElement('tr');
    const a=item.analysis;
    tr.innerHTML=`<td class="file-name-cell" title="${escapeHTML(item.name)}">${escapeHTML(item.name)}</td><td><span class="state ${cls}">${label}</span></td><td>${a?.footerDetected?escapeHTML(String(a.footerY)):'—'}</td><td>${escapeHTML(String(originalBarPx(item)||'—'))}</td><td>${escapeHTML(item.sourceScaleText||'—')}</td><td>${escapeHTML(item.targetScaleText||item.sourceScaleText||'—')}</td><td>${escapeHTML(String(item.targetBarPx||originalBarPx(item)||'—'))}</td><td class="row-actions"><button type="button" class="btn ghost icon-btn" data-save="${escapeHTML(item.id)}" ${item.outputCanvas?'':'disabled'}>Save PNG</button><button type="button" class="btn ghost icon-btn" data-remove="${escapeHTML(item.id)}">Remove</button></td>`;
    tr.onclick=(e)=>{ if (!e.target.closest('button')) { state.selectedId=item.id; renderUI(); } };
    els.fileTableBody.appendChild(tr);
  }
  $$('[data-remove]').forEach(b=>b.onclick=(e)=>{ e.stopPropagation(); removeItem(b.dataset.remove); });
  $$('[data-save]').forEach(b=>b.onclick=async(e)=>{
    e.stopPropagation();
    const item=state.items.find(x=>x.id===b.dataset.save);
    if (!item?.outputCanvas) return;
    try { const r=await saveProcessedItem(item); if (r.method!=='cancelled') showToast(`Saved: ${r.fileName}`); } catch(err) { showToast(`Save failed: ${err.message}`,4200); }
  });
  syncPreview(selectedItem());
  updatePtHint();
}

function escapeHTML(s) { return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

