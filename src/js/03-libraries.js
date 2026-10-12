// =====================================================================
// Micrograph Figure Kit — 3. Libraries
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    tesseract.js (OCR), JSZip (ZIP / .docx) and UTIF (TIFF) are embedded in
//    this page, so nothing is downloaded and the page works offline.
// =====================================================================
function needLib(name) {
  if (!window[name]) throw new Error(`The ${name} library is missing from this page. Use the complete (offline) HTML file.`);
  return window[name];
}
async function ensureTesseract() { return needLib('Tesseract'); }
async function ensureJSZip() { return needLib('JSZip'); }
async function ensureUTIF() { return needLib('UTIF'); }

