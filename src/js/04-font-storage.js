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
function updateFontStatus() {
  fillObjFont();
  const fam = els.fontFamily.value;
  if (fam === '__uploaded') { els.fontStatus.textContent = `${state.uploadedFontName.replace(/\.[^.]+$/, '')} / imported`; return; }
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
  updateFontStatus();
}

