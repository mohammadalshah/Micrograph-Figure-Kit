// =====================================================================
// Micrograph Figure Kit — 17a. EDS element content (wt.% / at.%)
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Reads quantification from the report tables or by OCR of spectrum tiles; text drawn on maps.
// =====================================================================
// Parse quantification text (Word table rows or OCR lines) into {El:{wt, at}}.
// A header row locates the Wt% and Atomic % columns among the numeric columns;
// without a header: 1 number = wt, 2 = wt at, 3+ = wt … at (AZtec “Wt% | Wt% Sigma | Atomic %”).
function parseQuantLines(lines) {
  const rows={}; let rWt=-1, rAt=-1;
  const isNumHead=c=>/conc|ratio|wt|weight|atom|at\.?\s*%|sigma|σ|%|norm|oxide|вес|масс|ат/i.test(c);
  for (const raw of lines) {
    const line=String(raw||'').replace(/(\d),(\d)/g,'$1.$2').trim()
      .replace(/^[|:;.,'"`]+\s*/,'').replace(/^AI(?![a-z])/,'Al').replace(/^CI(?![a-z])/,'Cl').replace(/^0(?=\s)/,'O').replace(/^Sl(?![a-z])/,'Si');
    if (!line) continue;
    const cells=line.split(/\t|\s*\|\s*|\s{2,}/).map(s=>s.trim()).filter(Boolean);
    const isHead=/wt|weight|atomic|вес|масс|атом|(^|[\s(])(at|ar|ат)\.?\s*\(?\s*(%|96)|(^|[\s(])(at|ar|ат)\.?\s*$/i.test(line);
    if (isHead && !/\d{1,3}\.\d/.test(line)) {
      const nh=cells.filter(isNumHead);
      if (!nh.length) nh.push(line);
      rWt=nh.findIndex(c=>/(wt|weight|вес|масс)/i.test(c) && !/sigma|σ|err/i.test(c));
      rAt=nh.findIndex(c=>/(atom|(^|[\s(])(at|ar)\b|ат)/i.test(c) && !/sigma|σ|err/i.test(c));
      continue;
    }
    const m=line.match(/^([A-Z][a-z]?)(?![a-z])/); if (!m || !ELEMENTS.has(m[1])) continue;
    const rest=line.slice(m[1].length).replace(/\b[KLM](?:α|a|β|b)?\s?[12]?\b|series|серия/gi,' ');
    // A percentage is never above 100: an integer like 221 is a lost decimal point (22.1).
    const nums=(rest.match(/-?\d+(?:\.\d+)?/g)||[]).map(x=>{ let v=Number(x); if (!x.includes('.') && v>100 && v<1000) v=v/10; return v; }).filter(v=>v>=0 && v<=100);
    if (!nums.length) continue;
    let wt, at;
    if (rWt>=0 || rAt>=0) { wt=rWt>=0?nums[rWt]:undefined; at=rAt>=0?nums[rAt]:undefined; }
    else if (nums.length===1) wt=nums[0];
    else if (nums.length===2) { wt=nums[0]; at=nums[1]; }
    else { wt=nums[0]; at=nums[nums.length-1]; }
    if (wt==null && at==null) continue;
    if (!rows[m[1]]) rows[m[1]]={wt, at};
  }
  return rows;
}
// Manual box: “Fe 62.4 58.1” (element, wt.%, at.%); “-” skips a value.
function parseQuantBox(text) {
  const rows={};
  for (const line of String(text||'').split(/\n/)) {
    const tk=line.replace(/(\d),(\d)/g,'$1.$2').trim().split(/[\s;:=\t]+/); if (tk[0]) tk[0]=tk[0].charAt(0).toUpperCase()+tk[0].slice(1).toLowerCase(); if (!tk[0] || !ELEMENTS.has(tk[0])) continue;
    const v=s=>{ const x=parseFloat(s); return isFinite(x)?x:undefined; };
    rows[tk[0]]={wt:v(tk[1]), at:v(tk[2])};
  }
  return rows;
}
function edsSetQuant(rows, src) {
  const f=v=>v==null||!isFinite(v)?'-':String(+v.toFixed(2));
  edsEls.edsQText.value=Object.entries(rows).map(([el,r])=>el.padEnd(3)+' '+f(r.wt)+' '+f(r.at)).join('\n');
  eds.quantSrc=src; edsSyncQuantStatus();
}
function edsSyncQuantStatus() {
  const n=Object.keys(parseQuantBox(edsEls.edsQText.value)).length;
  edsEls.edsQStatus.textContent=n?n+' element(s)'+(eds.quantSrc?' · '+eds.quantSrc:''):'no values';
}
function edsQuantText(t, cfg, sc) {
  if (!cfg.qOn || t.role!=='map' || !t.el?.el) return '';
  const r=parseQuantBox(edsEls.edsQText.value)[t.el.el]; if (!r) return '';
  const v=cfg.qBasis==='at'?r.at:r.wt; if (v==null) return '';
  let s=v.toFixed(cfg.qDec);
  if (sc.decimal==='comma' || (sc.decimal==='auto' && (sc.unitLang==='ru' || cfg.qUnit==='ru'))) s=s.replace('.',',');
  const u=cfg.qUnit==='pct'?'%':cfg.qUnit==='ru'?(cfg.qBasis==='at'?'ат.%':'мас.%'):(cfg.qBasis==='at'?'at.%':'wt.%');
  return s+' '+u;
}
// OCR every spectrum tile and parse element rows. AZtec draws the result table
// (header “Wt% / At% / Вес.% / Ат.%” + element rows) in the upper-right corner
// as colored text on a grey-blue panel, so that corner is read first with a
// light-text threshold; the whole image is the fallback.
function quantOCRCanvas(s, rx, ry, rw, rh, thr=165) {
  const x0=Math.round(rx*s.width), y0=Math.round(ry*s.height), w=Math.round(rw*s.width), h=Math.round(rh*s.height);
  const k=Math.max(1,Math.min(4,Math.round(2200/w))), c=document.createElement('canvas'); c.width=w*k; c.height=h*k;
  const tmp=document.createElement('canvas'); tmp.width=w; tmp.height=h;
  const src=new ImageData(w,h), d=s.data;
  // light text (yellow, red, white) → black; background → white
  let dark=0; for (let y=0;y<h;y++) for (let x=0;x<w;x++) { const p=((y+y0)*s.width+x+x0)*4; if (Math.max(d[p],d[p+1],d[p+2])<120) dark++; }
  const lightText=dark>w*h*0.3;
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    const p=((y+y0)*s.width+x+x0)*4, q=(y*w+x)*4, v=lightText?Math.max(d[p],d[p+1]):255-Math.min(d[p],d[p+1],d[p+2]);
    const ink=v>thr; src.data[q]=src.data[q+1]=src.data[q+2]=ink?0:255; src.data[q+3]=255;
  }
  tmp.getContext('2d').putImageData(src,0,0);
  const ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height); ctx.imageSmoothingQuality='high'; ctx.drawImage(tmp,0,0,c.width,c.height);
  return c;
}
// OCR often drops the small decimal point (“1.4” → “14”). When most rows of a pass have
// decimals, a row with a bare integer gets its point back before the last digit.
function repairQuantLines(lines) {
  const rowRe=/^\s*[|:;.,'"`]*\s*([A-Z][A-Za-z]?|0)\s+(\d+(?:\.\d+)?)\s*%?\s*$/;
  const rows=lines.filter(l=>rowRe.test(l)), dotted=rows.filter(l=>/\d\.\d/.test(l)).length;
  if (!rows.length || dotted<rows.length/2) return lines;
  return lines.map(l=>{ const m=l.match(rowRe); if (!m || m[2].includes('.') || m[2].length<2) return l; return l.replace(m[2], m[2].slice(0,-1)+'.'+m[2].slice(-1)); });
}
// Several OCR passes give candidate values per element; pick the combination whose
// total is closest to 100 % (resolves 18.5 vs 19.5 type misreads).
function pickQuant(passes, basis) {
  const key=basis==='wt'?'wt':'at', els={};
  for (const p of passes) for (const [el,r] of Object.entries(p)) { const v=r[key]??r.wt??r.at; if (v==null) continue; (els[el]=els[el]||new Set()).add(v); }
  const names=Object.keys(els).filter(el=>{ const n=passes.filter(p=>p[el]).length; return n>=Math.min(2,passes.length); });
  const cands=names.map(el=>[...els[el]]);
  let best=null, bestErr=Infinity, combos=cands.reduce((t,c)=>t*c.length,1);
  if (combos>512) cands.forEach((c,i)=>cands[i]=[c[0]]);
  const walk=(i,acc,sum)=>{ if (i===cands.length) { const e=Math.abs(100-sum); if (e<bestErr) { bestErr=e; best=acc.slice(); } return; } for (const v of cands[i]) { acc.push(v); walk(i+1,acc,sum+v); acc.pop(); } };
  walk(0,[],0);
  const out={}; names.forEach((el,i)=>{ const v=best?best[i]:cands[i][0]; out[el]=key==='wt'?{wt:v}:{at:v}; });
  return out;
}
async function edsReadQuantOCR() {
  const specs=eds.tiles.filter(t=>t.role==='spectrum');
  if (!specs.length) { showToast('No spectrum found. Set an image type to “Spectrum”, or type the values in the box.',4500); return; }
  const worker=await getOCRWorker(); let rows={}, basis='';
  try {
    await worker.setParameters({tessedit_pageseg_mode:'6', tessedit_char_whitelist:''});
    for (let i=0;i<specs.length;i++) {
      edsProgress(i/specs.length,'Reading spectrum '+(i+1)+'/'+specs.length);
      const s=specs[i].src;
      for (const r of [[0.6,0,0.4,0.45],[0.5,0,0.5,0.6],[0,0,1,1]]) {
        const passes=[]; let head='';
        for (const thr of [165,140,190]) {
          const res=await worker.recognize(quantOCRCanvas(s,...r,thr));
          const lines=repairQuantLines(String(res?.data?.text||'').split('\n'));
          const got=parseQuantLines(lines);
          if (Object.keys(got).length>=2) passes.push(got);
          head=head||lines.find(l=>/wt|\bat\b|\bar\b|at\.|ar\.|вес|мас|ат/i.test(l) && !/\d\.\d/.test(l) && /%|\(/.test(l))||'';
        }
        if (!passes.length) continue;
        if (/(wt|вес|мас|weight)/i.test(head)) basis='wt'; else if (/(at|ar|ат)/i.test(head)) basis='at';
        const hasBoth=passes.some(p=>Object.values(p).some(v=>v.wt!=null&&v.at!=null));
        rows={...(hasBoth?passes[0]:pickQuant(passes,basis||'wt')), ...rows};
        break;
      }
    }
  } finally { edsProgress(null); }
  if (!Object.keys(rows).length) { showToast('No element percentages found in the spectrum image. Type the values in the box.',5500); return; }
  edsSetQuant(rows,'spectrum'+(basis?' ('+(basis==='at'?'at.%':'wt.%')+')':''));
  if (basis) edsEls.edsQBasis.value=basis;
  edsEls.edsQOn.checked=true; renderEds();
  showToast('Read '+Object.keys(rows).length+' element(s)'+(basis?' in '+(basis==='at'?'at.%':'wt.%'):'')+'. Please check the values.');
}
edsEls.edsQRead.onclick=()=>edsReadQuantOCR().catch(e=>showToast('Reading failed: '+(e.message||e),4000));
edsEls.edsQText.addEventListener('input',()=>{ eds.quantSrc='edited'; edsSyncQuantStatus(); scheduleEds(); });
['edsQOn','edsQBasis','edsQUnit','edsQDec','edsQPt'].forEach(k=>{ edsEls[k].addEventListener('change',()=>scheduleEds(0)); edsEls[k].addEventListener('input',()=>scheduleEds()); });

['edsRemove','edsShowBoxes','edsTrimT','edsTrimB','edsTrimL','edsTrimR','edsLabelStyle','edsLabelColor','edsLabelPt','edsMargin','edsLabelHlColor','edsLabelBold','edsLabelHl',
 'edsScaleOn','edsScaleVal','edsScaleUnit','edsScalePt','edsLayout','edsCols','edsWidth','edsDpi','edsGap','edsBg'].forEach(k=>{
  const el=edsEls[k]; el.addEventListener('change',()=>scheduleEds(0));
  if (el.tagName==='INPUT' && el.type!=='checkbox') el.addEventListener('input',()=>scheduleEds(200));
});
edsEls.edsCalApply.onclick=()=>{
  const v=Number(String(edsEls.edsCalVal.value).replace(',','.')), px=Number(edsEls.edsCalPx.value);
  const t=eds.tiles.find(x=>x.role==='electron') || eds.tiles[0];
  if (!(v>0 && px>0) || !t) { showToast('Enter the known length and its length in px.',3600); return; }
  eds.cal={umPerPx:v*(edsEls.edsCalUnit.value==='nm'?0.001:1)/px, refW:t.src.width};
  renderEds(); showToast('Calibration applied to all EDS images.');
};
edsEls.edsCalAuto.onclick=()=>edsAutoCal(true);
