// =====================================================================
// Micrograph Figure Kit — 20. Session save / open (.json project file)
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Images are embedded as data URLs; values read from a file are treated as untrusted.
// =====================================================================
// Version 2: inset links (`src`) are kept; image data is dropped by type, not by name. Version 1 files lost those links.
const SESSION_VER=2, SESSION_SKIP=new Set(['file','imageData','outputCanvas','outputBlob','renderMeta','status','error']);
// v1 → v2: an inset without its area id is linked again to the inset area made with it (the area just before it in the list).
function sessRelinkInsets(objs) {
  if (!Array.isArray(objs)) return 0;
  const used=new Set(objs.filter(o=>o?.type==='inset' && o.src).map(o=>o.src)); let n=0;
  objs.forEach((o,i)=>{
    if (o?.type!=='inset' || (o.src && objs.some(q=>q.id===o.src))) return;
    const free=q=>q?.insetSrc && q.id && !used.has(q.id);
    let a=null; for (let j=i-1;j>=0 && !a;j--) if (free(objs[j])) a=objs[j];
    a=a||objs.find(free); if (!a) return;
    o.src=a.id; used.add(a.id); n++;
  });
  return n;
}
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
// Values read from a session file are untrusted: keep only well-formed numbers, boxes and known names.
const sessFin=(v,lo,hi,d)=>{ v=Number(v); return Number.isFinite(v)?clamp(v,lo,hi):d; };
function sessBox(b,W,H) {
  if (!b || typeof b!=='object') return null;
  const x=sessFin(b.x,0,W-1,NaN), y=sessFin(b.y,0,H-1,NaN); if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const w=sessFin(b.w,1,W-x,NaN), h=sessFin(b.h,1,H-y,NaN); if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
  return {x:Math.round(x), y:Math.round(y), w:Math.round(w), h:Math.round(h)};
}
function sessBoxes(a,W,H) { return Array.isArray(a) ? a.slice(0,500).map(b=>sessBox(b,W,H)).filter(Boolean) : null; }
function sessPosMap(m,keys) {
  const o={}; if (!m || typeof m!=='object') return o;
  for (const k of Object.keys(m)) { if (keys && !keys.includes(k)) continue; const p=m[k];
    if (p && typeof p==='object' && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))) o[k]={x:clamp(Number(p.x),-2,2), y:clamp(Number(p.y),-2,2)}; }
  return o;
}
function sessCleanTile(t) {
  const W=t.src.width, H=t.src.height, str=(v,n)=>typeof v==='string'?v.slice(0,n):'';
  t.id=/^[\w-]{1,64}$/.test(String(t.id))?String(t.id):uid();
  t.name=str(t.name,255)||'map';
  t.role=Object.prototype.hasOwnProperty.call(ROLE_NAMES,t.role)?t.role:'map';
  t.color=/^#[0-9a-f]{6}$/i.test(String(t.color))?String(t.color):'#ffffff';
  t.custom=typeof t.custom==='string'?t.custom.slice(0,500):null;
  t.el=t.el && typeof t.el==='object' && typeof t.el.el==='string' && ELEMENTS.has(t.el.el) ? {el:t.el.el, line:str(t.el.line,12)} : null;
  t.elConf=t.elConf==null?null:sessFin(t.elConf,0,100,null);
  t.bright=sessFin(t.bright,-100,100,0); t.contrast=sessFin(t.contrast,-100,100,0); t.sharp=sessFin(t.sharp,-100,100,0);
  t.include=t.include!==false;
  t.frame=t.frame==null?null:sessBox(t.frame,W,H);
  t.boxes=t.boxes==null?null:sessBoxes(t.boxes,W,H);
  t.autoBoxes=sessBoxes(t.autoBoxes,W,H)||[];
  const pos=sessPosMap(t.pos,['label','q','scale']); for (const k in pos) pos[k]={x:clamp(pos[k].x,0,1), y:clamp(pos[k].y,0,1)};
  if (Object.keys(pos).length) t.pos=pos; else delete t.pos;
  return t;
}
function sessCleanCal(c) { if (!c || typeof c!=='object') return null; const u=Number(c.umPerPx), r=Number(c.refW); return u>0 && u<1e6 && r>=1 && r<1e6 ? {umPerPx:u, refW:r} : null; }
function sessCleanErase(a) { return Array.isArray(a) ? a.slice(0,500).map(b=>{ if (!b || typeof b!=='object') return null; const x=sessFin(b.x,0,1,NaN), y=sessFin(b.y,0,1,NaN), w=sessFin(b.w,0,1,NaN), h=sessFin(b.h,0,1,NaN);
  return [x,y,w,h].every(Number.isFinite)?{x,y,w:Math.min(w,1-x),h:Math.min(h,1-y)}:null; }).filter(Boolean) : []; }
// Group settings: only controls of the EDS panel, valid values only (same keys as histPanelSettings produces).
function sessCleanEdsSettings(st) {
  if (!st || typeof st!=='object') return null;
  const allowed=histPanelSettings(document.getElementById('edsView')), out={};
  for (const k of Object.keys(st)) {
    if (!Object.prototype.hasOwnProperty.call(allowed,k)) continue;
    const v=st[k], el=k.startsWith('radio:')?null:document.getElementById(k);
    if (k.startsWith('radio:')) { if (typeof v==='string' && [...document.getElementsByName(k.slice(6))].some(r=>r.value===v)) out[k]=v; continue; }
    if (!el) continue;
    if (el.type==='checkbox') { if (typeof v==='boolean') out[k]=v; continue; }
    if (typeof v!=='string' && typeof v!=='number') continue;
    const sv=String(v).slice(0,5000);
    if (el.tagName==='SELECT' && ![...el.options].some(o=>o.value===sv)) continue;
    out[k]=sv;
  }
  return out;
}
async function saveSession() {
  if (state.busy) return;
  const items=state.items.filter(it=>it.imageData);
  if (!items.length && !edsHasAny()) { showToast('Nothing to save yet.'); return; }
  state.busy=true;
  try {
    const out={app:'Micrograph Figure Kit', kind:'session', version:SESSION_VER, saved:new Date().toISOString(), tab:state.tab, selectedId:state.selectedId, settings:sessCaptureSettings(), items:[], compose:null, eds:null};
    edsGroupStash();
    const n=items.length+eds.groups.reduce((a,g)=>a+(g.tiles||[]).length,0); let k=0;
    for (const it of items) {
      setProgress(k/n,'Saving '+(++k)+'/'+n);
      const o=sessPlain(it); o.status=it.status==='ok'?'ok':'waiting';
      o.fileMeta={name:it.file?.name||it.name, size:it.file?.size||0, lastModified:it.file?.lastModified||0};
      o.image=sessImgToURL(it.imageData); out.items.push(o); await sleep(0);
    }
    out.compose={order:[...compose.order], off:[...compose.off], free:sessPlain(compose.free), lastAutoMode:compose.lastAutoMode, objects:sessPlain(compose.doc.objects||[]), lposIn:sessPlain(compose.lposIn), lposOut:sessPlain(compose.lposOut), table:compose.table?sessPlain(compose.table):null};
    out.eds={active:eds.batch, groups:[]};
    for (const g of eds.groups) {
      const og={id:g.id, name:g.name||'', sel:g.sel??null, cal:sessPlain(g.cal||null), calConf:g.calConf??null, erase:sessPlain(g.erase||[]), quantSrc:g.quantSrc||'', settings:sessPlain(g.settings||null), tiles:[]};
      for (const t of g.tiles||[]) { setProgress(k/n,'Saving '+(++k)+'/'+n); const o=sessPlain(t); o.image=sessImgToURL(t.src); og.tiles.push(o); await sleep(0); }
      out.eds.groups.push(og);
    }
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
  if ((state.items.length || edsHasAny()) && !confirm(T('Opening a session replaces the current images, edits and settings. Continue?'))) return;
  state.busy=true; let opened=false;
  try {
    // Decode everything first; the current work is replaced only when the whole file has loaded.
    // Sessions from before groups hold one list of EDS tiles: read it as one group.
    const gSrc=Array.isArray(d.eds?.groups)?d.eds.groups:[{id:d.eds?.batch, name:'', sel:d.eds?.sel, cal:d.eds?.cal, calConf:d.eds?.calConf, erase:d.eds?.erase, settings:null, tiles:Array.isArray(d.eds?.tiles)?d.eds.tiles:[]}];
    const n=d.items.length+gSrc.reduce((a,g)=>a+(Array.isArray(g?.tiles)?g.tiles.length:0),0), items=[], groups=[]; let k=0;
    for (const o of d.items) {
      setProgress(k/n,'Opening '+(++k)+'/'+n);
      const {image, fileMeta, ...rest}=o, it=sessRevive(rest);
      // Values from the file are untrusted: keep ids and names as plain strings, and numbers as numbers.
      it.id=/^[\w-]{1,64}$/.test(String(it.id))?String(it.id):uid(); it.name=String(it.name||'image').slice(0,255);
      for (const key of ['barPxOverride','targetBarPx']) if (it[key]!=null && !Number.isFinite(Number(it[key]))) it[key]=null;
      it.file={name:String(fileMeta?.name||it.name).slice(0,255), size:Number(fileMeta?.size)||0, lastModified:Number(fileMeta?.lastModified)||0};
      it.imageData=await sessURLToImg(image);
      const fresh=analyzeImage(it.imageData); it.analysis=it.analysis?{...fresh, ...it.analysis}:fresh;
      it.objects=it.objects||[]; if ((Number(d.version)||1)<2) sessRelinkInsets(it.objects); it.outputCanvas=null; it.outputBlob=null; it.renderMeta=null; it.error='';
      items.push(it); await sleep(0);
    }
    for (const og of gSrc) {
      if (!og || typeof og!=='object') continue;
      const id=/^[\w-]{1,64}$/.test(String(og.id))?String(og.id):uid(), tiles=[];
      for (const o of Array.isArray(og.tiles)?og.tiles:[]) { setProgress(k/n,'Opening '+(++k)+'/'+n); const {image, ...rest}=o, t=sessRevive(rest); if (!t || typeof t!=='object') continue; t.src=await sessURLToImg(image); tiles.push(sessCleanTile(t)); await sleep(0); }
      const st=og.settings && typeof og.settings==='object' ? sessCleanEdsSettings(sessRevive(og.settings)) : null;
      groups.push({id, name:String(og.name||'').slice(0,255), tiles, sel:typeof og.sel==='string'?og.sel:null, cal:sessCleanCal(og.cal), calConf:og.calConf==null?null:sessFin(og.calConf,0,100,null), erase:sessCleanErase(og.erase), warnings:[], quantSrc:String(og.quantSrc||'').slice(0,80), settings:st});
    }
    if (!groups.length) groups.push({id:uid(), name:'', tiles:[]});
    state.items=[]; state.selectedId=null;
    if (d.settings) sessApplySettings(d.settings);
    for (const it of items) {
      if (it.status==='ok' && renderable(it)) { try { renderInto(it); } catch(e) { it.status='error'; it.error=e.message; } } else it.status='waiting';
    }
    state.items=items;
    const c=d.compose||{};
    compose.order=c.order||[]; compose.off=new Set(c.off||[]); compose.free=c.free||{}; compose.lastAutoMode=c.lastAutoMode||'justify'; compose.lposIn=sessPosMap(c.lposIn); for (const k in compose.lposIn) compose.lposIn[k]={x:clamp(compose.lposIn[k].x,0,1), y:clamp(compose.lposIn[k].y,0,1)}; compose.lposOut=sessPosMap(c.lposOut);
    compose.table=tblSanitize(c.table); window.tblSyncUI?.();
    compose.doc.objects=c.objects||[]; if ((Number(d.version)||1)<2) sessRelinkInsets(compose.doc.objects); compose.doc.selObj=null; compose.sel=-1; compose.srcCache={};
    eds.groups=groups; edsGroupLoad(groups.find(g=>g.id===d.eds?.active)||groups[0]); edsHistReset();
    state.selectedId=items.some(x=>x.id===d.selectedId)?d.selectedId:(items[0]?.id||null);
    opened=true;
    const nt=groups.reduce((a,g)=>a+g.tiles.length,0); showToast(`Session opened: ${items.length} image(s)${nt?', '+nt+' EDS':''}.`);
  } catch(e) { showToast('Could not open the session: '+(e.message||e)+'. Your current work was kept.',5200); }
  finally {
    state.busy=false; hideProgress();
    if (opened) { const tab=['clean','compose','eds'].includes(d.tab)?d.tab:'clean'; document.querySelector(`.tab[data-tab="${tab}"]`)?.click(); }
    renderUI(); if (edsHasAny()) renderEds();
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

