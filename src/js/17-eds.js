// =====================================================================
// Micrograph Figure Kit — 17. EDS maps tab
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Extracts element maps from AZtec .docx reports, cleans them and builds a map figure.
// =====================================================================
const E=id=>document.getElementById(id);
const edsEls={}; ['edsClear','edsDrop','edsFile','edsList','edsSelCard','edsSelName','edsRole','edsColor','edsLabel','edsLabelToolbar','edsBright','edsBrightN','edsContrast','edsContrastN','edsSharp','edsSharpN','edsLvAll',
 'edsAuto','edsAutoAll','edsEraseTool','edsEraseClear','edsResetLv','edsSaveOne','edsRemove','edsShowBoxes','edsTrimT','edsTrimB','edsTrimL','edsTrimR','edsLabelStyle','edsLabelColor','edsLabelPt','edsMargin',
 'edsLabelHlColor','edsLabelBold','edsLabelHl','edsLabelOl','edsLabelOlColor','edsCalStatus','edsCalVal','edsCalUnit','edsCalPx','edsCalApply','edsCalAuto','edsScaleOn','edsScaleVal','edsScaleUnit','edsScalePt',

 'edsLabelPos','edsQPos','edsScalePos','edsQStatus','edsQOn','edsQBasis','edsQUnit','edsQDec','edsQPt','edsQText','edsQRead',
 'edsLayout','edsCols','edsWidth','edsDpi','edsGap','edsBg','edsSaveFig','edsSaveMaps','edsSendMaps','edsSendFig','edsSummary','edsProgress','edsProgressBar','edsProgressText',
 'edsGroupsWrap','edsGroups','edsEmpty','edsCard','edsDims','edsCanvas','edsWarn'].forEach(k=>edsEls[k]=E(k));
// gen: import generation. Clear raises it, so readings still running for the old files discard their results.
const eds={tiles:[], sel:null, cal:null, cells:[], canvas:null, warnings:[], erase:[], eraseTool:false, gen:0, batch:uid()};
// batch: id of the group shown now. Items sent to Compose carry it, so Refresh rebuilds each item from its own group.
// groups: one per Word report (or set of loose images). The shown group lives in eds.*; the others keep their own tiles, scale, erase boxes, element content and panel settings.
eds.groups=[{id:eds.batch, name:''}];
const ELEMENTS=new Set('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U'.split(' '));
const ROLE_NAMES={electron:'image', map:'map', layered:'layered', spectrum:'spectrum'};
const ROLE_ORDER={electron:0, map:1, layered:2, spectrum:3};

function edsProgress(frac,label) {
  if (frac==null) { edsEls.edsProgress.hidden=true; return; }
  edsEls.edsProgress.hidden=false; edsEls.edsProgressBar.style.width=(clamp(frac,0,1)*100).toFixed(0)+'%'; edsEls.edsProgressText.textContent=label||'';
}
// Parse captions like "Fe Kα1" into element and line.
function parseElementLine(text) {
  // OCR fixes: “Cu lal 2” → “Cu La1 2”, “CrlLal” (lost space + stray l) → element Cr, line Lα1.
  const s=String(text||'').replace(/Kα/g,'Ka').replace(/Lα/g,'La').replace(/Mα/g,'Ma').replace(/β/g,'b').replace(/(^|[\s_])[lI|](a[l1I|])/g,'$1L$2');
  const re=/(?:^|[^A-Za-z])([A-Z][a-z]?)[lI|]?[\s_\-]*([KLM])[\s_]*([abouOQ«])?[\s_]*([12Il|])?(?:[_,.]\s*[12Il|])?(?![A-Za-z])/g;
  let m;
  while ((m=re.exec(s))) {
    if (!ELEMENTS.has(m[1])) continue;
    const d=m[4]?'1':'';
    return {el:m[1], line:m[2]+(m[3]==='b'?'β':(m[3]||m[4])?'α':'')+d};
  }
  const toks=s.split(/[\s_\-.()]+/).filter(t=>t.length<=2 && ELEMENTS.has(t) && !/^(I|S|In|As|At|No)$/.test(t) || /^[A-Z][a-z]?$/.test(t) && s.trim()===t);
  if (toks.length===1 && ELEMENTS.has(toks[0])) return {el:toks[0], line:''};
  return null;
}
function pixelStats(id) {
  const d=id.data, n=id.width*id.height, step=Math.max(1,Math.floor(n/40000));
  let cnt=0, sat=0, white=0, dark=0, r=0, g=0, b=0, sc=0;
  for (let i=0;i<n;i+=step) {
    const p=i*4, mx=Math.max(d[p],d[p+1],d[p+2]), mn=Math.min(d[p],d[p+1],d[p+2]); cnt++;
    if (mx-mn>40 && mx>60) { sat++; r+=d[p]; g+=d[p+1]; b+=d[p+2]; sc++; }
    if (mn>230) white++; if (mx<25) dark++;
  }
  const hex=v=>Math.round(v).toString(16).padStart(2,'0');
  let color='#ffffff';
  if (sc) { const k=255/Math.max(r/sc,g/sc,b/sc,1); color='#'+hex(Math.min(255,r/sc*k))+hex(Math.min(255,g/sc*k))+hex(Math.min(255,b/sc*k)); }
  return {sat:sat/cnt, white:white/cnt, dark:dark/cnt, color};
}
// Bounding box of everything that differs from the margin colour (median of the four corners).
// Reports often place a 4:3 map with its title and scale bar on a wide white picture; the shape of this box is the real shape.
function edsContentBox(id) {
  const W=id.width, H=id.height, d=id.data;
  const cs=[[1,1],[W-2,1],[1,H-2],[W-2,H-2]].map(([x,y])=>{ const p=(y*W+x)*4; return [d[p],d[p+1],d[p+2]]; });
  const bg=[0,1,2].map(k=>cs.map(c=>c[k]).sort((a,b)=>a-b)[1]);
  const rows=new Uint32Array(H), cols=new Uint32Array(W);
  for (let y=0,p=0;y<H;y++) for (let x=0;x<W;x++,p+=4) if (Math.abs(d[p]-bg[0])+Math.abs(d[p+1]-bg[1])+Math.abs(d[p+2]-bg[2])>40) { rows[y]++; cols[x]++; }
  const rMin=Math.max(1,Math.round(W*0.002)), cMin=Math.max(1,Math.round(H*0.002));
  let y0=0; while (y0<H-1 && rows[y0]<rMin) y0++; let y1=H-1; while (y1>y0 && rows[y1]<rMin) y1--;
  let x0=0; while (x0<W-1 && cols[x0]<cMin) x0++; let x1=W-1; while (x1>x0 && cols[x1]<cMin) x1--;
  return {x:x0, y:y0, w:x1-x0+1, h:y1-y0+1};
}
// Decide the tile role: element map, electron image or spectrum (English and Russian AZtec captions).
function edsClassify(caption, id) {
  const s=String(caption||''), st=pixelStats(id), el=parseElementLine(s);
  let role;
  if (/layered|overlay|mixed|многослойн|наложен|совмещ/i.test(s)) role='layered';
  else if (/electron|\bSE\b|\bBSE\b|secondary|backscatter|электронн|вторичн|отражен/i.test(s)) role='electron';
  else if (/spectrum|spectra|спектр/i.test(s) && !el) role='spectrum';
  else if (el) role='map';
  else { const cb=edsContentBox(id);
    if (cb.w/cb.h>1.4) role='spectrum';
    else if (st.sat<0.02 && st.dark<0.5) role='electron';
    else role='map'; }
  return {role, el, color:st.color};
}
function tileLabel(t, cfg) {
  if (t.custom!=null) return t.custom;
  if (t.role==='electron' || t.role==='spectrum') return '';
  if (t.el) return cfg.labelStyle==='short' || !t.el.line ? t.el.el : t.el.el+' '+t.el.line;
  return t.role==='layered' ? '' : t.name.replace(/\.[^.]+$/,'');
}

// Transparent PNGs (AZtec exports) are shown by Word on a white page: composite them the same way.
function flattenOnWhite(id) {
  const d=id.data;
  for (let p=0;p<d.length;p+=4) { const a=d[p+3]; if (a===255) continue; const k=a/255, w=255*(1-k); d[p]=d[p]*k+w; d[p+1]=d[p+1]*k+w; d[p+2]=d[p+2]*k+w; d[p+3]=255; }
  return id;
}
// Extract images and captions from an AZtec Word report in document order.
async function edsReadDocx(file) {
  const JSZip=await ensureJSZip(), zip=await JSZip.loadAsync(await file.arrayBuffer());
  const docF=zip.file('word/document.xml'); if (!docF) throw new Error(file.name+' is not a Word .docx file.');
  // Refuse reports that would expand to an unreasonable size (protects against decompression bombs).
  let total=0, media=0;
  zip.forEach((p,f)=>{ if (f.dir) return; total+=f._data?.uncompressedSize||0; if (/^word\/media\//.test(p)) media++; });
  if (total>500*1048576 || media>500) throw new Error(file.name+' is too large to open (over 500 MB or 500 images when unpacked).');
  const W_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main', R_NS='http://schemas.openxmlformats.org/officeDocument/2006/relationships'; // XML namespace names, not web addresses
  const xml=new DOMParser().parseFromString(await docF.async('string'),'application/xml');
  const rels={}, relsF=zip.file('word/_rels/document.xml.rels');
  if (relsF) { const rx=new DOMParser().parseFromString(await relsF.async('string'),'application/xml'); for (const r of rx.getElementsByTagName('Relationship')) rels[r.getAttribute('Id')]=r.getAttribute('Target'); }
  const closest=(n,name)=>{ for (let p=n.parentNode;p&&p.nodeType===1;p=p.parentNode) if (p.localName===name && p.namespaceURI===W_NS) return p; return null; };
  const seq=[];
  for (const el of xml.getElementsByTagName('*')) {
    if (el.localName==='blip' || el.localName==='imagedata') {
      const rid=el.getAttributeNS(R_NS,'embed')||el.getAttributeNS(R_NS,'id')||el.getAttribute('r:embed')||el.getAttribute('r:id');
      if (rid) seq.push({k:'img', rid, cell:closest(el,'tc')});
    } else if (el.localName==='p' && el.namespaceURI===W_NS) {
      let t=''; for (const x of el.getElementsByTagNameNS(W_NS,'t')) if (closest(x,'p')===el) t+=x.textContent;
      t=t.replace(/\s+/g,' ').trim(); if (t) seq.push({k:'txt', t, cell:closest(el,'tc')});
    }
  }
  const good=t=>/electron|spectrum|layered|image|map|электронн|спектр|изображен|карт/i.test(t) || parseElementLine(t);
  const out=[], seen=new Set(), skipped=[];
  for (let k=0;k<seq.length;k++) {
    const it=seq[k]; if (it.k!=='img' || seen.has(it.rid)) continue; seen.add(it.rid);
    let cap='';
    if (it.cell) { const same=seq.filter(q=>q.k==='txt' && q.cell===it.cell); cap=(same.find(q=>good(q.t))||same[0])?.t||''; }
    if (!cap) { for (let j=k+1;j<seq.length && seq[j].k!=='img';j++) if (seq[j].t.length<80) { cap=seq[j].t; break; } }
    if (!cap) { for (let j=k-1;j>=0 && seq[j].k!=='img';j--) if (seq[j].t.length<80) { cap=seq[j].t; break; } }
    const target=rels[it.rid]; if (!target) continue;
    const path=('word/'+target).replace(/word\/\.\.\//,'').replace(/\/\.\//g,'/');
    const f=zip.file(path)||zip.file(target.replace(/^\//,''));
    if (!f) continue;
    const ext=extOf(path);
    if (!ACCEPTED.has(ext)) { skipped.push(cap||path); continue; }
    try {
      const blob=await f.async('blob');
      const id=await decodeFile(new File([blob], path.split('/').pop(), {type: ext==='png'?'image/png':ext==='bmp'?'image/bmp':'image/jpeg'}));
      out.push({name:cap||path.split('/').pop(), caption:cap, id});
    } catch (e) { skipped.push(cap||path); }
  }
  if (skipped.length) eds.warnings.push('Skipped '+skipped.length+' image(s) in unsupported formats (e.g. EMF): '+skipped.slice(0,4).join(', ')+'.');
  // Quantification tables (Element | … | Wt% | … | Atomic %) written as Word tables.
  const tblLines=[];
  for (const tbl of xml.getElementsByTagNameNS(W_NS,'tbl')) for (const tr of tbl.getElementsByTagNameNS(W_NS,'tr')) {
    const cells=[...tr.getElementsByTagNameNS(W_NS,'tc')].map(tc=>[...tc.getElementsByTagNameNS(W_NS,'t')].map(x=>x.textContent).join('').trim());
    tblLines.push(cells.join('\t'));
  }
  const q=parseQuantLines(tblLines);
  if (Object.keys(q).length) { edsSetQuant(q,'Word report'); edsEls.edsQOn.checked=true; }
  return out;
}

// Each .docx becomes its own group (unless the shown group is still empty). Loose images join the shown group.
async function edsAddFiles(files) {
  const list=Array.from(files); if (!list.length) return;
  if (edsAnalyzing && list.some(f=>extOf(f.name)==='docx')) { showToast('Still reading the images. Try again in a moment.'); return; }
  eds.warnings=[];
  const made=[], mark=()=>{ const g=edsGroupCur(); if (g && !made.includes(g)) made.push(g); return g; };
  for (let i=0;i<list.length;i++) {
    const f=list[i], ext=extOf(f.name);
    edsProgress(i/list.length,'Reading '+(i+1)+'/'+list.length);
    try {
      let imgs=[];
      if (ext==='docx') {
        const nm=f.name.replace(/\.[^.]+$/,'');
        if (eds.tiles.length || made.includes(edsGroupCur())) edsGroupNew(nm); else edsGroupCur().name=nm;
        mark(); imgs=await edsReadDocx(f);
      }
      else if (ext==='doc') { eds.warnings.push(f.name+': old .doc format. Open it in Word and save as .docx.'); continue; }
      else if (ACCEPTED.has(ext)) { const g=mark(); if (!g.name) g.name=f.name.replace(/\.[^.]+$/,''); imgs=[{name:f.name, caption:f.name.replace(/\.[^.]+$/,''), id:await decodeFile(f)}]; }
      else { eds.warnings.push(f.name+': unsupported file type.'); continue; }
      for (const im of imgs) {
        flattenOnWhite(im.id);
        const c=edsClassify(im.caption, im.id);
        eds.tiles.push({id:uid(), name:im.name, src:im.id, role:c.role, el:c.el, color:c.color, custom:null, bright:0, contrast:0, sharp:0, include:true, boxes:null, autoBoxes:[]});
      }
    } catch (e) { eds.warnings.push(f.name+': '+(e.message||e)); }
    await sleep(0);
  }
  edsProgress(null);
  // Read labels and scale group by group; the last group loaded stays shown.
  for (const g of made) {
    if (g.id!==eds.batch) { edsGroupStash(); edsGroupLoad(g); }
    eds.tiles.sort((a,b)=>ROLE_ORDER[a.role]-ROLE_ORDER[b.role]);
    if (!eds.sel && eds.tiles.length) eds.sel=eds.tiles[0].id;
    renderEds();
    if (eds.tiles.some(t=>!t._analyzed)) await edsAnalyzeAll();
  }
  if (!made.length) renderEds();
  edsHistReset();
}

// Burned-in software labels / scale bars: compact text-like blobs in the top or bottom band on a dark surround.
function detectOverlayBoxes(id) {
  const W=id.width, H=id.height, d=id.data, mask=new Uint8Array(W*H);
  for (let i=0,p=0;i<mask.length;i++,p+=4) mask[i]=Math.max(d[p],d[p+1],d[p+2])>90?1:0;
  // open (erode+dilate) to detach 1-2 px map specks from glyph strokes
  const er=new Uint8Array(W*H);
  for (let y=1;y<H-1;y++) for (let x=1;x<W-1;x++) { const i=y*W+x; er[i]=mask[i]&mask[i-1]&mask[i+1]&mask[i-W]&mask[i+W]; }
  const op=new Uint8Array(W*H);
  for (let y=1;y<H-1;y++) for (let x=1;x<W-1;x++) { const i=y*W+x; op[i]=er[i]|er[i-1]|er[i+1]|er[i-W]|er[i+W]; }
  const comps=connectedComponents(op,W,H);
  const inBand=c=>c.y<0.22*H || c.y+c.h>0.78*H;
  const bars=[], glyphs=[];
  for (const c of comps) {
    if (!inBand(c) || c.area<8) continue;
    const f=c.area/(c.w*c.h);
    if (c.w/c.h>=5 && c.h<=0.04*H && c.w>=0.05*W && c.w<=0.6*W && f>0.75) bars.push(c);
    else if (c.h>=0.012*H && c.h<=0.1*H && c.w<=c.h*2.5 && f>=0.12 && f<=0.92) glyphs.push(c);
  }
  glyphs.sort((a,b)=>a.x-b.x);
  const groups=[];
  for (const c of glyphs) {
    let g=groups.find(g=>{ const ov=Math.min(c.y+c.h,g.y+g.h)-Math.max(c.y,g.y); const gap=c.x-(g.x+g.w); return ov>0.4*Math.min(c.h,g.mh) && gap<=1.3*Math.max(c.h,g.mh) && gap>=-c.w; });
    if (g) { const x1=Math.max(g.x+g.w,c.x+c.w), y1=Math.max(g.y+g.h,c.y+c.h); g.x=Math.min(g.x,c.x); g.y=Math.min(g.y,c.y); g.w=x1-g.x; g.h=y1-g.y; g.n++; g.hs.push(c.h); g.mh=Math.max(g.mh,c.h); }
    else groups.push({x:c.x,y:c.y,w:c.w,h:c.h,n:1,hs:[c.h],mh:c.h});
  }
  const ringDark=(b,thr=0.3)=>{
    let n=0, br=0; const pad=Math.max(3,Math.round(b.h*0.4));
    const x0=Math.max(0,b.x-pad), x1=Math.min(W-1,b.x+b.w+pad), y0=Math.max(0,b.y-pad), y1=Math.min(H-1,b.y+b.h+pad);
    for (let y=y0;y<=y1;y+=2) for (let x=x0;x<=x1;x+=2) { if (x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h) continue; n++; br+=mask[y*W+x]; }
    return n && br/n<thr;
  };
  const boxes=[];
  for (const g of groups) {
    const mn=Math.min(...g.hs), mx=Math.max(...g.hs);
    if (g.n<2 || mx/mn>2.6 || g.w<1.2*g.h || g.w>0.4*W) continue;
    if (ringDark(g)) boxes.push(g);
  }
  for (const b of bars) if (ringDark(b,0.55)) boxes.push(b);
  return boxes.map(b=>{ const p=Math.max(2,Math.round(Math.min(b.h,20)*0.25)); return {x:Math.max(0,b.x-p), y:Math.max(0,b.y-p), w:Math.min(W,b.x+b.w+p)-Math.max(0,b.x-p), h:Math.min(H,b.y+b.h+p)-Math.max(0,b.y-p)}; });
}
function edsBoxes(t, cfg) {
  if (t.role==='spectrum') return [];
  const W=t.src.width, H=t.src.height;
  const manual=eds.erase.map(r=>({x:Math.round(r.x*W), y:Math.round(r.y*H), w:Math.max(1,Math.round(r.w*W)), h:Math.max(1,Math.round(r.h*H))}));
  if (cfg && !cfg.remove) return manual;
  if (!t.boxes) t.boxes=t.frame?[]:detectOverlayBoxes(t.src);
  return t.boxes.concat(t.autoBoxes||[], manual);
}
// Erase a box by filling it with the surrounding median color.
function fillBoxMedian(data, W, H, b) {
  const pad=3, rs=[], gs=[], bs=[];
  const x0=Math.max(0,b.x-pad), x1=Math.min(W-1,b.x+b.w+pad-1), y0=Math.max(0,b.y-pad), y1=Math.min(H-1,b.y+b.h+pad-1);
  for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++) {
    if (x>=b.x && x<b.x+b.w && y>=b.y && y<b.y+b.h) continue;
    const p=(y*W+x)*4; rs.push(data[p]); gs.push(data[p+1]); bs.push(data[p+2]);
  }
  const med=a=>{ a.sort((p,q)=>p-q); return a.length?a[a.length>>1]:0; };
  const r=med(rs), g=med(gs), bl=med(bs);
  for (let y=b.y;y<b.y+b.h;y++) for (let x=b.x;x<b.x+b.w;x++) { const p=(y*W+x)*4; data[p]=r; data[p+1]=g; data[p+2]=bl; data[p+3]=255; }
}
function edsCfg() {
  const n=(el,d)=>num(el,d);
  return {
    remove:edsEls.edsRemove.checked, showBoxes:edsEls.edsShowBoxes.checked,
    trim:{t:clamp(n(edsEls.edsTrimT,0),0,45), b:clamp(n(edsEls.edsTrimB,0),0,45), l:clamp(n(edsEls.edsTrimL,0),0,45), r:clamp(n(edsEls.edsTrimR,0),0,45)},
    labelStyle:edsEls.edsLabelStyle.value, labelColor:edsEls.edsLabelColor.value, labelPt:Math.max(1,n(edsEls.edsLabelPt,10)), margin:Math.max(0,n(edsEls.edsMargin,3))/100,
    labelBold:edsEls.edsLabelBold.checked, labelHl:edsEls.edsLabelHl.checked, labelHlColor:edsEls.edsLabelHlColor.value, labelOl:edsEls.edsLabelOl.checked, labelOlColor:edsEls.edsLabelOlColor.value,
    scaleOn:edsEls.edsScaleOn.value, scaleVal:n(edsEls.edsScaleVal,0), scaleUnit:edsEls.edsScaleUnit.value, scalePt:Math.max(1,n(edsEls.edsScalePt,10)),
    layout:edsEls.edsLayout.value, cols:Math.max(0,Math.round(n(edsEls.edsCols,0))), widthCm:Math.max(2,n(edsEls.edsWidth,17)), dpi:Number(edsEls.edsDpi.value)||300,
    gapMm:Math.max(0,n(edsEls.edsGap,1)), bg:edsEls.edsBg.value,
    qOn:edsEls.edsQOn.checked, qBasis:edsEls.edsQBasis.value, qUnit:edsEls.edsQUnit.value, qDec:Number(edsEls.edsQDec.value), qPt:Math.max(1,n(edsEls.edsQPt,9)),
    labelPos:edsEls.edsLabelPos?.value||'tl', qPos:edsEls.edsQPos?.value||'bc', scalePos:edsEls.edsScalePos?.value||'br',
  };
}
// Cleaned tile: frame removed, levels applied.
function edsProcessed(t, cfg) {
  const tr=t.role==='spectrum'?{t:0,b:0,l:0,r:0}:cfg.trim, rm=t.role!=='spectrum';
  const key=[JSON.stringify(t.frame||0),tr.t,tr.b,tr.l,tr.r,cfg.remove,t.bright,t.contrast,t.sharp||0,(t.autoBoxes||[]).length,t.role,JSON.stringify(eds.erase)].join('|');
  if (t._pk===key) return t._pc;
  const src=t.src, W=src.width, H=src.height, data=new Uint8ClampedArray(src.data);
  if (rm) for (const b of edsBoxes(t,cfg)) fillBoxMedian(data,W,H,b);
  const F=t.frame||{x:0,y:0,w:W,h:H};
  const x0=F.x+Math.round(F.w*tr.l/100), y0=F.y+Math.round(F.h*tr.t/100), cw=Math.max(8,F.w-Math.round(F.w*tr.l/100)-Math.round(F.w*tr.r/100)), ch=Math.max(8,F.h-Math.round(F.h*tr.t/100)-Math.round(F.h*tr.b/100));
  const out=new ImageData(cw,ch), od=out.data;
  for (let y=0;y<ch;y++) for (let x=0;x<cw;x++) {
    const p=((y+y0)*W+x+x0)*4, q=(y*cw+x)*4;
    od[q]=data[p]; od[q+1]=data[p+1]; od[q+2]=data[p+2]; od[q+3]=255;
  }
  // Word order: sharpness first, then brightness/contrast.
  applySharpness(od,cw,ch,t.sharp||0);
  const lut=wordLevelsLUT(t.bright,t.contrast);
  if (lut) for (let i=0;i<od.length;i+=4) { od[i]=lut[od[i]]; od[i+1]=lut[od[i+1]]; od[i+2]=lut[od[i+2]]; }
  const c=document.createElement('canvas'); c.width=cw; c.height=ch; c.getContext('2d').putImageData(out,0,0);
  t._pk=key; t._pc=c; t._crop={x0,y0};
  return c;
}
// Word-style Brightness / Contrast (both −100…+100 %).
// Brightness shifts every level by b·255 (+100 % = white, −100 % = black).
// Contrast scales around mid-grey: −100 % = flat grey, +100 % = pure black/white.
function wordContrastFactor(c) { c=clamp(c,-100,100)/100; return c>=0 ? 1/Math.max(0.004,1-c) : 1+c; }
function wordLevelsLUT(bright,contrast) {
  if (!bright && !contrast) return null;
  const f=wordContrastFactor(contrast), B=clamp(bright,-100,100)*2.55, lut=new Uint8ClampedArray(256);
  for (let v=0;v<256;v++) lut[v]=(v+B-128)*f+128;
  return lut;
}
// Word-style Sharpness (−100…+100 %): negative blurs, positive applies an unsharp mask.
function boxBlur(src,w,h,r) {
  const tmp=new Float32Array(src.length), out=new Float32Array(src.length);
  for (let y=0;y<h;y++) for (let c=0;c<3;c++) { let s=0,n=0;
    for (let x=-r;x<w;x++) { if (x+r<w) { s+=src[(y*w+x+r)*4+c]; n++; } if (x-r-1>=0) { s-=src[(y*w+x-r-1)*4+c]; n--; } if (x>=0) tmp[(y*w+x)*4+c]=s/n; } }
  for (let x=0;x<w;x++) for (let c=0;c<3;c++) { let s=0,n=0;
    for (let y=-r;y<h;y++) { if (y+r<h) { s+=tmp[((y+r)*w+x)*4+c]; n++; } if (y-r-1>=0) { s-=tmp[((y-r-1)*w+x)*4+c]; n--; } if (y>=0) out[(y*w+x)*4+c]=s/n; } }
  return out;
}
function applySharpness(d,w,h,s) {
  if (!s) return;
  const a=Math.abs(s)/100;
  if (s<0) { const b=boxBlur(d,w,h,Math.max(1,Math.round(a*3))); for (let i=0;i<d.length;i+=4) for (let c=0;c<3;c++) d[i+c]=d[i+c]+(b[i+c]-d[i+c])*Math.min(1,a*1.5); }
  else { const b=boxBlur(d,w,h,1), k=a*2.5; for (let i=0;i<d.length;i+=4) for (let c=0;c<3;c++) d[i+c]=d[i+c]+(d[i+c]-b[i+c])*k; }
}
// Auto levels: stretch the 0.5–99.5 % range to full scale, expressed as Word brightness/contrast.
function autoLevels(t) {
  const d=t.src.data, n=t.src.width*t.src.height, hist=new Uint32Array(256);
  for (let i=0,p=0;i<n;i++,p+=4) hist[Math.max(d[p],d[p+1],d[p+2])]++;
  const pct=q=>{ let acc=0, lim=n*q; for (let v=0;v<256;v++) { acc+=hist[v]; if (acc>=lim) return v; } return 255; };
  const lo=t.role==='electron'?pct(0.005):0, hi=Math.max(lo+10,pct(0.995));
  const f=255/(hi-lo);
  t.contrast=Math.round(clamp(f>=1?(1-1/f)*100:(f-1)*100,-100,100));
  const fr=wordContrastFactor(t.contrast);
  // Solve (lo+B-128)*fr+128 = 0 for B.
  t.bright=Math.round(clamp((128-128/fr-lo)/2.55,-100,100));
}
// Round to 1/2/2.5/5 × 10ⁿ for a new scale bar.
function niceValue(x) { const p=Math.pow(10,Math.floor(Math.log10(x))), m=x/p; return (m>=5?5:m>=2?2:1)*p; }
function umPerSrcPx(t) { return eds.cal ? eds.cal.umPerPx*(eds.cal.refW/t.src.width) : 0; }
function scaleTextFor(t, procW, cfg) {
  const upp=umPerSrcPx(t); if (!upp) return null;
  let um = cfg.scaleVal>0 ? cfg.scaleVal*(cfg.scaleUnit==='nm'?0.001:1) : niceValue(procW*upp*0.22);
  const text = um<1 ? fmtNum(+(um*1000).toPrecision(6))+' nm' : fmtNum(+um.toPrecision(6))+' µm';
  return {text, um, srcPx:um/upp};
}
function edsLayoutTiles(cfg) {
  const inc=eds.tiles.filter(t=>t.include), E0=inc.find(t=>t.role==='electron');
  const maps=inc.filter(t=>t!==E0 && t.role!=='spectrum'), spec=inc.filter(t=>t.role==='spectrum');
  const W=Math.round(cfg.widthCm/2.54*cfg.dpi), g=Math.round(cfg.gapMm/25.4*cfg.dpi), cells=[];
  const asp=t=>{ const c=edsProcessed(t,cfg); return c.width/c.height; };
  let y=0;
  const place=(list,x0,y0,cols,tw,th)=>list.forEach((t,i)=>cells.push({t, x:x0+(i%cols)*(tw+g), y:y0+Math.floor(i/cols)*(th+g), w:tw, h:th}));
  if (cfg.layout==='row') {
    const all=(E0?[E0]:[]).concat(maps);
    if (all.length) { const sum=all.reduce((a,t)=>a+asp(t),0), th=(W-g*(all.length-1))/sum; let x=0; for (const t of all) { const tw=asp(t)*th; cells.push({t,x,y,w:tw,h:th}); x+=tw+g; } y=th+g; }
  } else if (cfg.layout==='left' && E0 && maps.length) {
    const n=maps.length, r=cfg.cols?Math.ceil(n/cfg.cols):(n<=2?1:n<=6?2:3), c=cfg.cols||Math.ceil(n/r), aM=asp(maps[0]), aE=asp(E0);
    const tw=(W-g*c-aE*(r-1)*g)/(aE*r/aM+c), th=tw/aM, hb=r*th+(r-1)*g, wb=aE*hb;
    cells.push({t:E0, x:0, y:0, w:wb, h:hb});
    place(maps, wb+g, 0, c, tw, th); y=hb+g;
  } else {
    const all=(E0?[E0]:[]).concat(maps);
    if (all.length) {
      const c=cfg.cols||Math.min(all.length, Math.ceil(Math.sqrt(all.length*1.5))), tw=(W-(c-1)*g)/c, th=tw/asp(maps[0]||E0);
      place(all,0,0,c,tw,th); y=Math.ceil(all.length/c)*(th+g);
    }
  }
  for (const t of spec) { const th=W/asp(t); cells.push({t, x:0, y, w:W, h:th}); y+=th+g; }
  return {W, H:Math.max(1,Math.round(y-g)), cells, E0};
}
// Whether this tile carries the scale bar (all / first / electron image).
function scaleShownOn(t, L, cfg) {
  if (!eds.cal || cfg.scaleOn==='none' || t.role==='spectrum') return false;
  if (cfg.scaleOn==='all') return true;
  const first=L.E0 || L.cells.find(c=>c.t.role!=='spectrum')?.t;
  return t===first;
}
// Box position on a tile: moved by hand (t.pos[kind], top-left as a fraction of the tile) or one of six presets (tl, tc, tr, bl, bc, br).
function edsPlace(t, kind, pos, W, H, bw, bh, mg) {
  const m=t.pos?.[kind];
  if (m) return {x:Math.round(clamp(m.x*W,0,Math.max(0,W-bw))), y:Math.round(clamp(m.y*H,0,Math.max(0,H-bh)))};
  const v=pos[0], hz=pos[1];
  return {x:Math.round(hz==='l'?mg:hz==='c'?(W-bw)/2:W-mg-bw), y:Math.round(v==='t'?mg:H-mg-bh)};
}
function renderTile(t, outW, outH, pxPerPt, cfg, withScale) {
  const proc=edsProcessed(t,cfg), c=document.createElement('canvas'); c.width=Math.max(1,Math.round(outW)); c.height=Math.max(1,Math.round(outH));
  const ctx=c.getContext('2d'); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
  ctx.drawImage(proc,0,0,c.width,c.height);
  const k=c.width/proc.width, sc=settings(), fam=sc.fontFamily, hits=c._hits=[];
  if (cfg.showBoxes || eds.eraseTool) {
    ctx.save(); ctx.strokeStyle='#ff3b30'; ctx.lineWidth=Math.max(1.5,c.width/300);
    for (const b of edsBoxes(t,cfg)) ctx.strokeRect((b.x-t._crop.x0)*k,(b.y-t._crop.y0)*k,b.w*k,b.h*k);
    ctx.restore();
  }
  const label=tileLabel(t,cfg);
  if (label && t.role!=='spectrum') {
    const fs=Math.max(4,Math.round(cfg.labelPt*pxPerPt)), color=cfg.labelColor==='map'?t.color:cfg.labelColor==='black'?'#000000':'#ffffff';
    const o={text:label, bold:cfg.labelBold, italic:false, font:'', color, outline:cfg.labelOl, outlineColor:cfg.labelOlColor};
    const lay=layoutRich(ctx,o,fs,sc), mg=Math.round(cfg.margin*c.width), pad=cfg.labelHl?Math.max(2,Math.round(fs*0.2)):0;
    const bw=Math.ceil(lay.w)+2*pad, bh=Math.ceil(lay.h)+2*pad, P=edsPlace(t,'label',cfg.labelPos,c.width,c.height,bw,bh,mg);
    if (pad) { ctx.fillStyle=cfg.labelHlColor; ctx.fillRect(P.x,P.y,bw,bh); }
    drawRich(ctx,lay,P.x+pad,P.y+pad,o); hits.push({kind:'label', x:P.x, y:P.y, w:bw, h:bh});
  }
  // Element content (wt.% / at.%) at the bottom center.
  const qt=edsQuantText(t,cfg,sc);
  if (qt) {
    const fs=Math.max(4,Math.round(cfg.qPt*pxPerPt)), color=cfg.labelColor==='map'?t.color:cfg.labelColor==='black'?'#000000':'#ffffff';
    const o={text:qt, bold:cfg.labelBold, italic:false, font:'', color, outline:cfg.labelOl, outlineColor:cfg.labelOlColor};
    const lay=layoutRich(ctx,o,fs,sc), mg=Math.round(cfg.margin*c.width), pad=cfg.labelHl?Math.max(2,Math.round(fs*0.2)):0;
    const bw=Math.ceil(lay.w)+2*pad, bh=Math.ceil(lay.h)+2*pad, P=edsPlace(t,'q',cfg.qPos,c.width,c.height,bw,bh,mg), bx=P.x, by=P.y;
    if (pad) { ctx.fillStyle=cfg.labelHlColor; ctx.fillRect(bx,by,bw,bh); }
    drawRich(ctx,lay,bx+pad,by+pad,o); hits.push({kind:'q', x:bx, y:by, w:bw, h:bh});
  }
  if (withScale) {
    const st=scaleTextFor(t,proc.width,cfg);
    if (st) {
      const barW=Math.max(1,Math.round(st.srcPx*k)), fs=Math.max(4,Math.round(cfg.scalePt*pxPerPt));
      const text=displayScale(st.text,sc), font=fontSpec(fs,sc.fontWeight,sc.italic,fam);
      ctx.font=font; const tm=ctx.measureText(text), asc=Math.ceil(tm.actualBoundingBoxAscent||fs*0.72), des=Math.ceil(tm.actualBoundingBoxDescent||fs*0.2);
      const th=Math.max(2,Math.round(fs*sc.barThickness)), gap=Math.max(1,Math.round(fs*sc.gap)), gw=Math.max(barW,Math.ceil(tm.width)), gh=asc+des+gap+th;
      const mg=Math.round(Math.max(cfg.margin,0.02)*c.width), pad=sc.scaleHl?Math.max(2,Math.round(fs*0.3)):0;
      const P=edsPlace(t,'scale',cfg.scalePos,c.width,c.height,gw+2*pad,gh+2*pad,mg), bx=P.x, by=P.y, left=bx+pad, top=by+pad, fg=sc.color==='black'?'#000':'#fff';
      if (pad) { ctx.fillStyle=sc.scaleHlColor; ctx.fillRect(bx,by,gw+2*pad,gh+2*pad); }
      let barY, base; if (sc.barBelow) { base=top+asc; barY=top+asc+des+gap; } else { barY=top; base=top+th+gap+asc; }
      const sow=sc.scaleOl?Math.max(1,Math.round(fs*0.08)):0, bxl=Math.round(left+(gw-barW)/2);
      if (sow) { ctx.fillStyle=sc.scaleOlColor; ctx.fillRect(bxl-sow,barY-sow,barW+2*sow,th+2*sow); }
      drawLabel(ctx,text,left+gw/2,base,font,'center',fg,sc.scaleOlColor,sow);
      ctx.fillStyle=fg; ctx.fillRect(bxl,barY,barW,th);
      hits.push({kind:'scale', x:bx, y:by, w:gw+2*pad, h:gh+2*pad});
    }
  }
  return c;
}
function renderEdsFigure(cfg) {
  const L=edsLayoutTiles(cfg), cv=document.createElement('canvas'); cv.width=L.W; cv.height=L.H;
  const ctx=cv.getContext('2d'); ctx.fillStyle=cfg.bg==='black'?'#000':'#fff'; ctx.fillRect(0,0,cv.width,cv.height);
  const ppt=cfg.dpi/72;
  for (const cell of L.cells) {
    const proc=edsProcessed(cell.t,cfg), a=proc.width/proc.height;
    let dw=cell.w, dh=cell.h; if (a>dw/dh) dh=dw/a; else dw=dh*a;
    cell.dx=cell.x+(cell.w-dw)/2; cell.dy=cell.y+(cell.h-dh)/2; cell.dw=dw; cell.dh=dh;
    const tc=renderTile(cell.t,dw,dh,ppt,cfg,scaleShownOn(cell.t,L,cfg)), ox=Math.round(cell.dx), oy=Math.round(cell.dy);
    ctx.drawImage(tc, ox, oy);
    cell.ox=ox; cell.oy=oy; cell.tw=tc.width; cell.th=tc.height; cell.hits=tc._hits.map(h=>({...h, x:h.x+ox, y:h.y+oy}));
  }
  return {canvas:cv, L};
}
function renderEds() {
  const has=eds.tiles.length>0, cfg=edsCfg();
  const cv=edsEls.edsCalVal;
  if (cv) { if (!cv._ocrL) { cv._ocrL=1; cv.addEventListener('input',()=>{ eds.calConf=null; cv.classList.remove('ocr-unsure-input'); cv.title=''; }); }
    const u=ocrWarnOn() && !!eds.cal && eds.calConf!=null && eds.calConf<OCR_CONF_MIN; cv.classList.toggle('ocr-unsure-input',u);
    cv.title=u?(window.semI18n?.t('OCR is not sure about the scale value. Check it.')??'')+' ('+Math.round(eds.calConf)+'%)':''; }
  edsEls.edsEmpty.hidden=has; edsEls.edsCard.hidden=!has;
  renderEdsGroups(); renderEdsList(); syncEdsSel();
  edsEls.edsCalStatus.textContent=eds.cal ? fmtNum(+(eds.cal.umPerPx*1000).toPrecision(4))+' nm/px' : 'not calibrated';
  const inc=eds.tiles.filter(t=>t.include);
  [edsEls.edsSaveFig,edsEls.edsSaveMaps,edsEls.edsSendMaps,edsEls.edsSendFig].forEach(b=>b.disabled=!inc.length);
  const warns=[...eds.warnings];
  if (has && !eds.cal && cfg.scaleOn!=='none') warns.push('No scale bar yet: enter a known length on the electron image or use Auto read.');
  edsEls.edsWarn.hidden=!warns.length; edsEls.edsWarn.textContent=warns.join('\n');
  if (!inc.length) { eds.canvas=null; eds.cells=[]; edsEls.edsSummary.textContent=has?'All images are excluded.':'No images yet.'; return; }
  const r=renderEdsFigure(cfg); eds.canvas=r.canvas; eds.cells=r.L.cells;
  paintEds();
  edsEls.edsDims.textContent=r.canvas.width+' × '+r.canvas.height+'px';
  const nm=inc.filter(t=>t.role==='map').length;
  edsEls.edsSummary.textContent=nm+' map(s)'+(r.L.E0?' + electron image':'')+' • '+fmtNum(+cfg.widthCm.toFixed(1))+' × '+fmtNum(+(r.canvas.height/cfg.dpi*2.54).toFixed(1))+' cm at '+cfg.dpi+' dpi';
}
function paintEds() {
  const d=edsEls.edsCanvas, src=eds.canvas; if (!src) return;
  if (d.width!==src.width || d.height!==src.height) { d.width=src.width; d.height=src.height; }
  const ctx=d.getContext('2d'); ctx.drawImage(src,0,0);
  const cell=eds.cells.find(c=>c.t.id===eds.sel);
  if (cell) { const k=displayK(d); ctx.save(); ctx.strokeStyle='#3b82f6'; ctx.lineWidth=3*k; ctx.setLineDash([8*k,5*k]); ctx.strokeRect(cell.dx+1.5*k,cell.dy+1.5*k,cell.dw-3*k,cell.dh-3*k); ctx.restore();
    // Box moved by the keyboard: outlined while the preview has focus.
    const h=document.activeElement===d && (cell.hits||[]).find(x=>x.kind===eds.activeKind);
    if (h) { ctx.save(); ctx.strokeStyle='#f59e0b'; ctx.lineWidth=2*k; ctx.setLineDash([4*k,3*k]); ctx.strokeRect(h.x-2*k,h.y-2*k,h.w+4*k,h.h+4*k); ctx.restore(); } }
}
function renderEdsList() {
  const L=edsEls.edsList; L.innerHTML='';
  const cfg=edsCfg();
  eds.tiles.forEach((t,k)=>{
    const row=document.createElement('div'); row.className='comp-row'+(t.id===eds.sel?' active':'')+(t.include?'':' off');
    const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=t.include; cb.setAttribute('aria-label','Include');
    cb.onchange=()=>{ t.include=cb.checked; renderEds(); };
    const th=document.createElement('canvas'); th.className='comp-thumb'; const tw=112, thh=Math.max(1,Math.round(tw*t.src.height/t.src.width)); th.width=tw; th.height=thh;
    // The small thumbnail is made once per tile; the list is rebuilt on every slider move.
    if (!t._thumb) { const tc=document.createElement('canvas'); tc.width=t.src.width; tc.height=t.src.height; tc.getContext('2d').putImageData(t.src,0,0);
      t._thumb=document.createElement('canvas'); t._thumb.width=tw; t._thumb.height=thh; t._thumb.getContext('2d').drawImage(tc,0,0,tw,thh); }
    th.getContext('2d').drawImage(t._thumb,0,0);
    const nm=document.createElement('span'); nm.className='comp-name'; nm.title=t.name;
    if (t.role==='map' || t.role==='layered') { const sw=document.createElement('span'); sw.className='swatch'; sw.style.background=t.color; nm.appendChild(sw); }
    nm.appendChild(document.createTextNode((tileLabel(t,cfg)||t.name).replace(/<[^>]+>/g,'')));
    const tag=document.createElement('span'); tag.className='role-tag'; tag.textContent=ROLE_NAMES[t.role]; nm.appendChild(tag);
    if (ocrWarnOn() && t.el && t.elConf!=null && t.elConf<OCR_CONF_MIN) { const w=document.createElement('span'); w.className='ocr-dot'; w.textContent='?'; w.title=(window.semI18n?.t('OCR is not sure about this element name. Check the label.')??'')+' ('+Math.round(t.elConf)+'%)'; nm.appendChild(w); }
    const mk=(txt,dir)=>{ const b=document.createElement('button'); b.type='button'; b.className='btn ghost icon-btn'; b.textContent=txt; b.disabled=(dir<0&&k===0)||(dir>0&&k===eds.tiles.length-1);
      b.onclick=e=>{ e.stopPropagation(); const j=k+dir; [eds.tiles[k],eds.tiles[j]]=[eds.tiles[j],eds.tiles[k]]; renderEds(); }; return b; };
    row.onclick=e=>{ if (e.target.closest('button,input')) return; eds.sel=t.id; renderEdsList(); syncEdsSel(); paintEds(); };
    row.append(cb,th,nm,mk('↑',-1),mk('↓',1));
    L.appendChild(row);
  });
}
function edsSelTile() { return eds.tiles.find(t=>t.id===eds.sel)||null; }
function syncEdsSel() {
  const t=edsSelTile(); edsEls.edsSelCard.hidden=!t; if (!t) return;
  edsEls.edsSelName.textContent=t.name.length>28?t.name.slice(0,28)+'…':t.name;
  setVal(edsEls.edsRole,t.role); setVal(edsEls.edsColor,t.color); setVal(edsEls.edsLabel,tileLabel(t,edsCfg()));
  setVal(edsEls.edsBright,t.bright); setVal(edsEls.edsBrightN,t.bright); setVal(edsEls.edsContrast,t.contrast); setVal(edsEls.edsContrastN,t.contrast); setVal(edsEls.edsSharp,t.sharp||0); setVal(edsEls.edsSharpN,t.sharp||0);
}
let edsTimer=null;
function scheduleEds(d=120) { clearTimeout(edsTimer); edsTimer=setTimeout(renderEds,d); }

// AZtec "framed" tiles: frame (grey, or the plain margin colour), title (element) above the map, ruler scale bar + value below.
// Measured inside the content box, so a map with wide white margins is found too.
function edsDetectFrame(t) {
  const id=t.src, W=id.width, H=id.height, d=id.data;
  const cs=[]; for (const [cx,cy] of [[1,1],[W-2,1],[1,H-2],[W-2,H-2]]) { const p=(cy*W+cx)*4; cs.push([d[p],d[p+1],d[p+2]]); }
  const fr=[0,1,2].map(k=>cs.map(c=>c[k]).sort((a,b)=>a-b)[1]);
  const spread=Math.max(...cs.map(c=>Math.abs(c[0]-fr[0])+Math.abs(c[1]-fr[1])+Math.abs(c[2]-fr[2])));
  if (spread>30) return null;
  const cb=t._cb||(t._cb=edsContentBox(id)), CX=cb.x, CW=cb.w, CY=cb.y, CH=cb.h;
  const diff=p=>Math.max(Math.abs(d[p]-fr[0]),Math.abs(d[p+1]-fr[1]),Math.abs(d[p+2]-fr[2]))>28;
  const rowF=new Float32Array(H); for (let y=CY;y<CY+CH;y++) { let c=0; for (let x=CX;x<CX+CW;x++) if (diff((y*W+x)*4)) c++; rowF[y]=c/CW; }
  let best=null; for (let y=CY;y<CY+CH;) { if (rowF[y]<0.55) { y++; continue; } let e=y; while (e<CY+CH && rowF[e]>=0.55) e++; if (!best || e-y>best[1]-best[0]) best=[y,e]; y=e; }
  if (!best || best[1]-best[0]<0.4*CH || best[0]-CY<3 || CY+CH-best[1]<3) return null;
  const [y0,y1]=best, colF=new Float32Array(W);
  for (let x=CX;x<CX+CW;x++) { let c=0; for (let y=y0;y<y1;y++) if (diff((y*W+x)*4)) c++; colF[x]=c/(y1-y0); }
  let x0=CX; while (x0<CX+CW && colF[x0]<0.55) x0++; let x1=CX+CW-1; while (x1>x0 && colF[x1]<0.55) x1--;
  if (x1-x0<0.5*CW) return null;
  const fl=(77*fr[0]+150*fr[1]+29*fr[2])>>8, gray=imageDataToGray(id);
  const bandBox=(ya,yb)=>{ let a=W,b=-1,c=H,e=-1; for (let y=ya;y<yb;y++) for (let x=0;x<W;x++) if (Math.abs(gray[y*W+x]-fl)>45) { if (x<a)a=x; if (x>b)b=x; if (y<c)c=y; if (y>e)e=y; } return b<0?null:{x:a,y:c,w:b-a+1,h:e-c+1}; };
  return {frame:{x:x0,y:y0,w:x1-x0+1,h:y1-y0}, title:bandBox(0,y0), bottomY:y1, frameLum:fl};
}
// OCR the element name printed on a framed tile.
async function edsReadTitle(t, info) {
  if (!info.title || info.title.h<4) return null;
  const worker=await getOCRWorker();
  await worker.setParameters({tessedit_pageseg_mode:'7', tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_ '});
  const prep=prepareOCRCanvas(t.src,info.title,56,info.title.h);
  const res=await worker.recognize(prep.canvas);
  t.elConf=res?.data?.confidence??null;
  return (res?.data?.text||'').trim();
}
// Read the scale bar and value from a framed tile.
async function edsReadFramedScale(t, info) {
  const id=t.src, W=id.width, H=id.height, y0=info.bottomY, fh=H-y0; if (fh<6) return null;
  const gray=imageDataToGray(id), mask=new Uint8Array(W*fh);
  for (let i=0;i<mask.length;i++) mask[i]=Math.abs(gray[y0*W+i]-info.frameLum)>45?1:0;
  const comps=connectedComponents(mask,W,fh);
  const bar=detectSolidBar(mask,comps,W,fh)||detectRulerBar(mask,W,fh); if (!bar) return null;
  const labelCands=labelCandidates(comps,W,fh,y0,bar);
  const fake={imageData:id, analysis:{footerDetected:true, footerY:y0, bar:{x:bar.x,y:y0+bar.y,w:bar.w,h:bar.h}, labelCands, notes:[]}};
  const ocr=await readScaleOCR(fake); const p=parseScaleText(ocr.normalized);
  if (p.fam==='len') eds.calConf=ocr.conf??null;
  return p.fam==='len' ? {um:p.um, px:bar.w, text:ocr.normalized, value:p.value, unit:p.unit} : null;
}
let edsAnalyzing=false;
// Find the map area of one tile and read its title (element) and scale bar.
// opts.force: read again even if values exist; opts.keepRole: the user chose the type, do not change it.
async function edsAnalyzeTile(t, opts={}) {
  t._analyzed=true; const gen=eds.gen;
  const info=edsDetectFrame(t);
  if (!info) return {frame:false};
  t.frame=info.frame; t.boxes=[]; t._pk=null;
  t.color=pixelStats(t.src).color;
  let readEl=false, readScale=false;
  // Type set to Spectrum by hand: nothing to read.
  if (opts.keepRole && t.role==='spectrum') { t.frame=null; t.boxes=null; t._pk=null; return {frame:false}; }
  if (t.custom==null && (opts.force || !t.el)) { try { const raw=await edsReadTitle(t,info); let el=parseElementLine(raw);
    // Last resort: the title starts with an element symbol (“CrlLal_ 2”).
    if (!el && raw && !/electron|image|spectr|layer|map|sum/i.test(raw)) { const m=raw.trim().match(/^([A-Z][a-z]?)/); if (m && ELEMENTS.has(m[1])) { const ln=raw.slice(m[1].length).match(/([KLM])\s*a/i); el={el:m[1], line:ln?ln[1].toUpperCase()+'α1':''}; } }
    if (el) { t.el=el; readEl=true; if (!opts.keepRole && (t.role==='electron' || t.role==='spectrum')) t.role='map'; }
    else if (!opts.keepRole && raw && /electron|image|SE|BSE/i.test(raw) && t.role!=='spectrum') t.role='electron'; } catch (_) {} }
  // A spectrum is shown whole: drop the map area found on it.
  if (t.role==='spectrum') { t.frame=null; t.boxes=null; t._pk=null; return {frame:false}; }
  if (!eds.cal || opts.force) { try { const sc=await edsReadFramedScale(t,info); if (sc && gen===eds.gen) { readScale=true; eds.cal={umPerPx:sc.um/sc.px, refW:t.src.width}; setVal(edsEls.edsCalVal,fmtNum(sc.value)); edsEls.edsCalUnit.value=sc.unit==='nm'?'nm':'µm'; setVal(edsEls.edsCalPx,sc.px); showToast('Scale read from the map: '+sc.text+' = '+sc.px+' px.'); } } catch (_) {} }
  return {frame:true, readEl, readScale};
}
async function edsAnalyzeAll() {
  if (edsAnalyzing) return; edsAnalyzing=true;
  try {
    // Repeat until no tile is left: files added while this runs are picked up too; after Clear the old list is dropped.
    for (let todo; (todo=eds.tiles.filter(t=>!t._analyzed)).length;) {
      const gen=eds.gen;
      for (let i=0;i<todo.length && gen===eds.gen;i++) {
        edsProgress(i/todo.length,'Reading labels '+(i+1)+'/'+todo.length);
        const r=await edsAnalyzeTile(todo[i]); if (r.frame && gen===eds.gen) renderEds();
      }
    }
    eds.tiles.sort((a,b)=>ROLE_ORDER[a.role]-ROLE_ORDER[b.role]);
  } finally { edsAnalyzing=false; edsProgress(null); renderEds(); }
  if (!eds.cal && eds.tiles.some(t=>t.role==='electron')) await edsAutoCal(false);
  // Element content drawn inside the spectrum picture (no Word table): read it now.
  if (!Object.keys(parseQuantBox(edsEls.edsQText.value)).length && eds.tiles.some(t=>t.role==='spectrum')) {
    try { await edsReadQuantOCR(true); } catch (_) {}
  }
}
// Type changed by hand, or “Read label and scale again”.
async function edsReanalyze(t, force) {
  if (edsAnalyzing) { showToast('Still reading the images. Try again in a moment.'); return; }
  edsAnalyzing=true; edsProgress(0,'Reading label and scale');
  let r;
  try { t.frame=null; t.boxes=null; t._pk=null; r=await edsAnalyzeTile(t,{force, keepRole:true}); }
  finally { edsAnalyzing=false; edsProgress(null); renderEds(); }
  if (t.role==='spectrum') return;
  if (!r.frame) { if (force) showToast('No map area with a title or scale bar found on this image. Type the label and scale by hand.',4600); return; }
  if (force && !r.readEl && !r.readScale) showToast('Map area found, but no label or scale bar could be read.',4200);
}

// Calibrate all maps from the electron image or any tile with a readable scale.
async function edsAutoCal(verbose=true) {
  const t=eds.tiles.find(x=>x.role==='electron' && x.include) || eds.tiles.find(x=>x.role==='electron');
  if (!t) { if (verbose) showToast('No electron image found. Set an image type to “Electron image” first.',4200); return; }
  const id=t.src, W=id.width, H=id.height, gray=imageDataToGray(id), gen=eds.gen;
  edsEls.edsCalStatus.textContent='reading…';
  try {
    for (const frac of [0.25,0.45]) for (const bright of [true,false]) {
      const y0=Math.floor(H*(1-frac)), fh=H-y0, mask=new Uint8Array(W*fh);
      for (let i=0;i<mask.length;i++) { const v=gray[y0*W+i]; mask[i]=bright?(v>=200?1:0):(v<=40?1:0); }
      const comps=connectedComponents(mask,W,fh);
      if (comps.length>4000) continue;
      const bar=detectSolidBar(mask,comps,W,fh); if (!bar || bar.w<0.04*W) continue;
      const labelCands=labelCandidates(comps,W,fh,y0,bar);
      const fake={imageData:id, analysis:{footerDetected:true, footerY:y0, bar:{x:bar.x,y:y0+bar.y,w:bar.w,h:bar.h}, labelCands, notes:[]}};
      let ocr; try { ocr=await readScaleOCR(fake); } catch (_) { continue; }
      const p=parseScaleText(ocr.normalized); if (p.fam!=='len') continue;
      if (gen!==eds.gen) return;
      eds.cal={umPerPx:p.um/bar.w, refW:W}; eds.calConf=ocr.conf??null;
      const pad=3, box=b=>({x:Math.max(0,b.x-pad), y:Math.max(0,b.y-pad), w:Math.min(W-b.x+pad,b.w+2*pad), h:Math.min(H-b.y+pad,b.h+2*pad)});
      t.autoBoxes=[box({x:bar.x,y:y0+bar.y,w:bar.w,h:bar.h}), ...labelCands.slice(0,1).map(box)];
      setVal(edsEls.edsCalVal,fmtNum(p.value)); edsEls.edsCalUnit.value=p.unit==='nm'?'nm':'µm'; setVal(edsEls.edsCalPx,bar.w);
      renderEds(); showToast('Scale read from the electron image: '+ocr.normalized+' = '+bar.w+' px.');
      return;
    }
    throw new Error('no bar');
  } catch (e) {
    renderEds();
    if (verbose) showToast('Could not read the scale bar automatically. Enter the known length and its length in px.',4600);
  }
}

// ---- EDS tab events ----
edsEls.edsFile.addEventListener('change',e=>{ edsAddFiles(e.target.files); e.target.value=''; });
['dragenter','dragover'].forEach(tp=>edsEls.edsDrop.addEventListener(tp,e=>{ e.preventDefault(); edsEls.edsDrop.classList.add('dragover'); }));
['dragleave','drop'].forEach(tp=>edsEls.edsDrop.addEventListener(tp,e=>{ e.preventDefault(); edsEls.edsDrop.classList.remove('dragover'); }));
edsEls.edsDrop.addEventListener('drop',e=>edsAddFiles(e.dataTransfer.files));
edsEls.edsDrop.addEventListener('keydown',e=>{ if (e.key==='Enter'||e.key===' ') { e.preventDefault(); edsEls.edsFile.click(); } });
// Clear removes the shown group only (with its element content); the other groups stay.
edsEls.edsClear.onclick=()=>edsGroupRemove(eds.batch);
edsEls.edsEraseTool.onclick=()=>{
  eds.eraseTool=!eds.eraseTool; edsEls.edsEraseTool.classList.toggle('active',eds.eraseTool); edsEls.edsEraseTool.setAttribute('aria-pressed',String(eds.eraseTool)); renderEds();
};
edsEls.edsEraseClear.onclick=()=>{ eds.erase=[]; renderEds(); };
const withSel=fn=>()=>{ const t=edsSelTile(); if (!t) return; fn(t); scheduleEds(60); };
const edsReanalyzeSafe=(t,force)=>edsReanalyze(t,force).catch(e=>showToast('Reading failed: '+(e.message||e),4000));
edsEls.edsRole.addEventListener('change',withSel(t=>{ t.role=edsEls.edsRole.value; t._pk=null; edsReanalyzeSafe(t,false); }));
E('edsReread')?.addEventListener('click',()=>{ const t=edsSelTile(); if (t) edsReanalyzeSafe(t,true); });
// Start the OCR engine in the background when the EDS tab opens, so the first reading does not wait for it.
document.querySelector('.tab[data-tab="eds"]')?.addEventListener('click',()=>{ if (typeof getOCRWorker==='function') getOCRWorker().catch(()=>{}); });
edsEls.edsColor.addEventListener('input',withSel(t=>{ t.color=edsEls.edsColor.value; }));
// A typed label also sets the element, so the element content from the Values box appears on this map.
edsEls.edsLabel.addEventListener('input',withSel(t=>{ t.custom=edsEls.edsLabel.value; const e=parseElementLine(t.custom.replace(/<[^>]+>/g,'')); if (e) { t.el=e; if (t.role==='electron'||t.role==='spectrum') t.role='map'; } }));
const linkRange=(r,n,key)=>{ r.addEventListener('input',withSel(t=>{ t[key]=Number(r.value); n.value=r.value; })); n.addEventListener('input',withSel(t=>{ const v=Number(n.value); if (isFinite(v)) { t[key]=clamp(v,Number(n.min),Number(n.max)); r.value=t[key]; } })); };
linkRange(edsEls.edsBright,edsEls.edsBrightN,'bright'); linkRange(edsEls.edsContrast,edsEls.edsContrastN,'contrast'); linkRange(edsEls.edsSharp,edsEls.edsSharpN,'sharp');
edsEls.edsLvAll.onclick=withSel(t=>{ for (const x of eds.tiles) if (x!==t && x.role!=='spectrum') { x.bright=t.bright; x.contrast=t.contrast; x.sharp=t.sharp||0; } renderEds(); showToast('Brightness, contrast and sharpness applied to all maps.'); });
edsEls.edsAuto.onclick=withSel(t=>{ autoLevels(t); syncEdsSel(); });
edsEls.edsAutoAll.onclick=()=>{ eds.tiles.filter(t=>t.role==='map'||t.role==='layered').forEach(autoLevels); syncEdsSel(); renderEds(); };
edsEls.edsResetLv.onclick=withSel(t=>{ t.bright=0; t.contrast=0; t.sharp=0; syncEdsSel(); });
edsEls.edsLabelToolbar.querySelectorAll('button').forEach(b=>{
  b.addEventListener('mousedown',e=>e.preventDefault());
  if (b.hasAttribute('data-greek-toggle')) { b.addEventListener('click',()=>rtGreekToggle(b)); return; }
  b.addEventListener('click',()=>{
    const ta=edsEls.edsLabel, st=ta.selectionStart??ta.value.length, en=ta.selectionEnd??st, v=ta.value;
    if (b.dataset.ins) { ta.value=v.slice(0,st)+b.dataset.ins+v.slice(en); ta.focus(); ta.setSelectionRange(st+1,st+1); }
    else { const tg=b.dataset.wrap, sel=v.slice(st,en)||'2'; ta.value=v.slice(0,st)+'<'+tg+'>'+sel+'</'+tg+'>'+v.slice(en); ta.focus(); }
    ta.dispatchEvent(new Event('input'));
  });
});
