// =====================================================================
// Micrograph Figure Kit — 12. Re-rendering helpers
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Debounced redraws after settings or per-image edits.
// =====================================================================
function rerenderAllNow() {
  for (const it of state.items) {
    if (it.status==='working' || !renderable(it)) continue;
    try { if (it.noScale) { renderInto(it); continue; } if (!it.targetScaleText) it.targetScaleText=it.sourceScaleText; if (!it.targetBarPx) it.targetBarPx=computeBarLengthPx(originalBarPx(it),it.sourceScaleText,it.targetScaleText); renderInto(it); }
    catch(e) { it.status='error'; it.error=e.message; it.outputCanvas=null; it.outputBlob=null; }
  }
  renderUI();
}
let rerenderAllTimer=null;
function scheduleRerenderAll(delay=120) { clearTimeout(rerenderAllTimer); rerenderAllTimer=setTimeout(rerenderAllNow,delay); }

let selTimer=null;
function rerenderSelectedSoon(delay=100) {
  clearTimeout(selTimer);
  selTimer=setTimeout(()=>{
    const it=selectedItem(); if (!it) return;
    if (renderable(it)) { try { renderInto(it); } catch(e) { it.error=e.message; } }
    renderUI();
  }, delay);
}

function syncLengthFromScaleForSelected(showMessage=true) {
  const it = selectedItem();
  if (!it?.imageData) return;
  try {
    if (!renderable(it)) throw new Error('Set the calibration first (process the file or enter the source scale).');
    const scaleText = numericScaleText(els.selectedScaleInput, els.selectedScaleUnitToggle);
    const barPx = computeBarLengthPx(originalBarPx(it), it.sourceScaleText, scaleText);
    els.selectedBarLengthInput.value = String(barPx);
    it.targetScaleText = scaleText;
    it.targetBarPx = barPx;
    if (showMessage) showToast('Bar length updated from the scale value.');
  } catch (e) { if (showMessage) showToast(e.message, 3800); }
}

function syncScaleFromLengthForSelected(showMessage=true) {
  const it = selectedItem();
  if (!it?.imageData) return;
  try {
    if (!renderable(it)) throw new Error('Set the calibration first (process the file or enter the source scale).');
    const barPx = Number(els.selectedBarLengthInput.value);
    if (!(barPx > 0)) throw new Error('Bar length must be greater than zero.');
    const preferredUnit = activeUnit(els.selectedScaleUnitToggle);
    const scaleText = computeScaleTextFromBarLength(barPx, originalBarPx(it), it.sourceScaleText, preferredUnit);
    const p = parseScaleText(scaleText);
    els.selectedScaleInput.value = fmtNum(p.value); setActiveUnit(els.selectedScaleUnitToggle, p.unit);
    it.targetScaleText = scaleText;
    it.targetBarPx = Math.round(barPx);
    if (showMessage) showToast('Scale text updated from the bar length.');
  } catch (e) { if (showMessage) showToast(e.message, 3800); }
}

let liveRedrawTimer = null;
function scheduleSelectedLiveRedraw(delay=120) {
  clearTimeout(liveRedrawTimer);
  liveRedrawTimer = setTimeout(()=>{
    const it = selectedItem();
    if (!renderable(it)) return;
    try {
      it.targetScaleText = numericScaleText(els.selectedScaleInput, els.selectedScaleUnitToggle);
      const barPx = Number(els.selectedBarLengthInput.value);
      if (barPx > 0) it.targetBarPx = Math.round(barPx);
      const thicknessPx = Number(els.selectedBarThicknessInput.value);
      it.targetBarThicknessPx = thicknessPx > 0 ? Math.round(thicknessPx) : null;
      renderInto(it);
      renderUI();
    } catch (_) { /* transient invalid input while typing */ }
  }, delay);
}

