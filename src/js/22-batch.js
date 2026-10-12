// =====================================================================
// Micrograph Figure Kit — 22. Batch apply
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Crop and picture adjustments copied from the selected image to others.
// =====================================================================
function batchTargets(src, mode) {
  const W=src.imageData.width, H=src.imageData.height, ar=W/H;
  return state.items.filter(o=>o!==src && o.imageData && (mode==='all' || (mode==='size' ? (o.imageData.width===W && o.imageData.height===H) : Math.abs(o.imageData.width/o.imageData.height-ar)/ar<0.01)));
}
function syncBatch() {
  const it=selectedItem(), h=document.getElementById('batchHint'), b=document.getElementById('batchApplyBtn'), m=document.getElementById('batchMatch'); if (!h||!b||!m) return;
  if (!it?.imageData) { b.disabled=true; h.textContent=''; return; }
  const n=batchTargets(it,m.value).length, T=s=>window.semI18n?.t(s)??s;
  b.disabled=!n; h.textContent=n ? T('Other images that will change:')+' '+n : T('No other images match.');
}
document.getElementById('batchMatch')?.addEventListener('change',syncBatch);
document.getElementById('batchApplyBtn')?.addEventListener('click',()=>{
  const it=selectedItem(); if (!it?.imageData || state.busy) return;
  const doCrop=document.getElementById('batchCrop').checked, doAdj=document.getElementById('batchAdj').checked;
  if (!doCrop && !doAdj) { showToast('Choose what to apply.'); return; }
  const list=batchTargets(it,document.getElementById('batchMatch').value); if (!list.length) return;
  const W=it.imageData.width, H=it.imageData.height, cr=getCrop(it);
  for (const o of list) {
    if (doCrop) {
      if (!it.crop) o.crop=null; // auto crop: each image removes its own footer
      else { const w2=o.imageData.width, h2=o.imageData.height; o.crop={x:Math.round(cr.x/W*w2), y:Math.round(cr.y/H*h2), w:Math.round(cr.w/W*w2), h:Math.round(cr.h/H*h2)}; o.crop=getCrop(o); }
    }
    if (doAdj) { o.adj=it.adj?{...it.adj}:null; o._base=null; }
  }
  compose.srcCache={};
  rerenderAllNow(); showToast(`Applied to ${list.length} image(s).`);
});

