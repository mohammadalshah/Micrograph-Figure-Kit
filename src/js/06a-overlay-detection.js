// =====================================================================
// Micrograph Figure Kit — 6a. Overlay scale bars
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Optical, TEM and STEM images: bars drawn inside the picture, grey or coloured (yellow, red…), with their labels.
// =====================================================================
// Optical-microscope images: a thin bar drawn inside the picture (often with end ticks) and its label next to it.
// Returns {bar, label, erase, pol} in image px, or null. pol=1 white overlay, -1 black overlay.
// roi (optional): user-drawn box; only that area is searched, and a label is not required.
// A bar row is found by comparing each pixel with the pixels `off` rows above and below, so `off` must exceed half the
// bar thickness. Thick bars (high-resolution optical cameras) are found by retrying with a larger offset.
// Coloured bars (yellow, red… as drawn by TEM/SEM software) are tried first: each dominant overlay colour is turned into
// a white-on-black map and searched like a white bar. opts.colorOnly skips the grey (white/black) search.
function detectOverlayBar(id, roi, opts={}) {
  const W=id.width, H=id.height, d=id.data, n=W*H;
  const base=Math.max(3,Math.round(H*0.003)), lim=Math.max(base,Math.round(H*0.025));
  // A larger offset is tried only when this pass saw the edges of a bright/dark line too thick for it.
  const scan=(g,sat,pols)=>{ for (let off=base; off<=lim; off*=2) { const hint={thick:false, pols}, r=detectOverlayBarAt(id,roi,g,sat,off,hint); if (r) return r; if (!hint.thick) break; } return null; };
  const keys=overlayColorKeys(id,roi);
  if (keys.length) {
    const z=new Uint8ClampedArray(n);
    for (const key of keys) { const r=scan(colorKeyGray(id,key),z,[1]); if (r) { r.color=key; return r; } }
  }
  if (opts.colorOnly) return null;
  const g=new Uint8ClampedArray(n), sat=new Uint8ClampedArray(n);
  for (let i=0,p=0;i<n;i++,p+=4) { const r=d[p], gg=d[p+1], b=d[p+2]; g[i]=(r*77+gg*150+b*29)>>8; sat[i]=Math.max(r,gg,b)-Math.min(r,gg,b); }
  return scan(g,sat,[1,-1]);
}
// Dominant overlay colours in the search area: strongly saturated, bright pixels grouped by hue, most frequent first.
// Channels are snapped to 0/255 when close, since overlay colours are pure (JPEG shifts them slightly).
function overlayColorKeys(id, roi) {
  const W=id.width, H=id.height, d=id.data, NB=24, bins=Array.from({length:NB},()=>({n:0,r:0,g:0,b:0}));
  const step=roi?1:2, y5=Math.floor(H*0.55), y3=Math.floor(H*0.3);
  const areas=roi?[[Math.round(roi.x),Math.round(roi.y),Math.round(roi.w),Math.round(roi.h)]]:[[0,y5,W,H-y5],[0,0,W,y3]];
  for (const [ax,ay,aw,ah] of areas) for (let y=Math.max(0,ay);y<Math.min(H,ay+ah);y+=step) for (let x=Math.max(0,ax);x<Math.min(W,ax+aw);x+=step) {
    const p=(y*W+x)*4, r=d[p], g=d[p+1], b=d[p+2], mx=Math.max(r,g,b), mn=Math.min(r,g,b), c=mx-mn;
    if (c<100 || mx<120) continue;
    let h=mx===r ? ((g-b)/c+6)%6 : mx===g ? (b-r)/c+2 : (r-g)/c+4;
    const k=Math.floor(h/6*NB)%NB, B=bins[k]; B.n++; B.r+=r; B.g+=g; B.b+=b;
  }
  const area=areas.reduce((s,a)=>s+a[2]*a[3],0)/(step*step), min=Math.max(15,Math.round(area*3e-5)), keys=[];
  for (let t=0;t<3;t++) {
    let k=-1; for (let i=0;i<NB;i++) if (bins[i].n && (k<0 || bins[i].n>bins[k].n)) k=i;
    if (k<0) break;
    const grp=[bins[(k+NB-1)%NB],bins[k],bins[(k+1)%NB]], s=grp.reduce((a,B)=>({n:a.n+B.n,r:a.r+B.r,g:a.g+B.g,b:a.b+B.b}),{n:0,r:0,g:0,b:0});
    grp.forEach(B=>{B.n=0;B.r=0;B.g=0;B.b=0;});
    if (s.n<min) break;
    // Software overlays use pure colours (yellow, red, green, cyan…); stained or coloured sample areas rarely do.
    const key=[s.r,s.g,s.b].map(v=>{ v=v/s.n; return v>=200?255:v<=55?0:-1; });
    if (key.every(v=>v>=0)) keys.push(key);
  }
  return keys;
}
// Closeness to an overlay colour as a grey map: 255 = that colour, 0 = anything else (sample, background, black).
function colorKeyGray(id, key, tol=90) {
  const d=id.data, n=id.width*id.height, g=new Uint8ClampedArray(n), [kr,kg,kb]=key, h=tol/2;
  for (let i=0,p=0;i<n;i++,p+=4) {
    const dist=Math.max(Math.abs(d[p]-kr),Math.abs(d[p+1]-kg),Math.abs(d[p+2]-kb));
    g[i]=dist<=h?255:dist>=tol?0:Math.round(255*(tol-dist)/h);
  }
  return g;
}
// The same map as an image (white text on black), for OCR of a coloured label.
function colorKeyImageData(id, key) {
  const g=colorKeyGray(id,key), out=new ImageData(id.width,id.height), o=out.data;
  for (let i=0,p=0;i<g.length;i++,p+=4) { o[p]=o[p+1]=o[p+2]=g[i]; o[p+3]=255; }
  return out;
}
// Style of the new bar: same colour as the original overlay.
function overlayScaleStyle(ov) {
  if (ov.color) return {hl:true, hlColor:'#000000', color:'#'+ov.color.map(v=>v.toString(16).padStart(2,'0')).join('')};
  const p=ov.pol; return {hl:true, hlColor:p>0?'#000000':'#ffffff', color:p>0?'#ffffff':'#000000'};
}
function detectOverlayBarAt(id, roi, g, sat, off, hint={}) {
  const W=id.width, H=id.height, T=18;
  const R=roi ? {x:clamp(Math.round(roi.x),0,W-1), y:clamp(Math.round(roi.y),0,H-1)} : null;
  if (R) { R.w=clamp(Math.round(roi.w),1,W-R.x); R.h=clamp(Math.round(roi.h),1,H-R.y); }
  const XA=R?R.x:0, XB=R?R.x+R.w:W;
  const minLen=R?Math.max(8,Math.round(R.w*0.15)):Math.round(W*0.03), maxLen=R?R.w:Math.round(W*0.5);
  const bands=R?[[Math.max(off,R.y),Math.min(H-off-1,R.y+R.h-1)]]:[[Math.floor(H*0.55),H-off-1],[off,Math.floor(H*0.3)]];
  let best=null; const frames=[];
  // Edge of a label plate (box drawn around bar + text): both ends turn into long vertical sides going the same way.
  // Real bar end ticks are short, so such a line is kept only as the plate outline (to erase), never as the bar.
  const frameRun=(s,e,y,onP,len)=>{
    const thr=Math.max(12,Math.round(0.15*len)), lim=thr*8;
    const run=(x,dir)=>{ let k=0; for (let yy=y+dir; yy>=0 && yy<H && k<lim && onP(yy*W+x); yy+=dir) k++; return k; };
    const end=(xa,xb,dir)=>{ let m=0; for (let x=Math.max(0,xa);x<=Math.min(W-1,xb);x++) m=Math.max(m,run(x,dir)); return m; };
    for (const dir of [-1,1]) { const l=end(s,s+2,dir), r=end(e-2,e,dir); if (l>=thr && r>=thr) return {dir, run:Math.min(l,r)}; }
    return null;
  };
  for (const pol of hint.pols||[1,-1]) {
    const onP=i=>sat[i]<30 && (pol>0 ? g[i]>=225 : g[i]<=30);
    for (const [y0,y1] of bands) for (let y=y0;y<=y1;y++) {
      let start=-1, last=-1, two=0; const segs=[];
      for (let x=XA;x<=XB;x++) {
        let r=false, b=false;
        if (x<XB) { const i=y*W+x;
          if (onP(i)) { const v=pol*g[i], up=v-pol*g[i-off*W]>T, dn=v-pol*g[i+off*W]>T; r=up||dn; b=up&&dn; } }
        if (r) { if (start<0) { start=x; two=0; } last=x; if (b) two++; }
        else if (start>=0 && (x-last>3 || x===XB)) {
          if (last-start>=3) segs.push({s:start, e:last, two, br:0});
          start=-1;
        }
      }
      // Join pieces of one line split where a bright/dark feature of the sample touches it (the line itself stays unbroken).
      const merged=[];
      for (const sg of segs) {
        const cur=merged[merged.length-1];
        if (cur) {
          const gap=sg.s-cur.e-1;
          let ok=gap>0 && gap<=Math.max(cur.e-cur.s+1, sg.e-sg.s+1)*1.5;
          if (ok) { let f=0; for (let x=cur.e+1;x<sg.s;x++) if (onP(y*W+x)) f++; ok=f>=gap*0.95; }
          if (ok) { cur.e=sg.e; cur.two+=sg.two; cur.br+=gap; continue; }
        }
        merged.push({...sg});
      }
      for (const m of merged) {
        const len=m.e-m.s+1, q=m.two/Math.max(1,len-m.br);
        if (len>=minLen && len<=maxLen && q<=0.5 && m.br<=0.5*len) hint.thick=true;
        if (len>=minLen && len<=maxLen && q>0.5 && m.br<=0.5*len) {
          const fr=frameRun(m.s,m.e,y,onP,len); if (fr) { frames.push({s:m.s, e:m.e, y, dir:fr.dir, run:fr.run, pol}); continue; }
          const sc=len*q; if (!best || sc>best.sc) best={x:m.s, y, w:len, sc, pol};
        }
      }
    }
  }
  if (!best) return null;
  const pol=best.pol;
  const on=i=>sat[i]<30 && (pol>0 ? g[i]>=225 : g[i]<=30);
  const strict=i=>sat[i]<15 && (pol>0 ? g[i]>=245 : g[i]<=12);
  const fill=y=>{ let f=0; for (let k=best.x;k<best.x+best.w;k++) if (on(y*W+k)) f++; return f/best.w; };
  let t0=best.y, t1=best.y; while (t0>0 && fill(t0-1)>0.7) t0--; while (t1<H-1 && fill(t1+1)>0.7) t1++;
  const bar={x:best.x, y:t0, w:best.w, h:t1-t0+1};
  // JPEG fringing: only the bar core passes the colour test; extend the ends over the softer edge (still bright, a bit coloured).
  { const ym=(t0+t1)>>1, ext=Math.max(3,Math.round(bar.h*0.3)), soft=i=>pol>0 ? g[i]>=190 : g[i]<=65;
    let k=0; while (k<ext && bar.x>0 && soft(ym*W+bar.x-1)) { bar.x--; bar.w++; k++; }
    k=0; while (k<ext && bar.x+bar.w<W && soft(ym*W+bar.x+bar.w)) { bar.w++; k++; } }
  let tickCols=[], tickSpan=[0,0];
  // End ticks: thin vertical marks crossing the line (above AND below). When found, they define the true bar ends,
  // so a bright sample feature touching the line cannot stretch it.
  {
    const bh=bar.h, Lt=Math.max(4,2*bh), cols=[], ups=[], ext=Math.max(8,Math.round(bar.w*0.08));
    const xa=Math.max(0,bar.x-ext), xb=Math.min(W-1,bar.x+bar.w-1+ext);
    for (let x=xa;x<=xb;x++) {
      let up=0, dn=0;
      for (let y=t0-1; y>=0 && up<Lt*4 && on(y*W+x); y--) up++;
      for (let y=t1+1; y<H && dn<Lt*4 && on(y*W+x); y++) dn++;
      cols.push(up>=Lt && dn>=Lt); ups.push([up,dn]);
    }
    const cl=[]; let s=-1;
    for (let i=0;i<=cols.length;i++) { if (i<cols.length && cols[i]) { if (s<0) s=i; } else if (s>=0) { cl.push({s:xa+s, e:xa+i-1}); s=-1; } }
    const thin=cl.filter(c=>c.e-c.s+1<=Math.max(5,1.5*bh));
    const le=best.x, re=best.x+best.w-1, near=(c,e)=>Math.min(Math.abs(c.s-e),Math.abs(c.e-e));
    const L=thin.filter(c=>(c.s+c.e)/2<=bar.x+0.25*bar.w).sort((a,b)=>near(a,le)-near(b,le))[0];
    const Rt=thin.filter(c=>(c.s+c.e)/2>=bar.x+0.75*bar.w).sort((a,b)=>near(a,re)-near(b,re))[0];
    if (L && Rt && Rt.e-L.s+1>=0.6*bar.w) {
      // Tick length: the shortest run over both ticks, so a label glyph touching one tick ("1" of 100 µm, "m" of µm) is not counted as tick.
      const run=(c,k)=>{ let m=1e9; for (let x=c.s;x<=c.e;x++) m=Math.min(m,ups[x-xa][k]); return m; };
      const up=Math.min(run(L,0),run(Rt,0)), dn=Math.min(run(L,1),run(Rt,1));
      bar.x=L.e+1; bar.w=Rt.s-L.e-1; bar.ticks=true; tickCols=[[L.s,L.e],[Rt.s,Rt.e]]; tickSpan=[up+1,dn+1];
    }
  }
  // Label plate around the bar: its outline lines (rejected above) give the rectangle to erase, incl. a small drop shadow.
  let plate=null;
  for (const f of frames) {
    if (f.pol!==pol || f.s>bar.x+2 || f.e<bar.x+bar.w-3 || Math.abs(f.y-bar.y)>H*0.12) continue;
    const top=f.dir>0?f.y:f.y-f.run, bot=f.dir>0?f.y+f.run:f.y;
    if (bar.y<top-2 || bar.y>bot+2) continue;
    plate=plate?{x0:Math.min(plate.x0,f.s), x1:Math.max(plate.x1,f.e), y0:Math.min(plate.y0,top), y1:Math.max(plate.y1,bot)}:{x0:f.s, x1:f.e, y0:top, y1:bot};
  }
  const withPlate=e=>{ if (!plate) return e; const p=off+Math.max(2,Math.round(W*0.003));
    const x0=Math.max(0,Math.min(e.x,plate.x0-p)), y0=Math.max(0,Math.min(e.y,plate.y0-p)), x1=Math.min(W,Math.max(e.x+e.w,plate.x1+1+p)), y1=Math.min(H,Math.max(e.y+e.h,plate.y1+1+p));
    return {x:x0, y:y0, w:x1-x0, h:y1-y0}; };
  // Label search window: labels often run past a short bar ("2 1/nm" over a bar under "2 1").
  const wpad=Math.max(0.8*bar.w,0.1*W);
  const wx0=Math.max(R?R.x:0,Math.round(bar.x-wpad)), wx1=Math.min(R?R.x+R.w:W,Math.round(bar.x+bar.w+wpad)), ww=wx1-wx0;
  const rowThr=Math.max(6,Math.round(ww*0.05)), maxGap=Math.max(3,Math.round(H*0.012)), reach=Math.round(H*0.04), maxH=Math.round(H*0.15);
  const rowCount=y=>{ let c=0; for (let x=wx0;x<wx1;x++) if (strict(y*W+x)) c++; return c; };
  // Tight label: connected glyphs on one text line next to the bar (stray bright specks and other lines are left out).
  // Overlay text is usually pure white/black; sample highlights rarely are, so a "core" mask is tried first.
  const core=i=>sat[i]<6 && (pol>0 ? g[i]>=253 : g[i]<=2);
  function findLabelCC(test) {
    const wy0=Math.max(R?R.y:0,Math.round(t0-H*0.15)), wy1=Math.min(R?R.y+R.h:H,Math.round(t1+1+H*0.15)), wh=wy1-wy0;
    const lx0=Math.min(best.x,bar.x-12), lx1=Math.max(best.x+best.w,bar.x+bar.w+12);
    // The bar and its end ticks are left out, so a glyph touching them (e.g. the µ descender) stays a separate letter.
    const onTick=(x,y)=>y>=t0-tickSpan[0] && y<=t1+tickSpan[1] && tickCols.some(([a,b])=>x>=a-1 && x<=b+1);
    const on2=(x,y)=>!(y>=t0-1 && y<=t1+1 && x>=lx0 && x<=lx1) && !onTick(x,y) && test(y*W+x);
    const lab=new Int32Array(ww*wh), st=[], comps=[], boxes=[null]; let cid=0;
    for (let yy=0;yy<wh;yy++) for (let xx=0;xx<ww;xx++) {
      const k=yy*ww+xx; if (lab[k] || !on2(wx0+xx,wy0+yy)) continue;
      const id=++cid;
      let x0=xx,x1=xx,y0=yy,y1=yy,cnt=0; lab[k]=id; st.push(k);
      while (st.length) {
        const q=st.pop(), qx=q%ww, qy=(q-qx)/ww; cnt++;
        if (qx<x0) x0=qx; if (qx>x1) x1=qx; if (qy<y0) y0=qy; if (qy>y1) y1=qy;
        if (qx+1<ww && !lab[q+1] && on2(wx0+qx+1,wy0+qy)) { lab[q+1]=id; st.push(q+1); }
        if (qx>0 && !lab[q-1] && on2(wx0+qx-1,wy0+qy)) { lab[q-1]=id; st.push(q-1); }
        if (qy+1<wh && !lab[q+ww] && on2(wx0+qx,wy0+qy+1)) { lab[q+ww]=id; st.push(q+ww); }
        if (qy>0 && !lab[q-ww] && on2(wx0+qx,wy0+qy-1)) { lab[q-ww]=id; st.push(q-ww); }
      }
      const w=x1-x0+1, h=y1-y0+1; boxes.push([wx0+x0, wy0+y0, wx0+x1, wy0+y1]);
      if (h>=Math.max(6,H*0.008) && h<=H*0.12 && w<=1.5*bar.w && w>=0.12*h && cnt>=0.12*w*h) comps.push({x:wx0+x0, y:wy0+y0, w, h, id});
    }
    if (!comps.length) return null;
    const gapTo=c=>c.y+c.h<=t0 ? t0-(c.y+c.h) : c.y>t1 ? c.y-t1 : 0;
    const side=c=>c.y+c.h/2<t0 ? -1 : 1;
    const cand=comps.filter(c=>gapTo(c)<=H*0.05 && c.x+c.w>bar.x-bar.w && c.x<bar.x+2*bar.w);
    if (!cand.length) return null;
    // Grow a text line from each candidate: similar glyph height, same baseline band, small letter gaps, same side of the bar.
    // Sample specks rarely line up like text, so the best-scoring line is the label.
    const grow=(seed,hug)=>{
      const sh=seed.h, sd=side(seed), used=[seed], g={x0:seed.x, y0:seed.y, x1:seed.x+seed.w, y1:seed.y+seed.h};
      // hug: the seed glyph must touch the bar's text band (e.g. the µ descender); the rest of the line joins by adjacency.
      const hugOk=c=>sd<0 ? (c.y+c.h<=t1+2 && c.y+c.h>=t0-0.4*sh) : (c.y>=t0-2 && c.y<=t1+0.4*sh);
      if (hug && !hugOk(seed)) return null;
      for (let changed=true; changed;) {
        changed=false;
        for (const c of comps) {
          if (used.includes(c) || side(c)!==sd || c.h<0.45*sh || c.h>1.8*sh) continue;
          const ov=Math.min(g.y1,c.y+c.h)-Math.max(g.y0,c.y), hgap=Math.max(c.x-g.x1, g.x0-(c.x+c.w));
          if (ov>=0.6*Math.min(c.h,sh) && hgap<=0.7*sh) { used.push(c); g.x0=Math.min(g.x0,c.x); g.x1=Math.max(g.x1,c.x+c.w); g.y0=Math.min(g.y0,c.y); g.y1=Math.max(g.y1,c.y+c.h); changed=true; }
        }
      }
      return {used, g, gap:gapTo(seed)};
    };
    // Score: glyph count, minus distance of the line from the bar (labels sit right next to it, usually centred).
    const bcx=bar.x+bar.w/2, score=r=>{ const cx=(r.g.x0+r.g.x1)/2; return r.used.length - 1.5*Math.abs(cx-bcx)/bar.w - 2*r.gap/Math.max(1,r.used[0].h); };
    // First look for a line whose glyphs hug the bar (baseline right at the bar), then any nearby line.
    let bestG=null;
    for (const hug of [true,false]) {
      for (const c of cand) { const r=grow(c,hug); if (!r) continue; r.sc=score(r); if (!bestG || r.sc>bestG.sc) bestG=r; }
      if (bestG && bestG.used.length>=2) break;
    }
    if (!bestG) return null;
    const ids0=new Set(bestG.used.map(c=>c.id));
    const g=bestG.g, L={x:g.x0, y:g.y0, w:g.x1-g.x0, h:g.y1-g.y0};
    // Clip the line to the text band (cap height above the baseline) so a bright spot touching a glyph is cut off.
    if (bestG.used.length>=2) {
      const med=a=>{ const s=[...a].sort((p,q)=>p-q); return s[s.length>>1]; };
      const us=bestG.used, base=med(us.map(c=>c.y+c.h)), onBase=us.filter(c=>Math.abs(c.y+c.h-base)<=0.12*c.h);
      // Cap height: the tallest glyph on the baseline (digits), unless it is much taller than the rest (a bright spot glued on).
      // The median alone is wrong when a letter is split into pieces: \u201cm\u201d in two parts outvotes the digits and cuts their tops off.
      const hs=(onBase.length?onBase:us).map(c=>base-c.y), mh=med(hs), cap=Math.max(...hs.filter(v=>v<=1.6*mh)), top=Math.round(base-1.08*cap);
      if (top>L.y) { L.h-=top-L.y; L.y=top; }
    }
    if (!(L.w>=0.8*L.h && L.h<=maxH)) return null;
    // Glyph pieces cut off by the bar or a tick (the foot of a “2” sitting on the tick, the µ descender) are small
    // separate components: take back every piece that lies inside the text line, and bridge the tick columns where
    // a stroke runs across them. Without this a “2” loses its foot and is read as “7”.
    { const sd=side(bestG.used[0]), pad=Math.round(0.15*L.h);
      const ex0=L.x-pad, ex1=L.x+L.w+pad, ey0=L.y, ey1=sd<0 ? Math.max(L.y+L.h, t0-1) : L.y+L.h+pad;
      const inBox=b=>b && b[0]>=ex0 && b[2]<=ex1 && b[1]>=ey0 && b[3]<=ey1;
      const nx0=Math.max(wx0,ex0), nx1=Math.min(wx1-1,ex1), ny0=Math.max(wy0,ey0), ny1=Math.min(wy1-1,ey1);
      const nw=nx1-nx0+1, nh=ny1-ny0+1, m=new Uint8Array(nw*nh); let y0n=nh, y1n=-1, x0n=nw, x1n=-1;
      for (let y=0;y<nh;y++) for (let x=0;x<nw;x++) { const id=lab[(ny0-wy0+y)*ww+(nx0-wx0+x)];
        if (id && (ids0.has(id) || inBox(boxes[id]))) m[y*nw+x]=1; }
      const tw=tickCols.reduce((s,[a,b])=>Math.max(s,b-a+3),0);
      for (let y=0;y<nh;y++) for (let x=0;x<nw;x++) { const X=nx0+x, Y=ny0+y;
        if (m[y*nw+x] || !onTick(X,Y) || !test(Y*W+X)) continue;
        let l=false, r=false; for (let k=1;k<=tw+2 && !(l&&r);k++) { if (x-k>=0 && m[y*nw+x-k] && !onTick(X-k,Y)) l=true; if (x+k<nw && m[y*nw+x+k] && !onTick(X+k,Y)) r=true; }
        if (l && r) m[y*nw+x]=2; }
      for (let y=0;y<nh;y++) for (let x=0;x<nw;x++) if (m[y*nw+x]) { if (y<y0n) y0n=y; if (y>y1n) y1n=y; if (x<x0n) x0n=x; if (x>x1n) x1n=x; }
      if (y1n>=0) {
        const nL={x:nx0+x0n, y:ny0+y0n, w:x1n-x0n+1, h:y1n-y0n+1}, mm=new Uint8Array(nL.w*nL.h);
        for (let y=0;y<nL.h;y++) for (let x=0;x<nL.w;x++) if (m[(y0n+y)*nw+x0n+x]) mm[y*nL.w+x]=1;
        Object.defineProperty(nL,'mask',{value:mm, enumerable:false});
        Object.defineProperty(nL,'_n',{value:bestG.used.length, enumerable:false});
        return nL;
      }
    }
    // Clean binary of just the chosen glyphs, for OCR.
    const ids=ids0, m=new Uint8Array(L.w*L.h);
    for (let y=0;y<L.h;y++) for (let x=0;x<L.w;x++) if (ids.has(lab[(L.y-wy0+y)*ww+(L.x-wx0+x)])) m[y*L.w+x]=1;
    Object.defineProperty(L,'mask',{value:m, enumerable:false});
    Object.defineProperty(L,'_n',{value:bestG.used.length, enumerable:false});
    return L;
  }
  const findLabel=dir=>{
    let y=dir<0?t0-1:t1+1, first=-1, lastY=-1;
    for (let k=0; y>=0 && y<H && k<maxH+reach; k++, y+=dir) {
      if (rowCount(y)>=rowThr) { if (first<0) first=y; lastY=y; }
      else if (first<0 ? k>reach : Math.abs(y-lastY)>maxGap) break;
    }
    if (first<0) return null;
    const ya=Math.min(first,lastY), yb=Math.max(first,lastY), lh=yb-ya+1;
    if (lh<Math.max(6,H*0.008) || lh>maxH) return null;
    const cols=new Uint16Array(ww); for (let yy=ya;yy<=yb;yy++) for (let x=wx0;x<wx1;x++) if (strict(yy*W+x)) cols[x-wx0]++;
    const need=Math.max(2,Math.round(lh*0.08)); let xa=-1, xb=-1;
    for (let x=0;x<ww;x++) if (cols[x]>=need) { if (xa<0) xa=x; xb=x; }
    if (xa<0 || xb-xa<lh*0.8) return null;
    return {x:wx0+xa, y:ya, w:xb-xa+1, h:lh};
  };
  let label=null;
  for (const test of [core,strict]) { const l=findLabelCC(test); if (l && (!label || (l._n||0)>(label._n||0))) label=l; if (label && label._n>=3) break; }
  label=label || (()=>{ const above=findLabel(-1), below=findLabel(1); return above && below ? (above.w*above.h>=below.w*below.h?above:below) : (above||below); })();
  // A label cut by the user's box edge is partial text: ignore it rather than misread it.
  if (label && R && (label.y<=R.y+1 || label.y+label.h>=R.y+R.h-1 || label.x<=R.x+1 || label.x+label.w>=R.x+R.w-1)) label=null;
  if (!label && !R) return null;
  if (!label) {
    const ty=Math.max(2*off,Math.round(bar.w*0.08));
    const e={x:Math.max(0,bar.x-off), y:Math.max(0,bar.y-ty)}; e.w=Math.min(W,bar.x+bar.w+off)-e.x; e.h=Math.min(H,bar.y+bar.h+ty)-e.y;
    return {bar, label:null, pol, erase:withPlate(e), picked:true};
  }
  const px=Math.max(off,Math.round(label.h*0.15)), ty=Math.max(2*off,Math.round(label.h*0.45));
  const ex0=Math.max(0,Math.min(bar.x-px,label.x-px)), ex1=Math.min(W,Math.max(bar.x+bar.w+px,label.x+label.w+px));
  const ey0=Math.max(0,Math.min(bar.y-ty,label.y-px)), ey1=Math.min(H,Math.max(bar.y+bar.h+ty,label.y+label.h+px));
  return {bar, label, pol, erase:withPlate({x:ex0, y:ey0, w:ex1-ex0, h:ey1-ey0}), picked:!!R};
}
