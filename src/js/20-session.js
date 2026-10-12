// =====================================================================
// Micrograph Figure Kit — 20. Session save / open (.json project file)
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Images are embedded as data URLs; values read from a file are treated as untrusted.
// =====================================================================
const SESSION_VER=1, SESSION_SKIP=new Set(['file','imageData','outputCanvas','outputBlob','renderMeta','status','error','src']);
function sessPlain(v) {
  if (typeof v==='function') return undefined;
  if (v==null || typeof v!=='object') return v;
  if (ArrayBuffer.isView(v) || v instanceof ArrayBuffer || v instanceof ImageData || v instanceof HTMLCanvasElement || v instanceof HTMLImageElement || v instanceof Blob || (typeof ImageBitmap!=='undefined' && v instanceof ImageBitmap)) return undefined;
  if (v instanceof Set) return {__set:[...v].map(sessPlain)};
  if (Array.isArray(v)) return v.map(sessPlain);
  const o={}; for (const k of Object.keys(v)) { if (k[0]==='_' || SESSION_SKIP.has(k)) continue; const x=sessPlain(v[k]); if (x!==undefined) o[k]=x; } return o;
}
function sessRevive(v) {
  if (v && typeof v==='object') {
    if (Array.isArray(v.__set)) return new Set(v.__set);
    for (const k of Object.keys(v)) { if (k==='__proto__' || k==='constructor' || k==='prototype') { delete v[k]; continue; } v[k]=sessRevive(v[k]); }
  }
  return v;
}
function sessImgToURL(id) { const c=document.createElement('canvas'); c.width=id.width; c.height=id.height; c.getContext('2d').putImageData(id,0,0); return c.toDataURL('image/png'); }
// Only embedded image data is accepted, so a session file can never make the page load anything from a server.
async function sessURLToImg(url) {
  if (typeof url!=='string' || !/^data:image\/(png|jpeg|webp|bmp|gif);base64,/i.test(url)) throw new Error('an image in the session file is missing or not embedded');
  const im=await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>rej(new Error('an image in the session file is damaged')); i.src=url; });
  const c=document.createElement('canvas'); c.width=im.naturalWidth; c.height=im.naturalHeight; const x=c.getContext('2d'); x.drawImage(im,0,0); return x.getImageData(0,0,c.width,c.height);
}
// Global settings: theme fields plus every other control in the left panels (per-selection editors excluded).
const SESS_SKIP_ID=/^(theme|obj|edsRole$|edsColor$|edsLabel$|edsBright|edsContrast|edsSharp)/;
function sessCaptureSettings() {
  const t=themeCapture();
  document.querySelectorAll('.control-panel input[id], .control-panel select[id], .control-panel textarea[id]').forEach(el=>{
    if (SESS_SKIP_ID.test(el.id) || ['file','button','submit','radio','hidden'].includes(el.type) || el.closest('#edsSelCard')) return;
    if (t[el.id]===undefined) t[el.id]=el.type==='checkbox'?el.checked:el.value;
  });
  return t;
}
function sessApplySettings(t) {
  themeApply(t);
  Object.keys(t).forEach(id=>{
    if (THEME_IDS.includes(id) || id==='scaleMode' || SESS_SKIP_ID.test(id)) return;
    const el=document.getElementById(id), v=t[id]; if (!el || v==null || el.type==='file') return;
    if (el.type==='checkbox') { if (el.checked===!!v) return; el.checked=!!v; }
    else { if (el.tagName==='SELECT' && ![...el.options].some(o=>o.value===String(v))) return; if (el.value===String(v)) return; el.value=v; }
    el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
  });
}
async function saveSession() {
  if (state.busy) return;
  const items=state.items.filter(it=>it.imageData);
  if (!items.length && !eds.tiles.length) { showToast('Nothing to save yet.'); return; }
  state.busy=true;
  try {
    const out={app:'Micrograph Figure Kit', kind:'session', version:SESSION_VER, saved:new Date().toISOString(), tab:state.tab, selectedId:state.selectedId, settings:sessCaptureSettings(), items:[], compose:null, eds:null};
    const n=items.length+eds.tiles.length; let k=0;
    for (const it of items) {
      setProgress(k/n,'Saving '+(++k)+'/'+n);
      const o=sessPlain(it); o.status=it.status==='ok'?'ok':'waiting';
      o.fileMeta={name:it.file?.name||it.name, size:it.file?.size||0, lastModified:it.file?.lastModified||0};
      o.image=sessImgToURL(it.imageData); out.items.push(o); await sleep(0);
    }
    out.compose={order:[...compose.order], off:[...compose.off], free:sessPlain(compose.free), lastAutoMode:compose.lastAutoMode, objects:sessPlain(compose.doc.objects||[])};
    out.eds={sel:eds.sel, cal:sessPlain(eds.cal), calConf:eds.calConf??null, erase:sessPlain(eds.erase||[]), tiles:[]};
    for (const t of eds.tiles) { setProgress(k/n,'Saving '+(++k)+'/'+n); const o=sessPlain(t); o.image=sessImgToURL(t.src); out.eds.tiles.push(o); await sleep(0); }
    const d=new Date(), p=x=>String(x).padStart(2,'0');
    const name=`SEM_session_${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.json`;
    const r=await saveBlob(new Blob([JSON.stringify(out)],{type:'application/json'}),name,'application/json');
    if (r?.method!=='cancelled') showToast('Session saved.');
  } catch(e) { showToast('Save failed: '+(e.message||e),4200); }
  finally { state.busy=false; hideProgress(); renderUI(); }
}
async function openSession(file) {
  if (state.busy) return;
  let d; try { d=JSON.parse(await file.text()); } catch(_) { d=null; }
  if (d?.kind!=='session' || !Array.isArray(d.items)) { showToast('This file is not a session file.',3800); return; }
  const T=s=>window.semI18n?.t(s)??s;
  if ((state.items.length || eds.tiles.length) && !confirm(T('Opening a session replaces the current images, edits and settings. Continue?'))) return;
  state.busy=true; let opened=false;
  try {
    // Decode everything first; the current work is replaced only when the whole file has loaded.
    const tileSrc=Array.isArray(d.eds?.tiles)?d.eds.tiles:[], n=d.items.length+tileSrc.length, items=[], tiles=[]; let k=0;
    for (const o of d.items) {
      setProgress(k/n,'Opening '+(++k)+'/'+n);
      const {image, fileMeta, ...rest}=o, it=sessRevive(rest);
      // Values from the file are untrusted: keep ids and names as plain strings, and numbers as numbers.
      it.id=/^[\w-]{1,64}$/.test(String(it.id))?String(it.id):uid(); it.name=String(it.name||'image').slice(0,255);
      for (const key of ['barPxOverride','targetBarPx']) if (it[key]!=null && !Number.isFinite(Number(it[key]))) it[key]=null;
      it.file={name:String(fileMeta?.name||it.name).slice(0,255), size:Number(fileMeta?.size)||0, lastModified:Number(fileMeta?.lastModified)||0};
      it.imageData=await sessURLToImg(image);
      const fresh=analyzeImage(it.imageData); it.analysis=it.analysis?{...fresh, ...it.analysis}:fresh;
      it.objects=it.objects||[]; it.outputCanvas=null; it.outputBlob=null; it.renderMeta=null; it.error='';
      items.push(it); await sleep(0);
    }
    for (const o of tileSrc) { setProgress(k/n,'Opening '+(++k)+'/'+n); const {image, ...rest}=o, t=sessRevive(rest); t.src=await sessURLToImg(image); tiles.push(t); await sleep(0); }
    state.items=[]; state.selectedId=null;
    if (d.settings) sessApplySettings(d.settings);
    for (const it of items) {
      if (it.status==='ok' && renderable(it)) { try { renderInto(it); } catch(e) { it.status='error'; it.error=e.message; } } else it.status='waiting';
    }
    state.items=items;
    const c=d.compose||{};
    compose.order=c.order||[]; compose.off=new Set(c.off||[]); compose.free=c.free||{}; compose.lastAutoMode=c.lastAutoMode||'justify';
    compose.doc.objects=c.objects||[]; compose.doc.selObj=null; compose.sel=-1; compose.srcCache={};
    eds.tiles=tiles; eds.warnings=[];
    eds.sel=tiles.some(t=>t.id===d.eds?.sel)?d.eds.sel:(tiles[0]?.id||null);
    eds.cal=d.eds?.cal||null; eds.calConf=d.eds?.calConf??null; eds.erase=d.eds?.erase||[];
    state.selectedId=items.some(x=>x.id===d.selectedId)?d.selectedId:(items[0]?.id||null);
    opened=true;
    showToast(`Session opened: ${items.length} image(s)${tiles.length?', '+tiles.length+' EDS':''}.`);
  } catch(e) { showToast('Could not open the session: '+(e.message||e)+'. Your current work was kept.',5200); }
  finally {
    state.busy=false; hideProgress();
    if (opened) { const tab=['clean','compose','eds'].includes(d.tab)?d.tab:'clean'; document.querySelector(`.tab[data-tab="${tab}"]`)?.click(); }
    renderUI(); if (eds.tiles.length) renderEds();
  }
}
document.getElementById('sessSaveBtn')?.addEventListener('click',saveSession);
document.getElementById('sessOpenInput')?.addEventListener('change',e=>{ const f=e.target.files?.[0]; e.target.value=''; if (f) openSession(f); });
document.addEventListener('keydown',e=>{
  if (!(e.ctrlKey||e.metaKey) || e.altKey || e.shiftKey) return;
  const k=scKey(e);
  if (k==='s') { e.preventDefault(); saveSession(); }
  else if (k==='o') { e.preventDefault(); document.getElementById('sessOpenInput')?.click(); }
});

