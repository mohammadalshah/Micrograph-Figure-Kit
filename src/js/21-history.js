// =====================================================================
// Micrograph Figure Kit — 21. Undo / redo (one history per tab)
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
// =====================================================================
// Each step is a JSON snapshot of the tab's editable state (no pixels; image objects are kept by reference).
const HIST={clean:{u:[],r:[],cur:null}, compose:{u:[],r:[],cur:null}, eds:{u:[],r:[],cur:null}, restoring:false, timer:null, LIMIT:100};
function histView(tab) { return tab==='compose'?els.composeView:tab==='eds'?document.getElementById('edsView'):els.cleanView; }
function histPanelSettings(view) {
  const t={}; if (!view) return t;
  view.querySelectorAll('.control-panel input, .control-panel select, .control-panel textarea').forEach(el=>{
    if (['file','button','submit','hidden'].includes(el.type) || el.closest('#edsSelCard')) return;
    if (el.type==='radio') { if (el.checked && el.name) t['radio:'+el.name]=el.value; return; }
    if (!el.id || SESS_SKIP_ID.test(el.id)) return;
    t[el.id]=el.type==='checkbox'?el.checked:el.value;
  });
  return t;
}
function histApplySettings(t) {
  for (const k of Object.keys(t)) {
    let el, v=t[k];
    if (k.startsWith('radio:')) { el=[...document.getElementsByName(k.slice(6))].find(r=>r.value===v); if (!el || el.checked) continue; el.checked=true; el.dispatchEvent(new Event('change',{bubbles:true})); continue; }
    el=document.getElementById(k); if (!el) continue;
    if (el.type==='checkbox') { if (el.checked===!!v) continue; el.checked=!!v; } else { if (el.value===String(v)) continue; el.value=v; }
    el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
  }
}
function histSnap(tab) {
  let d, refs;
  if (tab==='compose') d={order:compose.order, off:[...compose.off], free:sessPlain(compose.free), mode:compose.lastAutoMode, objects:sessPlain(compose.doc.objects||[])};
  else if (tab==='eds') { refs=new Map(eds.tiles.map(t=>[t.id,t])); d={tiles:eds.tiles.map(t=>sessPlain(t)), cal:sessPlain(eds.cal), calConf:eds.calConf??null, erase:sessPlain(eds.erase||[])}; }
  else { const list=state.items.filter(i=>i.imageData); refs=new Map(list.map(i=>[i.id,i]));
    d={items:list.map(it=>{ const o=sessPlain(it); o.status=it.status==='working'?'waiting':it.status; o.error=it.error||''; delete o.selObj; delete o.multi; return o; })}; }
  d.settings=histPanelSettings(histView(tab));
  return {str:JSON.stringify(d), refs};
}
const HIST_KEEP=new Set(['file','imageData','outputCanvas','outputBlob','renderMeta','src','selObj','multi']);
function histAssign(obj, p) {
  for (const k of Object.keys(obj)) if (!HIST_KEEP.has(k) && k!=='analysis' && !(k in p)) delete obj[k];
  for (const k of Object.keys(p)) { if (k==='analysis') obj.analysis={...(obj.analysis||{}), ...p.analysis}; else obj[k]=sessRevive(p[k]); }
}
function histApply(tab, snap) {
  const d=JSON.parse(snap.str);
  // Panel settings affect every image; if they are unchanged, only images whose own state changed are re-rendered.
  const setChanged=!!d.settings && JSON.stringify(histPanelSettings(histView(tab)))!==JSON.stringify(d.settings);
  if (d.settings) histApplySettings(d.settings);
  if (tab==='compose') {
    compose.order=d.order||[]; compose.off=new Set(d.off||[]); compose.free=d.free||{}; compose.lastAutoMode=d.mode||'justify';
    compose.doc.objects=d.objects||[]; if (!compose.doc.objects.some(o=>o.id===compose.doc.selObj)) compose.doc.selObj=null;
    compose.sel=-1; compose.srcCache={}; renderCompose(); renderObjList(compose.doc);
  } else if (tab==='eds') {
    const cur=new Map(eds.tiles.map(t=>[t.id,t]));
    eds.tiles=d.tiles.map(p=>{ const t=cur.get(p.id)||snap.refs?.get(p.id); if (!t) return null; histAssign(t,p); return t; }).filter(Boolean);
    eds.cal=d.cal||null; eds.calConf=d.calConf??null; eds.erase=d.erase||[];
    if (!eds.tiles.some(t=>t.id===eds.sel)) eds.sel=eds.tiles[0]?.id||null;
    renderEds(); if (typeof syncEdsSel==='function') syncEdsSel();
  } else {
    const cur=new Map(state.items.map(i=>[i.id,i]));
    const sig=it=>it.status+'|'+JSON.stringify(sessPlain(it));
    state.items=d.items.map(p=>{ const it=cur.get(p.id)||snap.refs?.get(p.id); if (!it) return null;
      const before=sig(it); histAssign(it,p);
      const same=!setChanged && !!it.outputCanvas && sig(it)===before;
      if (!same) { it.outputCanvas=null; it.outputBlob=null; it.renderMeta=null; }
      if (!(it.objects||[]).some(o=>o.id===it.selObj)) it.selObj=null;
      if (!same && it.status==='ok' && renderable(it)) { try { renderInto(it); } catch(e) { it.status='error'; it.error=e.message; } }
      return it; }).filter(Boolean);
    if (!state.items.some(i=>i.id===state.selectedId)) state.selectedId=state.items[0]?.id||null;
    renderUI();
  }
}
function histButtons() {
  const h=HIST[state.tab]||HIST.clean, u=document.getElementById('undoBtn'), r=document.getElementById('redoBtn');
  if (u) u.disabled=!h.u.length; if (r) r.disabled=!h.r.length;
}
function histCheck() {
  clearTimeout(HIST.timer);
  if (state.busy || HIST.restoring) return;
  const h=HIST[state.tab]; if (!h) return;
  const s=histSnap(state.tab);
  if (!h.cur) { h.cur=s; histButtons(); return; }
  if (s.str===h.cur.str) { histButtons(); return; }
  h.u.push(h.cur); if (h.u.length>HIST.LIMIT) h.u.shift(); h.r=[]; h.cur=s; histButtons();
}
function histSchedule(d=350) { if (HIST.restoring) return; clearTimeout(HIST.timer); HIST.timer=setTimeout(histCheck,d); }
function histStep(dir) {
  if (state.busy) return;
  histCheck();
  const tab=state.tab, h=HIST[tab]; if (!h) return;
  const from=dir<0?h.u:h.r, to=dir<0?h.r:h.u;
  if (!from.length) { showToast(dir<0?'Nothing to undo.':'Nothing to redo.'); return; }
  const snap=from.pop(); to.push(h.cur); h.cur=snap;
  HIST.restoring=true;
  try { histApply(tab,snap); } catch(e) { showToast((dir<0?'Undo':'Redo')+' failed: '+(e.message||e),4200); }
  // Let debounced re-renders settle, then take the resulting state as current.
  setTimeout(()=>{ HIST.restoring=false; if (state.tab===tab) h.cur={str:histSnap(tab).str, refs:snap.refs||h.cur.refs}; histButtons(); },450);
  histButtons();
}
['pointerup','change','input','keyup','drop'].forEach(ev=>document.addEventListener(ev,()=>histSchedule(),true));
document.addEventListener('click',e=>{ if (e.target.closest?.('.tab')) setTimeout(()=>{ histCheck(); histButtons(); },0); else histSchedule(); },true);
document.addEventListener('keydown',e=>{
  if (!(e.ctrlKey||e.metaKey) || e.altKey) return;
  const k=scKey(e); if (k!=='z' && k!=='y') return;
  const a=document.activeElement, tag=(a?.tagName||'').toLowerCase();
  if (tag==='textarea' || a?.isContentEditable || (tag==='input' && ['text','search'].includes(a.type))) return; // native undo while typing text
  e.preventDefault();
  histStep(k==='y' || (k==='z' && e.shiftKey) ? 1 : -1);
});
document.getElementById('undoBtn')?.addEventListener('click',()=>histStep(-1));
document.getElementById('redoBtn')?.addEventListener('click',()=>histStep(1));
setTimeout(histCheck,500);

