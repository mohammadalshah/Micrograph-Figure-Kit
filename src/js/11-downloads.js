// =====================================================================
// Micrograph Figure Kit — 11. Downloads
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Single PNG, all PNGs to a folder, ZIP and CSV audit.
// =====================================================================
function safeBase(name) { return name.replace(/\.[^.]+$/,'').replace(/[\\/:*?"<>|]+/g,'_'); }
// Save via the browser's file picker or a download link (the file never leaves this computer).
async function saveBlob(blob, name, mimeType='application/octet-stream') {
  const fileName = String(name || 'download.bin');
  if (window.showSaveFilePicker && window.isSecureContext) {
    try {
      const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
      const handle = await window.showSaveFilePicker({ suggestedName: fileName, types: [{ description: 'File', accept: { [mimeType]: ext ? [ext] : [] } }] });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return {method:'file-picker'};
    } catch (e) {
      if (e && e.name === 'AbortError') return {method:'cancelled'};
      console.warn('Save picker failed, trying fallback:', e);
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}));
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return {method:'anchor'};
  } catch (e) { console.warn('Anchor download failed:', e); }
  const win = window.open(url, '_blank', 'noopener');
  if (!win) { URL.revokeObjectURL(url); throw new Error('The browser blocked the download. Allow downloads/pop-ups for this page and try again.'); }
  setTimeout(() => URL.revokeObjectURL(url), 120000);
  return {method:'new-tab'};
}

async function writeBlobToDirectory(dirHandle, blob, fileName) {
  const fileHandle = await dirHandle.getFileHandle(fileName, {create:true});
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}
// A name not yet present in the folder (figure.pdf → figure_2.pdf), so earlier files are never replaced.
async function freeDirName(dir, name) {
  const dot=name.lastIndexOf('.'), base=dot>0?name.slice(0,dot):name, ext=dot>0?name.slice(dot):'';
  for (let k=1;k<1000;k++) { const n=k===1?name:`${base}_${k}${ext}`; try { await dir.getFileHandle(n); } catch (e) { if (e?.name==='NotFoundError' || e?.name==='TypeError') return n; throw e; } }
  return name;
}

async function chooseOutputFolder() {
  if (!window.showDirectoryPicker) {
    showToast('This browser cannot write directly to a chosen folder. Use Chrome/Edge on desktop, or save each PNG with the Save button.', 5200);
    return null;
  }
  try {
    const handle = await window.showDirectoryPicker({mode:'readwrite'});
    state.outputDirHandle = handle;
    els.outputFolderStatus.textContent = `Output folder: ${handle.name}`;
    showToast(`Output folder selected: ${handle.name}`);
    return handle;
  } catch (e) {
    if (e?.name !== 'AbortError') showToast(`Folder selection failed: ${e.message}`, 4200);
    return null;
  }
}

async function saveProcessedItem(item) {
  const blob = await cleanPng(item);
  const fileName = `${safeBase(item.name)}_clean.png`;
  if (state.outputDirHandle) {
    try {
      await writeBlobToDirectory(state.outputDirHandle, blob, fileName);
      return {method:'directory', fileName};
    } catch (e) {
      console.warn('Stored output folder is no longer writable:', e);
      state.outputDirHandle = null;
      els.outputFolderStatus.textContent = 'Output folder: browser default';
    }
  }
  const result = await saveBlob(blob, fileName, 'image/png');
  return {...result, fileName};
}

// Print resolution of a Clean result: output width / print width, so sizes set in pt stay right in Word or Illustrator.
function cleanDpi(it) { const w=it.outputCanvas?.width||0, cm=Math.max(1,num(els.printWidth,8.5)); return Math.max(1,Math.round(w/(cm/2.54))); }
async function cleanPng(it) { return pngWithDpi(await ensureBlob(it), cleanDpi(it)); }
async function cleanBlob(it, fmt) {
  const dpi = cleanDpi(it);
  if (fmt === 'tif') return tiffBlob(it.outputCanvas, dpi, 'white');
  if (fmt === 'pdf') return pdfBlob(it.outputCanvas, dpi, 'white');
  if (fmt === 'svg') return svgVector(() => renderResult(it), dpi, it.outputCanvas);
  return cleanPng(it);
}
// File name not yet used in this export: name.png, name_2.png, name_3.png …
function uniqueName(used, name) {
  const dot=name.lastIndexOf('.'), base=dot>0?name.slice(0,dot):name, ext=dot>0?name.slice(dot):'';
  let n=name, k=2; while (used.has(n.toLowerCase())) n=`${base}_${k++}${ext}`;
  used.add(n.toLowerCase()); return n;
}
async function saveAllSeparate(fmt = 'png') {
  const good = state.items.filter(x => x.status === 'ok' && x.outputCanvas), F = fmt === 'tif' ? 'TIFF' : fmt.toUpperCase();
  if (!good.length) { showToast('There are no processed files to save.'); return; }
  const used = new Set(), outName = it => uniqueName(used, `${safeBase(it.name)}_clean.${fmt}`);
  state.busy = true;
  renderUI();
  try {
    if (!state.outputDirHandle && window.showDirectoryPicker) {
      const handle = await chooseOutputFolder();
      if (!handle) return;
    }
    if (state.outputDirHandle) {
      for (let i = 0; i < good.length; i++) {
        setProgress(i / good.length, `Saving ${i+1}/${good.length}`);
        await writeBlobToDirectory(state.outputDirHandle, await cleanBlob(good[i], fmt), outName(good[i]));
      }
      setProgress(1, 'Saved');
      showToast(`${good.length} ${F} file(s) saved separately to ${state.outputDirHandle.name}.`, 4200);
      return;
    }
    for (let i = 0; i < good.length; i++) {
      setProgress(i / good.length, `Downloading ${i+1}/${good.length}`);
      const url = URL.createObjectURL(await cleanBlob(good[i], fmt));
      const a = document.createElement('a');
      a.href = url; a.download = outName(good[i]); a.rel = 'noopener'; a.style.display = 'none';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      await sleep(350);
    }
    setProgress(1, 'Done');
    showToast(`${good.length} separate ${F} download(s) started. If asked, allow multiple downloads.`, 5200);
  } catch (e) {
    showToast(`Save failed: ${e.message}`, 5200);
  } finally {
    state.busy = false;
    setTimeout(hideProgress, 500);
    renderUI();
  }
}

// CSV text. With RU or decimal-comma settings Excel expects ";" between columns and "," in numbers.
function csvJoin(rows) {
  const semi=measComma(settings()), sep=semi?';':',', isNum=/^-?\d+(\.\d+)?(e[-+]?\d+)?$/i;
  return rows.map(r=>r.map(v=>{ let s=v==null?'':String(v); if (semi && isNum.test(s)) s=s.replace('.',','); return /[",;\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(sep)).join('\r\n');
}
// CSV with detection and calibration details for every file.
function auditCSV() {
  const cfg=settings();
  const headers=['source','width_in','height_in','footer_y','crop_x','crop_y','crop_w','crop_h','bar_x','bar_y','bar_w_original','source_scale_text','output_scale_text','output_label','ocr_raw','width_out','height_out','bar_w_out','bar_thickness_out','font_family','font_weight','font_size_px'];
  const rows=[headers];
  for (const it of state.items.filter(x=>x.status==='ok')) {
    const m=it.renderMeta||{}, cr=m.crop||getCrop(it), a=it.analysis;
    rows.push([
      it.name,it.imageData.width,it.imageData.height,a.footerDetected?a.footerY:'',cr.x,cr.y,cr.w,cr.h,
      a.bar?.x??'',a.bar?.y??'',originalBarPx(it),
      it.sourceScaleText,it.targetScaleText,m.label||'',it.ocrRaw||'',
      it.outputCanvas.width,it.outputCanvas.height,m.barW||'',m.thickness||'',
      importedFontName(cfg.fontFamily)||cfg.fontFamily,els.fontWeight.value,m.fontSize||''
    ]);
  }
  return '\uFEFF'+csvJoin(rows);
}

async function downloadZip() {
  if (state.busy) return;
  const good=state.items.filter(x=>x.status==='ok'&&x.outputCanvas);
  if (!good.length) { showToast('There are no processed files to save.'); return; }
  try {
    state.busy=true; renderUI(); setProgress(0,'ZIP');
    const JSZip=await ensureJSZip(), zip=new JSZip(), used=new Set();
    for (let i=0;i<good.length;i++) {
      zip.file(uniqueName(used,`${safeBase(good[i].name)}_clean.png`), await cleanPng(good[i]));
      setProgress((i+1)/(good.length+1),'ZIP');
    }
    zip.file('sem_processing_audit.csv',auditCSV());
    if (state.items.some(x=>x.measures?.length)) zip.file('sem_measurements.csv','\ufeff'+measCSV(state.items.filter(x=>x.imageData)));
    const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}},m=>setProgress(m.percent/100,'ZIP'));
    const saveResult=await saveBlob(blob,'SEM_processed.zip','application/zip');
    if (saveResult.method!=='cancelled') showToast('ZIP is ready.');
  } catch(e) { showToast(`ZIP: ${e.message}`,4200); } finally { state.busy=false; hideProgress(); renderUI(); }
}

