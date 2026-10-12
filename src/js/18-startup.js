// =====================================================================
// Micrograph Figure Kit — 18. Start-up
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
// =====================================================================
(async function init(){
  relabelUnitButtons();
  updateScaleExample();
  await loadStoredFont();
  renderUI();
})();
