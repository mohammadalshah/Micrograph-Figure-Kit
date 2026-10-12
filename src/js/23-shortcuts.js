// =====================================================================
// Micrograph Figure Kit — 23. Keyboard shortcuts and night mode
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Physical keys, so shortcuts also work with a Russian keyboard layout.
// =====================================================================
const SC_LIST=[
  ['Ctrl+Z','Undo'],['Ctrl+Y / Ctrl+Shift+Z','Redo'],['Ctrl+S','Save session'],['Ctrl+O','Open session'],
  ['1 / 2 / 3','Switch tab'],['[ / ]','Previous / next image'],['P','Process the selected image'],['Shift+P','Process new images'],
  ['C','Crop tool on / off'],['F','Large view on / off'],['Ctrl+E','Download the selected image'],['Ctrl+Shift+E','Download ZIP'],
  ['T','Add text'],['R','Add rectangle'],['O','Add circle'],['A','Add arrow'],['L','Add line'],['I','Add inset (magnified region)'],['M','Measure distance (Esc to stop)'],
  ['Ctrl+D','Duplicate the selected object'],['Ctrl+C / Ctrl+V','Copy / paste the selected object (also to another image)'],
  ['Arrows','Move the selected object by 1 px (Shift: 10 px)'],['Delete','Delete the selected object'],['Esc','Deselect / close'],['?','Show this list'],
];
let scClip=null;
function scKey(e) { return e.code ? e.code.replace(/^Key/,'').replace(/^Digit/,'').toLowerCase() : (e.key||'').toLowerCase(); }
function scTyping(t) { const tag=(t?.tagName||'').toLowerCase(); return ['input','textarea','select'].includes(tag) || t?.isContentEditable; }
function scClick(sel) { const b=typeof sel==='string'?document.querySelector(sel):sel; if (b && !b.disabled && b.offsetParent!==null) { b.click(); return true; } return false; }
function scHelp(show) {
  let ov=document.getElementById('scHelp');
  if (show===false || (show==null && ov)) { ov?.remove(); return; }
  if (ov) return;
  const T=s=>window.semI18n?.t(s)??s;
  ov=document.createElement('div'); ov.id='scHelp';
  ov.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:20px';
  const box=document.createElement('div');
  box.style.cssText='background:var(--panel);color:var(--ink);border-radius:14px;max-width:560px;width:100%;max-height:85vh;overflow:auto;padding:18px 20px;box-shadow:0 20px 50px rgba(0,0,0,.25);font:13px/1.45 system-ui,sans-serif';
  const hd=document.createElement('div'); hd.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:10px';
  const h=document.createElement('strong'); h.style.fontSize='15px'; h.textContent=T('Keyboard shortcuts');
  const x=document.createElement('button'); x.type='button'; x.className='btn ghost icon-btn'; x.textContent='×'; x.setAttribute('aria-label','Close'); x.onclick=()=>scHelp(false);
  hd.append(h,x);
  const g=document.createElement('div'); g.style.cssText='display:grid;grid-template-columns:auto 1fr;gap:6px 16px;align-items:baseline';
  for (const [k,d] of SC_LIST) {
    const kk=document.createElement('span'); kk.style.cssText='font:600 12px ui-monospace,Menlo,Consolas,monospace;white-space:nowrap;background:var(--accent-soft);border:1px solid var(--line);border-radius:6px;padding:1px 6px;justify-self:start'; kk.textContent=k;
    const dd=document.createElement('span'); dd.textContent=T(d); g.append(kk,dd);
  }
  const ft=document.createElement('p'); ft.className='hint'; ft.style.marginTop='12px'; ft.textContent=T('Single-letter shortcuts do not work while the cursor is in a text field.');
  box.append(hd,g,ft); ov.appendChild(box); ov.addEventListener('click',e=>{ if (e.target===ov) scHelp(false); });
  document.body.appendChild(ov);
}
document.getElementById('shortcutsBtn')?.addEventListener('click',()=>scHelp(true));
document.addEventListener('keydown',e=>{
  const k=scKey(e), mod=e.ctrlKey||e.metaKey;
  if (e.key==='Escape') {
    if (document.getElementById('scHelp')) { scHelp(false); return; }
    if (scTyping(e.target)) { e.target.blur(); return; }
    if (state.cropTool) { scClick(els.cropToolBtn); return; }
    if (state.pickBar) { pickDrag=null; setPickBar(false); const it=selectedItem(); if (it?.imageData) drawSource(it); return; }
    const t=objTarget(); if (t?.selObj) { t.selObj=null; if (t.multi) t.multi=[]; objRerender(0); }
    return;
  }
  if (scTyping(e.target) || e.altKey || e.repeat && !['bracketleft','bracketright'].includes(k)) return;
  const tab=state.tab, it=selectedItem();
  if (mod) {
    if (k==='d') { e.preventDefault(); scClick('#objDup'); }
    else if (k==='e') { e.preventDefault(); if (e.shiftKey) scClick(els.zipBtn||'#zipBtn'); else if (tab==='clean') scClick(els.downloadSelectedBtn); }
    else if (k==='c' && !e.shiftKey) { const t=objTarget(), o=t&&selObj(t); if (o && !String(window.getSelection?.()||'')) { e.preventDefault(); scClip=JSON.parse(JSON.stringify(o)); showToast('Object copied.'); } }
    else if (k==='v' && !e.shiftKey && scClip) { const t=objTarget(); if (t && (t.isFigure || t.imageData)) { e.preventDefault(); const c=cloneObj(scClip, t.objects.some(o=>o.id===scClip.id)?0.02:0); t.objects.push(c); t.selObj=c.id; state.lastCanvas=t.isFigure?'compose':'result'; objRerender(0); } }
    return;
  }
  if (e.key==='?' || (k==='slash' && e.shiftKey) || e.key==='F1') { e.preventDefault(); scHelp(); return; }
  if (['1','2','3'].includes(k) && !e.shiftKey) { e.preventDefault(); scClick(`.tab[data-tab="${{1:'clean',2:'compose',3:'eds'}[k]}"]`); return; }
  const add={t:'text', r:'rect', o:'ellipse', a:'arrow', l:'line', i:'inset'}[k];
  if (add && !e.shiftKey && tab!=='eds') { e.preventDefault(); scClick(`#addObjRow [data-add="${add}"]`); return; }
  if (tab!=='clean') return;
  if (k==='bracketleft' || k==='bracketright' || e.key==='PageUp' || e.key==='PageDown') {
    const i=state.items.findIndex(x=>x.id===state.selectedId), d=(k==='bracketleft'||e.key==='PageUp')?-1:1, j=i+d;
    if (j>=0 && j<state.items.length) { e.preventDefault(); state.selectedId=state.items[j].id; renderUI(); }
    return;
  }
  if (k==='p') { e.preventDefault(); scClick(e.shiftKey?els.processNewBtn:els.processOneBtn); return; }
  if (k==='c' && !e.shiftKey) { e.preventDefault(); scClick(els.cropToolBtn); return; }
  if (k==='f' && !e.shiftKey) { e.preventDefault(); scClick('#largeViewBtn2'); return; }
});
// ---- Night mode toggle (interface colors only) ----
(function(){
  const K='mfk.night.v1', b=document.getElementById('nightBtn'), root=document.documentElement; if (!b) return;
  const ic=p=>'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
  const MOON=ic('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>');
  const SUN=ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
  const paint=()=>{ const on=root.dataset.theme==='night', t=on?'Day mode':'Night mode'; b.innerHTML=on?SUN:MOON; b.title=t; b.setAttribute('aria-label',t); b.setAttribute('aria-pressed',String(on)); };
  b.onclick=()=>{ const on=root.dataset.theme!=='night'; if (on) root.dataset.theme='night'; else delete root.dataset.theme; lsSet(K,on?'1':'0'); paint(); };
  paint();
})();

