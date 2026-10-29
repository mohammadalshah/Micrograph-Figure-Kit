// =====================================================================
// Micrograph Figure Kit — 17d. EDS preview interaction
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Select maps, erase boxes, and move labels, content values and scale bars by mouse or keyboard.
// =====================================================================
const edsCellAt=p=>eds.cells.find(c=>p.x>=c.dx&&p.x<=c.dx+c.dw&&p.y>=c.dy&&p.y<=c.dy+c.dh);
let edsErase=null, edsMove=null, edsMoveFrame=0;
const edsHitAt=p=>{ for (let i=eds.cells.length-1;i>=0;i--) { const c=eds.cells[i]; for (const h of c.hits||[]) if (p.x>=h.x&&p.x<=h.x+h.w&&p.y>=h.y&&p.y<=h.y+h.h) return {c,h}; } return null; };
// Changing a Position preset by hand drops the moved boxes of that kind in this group (programmatic changes from undo or group switch do not).
[['edsLabelPos','label'],['edsQPos','q'],['edsScalePos','scale']].forEach(([k,kind])=>edsEls[k].addEventListener('change',e=>{
  if (e.isTrusted) for (const t of eds.tiles) if (t.pos) delete t.pos[kind];
  scheduleEds(0);
}));
edsEls.edsCanvas.addEventListener('pointerdown',e=>{
  const p=canvasPoint(edsEls.edsCanvas,e);
  // Label, content value or scale bar: drag to move it on its map.
  const hh=!eds.eraseTool && edsHitAt(p);
  if (hh) { e.preventDefault(); edsEls.edsCanvas.setPointerCapture(e.pointerId); edsMove={c:hh.c, kind:hh.h.kind, start:p, ox:hh.h.x, oy:hh.h.y, moved:false}; eds.activeKind=hh.h.kind;
    if (eds.sel!==hh.c.t.id) { eds.sel=hh.c.t.id; renderEdsList(); syncEdsSel(); } paintEds(); return; }
  const c=edsCellAt(p); if (!c) return;
  if (!eds.eraseTool || c.t.role==='spectrum') { eds.sel=c.t.id; renderEdsList(); syncEdsSel(); paintEds(); return; }
  e.preventDefault(); edsEls.edsCanvas.setPointerCapture(e.pointerId); edsErase={c, a:p, b:p};
});
edsEls.edsCanvas.addEventListener('pointermove',e=>{
  if (edsMove) {
    const m=edsMove, c=m.c, p=canvasPoint(edsEls.edsCanvas,e);
    // A plain click (or hand jitter) selects the map without pinning the box.
    if (!m.moved && Math.hypot(p.x-m.start.x,p.y-m.start.y)<3*displayK(edsEls.edsCanvas)) return;
    m.moved=true; c.t.pos=c.t.pos||{}; c.t.pos[m.kind]={x:(m.ox+p.x-m.start.x-c.ox)/c.tw, y:(m.oy+p.y-m.start.y-c.oy)/c.th};
    if (!edsMoveFrame) edsMoveFrame=requestAnimationFrame(()=>{ edsMoveFrame=0; if (!eds.tiles.some(t=>t.include)) return; const r=renderEdsFigure(edsCfg()); eds.canvas=r.canvas; eds.cells=r.L.cells; paintEds(); });
    return;
  }
  if (!edsErase) { edsEls.edsCanvas.style.cursor=eds.eraseTool?'crosshair':edsHitAt(canvasPoint(edsEls.edsCanvas,e))?'move':'pointer'; return; }
  const c=edsErase.c, p=canvasPoint(edsEls.edsCanvas,e);
  edsErase.b={x:clamp(p.x,c.dx,c.dx+c.dw), y:clamp(p.y,c.dy,c.dy+c.dh)};
  paintEds();
  const ctx=edsEls.edsCanvas.getContext('2d'), k=displayK(edsEls.edsCanvas), a=edsErase.a, b=edsErase.b;
  ctx.save(); ctx.strokeStyle='#ff3b30'; ctx.lineWidth=2*k; ctx.setLineDash([6*k,4*k]); ctx.fillStyle='rgba(255,59,48,.2)';
  ctx.fillRect(Math.min(a.x,b.x),Math.min(a.y,b.y),Math.abs(b.x-a.x),Math.abs(b.y-a.y)); ctx.strokeRect(Math.min(a.x,b.x),Math.min(a.y,b.y),Math.abs(b.x-a.x),Math.abs(b.y-a.y)); ctx.restore();
});
const edsEndMove=()=>{ if (!edsMove) return false; const mv=edsMove.moved; edsMove=null; cancelAnimationFrame(edsMoveFrame); edsMoveFrame=0;
  if (mv) { renderEds(); if (typeof histSchedule==='function') histSchedule(); } else paintEds(); return true; };
// Keyboard alternative to dragging: arrows move the active box of the selected map (Shift = larger steps), Home puts it back, Tab-like cycling with B.
edsEls.edsCanvas.addEventListener('keydown',e=>{
  const c=eds.cells.find(x=>x.t.id===eds.sel); if (!c || !c.hits?.length) return;
  if (e.key==='b' || e.key==='B') { const ks=c.hits.map(h=>h.kind), i=ks.indexOf(eds.activeKind); eds.activeKind=ks[(i+1)%ks.length]; paintEds(); e.preventDefault(); return; }
  const h=c.hits.find(x=>x.kind===eds.activeKind) || c.hits[0]; eds.activeKind=h.kind;
  if (e.key==='Home') { if (c.t.pos?.[h.kind]) { delete c.t.pos[h.kind]; renderEds(); } e.preventDefault(); return; }
  const st=e.shiftKey?0.02:0.005, d={ArrowLeft:[-st,0],ArrowRight:[st,0],ArrowUp:[0,-st],ArrowDown:[0,st]}[e.key]; if (!d) return;
  e.preventDefault();
  const fx=(h.x-c.ox)/c.tw, fy=(h.y-c.oy)/c.th;
  c.t.pos=c.t.pos||{}; c.t.pos[h.kind]={x:clamp(fx+d[0],0,Math.max(0,1-h.w/c.tw)), y:clamp(fy+d[1],0,Math.max(0,1-h.h/c.th))};
  renderEds();
});
edsEls.edsCanvas.addEventListener('focus',()=>paintEds()); edsEls.edsCanvas.addEventListener('blur',()=>paintEds());
edsEls.edsCanvas.addEventListener('pointercancel',edsEndMove);
edsEls.edsCanvas.addEventListener('dblclick',e=>{ if (eds.eraseTool) return; const hh=edsHitAt(canvasPoint(edsEls.edsCanvas,e)); if (!hh || !hh.c.t.pos?.[hh.h.kind]) return;
  delete hh.c.t.pos[hh.h.kind]; renderEds(); if (typeof histSchedule==='function') histSchedule(); });
edsEls.edsCanvas.addEventListener('pointerup',()=>{
  if (edsEndMove()) return;
  if (!edsErase) return;
  const {c,a,b}=edsErase; edsErase=null;
  if (Math.abs(b.x-a.x)<3 || Math.abs(b.y-a.y)<3) { paintEds(); return; }
  const t=c.t, W=t.src.width, H=t.src.height, proc=t._pc, k=proc.width/c.dw;
  const sx=t._crop.x0+(Math.min(a.x,b.x)-c.dx)*k, sy=t._crop.y0+(Math.min(a.y,b.y)-c.dy)*k;
  eds.erase.push({x:sx/W, y:sy/H, w:Math.abs(b.x-a.x)*k/W, h:Math.abs(b.y-a.y)*k/H});
  renderEds();
});
