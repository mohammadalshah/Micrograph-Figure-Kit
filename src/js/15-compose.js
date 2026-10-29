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
// lposIn / lposOut: panel letters moved in Compose (inside: position in the panel, 0–1; outside: offset from the default place, in figure widths).
const compose={lposIn:{}, lposOut:{}, letterHits:[], order:[], off:new Set(), sel:-1, free:{}, srcCache:{}, lastAutoMode:'justify', cells:[], canvas:null, base:null, cfg:null, doc:{isFigure:true, objects:[], selObj:null, renderMeta:{hits:[]}}};
// Draw figure-wide objects on top of the composed panels.
function finishCompose() {
  const base=compose.base; if (!base) return;
  const cv=compose.canvas && compose.canvas.width===base.width && compose.canvas.height===base.height ? compose.canvas : document.createElement('canvas');
  cv.width=base.width; cv.height=base.height;
  const ctx=cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height); ctx.drawImage(base,0,0);
  drawComposeInsetLinks(ctx, compose.cells||[]);
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
function compItemsAll() { return compose.order.filter(id=>!compose.off.has(id)).map(id=>state.items.find(i=>i.id===id)).filter(Boolean); }
// With a table, panels come in cell order (panels that do not fit are left out).
function compItems() { const a=compItemsAll(); compose.tblOver=0; return compose.table ? tblOrder(a) : a; }
// Options from the Compose panel.
function compCfg() {
  return {
    perRow: String(els.compPerRow.value).split(/[,;\s]+/).map(Number).filter(n=>n>=1).map(n=>Math.min(12,Math.round(n))),
    mode: compose.table?'table':els.compMode.value, widthCm: Math.max(2,num(els.compWidth,17)), dpi: Number(els.compDpi.value)||300,
    gapMm: Math.max(0,num(els.compGap,1)), marginMm: Math.max(0,num(els.compMargin,0)), bg: els.compBg.value,
    letters: els.compLetters.value, truePt: els.compTruePt.checked, letterPos: $('#compLetterPos')?.value||'inside',
  };
}
// Row layout: equal-height rows (justified) or a fixed grid.
function layoutCompose(items, c) {
  const W=Math.round(c.widthCm/2.54*c.dpi), gap=Math.round(c.gapMm/25.4*c.dpi), m=Math.round(c.marginMm/25.4*c.dpi), inner=W-2*m;
  const pattern=c.perRow.length?c.perRow:[2], bt=c.band?.top||0, bl=(c.band?.left||0)+(c.band?.right||0), bo=c.band?.left||0;
  if (c.mode==='table') return layoutTable(items,c);
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
  fast=fast===true; if (!fast) insetRefreshSent(false); syncCompose(); if (!fast) { compose.srcCache={}; renderCompList(); if (state.tab==='compose') renderObjList(compose.doc); }
  const items=compItems(), has=items.length>0;
  els.compEmpty.hidden=has; els.compCard.hidden=!has;
  [els.compSavePng,els.compSaveTif,els.compCopy].forEach(b=>b.disabled=!has);
  if (!has) { compose.canvas=null; compose.cells=[]; els.compSummary.textContent=compose.order.length?'All panels are excluded.':'No panels yet.'; return; }
  const c=compCfg(); if (c.mode==='free') ensureFree(items,c); else if (c.mode!=='table') compose.lastAutoMode=c.mode;
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
  const L=layoutCompose(items,c), letterHits=[];
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
    else if (compose.lposIn[cell.it.id]) ov.panelPosOverride=compose.lposIn[cell.it.id];
    let src=fast?compose.srcCache[cell.it.id]:null;
    if (!src) { try { src=renderResult(cell.it,ov); } catch (_) { src=cell.it.outputCanvas; } compose.srcCache[cell.it.id]=src; }
    ctx.drawImage(src, Math.round(cell.dx), Math.round(cell.dy), Math.round(cell.dw), Math.round(cell.dh));
    const ph=!lp && src._hits?.find(h=>h.kind==='panel'), k=cell.dw/src.width;
    if (ph) letterHits.push({id:cell.it.id, inside:true, x:cell.dx+ph.x*k, y:cell.dy+ph.y*k, w:ph.w*k, h:ph.h*k, k, sw:src.width, sh:src.height, px:ph.x, py:ph.y});
  });
  compose.tblLayout=L.table||null; if (L.table) drawCompTable(ctx,L);
  if (lp) {
    ctx.save(); ctx.font=lp.font; ctx.fillStyle=lp.color; ctx.textBaseline='alphabetic'; ctx.textAlign='left';
    L.cells.forEach((cell,idx)=>{ const t=lp.txts[idx]; if (!t) return; const mt=ctx.measureText(t), abl=mt.actualBoundingBoxLeft||0, tw=(mt.actualBoundingBoxRight??mt.width)+abl;
      const P=c.letterPos, top=Math.round(Math.max(lp.asc, cell.dy-lp.g-lp.des));
      let x, y;
      if (P==='above') { x=cell.dx+abl; y=top; }
      else if (P==='aboveC') { x=cell.dx+(cell.dw-tw)/2+abl; y=top; }
      else if (P==='aboveR') { x=cell.dx+cell.dw-tw+abl; y=top; }
      else if (P==='right') { x=Math.min(cv.width-tw, cell.dx+cell.dw+lp.g)+abl; y=cell.dy+lp.asc; }
      else { x=Math.max(abl, cell.dx-c.band.left+abl); y=cell.dy+lp.asc; }
      const o=compose.lposOut[cell.it.id];
      if (o) { x=clamp(x+o.x*cv.width, abl, Math.max(abl, cv.width-tw+abl)); y=clamp(y+o.y*cv.width, lp.asc, Math.max(lp.asc, cv.height-lp.des)); }
      ctx.fillText(t, Math.round(x), Math.round(y));
      letterHits.push({id:cell.it.id, inside:false, x:Math.round(x)-abl, y:Math.round(y)-lp.asc, w:tw, h:lp.asc+lp.des}); });
    ctx.restore();
  }
  compose.base=cv; compose.cells=L.cells; compose.cfg=c; compose.letterHits=letterHits; finishCompose();
  if (compose.sel>=L.cells.length) compose.sel=-1;
  paintCompose();
  els.compDims.textContent=L.W+' × '+L.H+'px';
  els.compSummary.textContent=items.length+' panel(s) • '+fmtNum(+c.widthCm.toFixed(1))+' × '+fmtNum(+(L.H/c.dpi*2.54).toFixed(1))+' cm at '+c.dpi+' dpi'+(compose.tblOver?' • '+compose.tblOver+' panel(s) do not fit the table: add rows or columns':'');
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
  if (compose.table) { showToast('Panels in a table follow its cells. Remove the table to align them freely.'); return; }
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
    if (compose.table) { row.draggable=true; row.title=window.semI18n?.t('Drag onto a table cell in the preview')??'Drag onto a table cell'; row.ondragstart=e=>{ e.dataTransfer.setData('text/x-mfk-panel',id); e.dataTransfer.effectAllowed='move'; }; }
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
    if (it.objects?.some(q=>q.type==='inset' && !insetSent(q))) {
      const T=s=>window.semI18n?.t(s)??s;
      [['⧉A',true,'Inset as a separate panel, with panel letter'],['⧉',false,'Inset as a separate panel, without letter']].forEach(([t,l,ti])=>{
        const b=document.createElement('button'); b.type='button'; b.className='btn ghost icon-btn'; b.textContent=t; b.title=T(ti); b.setAttribute('aria-label',b.title);
        b.onclick=()=>{ if (insetSendAll(it,l)) { compose.sel=-1; renderUI(); renderCompose(); showToast('Inset moved to Compose figure as a separate panel; connector lines link it to the dashed box.',4200); } };
        row.append(b); });
    }
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
els.compRefreshBtn.onclick=()=>{ const n=edsRefreshSent(), m=insetRefreshSent(true); if (m && !n) renderUI(); renderCompose();
  if (n) showToast(n+' EDS image(s) updated from the EDS maps tab.'); else if (m) showToast(m+' inset panel(s) updated from the Clean & annotate tab.'); };
// Select a panel, or swap with the previously selected one.
function compCellAt(p) { for (let i=compose.cells.length-1;i>=0;i--) { const c=compose.cells[i]; if (p.x>=c.x && p.x<=c.x+c.w && p.y>=c.y && p.y<=c.y+c.h) return i; } return -1; }
function panelCorners(c) { return [{id:'nw',x:c.dx,y:c.dy},{id:'ne',x:c.dx+c.dw,y:c.dy},{id:'sw',x:c.dx,y:c.dy+c.dh},{id:'se',x:c.dx+c.dw,y:c.dy+c.dh}]; }
function panelHandleAt(p) { const c=compose.cells[compose.sel]; if (!c || compose.table) return null; const r=9*displayK(els.compCanvas); return panelCorners(c).find(q=>Math.abs(p.x-q.x)<=r && Math.abs(p.y-q.y)<=r)||null; }
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
  // Table: click a panel, then any cell (empty or not) to move or swap it.
  if (compose.table) {
    const s=tblSlotAt(p), cur=compose.cells[compose.sel];
    if (cur && s && cur.slot!==s.s) { tblMove(cur.it.id,s.s); compose.sel=-1; renderCompose(); return; }
    compose.sel=(i<0||compose.sel===i)?-1:i; paintCompose(); renderCompList(); return;
  }
  if (i<0) { compose.sel=-1; paintCompose(); renderCompList(); return; }
  if (compose.sel>=0 && compose.sel!==i && compose.cfg?.mode!=='free') {
    const a=compose.cells[compose.sel].it.id, b=compose.cells[i].it.id, ia=compose.order.indexOf(a), ib=compose.order.indexOf(b);
    compose.order[ia]=b; compose.order[ib]=a; compose.sel=-1; renderCompose();
  } else { compose.sel=compose.sel===i?-1:i; paintCompose(); renderCompList(); }
}
let compDrag=null, compFrame=0, compPanelDrag=null, compLetterDrag=null;
const compLetterAt=p=>{ const m=6*displayK(els.compCanvas); return compose.letterHits.find(h=>p.x>=h.x-m && p.x<=h.x+h.w+m && p.y>=h.y-m && p.y<=h.y+h.h+m)||null; };
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
    const hq=panelHandleAt(p), lh=!hq && !(e.ctrlKey||e.metaKey||e.shiftKey) && compLetterAt(p);
    // Panel letter: drag to move it; double-click puts it back in its default place.
    if (lh) {
      e.preventDefault();
      els.compCanvas.setPointerCapture(e.pointerId);
      compLetterDrag={h:lh, start:p, orig:{...(compose.lposOut[lh.id]||{x:0,y:0})}, W:compose.base.width};
      return;
    }
    const i=hq?compose.sel:compCellAt(p);
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
  if (compLetterDrag) {
    const d=compLetterDrag, h=d.h, dx=p.x-d.start.x, dy=p.y-d.start.y;
    if (h.inside) { compose.lposIn[h.id]={x:clamp((h.px+dx/h.k)/h.sw,0,1), y:clamp((h.py+dy/h.k)/h.sh,0,1)}; delete compose.srcCache[h.id]; }
    else compose.lposOut[h.id]={x:d.orig.x+dx/d.W, y:d.orig.y+dy/d.W};
    if (!compFrame) compFrame=requestAnimationFrame(()=>{ compFrame=0; renderCompose(true); });
    return;
  }
  if (!compDrag) {
    const hd=findHandle(doc,p); if (hd) { els.compCanvas.style.cursor=HANDLE_CURSOR[hd.id]; return; }
    if (findHit(doc.renderMeta?.hits||[],p)) { els.compCanvas.style.cursor='move'; return; }
    if (!panelHandleAt(p) && compLetterAt(p)) { els.compCanvas.style.cursor='move'; return; }
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
  if (compLetterDrag) { compLetterDrag=null; cancelAnimationFrame(compFrame); compFrame=0; renderCompose(); return; }
  if (compPanelDrag) { const d=compPanelDrag; compPanelDrag=null; if (!d.moved) compPanelClick(d.start);
    else if (compose.table) { const s=tblSlotAt(d.last||d.start); if (s) tblMove(d.id,s.s); compose.sel=-1; renderCompose(); }
    else { cancelAnimationFrame(compFrame); compFrame=0; renderCompose(); } return; }
  if (!compDrag) return; compDrag=null; renderObjList(compose.doc);
};
// Move / resize a panel; dragging in an automatic layout converts it to Free first.
function compPanelMove(p,e) {
  const d=compPanelDrag, k=displayK(els.compCanvas);
  if (compose.table) { d.last=p; if (!d.moved && Math.hypot(p.x-d.start.x,p.y-d.start.y)>=4*k) { d.moved=true; compose.sel=compose.cells.findIndex(c=>c.it.id===d.id); paintCompose(); } els.compCanvas.style.cursor='grabbing'; return; }
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
els.compCanvas.addEventListener('dblclick', e=>{ if (!compose.canvas) return; const lh=compLetterAt(canvasPoint(els.compCanvas,e)); if (!lh) return;
  delete compose.lposIn[lh.id]; delete compose.lposOut[lh.id]; delete compose.srcCache[lh.id]; renderCompose(); });
els.compCanvas.addEventListener('pointerup', endCompDrag);
els.compCanvas.addEventListener('pointercancel', endCompDrag);
