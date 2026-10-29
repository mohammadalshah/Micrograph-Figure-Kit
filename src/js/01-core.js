// =====================================================================
// Micrograph Figure Kit — 1. Core helpers and DOM references
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
// =====================================================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
// localStorage can throw (file:// in some browsers, private mode, full quota); this never does.
function lsSet(key, value) { try { localStorage.setItem(key, value); } catch(_) {} }

const els = {
  dropZone: $('#dropZone'), fileInput: $('#fileInput'), clearBtn: $('#clearBtn'),
  processBtn: $('#processBtn'), processNewBtn: $('#processNewBtn'), processOneBtn: $('#processOneBtn'), saveAllBtn: $('#saveAllBtn'), selectOutputFolderBtn: $('#selectOutputFolderBtn'), outputFolderStatus: $('#outputFolderStatus'), zipBtn: $('#zipBtn'), auditBtn: $('#auditBtn'),
  manualScale: $('#manualScale'), manualScaleUnitToggle: $('#manualScaleUnitToggle'), applyManualBtn: $('#applyManualBtn'),
  unitLang: $('#unitLang'), decimalSep: $('#decimalSep'), scaleLayout: $('#scaleLayout'), scalePosition: $('#scalePosition'), annoColor: $('#annoColor'), scaleExample: $('#scaleExample'), scaleHl: $('#scaleHl'), scaleHlColor: $('#scaleHlColor'), panelHl: $('#panelHl'), panelHlColor: $('#panelHlColor'), scaleOl: $('#scaleOl'), scaleOlColor: $('#scaleOlColor'), panelOl: $('#panelOl'), panelOlColor: $('#panelOlColor'),
  fontInput: $('#fontInput'), forgetFontBtn: $('#forgetFontBtn'), fontStatus: $('#fontStatus'), fontFamily: $('#fontFamily'), uploadedFontOption: $('#uploadedFontOption'),
  fontWeight: $('#fontWeight'), fontSizeMode: $('#fontSizeMode'), fixedFontWrap: $('#fixedFontWrap'), fixedFontSize: $('#fixedFontSize'), printWidth: $('#printWidth'), ptHint: $('#ptHint'), autoFontWrap: $('#autoFontWrap'), autoFontPct: $('#autoFontPct'),
  panelEnabled: $('#panelEnabled'), panelFormat: $('#panelFormat'), panelWeight: $('#panelWeight'), panelSize: $('#panelSize'), panelMargin: $('#panelMargin'),
  rightMargin: $('#rightMargin'), barThickness: $('#barThickness'), barTextGap: $('#barTextGap'),
  showDetection: $('#showDetection'),
  emptyState: $('#emptyState'), workspace: $('#workspace'), fileStrip: $('#fileStrip'), fileTableBody: $('#fileTableBody'),
  sourceCanvas: $('#sourceCanvas'), resultCanvas: $('#resultCanvas'), cropToolBtn: $('#cropToolBtn'),
  sourceDims: $('#sourceDims'), outputDims: $('#outputDims'), summaryText: $('#summaryText'),
  metricFooter: $('#metricFooter'), metricBar: $('#metricBar'), metricOcr: $('#metricOcr'), metricSourceScale: $('#metricSourceScale'), metricOutputScale: $('#metricOutputScale'), metricOutputBar: $('#metricOutputBar'),
  srcScaleInput: $('#srcScaleInput'), srcScaleUnitToggle: $('#srcScaleUnitToggle'), origBarInput: $('#origBarInput'), applySourceBtn: $('#applySourceBtn'), ocrSelectedBtn: $('#ocrSelectedBtn'),
  selectedScaleInput: $('#selectedScaleInput'), selectedScaleUnitToggle: $('#selectedScaleUnitToggle'), selectedBarLengthInput: $('#selectedBarLengthInput'), selectedBarThicknessInput: $('#selectedBarThicknessInput'),
  syncScaleToLengthBtn: $('#syncScaleToLengthBtn'), syncLengthToScaleBtn: $('#syncLengthToScaleBtn'), resetScalePosBtn: $('#resetScalePosBtn'),
  reprocessSelectedBtn: $('#reprocessSelectedBtn'), downloadSelectedBtn: $('#downloadSelectedBtn'),
  cropX: $('#cropX'), cropY: $('#cropY'), cropW: $('#cropW'), cropH: $('#cropH'), cropAspect: $('#cropAspect'), cropAutoBtn: $('#cropAutoBtn'), cropAllBtn: $('#cropAllBtn'),
  panelLabelInput: $('#panelLabelInput'),
  selectedWarning: $('#selectedWarning'), globalProgress: $('#globalProgress'), progressBar: $('#progressBar'), progressText: $('#progressText'), toast: $('#toast'),
};

Object.assign(els, {
  largeViewBtn: $('#largeViewBtn'), largeViewBtn2: $('#largeViewBtn2'), cropLoupe: $('#cropLoupe'), addObjRow: $('#addObjRow'), objList: $('#objList'), objProps: $('#objProps'), objTypeLabel: $('#objTypeLabel'),
  objDup: $('#objDup'), objCopyAll: $('#objCopyAll'), objDel: $('#objDel'), rtToolbar: $('#rtToolbar'), objText: $('#objText'), objFont: $('#objFont'), objSize: $('#objSize'),
  objColor: $('#objColor'), objStrokeW: $('#objStrokeW'), objW: $('#objW'), objH: $('#objH'), objLen: $('#objLen'), objHead: $('#objHead'), objRot: $('#objRot'), objFillColor: $('#objFillColor'),
  objFillOpacity: $('#objFillOpacity'), objBgColor: $('#objBgColor'), objOutlineColor: $('#objOutlineColor'), objBold: $('#objBold'), objItalic: $('#objItalic'),
  objUnderline: $('#objUnderline'), objStrike: $('#objStrike'), objBg: $('#objBg'), objDashed: $('#objDashed'), objFill: $('#objFill'), objLock: $('#objLock'),
  objDouble: $('#objDouble'), objOutline: $('#objOutline'),
});
const state = {
  items: [],
  selectedId: null,
  busy: false,
  fontUploaded: false,
  uploadedFontName: '',
  extraFonts: [], // further imported fonts: {id, name, value:'__up:<id>', family}
  outputDirHandle: null,
  cropTool: false,
  tab: 'clean',
  textListKey: null,
};

const ACCEPTED = new Set(['bmp','png','jpg','jpeg','webp','tif','tiff']);
const UNITS = {
  'Å':{f:1e-4,fam:'len'}, 'nm':{f:1e-3,fam:'len'}, 'µm':{f:1,fam:'len'}, 'mm':{f:1e3,fam:'len'}, 'm':{f:1e6,fam:'len'},
  'nm⁻¹':{f:1,fam:'rec'}, 'µm⁻¹':{f:1e-3,fam:'rec'}, 'Å⁻¹':{f:10,fam:'rec'},
};
const UNIT_LABELS = {
  en: {'Å':'Å','nm':'nm','µm':'µm','mm':'mm','m':'m','nm⁻¹':'nm⁻¹','µm⁻¹':'µm⁻¹','Å⁻¹':'Å⁻¹'},
  ru: {'Å':'Å','nm':'нм','µm':'мкм','mm':'мм','m':'м','nm⁻¹':'нм⁻¹','µm⁻¹':'мкм⁻¹','Å⁻¹':'Å⁻¹'},
};
const SERIF_FONTS = new Set(['Cambria','Times New Roman','Georgia','Palatino Linotype']);
const OCR_WHITELIST = '0123456789.,µumnpyjlI/ ';

// Greek letters for the text toolbars ("Ω…" row): lower case with variant forms, then upper case.
const GREEK_LOWER='αβγδεζηθικλμνξοπρστυφχψωϑϕςϵ', GREEK_UPPER='ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
// Fill every empty .rt-greek row with insert buttons. Runs before the toolbar handlers are attached (modules 14 and 17).
function rtGreekFill() {
  const mk=c=>{ const b=document.createElement('button'); b.type='button'; b.className='rt-btn'; b.dataset.ins=c; b.title='Insert '+c; b.textContent=c; return b; };
  document.querySelectorAll('.rt-greek').forEach(p=>{ if (p.childElementCount) return;
    const br=document.createElement('span'); br.className='rt-greek-break';
    p.append(...[...GREEK_LOWER].map(mk), br, ...[...GREEK_UPPER].map(mk)); });
}
rtGreekFill();
// "Ω…" opens or closes the row of all Greek letters (text tools on every tab).
function rtGreekToggle(b) { const p=b.parentElement.querySelector('.rt-greek'); if (!p) return; p.hidden=!p.hidden; b.setAttribute('aria-expanded',String(!p.hidden)); }

// Short unique id for items and objects.
function uid() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }
// Lower-case file extension without the dot.
function extOf(name) { return (name.split('.').pop() || '').toLowerCase(); }
// Clamp v into [lo, hi].
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
// Promise that resolves after ms.
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
// Read a numeric input, falling back to def.
function num(el, def) { const v = Number(el.value); return Number.isFinite(v) && el.value !== '' ? v : def; }
// Set an input value unless the user is typing in it.
function setVal(el, v) { if (document.activeElement !== el) el.value = v; }

// Show a short status message at the bottom.
function showToast(msg, ms = 2600) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.toast.classList.remove('show'), ms);
}

// Update the global progress bar (0–1).
function setProgress(frac, label = '') {
  frac = clamp(frac, 0, 1);
  els.globalProgress.hidden = false;
  els.progressBar.style.width = `${(frac*100).toFixed(0)}%`;
  els.progressText.textContent = label || `${(frac*100).toFixed(0)}%`;
}
function hideProgress() { els.globalProgress.hidden = true; els.progressBar.style.width = '0%'; }

// "auto" (OCR) or "manual" source scale.
function getScaleMode() { return $('input[name="scaleMode"]:checked').value; }

