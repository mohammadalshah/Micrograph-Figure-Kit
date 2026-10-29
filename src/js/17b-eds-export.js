// =====================================================================
// Micrograph Figure Kit — 17b. EDS export and sending to Compose
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Saves single maps / the EDS figure and turns EDS tiles into Compose items.
// =====================================================================
function edsPxPerPtFor(t, cfg) {
  const ppt=cfg.dpi/72, proc=edsProcessed(t,cfg), cell=eds.cells.find(c=>c.t===t);
  return ppt*proc.width/(cell?cell.dw:Math.round(cfg.widthCm/2.54*cfg.dpi)*0.25);
}
function edsTileExport(t, cfg) {
  const proc=edsProcessed(t,cfg), L=edsLayoutTiles(cfg);
  return renderTile(t, proc.width, proc.height, edsPxPerPtFor(t,cfg), cfg, scaleShownOn(t,L,cfg));
}
function edsFileName(t, cfg) { return ((tileLabel(t,cfg)||t.name).replace(/<[^>]+>/g,'').replace(/\.[^.]+$/,'').replace(/[\\/:*?"<>|]+/g,'_').trim()||'map')+'.png'; }
edsEls.edsSaveOne.onclick=async()=>{
  const t=edsSelTile(); if (!t) return; const cfg=edsCfg();
  try { const r=await saveBlob(await pngWithDpi(await canvasBlob(edsTileExport(t,cfg)),cfg.dpi),edsFileName(t,cfg),'image/png'); if (r.method!=='cancelled') showToast('Saved.'); } catch (e) { showToast('Save failed: '+e.message,4200); }
};
edsEls.edsSaveFig.onclick=async()=>{
  if (!eds.canvas) return; const cfg=edsCfg();
  try { const blob=await pngWithDpi(await canvasBlob(eds.canvas),cfg.dpi); const r=await saveBlob(blob,'EDS_figure.png','image/png'); if (r.method!=='cancelled') showToast('Saved: EDS_figure.png'); }
  catch (e) { showToast('Save failed: '+e.message,4200); }
};
E('edsSavePdf').onclick=()=>{ if (!eds.canvas) { showToast('Add EDS maps first.'); return; } saveOut(pdfBlob(eds.canvas,edsCfg().dpi,edsCfg().bg),'EDS_figure.pdf'); };
E('edsSaveSvg').onclick=()=>{ if (!eds.canvas) { showToast('Add EDS maps first.'); return; } saveOut(svgVector(()=>renderEdsFigure(edsCfg()).canvas,edsCfg().dpi,eds.canvas),'EDS_figure.svg'); };
E('edsSaveCsv').onclick=()=>{
  const q=parseQuantBox(edsEls.edsQText.value), rows=[['Map','Role','Element','wt.%','at.%']], seen=new Set();
  for (const t of eds.tiles) { const el=t.el?.el||''; if (el) seen.add(el); rows.push([t.name, t.role||'', el, csvNum(q[el]?.wt), csvNum(q[el]?.at)]); }
  for (const [el,r] of Object.entries(q)) if (!seen.has(el)) rows.push(['', '', el, csvNum(r.wt), csvNum(r.at)]);
  if (rows.length<2) { showToast('Add EDS maps or values first.'); return; }
  saveOut(csvBlob(rows),'EDS_values.csv');
};
edsEls.edsSaveMaps.onclick=async()=>{
  const cfg=edsCfg(), inc=eds.tiles.filter(t=>t.include);
  if (!inc.length && !eds.canvas) { showToast('Add EDS maps first.'); return; }
  try {
    edsProgress(0,'ZIP');
    const JSZip=await ensureJSZip(), zip=new JSZip(), used=new Set();
    for (let i=0;i<inc.length;i++) {
      const nm=uniqueName(used,edsFileName(inc[i],cfg));
      zip.file(nm, await pngWithDpi(await canvasBlob(edsTileExport(inc[i],cfg)),cfg.dpi)); edsProgress((i+1)/(inc.length+1),'ZIP');
    }
    if (eds.canvas) zip.file(uniqueName(used,'EDS_figure.png'), await pngWithDpi(await canvasBlob(eds.canvas),cfg.dpi));
    const r=await saveBlob(await zip.generateAsync({type:'blob'}),'EDS_maps.zip','application/zip');
    if (r.method!=='cancelled') showToast('ZIP is ready.');
  } catch (e) { showToast('ZIP: '+e.message,4200); } finally { edsProgress(null); }
};
// Wrap an EDS canvas as a state item so it can go to Compose.
function edsMakeItem(name, canvas, opts) {
  const id=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);
  return Object.assign({
    id:uid(), fromEds:true, edsBatch:eds.batch, file:{name, size:0, lastModified:Date.now()}, name, status:'ok', error:'', imageData:id,
    analysis:{footerY:id.height, footerDetected:false, bar:null, labelCands:[], notes:[]},
    sourceScaleText:'', sourceManual:true, targetScaleText:'', ocrRaw:'(EDS)', barPxOverride:null, targetBarPx:null, targetBarThicknessPx:null,
    crop:null, scalePos:null, panelLabel:'', objects:[], selObj:null, outputCanvas:null, outputBlob:null, renderMeta:null, noScale:true, noPanel:false,
  }, opts||{});
}
// One Compose item per EDS tile; edsTile links it back so Refresh can rebuild it.
function edsBuildMapItem(t, cfg, L) {
  const proc=edsProcessed(t,cfg), c=document.createElement('canvas'); c.width=proc.width; c.height=proc.height; c.getContext('2d').drawImage(proc,0,0);
  const item=edsMakeItem('EDS '+edsFileName(t,cfg), c, {noPanel:t.role!=='electron', edsTile:t.id});
  const label=tileLabel(t,cfg), txtColor=cfg.labelColor==='map'?t.color:cfg.labelColor==='black'?'#000000':'#ffffff';
  const txtObj=(text,x,y,size)=>({id:uid(), type:'text', text, x, y, size, font:'', bold:cfg.labelBold, italic:false, underline:false, strike:false,
    bg:cfg.labelHl, bgColor:cfg.labelHlColor, color:txtColor, outline:cfg.labelOl, outlineColor:cfg.labelOlColor});
  if (label && t.role!=='spectrum') item.objects.push(txtObj(label,cfg.margin,cfg.margin,cfg.labelPt));
  // Element content (wt.% / at.%) as its own editable text; placed bottom-centre once its size is known.
  const qt=edsQuantText(t,cfg,settings()), qObj=qt?txtObj(qt,0.5,0.9,cfg.qPt):null;
  if (qObj) item.objects.push(qObj);
  if (scaleShownOn(t,L,cfg)) { const st=scaleTextFor(t,proc.width,cfg); if (st) { item.noScale=false; item.sourceScaleText=normalizeManualScale(st.text); item.targetScaleText=item.sourceScaleText; item.barPxOverride=Math.max(1,Math.round(st.srcPx)); } }
  try { finalizeAndRender(item); } catch (e) { item.noScale=true; renderInto(item); }
  const qh=qObj && item.renderMeta?.hits?.find(h=>h.id===qObj.id), oc=item.outputCanvas;
  if (qh && oc) { qObj.x=clamp((oc.width-qh.w)/2/oc.width,0,1); qObj.y=clamp((oc.height-cfg.margin*oc.width-qh.h)/oc.height,0,1); try { renderInto(item); } catch (_) {} }
  return item;
}
function edsBuildFigItem() {
  const cv=renderEdsFigure(edsCfg()).canvas, item=edsMakeItem('EDS figure.png', cv, {noPanel:false, edsFig:true});
  renderInto(item); return item;
}
// Refresh in Compose: rebuild images sent from EDS with the current EDS settings.
// Their place in the figure and panel letter are kept; edits made to them in tab 1 are replaced.
// Each item is rebuilt from the group it was sent from (items from older versions without a group use the shown one).
function edsRefreshSent() {
  const home=edsGroupCur(), of=it=>it.edsBatch||home.id, ids=new Set(state.items.filter(i=>i.fromEds).map(of));
  if (!ids.size) return 0;
  let n=0;
  if (edsAnalyzing) n=edsRefreshGroup(of);
  else {
    edsGroupStash();
    for (const g of eds.groups) if (ids.has(g.id)) { if (g.id!==eds.batch) edsGroupLoad(g); n+=edsRefreshGroup(of); }
    if (eds.batch!==home.id) { edsGroupLoad(home); renderEds(); }
  }
  if (n) renderUI();
  return n;
}
function edsRefreshGroup(of) {
  if (!eds.tiles.length) return 0;
  const cfg=edsCfg(), L=edsLayoutTiles(cfg), KEEP=['id','panelLabel','compLabel','noPanel','showPanel','panelStyle','scaleStyle','hideScale','edsBatch'];
  let n=0;
  state.items.forEach((old,i)=>{
    if (!old.fromEds || of(old)!==eds.batch) return;
    let fresh=null;
    try {
      if (old.edsFig) { if (eds.tiles.some(t=>t.include)) fresh=edsBuildFigItem(); }
      else { const t=eds.tiles.find(x=>x.id===old.edsTile); if (t) fresh=edsBuildMapItem(t,cfg,L); }
    } catch (_) { fresh=null; }
    if (!fresh) return;
    for (const k of KEEP) if (k in old) fresh[k]=old[k];
    try { renderInto(fresh); } catch (_) {}
    state.items[i]=fresh; n++;
  });
  return n;
}
edsEls.edsSendMaps.onclick=()=>{
  const cfg=edsCfg(), L=edsLayoutTiles(cfg); let n=0;
  for (const cell of L.cells) { state.items.push(edsBuildMapItem(cell.t,cfg,L)); n++; }
  renderUI(); showToast(n+' image(s) sent to Compose figure (also listed in tab 1 for editing).',4200);
};
edsEls.edsSendFig.onclick=()=>{
  if (!eds.canvas) return;
  state.items.push(edsBuildFigItem()); renderUI();
  showToast('EDS figure sent to Compose figure as one panel.',4200);
};

// Ask before closing while work is loaded (nothing is stored on a server, so closing loses it).
window.addEventListener('beforeunload',e=>{ if (state.busy || state.items.length || edsHasAny()) { e.preventDefault(); e.returnValue=''; } });
