// =====================================================================
// Micrograph Figure Kit — 15a. Compose table
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    A table frame for the figure: images sit in cells (empty cells allowed), grid lines,
//    header cells on any side with rich text, merged headers and rotated side headers.
// =====================================================================
const TBL_SIDES=['top','bottom','left','right'];
const TBL_GREEK={alpha:'α',beta:'β',gamma:'γ',delta:'δ',epsilon:'ε',zeta:'ζ',eta:'η',theta:'θ',iota:'ι',kappa:'κ',lambda:'λ',mu:'μ',nu:'ν',xi:'ξ',omicron:'ο',pi:'π',rho:'ρ',sigma:'σ',tau:'τ',upsilon:'υ',phi:'φ',chi:'χ',psi:'ψ',omega:'ω'};
// \alpha → α, \Omega → Ω
function tblGreek(s) { return String(s||'').replace(/\\([A-Za-z]+)/g,(m,n)=>{ const l=TBL_GREEK[n.toLowerCase()]; if (!l) return m; return n[0]===n[0].toUpperCase()?l.toUpperCase():l; }); }
function tblNew(n) {
  const cols=n>=4?Math.ceil(Math.sqrt(n)):Math.max(1,n||2), rows=Math.max(1,Math.ceil((n||cols)/cols));
  return {rows, cols, map:{}, lineW:0.5, lineColor:'#000000', textColor:'#000000', pad:1, font:'', size:9, bold:false, italic:false, rot:true,
    hdr:{top:{on:true,cells:[]}, bottom:{on:false,cells:[]}, left:{on:true,cells:[]}, right:{on:false,cells:[]}}};
}
// Values from a session or history snapshot, limited to valid ones.
function tblSanitize(t) {
  if (!t || typeof t!=='object') return null;
  const n=(v,a,b,d)=>{ v=Number(v); return isFinite(v)?clamp(v,a,b):d; }, col=(v,d)=>/^#[0-9a-f]{6}$/i.test(String(v))?String(v):d;
  const out=tblNew(1);
  out.rows=Math.round(n(t.rows,1,20,2)); out.cols=Math.round(n(t.cols,1,20,2));
  out.lineW=n(t.lineW,0,10,0.5); out.pad=n(t.pad,0,20,1); out.size=n(t.size,2,72,9);
  out.lineColor=col(t.lineColor,'#000000'); out.textColor=col(t.textColor,'#000000');
  out.font=typeof t.font==='string'?t.font:''; out.bold=!!t.bold; out.italic=!!t.italic; out.rot=t.rot!==false;
  if (t.map && typeof t.map==='object') for (const [k,v] of Object.entries(t.map)) if (/^\d+$/.test(k) && typeof v==='string') out.map[k]=v;
  for (const s of TBL_SIDES) { const h=t.hdr?.[s]; if (!h) continue; out.hdr[s].on=!!h.on;
    out.hdr[s].cells=(Array.isArray(h.cells)?h.cells:[]).slice(0,20).map(c=>({text:String(c?.text??'').slice(0,500), span:Math.round(n(c?.span,1,20,1))})); }
  return out;
}
function tblHdrN(t,side) { return side==='top'||side==='bottom'?t.cols:t.rows; }
function tblHdrCells(t,side) { const h=t.hdr[side], n=tblHdrN(t,side); while (h.cells.length<n) h.cells.push({text:'',span:1}); return h.cells.slice(0,n); }
// Header cells with merges resolved: [{i, span, text}]
function tblSpans(t,side) {
  const cells=tblHdrCells(t,side), n=cells.length, out=[];
  for (let i=0;i<n;) { const sp=clamp(Math.round(cells[i].span||1),1,n-i); out.push({i, span:sp, text:cells[i].text}); i+=sp; }
  return out;
}
function tblMerged(t,side,b) { return t.hdr[side].on && tblSpans(t,side).some(s=>s.i<b && b<s.i+s.span); }
// Image ids per cell (null = empty). Panels without a cell go to the first free one.
function tblAssign(t, items) {
  const n=t.rows*t.cols, ids=new Set(items.map(i=>i.id)), slots=new Array(n).fill(null), placed=new Set();
  for (const [k,id] of Object.entries(t.map)) { const s=+k; if (s<n && ids.has(id) && !slots[s] && !placed.has(id)) { slots[s]=id; placed.add(id); } else delete t.map[k]; }
  let over=0;
  for (const it of items) if (!placed.has(it.id)) { const s=slots.indexOf(null); if (s<0) { over++; continue; } slots[s]=it.id; t.map[s]=it.id; placed.add(it.id); }
  return {slots, over};
}
// Included panels in table reading order (left to right, top to bottom).
function tblOrder(items) {
  const t=compose.table, {slots, over}=tblAssign(t,items); compose.tblOver=over;
  return slots.filter(Boolean).map(id=>items.find(i=>i.id===id));
}
function tblMove(id, s) {
  const t=compose.table; if (!t) return;
  const from=Object.keys(t.map).find(k=>t.map[k]===id), other=t.map[s];
  t.map[s]=id; compose.off.delete(id);
  if (from!=null && +from!==s) { if (other && other!==id) t.map[from]=other; else delete t.map[from]; }
}
const tblHdrObj=(t,text)=>({text:tblGreek(text), font:t.font||'', bold:t.bold, italic:t.italic, color:t.textColor, outline:false});
function layoutTable(items, c) {
  const t=compose.table, cfg=settings(), dpi=c.dpi, W=Math.round(c.widthCm/2.54*dpi), m=Math.round(c.marginMm/25.4*dpi);
  const pad=Math.round(t.pad/25.4*dpi), lw=t.lineW>0?Math.max(1,Math.round(t.lineW*dpi/72)):0, fs=Math.max(4,Math.round(t.size*dpi/72));
  const mc=document.createElement('canvas').getContext('2d');
  const band={top:0,bottom:0,left:0,right:0}, H={};
  for (const s of TBL_SIDES) {
    if (!t.hdr[s].on) continue;
    const side=s==='left'||s==='right', rot=side&&t.rot;
    const spans=tblSpans(t,s).map(x=>({...x, lay:String(x.text||'').trim()?layoutRich(mc,tblHdrObj(t,x.text),fs,cfg):null}));
    H[s]=spans;
    const need=Math.max(fs*1.2, ...spans.map(x=>!x.lay?0:(side&&!rot?x.lay.w:x.lay.h)));
    band[s]=Math.round((side&&!rot?Math.min(need,W*0.3):need)+2*pad+lw);
  }
  const gx=m+band.left, gy=m+band.top, gw=Math.max(10,W-2*m-band.left-band.right), cw=gw/t.cols;
  const asps=items.map(it=>{ const cr=getCrop(it); return cr.w/cr.h; }).sort((a,b)=>a-b), medA=asps[asps.length>>1]||4/3;
  const rh=cw/medA, Hh=Math.round(gy+rh*t.rows+band.bottom+m);
  const cells=[], slotRects=[], byId=new Map(items.map(i=>[i.id,i]));
  for (let s=0;s<t.rows*t.cols;s++) {
    const r=Math.floor(s/t.cols), col=s%t.cols, x=gx+col*cw, y=gy+r*rh; slotRects.push({x,y,w:cw,h:rh,s});
    const it=byId.get(t.map[s]); if (!it) continue;
    const cr=getCrop(it), a=cr.w/cr.h, iw=Math.max(4,cw-2*pad-lw), ih=Math.max(4,rh-2*pad-lw);
    let dw=iw, dh=iw/a; if (dh>ih) { dh=ih; dw=ih*a; }
    cells.push({it, x, y, w:cw, h:rh, dx:x+(cw-dw)/2, dy:y+(rh-dh)/2, dw, dh, slot:s});
  }
  return {W, H:Hh, cells, table:{gx,gy,cw,rh,band,H,lw,fs,pad,slotRects}};
}
function drawCompTable(ctx, L) {
  const T=L.table, t=compose.table; if (!T || !t) return;
  const {gx,gy,cw,rh,band,lw}=T, R=t.rows, C=t.cols, gr=gx+C*cw, gb=gy+R*rh, x0=gx-band.left, x1=gr+band.right, y0=gy-band.top, y1=gb+band.bottom;
  ctx.save();
  if (lw>0) {
    ctx.strokeStyle=t.lineColor; ctx.lineWidth=lw; ctx.lineCap='square'; ctx.beginPath();
    const ln=(ax,ay,bx,by)=>{ ctx.moveTo(ax,ay); ctx.lineTo(bx,by); };
    for (const y of new Set([y0,gy,gb,y1])) ln(x0,y,x1,y);
    for (const x of new Set([x0,gx,gr,x1])) ln(x,y0,x,y1);
    for (let r=1;r<R;r++) { const y=gy+r*rh; ln(gx,y,gr,y); if (band.left && !tblMerged(t,'left',r)) ln(x0,y,gx,y); if (band.right && !tblMerged(t,'right',r)) ln(gr,y,x1,y); }
    for (let k=1;k<C;k++) { const x=gx+k*cw; ln(x,gy,x,gb); if (band.top && !tblMerged(t,'top',k)) ln(x,y0,x,gy); if (band.bottom && !tblMerged(t,'bottom',k)) ln(x,gb,x,y1); }
    ctx.stroke();
  }
  for (const s of TBL_SIDES) {
    const spans=T.H[s]; if (!spans) continue;
    const side=s==='left'||s==='right', rot=side&&t.rot;
    for (const sp of spans) {
      if (!sp.lay) continue;
      let cx, cy;
      if (!side) { cx=gx+(sp.i+sp.span/2)*cw; cy=s==='top'?y0+band.top/2:gb+band.bottom/2; }
      else { cy=gy+(sp.i+sp.span/2)*rh; cx=s==='left'?x0+band.left/2:gr+band.right/2; }
      ctx.save(); ctx.translate(cx,cy); if (rot) ctx.rotate(-Math.PI/2);
      drawRich(ctx, sp.lay, -sp.lay.w/2, -sp.lay.h/2, tblHdrObj(t,sp.text));
      ctx.restore();
    }
  }
  ctx.restore();
}
function tblSlotAt(p) { return (compose.tblLayout?.slotRects||[]).find(r=>p.x>=r.x && p.x<=r.x+r.w && p.y>=r.y && p.y<=r.y+r.h)||null; }

// ---- Table panel (Compose → Table) ----
const tblEl=id=>document.getElementById(id);
function tblFillFont() {
  const sel=tblEl('compTblFont'); if (!sel) return; const cur=compose.table?.font||'';
  sel.innerHTML=''; const d=document.createElement('option'); d.value=''; d.textContent=window.semI18n?.t('Same as scale label')??'Same as scale label'; sel.appendChild(d);
  for (const o of els.fontFamily.options) { if (o.disabled) continue; const n=document.createElement('option'); n.value=o.value; n.textContent=o.textContent; sel.appendChild(n); }
  sel.value=cur; if (sel.value!==cur) sel.value='';
}
function tblRenderHeaders() {
  const box=tblEl('compTblHdrs'), t=compose.table; if (!box) return; box.innerHTML=''; if (!t) return;
  const T=s=>window.semI18n?.t(s)??s, NAME={top:'Top headers', bottom:'Bottom headers', left:'Left headers', right:'Right headers'};
  for (const s of TBL_SIDES) {
    if (!t.hdr[s].on) continue;
    const wrap=document.createElement('div'); wrap.className='tbl-hdr-group'; wrap.style.cssText='display:grid;gap:4px;margin-top:8px';
    const h=document.createElement('div'); h.className='setting-title'; h.style.fontSize='12px'; h.textContent=T(NAME[s]); wrap.appendChild(h);
    const cells=tblHdrCells(t,s), spans=tblSpans(t,s), covered=new Set(); spans.forEach(sp=>{ for (let j=sp.i+1;j<sp.i+sp.span;j++) covered.add(j); });
    cells.forEach((cell,i)=>{
      const row=document.createElement('div'); row.style.cssText='display:grid;grid-template-columns:auto minmax(0,1fr) 64px;gap:6px;align-items:center';
      const lb=document.createElement('span'); lb.className='hint'; lb.style.margin='0'; lb.textContent=(s==='top'||s==='bottom'?T('Column'):T('Row'))+' '+(i+1);
      const tx=document.createElement('textarea'); tx.rows=1; tx.value=cell.text||''; tx.disabled=covered.has(i); tx.placeholder=covered.has(i)?T('(merged)'):'';
      tx.style.cssText='resize:vertical;min-height:30px;font:inherit;padding:4px 6px'; tx.setAttribute('aria-label',lb.textContent);
      tx.oninput=()=>{ t.hdr[s].cells[i].text=tx.value; scheduleCompose(200); };
      const sp=document.createElement('input'); sp.type='number'; sp.min='1'; sp.max=String(cells.length-i); sp.step='1'; sp.value=String(cell.span||1); sp.disabled=covered.has(i);
      sp.title=T('Merge: number of cells this header spans'); sp.setAttribute('aria-label',sp.title);
      sp.onchange=()=>{ t.hdr[s].cells[i].span=clamp(Math.round(Number(sp.value)||1),1,cells.length-i); tblRenderHeaders(); renderCompose(); };
      row.append(lb,tx,sp); wrap.appendChild(row);
    });
    box.appendChild(wrap);
  }
}
function tblSyncUI() {
  const t=compose.table, on=!!t;
  tblEl('compTblAdd').hidden=on; tblEl('compTblDel').hidden=!on; tblEl('compTblOpts').hidden=!on;
  els.compMode.disabled=on; els.compPerRow.disabled=on;
  if (!on) return;
  const sv=(id,v)=>{ const e=tblEl(id); if (e && document.activeElement!==e) { if (e.type==='checkbox') e.checked=!!v; else e.value=v; } };
  sv('compTblRows',t.rows); sv('compTblCols',t.cols); sv('compTblLineW',t.lineW); sv('compTblLineColor',t.lineColor); sv('compTblTextColor',t.textColor);
  sv('compTblPad',t.pad); sv('compTblSize',t.size); sv('compTblBold',t.bold); sv('compTblItalic',t.italic); sv('compTblRot',t.rot);
  for (const s of TBL_SIDES) sv('compTblSide-'+s,t.hdr[s].on);
  tblFillFont(); tblRenderHeaders();
}
window.tblSyncUI=tblSyncUI;
tblEl('compTblAdd').onclick=()=>{ compose.table=tblNew(compItemsAll().length); compose.sel=-1; tblSyncUI(); renderCompose(); };
tblEl('compTblDel').onclick=()=>{ compose.table=null; compose.tblLayout=null; compose.sel=-1; tblSyncUI(); renderCompose(); };
[['compTblRows','rows',1,20,true],['compTblCols','cols',1,20,true],['compTblLineW','lineW',0,10],['compTblPad','pad',0,20],['compTblSize','size',2,72]].forEach(([id,k,a,b,int])=>{
  const e=tblEl(id); e.addEventListener('input',()=>{ const t=compose.table; if (!t) return; let v=Number(e.value); if (!isFinite(v) || e.value==='') return; v=clamp(int?Math.round(v):v,a,b); t[k]=v; if (int) tblRenderHeaders(); scheduleCompose(200); });
});
[['compTblLineColor','lineColor'],['compTblTextColor','textColor'],['compTblFont','font']].forEach(([id,k])=>tblEl(id).addEventListener('input',()=>{ if (!compose.table) return; compose.table[k]=tblEl(id).value; scheduleCompose(100); }));
[['compTblBold','bold'],['compTblItalic','italic'],['compTblRot','rot']].forEach(([id,k])=>tblEl(id).addEventListener('change',()=>{ if (!compose.table) return; compose.table[k]=tblEl(id).checked; renderCompose(); }));
for (const s of TBL_SIDES) tblEl('compTblSide-'+s).addEventListener('change',()=>{ if (!compose.table) return; compose.table.hdr[s].on=tblEl('compTblSide-'+s).checked; tblRenderHeaders(); renderCompose(); });
// Drop a panel from the list onto a table cell.
els.compCanvas.addEventListener('dragover',e=>{ if (compose.table && e.dataTransfer?.types?.includes('text/x-mfk-panel')) { e.preventDefault(); e.dataTransfer.dropEffect='move'; } });
els.compCanvas.addEventListener('drop',e=>{
  if (!compose.table) return; const id=e.dataTransfer?.getData('text/x-mfk-panel'); if (!id) return;
  e.preventDefault(); const s=tblSlotAt(canvasPoint(els.compCanvas,e)); if (!s) return;
  tblMove(id,s.s); compose.sel=-1; renderCompose();
});
