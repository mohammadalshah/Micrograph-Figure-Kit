// =====================================================================
// Micrograph Figure Kit — 2. Units and scale text
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Parsing, normalising, converting and formatting values like "0.5 µm".
// =====================================================================
function activeUnit(sel) { return (sel && UNITS[sel.value]) ? sel.value : 'µm'; }
function setActiveUnit(sel, unit) { if (!sel || !UNITS[unit]) return; sel.value = unit; sel.dataset.prev = unit; }
// Relabel unit options for the chosen language (µm / мкм).
function relabelUnitButtons() {
  const labels = UNIT_LABELS[els.unitLang.value] || UNIT_LABELS.en;
  $$('.unit-select').forEach(sel => {
    const cur = UNITS[sel.value] ? sel.value : 'µm';
    Array.from(sel.options).forEach(o => { o.textContent = labels[o.value] || o.value; });
    sel.value = cur; sel.dataset.prev = cur;
  });
}
// Format a number without trailing zeros.
function fmtNum(v) {
  v = Number(v); if (!isFinite(v) || v === 0) return '0';
  const s = Number(v.toPrecision(10));
  return trimZeros(s.toFixed(clamp(9 - Math.floor(Math.log10(Math.abs(s))), 0, 20)));
}
function trimZeros(numStr) { const s = String(numStr); return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s; }
// Build "value unit" text from an input + unit select.
function numericScaleText(inputEl, sel) {
  const value = Number(String(inputEl.value).replace(',', '.'));
  if (!(value > 0)) throw new Error('Scale value must be greater than zero.');
  return `${fmtNum(value)} ${activeUnit(sel)}`;
}
// Convert the input value when its unit select changes.
function convertUnitValue(inputEl, sel) {
  const oldU = sel.dataset.prev || 'µm', newU = activeUnit(sel), v = Number(String(inputEl.value).replace(',', '.'));
  if (v > 0 && UNITS[oldU] && UNITS[oldU].fam === UNITS[newU].fam) inputEl.value = fmtNum(v * UNITS[oldU].f / UNITS[newU].f);
  sel.dataset.prev = newU;
}
// Map any unit spelling (um, мкм, nm-1…) to a canonical key.
function unitKey(u) {
  let s = String(u || '').replace(/μ/g, 'µ').replace(/\u212B/g, 'Å').replace(/\s+/g, '');
  let rec = false;
  if (/^1\//.test(s)) { rec = true; s = s.slice(2); }
  if (/(\^?-1|⁻¹)$/.test(s)) { rec = true; s = s.replace(/(\^?-1|⁻¹)$/, ''); }
  const low = s.toLowerCase();
  let base = null;
  if (low === 'å' || low === 'angstrom' || low === 'ang') base = 'Å';
  else if (low === 'nm' || low === 'нм') base = 'nm';
  else if (low === 'µm' || low === 'um' || low === 'мкм') base = 'µm';
  else if (low === 'mm' || low === 'мм') base = 'mm';
  else if (low === 'm' || low === 'м') base = 'm';
  if (!base) return null;
  const k = rec ? base + '⁻¹' : base;
  return UNITS[k] ? k : null;
}
// Normalise free text such as "500nm" to "500 nm".
function normalizeManualScale(raw) {
  const s = String(raw || '').trim().replace(',', '.');
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
  const unit = m && unitKey(m[2]);
  if (!m || !unit || !(Number(m[1]) > 0)) throw new Error('Scale text must look like: 1 µm, 500 nm, 2 mm, 1 m, 5 Å or 2 nm⁻¹.');
  return `${fmtNum(Number(m[1]))} ${unit}`;
}
// Parse scale text into {value, unit, factor, fam}.
function parseScaleText(scaleText) {
  const n = normalizeManualScale(scaleText), i = n.indexOf(' ');
  const value = Number(n.slice(0, i)), unit = n.slice(i + 1);
  return { text: n, value, unit, fam: UNITS[unit].fam, um: value * UNITS[unit].f };
}
function formatScale(value, unit) { return `${fmtNum(value)} ${unit}`; }
// Scale text as shown on the image (language and decimal separator applied).
function displayScale(scaleText, cfg) {
  const p = parseScaleText(scaleText);
  let n = fmtNum(p.value);
  const comma = cfg.decimal === 'comma' || (cfg.decimal === 'auto' && cfg.unitLang === 'ru');
  if (comma) n = n.replace('.', ',');
  return `${n} ${(UNIT_LABELS[cfg.unitLang] || UNIT_LABELS.en)[p.unit]}`;
}
// Output bar length in px from the original bar and the two scale values.
function computeBarLengthPx(originalBarPx, sourceScaleText, targetScaleText) {
  const source = parseScaleText(sourceScaleText), target = parseScaleText(targetScaleText);
  if (source.fam !== target.fam) throw new Error('Output unit must be the same kind as the source unit (length or reciprocal).');
  if (!(originalBarPx > 0)) throw new Error('Original bar length is unknown.');
  return Math.max(1, Math.round(originalBarPx * target.um / source.um));
}
// Inverse of computeBarLengthPx.
function computeScaleTextFromBarLength(barPx, originalBarPx, sourceScaleText, preferredUnit) {
  const source = parseScaleText(sourceScaleText);
  if (!(originalBarPx > 0)) throw new Error('Original bar length must be greater than zero.');
  if (!(barPx > 0)) throw new Error('Bar length must be greater than zero.');
  const t = source.um * (barPx / originalBarPx);
  const unit = (UNITS[preferredUnit] && UNITS[preferredUnit].fam === source.fam) ? preferredUnit : source.unit;
  return formatScale(t / UNITS[unit].f, unit);
}

// Length of the original bar: manual override or detected.
function originalBarPx(item) { return item?.barPxOverride || item?.analysis?.bar?.w || 0; }
// True when an item has enough calibration to be drawn.
function renderable(item) { return !!(item?.imageData && (item.noScale || (item.sourceScaleText && originalBarPx(item) > 0))); }

// Snapshot of all global options from the left panel.
function settings() {
  let manualScale = null;
  try { manualScale = numericScaleText(els.manualScale, els.manualScaleUnitToggle); } catch (_) {}
  const fw = els.fontWeight.value;
  return {
    scaleMode: getScaleMode(),
    manualScale,
    unitLang: els.unitLang.value,
    decimal: els.decimalSep.value,
    barBelow: els.scaleLayout.value === 'textAbove',
    scalePosition: els.scalePosition.value,
    color: els.annoColor.value,
    fontFamily: els.fontFamily.value,
    fontWeight: parseInt(fw, 10),
    italic: fw.endsWith('i'),
    fontSizeMode: els.fontSizeMode.value,
    fixedFontSize: num(els.fixedFontSize, 12),
    printWidthCm: Math.max(1, num(els.printWidth, 8.5)),
    autoFontPct: num(els.autoFontPct, 4.5) / 100,
    panelEnabled: els.panelEnabled.checked,
    panelFormat: els.panelFormat.value,
    panelWeight: parseInt(els.panelWeight.value, 10),
    panelSize: num(els.panelSize, 15),
    panelMargin: num(els.panelMargin, 1) / 100,
    rightMargin: num(els.rightMargin, 1) / 100,
    barThickness: num(els.barThickness, 0.18),
    gap: num(els.barTextGap, 0.12),
    scaleHl: els.scaleHl.checked,
    scaleHlColor: els.scaleHlColor.value,
    panelHl: els.panelHl.checked,
    panelHlColor: els.panelHlColor.value,
  };
}

