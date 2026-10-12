// =====================================================================
// Micrograph Figure Kit — 24. Measurements
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Distance, angle, particle (ellipse) and polygon; table, statistics, CSV.
// =====================================================================
// Points are stored in source-image pixels, so they stay on the same features when the crop changes.
const MEAS_TYPES={dist:'Distance', angle:'Angle', ellipse:'Particle', poly:'Polygon'};
const MEAS_HINTS={dist:'Drag from one end to the other, or click two points.', angle:'Click three points: first arm, vertex, second arm.', ellipse:'Drag a box around the particle.', poly:'Click points along the outline. Double-click, press Enter or click the first point to close.'};
const measState={tool:null, draft:null, drag:null, sel:null, justDragged:false};
function measUmPerPx(it) {
  if (!it || it.noScale || !it.sourceScaleText) return null;
  try { const p=parseScaleText(it.sourceScaleText), bar=originalBarPx(it); return p.fam==='len' && bar>0 ? p.um/bar : null; } catch(_) { return null; }
}
function measCalc(m, k) {
  const P=m.pts, r={};
  if (m.type==='dist') { r.px=Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1]); if (k) r.len=r.px*k; }
  else if (m.type==='angle') { const a=Math.atan2(P[0][1]-P[1][1],P[0][0]-P[1][0]), b=Math.atan2(P[2][1]-P[1][1],P[2][0]-P[1][0]); let d=Math.abs(a-b)*180/Math.PI; if (d>180) d=360-d; r.deg=d; }
  else if (m.type==='ellipse') { const A=Math.abs(P[1][0]-P[0][0])/2, B=Math.abs(P[1][1]-P[0][1])/2; r.pxArea=Math.PI*A*B; r.pxD=2*Math.sqrt(A*B); r.pxMaj=2*Math.max(A,B); r.pxMin=2*Math.min(A,B); r.pxPer=Math.PI*(3*(A+B)-Math.sqrt((3*A+B)*(A+3*B))); /* Ramanujan */ if (k) { r.area=r.pxArea*k*k; r.d=r.pxD*k; r.maj=r.pxMaj*k; r.min=r.pxMin*k; r.per=r.pxPer*k; } }
  else { let s=0, per=0; for (let i=0;i<P.length;i++) { const [x1,y1]=P[i], [x2,y2]=P[(i+1)%P.length]; s+=x1*y2-x2*y1; per+=Math.hypot(x2-x1,y2-y1); } r.pxArea=Math.abs(s)/2; r.pxPer=per; r.pxD=2*Math.sqrt(r.pxArea/Math.PI); if (k) { r.area=r.pxArea*k*k; r.per=per*k; r.d=r.pxD*k; } }
  return r;
}
function measComma(cfg) { return cfg.decimal==='comma' || (cfg.decimal==='auto' && cfg.unitLang==='ru'); }
function measNum(v, cfg) { const a=Math.abs(v), s=a>=100?v.toFixed(0):a>=10?v.toFixed(1):a>=1?v.toFixed(2):String(+v.toPrecision(3)); return measComma(cfg)?s.replace('.',','):s; }
function measU(u, cfg) { return (UNIT_LABELS[cfg.unitLang==='ru'?'ru':'en']||UNIT_LABELS.en)[u]||u; }
function measLen(um, cfg) { let v=um, u='µm'; if (um<1) { v=um*1000; u='nm'; } else if (um>=1000) { v=um/1000; u='mm'; } return measNum(v,cfg)+' '+measU(u,cfg); }
function measArea(um2, cfg) { return um2<0.01 ? measNum(um2*1e6,cfg)+' '+measU('nm',cfg)+'²' : measNum(um2,cfg)+' '+measU('µm',cfg)+'²'; }
function measMain(m, r, cfg) {
  if (m.type==='angle') return measNum(r.deg,cfg)+'°';
  if (m.type==='dist') return r.len!=null?measLen(r.len,cfg):measNum(r.px,cfg)+' px';
  return '⌀ '+(r.d!=null?measLen(r.d,cfg):measNum(r.pxD,cfg)+' px');
}
function measDetail(m, r, cfg) {
  if (m.type==='ellipse') return r.area!=null?'A = '+measArea(r.area,cfg)+'; P = '+measLen(r.per,cfg)+'; '+measLen(r.maj,cfg)+' × '+measLen(r.min,cfg):'A = '+measNum(r.pxArea,cfg)+' px²; P = '+measNum(r.pxPer,cfg)+' px';
  if (m.type==='poly') return r.area!=null?'A = '+measArea(r.area,cfg)+'; P = '+measLen(r.per,cfg):'A = '+measNum(r.pxArea,cfg)+' px²; P = '+measNum(r.pxPer,cfg)+' px';
  if (m.type==='dist') return Math.round(r.px)+' px';
  return '';
}
function measPath(ctx, m, ox, oy) {
  const P=m.pts.map(p=>[p[0]-ox,p[1]-oy]); ctx.beginPath();
  if (m.type==='ellipse' && P.length>1) { ctx.ellipse((P[0][0]+P[1][0])/2,(P[0][1]+P[1][1])/2,Math.max(0.5,Math.abs(P[1][0]-P[0][0])/2),Math.max(0.5,Math.abs(P[1][1]-P[0][1])/2),0,0,Math.PI*2); }
  else { P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); if (m.type==='poly' && !m.open) ctx.closePath(); }
  return P;
}
function measArc(ctx, P, rad) {
  const a=Math.atan2(P[0][1]-P[1][1],P[0][0]-P[1][0]), b=Math.atan2(P[2][1]-P[1][1],P[2][0]-P[1][0]); let d=b-a;
  while (d>Math.PI) d-=2*Math.PI; while (d<-Math.PI) d+=2*Math.PI;
  ctx.beginPath(); ctx.arc(P[1][0],P[1][1],rad,a,a+d,d<0);
}
function measCaps(ctx, P, len) {
  const dx=P[1][0]-P[0][0], dy=P[1][1]-P[0][1], L=Math.hypot(dx,dy)||1, nx=-dy/L*len, ny=dx/L*len;
  ctx.beginPath(); for (const [x,y] of P) { ctx.moveTo(x-nx,y-ny); ctx.lineTo(x+nx,y+ny); }
}
// Drawn into the exported image when "Show on image" is on.
function measLum(hex) { const m=/^#?([0-9a-f]{6})$/i.exec(String(hex||'')); if (!m) return 1; const n=parseInt(m[1],16); return (0.299*(n>>16)+0.587*((n>>8)&255)+0.114*(n&255))/255; }
// Style of one measurement: its own settings over the image default.
function measStyleOf(item, m) { return {...(item.measStyle||{}), ...(m?.style||{})}; }
// Label box placed beside the geometry so the text never crosses the line.
function measLabelAt(ctx, m, P, text, gap) {
  const t=ctx.measureText(text), w=t.width, asc=t.actualBoundingBoxAscent||0, des=t.actualBoundingBoxDescent||0, h=asc+des;
  let cx, cy;
  if (m.type==='dist' && P.length>1) {
    const dx=P[1][0]-P[0][0], dy=P[1][1]-P[0][1], L=Math.hypot(dx,dy)||1; let nx=-dy/L, ny=dx/L;
    if (ny>1e-3 || (Math.abs(ny)<=1e-3 && nx<0)) { nx=-nx; ny=-ny; } // above the line; to the right of a vertical line
    const ext=Math.abs(nx)*w/2+Math.abs(ny)*h/2;
    cx=(P[0][0]+P[1][0])/2+nx*(gap+ext); cy=(P[0][1]+P[1][1])/2+ny*(gap+ext);
  } else if (m.type==='angle' && P.length===3) {
    const u=q=>{ const dx=q[0]-P[1][0], dy=q[1]-P[1][1], L=Math.hypot(dx,dy)||1; return [dx/L,dy/L]; }, a=u(P[0]), b=u(P[2]);
    let bx=-(a[0]+b[0]), by=-(a[1]+b[1]); const bl=Math.hypot(bx,by); if (bl<1e-3) { bx=-a[1]; by=a[0]; } else { bx/=bl; by/=bl; } // outside the angle, opposite the bisector
    const ext=Math.abs(bx)*w/2+Math.abs(by)*h/2; cx=P[1][0]+bx*(gap+ext); cy=P[1][1]+by*(gap+ext);
  } else if (m.type==='ellipse' && P.length>1) { cx=(P[0][0]+P[1][0])/2; cy=Math.min(P[0][1],P[1][1])-gap-h/2; }
  else { cx=P.reduce((s,p)=>s+p[0],0)/P.length; cy=Math.min(...P.map(p=>p[1]))-gap-h/2; }
  const W=ctx.canvas.width, H=ctx.canvas.height;
  cx=clamp(cx, w/2+1, Math.max(w/2+1, W-w/2-1)); cy=clamp(cy, h/2+1, Math.max(h/2+1, H-h/2-1));
  return {x:cx, y:cy, base:cy+(asc-des)/2, w, h};
}
// Distance (source px) from a point to the measurement outline.
function measNear(m, p) {
  const P=m.pts, seg=(a,b)=>{ const dx=b[0]-a[0], dy=b[1]-a[1], L2=dx*dx+dy*dy||1, t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L2,0,1); return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy); };
  if (m.type==='ellipse') { const cx=(P[0][0]+P[1][0])/2, cy=(P[0][1]+P[1][1])/2, a=Math.abs(P[1][0]-P[0][0])/2||1, b=Math.abs(P[1][1]-P[0][1])/2||1; return Math.abs(Math.hypot((p[0]-cx)/a,(p[1]-cy)/b)-1)*Math.min(a,b); }
  let d=Infinity; for (let i=0;i<P.length-1;i++) d=Math.min(d,seg(P[i],P[i+1])); if (m.type==='poly' && P.length>2) d=Math.min(d,seg(P[P.length-1],P[0])); return d;
}
function drawMeasuresFinal(ctx, item, crop, cfg, fs, fg0, ppt) {
  const list=item.measures||[]; if (!list.length) return;
  const k=measUmPerPx(item), short=Math.min(crop.w,crop.h);
  ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round';
  for (const m of list) {
    const st=measStyleOf(item,m), fg=st.color||fg0, lw=st.lineW>0?st.lineW:Math.max(1.5,short*0.003), edge=measLum(fg)>0.5?'#000000':'#ffffff';
    const px=st.size>0&&ppt?st.size*ppt:Math.max(6,fs*0.75), outline=st.outline===true;
    const font=fontSpec(px, st.bold==null?cfg.fontWeight:(st.bold?700:400), false, st.font||cfg.fontFamily), ow=outline?Math.max(1,Math.round(px*0.1)):0;
    const two=(build)=>{ if (outline) { build(); ctx.strokeStyle=edge; ctx.lineWidth=lw+Math.max(2,lw*0.8); ctx.stroke(); } build(); ctx.strokeStyle=fg; ctx.lineWidth=lw; ctx.stroke(); };
    let P; two(()=>{ P=measPath(ctx,m,crop.x,crop.y); });
    if (m.type==='dist') two(()=>measCaps(ctx,P,lw*3));
    if (m.type==='angle') two(()=>measArc(ctx,P,Math.max(8,short*0.03)));
    const text=measMain(m,measCalc(m,k),cfg); ctx.font=font;
    const L=measLabelAt(ctx,m,P,text,Math.max(lw*2,px*0.25)+(m.type==='dist'?lw*3:0));
    drawLabel(ctx, text, L.x, L.base, font, 'center', fg, edge, ow);
  }
  ctx.restore();
}
// Editing overlay on the Result preview (not exported).
function measOverlay(ctx, c, item) {
  const list=item?.measures||[], d=measState.draft?.item===item?.id?measState.draft:null;
  if (!list.length && !d) return;
  const k=displayK(c), cr=item.renderMeta?.crop||getCrop(item), lw=1.8*k, cfg=settings(), kk=measUmPerPx(item);
  measState.boxes={};
  ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round';
  const one=(m,col,label,dots)=>{
    let P; const both=(build)=>{ build(); ctx.strokeStyle='rgba(0,0,0,.7)'; ctx.lineWidth=lw+2*k; ctx.stroke(); build(); ctx.strokeStyle=col; ctx.lineWidth=lw; ctx.stroke(); };
    both(()=>{ P=measPath(ctx,m,cr.x,cr.y); });
    if (m.type==='dist' && P.length===2) both(()=>measCaps(ctx,P,5*k));
    if (m.type==='angle' && P.length===3) both(()=>measArc(ctx,P,16*k));
    if (dots) { ctx.fillStyle=col; for (const [x,y] of P) { ctx.beginPath(); ctx.arc(x,y,3.5*k,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.7)'; ctx.lineWidth=k; ctx.stroke(); } }
    if (label) { ctx.font='600 '+Math.round(12*k)+'px system-ui,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      const L=measLabelAt(ctx,m,P,label,(m.type==='dist'?9:5)*k); if (m.id) measState.boxes[m.id]={x:L.x-L.w/2, y:L.y-L.h/2, w:L.w, h:L.h};
      ctx.lineWidth=3*k; ctx.strokeStyle='rgba(0,0,0,.85)'; ctx.strokeText(label,L.x,L.base); ctx.fillStyle=col; ctx.fillText(label,L.x,L.base); }
  };
  list.forEach((m,i)=>{ const sel=m.id===measState.sel; if (item.measShow && !sel) return;
    one(m, sel?'#f59e0b':'#22d3ee', item.measShow?'':(i+1)+': '+measMain(m,measCalc(m,kk),cfg), sel || !item.measShow); });
  if (d && d.pts.length) {
    const pts=[...d.pts]; if (d.hover) pts.push(d.hover);
    const m={type:d.type, pts, open:true}, done=(d.type==='dist'||d.type==='ellipse')?pts.length>=2:d.type==='angle'?pts.length===3:false;
    one(m,'#f59e0b', done?measMain(m,measCalc(m,kk),cfg):'', true);
  }
  ctx.restore();
}
function measSetTool(t) {
  measState.tool=t; measState.draft=null; measState.drag=null;
  els.resultCanvas.style.cursor=t?'crosshair':'';
  renderMeasCard(); const it=selectedItem(); if (it) paintResult(it);
}
function measAfter(it, rerender) {
  if ((rerender || it.measShow) && renderable(it)) { try { renderInto(it); } catch(_) {} }
  paintResult(it); renderMeasCard(); histSchedule();
}
function measCommit(it, type, pts) {
  if (!it) return; if (!it.measures) it.measures=[];
  const m={id:uid(), type, pts:pts.map(p=>[Math.round(p[0]*10)/10, Math.round(p[1]*10)/10])};
  it.measures.push(m); measState.sel=m.id; measState.draft=null; measAfter(it);
}
function measDelete(it, id) { if (!it) return; it.measures=(it.measures||[]).filter(m=>m.id!==id); if (measState.sel===id) measState.sel=null; measAfter(it,true); }
function measRows(items) { const rows=[]; for (const it of items) { const k=measUmPerPx(it); (it.measures||[]).forEach((m,i)=>rows.push({it, m, i, k, r:measCalc(m,k)})); } return rows; }
function measStats(vals) { const n=vals.length, mean=vals.reduce((a,b)=>a+b,0)/n, sd=n>1?Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/(n-1)):0; return {n, mean, sd}; }
function renderMeasCard() {
  const card=document.getElementById('measCard'); if (!card) return;
  const it=selectedItem(), T=s=>window.semI18n?.t(s)??s, cfg=settings(), all=document.getElementById('measScope').value==='all';
  const rows=measRows(all?state.items.filter(x=>x.imageData):(it?[it]:[]));
  document.getElementById('measCount').textContent=String(rows.length);
  const show=document.getElementById('measShow'); show.checked=!!it?.measShow; show.disabled=!it?.imageData;
  const sb=document.getElementById('measStyleBox'); sb.style.display=it?.measShow?'':'none';
  if (it?.measShow) {
    const fsel=document.getElementById('measFont'), src=document.getElementById('fontFamily');
    if (src && fsel.options.length!==src.options.length+1) { fsel.innerHTML=''; const o=document.createElement('option'); o.value=''; o.textContent=T('Same as the scale label'); fsel.appendChild(o); [...src.options].forEach(x=>{ const c=x.cloneNode(true); c.selected=false; fsel.appendChild(c); }); }
    const tm=measTarget(it), st=measStyleOf(it,tm), defC=lblStyle(it,'scale',cfg).color;
    document.getElementById('measStyleTitle').textContent=tm ? '— '+T('for')+' '+T(MEAS_TYPES[tm.type])+' '+(it.measures.indexOf(tm)+1) : '— '+T('default for this image; select a row to style one measurement');
    document.getElementById('measStyleReset').hidden=!tm?.style; document.getElementById('measStyleImg').hidden=!tm;
    setVal(document.getElementById('measColor'), st.color||defC); if (document.activeElement!==fsel) fsel.value=st.font||'';
    setVal(document.getElementById('measSize'), st.size||0); setVal(document.getElementById('measLineW'), st.lineW||0);
    setChk(document.getElementById('measBold'), st.bold==null?Number(cfg.fontWeight)>=600:st.bold); setChk(document.getElementById('measOutline'), st.outline===true);
  }
  document.getElementById('measCopy').disabled=document.getElementById('measCsv').disabled=!rows.length;
  document.getElementById('measClear').disabled=!it?.measures?.length;
  card.querySelectorAll('[data-meas]').forEach(b=>{ const on=b.dataset.meas===measState.tool; b.setAttribute('aria-pressed',String(on)); b.classList.toggle('secondary',on); b.classList.toggle('ghost',!on); b.disabled=!it?.outputCanvas; });
  document.getElementById('measToolHint').textContent=measState.tool?T(MEAS_HINTS[measState.tool])+' '+T('Esc stops the tool.'):(it?.outputCanvas?T('Pick a tool, then draw on the Result preview.'):T('Process the image first to measure on it.'));
  const wrap=document.getElementById('measTableWrap'); wrap.innerHTML='';
  const sum=document.getElementById('measSummary'); sum.textContent='';
  if (!rows.length) return;
  const tb=document.createElement('table'); tb.style.cssText='width:100%;border-collapse:collapse;font-size:12px';
  const th=document.createElement('tr'); [ '#', all?T('Image'):null, T('Type'), T('Value'), T('Details'), '' ].filter(x=>x!==null).forEach(h=>{ const c=document.createElement('th'); c.textContent=h; c.style.cssText='text-align:left;padding:4px 6px;border-bottom:1px solid var(--line);color:var(--muted);font-weight:600;white-space:nowrap'; th.appendChild(c); });
  tb.appendChild(th);
  for (const row of rows) {
    const tr=document.createElement('tr'), sel=row.m.id===measState.sel;
    tr.style.cssText='cursor:pointer;'+(sel?'background:#fff3b0':'');
    const cells=[String(row.i+1), all?(row.it.name.length>22?row.it.name.slice(0,22)+'…':row.it.name):null, T(MEAS_TYPES[row.m.type]), measMain(row.m,row.r,cfg), measDetail(row.m,row.r,cfg)].filter(x=>x!==null);
    cells.forEach((v,ci)=>{ const td=document.createElement('td'); td.textContent=v; td.style.cssText='padding:4px 6px;border-bottom:1px solid var(--line);'+(ci===cells.length-2?'font-family:ui-monospace,Menlo,Consolas,monospace;white-space:nowrap':'')+(ci===cells.length-1?'color:var(--muted)':''); tr.appendChild(td); });
    const td=document.createElement('td'); td.style.cssText='padding:2px 4px;border-bottom:1px solid var(--line);text-align:right';
    const x=document.createElement('button'); x.type='button'; x.className='btn ghost icon-btn'; x.textContent='×'; x.title=T('Delete'); x.style.cssText='min-height:0;padding:0 8px';
    x.onclick=e=>{ e.stopPropagation(); measDelete(row.it,row.m.id); }; td.appendChild(x); tr.appendChild(td);
    tr.onclick=()=>{ measState.sel=row.m.id; if (row.it.id!==state.selectedId) { state.selectedId=row.it.id; renderUI(); } else { paintResult(row.it); renderMeasCard(); } };
    tb.appendChild(tr);
  }
  wrap.appendChild(tb);
  const lines=[];
  for (const t of ['dist','ellipse','poly','angle']) {
    const g=rows.filter(r=>r.m.type===t); if (!g.length) continue;
    let vals, fmt;
    if (t==='angle') { vals=g.map(r=>r.r.deg); fmt=v=>measNum(v,cfg)+'°'; }
    else { const um=g.filter(r=>r.k); if (um.length) { vals=um.map(r=>t==='dist'?r.r.len:r.r.d); fmt=v=>measLen(v,cfg); } else { vals=g.map(r=>t==='dist'?r.r.px:r.r.pxD); fmt=v=>measNum(v,cfg)+' px'; } }
    const s=measStats(vals), name=T(MEAS_TYPES[t])+(t==='ellipse'||t==='poly'?' ⌀':'');
    lines.push(name+': n = '+s.n+', '+T('mean')+' '+fmt(s.mean)+(s.n>1?' ± '+fmt(s.sd)+' (SD)':''));
  }
  if (rows.some(r=>!r.k && r.m.type!=='angle')) lines.push(T('Images without a calibration are measured in pixels.'));
  sum.textContent=lines.join('  •  ');
}
function measTable(items) {
  const T=s=>window.semI18n?.t(s)??s;
  const f=v=>v==null||!isFinite(v)?'':String(+v.toPrecision(6));
  const head=['Image','No','Type','Length (µm)','Eq. diameter (µm)','Area (µm²)','Major axis (µm)','Minor axis (µm)','Perimeter (µm)','Angle (°)','Length or eq. diameter (px)','Area (px²)','µm per px'].map(T);
  return [head, ...measRows(items).map(({it,m,i,r,k})=>[it.name, i+1, T(MEAS_TYPES[m.type]), f(r.len), f(r.d), f(r.area), f(r.maj), f(r.min), f(r.per), f(r.deg), f(r.px??r.pxD), f(r.pxArea), f(k)])];
}
// With RU or decimal-comma settings Excel expects ";" between columns and "," in numbers.
function measCSV(items) { return csvJoin(measTable(items)); }
function measScopeItems() { const it=selectedItem(); return document.getElementById('measScope').value==='all'?state.items.filter(x=>x.imageData):(it?[it]:[]); }
document.querySelectorAll('#measCard [data-meas]').forEach(b=>b.addEventListener('click',()=>measSetTool(measState.tool===b.dataset.meas?null:b.dataset.meas)));
document.getElementById('measShow')?.addEventListener('change',e=>{ const it=selectedItem(); if (!it) return; it.measShow=e.target.checked; measAfter(it,true); });
document.getElementById('measScope')?.addEventListener('change',renderMeasCard);
let measStyleTimer=null;
function measTarget(it) { return (it?.measures||[]).find(m=>m.id===measState.sel)||null; }
[['measColor','color','input',v=>v],['measFont','font','change',v=>v],['measSize','size','input',v=>Math.max(0,Number(v)||0)],['measLineW','lineW','input',v=>Math.max(0,Number(v)||0)],['measBold','bold','change',null],['measOutline','outline','change',null]].forEach(([id,key,ev,conv])=>{
  const el=document.getElementById(id); if (!el) return;
  el.addEventListener(ev,()=>{ const it=selectedItem(); if (!it) return;
    const v=conv?conv(el.value):el.checked, m=measTarget(it);
    if (m) m.style={...(m.style||{}), [key]:v}; else it.measStyle={...(it.measStyle||{}), [key]:v};
    clearTimeout(measStyleTimer); measStyleTimer=setTimeout(()=>measAfter(it,true),80); });
});
document.getElementById('measStyleReset')?.addEventListener('click',()=>{ const it=selectedItem(), m=measTarget(it); if (!m) return; delete m.style; measAfter(it,true); });
document.getElementById('measStyleImg')?.addEventListener('click',()=>{ const it=selectedItem(); if (!it) return; it.measStyle=measStyleOf(it,measTarget(it)); (it.measures||[]).forEach(q=>delete q.style); measAfter(it,true); });
document.getElementById('measStyleAll')?.addEventListener('click',()=>{ const it=selectedItem(); if (!it) return; const base=measStyleOf(it,measTarget(it));
  state.items.forEach(x=>{ x.measStyle={...base}; (x.measures||[]).forEach(q=>delete q.style); if (x.measShow && renderable(x)) { try { renderInto(x); } catch(_) {} } });
  compose.srcCache={}; renderUI(); histSchedule(); showToast('Measurement style applied to all images.'); });
document.getElementById('measClear')?.addEventListener('click',()=>{ const it=selectedItem(); if (!it?.measures?.length) return; if (!confirm(window.semI18n?.t('Delete all measurements on this image?')??'Delete all measurements on this image?')) return; it.measures=[]; measState.sel=null; measAfter(it,true); });
document.getElementById('measCopy')?.addEventListener('click',async()=>{ try { await navigator.clipboard.writeText(measTable(measScopeItems()).map(r=>r.map(v=>{ const s=String(v); return measComma(settings()) && /^-?\d+(\.\d+)?(e[-+]?\d+)?$/i.test(s) ? s.replace('.',',') : s; }).join('\t')).join('\n')); showToast('Table copied. Paste it into Excel.'); } catch(_) { showToast('Copy is not allowed here; use Export CSV instead.',4200); } });
document.getElementById('measCsv')?.addEventListener('click',async()=>{ const r=await saveBlob(new Blob(['\ufeff'+measCSV(measScopeItems())],{type:'text/csv'}),'sem_measurements.csv','text/csv'); if (r?.method!=='cancelled') showToast('Measurements saved.'); });
// Pointer handling runs in the capture phase on the preview wrapper, before the object editor.
(function(){
  const cv=els.resultCanvas, host=cv.parentElement;
  const pt=e=>{ const it=selectedItem(), p=canvasPoint(cv,e), cr=it.renderMeta?.crop||getCrop(it); return [p.x+cr.x, p.y+cr.y]; };
  const stop=e=>{ e.stopImmediatePropagation(); e.preventDefault(); };
  host.addEventListener('pointerdown',e=>{
    if (e.target!==cv || e.button!==0) return;
    const it=selectedItem(); if (!it?.outputCanvas) return;
    const p=pt(e), k=displayK(cv), tool=measState.tool, d=measState.draft?.item===it.id?measState.draft:null;
    if (!tool) {
      const cr=it.renderMeta?.crop||getCrop(it), cfg=settings();
      for (const m of [...(it.measures||[])].reverse()) {
        const vi=(it.measShow && m.id!==measState.sel) ? -1 : m.pts.findIndex(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<8*k);
        const q=[p[0]-cr.x,p[1]-cr.y], bx=it.measShow?null:measState.boxes?.[m.id];
        const onLabel=(bx && q[0]>=bx.x-4*k && q[0]<=bx.x+bx.w+4*k && q[1]>=bx.y-4*k && q[1]<=bx.y+bx.h+4*k) || measNear(m,p)<6*k;
        if (vi>=0 || onLabel) { stop(e); cv.setPointerCapture(e.pointerId); measState.sel=m.id; measState.drag={it, m, i:vi, start:p, orig:m.pts.map(q=>[...q]), moved:false}; paintResult(it); renderMeasCard(); return; }
      }
      return;
    }
    stop(e);
    if (tool==='dist' || tool==='ellipse') {
      if (d && d.pts.length===1) { measCommit(it,tool,[d.pts[0],p]); return; }
      measState.draft={item:it.id, type:tool, pts:[p], hover:p}; measState.drag={draft:true, start:p}; cv.setPointerCapture(e.pointerId);
    } else if (tool==='angle') {
      if (!d) measState.draft={item:it.id, type:'angle', pts:[p], hover:p};
      else { d.pts.push(p); if (d.pts.length===3) { measCommit(it,'angle',d.pts); return; } }
    } else if (tool==='poly') {
      if (!d) measState.draft={item:it.id, type:'poly', pts:[p], hover:p};
      else { const f=d.pts[0], last=d.pts[d.pts.length-1];
        if (d.pts.length>=3 && Math.hypot(f[0]-p[0],f[1]-p[1])<10*k) { measCommit(it,'poly',d.pts); return; }
        if (Math.hypot(last[0]-p[0],last[1]-p[1])>2*k) d.pts.push(p); }
    }
    paintResult(it);
  },true);
  host.addEventListener('pointermove',e=>{
    if (e.target!==cv) return;
    const it=selectedItem(); if (!it?.outputCanvas) return;
    const g=measState.drag, d=measState.draft?.item===it.id?measState.draft:null;
    if (g) { stop(e); const p=pt(e);
      if (g.draft) { if (d) d.hover=p; }
      else { g.moved=true; if (g.i>=0) g.m.pts[g.i]=p; else { const dx=p[0]-g.start[0], dy=p[1]-g.start[1]; g.m.pts=g.orig.map(q=>[q[0]+dx,q[1]+dy]); } }
      paintResult(it); return; }
    if (measState.tool) { stop(e); cv.style.cursor='crosshair'; if (d) { d.hover=pt(e); paintResult(it); } }
  },true);
  const up=e=>{
    const g=measState.drag; if (!g) return;
    stop(e); measState.drag=null; measState.justDragged=true; setTimeout(()=>{ measState.justDragged=false; },0);
    const it=selectedItem(); if (!it) return;
    if (g.draft) { const d=measState.draft, p=pt(e), k=displayK(cv); if (d && Math.hypot(p[0]-g.start[0],p[1]-g.start[1])>4*k) measCommit(it,d.type,[d.pts[0],p]); else paintResult(it); return; }
    if (g.moved) { g.m.pts=g.m.pts.map(q=>[Math.round(q[0]*10)/10, Math.round(q[1]*10)/10]); measAfter(it); }
  };
  host.addEventListener('pointerup',up,true); host.addEventListener('pointercancel',up,true);
  host.addEventListener('click',e=>{ if (e.target===cv && (measState.tool || measState.justDragged)) stop(e); },true);
  host.addEventListener('dblclick',e=>{ const d=measState.draft; if (e.target!==cv || measState.tool!=='poly' || !d) return; stop(e); if (d.pts.length>=3) measCommit(selectedItem(),'poly',d.pts); },true);
})();
window.addEventListener('keydown',e=>{
  if (state.tab!=='clean') return;
  const it=selectedItem(), typing=scTyping(e.target);
  if (e.key==='Escape' && (measState.tool || measState.draft)) {
    e.stopImmediatePropagation(); e.preventDefault();
    const d=measState.draft;
    if (d) { if (d.type==='poly' && d.pts.length>=3) measCommit(it,'poly',d.pts); else { measState.draft=null; if (it) paintResult(it); } }
    else measSetTool(null);
    return;
  }
  if (typing) return;
  if (e.key==='Enter' && measState.draft?.type==='poly' && measState.draft.pts.length>=3) { e.preventDefault(); measCommit(it,'poly',measState.draft.pts); return; }
  if ((e.key==='Delete' || e.key==='Backspace') && measState.sel && it?.measures?.some(m=>m.id===measState.sel) && !(it.selObj && state.lastCanvas==='result')) { e.stopImmediatePropagation(); e.preventDefault(); measDelete(it,measState.sel); return; }
  if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && scKey(e)==='m') { e.stopImmediatePropagation(); e.preventDefault(); measSetTool(measState.tool==='dist'?null:'dist'); }
},true);

