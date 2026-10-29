// =====================================================================
// Micrograph Figure Kit — 7. OCR of the original scale label
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Tesseract reads the label next to the detected bar.
// =====================================================================
let ocrWorkerPromise=null, ocrProgressCb=null;
const OCR_CONF_MIN=75; // Tesseract confidence (0–100) below which a reading is flagged for review
function ocrWarnOn() { return !!document.getElementById('ocrWarn')?.checked; }
// A guessed unit is always flagged; low confidence only when the user has turned the warning on.
function ocrUnsure(item) {
  if (!item || item.sourceManual || item.ocrDismissed || !item.sourceScaleText) return false;
  if (item.ocrUnitGuess) return true;
  return ocrWarnOn() && item.ocrConf!=null && item.ocrConf<OCR_CONF_MIN && !/^\(/.test(item.ocrRaw||'');
}
// Shared Tesseract worker.
function getOCRWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const T = await ensureTesseract();
      // Worker, OCR engine and English language data are embedded in the page (see offlineOCROptions in <head>).
      const off = typeof offlineOCROptions === 'function' ? offlineOCROptions() : {};
      return T.createWorker('eng', 1, {...off, logger: m => {
        if (m.status==='recognizing text' && typeof m.progress==='number' && ocrProgressCb) ocrProgressCb(m.progress);
      }});
    })().catch(e => { ocrWorkerPromise=null; throw e; });
  }
  return ocrWorkerPromise;
}

// OCR canvas from a label's glyph mask: black text on white, upscaled to targetH, with a white border.
function maskOCRCanvas(L, targetH) {
  const f=clamp(targetH/Math.max(1,L.h),1,12), pad=Math.round(0.3*L.h*f)+16;
  const src=document.createElement('canvas'); src.width=L.w; src.height=L.h;
  const sx=src.getContext('2d'), id=sx.createImageData(L.w,L.h);
  for (let i=0,p=0;i<L.mask.length;i++,p+=4) { const v=L.mask[i]?0:255; id.data[p]=id.data[p+1]=id.data[p+2]=v; id.data[p+3]=255; }
  sx.putImageData(id,0,0);
  const c=document.createElement('canvas'); c.width=Math.round(L.w*f)+2*pad; c.height=Math.round(L.h*f)+2*pad;
  const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height);
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high'; x.drawImage(src,pad,pad,Math.round(L.w*f),Math.round(L.h*f));
  return c;
}
// Crop, upscale smoothly and binarize so the text is black on white (what Tesseract expects).
function prepareOCRCanvas(imageData, rect, targetH, estTextH, pol, pthr=200) {
  const W=imageData.width, H=imageData.height;
  const padX=Math.max(4,Math.round(0.3*(estTextH||rect.h))), padY=Math.max(3,Math.round(0.3*(estTextH||rect.h)));
  const x0=clamp(rect.x-padX,0,W), y0=clamp(rect.y-padY,0,H);
  const x1=clamp(rect.x+rect.w+padX,0,W), y1=clamp(rect.y+rect.h+padY,0,H);
  const sw=Math.max(1,x1-x0), sh=Math.max(1,y1-y0);
  let f=clamp(targetH/Math.max(1,estTextH||rect.h),1,12);
  if (sw*f>4000) f=Math.max(1,4000/sw);
  const src=document.createElement('canvas'); src.width=sw; src.height=sh;
  src.getContext('2d').putImageData(imageData,-x0,-y0,x0,y0,sw,sh);
  const bw=Math.round(sw*f), bh=Math.round(sh*f), border=24;
  const big=document.createElement('canvas'); big.width=bw+2*border; big.height=bh+2*border;
  const ctx=big.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,big.width,big.height);
  ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  ctx.drawImage(src,border,border,bw,bh);
  const id=ctx.getImageData(border,border,bw,bh), gray=imageDataToGray(id), thr=otsuThreshold(gray);
  let bright=0; for (let i=0;i<gray.length;i++) if (gray[i]>=thr) bright++;
  const textIsBright = bright < gray.length/2;
  for (let i=0,p=0;i<gray.length;i++,p+=4) {
    let isText = textIsBright ? gray[i]>=thr : gray[i]<thr;
    if (pol) { const r=id.data[p], g2=id.data[p+1], b=id.data[p+2], mn=Math.min(r,g2,b), mx=Math.max(r,g2,b); isText = mx-mn<40 && (pol>0 ? mn>=pthr : mx<=260-pthr); }
    const v = isText ? 0 : 255;
    id.data[p]=id.data[p+1]=id.data[p+2]=v; id.data[p+3]=255;
  }
  ctx.putImageData(id,border,border);
  return {canvas:big, x0, y0, f, border};
}

// Ruler scale values are round numbers (1.00, 2.50, 50.0, 500…). A value within 7 % of one is an OCR digit slip.
function niceScaleValue(v) {
  if (!(v>0)) return v;
  const p=Math.pow(10,Math.floor(Math.log10(v))), m=v/p; let b=1;
  for (const n of [1,1.5,2,2.5,3,4,5,6,7,8,10]) if (Math.abs(m-n)<Math.abs(m-b)) b=n;
  return Math.abs(m-b)/b<=0.07 ? +(b*p).toPrecision(6) : v;
}
// Extract scale values from raw OCR text.
function parseOCRScales(raw, optical=false) {
  let s=String(raw||'').replace(/μ/g,'µ').replace(/(\d)[Oo]/g,'$10').replace(/[Oo](\d)/g,'0$1');
  // Stray punctuation between the number and the unit ("10. µm", "20, um").
  s=s.replace(/(\d)\s*[.,:;'`’]+(?=\s*(?:[µuμpyjlI1i|]\s?m|nm|mm)(?![a-z]))/g,'$1');
  // OCR reads a lone "1" before the unit as l / I / | / ! (JEOL "1µm" → "lum", "lpm").
  s=s.replace(/(^|[\s|(\[])[lI|!](?=\s?[µuμpy]\s?m(?![a-z]))/g,(m0,p)=>p+'1');
  // A lone "1" can also come out as "/" (the slash is allowed for reciprocal units).
  s=s.replace(/(^|\s)\/(?=\s?[µuμ]\s?m(?![a-z]))/g,'$11');
  // Reciprocal units on diffraction patterns: "2 1/nm", "5 1/µm" (the 1 may be read as l, I or |; "21/nm" is 2 1/nm).
  const rre=/(\d+(?:[.,]\d+)?)\s*[1lI|!]\s?\/\s?(nm|[µuμ]\s?m)(?![a-z])/gi, rec=[]; let rm;
  while ((rm=rre.exec(s))) {
    const value=Number(rm[1].replace(',','.')); if (!(value>0 && value<10000)) continue;
    const unit=/^n/i.test(rm[2]) ? 'nm⁻¹' : 'µm⁻¹';
    rec.push({value, unit, text:`${trimZeros(String(value))} ${unit}`});
  }
  if (rec.length) return rec;
  const re=/(\d+(?:[.,]\d+)?)\s?(nm|mm|[µuμpyjlI1i|]\s?m)(?![a-z])/gi;
  const out=[]; let m;
  while ((m=re.exec(s))) {
    const before=s.slice(0,m.index);
    if (/[:=]\s*$/.test(before) || /(wd|hfw|fov|field|view|hv|mag|det|pixel|size|width|dist)\W*$/i.test(before)) continue;
    const value=Number(m[1].replace(',','.'));
    if (!(value>0 && value<10000)) continue;
    const u=m[2].replace(/\s/g,'').toLowerCase();
    if (u[0]==='1' && m[0].length===m[1].length+m[2].length) continue; // "11m": the 1 belongs to the number, it is not a misread µ
    // OCR often reads "µ" as "m". SEM bars longer than a few mm are not realistic, so "100mm" → 100 µm.
    // Optical (stereo) microscope bars can be several mm, so there mm is kept.
    const unit = u==='nm' ? 'nm' : (u==='mm' && (optical || value<=5)) ? 'mm' : 'µm';
    out.push({value, unit, text:`${trimZeros(String(value))} ${unit}`});
  }
  return out;
}

// A glyph reaching well below the baseline of the label: only µ (and a decimal comma) has a descender among the
// characters of a scale label, so a label read as “nm” whose mask has one is really µm (bold serif µ is often read as n).
function maskHasDescender(L) {
  if (!L?.mask) return false;
  const bot=[]; for (let x=0;x<L.w;x++) { let b=-1; for (let y=L.h-1;y>=0;y--) if (L.mask[y*L.w+x]) { b=y; break; } if (b>=0) bot.push(b); }
  if (bot.length<10) return false;
  const s=[...bot].sort((a,b)=>a-b), base=s[Math.floor(s.length*0.5)];
  return bot.filter(b=>b>base+0.1*L.h).length>=2;
}
// Overlay bars (optical images): “nm” with a descender in the label is µm.
function fixOverlayUnit(m, L) {
  if (m && m.unit==='nm' && maskHasDescender(L)) return {...m, unit:'µm', text:`${trimZeros(String(m.value))} µm`};
  return m;
}
// Read the source scale of one item.
async function readScaleOCR(item, progressCb=()=>{}) {
  const a=item.analysis, id=item.imageData;
  if (a.overlay && a.overlay.label && (!a.footerDetected || a.overlay.picked)) {
    const worker=await getOCRWorker(); ocrProgressCb=progressCb; const raws=[];
    try {
      const L=a.overlay.label;
      // Coloured label: read it from the colour map (white text on black) instead of the photo.
      const oid=a.overlay.color ? colorKeyImageData(id,a.overlay.color) : id;
      const P=a.overlay.pol, tries=[[P,200,'7',56],[P,230,'7',72],[P,170,'7',56],[P,200,'8',56],[0,200,'7',56],[P,200,'6',40]];
      let digits=null;
      // First: the clean glyph mask (only the label's own pixels), then thresholded crops.
      if (L.mask) for (const psm of ['7','8']) {
        await worker.setParameters({tessedit_pageseg_mode:psm, tessedit_char_whitelist:OCR_WHITELIST});
        const res=await worker.recognize(maskOCRCanvas(L,56));
        const raw=(res?.data?.text||'').replace(/\s+/g,' ').trim(); raws.push(raw);
        const m=fixOverlayUnit(parseOCRScales(raw,true)[0],L);
        if (m) return {raw, normalized:m.text, conf:res?.data?.confidence??null};
        const d=raw.match(/(?:^|\D)(\d{1,4}(?:[.,]\d+)?)(?!\d)/);
        if (!digits && d && Number(d[1].replace(',','.'))>0) digits={raw, v:d[1].replace(',','.')};
      }
      for (const [pol,thr,psm,th] of tries) {
        await worker.setParameters({tessedit_pageseg_mode:psm, tessedit_char_whitelist:OCR_WHITELIST});
        const res=await worker.recognize(prepareOCRCanvas(oid,L,th,L.h,pol,thr).canvas);
        const raw=(res?.data?.text||'').replace(/\s+/g,' ').trim(); raws.push(raw);
        const m=fixOverlayUnit(parseOCRScales(raw,true)[0],L);
        if (m) return {raw, normalized:m.text, conf:res?.data?.confidence??null};
        const d=raw.match(/(?:^|\D)(\d{1,4}(?:[.,]\d+)?)(?!\d)/);
        if (!digits && d && Number(d[1].replace(',','.'))>0) digits={raw, v:d[1].replace(',','.')};
      }
      // Unit not readable: optical overlay bars are almost always in µm. Always flagged (even with the warning off) so the user checks it.
      if (digits) return {raw:digits.raw, normalized:`${trimZeros(digits.v)} µm`, conf:30, unitGuessed:true};
    } finally { ocrProgressCb=null; }
    throw new Error(`Auto read failed (OCR: “${raws.filter(Boolean).join(' | ').slice(0,120)||'empty'}”). The bar was found (${a.bar.w}px); enter the source scale in Calibration below and click Apply calibration.`);
  }
  if (!a.footerDetected) throw new Error('No image footer found, so the scale cannot be read automatically. Enter the source scale and original bar length in Calibration.');
  const worker=await getOCRWorker();
  ocrProgressCb=progressCb;
  const raws=[]; let mmFallback=null;
  try {
    await worker.setParameters({tessedit_pageseg_mode:'7', tessedit_char_whitelist:OCR_WHITELIST});
    for (const cand of a.labelCands) {
      // Ruler-aligned value: read it at several scales and take the most common result (a single pass can turn 1.00 into 1.06).
      // Text under the ruler itself is its value even in mm (only text left of the ruler can be the working distance).
      if (cand.aligned || cand.inSpan) {
        const got=[];
        for (const th of [56,72,44]) {
          const res=await worker.recognize(prepareOCRCanvas(id,cand,th,cand.h).canvas);
          const raw=(res?.data?.text||'').trim(); raws.push(raw);
          const m=parseOCRScales(raw)[0]; if (m) got.push({m, raw, conf:res?.data?.confidence??null});
        }
        if (got.length) {
          const cnt=t=>got.filter(x=>x.m.text===t).length, top=got.reduce((p,q)=>cnt(q.m.text)>cnt(p.m.text)?q:p);
          const nice=niceScaleValue(top.m.value), snapped=nice!==top.m.value, agree=cnt(top.m.text)>=2;
          const text=`${trimZeros(String(nice))} ${top.m.unit}`;
          return {raw:top.raw, normalized:text, conf:snapped||!agree?Math.min(top.conf??60,50):top.conf};
        }
        continue;
      }
      const prep=prepareOCRCanvas(id,cand,56,cand.h);
      const res=await worker.recognize(prep.canvas);
      const raw=(res?.data?.text||'').trim(); raws.push(raw);
      const conf=res?.data?.confidence??null;
      const list=parseOCRScales(raw), m=list.find(x=>x.unit!=='mm');
      if (m) return {raw, normalized:m.text, conf};
      // Label next to the bar read as "10m": the µ was dropped (JEOL small font). Accept as µm, flagged uncertain.
      const lost=raw.replace(/\s+/g,'').match(/^[^\d]{0,2}(\d{1,4}(?:[.,]\d+)?)m$/);
      if (lost && !list.length) { const v=Number(lost[1].replace(',','.')); if (v>0) return {raw, normalized:`${trimZeros(String(v))} µm`, conf:Math.min(conf??40,40)}; }
      if (!mmFallback && list[0]) mmFallback={raw, normalized:list[0].text, conf:Math.min(conf??60,60)};
    }
    // Fallback: read the whole footer and take the scale-like token nearest the bar.
    const rect={x:0,y:a.footerY,w:id.width,h:id.height-a.footerY};
    const estH=a.labelCands[0]?.h || Math.max(8,Math.round(rect.h*0.3));
    const prep=prepareOCRCanvas(id,rect,40,estH);
    await worker.setParameters({tessedit_pageseg_mode:'11', tessedit_char_whitelist:''});
    const res=await worker.recognize(prep.canvas);
    const words=res?.data?.words||[];
    raws.push((res?.data?.text||'').replace(/\s+/g,' ').trim());
    const bx=a.bar?a.bar.x+a.bar.w/2:id.width/2, by=a.bar?a.bar.y+a.bar.h/2:a.footerY+rect.h/2;
    let best=null, bestD=Infinity;
    for (let i=0;i<words.length;i++) {
      const w=words[i], n=words[i+1], variants=[{t:w.text,b:w.bbox,c:w.confidence}];
      if (n) {
        const hh=w.bbox.y1-w.bbox.y0, ov=Math.min(w.bbox.y1,n.bbox.y1)-Math.max(w.bbox.y0,n.bbox.y0);
        if (ov>0.3*hh && n.bbox.x0-w.bbox.x1<1.5*hh) variants.push({t:`${w.text} ${n.text}`,c:Math.min(w.confidence,n.confidence),b:{x0:w.bbox.x0,y0:Math.min(w.bbox.y0,n.bbox.y0),x1:n.bbox.x1,y1:Math.max(w.bbox.y1,n.bbox.y1)}});
      }
      for (const v of variants) for (const m of parseOCRScales(v.t)) {
        const ox=((v.b.x0+v.b.x1)/2-prep.border)/prep.f+prep.x0, oy=((v.b.y0+v.b.y1)/2-prep.border)/prep.f+prep.y0;
        const d=Math.hypot(ox-bx,oy-by)+(m.unit==='mm'?1e6:0);
        if (d<bestD) { bestD=d; best={raw:v.t, normalized:m.text, conf:v.c??null, box:{x0:(v.b.x0-prep.border)/prep.f+prep.x0, x1:(v.b.x1-prep.border)/prep.f+prep.x0, y0:(v.b.y0-prep.border)/prep.f+prep.y0, y1:(v.b.y1-prep.border)/prep.f+prep.y0}}; }
      }
    }
    if (best && !a.bar && a._mask && best.box) {
      const M=a._mask, fy=a.footerY;
      const bar=findBarNearText(M.clean,M.fw,M.fh,best.box.x0,best.box.y0-fy,best.box.x1,best.box.y1-fy);
      if (bar) { a.bar={x:bar.x, y:fy+bar.y, w:bar.w, h:bar.h, kind:'near-text'}; a.notes=a.notes.filter(n=>!/Scale bar was not detected/.test(n)); a.notes.push('Scale bar found next to the OCR text; please check “Original bar, px”.'); }
    }
    // A mm value read from a label next to the bar beats a mm/µm token found elsewhere in the footer.
    if (best && !(mmFallback && bestD>=1e6)) return best;
    if (mmFallback) return mmFallback;
    if (best) return best;
  } finally { ocrProgressCb=null; }
  const shown=raws.filter(Boolean).join(' | ').slice(0,120);
  throw new Error(`Auto read failed (OCR: “${shown||'empty'}”). Enter the source scale in Calibration below and click Apply calibration.`);
}

