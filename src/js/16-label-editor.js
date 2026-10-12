// =====================================================================
// Micrograph Figure Kit — 16. Per-image scale label / panel letter editor
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    One editor factory, mounted in the Clean inspector and in the Compose panel.
// =====================================================================
function lblRerender(list) {
  for (const it of list) {
    if (!it || it.status==='working' || !renderable(it)) continue;
    try { if (!it.noScale) { if (!it.targetScaleText) it.targetScaleText=it.sourceScaleText; if (!it.targetBarPx) it.targetBarPx=computeBarLengthPx(originalBarPx(it),it.sourceScaleText,it.targetScaleText); } renderInto(it); }
    catch (e) { it.status='error'; it.error=e.message; it.outputCanvas=null; it.outputBlob=null; }
  }
  renderUI(); if (state.tab==='compose') renderCompose();
}
// Build the scale label / panel letter editor. getItem returns the target item, getOv extra settings (Compose letter mode).
function makeLblEditor(host, getItem, getOv) {
  const grp=(k,title,showTxt)=>`<div class="lbl-grp" data-g="${k}">
    <div class="lbl-head"><b>${title}</b><label class="check-row"><input type="checkbox" data-f="show" /><span>${showTxt}</span></label></div>
    <div class="edit-grid">
      ${k==='panel'?'<label class="field"><span>Letter</span><input data-f="text" type="text" maxlength="12" /></label>':''}
      <label class="field"><span>Size, pt</span><input data-f="size" type="number" min="0" max="200" step="0.5" /></label>
      <label class="field"><span>Color</span><input data-f="color" type="color" /></label>
      <label class="field"><span>Highlight</span><select data-f="hl"><option value="">Default</option><option value="1">On</option><option value="0">Off</option></select></label>
      <label class="field"><span>Highlight color</span><input data-f="hlColor" type="color" /></label>
    </div>
    <p class="lbl-note" data-f="note" hidden></p>
    <div class="row-actions">
      <button type="button" class="btn ghost icon-btn" data-a="reset">Reset to default</button>
      <button type="button" class="btn ghost icon-btn" data-a="all">Apply style to all</button>
      <button type="button" class="btn ghost icon-btn" data-a="hideAll">Delete from all</button>
      <button type="button" class="btn ghost icon-btn" data-a="showAll">Show on all</button>
    </div></div>`;
  host.innerHTML=grp('scale','Scale label','Show on this image')+grp('panel','Panel letter','Show on this image');
  const cfgNow=()=>({...settings(), ...(getOv?getOv():{})});
  const all=()=>state.items.filter(x=>x.imageData);
  const shown=(it,k,c)=>k==='scale'?!it.noScale&&!it.hideScale:!c.forceNoPanel&&!it.noPanel&&(c.panelEnabled||!!it.showPanel);
  const setShown=(it,k,on)=>{ if (k==='scale') it.hideScale=!on; else { it.noPanel=!on; it.showPanel=on; } };
  const setV=(el,v)=>{ if (document.activeElement!==el) el.value=v; };
  let t=null; const later=list=>{ clearTimeout(t); t=setTimeout(()=>lblRerender(list),180); };
  const sync=()=>{
    const it=getItem(), c=cfgNow();
    host.querySelectorAll('input,select,button').forEach(el=>el.disabled=!it&&el.dataset.a!=='hideAll'&&el.dataset.a!=='showAll');
    host.querySelectorAll('.lbl-grp').forEach(g=>{
      const k=g.dataset.g, q=f=>g.querySelector(`[data-f="${f}"]`), s=it?.[k+'Style']||{}, st=lblStyle(it,k,c);
      const gSize=k==='scale'?(c.fontSizeMode==='fixed'?c.fixedFontSize:'auto'):(c.panelSize>0?c.panelSize:'auto');
      q('show').checked=!!it&&shown(it,k,c);
      const note=q('note'); note.hidden=true;
      if (it && k==='scale' && it.noScale) { q('show').disabled=true; note.hidden=false; note.textContent='No calibration for this image, so there is no scale bar to show.'; }
      if (k==='panel' && c.forceNoPanel) { q('show').disabled=true; note.hidden=false; note.textContent='Panel letters are off for the whole figure (Labels → No panel letters).'; }
      if (k==='panel') { const lk=c.labelKey||'panelLabel', idx=c.labelIndex??state.items.indexOf(it); setV(q('text'), it?.[lk]||''); q('text').placeholder=it?'auto: '+panelText(idx, c.panelFormat):'auto'; }
      setV(q('size'), s.size>0?s.size:''); q('size').placeholder='default '+gSize;
      setV(q('color'), st.color); setV(q('hl'), s.hl===undefined?'':s.hl?'1':'0'); setV(q('hlColor'), st.hlColor);
    });
  };
  host.addEventListener('input', e=>{
    const f=e.target.dataset.f, g=e.target.closest('.lbl-grp'), it=getItem(); if (!f||!g||!it) return;
    const k=g.dataset.g, s=it[k+'Style']||(it[k+'Style']={});
    if (f==='show') { setShown(it,k,e.target.checked); lblRerender([it]); return; }
    if (f==='text') { it[cfgNow().labelKey||'panelLabel']=e.target.value.trim(); if (e.target.value.trim() && !shown(it,'panel',cfgNow())) setShown(it,'panel',true); later([it]); return; }
    if (f==='size') { const v=parseFloat(e.target.value); if (v>0) s.size=v; else delete s.size; later([it]); return; }
    if (f==='hl') { if (e.target.value==='') delete s.hl; else s.hl=e.target.value==='1'; }
    else s[f]=e.target.value;
    later([it]);
  });
  host.addEventListener('click', e=>{
    const a=e.target.closest('[data-a]')?.dataset.a, g=e.target.closest('.lbl-grp'); if (!a||!g) return;
    const k=g.dataset.g, it=getItem(), list=all(), name=k==='scale'?'Scale label':'Panel letter';
    if (a==='reset' && it) { delete it[k+'Style']; lblRerender([it]); }
    else if (a==='all' && it) { const s=it[k+'Style']; for (const x of list) { if (s) x[k+'Style']={...s}; else delete x[k+'Style']; } lblRerender(list); showToast(name+' style applied to all images.'); }
    else if (a==='hideAll') { list.forEach(x=>setShown(x,k,false)); lblRerender(list); showToast(name+' deleted from all images.'); }
    else if (a==='showAll') { list.forEach(x=>setShown(x,k,true)); lblRerender(list); showToast(name+' shown on all images.'); }
  });
  sync();
  return {sync};
}
window.lblClean=makeLblEditor($('#lblStyleClean'), ()=>selectedItem());
window.lblComp=makeLblEditor($('#lblStyleComp'), ()=>compose.cells[compose.sel]?.it||null, ()=>{
  const c=compose.cfg||compCfg(); return c.letters==='none'?{panelEnabled:false,forceNoPanel:true}:c.letters==='renumber'?{panelEnabled:true, labelKey:'compLabel', labelIndex:compose.sel}:{};
});
{ const s0=window.lblComp.sync; window.lblComp.sync=()=>{ s0(); const it=compose.cells[compose.sel]?.it; $('#lblCompName').textContent=it?it.name:'no panel selected'; }; }
// ---- Tab switching: the object editor DOM is shared by the Clean and Compose tabs ----
// Text, shapes and arrows editor lives in the left panel, under the drop zone.
{ const b=els.addObjRow.closest('.edit-block'); b.classList.add('setting-card','obj-side'); els.dropZone.after(b);
  // Per-image scale label / letter overrides: optional, collapsed by default.
  const l=$('#lblStyleClean').closest('.edit-block'), det=document.createElement('details');
  det.className='setting-card advanced obj-side'; const sum=document.createElement('summary'); sum.textContent='Scale label and panel letter on this image'; det.appendChild(sum);
  l.querySelector('.edit-block-title')?.remove(); while (l.firstChild) det.appendChild(l.firstChild); l.replaceWith(det); els.dropZone.after(det);
  // Left panel order.
  const panel=els.dropZone.closest('.control-panel'), cardOf=q=>{ const e=typeof q==='string'?$(q):q; return e?e.closest('.setting-card'):null; };
  [els.dropZone.parentElement.querySelector(':scope>.section-head'), els.dropZone, cardOf('#themeSelect'), cardOf('#manualScale'), cardOf('#fontFamily'), cardOf('#unitLang'), cardOf('#panelEnabled'), det, cardOf('#adjB'), cardOf(els.addObjRow), cardOf('#showDetection'), cardOf('#saveAllBtn'), $('#zipBtn')?.closest('.action-row')]
    .forEach(e=>{ if (e && e.parentElement===panel) panel.appendChild(e); });
  // Every settings card becomes a collapsible section like Advanced settings; open/closed state is remembered.
  const OPEN_KEY='mfk.openCards.v1'; let open={}; try { open=JSON.parse(localStorage.getItem(OPEN_KEY)||'{}')||{}; } catch(_) {}
  const saveOpen=()=>{ lsSet(OPEN_KEY,JSON.stringify(open)); };
  [...panel.children, ...['#composeView','#edsView'].flatMap(v=>[...(document.querySelector(v+'>.control-panel')?.children||[])])].forEach(card=>{
    if (!card.classList.contains('setting-card')) return;
    let d=card, key;
    if (card.tagName==='DETAILS') key=card.querySelector(':scope>summary')?.textContent.trim();
    else {
      const row=card.querySelector(':scope>.setting-title-row'), title=row?row.querySelector('.setting-title'):card.querySelector(':scope>.setting-title,:scope>.edit-block-title');
      if (!title) return;
      d=document.createElement('details'); d.className=card.className+' advanced'; if (card.id) { d.id=card.id; card.removeAttribute('id'); } if (card.hidden) d.hidden=true;
      const sm=document.createElement('summary'); sm.textContent=title.textContent.trim(); key=sm.textContent;
      const pill=row?row.querySelector('.status-pill'):null; if (pill) { pill.style.marginLeft='8px'; pill.style.verticalAlign='middle'; sm.appendChild(pill); }
      d.appendChild(sm); (row||title).remove(); while (card.firstChild) d.appendChild(card.firstChild); card.replaceWith(d);
    }
    if (key && open[key]!=null) d.open=!!open[key];
    d.addEventListener('toggle',()=>{ if (key) { open[key]=d.open; saveOpen(); } });
  }); }
// Resizable left panel (drag the divider; double-click resets). Width is shared by all tabs and remembered.
(function(){
  const KEY='mfk.leftW.v1', root=document.documentElement;
  const layouts=[...document.querySelectorAll('main.layout')];
  const place=()=>layouts.forEach(L=>{ const h=L.__rz, p=L.querySelector(':scope>.control-panel'); if (!h||!p||!p.offsetWidth) return; const g=parseFloat(getComputedStyle(L).columnGap)||18; h.style.left=(p.offsetLeft+p.offsetWidth+g/2-6)+'px'; });
  const setW=w=>{ if (w) root.style.setProperty('--left-w',Math.round(w)+'px'); else root.style.removeProperty('--left-w'); place(); };
  layouts.forEach(L=>{
    const h=document.createElement('div'); h.className='col-resizer'; h.title='Drag to resize the panel · double-click to reset'; L.appendChild(h); L.__rz=h;
    const p=L.querySelector(':scope>.control-panel');
    h.addEventListener('pointerdown',e=>{ e.preventDefault(); h.setPointerCapture(e.pointerId); h.classList.add('dragging'); const x0=e.clientX, w0=p.offsetWidth;
      const mv=ev=>setW(Math.max(260,Math.min(L.clientWidth*0.7,w0+ev.clientX-x0)));
      const up=()=>{ h.classList.remove('dragging'); h.removeEventListener('pointermove',mv); h.removeEventListener('pointerup',up); lsSet(KEY,String(p.offsetWidth)); };
      h.addEventListener('pointermove',mv); h.addEventListener('pointerup',up); });
    h.addEventListener('dblclick',()=>{ setW(0); try { localStorage.removeItem(KEY); } catch(_) {} });
    if (window.ResizeObserver) new ResizeObserver(place).observe(p);
  });
  window.addEventListener('resize',place);
  let w=0; try { w=Number(localStorage.getItem(KEY))||0; } catch(_) {}
  setW(w); setTimeout(place,50);
})();
const objHome={parent:els.addObjRow.parentElement, before:els.objProps.nextElementSibling};
$('#alignRow').addEventListener('click',e=>{ const m=e.target.closest('[data-align]')?.dataset.align; if (m) alignObjects(objTarget(), m); });
// Move the object editor between the Clean and Compose tabs.
function moveObjControls(toCompose) {
  const host=toCompose ? $('#compObjHost') : null;
  for (const el of [els.addObjRow, $('#eraseRow'), els.objList, $('#alignRow'), els.objProps]) { if (host) host.appendChild(el); else objHome.parent.insertBefore(el, objHome.before); }
}
$$('.tab').forEach(t=>t.addEventListener('click',()=>{
  const compose_=t.dataset.tab==='compose';
  state.tab=t.dataset.tab; state.lastCanvas=compose_?'compose':state.tab==='eds'?'eds':'result';
  moveObjControls(compose_);
  if (state.tab==='clean') { renderUI(); }
  $$('.tab').forEach(x=>{ const on=x===t; x.classList.toggle('active',on); x.setAttribute('aria-selected',String(on)); });
  els.cleanView.hidden=state.tab!=='clean'; els.composeView.hidden=!compose_; $('#edsView').hidden=state.tab!=='eds';
  if (state.tab==='eds') renderEds();
  window.scrollTo(0,0);
  if (compose_) { renderCompose(); renderObjList(compose.doc); }
}));

