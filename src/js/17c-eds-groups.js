// =====================================================================
// Micrograph Figure Kit — 17c. EDS groups
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Each Word report is a group with its own maps, calibration, erase boxes, element content and panel settings.
// =====================================================================
function edsGroupCur() { return eds.groups.find(g=>g.id===eds.batch); }
function edsHasAny() { return eds.tiles.length>0 || eds.groups.some(g=>g.id!==eds.batch && g.tiles?.length); }
function edsGroupStash() {
  const g=edsGroupCur(); if (!g) return null;
  return Object.assign(g,{tiles:eds.tiles, sel:eds.sel, cal:eds.cal, calConf:eds.calConf??null, erase:eds.erase, warnings:eds.warnings, quantSrc:eds.quantSrc||'', settings:histPanelSettings(document.getElementById('edsView'))});
}
// Settings are applied after the tiles are swapped; values that the input events reset (calConf, quantSrc) are restored last.
function edsGroupLoad(g) {
  eds.gen++; eds.batch=g.id; eds.tiles=g.tiles||[]; eds.sel=eds.tiles.some(t=>t.id===g.sel)?g.sel:(eds.tiles[0]?.id||null);
  eds.cal=g.cal||null; eds.erase=g.erase||[]; eds.warnings=g.warnings||[];
  // A bad saved value must not stop the group from loading.
  if (g.settings) { try { histApplySettings(g.settings); } catch (_) {} }
  eds.calConf=g.calConf??null; eds.quantSrc=g.quantSrc||''; edsSyncQuantStatus();
}
function edsGroupBlank(g) {
  eds.gen++; eds.batch=g.id; eds.tiles=[]; eds.sel=null; eds.cal=null; eds.calConf=null; eds.erase=[]; eds.warnings=[];
  edsEls.edsQText.value=''; eds.quantSrc=''; edsSyncQuantStatus();
}
function edsGroupNew(name) { edsGroupStash(); const g={id:uid(), name:name||''}; eds.groups.push(g); edsGroupBlank(g); return g; }
function edsHistReset() { if (typeof HIST==='undefined') return; HIST.eds={u:[],r:[],cur:null}; if (typeof histButtons==='function') histButtons(); }
function edsGroupSwitch(id) {
  if (id===eds.batch) return;
  if (edsAnalyzing) { showToast('Still reading the images. Try again in a moment.'); return; }
  const g=eds.groups.find(x=>x.id===id); if (!g) return;
  edsGroupStash(); edsGroupLoad(g); edsHistReset(); renderEds();
}
function edsGroupRemove(id) {
  const i=eds.groups.findIndex(g=>g.id===id); if (i<0) return;
  if (id!==eds.batch) { eds.groups.splice(i,1); renderEds(); return; }
  if (edsAnalyzing && eds.groups.length>1) { showToast('Still reading the images. Try again in a moment.'); return; }
  const next=eds.groups[i+1]||eds.groups[i-1]; eds.groups.splice(i,1);
  if (next) edsGroupLoad(next); else { const g={id:uid(), name:''}; eds.groups.push(g); edsGroupBlank(g); }
  edsHistReset(); renderEds();
}
function renderEdsGroups() {
  const W=edsEls.edsGroupsWrap, L=edsEls.edsGroups; if (!W || !L) return;
  W.hidden=eds.groups.length<2; L.innerHTML=''; if (W.hidden) return;
  eds.groups.forEach((g,k)=>{
    const cur=g.id===eds.batch, n=(cur?eds.tiles:g.tiles||[]).length, wrap=document.createElement('div'); wrap.className='chip-wrap';
    const b=document.createElement('button'); b.type='button'; b.className='file-chip'+(cur?' active':''); b.setAttribute('aria-pressed',String(cur));
    const nm=g.name||('Group '+(k+1)); b.textContent=(nm.length>28?nm.slice(0,27)+'…':nm)+' · '+n; b.title=nm; b.style.maxWidth='none'; b.style.overflow='visible'; b.onclick=()=>edsGroupSwitch(g.id);
    const x=document.createElement('button'); x.type='button'; x.className='chip-run'; x.textContent='×'; x.title=window.semI18n?.t('Remove this group')??'Remove this group'; x.setAttribute('aria-label',x.title);
    x.onclick=()=>edsGroupRemove(g.id);
    wrap.append(b,x); L.appendChild(wrap);
  });
}
