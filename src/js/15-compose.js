// =====================================================================
// Micrograph Figure Kit — 15. Compose figure tab
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Lays processed images out in rows at a print width/dpi and adds figure-wide objects.
// =====================================================================
Object.assign(els, {
  cleanView: $('#cleanView'), composeView: $('#composeView'), compList: $('#compList'), compRefreshBtn: $('#compRefreshBtn'),
  compPerRow: $('#compPerRow'), compMode: $('#compMode'), compWidth: $('#compWidth'), compDpi: $('#compDpi'), compGap: $('#compGap'),
  compMargin: $('#compMargin'), compBg: $('#compBg'), compLetters: $('#compLetters'), compTruePt: $('#compTruePt'),
  compSavePng: $('#compSavePng'), compSaveTif: $('#compSaveTif'), compCopy: $('#compCopy'), compSummary: $('#compSummary'),
  compEmpty: $('#compEmpty'), compCard: $('#compCard'), compDims: $('#compDims'), compCanvas: $('#compCanvas'),
});
const compose={order:[], off:new Set(), sel:-1, free:{}, srcCache:{}, lastAutoMode:'justify', cells:[], canvas:null, base:null, cfg:null, doc:{isFigure:true, objects:[], selObj:null, renderMeta:{hits:[]}}};
// Draw figure-wide objects on top of the composed panels.
function finishCompose() {
  const base=compose.base; if (!base) return;
  const cv=compose.canvas && compose.canvas.width===base.width && compose.canvas.height===base.height ? compose.canvas : document.createElement('canvas');
  cv.width=base.width; cv.height=base.height;
  const ctx=cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height); ctx.drawImage(base,0,0);
  const cfg=settings(), ppt=compose.cfg.dpi/72;
  const hits=drawObjects(ctx, compose.doc.objects, cv.width, cv.height, cfg, ppt, Math.max(4,Math.round((cfg.fixedFontSize||12)*ppt)));
  compose.canvas=cv; compose.doc.renderMeta={hits, crop:{w:cv.width, h:cv.height}, ppt};
}

// Keep compose.order in step with the processed items.
function syncCompose() {
  const ids=state.items.filter(i=>i.status==='ok' && renderable(i)).map(i=>i.id);
  compose.order=compose.order.filter(id=>ids.includes(id));
  for (const id of ids) if (!compose.order.includes(id)) compose.order.push(id);
}
// Included items in figure order.
function compItems() { return compose.order.filter(id=>!compose.off.has(id)).map(id=>state.items.find(i=>i.id===id)).filter(Boolean); }
// Options from the Compose panel.
function compCfg() {
  return {
    perRow: String(els.compPerRow.value).split(/[,;\s]+/).map(Number).filter(n=>n>=1).map(n=>Math.min(12,Math.round(n))),
    mode: els.compMode.value, widthCm: Math.max(2,num(els.compWidth,17)), dpi: Number(els.compDpi.value)||300,
    gapMm: Math.max(0,num(els.compGap,1)), marginMm: Math.max(0,num(els.compMargin,0)), bg: els.compBg.value,
    letters: els.compLetters.value, truePt: els.compTruePt.checked, letterPos: $('#compLetterPos')?.value||'inside',
  };
}
// Row layout: equal-height rows (justified) or a fixed grid.
function layoutCompose(items, c) {
  const W=Math.round(c.widthCm/2.54*c.dpi), gap=Math.round(c.gapMm/25.4*c.dpi), m=Math.round(c.marginMm/25.4*c.dpi), inner=W-2*m;
  const pattern=c.perRow.length?c.perRow:[2], bt=c.band?.top||0, bl=(c.band?.left||0)+(c.band?.right||0), bo=c.band?.left||0;
  const asp=it=>{ const cr=getCrop(it); return cr.w/cr.h; };
  if (c.mode==='free') {
    const cells=items.map(it=>{ const f=compose.free[it.id]||{x:0,y:0,w:0.5}, x=f.x*W, y=f.y*W, w=f.w*W, h=w/asp(it); return {it, x, y, w, h, dx:x, dy:y, dw:w, dh:h}; });
    return {W, H:Math.max(1,Math.round(Math.max(0,...cells.map(q=>q.y+q.h))+m)), cells};
  }
  const rows=[]; let i=0;
  while (i<items.length) { const n=pattern[Math.min(rows.length,pattern.length-1)]; rows.push({n, list:items.slice(i,i+n)}); i+=n; }
  const sorted=items.map(asp).sort((a,b)=>a-b), medA=sorted[sorted.length>>1]||1;
  const cells=[]; let y=m, prevH=null;
  for (const {n, list} of rows) {
    let rowH, widths;
    if (c.mode==='grid') { const cw=(inner-gap*(n-1)-n*bl)/n; rowH=cw/medA; widths=list.map(()=>cw); }
    else {
      const sumA=list.reduce((a,it)=>a+asp(it),0);
      rowH=(inner-gap*(list.length-1)-list.length*bl)/sumA;
      if (list.length<n && prevH) rowH=Math.min(rowH,prevH);
      widths=list.map(it=>asp(it)*rowH);
    }
    const total=widths.reduce((a,b)=>a+b,0)+gap*(list.length-1)+list.length*bl;
    let x=m+(inner-total)/2;
    list.forEach((it,k)=>{
      const cw=widths[k], ch=rowH, a=asp(it); let dw=cw, dh=ch;
      if (c.mode==='grid') { if (a>cw/ch) dh=cw/a; else dw=ch*a; }
      const cx=x+bo, cy=y+bt;
      cells.push({it, x:cx, y:cy, w:cw, h:ch, dx:cx+(cw-dw)/2, dy:cy+(ch-dh)/2, dw, dh});
      x+=bl+cw+gap;
    });
    y+=bt+rowH+gap; prevH=rowH;
  }
  return {W, H:Math.max(1,Math.round(y-gap+m)), cells};
}
// Build the whole figure canvas.
function renderCompose(fast) {
  fast=fast===true; syncCompose(); if (!fast) { compose.srcCache={}; renderCompList(); if (state.tab==='compose') renderObjList(compose.doc); }
  const items=compItems(), has=items.length>0;
  els.compEmpty.hidden=has; els.compCard.hidden=!has;
  [els.compSavePng,els.compSaveTif,els.compCopy].forEach(b=>b.disabled=!has);
  if (!has) { compose.canvas=null; compose.cells=[]; els.compSummary.textContent=compose.order.length?'All panels are excluded.':'No panels yet.'; return; }
  const c=compCfg(); if (c.mode==='free') ensureFree(items,c); else compose.lastAutoMode=c.mode;
  $('#compResetFree').hidden=c.mode!=='free';
  // Panel letters outside the images: reserve a band above or to the left of each panel.
  let lp=null;
  if (c.letters!=='none' && c.letterPos!=='inside') {
    const sc=settings(), ppt=c.dpi/72, ps=Math.max(4,Math.round((sc.panelSize>0?sc.panelSize:10)*ppt)), font=fontSpec(ps,sc.panelWeight,false,sc.fontFamily);
    const txts=items.map((it,idx)=>it.noPanel?'':c.letters==='renumber'?(it.compLabel||panelText(idx,sc.panelFormat)):(it.panelLabel||panelText(state.items.indexOf(it),sc.panelFormat)));
    const mc=document.createElement('canvas').getContext('2d'); mc.font=font;
    const ms=txts.filter(Boolean).map(t=>mc.measureText(t));
    const asc=Math.ceil(Math.max(ps*0.72,...ms.map(m=>m.actualBoundingBoxAscent||0))), des=Math.ceil(Math.max(0,...ms.map(m=>m.actualBoundingBoxDescent||0)));
    const g=Math.max(2,Math.round(0.6/25.4*c.dpi)), tw=Math.ceil(Math.max(0,...ms.map(m=>m.width)));
    lp={font, txts, asc, des, g, color:c.bg==='black'?'#ffffff':'#000000'};
    c.band=c.letterPos.startsWith('above')?{top:asc+des+g, left:0, right:0}:c.letterPos==='right'?{top:0, left:0, right:tw+g}:{top:0, left:tw+g, right:0};
  }
  const L=layoutCompose(items,c);
  const cv=document.createElement('canvas'); cv.width=L.W; cv.height=L.H;
  const ctx=cv.getContext('2d');
  if (c.bg!=='transparent') { ctx.fillStyle=c.bg==='black'?'#000':'#fff'; ctx.fillRect(0,0,cv.width,cv.height); }
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  L.cells.forEach((cell,idx)=>{
    const ov={};
    if (c.truePt) ov.printWidthCm=Math.max(0.2, cell.dw/c.dpi*2.54);
    if (c.letters==='none') { ov.panelEnabled=false; ov.forceNoPanel=true; }
    else if (c.letters==='renumber') { ov.panelEnabled=true; ov.panelIndex=idx; ov.ignorePanelLabel=true; if (cell.it.compLabel) ov.labelOverride=cell.it.compLabel; }
    if (lp) { ov.panelEnabled=false; ov.forceNoPanel=true; }
    let src=fast?compose.srcCache[cell.it.id]:null;
    if (!src) { try { src=renderResult(cell.it,ov); } catch (_) { src=cell.it.outputCanvas; } compose.srcCache[cell.it.id]=src; }
    ctx.drawImage(src, Math.round(cell.dx), Math.round(cell.dy), Math.round(cell.dw), Math.round(cell.dh));
  });
  if (lp) {
    ctx.save(); ctx.font=lp.font; ctx.fillStyle=lp.color; ctx.textBaseline='alphabetic'; ctx.textAlign='left';
    L.cells.forEach((cell,idx)=>{ const t=lp.txts[idx]; if (!t) return; const mt=ctx.measureText(t), abl=mt.actualBoundingBoxLeft||0, tw=(mt.actualBoundingBoxRight??mt.width)+abl;
      const P=c.letterPos, top=Math.round(Math.max(lp.asc, cell.dy-lp.g-lp.des));
      if (P==='above') ctx.fillText(t, Math.round(cell.dx+abl), top);
      else if (P==='aboveC') ctx.fillText(t, Math.round(cell.dx+(cell.dw-tw)/2+abl), top);
      else if (P==='aboveR') ctx.fillText(t, Math.round(cell.dx+cell.dw-tw+abl), top);
      else if (P==='right') ctx.fillText(t, Math.round(Math.min(cv.width-tw, cell.dx+cell.dw+lp.g)+abl), Math.round(cell.dy+lp.asc));
      else ctx.fillText(t, Math.round(Math.max(abl, cell.dx-c.band.left+abl)), Math.round(cell.dy+lp.asc)); });
    ctx.restore();
  }
  compose.base=cv; compose.cells=L.cells; compose.cfg=c; finishCompose();
  if (compose.sel>=L.cells.length) compose.sel=-1;
  paintCompose();
  els.compDims.textContent=L.W+' × '+L.H+'px';
  els.compSummary.textContent=items.length+' panel(s) • '+fmtNum(+c.widthCm.toFixed(1))+' × '+fmtNum(+(L.H/c.dpi*2.54).toFixed(1))+' cm at '+c.dpi+' dpi';
}
// Compose preview zoom: 1 = fit to window; larger values scroll inside the preview.
const compZoom={z:1};
function applyCompZoom(anchor) {
  const c=els.compCanvas, w=$('#compWrap'); if (!c||!w) return;
  const before=c.getBoundingClientRect();
  c.style.width=''; c.style.height=''; c.style.maxWidth=''; c.style.maxHeight='';
  w.style.justifyContent=''; w.style.alignItems=''; w.style.maxHeight='';
  if (compZoom.z!==1) {
    const fit=c.getBoundingClientRect().width||c.width;
    c.style.maxWidth='none'; c.style.maxHeight='none'; c.style.width=Math.round(fit*compZoom.z)+'px'; c.style.height='auto';
    w.style.maxHeight='78vh';
    if (compZoom.z>1) { w.style.justifyContent='flex-start'; w.style.alignItems='flex-start'; }
    if (anchor && before.width) { const r=c.getBoundingClientRect(), k=r.width/before.width, wr=w.getBoundingClientRect();
      w.scrollLeft=(anchor.x-before.left)*k-(anchor.x-wr.left); w.scrollTop=(anchor.y-before.top)*k-(anchor.y-wr.top); }
  }
  const v=$('#compZoomVal'); if (v) v.textContent=compZoom.z===1?'Fit':Math.round(compZoom.z*100)+'%';
}
function setCompZoom(z,anchor) { compZoom.z=Math.max(0.25,Math.min(8,Math.round(z*100)/100)); if (Math.abs(compZoom.z-1)<0.01) compZoom.z=1; applyCompZoom(anchor); paintCompose(); }
$('#compZoomIn').onclick=()=>setCompZoom(compZoom.z*1.25);
$('#compZoomOut').onclick=()=>setCompZoom(compZoom.z/1.25);
$('#compZoomVal').onclick=()=>setCompZoom(1);
$('#compWrap').addEventListener('wheel',e=>{ if (!(e.ctrlKey||e.metaKey)) return; e.preventDefault(); setCompZoom(compZoom.z*(e.deltaY<0?1.15:1/1.15),{x:e.clientX,y:e.clientY}); },{passive:false});
function paintCompose() {
  const d=els.compCanvas, src=compose.canvas; if (!src) return;
  if (d.width!==src.width || d.height!==src.height) { d.width=src.width; d.height=src.height; }
  const ctx=d.getContext('2d'); ctx.clearRect(0,0,d.width,d.height); ctx.drawImage(src,0,0);
  const cell=compose.cells[compose.sel];
  if (cell) {
    const k=displayK(d); ctx.save(); ctx.strokeStyle='#3b82f6'; ctx.lineWidth=3*k; ctx.setLineDash([8*k,5*k]);
    ctx.strokeRect(cell.x+1.5*k,cell.y+1.5*k,cell.w-3*k,cell.h-3*k);
    ctx.setLineDash([]); ctx.fillStyle='#fff'; ctx.lineWidth=2*k; const s=10*k;
    for (const q of panelCorners(cell)) { ctx.fillRect(q.x-s/2,q.y-s/2,s,s); ctx.strokeRect(q.x-s/2,q.y-s/2,s,s); }
    ctx.restore();
  }
  const pm=compPMulti();
  if (pm.length>1) { const k=displayK(d); ctx.save(); ctx.strokeStyle='#f59e0b'; ctx.lineWidth=3*k; ctx.setLineDash([6*k,4*k]);
    pm.forEach((id,n)=>{ const q=compose.cells.find(x=>x.it.id===id); if (!q || q===cell) return; ctx.lineWidth=(n===0?5:3)*k; ctx.strokeRect(q.x+1.5*k,q.y+1.5*k,q.w-3*k,q.h-3*k); }); ctx.restore(); }
  const sh=selHit(compose.doc); if (sh) drawSelection(ctx,d,sh);
  drawMulti(ctx,d,compose.doc);
  compAlignInfo();
}
// ---- Fit and align panels (Layout) ----
function compPMulti() { const ids=new Set(compose.cells.map(c=>c.it.id)); compose.pmulti=(compose.pmulti||[]).filter(id=>ids.has(id)); return compose.pmulti; }
function compAlignInfo() {
  const row=document.getElementById('compAlignRow'); if (!row) return; const n=compPMulti().length;
  row.classList.toggle('off', n<2);
  document.getElementById('compAlignInfo').textContent=n<2 ? 'Ctrl + click panels in the preview to select several and align them.' : n+' selected — aligned to the first one you picked (thick outline).';
}
function compAlign(kind) {
  const items=compItems(); if (!items.length) return;
  const pm=compPMulti(); if (kind!=='fit' && pm.length<2) return;
  const c=compCfg();
  if (c.mode!=='free') { seedFree(items,c,c.mode); compose.lastAutoMode=c.mode; els.compMode.value='free'; c.mode='free'; }
  else ensureFree(items,c);
  const W=Math.round(c.widthCm/2.54*c.dpi), m=c.marginMm/25.4*c.dpi/W, asp=it=>{ const cr=getCrop(it); return cr.w/cr.h; };
  const box=it=>{ const f=compose.free[it.id]; return {it, f, x:f.x, y:f.y, w:f.w, h:f.w/asp(it)}; };
  if (kind==='fit') {
    const all=items.map(box), bx=Math.min(...all.map(b=>b.x)), by=Math.min(...all.map(b=>b.y)), bw=Math.max(...all.map(b=>b.x+b.w))-bx, s=(1-2*m)/(bw||1);
    for (const b of all) { b.f.x=m+(b.x-bx)*s; b.f.y=m+(b.y-by)*s; b.f.w=b.w*s; }
  } else {
    const list=pm.map(id=>items.find(it=>it.id===id)).filter(Boolean).map(box); if (list.length<2) return;
    const a=list[0], setX=(b,x)=>{ b.f.x=clamp(x,0,Math.max(0,1-b.f.w)); }, setY=(b,y)=>{ b.f.y=Math.max(0,y); };
    if (kind==='distH' || kind==='distV') {
      if (list.length<3) { showToast('Select at least 3 panels to distribute.'); return; }
      const hz=kind==='distH', pos=b=>hz?b.x:b.y, len=b=>hz?b.w:b.h, s=list.slice().sort((p,q)=>pos(p)-pos(q));
      const start=pos(s[0]), g=(pos(s[s.length-1])+len(s[s.length-1])-start-s.reduce((t,b)=>t+len(b),0))/(s.length-1);
      let cur=start; for (const b of s) { if (hz) setX(b,cur); else setY(b,cur); cur+=len(b)+g; }
    } else for (const b of list.slice(1)) {
      if (kind==='samew') b.f.w=Math.min(1,a.w);
      else if (kind==='sameh') b.f.w=Math.min(1,a.h*asp(b.it));
      else if (kind==='row') setY(b,a.y+a.h/2-b.h/2);
      else if (kind==='top') setY(b,a.y);
      else if (kind==='bottom') setY(b,a.y+a.h-b.h);
      else if (kind==='col') setX(b,a.x+a.w/2-b.w/2);
      else if (kind==='left') setX(b,a.x);
      else if (kind==='right') setX(b,a.x+a.w-b.w);
    }
  }
  renderCompose(); if (typeof histSchedule==='function') histSchedule();
}
document.querySelectorAll('[data-palign]').forEach(b=>b.addEventListener('click',()=>compAlign(b.dataset.palign)));
// Panel list with include checkbox and reorder buttons.
function renderCompList() {
  els.compList.innerHTML='';
  if (!compose.order.length) { els.compList.innerHTML='<p class="hint">No processed images yet. Process images in the Clean &amp; annotate tab first.</p>'; return; }
  const selId=compose.cells[compose.sel]?.it.id, on=compItems();
  compose.order.forEach((id,k)=>{
    const it=state.items.find(x=>x.id===id); if (!it?.outputCanvas) return;
    const off=compose.off.has(id), row=document.createElement('div');
    row.className='comp-row'+(id===selId?' active':'')+(off?' off':'');
    const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!off; cb.setAttribute('aria-label','Include '+it.name);
    cb.onchange=()=>{ if (cb.checked) compose.off.delete(id); else compose.off.add(id); compose.sel=-1; renderCompose(); };
    const th=document.createElement('canvas'); th.className='comp-thumb';
    const src=it.outputCanvas, tw=112, thh=Math.max(1,Math.round(tw*src.height/src.width));
    th.width=tw; th.height=thh; th.getContext('2d').drawImage(src,0,0,tw,thh);
    const nm=document.createElement('span'); nm.className='comp-name'; nm.title=it.name;
    const pos=on.indexOf(it);
    if (pos>=0 && compose.cfg?.letters==='renumber') { const b=document.createElement('b'); b.textContent=panelText(pos, settings().panelFormat); nm.appendChild(b); }
    nm.appendChild(document.createTextNode(it.name));
    nm.style.cursor='pointer'; nm.onclick=()=>{ const ci=compose.cells.findIndex(c=>c.it.id===id); if (ci>=0) { compose.sel=compose.sel===ci?-1:ci; paintCompose(); renderCompList(); } };
    const mk=(t,dir)=>{ const b=document.createElement('button'); b.type='button'; b.className='btn ghost icon-btn'; b.textContent=t; b.disabled=(dir<0&&k===0)||(dir>0&&k===compose.order.length-1);
      b.onclick=()=>{ const j=k+dir; [compose.order[k],compose.order[j]]=[compose.order[j],compose.order[k]]; compose.sel=-1; renderCompose(); }; return b; };
    row.append(cb,th,nm,mk('↑',-1),mk('↓',1));
    const rm=document.createElement('button'); rm.type='button'; rm.className='btn ghost icon-btn'; rm.textContent='✕';
    rm.title=window.semI18n?.t('Remove this image (also from the Clean & annotate tab)')??'Remove this image'; rm.setAttribute('aria-label',rm.title);
    rm.onclick=()=>{ compose.sel=-1; compose.off.delete(id); removeItem(id); renderCompose(); };
    row.append(rm);
    els.compList.appendChild(row);
  });
  window.lblComp?.sync();
}
$('#compClearBtn').onclick=()=>{
  if (!state.items.length) return;
  if (!confirm(window.semI18n?.t('Remove all panels? The images are also removed from the Clean & annotate tab.')??'Remove all panels?')) return;
  compose.sel=-1; compose.off.clear(); compose.free={}; clearAll(); renderCompose();
};
let compTimer=null;
function scheduleCompose(d=150) { clearTimeout(compTimer); compTimer=setTimeout(renderCompose,d); }
[els.compPerRow,els.compMode,els.compWidth,els.compDpi,els.compGap,els.compMargin,els.compBg,els.compLetters,els.compTruePt,$('#compLetterPos')].forEach(el=>{
  el.addEventListener('change',()=>scheduleCompose(0));
  if (el.tagName==='INPUT' && el.type!=='checkbox') el.addEventListener('input',()=>scheduleCompose(250));
});
els.compRefreshBtn.onclick=()=>{ const n=edsRefreshSent(); renderCompose(); if (n) showToast(n+' EDS image(s) updated from the EDS maps tab.'); };
// Select a panel, or swap with the previously selected one.
function compCellAt(p) { for (let i=compose.cells.length-1;i>=0;i--) { const c=compose.cells[i]; if (p.x>=c.x && p.x<=c.x+c.w && p.y>=c.y && p.y<=c.y+c.h) return i; } return -1; }
function panelCorners(c) { return [{id:'nw',x:c.dx,y:c.dy},{id:'ne',x:c.dx+c.dw,y:c.dy},{id:'sw',x:c.dx,y:c.dy+c.dh},{id:'se',x:c.dx+c.dw,y:c.dy+c.dh}]; }
function panelHandleAt(p) { const c=compose.cells[compose.sel]; if (!c) return null; const r=9*displayK(els.compCanvas); return panelCorners(c).find(q=>Math.abs(p.x-q.x)<=r && Math.abs(p.y-q.y)<=r)||null; }
// Free layout: positions stored as fractions of the figure width, height follows the aspect ratio.
function seedFree(items,c,mode) { const L=layoutCompose(items,{...c,mode}); for (const cell of L.cells) compose.free[cell.it.id]={x:cell.dx/L.W, y:cell.dy/L.W, w:cell.dw/L.W}; }
function ensureFree(items,c) {
  const miss=items.filter(it=>!compose.free[it.id]); if (!miss.length) return;
  if (miss.length===items.length) { seedFree(items,c,compose.lastAutoMode||'justify'); return; }
  const W=Math.round(c.widthCm/2.54*c.dpi), g=c.gapMm/25.4*c.dpi/W, m=c.marginMm/25.4*c.dpi/W;
  let bottom=0; for (const it of items) { const f=compose.free[it.id]; if (f) { const cr=getCrop(it); bottom=Math.max(bottom,f.y+f.w*cr.h/cr.w); } }
  for (const it of miss) { const cr=getCrop(it), w=Math.min(0.5,1-2*m); compose.free[it.id]={x:m, y:bottom+g, w}; bottom+=g+w*cr.h/cr.w; }
}
function compPanelClick(p) {
  compose.pmulti=[];
  const i=compCellAt(p);
  if (i<0) { compose.sel=-1; paintCompose(); renderCompList(); return; }
  if (compose.sel>=0 && compose.sel!==i && compose.cfg?.mode!=='free') {
    const a=compose.cells[compose.sel].it.id, b=compose.cells[i].it.id, ia=compose.order.indexOf(a), ib=compose.order.indexOf(b);
    compose.order[ia]=b; compose.order[ib]=a; compose.sel=-1; renderCompose();
  } else { compose.sel=compose.sel===i?-1:i; paintCompose(); renderCompList(); }
}
let compDrag=null, compFrame=0, compPanelDrag=null;
$('#compResetFree').onclick=()=>{ compose.free={}; compose.sel=-1; renderCompose(); };
els.compCanvas.addEventListener('pointerdown', e=>{
  state.lastCanvas='compose';
  const doc=compose.doc; if (!compose.canvas) return;
  const p=canvasPoint(els.compCanvas,e), W=compose.canvas.width, H=compose.canvas.height;
  const hd=findHandle(doc,p); let d=null;
  if (hd) { const o=selObj(doc); d={mode:'handle', handle:hd.id, o, orig:{...o}, start:p, hit:selHit(doc)}; }
  else {
    const hit=findHit(doc.renderMeta?.hits||[],p);
    if (hit && (e.ctrlKey||e.metaKey||e.shiftKey)) { toggleMulti(doc,hit.id); paintCompose(); renderObjList(doc); return; }
    if (hit) { const o=doc.objects.find(x=>x.id===hit.id); if (o) { if (!multiIds(doc).includes(o.id)) doc.multi=[o.id]; doc.selObj=o.id; d={mode:'move', o, orig:{...o}, start:p, hit, group:groupFor(doc,o)}; } }
  }
  if (!d) {
    const had=!!doc.selObj; doc.selObj=null; doc.multi=[]; if (had) renderObjList(doc);
    const hq=panelHandleAt(p), i=hq?compose.sel:compCellAt(p);
    if (i>=0 && !hq && (e.ctrlKey||e.metaKey||e.shiftKey)) {
      const id=compose.cells[i].it.id, m=compPMulti(); if (!m.length && compose.cells[compose.sel]) m.push(compose.cells[compose.sel].it.id);
      const j=m.indexOf(id); if (j>=0) m.splice(j,1); else m.push(id); compose.pmulti=m;
      compose.sel=m.length?compose.cells.findIndex(c=>c.it.id===m[m.length-1]):-1; paintCompose(); renderCompList(); return;
    }
    if (i<0) { compPanelClick(p); return; }
    e.preventDefault(); els.compCanvas.setPointerCapture(e.pointerId);
    compPanelDrag={id:compose.cells[i].it.id, corner:hq?.id||null, start:p, moved:false};
    return;
  }
  e.preventDefault(); els.compCanvas.setPointerCapture(e.pointerId);
  compDrag={...d, W, H, ppt:compose.cfg.dpi/72}; compose.sel=-1;
  paintCompose(); renderObjList(doc); renderCompList();
});
els.compCanvas.addEventListener('pointermove', e=>{
  const doc=compose.doc; if (!compose.canvas) return;
  const p=canvasPoint(els.compCanvas,e);
  if (compPanelDrag) { compPanelMove(p,e); return; }
  if (!compDrag) {
    const hd=findHandle(doc,p); if (hd) { els.compCanvas.style.cursor=HANDLE_CURSOR[hd.id]; return; }
    if (findHit(doc.renderMeta?.hits||[],p)) { els.compCanvas.style.cursor='move'; return; }
    const hq=panelHandleAt(p); els.compCanvas.style.cursor=hq?HANDLE_CURSOR[hq.id]:(compCellAt(p)>=0?'grab':'default'); return;
  }
  const d=compDrag;
  if (d.mode==='move') {
    const dx=(p.x-d.start.x)/d.W, dy=(p.y-d.start.y)/d.H;
    moveGroup(d,dx,dy);
  } else resizeObj(d,p,e.shiftKey);
  if (!compFrame) compFrame=requestAnimationFrame(()=>{ compFrame=0; finishCompose(); paintCompose(); syncObjProps(doc); });
});
const endCompDrag=()=>{
  if (compPanelDrag) { const d=compPanelDrag; compPanelDrag=null; if (!d.moved) compPanelClick(d.start); else { cancelAnimationFrame(compFrame); compFrame=0; renderCompose(); } return; }
  if (!compDrag) return; compDrag=null; renderObjList(compose.doc);
};
// Move / resize a panel; dragging in an automatic layout converts it to Free first.
function compPanelMove(p,e) {
  const d=compPanelDrag, k=displayK(els.compCanvas);
  if (!d.moved) {
    if (Math.hypot(p.x-d.start.x,p.y-d.start.y)<4*k) return;
    d.moved=true;
    if (els.compMode.value!=='free') { compose.free={}; els.compMode.value='free'; renderCompose(true); }
    compose.sel=compose.cells.findIndex(c=>c.it.id===d.id);
    d.orig={...compose.free[d.id]};
  }
  const c=compose.cfg, W=compose.base.width, m=c.marginMm/25.4*c.dpi, g=c.gapMm/25.4*c.dpi;
  const cell=compose.cells.find(x=>x.it.id===d.id), f=compose.free[d.id]; if (!cell||!f) return;
  const a=cell.dw/cell.dh, o=d.orig, thr=e.altKey?0:8*k;
  const xs=[m, W-m, W/2], ys=[m];
  for (const x of compose.cells) if (x.it.id!==d.id) { xs.push(x.dx, x.dx+x.dw, x.dx+x.dw+g, x.dx-g); ys.push(x.dy, x.dy+x.dh, x.dy+x.dh+g, x.dy-g); }
  const snap=(vals,cands)=>{ let best=null; for (const v of vals) for (const t of cands) { const df=t-v; if (Math.abs(df)<=thr && (best===null||Math.abs(df)<Math.abs(best))) best=df; } return best||0; };
  if (!d.corner) {
    const w=o.w*W, h=w/a; let x=o.x*W+(p.x-d.start.x), y=o.y*W+(p.y-d.start.y);
    x+=snap([x,x+w,x+w/2],xs); y+=snap([y,y+h],ys);
    f.x=clamp(x,0,Math.max(0,W-w))/W; f.y=Math.max(0,y)/W;
  } else {
    const L=o.x*W, T=o.y*W, R=L+o.w*W, B=T+o.w*W/a, left=d.corner.includes('w'), top=d.corner.includes('n');
    let w=((left?R-p.x:p.x-L)+(top?B-p.y:p.y-T)*a)/2;
    w+=(left?-1:1)*snap([left?R-w:L+w],xs);
    w=clamp(w,0.03*W,left?R:W-L);
    f.w=w/W; f.x=(left?R-w:L)/W; f.y=Math.max(0,top?B-w/a:T)/W;
  }
  if (!compFrame) compFrame=requestAnimationFrame(()=>{ compFrame=0; renderCompose(true); });
}
els.compCanvas.addEventListener('pointerup', endCompDrag);
els.compCanvas.addEventListener('pointercancel', endCompDrag);

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
