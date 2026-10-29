// =====================================================================
// Micrograph Figure Kit — 9. File ingestion
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
// =====================================================================
async function addFiles(files) {
  const sj=Array.from(files).find(f=>extOf(f.name)==='json'); if (sj) { await openSession(sj); return; }
  const list=Array.from(files).filter(f=>ACCEPTED.has(extOf(f.name)));
  if (!list.length) { showToast('No supported files were found.'); return; }
  for (const file of list) {
    if (state.items.some(it=>it.file.name===file.name && it.file.size===file.size && it.file.lastModified===file.lastModified)) continue;
    const item={
      id:uid(), file, name:file.name, status:'working', error:'', imageData:null, analysis:null,
      sourceScaleText:'', sourceManual:false, targetScaleText:'', ocrRaw:'',
      barPxOverride:null, targetBarPx:null, targetBarThicknessPx:null,
      crop:null, scalePos:null, panelLabel:'', objects:[], selObj:null,
      outputCanvas:null, outputBlob:null, renderMeta:null
    };
    state.items.push(item); if (!state.selectedId) state.selectedId=item.id; renderUI();
    try {
      item.imageData=await decodeFile(file);
      item.analysis=analyzeImage(item.imageData);
      if (item.imageData.pages>1) item.analysis.notes.push('Multi-page TIFF: only the first page is used.');
      item.status='waiting';
      if (item.analysis.overlay) item.scaleStyle={...(item.scaleStyle||{}), ...overlayScaleStyle(item.analysis.overlay)};
      if (!item.analysis.footerDetected && !item.analysis.bar) setPlain(item,true);
    } catch(e) { item.status='error'; item.error=e.message||String(e); }
    renderUI();
    await sleep(0);
  }
}

// Plain picture (schematic, photo…): no footer/scale bar, editable at once without Process.
function setPlain(item,on) {
  item.plain=!!on; item.error='';
  if (on) { item.noScale=true; item.sourceManual=true; item.ocrRaw='(picture)'; item.status='ok'; try { renderInto(item); } catch(e) { item.status='error'; item.error=e.message; } }
  else { item.noScale=false; item.sourceManual=false; item.sourceScaleText=''; item.targetScaleText=''; item.targetBarPx=null; item.ocrRaw=''; item.status='waiting'; item.outputCanvas=null; item.outputBlob=null; }
}
function removeItem(id) {
  const idx=state.items.findIndex(x=>x.id===id); if (idx<0) return;
  state.items.splice(idx,1);
  if (state.selectedId===id) state.selectedId=state.items[idx]?.id||state.items[idx-1]?.id||null;
  if (els.panelEnabled.checked) rerenderAllNow(); else renderUI();
}
function clearAll() { state.items=[]; state.selectedId=null; renderUI(); }
function selectedItem() { return state.items.find(x=>x.id===state.selectedId)||null; }

