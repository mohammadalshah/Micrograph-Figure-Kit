// =====================================================================
// Micrograph Figure Kit — 6. Footer / scale-bar detection
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    SEM images: the info footer, the original bar and candidate label boxes.
//    Optical images: a thin bar drawn inside the picture and its label (detectOverlayBar).
// =====================================================================
function imageDataToGray(imageData) {
  const {data} = imageData;
  const g = new Uint8Array(imageData.width*imageData.height);
  for (let i=0, p=0; i<g.length; i++, p+=4) g[i] = (77*data[p] + 150*data[p+1] + 29*data[p+2]) >> 8;
  return g;
}

// Row where the SEM info footer starts (edge-based).
function detectFooterY(gray, w, h, searchFraction=0.35, darkThreshold=25, minDarkRatio=0.70) {
  const start = Math.max(1, Math.floor(h*(1-searchFraction)));
  let bestY = -1, bestScore = -Infinity; const cands=[];
  const win = Math.max(8, Math.floor(0.015*h));
  const darkRatio = new Float32Array(h);
  for (let y=start-1; y<h; y++) {
    let dark=0; const off=y*w;
    for (let x=0; x<w; x++) if (gray[off+x] <= darkThreshold) dark++;
    darkRatio[y] = dark/w;
  }
  for (let y=start; y<h-3; y++) {
    if (darkRatio[y] < minDarkRatio) continue;
    const y2 = Math.min(h, y+win);
    let dr=0; for (let yy=y; yy<y2; yy++) dr += darkRatio[yy];
    dr /= (y2-y);
    if (dr < minDarkRatio) continue;
    let diff=0; const a=(y-1)*w, b=y*w;
    for (let x=0; x<w; x++) diff += Math.abs(gray[b+x]-gray[a+x]);
    diff /= w;
    const score = diff * (0.5 + dr); cands.push({y, score});
    if (score > bestScore) { bestScore=score; bestY=y; }
  }
  const minH=Math.max(20, Math.floor(0.025*h));
  // The strongest edge can be inside the footer (a line between its text rows). Then use the topmost strong edge high
  // enough to hold a footer, whose whole band down to the bottom is still mostly dark.
  if (bestY >= 0 && h-bestY < minH) {
    const bandDark=y=>{ let s=0; for (let yy=y; yy<h; yy++) s+=darkRatio[yy]; return s/(h-y); };
    const alt=cands.filter(c=>h-c.y>=minH && c.score>=0.35*bestScore && bandDark(c.y)>=minDarkRatio).sort((p,q)=>p.y-q.y)[0];
    if (alt) bestY=alt.y;
  }
  if (bestY < 0) throw new Error('Footer was not detected automatically.');
  if (h-bestY < minH) throw new Error('Detected footer is too small.');
  return bestY;
}

// Generic footer: a flat, uniformly colored band (dark, gray or light) at the bottom.
function detectFooterUniform(gray, w, h) {
  const start=Math.floor(h*0.55), tol=3, n=h-start;
  const mode=new Int16Array(n), frac=new Float32Array(n), hist=new Uint32Array(256);
  for (let y=start; y<h; y++) {
    hist.fill(0); const off=y*w;
    for (let x=0; x<w; x++) hist[gray[off+x]]++;
    let sum=0; for (let v=0; v<=2*tol; v++) sum+=hist[v];
    let best=sum, bv=tol;
    for (let v=tol+1; v<256-tol; v++) { sum+=hist[v+tol]-hist[v-tol-1]; if (sum>best) { best=sum; bv=v; } }
    mode[y-start]=bv; frac[y-start]=best/w;
  }
  const bottom=[], look=Math.max(8,Math.round(0.05*h));
  for (let i=n-1; i>=Math.max(0,n-look); i--) if (frac[i]>=0.45) bottom.push(mode[i]);
  if (bottom.length<4) throw new Error('Footer was not detected automatically.');
  bottom.sort((a,b)=>a-b); const bg=bottom[bottom.length>>1];
  const isFooter=i=>(frac[i]>=0.45 && Math.abs(mode[i]-bg)<=6) || (frac[i]>=0.28 && Math.abs(mode[i]-bg)<=4);
  const maxGap=Math.max(3,Math.round(0.006*h));
  let top=-1, gap=0;
  for (let i=n-1; i>=0; i--) {
    if (isFooter(i)) { top=i; gap=0; }
    else if (++gap>maxGap) break;
  }
  if (top<0) throw new Error('Footer was not detected automatically.');
  let k=0; while (top>0 && k<4 && frac[top-1]>=0.6) { top--; k++; }
  const fy=start+top;
  if (h-fy<Math.max(20,0.03*h) || h-fy>0.42*h) throw new Error('Footer was not detected automatically.');
  return fy;
}

function otsuThreshold(values) {
  const hist = new Uint32Array(256);
  for (let i=0; i<values.length; i++) hist[values[i]]++;
  const total = values.length;
  let sum=0; for (let i=0;i<256;i++) sum += i*hist[i];
  let sumB=0,wB=0,best=0,maxVar=-1;
  for (let t=0;t<256;t++) {
    wB += hist[t]; if (!wB) continue;
    const wF = total-wB; if (!wF) break;
    sumB += t*hist[t];
    const mB=sumB/wB, mF=(sum-sumB)/wF;
    const v=wB*wF*(mB-mF)*(mB-mF);
    if (v>maxVar) {maxVar=v; best=t;}
  }
  return best;
}

// Foreground = annotation pixels, whatever the footer color (bright text on dark/gray or dark text on light).
function footerBinary(gray, w, h, footerY) {
  const fh=h-footerY, vals=gray.subarray(footerY*w, h*w);
  const hist=new Uint32Array(256); for (let i=0;i<vals.length;i++) hist[vals[i]]++;
  let bg=0; for (let v=1; v<256; v++) if (hist[v]>hist[bg]) bg=v;
  const otsu=otsuThreshold(vals), light=bg>=128;
  const thr=light ? Math.min(otsu, Math.round(bg*0.55)) : Math.max(otsu, Math.round(bg+0.45*(255-bg)));
  const mask=new Uint8Array(vals.length);
  for (let i=0;i<vals.length;i++) mask[i]=light ? (vals[i]<=thr?1:0) : (vals[i]>=thr?1:0);
  return {mask, fw:w, fh, thr, bg, light};
}

// Remove table/grid lines (long horizontal or full-height vertical runs) so they don't merge with the bar or text.
function removeLongLines(src, w, h) {
  const m=src.slice(), minH=Math.round(0.45*w), minV=Math.round(0.6*h);
  for (let y=0; y<h; y++) {
    const o=y*w; let x=0;
    while (x<w) { if (!src[o+x]) { x++; continue; } let e=x; while (e<w && src[o+e]) e++; if (e-x>=minH) m.fill(0,o+x,o+e); x=e; }
  }
  for (let x=0; x<w; x++) {
    let y=0;
    while (y<h) { if (!src[y*w+x]) { y++; continue; } let e=y; while (e<h && src[e*w+x]) e++; if (e-y>=minV) for (let k=y;k<e;k++) m[k*w+x]=0; y=e; }
  }
  return m;
}

function connectedComponents(mask, w, h) {
  const visited = new Uint8Array(mask.length);
  const comps = [];
  const stack = [];
  for (let i=0;i<mask.length;i++) {
    if (!mask[i] || visited[i]) continue;
    let minX=w, maxX=-1, minY=h, maxY=-1, area=0;
    stack.length=0; stack.push(i); visited[i]=1;
    while (stack.length) {
      const p=stack.pop(); area++;
      const y=(p/w)|0, x=p-y*w;
      if (x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;
      for (let dy=-1; dy<=1; dy++) {
        const ny=y+dy; if (ny<0||ny>=h) continue;
        for (let dx=-1; dx<=1; dx++) {
          const nx=x+dx; if ((!dx&&!dy)||nx<0||nx>=w) continue;
          const q=ny*w+nx;
          if (visited[q] || !mask[q]) continue;
          visited[q]=1; stack.push(q);
        }
      }
    }
    comps.push({x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1,area});
  }
  return comps;
}

// Horizontal-run profile of a component: longest run, its row/x-range and line thickness.
function runProfile(mask, fw, c) {
  let run=0, row=c.y, rx0=c.x;
  const runs=new Int32Array(c.h);
  for (let y=c.y; y<c.y+c.h; y++) {
    let cur=0, best=0, bx=0; const o=y*fw;
    for (let x=c.x; x<c.x+c.w; x++) { if (mask[o+x]) { if (++cur>best) { best=cur; bx=x-cur+1; } } else cur=0; }
    runs[y-c.y]=best;
    if (best>run) { run=best; row=y; rx0=bx; }
  }
  let thick=0; for (let i=0;i<runs.length;i++) if (runs[i]>=0.8*run) thick++;
  return {run, row, rx0, rx1:rx0+run-1, thick};
}

// Solid bar, a bar with end caps, or a bar split by its label (FEI style: |—— 20 µm ——|).
function detectSolidBar(mask, comps, fw, fh) {
  const cand=[];
  for (const c of comps) {
    if (c.w<Math.max(8,Math.floor(0.005*fw)) || c.w>0.6*fw || c.h<2 || c.y>0.9*fh) continue;
    const p=runProfile(mask,fw,c);
    if (p.run<0.8*c.w || p.run<6) continue;
    cand.push({c, ...p});
  }
  let best=null, bestScore=-Infinity;
  for (const k of cand) {
    const aspect=k.run/k.c.h; if (aspect<2.5) continue;
    const score=k.run*Math.min(aspect,10)*(k.c.area/(k.c.w*k.c.h)+0.3);
    if (score>bestScore) { bestScore=score; best=k; }
  }
  if (!best) return null;
  // Merge collinear segments separated by the label text.
  const parts=[best]; let x0=best.c.x, x1=best.c.x+best.c.w-1;
  let grew=true;
  while (grew) {
    grew=false;
    for (const k of cand) {
      if (parts.includes(k)) continue;
      if (Math.abs(k.row-best.row)>2 || Math.abs(k.thick-best.thick)>2 || k.run<0.3*best.run || k.run>3*best.run) continue;
      const kx0=k.c.x, kx1=k.c.x+k.c.w-1;
      const gap = kx0>x1 ? kx0-x1 : x0>kx1 ? x0-kx1 : -1;
      if (gap<=0 || gap>0.4*fw || gap>1.5*Math.max(best.run,k.run)) continue;
      const g0=kx0>x1?x1:kx1, g1=kx0>x1?kx0:x0;
      const between=comps.some(t=>t!==best.c && t!==k.c && t.x>=g0 && t.x+t.w-1<=g1 && t.y<=best.row+Math.max(best.c.h,12) && t.y+t.h>=best.row-Math.max(best.c.h,12));
      if (!between) continue;
      parts.push(k); x0=Math.min(x0,kx0); x1=Math.max(x1,kx1); grew=true;
    }
  }
  const y0=Math.min(...parts.map(k=>k.c.y)), y1=Math.max(...parts.map(k=>k.c.y+k.c.h-1));
  // Length is measured between the inner edges of the end marks (columns taller than the bar line at both ends).
  const col=x=>{ let c=0; for (let y=y0;y<=y1;y++) if (mask[y*fw+x]) c++; return c; };
  const ow=x1-x0+1, capThr=best.thick+Math.max(2,Math.round(0.5*best.thick)), capMax=Math.max(3,Math.round(0.08*ow));
  let a=x0, b=x1; while (a<x1 && col(a)>=capThr) a++; while (b>a && col(b)>=capThr) b--;
  const capped=a>x0 && b<x1 && a-x0<=capMax && x1-b<=capMax;
  return {x:capped?a:x0, y:y0, w:capped?b-a+1:ow, h:y1-y0+1, kind:parts.length>1?'split':'solid', parts:parts.map(k=>k.c), outer:{x:x0, w:ow}, capped};
}

// Last resort once OCR has located the scale text: the longest horizontal line next to it
// (merging collinear pieces on both sides of the text).
function findBarNearText(mask, fw, fh, tx0, ty0, tx1, ty1) {
  const th=Math.max(4,ty1-ty0), segs=[];
  const yA=Math.max(0,Math.floor(ty0-2.5*th)), yB=Math.min(fh-1,Math.ceil(ty1+2.5*th));
  const xA=Math.max(0,Math.floor(tx0-0.35*fw)), xB=Math.min(fw-1,Math.ceil(tx1+0.35*fw));
  for (let y=yA; y<=yB; y++) {
    let x=xA; const o=y*fw;
    while (x<=xB) {
      if (!mask[o+x]) { x++; continue; }
      let e=x; while (e<=xB && mask[o+e]) e++;
      if (e-x>=Math.max(6,0.015*fw) && e-x<0.6*fw) segs.push({y, x0:x, x1:e-1});
      x=e;
    }
  }
  let best=null;
  for (const sg of segs) {
    const row=segs.filter(q=>Math.abs(q.y-sg.y)<=1);
    let a=sg.x0, b=sg.x1;
    for (const q of row) {
      if (q.x0>b && q.x0-b<=(tx1-tx0)+3*th && b<=tx0+th && q.x0>=tx1-th) b=Math.max(b,q.x1);
      if (q.x1<a && a-q.x1<=(tx1-tx0)+3*th && a>=tx1-th && q.x1<=tx0+th) a=Math.min(a,q.x0);
    }
    const len=b-a+1;
    if (!best || len>best.w) best={x:a, y:sg.y, w:len, h:1};
  }
  return best;
}

// Ruler-type bar (TESCAN, etc.): evenly spaced vertical ticks sharing a base/top line, or a segmented tick bar.
function detectRulerBar(mask, fw, fh) {
  const minLen=Math.max(3,Math.round(0.04*fh)), maxLen=Math.round(0.6*fh), maxTickW=Math.max(4,Math.round(0.006*fw));
  const ticks=[];
  for (let x=0; x<fw; x++) {
    let y=0;
    while (y<fh) {
      if (!mask[y*fw+x]) { y++; continue; }
      let e=y; while (e<fh && mask[e*fw+x]) e++;
      const len=e-y;
      if (len>=minLen && len<=maxLen) {
        const t=ticks.find(t=>t.x1===x-1 && Math.abs(t.y0-y)<=2 && Math.abs(t.y1-(e-1))<=2);
        if (t) { t.x1=x; t.y0=Math.min(t.y0,y); t.y1=Math.max(t.y1,e-1); }
        else ticks.push({x0:x, x1:x, y0:y, y1:e-1});
      }
      y=e;
    }
  }
  const narrow=ticks.filter(t=>(t.x1-t.x0+1)<=maxTickW && (t.y1-t.y0+1)>=2*(t.x1-t.x0+1));
  let best=null, bestScore=0;
  const evaluate=(seq, key)=>{
    if (seq.length<5) return;
    const first=seq[0], last=seq[seq.length-1], span=last.x1-first.x0+1;
    if (span<0.04*fw || span>0.7*fw) return;
    const gaps=[]; for (let i=1;i<seq.length;i++) gaps.push(seq[i].x0-seq[i-1].x0);
    const mean=gaps.reduce((a,b)=>a+b,0)/gaps.length;
    const cv=Math.sqrt(gaps.reduce((a,b)=>a+(b-mean)*(b-mean),0)/gaps.length)/mean;
    const ref=Math.round(seq.reduce((a,t)=>a+t[key],0)/seq.length);
    let cov=0;
    for (let x=first.x0; x<=last.x1; x++) {
      for (let y=Math.max(0,ref-2); y<=Math.min(fh-1,ref+2); y++) if (mask[y*fw+x]) { cov++; break; }
    }
    cov/=span;
    const line=cov>=0.9;
    if (!line && !(seq.length>=8 && cv<0.08)) return;
    const score=span*(line?2:1)*(cv<0.15?1.5:1);
    if (score>bestScore) {
      bestScore=score;
      const y0=Math.min(...seq.map(t=>t.y0)), y1=Math.max(...seq.map(t=>t.y1));
      // Length between the inner edges of the first and last tick; outer extent kept for the label search.
      best={x:first.x1+1, y:y0, w:Math.max(1,last.x0-first.x1-1), h:y1-y0+1, kind:'ruler', ticks:seq.length, outer:{x:first.x0, w:span}};
    }
  };
  for (const key of ['y1','y0']) {
    const sorted=[...narrow].sort((a,b)=>a[key]-b[key]);
    const groups=[]; let cur=[];
    for (const t of sorted) {
      if (cur.length && t[key]-cur[0][key]>2) { groups.push(cur); cur=[]; }
      cur.push(t);
    }
    if (cur.length) groups.push(cur);
    for (const g of groups) {
      if (g.length<5) continue;
      g.sort((a,b)=>a.x0-b.x0);
      let seq=[g[0]];
      for (let i=1;i<g.length;i++) {
        const gap=g[i].x0-g[i-1].x0;
        const ref=seq.length>=2 ? (seq[seq.length-1].x0-seq[0].x0)/(seq.length-1) : gap;
        const ok=gap>=3 && gap<=0.1*fw && (seq.length<2 || Math.abs(gap-ref)<=0.25*ref+1);
        if (ok) seq.push(g[i]);
        else { evaluate(seq,key); seq=(gap>=3 && gap<=0.1*fw) ? [g[i-1],g[i]] : [g[i]]; }
      }
      evaluate(seq,key);
    }
  }
  return best;
}

// Candidate text regions around the bar (above, below, right, left), nearest first.
function labelCandidates(comps, fw, fh, footerY, b) {
  if (b.outer) b={...b, x:b.outer.x, w:b.outer.w}; // search around the full bar, end marks included
  const parts = b.parts || [b];
  const inBar = c => parts.some(p => c.x >= p.x-1 && c.x+c.w <= p.x+p.w+1 && c.y >= p.y-1 && c.y+c.h <= p.y+p.h+1);
  const pieces = comps.filter(c => !inBar(c) && c.area >= 6 && c.h >= 4 && c.w <= 0.2*fw && c.h <= 0.6*fh).sort((p,q)=>p.x-q.x);
  const hs = pieces.map(p=>p.h).sort((p,q)=>p-q);
  const medH = hs.length ? hs[hs.length>>1] : 10;
  const maxGap = Math.max(6, Math.round(medH*0.9), Math.round(0.012*fw));
  const groups = [];
  for (const c of pieces) {
    let target = null;
    for (const g of groups) {
      const gap = c.x - (g.x+g.w);
      const ov = Math.min(c.y+c.h, g.y+g.h) - Math.max(c.y, g.y);
      if (gap <= maxGap && gap >= -c.w && ov > 0.3*Math.min(c.h, g.h)) { target = g; break; }
    }
    if (target) {
      const x1=Math.max(target.x+target.w,c.x+c.w), y1=Math.max(target.y+target.h,c.y+c.h);
      target.x=Math.min(target.x,c.x); target.y=Math.min(target.y,c.y); target.w=x1-target.x; target.h=y1-target.y;
    } else groups.push({x:c.x,y:c.y,w:c.w,h:c.h});
  }
  const bcx=b.x+b.w/2, bcy=b.y+b.h/2, out=[];
  for (const g of groups) {
    if (g.w > 0.3*fw) continue;
    const gcx=g.x+g.w/2, gcy=g.y+g.h/2;
    const hOver = Math.min(g.x+g.w, b.x+b.w) - Math.max(g.x, b.x) > 0 || Math.abs(gcx-bcx) < b.w;
    const vOver = Math.abs(gcy-bcy) < Math.max(g.h, b.h)*1.2;
    let where='', d=Infinity;
    if (gcx > b.x && gcx < b.x+b.w && vOver && gcy > b.y-g.h && gcy < b.y+b.h+g.h) { where='inside'; d=0; }
    else if (g.y+g.h <= b.y+1 && b.y-(g.y+g.h) < 2.5*g.h && hOver) { where='above'; d=b.y-(g.y+g.h); }
    else if (g.y >= b.y+b.h-1 && g.y-(b.y+b.h) < 2.5*g.h && hOver) { where='below'; d=g.y-(b.y+b.h); }
    else if (g.x >= b.x+b.w-1 && vOver && g.x-(b.x+b.w) < 0.12*fw) { where='right'; d=g.x-(b.x+b.w); }
    else if (g.x+g.w <= b.x+1 && vOver && b.x-(g.x+g.w) < 0.12*fw) { where='left'; d=b.x-(g.x+g.w); }
    if (where) out.push({x:g.x, y:footerY+g.y, w:g.w, h:g.h, where, d});
  }
  out.sort((p,q)=>p.d-q.d);
  // Tick ruler (e.g. Hitachi S-3400): the value sits under the ruler, right-aligned with its end.
  // Text left of the ruler (working distance “9.4mm”, magnification) is not the scale.
  if (b.kind==='ruler') {
    const inSpan=out.filter(c=>{ const cx=c.x+c.w/2; return cx>=b.x && cx<=b.x+b.w; });
    const tol=Math.max(6,0.08*b.w), al=inSpan.filter(c=>Math.abs(c.x+c.w-(b.x+b.w))<=tol);
    al.forEach(c=>c.aligned=true); inSpan.forEach(c=>c.inSpan=true);
    if (inSpan.length) return [...al, ...inSpan.filter(c=>!al.includes(c))].slice(0,5);
  }
  return out.slice(0, 5);
}

// Fill a rectangle from its surrounding pixels (bilinear blend of the border), used to remove a burned-in bar.
function inpaintRect(id, r) {
  const W=id.width, H=id.height, d=id.data;
  const x0=Math.max(0,r.x), y0=Math.max(0,r.y), x1=Math.min(W-1,r.x+r.w-1), y1=Math.min(H-1,r.y+r.h-1);
  const L=Math.max(0,x0-2), R=Math.min(W-1,x1+2), Tp=Math.max(0,y0-2), B=Math.min(H-1,y1+2);
  const px=(x,y,c)=>d[(y*W+x)*4+c];
  const hasL=x0>1, hasR=x1<W-2, hasT=y0>1, hasB=y1<H-2;
  for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++) {
    const p=(y*W+x)*4;
    for (let c=0;c<3;c++) {
      let s=0, ws=0;
      if (hasL || hasR) { const a=hasL?px(L,y,c):px(R,y,c), b=hasR?px(R,y,c):a, t=(x-L)/Math.max(1,R-L), v=a+(b-a)*t, dd=Math.min(hasL?x-L:1e9, hasR?R-x:1e9); s+=v/dd; ws+=1/dd; }
      if (hasT || hasB) { const a=hasT?px(x,Tp,c):px(x,B,c), b=hasB?px(x,B,c):a, t=(y-Tp)/Math.max(1,B-Tp), v=a+(b-a)*t, dd=Math.min(hasT?y-Tp:1e9, hasB?B-y:1e9); s+=v/dd; ws+=1/dd; }
      if (ws) d[p+c]=s/ws;
    }
  }
}
function ovEraseOn() { return !!document.getElementById('ovErase')?.checked; }

// Run all detection steps for one image.
function analyzeImage(imageData) {
  const w=imageData.width, h=imageData.height;
  const gray=imageDataToGray(imageData);
  const res={footerY:h, footerDetected:false, bar:null, labelCands:[], threshold:null, notes:[]};
  // A coloured bar with its label drawn on the image (TEM, some SEM): no footer. Checked first, because a dark image
  // with the bar at the bottom also looks like a footer.
  const cov=detectOverlayBar(imageData,null,{colorOnly:true});
  if (cov) {
    res.overlay=cov; res.bar={x:cov.bar.x, y:cov.bar.y, w:cov.bar.w, h:cov.bar.h, kind:'overlay'}; res.labelCands=[cov.label];
    res.notes.push('Coloured scale bar found inside the image. Process reads it, erases the original and draws a new bar in its place.');
    return res;
  }
  try { res.footerY=detectFooterY(gray,w,h); }
  catch (_) {
    try { res.footerY=detectFooterUniform(gray,w,h); }
    catch (e) {
      const ov=detectOverlayBar(imageData);
      if (ov) {
        res.overlay=ov; res.bar={x:ov.bar.x, y:ov.bar.y, w:ov.bar.w, h:ov.bar.h, kind:'overlay'}; res.labelCands=[ov.label];
        res.notes.push('Optical-microscope scale bar found inside the image. Process reads it, erases the original and draws a new bar in its place.');
        return res;
      }
      res.notes.push(`${e.message} The whole image is kept — use Crop if needed.`); return res;
    }
  }
  res.footerDetected=true;
  const bin=footerBinary(gray,w,h,res.footerY);
  res.threshold=bin.thr;
  const clean=removeLongLines(bin.mask,bin.fw,bin.fh);
  Object.defineProperty(res,'_mask',{value:{clean, fw:bin.fw, fh:bin.fh}, enumerable:false});
  const comps=connectedComponents(clean,bin.fw,bin.fh);
  const bar=detectRulerBar(bin.mask,bin.fw,bin.fh) || detectSolidBar(clean,comps,bin.fw,bin.fh);
  if (!bar) {
    // A dark optical image can fake a "footer" at the drawn bar; the overlay reaching above it means it is not a footer.
    const ov=detectOverlayBar(imageData);
    if (ov && ov.erase.y<res.footerY) {
      res.footerY=h; res.footerDetected=false; res.threshold=null;
      res.overlay=ov; res.bar={x:ov.bar.x, y:ov.bar.y, w:ov.bar.w, h:ov.bar.h, kind:'overlay'}; res.labelCands=[ov.label];
      res.notes.push('Optical-microscope scale bar found inside the image. Process reads it, erases the original and draws a new bar in its place.');
      return res;
    }
  }
  if (!bar) { res.notes.push('Scale bar was not detected automatically. Enter “Original bar, px” in Calibration.'); return res; }
  res.bar={x:bar.x, y:res.footerY+bar.y, w:bar.w, h:bar.h, kind:bar.kind};
  if (bar.kind==='split') res.notes.push('Scale bar is split by its label; the full length between the end marks is used.');
  res.labelCands=labelCandidates(comps,bin.fw,bin.fh,res.footerY,bar);
  return res;
}

