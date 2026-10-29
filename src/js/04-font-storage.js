// =====================================================================
// Micrograph Figure Kit — 4. Font persistence
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    An imported font file is kept in IndexedDB so it survives reloads.
// =====================================================================
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('sem-scale-cleaner', 1); // legacy database name kept so fonts saved by earlier versions stay available
    req.onupgradeneeded = () => req.result.createObjectStore('assets');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(key, value) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('assets', 'readwrite');
    tx.objectStore('assets').put(value, key);
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  });
  db.close();
}
async function idbGet(key) {
  const db = await openDB();
  const val = await new Promise((resolve, reject) => {
    const tx = db.transaction('assets', 'readonly');
    const req = tx.objectStore('assets').get(key);
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
  });
  db.close(); return val;
}
async function idbDelete(key) {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('assets', 'readwrite');
    tx.objectStore('assets').delete(key);
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  });
  db.close();
}

// Register an imported font file as a FontFace.
async function installFontBuffer(buffer, name = 'Imported font') {
  const face = new FontFace('UploadedFont', buffer);
  await face.load();
  document.fonts.add(face);
  state.fontUploaded = true;
  state.uploadedFontName = name;
  els.uploadedFontOption.disabled = false;
  els.uploadedFontOption.textContent = `Imported: ${name.replace(/\.[^.]+$/, '')}`;
  return face;
}
// Further imported fonts: each one has its own FontFace family and its own entry in the font list.
// The first imported font keeps the original slot ('cambria-font', value '__uploaded') so older settings still work.
async function installExtraFont(buffer, name, id) {
  const family='MFK-Imported-'+id, face=new FontFace(family, buffer);
  await face.load(); document.fonts.add(face);
  const f={id, name, value:'__up:'+id, family};
  state.extraFonts=state.extraFonts.filter(x=>x.id!==id).concat(f);
  let opt=els.fontFamily.querySelector(`option[value="${f.value}"]`);
  if (!opt) { opt=document.createElement('option'); opt.value=f.value; opt.setAttribute('data-noi18n',''); els.fontFamily.appendChild(opt); }
  opt.textContent='Imported: '+name.replace(/\.[^.]+$/, '');
  return f;
}
function importedFontName(value) {
  if (value==='__uploaded') return state.fontUploaded ? state.uploadedFontName : '';
  return state.extraFonts.find(f=>f.value===value)?.name || '';
}
async function saveExtraFontList() { await idbSet('font-list', state.extraFonts.map(f=>f.id)); }
async function removeExtraFont(id) {
  await idbDelete('font:'+id);
  const f=state.extraFonts.find(x=>x.id===id); state.extraFonts=state.extraFonts.filter(x=>x.id!==id);
  if (f) els.fontFamily.querySelector(`option[value="${f.value}"]`)?.remove();
  await saveExtraFontList();
  return f;
}
function updateFontStatus() {
  fillObjFont();
  const fam = els.fontFamily.value;
  const imp = importedFontName(fam);
  if (imp) { els.fontStatus.textContent = `${imp.replace(/\.[^.]+$/, '')} / imported`; return; }
  const ok = document.fonts?.check?.(`16px "${fam}"`);
  els.fontStatus.textContent = `${fam} / ${ok ? 'system' : 'not confirmed'}`;
}
// Restore the imported font saved in IndexedDB.
async function loadStoredFont() {
  try {
    const record = await idbGet('cambria-font');
    if (record?.blob) {
      await installFontBuffer(await record.blob.arrayBuffer(), record.name || 'Imported font');
      els.fontFamily.value = '__uploaded';
    }
  } catch (e) { console.warn('Stored font:', e); }
  try {
    const ids = (await idbGet('font-list')) || [];
    for (const id of ids) { const r = await idbGet('font:'+id); if (r?.blob) { try { await installExtraFont(await r.blob.arrayBuffer(), r.name || 'Imported font', id); } catch (e) { console.warn('Stored font:', e); } } }
  } catch (e) { console.warn('Stored fonts:', e); }
  updateFontStatus();
}

