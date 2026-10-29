// =====================================================================
// Micrograph Figure Kit — 14. Event wiring for the Clean tab
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
// =====================================================================
els.fileInput.addEventListener('change',e=>{ addFiles(e.target.files); e.target.value=''; });
['dragenter','dragover'].forEach(t=>els.dropZone.addEventListener(t,e=>{ e.preventDefault(); els.dropZone.classList.add('dragover'); }));
['dragleave','drop'].forEach(t=>els.dropZone.addEventListener(t,e=>{ e.preventDefault(); els.dropZone.classList.remove('dragover'); }));
els.dropZone.addEventListener('drop',e=>addFiles(e.dataTransfer.files));
els.dropZone.addEventListener('keydown',e=>{ if (e.key==='Enter'||e.key===' ') { e.preventDefault(); els.fileInput.click(); } });
els.clearBtn.onclick=clearAll;

$$('input[name="scaleMode"]').forEach(r=>r.addEventListener('change',()=>{
  const manual=getScaleMode()==='manual';
  els.manualScale.disabled=!manual; els.applyManualBtn.disabled=!manual;
  els.manualScaleUnitToggle.disabled=!manual;
}));
els.applyManualBtn.onclick=()=>{
  try {
    const v=numericScaleText(els.manualScale, els.manualScaleUnitToggle);
    for (const it of state.items) {
      if (!it.imageData) continue;
      it.sourceScaleText=v; it.sourceManual=false; it.ocrRaw='(manual source)';
      if (!it.targetScaleText) it.targetScaleText=v;
      if (renderable(it)) { try { finalizeAndRender(it); } catch(e) { it.status='error'; it.error=e.message; } }
      else { it.outputCanvas=null; it.outputBlob=null; it.status='error'; it.error='Original scale bar was not detected. Enter “Original bar, px” in Calibration below.'; }
    }
    renderUI(); showToast(`Manual source scale applied: ${v}`);
  } catch(e) { showToast(e.message,3800); }
};

function updatePtHint() {
  const it=selectedItem(), wcm=Math.max(1,num(els.printWidth,8.5));
  let t='Point sizes match Word when the figure is printed at this width (8.5 cm ≈ one journal column, 17 cm ≈ full page width).';
  if (it?.imageData) { const w=getCrop(it).w, ppt=w/(wcm/2.54*72); t+=' Current image: 10 pt = '+Math.round(10*ppt)+' px.'; }
  els.ptHint.textContent=t;
}
function updateScaleExample() {
  try { els.scaleExample.textContent = `Example: ${displayScale('0.5 µm', settings())} · ${displayScale('200 nm', settings())}`; } catch(_) {}
}
els.fontSizeMode.addEventListener('change',()=>{
  els.fixedFontWrap.hidden=els.fontSizeMode.value!=='fixed';
  els.autoFontWrap.hidden=els.fontSizeMode.value!=='image';
});
els.unitLang.addEventListener('change',()=>{ relabelUnitButtons(); updateScaleExample(); });
els.decimalSep.addEventListener('change',updateScaleExample);
els.scalePosition.addEventListener('change',()=>{ state.items.forEach(it=>it.scalePos=null); });
els.fontFamily.addEventListener('change',updateFontStatus);
els.showDetection.onchange=()=>syncPreview(selectedItem());

const globalControls=[els.unitLang,els.decimalSep,els.scaleLayout,els.scalePosition,els.annoColor,els.fontFamily,els.fontWeight,els.fontSizeMode,els.fixedFontSize,els.printWidth,els.autoFontPct,els.panelEnabled,els.panelFormat,els.panelWeight,els.panelSize,els.panelMargin,els.rightMargin,els.barThickness,els.barTextGap,els.scaleHl,els.scaleHlColor,els.panelHl,els.panelHlColor,els.scaleOl,els.scaleOlColor,els.panelOl,els.panelOlColor];
globalControls.forEach(el=>{
  el.addEventListener('change',()=>scheduleRerenderAll(0));
  if (el.tagName==='INPUT' && ['number','text','color'].includes(el.type)) el.addEventListener('input',()=>scheduleRerenderAll(150));
});

// ---- Brightness / contrast / sharpness (per image) ----
// Same algorithm as EDS maps (Word order: sharpness first, then brightness/contrast).
function applyAdjust(c, a) {
  const ctx=c.getContext('2d'), W=c.width, H=c.height, img=ctx.getImageData(0,0,W,H), d=img.data;
  applySharpness(d,W,H,a.s||0);
  const lut=wordLevelsLUT(a.b||0,a.c||0);
  if (lut) for (let i=0;i<d.length;i+=4) { d[i]=lut[d[i]]; d[i+1]=lut[d[i+1]]; d[i+2]=lut[d[i+2]]; }
  ctx.putImageData(img,0,0);
}
const adjEls={b:$('#adjB'),c:$('#adjC'),s:$('#adjS'),bv:$('#adjBV'),cv:$('#adjCV'),sv:$('#adjSV'),name:$('#adjName'),all:$('#adjAll'),reset:$('#adjReset')};
function syncAdjUI() {
  const it=selectedItem(), a=it?.adj||{}, dis=!it?.imageData;
  if (!adjEls.b) return;
  adjEls.name.textContent=it?it.name:'no image selected';
  [['b','bv'],['c','cv'],['s','sv']].forEach(([k,v])=>{ adjEls[k].value=a[k]||0; adjEls[v].value=a[k]||0; adjEls[k].disabled=adjEls[v].disabled=dis; });
  adjEls.all.disabled=adjEls.reset.disabled=dis;
}
function adjChanged(items) {
  items.forEach(it=>{ it._base=null; if (renderable(it)) { try { renderInto(it); } catch(e) { it.error=e.message; } } });
  if (typeof compose!=='undefined' && compose) compose.srcCache={};
  renderUI();
}
let adjTimer=null;
['b','c','s'].forEach(k=>{
  const set=v=>{ const it=selectedItem(); if (!it?.imageData || !isFinite(v)) return; v=clamp(Math.round(v),-100,100);
    it.adj={...(it.adj||{}), [k]:v}; adjEls[k].value=v; adjEls[k+'v'].value=v;
    clearTimeout(adjTimer); adjTimer=setTimeout(()=>adjChanged([it]),120); };
  adjEls[k].addEventListener('input',()=>set(Number(adjEls[k].value)));
  adjEls[k+'v'].addEventListener('input',()=>{ if (adjEls[k+'v'].value!=='' && adjEls[k+'v'].value!=='-') set(Number(adjEls[k+'v'].value)); });
});
adjEls.reset.onclick=()=>{ const it=selectedItem(); if (!it) return; it.adj=null; adjChanged([it]); };
adjEls.all.onclick=()=>{ const it=selectedItem(); if (!it) return; const a={...(it.adj||{})}; state.items.forEach(x=>x.adj={...a}); adjChanged(state.items); showToast('Brightness, contrast and sharpness applied to all images.'); };

// ---- Themes (saved settings) ----
const THEME_IDS=['unitLang','decimalSep','scaleLayout','scalePosition','annoColor','scaleHl','scaleHlColor','rightMargin','fontFamily','fontWeight','fontSizeMode','autoFontPct','fixedFontSize','printWidth','panelEnabled','panelFormat','panelWeight','panelSize','panelMargin','panelHl','panelHlColor','scaleOl','scaleOlColor','panelOl','panelOlColor','barThickness','barTextGap','compPerRow','compMode','compWidth','compDpi','compGap','compMargin','compBg','compLetters','compTruePt','compLetterPos','uiLang'];
const THEME_KEY='mfk.themes.v1', THEME_LAST='mfk.themeLast.v1', THEME_AUTO='mfk.themeAuto.v1';
const themeEls={sel:$('#themeSelect'),name:$('#themeName'),apply:$('#themeApply'),save:$('#themeSave'),del:$('#themeDelete'),exp:$('#themeExport'),imp:$('#themeImport'),auto:$('#themeAuto'),status:$('#themeStatus')};
function themeCapture() {
  const t={};
  THEME_IDS.forEach(id=>{ const el=document.getElementById(id); if (el) t[id]=el.type==='checkbox'?el.checked:el.value; });
  t.scaleMode=getScaleMode(); return t;
}
const THEME_DEFAULT=themeCapture();
function themeLoad() { try { return JSON.parse(localStorage.getItem(THEME_KEY)||'{}')||{}; } catch(_) { return {}; } }
function themeStore(all) { lsSet(THEME_KEY,JSON.stringify(all)); }
function themeFill(sel) {
  const all=themeLoad(), s=themeEls.sel; s.innerHTML='<option value="__default">Default settings</option>';
  Object.keys(all).sort().forEach(n=>{ const o=document.createElement('option'); o.value=n; o.textContent=n; s.appendChild(o); });
  if (sel && (sel==='__default'||all[sel])) s.value=sel;
  themeEls.del.disabled=s.value==='__default';
}
function themeApply(t) {
  if (!t) return;
  if (t.scaleMode) { const r=document.querySelector(`input[name="scaleMode"][value="${t.scaleMode}"]`); if (r && !r.checked) { r.checked=true; r.dispatchEvent(new Event('change',{bubbles:true})); } }
  THEME_IDS.forEach(id=>{
    const el=document.getElementById(id), v=t[id]; if (!el || v==null) return;
    if (el.type==='checkbox') { if (el.checked===!!v) return; el.checked=!!v; }
    else { if (el.tagName==='SELECT') { const o=[...el.options].find(o=>o.value===String(v)); if (!o || o.disabled) return; } if (el.value===String(v)) return; el.value=v; }
    el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  scheduleRerenderAll(0);
}
themeEls.sel.onchange=()=>{ themeEls.del.disabled=themeEls.sel.value==='__default'; if (themeEls.sel.value!=='__default') themeEls.name.value=themeEls.sel.value; };
themeEls.apply.onclick=()=>{
  const n=themeEls.sel.value, t=n==='__default'?THEME_DEFAULT:themeLoad()[n];
  themeApply(t); lsSet(THEME_LAST,n);
  themeEls.status.textContent=n==='__default'?'default':n; showToast(`Theme applied: ${n==='__default'?'Default settings':n}`);
};
themeEls.save.onclick=()=>{
  const n=(themeEls.name.value||'').trim() || (themeEls.sel.value!=='__default'?themeEls.sel.value:'');
  if (!n) { showToast('Enter a name for the theme.'); themeEls.name.focus(); return; }
  const all=themeLoad(), existed=!!all[n]; all[n]=themeCapture(); themeStore(all);
  lsSet(THEME_LAST,n);
  themeFill(n); themeEls.status.textContent=n; showToast(existed?`Theme updated: ${n}`:`Theme saved: ${n}`);
};
themeEls.del.onclick=()=>{
  const n=themeEls.sel.value; if (n==='__default') return;
  if (!confirm((window.semI18n?.t('Delete theme')||'Delete theme')+` “${n}”?`)) return;
  const all=themeLoad(); delete all[n]; themeStore(all); themeFill('__default'); themeEls.name.value=''; showToast(`Theme deleted: ${n}`);
};
themeEls.exp.onclick=()=>{
  const n=themeEls.sel.value, t=n==='__default'?themeCapture():themeLoad()[n], name=n==='__default'?'current':n;
  const blob=new Blob([JSON.stringify({mfkTheme:1,name,settings:t},null,2)],{type:'application/json'});
  saveBlob(blob,`theme_${name.replace(/[^\w\-а-яА-Я]+/g,'_')}.json`,'application/json').catch(e=>showToast(e.message,4200));
};
themeEls.imp.onchange=async()=>{
  const f=themeEls.imp.files?.[0]; themeEls.imp.value=''; if (!f) return;
  try {
    const j=JSON.parse(await f.text()), t=j.settings||j; if (!t || typeof t!=='object') throw new Error();
    const n=String(j.name||f.name.replace(/\.json$/i,'').replace(/^theme_/,'')).slice(0,40), all=themeLoad(); all[n]=t; themeStore(all);
    themeFill(n); themeEls.name.value=n; showToast(`Theme imported: ${n}. Press Apply to use it.`);
  } catch(_) { showToast('This file is not a theme.',3800); }
};
themeEls.auto.onchange=()=>{ lsSet(THEME_AUTO,themeEls.auto.checked?'1':'0'); };
(function themeInit() {
  let last=null, auto='1'; try { last=localStorage.getItem(THEME_LAST); auto=localStorage.getItem(THEME_AUTO)??'1'; } catch(_) {}
  themeEls.auto.checked=auto==='1'; themeFill(last||'__default');
  if (auto==='1' && last && last!=='__default') { const t=themeLoad()[last]; if (t) { themeEls.name.value=last; themeEls.status.textContent=last; setTimeout(()=>themeApply(t),0); } }
})();

// Every imported font is kept: the first one in the original slot, further ones in their own slots.
els.fontInput.onchange=async()=>{
  const files=[...(els.fontInput.files||[])]; if (!files.length) return;
  let last=null, n=0;
  try {
    for (const f of files) {
      const buf=await f.arrayBuffer();
      if (!state.fontUploaded) { await installFontBuffer(buf.slice(0),f.name); await idbSet('cambria-font',{blob:new Blob([buf]),name:f.name}); last='__uploaded'; }
      else { const id=uid(), x=await installExtraFont(buf.slice(0),f.name,id); await idbSet('font:'+id,{blob:new Blob([buf]),name:f.name}); await saveExtraFontList(); last=x.value; }
      n++;
    }
  } catch(e) { showToast(`Font: ${e.message}`,4000); }
  finally {
    els.fontInput.value='';
    if (last) { els.fontFamily.value=last; updateFontStatus(); rerenderAllNow(); if (n) showToast(n>1?n+' fonts imported and stored in this browser.':'Font imported and stored in this browser.'); }
  }
};
els.forgetFontBtn.onclick=async()=>{
  // The selected imported font is removed; with a system font selected, all imported fonts are removed.
  const cur=els.fontFamily.value;
  if (cur.startsWith('__up:')) {
    try { await removeExtraFont(cur.slice(5)); els.fontFamily.value=state.fontUploaded?'__uploaded':'Times New Roman'; updateFontStatus(); rerenderAllNow(); showToast('Imported font removed from this browser.'); }
    catch(e) { showToast(`Font: ${e.message}`,4000); }
    return;
  }
  if (cur!=='__uploaded') for (const f of [...state.extraFonts]) { try { await removeExtraFont(f.id); } catch(_) {} }
  try {
    await idbDelete('cambria-font');
    state.fontUploaded=false; state.uploadedFontName='';
    els.uploadedFontOption.disabled=true; els.uploadedFontOption.textContent='Imported font';
    if (els.fontFamily.value==='__uploaded') els.fontFamily.value='Times New Roman';
    updateFontStatus();
    rerenderAllNow();
    showToast('Imported font removed from this browser.');
  } catch(e) { showToast(e.message); }
};

// ---- Processing buttons: all / new only / selected / per-chip ▶ ----
// An image counts as new until it has been processed once (ok or error).
function isUnprocessed(it) { return !!it.imageData && !it.plain && it.status!=='ok' && it.status!=='error' && it.status!=='working'; }
// Process the given items with the current settings.
async function runProcess(candidates) {
  if (state.busy || !candidates.length) return;
  const cfg=settings();
  if (cfg.scaleMode==='manual' && !cfg.manualScale) { showToast('Enter a valid manual source scale.',3800); return; }
  state.busy=true; renderUI();
  try {
    for (let i=0;i<candidates.length;i++) {
      setProgress(i/candidates.length,`${i+1}/${candidates.length}`);
      await processItem(candidates[i],i,candidates.length,cfg);
    }
    setProgress(1,'100%');
    await sleep(250);
    showToast(`Processing finished: ${state.items.filter(x=>x.status==='ok').length}/${candidates.length}.`);
  } catch(e) { showToast(e.message,4200); }
  finally { state.busy=false; hideProgress(); renderUI(); if (state.tab==='compose') renderCompose(); }
}
els.processBtn.onclick=()=>runProcess(state.items.filter(x=>x.imageData));
els.processNewBtn.onclick=()=>runProcess(state.items.filter(isUnprocessed));
els.processOneBtn.onclick=()=>{ const it=selectedItem(); if (it?.imageData) runProcess([it]); };
$('#plainToggleBtn').onclick=()=>{ const it=selectedItem(); if (!it?.imageData||state.busy) return; setPlain(it,!it.plain); showToast(it.plain?'Treated as a picture: no scale bar, ready to annotate.':'Treated as image with scale bar: press Process.'); renderUI(); if (state.tab==='compose') renderCompose(); };
$('#moveLeftBtn').onclick=()=>{ const it=selectedItem(); if (it) moveItemBy(it.id,-1); };
$('#moveRightBtn').onclick=()=>{ const it=selectedItem(); if (it) moveItemBy(it.id,1); };

// Advanced settings → Default: restore factory values and redraw.
const ADV_DEFAULTS={showDetection:false, ocrWarn:false, ovErase:false};
$('#advDefaultBtn').onclick=()=>{
  for (const [id,v] of Object.entries(ADV_DEFAULTS)) {
    const el=$('#'+id);
    if (el.type==='checkbox') el.checked=v; else el.value=v;
    el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  showToast('Advanced settings restored to defaults.');
};

[els.manualScaleUnitToggle, els.srcScaleUnitToggle].forEach(sel=>sel.addEventListener('change',()=>{
  convertUnitValue(sel===els.manualScaleUnitToggle?els.manualScale:els.srcScaleInput, sel);
}));
els.selectedScaleUnitToggle.addEventListener('change',()=>{
  convertUnitValue(els.selectedScaleInput, els.selectedScaleUnitToggle);
  if (renderable(selectedItem())) { syncLengthFromScaleForSelected(false); scheduleSelectedLiveRedraw(); }
});

els.applySourceBtn.onclick=()=>{
  const it=selectedItem(); if (!it?.imageData) return;
  try {
    const v=numericScaleText(els.srcScaleInput, els.srcScaleUnitToggle);
    const ob=Math.round(Number(els.origBarInput.value));
    if (ob>0) it.barPxOverride = (ob===it.analysis?.bar?.w) ? null : ob;
    it.sourceScaleText=v; it.sourceManual=true; it.noScale=false; it.plain=false;
    if (!it.targetScaleText) it.targetScaleText=v;
    finalizeAndRender(it);
    renderUI(); showToast('Calibration applied to this file.');
  } catch(e) { it.status='error'; it.error=e.message; renderUI(); showToast(e.message,3800); }
};
document.getElementById('ocrWarn')?.addEventListener('change',()=>{
  lsSet('mfk.ocrWarn.v1',document.getElementById('ocrWarn').checked?'1':'0');
  renderUI(); if (typeof renderEds==='function' && eds.tiles.length) renderEds();
});
try { document.getElementById('ocrWarn').checked=localStorage.getItem('mfk.ocrWarn.v1')==='1'; } catch(_) {}
document.getElementById('ovErase')?.addEventListener('change',()=>{
  lsSet('mfk.ovErase.v1',document.getElementById('ovErase').checked?'1':'0');
  adjChanged(state.items.filter(it=>it.analysis?.overlay));
});
try { document.getElementById('ovErase').checked=localStorage.getItem('mfk.ovErase.v1')==='1'; } catch(_) {}
els.ocrSelectedBtn.onclick=async()=>{
  const it=selectedItem(); if (!it?.imageData || state.busy) return;
  state.busy=true;
  try { it.sourceManual=false; await processItem(it,0,1,{...settings(), scaleMode:'ocr'}); }
  finally { state.busy=false; hideProgress(); renderUI(); }
};

els.syncScaleToLengthBtn.onclick=()=>{ syncLengthFromScaleForSelected(true); scheduleSelectedLiveRedraw(0); };
els.syncLengthToScaleBtn.onclick=()=>{ syncScaleFromLengthForSelected(true); scheduleSelectedLiveRedraw(0); };
els.resetScalePosBtn.onclick=()=>{ const it=selectedItem(); if (!it) return; it.scalePos=null; it.panelPos=null; rerenderSelectedSoon(0); };

els.selectedScaleInput.addEventListener('input', ()=>{
  if (Number(els.selectedScaleInput.value)>0 && renderable(selectedItem())) { syncLengthFromScaleForSelected(false); scheduleSelectedLiveRedraw(); }
});
els.selectedBarLengthInput.addEventListener('input', ()=>{
  if (Number(els.selectedBarLengthInput.value)>0 && renderable(selectedItem())) { syncScaleFromLengthForSelected(false); scheduleSelectedLiveRedraw(); }
});
els.selectedBarThicknessInput.addEventListener('input', ()=>{ if (renderable(selectedItem())) scheduleSelectedLiveRedraw(); });

els.reprocessSelectedBtn.onclick=()=>{
  const it=selectedItem(); if (!it?.imageData) return;
  try {
    if (!renderable(it)) throw new Error('Process this file first, or enter the calibration.');
    const scaleText=numericScaleText(els.selectedScaleInput, els.selectedScaleUnitToggle);
    const thicknessRaw=Number(els.selectedBarThicknessInput.value);
    it.targetScaleText=scaleText;
    it.targetBarThicknessPx=thicknessRaw>0?Math.round(thicknessRaw):null;
    finalizeAndRender(it);
    renderUI(); showToast('Selected file redrawn.');
  } catch(e) { it.error=e.message; renderUI(); showToast(e.message,3800); }
};
$('#saveSelPdf').onclick=()=>{ const it=selectedItem(); if (!it?.outputCanvas) { showToast('Process the selected image first.'); return; } saveOut(pdfBlob(it.outputCanvas,cleanDpi(it),'white'),safeBase(it.name)+'_clean.pdf'); };
$('#saveSelSvg').onclick=()=>{ const it=selectedItem(); if (!it?.outputCanvas) { showToast('Process the selected image first.'); return; } saveOut(svgVector(()=>renderResult(it),cleanDpi(it),it.outputCanvas),safeBase(it.name)+'_clean.svg'); };
$('#saveSelCsv').onclick=()=>{
  const list=state.items.filter(i=>i.imageData); if (!list.length) { showToast('Add images first.'); return; }
  const cfg=settings(), rows=[['File','Status','Source scale','Output scale','µm per px','Original bar (px)','Output bar (px)','Width (px)','Height (px)','Print width (cm)','Measurements']];
  for (const it of list) { const cr=it.outputCanvas||getCrop(it); rows.push([it.name, it.status, it.sourceScaleText||'', it.targetScaleText||it.sourceScaleText||'', csvNum(measUmPerPx(it)), originalBarPx(it)||'', it.targetBarPx||'', cr.width??cr.w, cr.height??cr.h, cfg.printWidthCm, (it.measures||[]).length]); }
  saveOut(csvBlob(rows),'SEM_images.csv');
};
els.downloadSelectedBtn.onclick=async()=>{
  const it=selectedItem();
  if (!it?.outputCanvas) { showToast('Process the selected image first.'); return; }
  try { const result=await saveProcessedItem(it); if (result.method!=='cancelled') showToast(`Saved: ${result.fileName}`); }
  catch(e) { showToast(`Save failed: ${e.message}`,4200); }
};

// Crop controls
document.getElementById('pickBarBtn').onclick=()=>{ const it=selectedItem(); if (!it?.imageData) { showToast(window.semI18n?.t('Select an image first.')??'Select an image first.'); return; } setPickBar(!state.pickBar); };
els.cropToolBtn.onclick=()=>{
  state.cropTool=!state.cropTool;
  if (state.cropTool && state.pickBar) setPickBar(false);
  els.cropToolBtn.classList.toggle('active',state.cropTool);
  els.cropToolBtn.setAttribute('aria-pressed',String(state.cropTool));
  els.sourceCanvas.classList.toggle('crop-active',state.cropTool);
  const it=selectedItem(); if (it?.imageData) drawSource(it);
};
[els.cropX,els.cropY,els.cropW,els.cropH].forEach(el=>el.addEventListener('change',()=>{
  const it=selectedItem(); if (!it?.imageData) return;
  const cur=getCrop(it);
  it.crop={x:num(els.cropX,cur.x), y:num(els.cropY,cur.y), w:Math.max(8,num(els.cropW,cur.w)), h:Math.max(8,num(els.cropH,cur.h))};
  it.crop=getCrop(it);
  onCropChanged(it);
}));
els.cropAspect.addEventListener('change',()=>{
  const it=selectedItem(); const r=aspectRatio(); if (!it?.imageData || !r) return;
  const cr=getCrop(it), W=it.imageData.width, H=it.imageData.height;
  let w=cr.w, h=Math.round(w/r);
  if (cr.y+h>H) { h=H-cr.y; w=Math.round(h*r); }
  it.crop={x:cr.x, y:cr.y, w:Math.min(w,W-cr.x), h};
  onCropChanged(it);
});
els.cropAutoBtn.onclick=()=>{ const it=selectedItem(); if (!it?.imageData) return; it.crop=null; onCropChanged(it); };
els.cropAllBtn.onclick=()=>{
  const it=selectedItem(); if (!it?.imageData) return;
  const cr=getCrop(it);
  for (const o of state.items) if (o.imageData) { o.crop={...cr}; o.crop=getCrop(o); }
  rerenderAllNow(); showToast('Crop applied to all images.');
};

// Free objects (text, shapes, arrows, insets)
els.panelLabelInput?.addEventListener('input',()=>{ const it=selectedItem(); if (!it) return; it.panelLabel=els.panelLabelInput.value.trim(); window.lblClean?.sync(); rerenderSelectedSoon(); });
// New object of the given type with sensible defaults.
function defaultObj(it, type) {
  const cfg=settings(), cr=objDims(it), W=cr.w, H=cr.h, short=Math.min(W,H), fg=cfg.color==='black'?'#000000':'#ffffff';
  const base={id:uid(), color:fg, outline:false, outlineColor:fg==='#ffffff'?'#000000':'#ffffff'};
  const sw=Math.max(2,Math.round(short*0.006));
  if (type==='text') return {...base, type:'text', text:'Text', x:0.42, y:0.45, size:0, font:'', bold:cfg.fontWeight>=600, italic:cfg.italic, underline:false, strike:false, bg:false, bgColor:'#000000'};
  const dashed=/Dashed$/.test(type), t=type.replace('Dashed','');
  if (t==='rect' || t==='ellipse') { const sz=short*0.2; return {...base, type:t, x:(W-sz)/2/W, y:(H-sz)/2/H, w:sz/W, h:sz/H, sw, dashed, fill:false, fillColor:fg, fillOpacity:25, lock:false}; }
  const L=short*0.25;
  return {...base, type:t, x1:(W/2-L/2)/W, y1:(H/2+L/4)/H, x2:(W/2+L/2)/W, y2:(H/2-L/4)/H, sw, dashed, head:0, 'double':false};
}
// New inset: a dashed source rectangle plus the magnified view (3×) linked to it.
function makeInset(it) {
  const cfg=settings(), cr=objDims(it), W=cr.w, H=cr.h, short=Math.min(W,H), fg=cfg.color==='black'?'#000000':'#ffffff';
  const sw=Math.max(2,Math.round(short*0.005)), s=short*0.12, d=s*3;
  const base={color:fg, outline:false, outlineColor:fg==='#ffffff'?'#000000':'#ffffff', sw};
  const rect={...base, id:uid(), type:'rect', x:0.3-s/2/W, y:0.6-s/2/H, w:s/W, h:s/H, dashed:true, fill:false, fillColor:fg, fillOpacity:25, lock:false, insetSrc:true};
  const inset={...base, id:uid(), type:'inset', src:rect.id, x:Math.max(0,1-(d+short*0.04)/W), y:short*0.04/H, w:d/W, h:d/H, ar:1, dashed:false, lines:true, fill:false, fillColor:fg, fillOpacity:25};
  return [rect, inset];
}
function cloneObj(o, off) {
  const c={...o, id:uid()};
  if (off) { if ('x1' in c) { c.x1+=off; c.x2+=off; c.y1+=off; c.y2+=off; } else { c.x+=off; c.y+=off; } }
  return c;
}
function deleteObj(it, o) { it.objects=it.objects.filter(x=>x!==o && !(o.type==='inset' && x.id===o.src) && !(x.type==='inset' && x.src===o.id)); it.selObj=null; objRerender(0); }
els.addObjRow.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{
  const it=objTarget(); if (!it || (!it.isFigure && !it.imageData)) return;
  let o;
  if (b.dataset.add==='inset') { const pair=makeInset(it); it.objects.push(...pair); o=pair[1]; }
  else { o=defaultObj(it,b.dataset.add); it.objects.push(o); }
  it.selObj=o.id; state.lastCanvas=it.isFigure?'compose':'result';
  objRerender(0);
  if (!it.isFigure && !renderable(it)) showToast('Added. It appears on the Result after the file is processed.');
  if (o.type==='text') setTimeout(()=>{ els.objText.focus(); els.objText.select(); }, 150);
}));
// Inset → separate Compose panel. The inset object stays in the source image (hidden there while its panel exists),
// so its style can still be edited in tab 1; the dashed box stays visible and links to the panel.
function insetCanvas(it, r) {
  const crop=getCrop(it), base=baseCanvas(it,crop);
  const x=Math.round(clamp(r.x,0,1)*crop.w), y=Math.round(clamp(r.y,0,1)*crop.h);
  const w=Math.max(4,Math.min(crop.w-x,Math.round(r.w*crop.w))), h=Math.max(4,Math.min(crop.h-y,Math.round(r.h*crop.h)));
  const c=document.createElement('canvas'); c.width=w; c.height=h; c.getContext('2d').drawImage(base,x,y,w,h,0,0,w,h);
  return {c, key:[crop.x,crop.y,crop.w,crop.h,x,y,w,h,JSON.stringify(it.adj||{})].join(',')};
}
function insetSent(o) { return !!(o?.sent && state.items.some(i=>i.id===o.sent)); }
function insetToCompose(it, o, letter) {
  const r=it?.objects?.find(q=>q.id===o?.src); if (!r || it.isFigure || !it.imageData) return null;
  const {c,key}=insetCanvas(it,r);
  const nm=(it.name||'image').replace(/\.[^.]+$/,'')+' – inset.png';
  const item=edsMakeItem(nm, c, {fromEds:false, edsBatch:null, ocrRaw:'(inset)', insetOf:it.id, insetLink:{inset:o.id, rect:r.id}, insetKey:key, noPanel:!letter, showPanel:!!letter});
  try { renderInto(item); } catch (_) { return null; }
  o.sent=item.id; it.selObj=null; try { renderInto(it); } catch (_) {}
  const at=state.items.indexOf(it); state.items.splice(at>=0?at+1:state.items.length,0,item);
  return item;
}
function insetSendAll(it, letter) { let n=0; for (const o of (it?.objects||[]).filter(q=>q.type==='inset' && !insetSent(q))) if (insetToCompose(it,o,letter)) n++; return n; }
// Rebuild inset panels whose source area or image changed in tab 1 (all of them when force).
function insetRefreshSent(force) {
  let n=0;
  for (const item of state.items) {
    if (!item.insetLink) continue;
    const it=state.items.find(x=>x.id===item.insetOf), r=it?.objects?.find(q=>q.id===item.insetLink.rect);
    if (!r || !it.imageData) continue;
    const {c,key}=insetCanvas(it,r); if (!force && key===item.insetKey) continue;
    item.imageData=c.getContext('2d').getImageData(0,0,c.width,c.height); item.analysis={...(item.analysis||{}), footerY:c.height};
    item.crop=null; item._base=null; item._src=null; item._erased=null; item.insetKey=key;
    try { renderInto(item); } catch (_) {}
    n++;
  }
  return n;
}
// Inset drawn on the whole Compose figure: move its area into the panel under it, then send it like a tab-1 inset.
function figureInsetToCompose(o, letter) {
  const doc=compose.doc, r=doc.objects.find(q=>q.id===o.src), cv=compose.canvas; if (!r || !cv) return null;
  const W=cv.width, H=cv.height, cx=(r.x+r.w/2)*W, cy=(r.y+r.h/2)*H;
  const cell=compose.cells.find(c=>cx>=c.dx && cx<=c.dx+c.dw && cy>=c.dy && cy<=c.dy+c.dh); if (!cell) return null;
  const it=cell.it, crop=getCrop(it), k=crop.w/Math.max(1,cell.dw);
  const x0=clamp((r.x*W-cell.dx)/cell.dw,0,1), y0=clamp((r.y*H-cell.dy)/cell.dh,0,1);
  const x1=clamp((r.x*W+r.w*W-cell.dx)/cell.dw,0,1), y1=clamp((r.y*H+r.h*H-cell.dy)/cell.dh,0,1);
  if (x1-x0<=0 || y1-y0<=0) return null;
  const rect={...r, id:uid(), x:x0, y:y0, w:x1-x0, h:y1-y0, sw:Math.max(0.5,(r.sw||2)*k)};
  const ins={...o, id:uid(), src:rect.id, sw:Math.max(0.5,(o.sw||2)*k), x:0.6, y:0.05, w:0.35, h:0.35};
  it.objects=it.objects||[]; it.objects.push(rect,ins);
  const item=insetToCompose(it,ins,letter);
  if (!item) { it.objects=it.objects.filter(q=>q!==rect && q!==ins); return null; }
  doc.objects=doc.objects.filter(q=>q!==o && q!==r); doc.selObj=null;
  return item;
}
document.querySelectorAll('[data-inset-send]').forEach(b=>b.addEventListener('click',()=>{
  const it=objTarget(), o=selObj(it); if (!o || o.type!=='inset') return;
  const letter=b.dataset.insetSend==='letter';
  if (it.isFigure) {
    if (!figureInsetToCompose(o,letter)) { showToast('Place the inset area over one panel to make it a separate image.',4200); return; }
    renderUI(); renderCompose(); showToast('Inset moved to Compose figure as a separate panel; connector lines link it to the dashed box.',4200); return;
  }
  const item=insetToCompose(it,o,letter);
  if (!item) { showToast('The inset area could not be read. Process the image first.'); return; }
  renderUI(); showToast('Inset moved to Compose figure as a separate panel; connector lines link it to the dashed box.',4200);
}));
// Bind a property field to the selected object.
function bindProp(el, fn, ev) {
  el.addEventListener(ev||'input', ()=>{ const it=objTarget(), o=selObj(it); if (!o) return; fn(o,it); objRerender(60); });
}
bindProp(els.objText, o=>{ o.text=els.objText.value; });
bindProp(document.getElementById('objLines'), o=>{ o.lines=document.getElementById('objLines').checked; }, 'change');
bindProp(els.objFont, o=>{ o.font=els.objFont.value; }, 'change');
bindProp(els.objSize, o=>{ const v=Number(els.objSize.value); if (v>=0) o.size=v; });
bindProp(els.objColor, o=>{ o.color=els.objColor.value; });
bindProp(els.objBgColor, o=>{ o.bgColor=els.objBgColor.value; });
bindProp(els.objOutlineColor, o=>{ o.outlineColor=els.objOutlineColor.value; });
bindProp(els.objFillColor, o=>{ o.fillColor=els.objFillColor.value; });
bindProp(els.objFillOpacity, o=>{ const v=Number(els.objFillOpacity.value); if (v>=0 && v<=100) o.fillOpacity=v; });
bindProp(els.objStrokeW, o=>{ const v=Number(els.objStrokeW.value); if (v>0) o.sw=v; });
bindProp(els.objHead, o=>{ const v=Number(els.objHead.value); if (v>=0) o.head=v; });
bindProp(els.objRot, (o,it)=>{ const v=Number(els.objRot.value); if (!isFinite(v)) return;
  if ('x1' in o) { const cr=objDims(it), mx=(o.x1+o.x2)/2*cr.w, my=(o.y1+o.y2)/2*cr.h, L=Math.hypot((o.x2-o.x1)*cr.w,(o.y2-o.y1)*cr.h)/2, a=v*Math.PI/180;
    o.x1=(mx-L*Math.cos(a))/cr.w; o.y1=(my+L*Math.sin(a))/cr.h; o.x2=(mx+L*Math.cos(a))/cr.w; o.y2=(my-L*Math.sin(a))/cr.h; }
  else o.rot=((v%360)+360)%360>180?((v%360)+360)%360-360:((v%360)+360)%360; });
bindProp(els.objW, (o,it)=>{ const v=Number(els.objW.value), cr=objDims(it); if (v>0) { o.w=v/cr.w; if (o.lock) o.h=v/cr.h; } });
bindProp(els.objH, (o,it)=>{ const v=Number(els.objH.value), cr=objDims(it); if (v>0) { o.h=v/cr.h; if (o.lock) o.w=v/cr.w; } });
bindProp(els.objLen, (o,it)=>{
  const v=Number(els.objLen.value), cr=objDims(it), dx=(o.x2-o.x1)*cr.w, dy=(o.y2-o.y1)*cr.h, L=Math.hypot(dx,dy)||1;
  if (v>0) { o.x2=o.x1+dx*v/L/cr.w; o.y2=o.y1+dy*v/L/cr.h; }
});
[['objBold','bold'],['objItalic','italic'],['objUnderline','underline'],['objStrike','strike'],['objBg','bg'],['objOutline','outline'],['objDashed','dashed'],['objFill','fill'],['objDouble','double']]
  .forEach(([id,k])=>bindProp(els[id], o=>{ o[k]=els[id].checked; }, 'change'));
bindProp(els.objLock, (o,it)=>{ o.lock=els.objLock.checked; if (o.lock) { const cr=objDims(it), side=Math.max(o.w*cr.w,o.h*cr.h); o.w=side/cr.w; o.h=side/cr.h; } }, 'change');
els.rtToolbar.querySelectorAll('button').forEach(b=>{
  b.addEventListener('mousedown', e=>e.preventDefault());
  if (b.hasAttribute('data-greek-toggle')) { b.addEventListener('click',()=>rtGreekToggle(b)); return; }
  b.addEventListener('click', ()=>{
    const ta=els.objText, st=ta.selectionStart, en=ta.selectionEnd, v=ta.value;
    if (b.dataset.ins) {
      ta.value=v.slice(0,st)+b.dataset.ins+v.slice(en); ta.focus(); ta.setSelectionRange(st+b.dataset.ins.length, st+b.dataset.ins.length);
    } else {
      const t=b.dataset.wrap, sel=v.slice(st,en)||((t==='sup'||t==='sub')?'2':'text');
      ta.value=v.slice(0,st)+'<'+t+'>'+sel+'</'+t+'>'+v.slice(en);
      ta.focus(); ta.setSelectionRange(st+t.length+2, st+t.length+2+sel.length);
    }
    ta.dispatchEvent(new Event('input'));
  });
});
els.objDup.onclick=()=>{ const it=objTarget(), o=selObj(it); if (!o) return; const c=cloneObj(o,0.03); it.objects.push(c); it.selObj=c.id; objRerender(0); };
els.objCopyAll.onclick=()=>{
  const it=objTarget(), o=selObj(it); if (!o) return;
  let n=0; for (const x of state.items) { if (x===it || !x.imageData) continue; x.objects.push(cloneObj(o,0)); n++; }
  rerenderAllNow(); showToast('Copied to '+n+' other image(s).');
};
els.objDel.onclick=()=>{ const it=objTarget(), o=selObj(it); if (o) deleteObj(it,o); };
// Brush eraser (like Paint): paints over anything on the image with the eraser color. Alt+click picks the color from the image.
const objEraserBtn=document.getElementById('objEraser'), eraseSizeEl=document.getElementById('eraseSize'), eraseColorEl=document.getElementById('eraseColor');
const eraseRing=document.createElement('div'); eraseRing.style.cssText='position:fixed;pointer-events:none;border:1.5px solid #ff3b30;box-shadow:0 0 0 1px rgba(255,255,255,.8);border-radius:50%;z-index:9999;display:none;transform:translate(-50%,-50%)'; document.body.appendChild(eraseRing);
let objEraseOn=false, erasing=null, eraseFrame=0;
function setObjEraser(on) {
  objEraseOn=!!on; erasing=null; eraseRing.style.display='none';
  objEraserBtn.classList.toggle('active',objEraseOn); objEraserBtn.setAttribute('aria-pressed',String(objEraseOn));
  els.resultCanvas.style.cursor=objEraseOn?'none':''; if (els.compCanvas) els.compCanvas.style.cursor=objEraseOn?'none':'';
}
objEraserBtn.onclick=()=>setObjEraser(!objEraseOn);
const eraseDoc=cv=>cv===els.compCanvas?compose.doc:selectedItem();
const eraseRedraw=(cv,doc)=>{ if (cv===els.compCanvas) { if (!eraseFrame) eraseFrame=requestAnimationFrame(()=>{ eraseFrame=0; finishCompose(); paintCompose(); }); } else redrawResultFast(doc); };
function eraseRingAt(cv,e) {
  const p=canvasPoint(cv,e), d=Math.max(1,Number(eraseSizeEl.value)||20)/(p.k||1);
  Object.assign(eraseRing.style,{display:'block',left:e.clientX+'px',top:e.clientY+'px',width:d+'px',height:d+'px'});
}
document.getElementById('eraseUndo').onclick=()=>{
  const doc=objTarget(); if (!doc?.objects) return;
  for (let i=doc.objects.length-1;i>=0;i--) if (doc.objects[i].type==='erase') { doc.objects.splice(i,1); objRerender(0); return; }
};
document.getElementById('eraseClear').onclick=()=>{ const doc=objTarget(); if (!doc?.objects) return; doc.objects=doc.objects.filter(o=>o.type!=='erase'); objRerender(0); };
setTimeout(()=>[els.resultCanvas, els.compCanvas].forEach(cv=>{ if (!cv) return;
  cv.addEventListener('pointerdown',e=>{
    if (!objEraseOn || e.button!==0) return; e.stopImmediatePropagation(); e.preventDefault();
    const doc=eraseDoc(cv); if (!doc?.renderMeta) return;
    const p=canvasPoint(cv,e), W=doc.renderMeta.crop.w, H=doc.renderMeta.crop.h;
    if (e.altKey) { const px=cv.getContext('2d').getImageData(Math.round(p.x),Math.round(p.y),1,1).data; eraseColorEl.value='#'+[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,'0')).join(''); return; }
    const o={id:uid(), type:'erase', color:eraseColorEl.value, r:Math.max(1,Number(eraseSizeEl.value)||20)/W, pts:[[p.x/W,p.y/H]]};
    doc.objects.push(o); doc.selObj=null; doc.multi=[]; cv.setPointerCapture(e.pointerId);
    state.lastCanvas=cv===els.compCanvas?'compose':'result'; erasing={cv,doc,o,W,H}; eraseRedraw(cv,doc);
  },true);
  cv.addEventListener('pointermove',e=>{
    if (!objEraseOn) return; e.stopImmediatePropagation(); eraseRingAt(cv,e);
    if (erasing?.cv!==cv) return; const p=canvasPoint(cv,e); erasing.o.pts.push([p.x/erasing.W,p.y/erasing.H]); eraseRedraw(cv,erasing.doc);
  },true);
  cv.addEventListener('pointerleave',()=>{ if (objEraseOn) eraseRing.style.display='none'; });
  const end=e=>{ if (!objEraseOn) return; e.stopImmediatePropagation(); if (erasing?.cv===cv) { erasing=null; objRerender(0); } };
  cv.addEventListener('pointerup',end,true); cv.addEventListener('pointercancel',end,true);
}),0);
document.addEventListener('keydown',e=>{ if (objEraseOn && e.key==='Escape') { e.stopImmediatePropagation(); setObjEraser(false); } },true);
document.querySelectorAll('.tab[data-tab]').forEach(t=>t.addEventListener('click',()=>{ if (objEraseOn) setObjEraser(false); }));
els.addObjRow.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{ if (objEraseOn) setObjEraser(false); }));
els.largeViewBtn.onclick=els.largeViewBtn2.onclick=(e)=>{
  const b=e.currentTarget, card=b.closest('.preview-card'), on=card.classList.toggle('large');
  b.classList.toggle('active',on); b.setAttribute('aria-pressed',String(on));
  const it=selectedItem(); if (it?.imageData) { drawSource(it); paintResult(it); }
};

els.selectOutputFolderBtn.onclick=chooseOutputFolder;
els.saveAllBtn.onclick=()=>saveAllSeparate('png');
$('#saveAllTifBtn').onclick=()=>saveAllSeparate('tif');
$('#saveAllPdfBtn').onclick=()=>saveAllSeparate('pdf');
$('#saveAllSvgBtn').onclick=()=>saveAllSeparate('svg');
els.zipBtn.onclick=downloadZip;
els.auditBtn.onclick=async()=>{
  try {
    const blob=new Blob([auditCSV()],{type:'text/csv;charset=utf-8'});
    const result=await saveBlob(blob,'sem_processing_audit.csv','text/csv');
    if (result.method!=='cancelled') showToast('CSV save started.');
  } catch(e) { showToast(`Save failed: ${e.message}`,4200); }
};

