// =====================================================================
// Micrograph Figure Kit — 8. Rendering
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Everything that draws on the output canvas.
// =====================================================================
function fontSpec(px, weight, italic, family) {
  let fam, generic;
  const up=String(family||'').startsWith('__up:') ? state.extraFonts?.find(f=>f.value===family) : null;
  if (family==='__uploaded' && state.fontUploaded) { fam='"UploadedFont"'; generic='serif'; }
  else if (up) { fam=`"${up.family}"`; generic='serif'; }
  else {
    const f = family==='__uploaded' || String(family||'').startsWith('__up:') ? 'Times New Roman' : family;
    fam=`"${f}"`; generic = SERIF_FONTS.has(f) ? 'Georgia, serif' : f==='Courier New' ? 'monospace' : 'Arial, sans-serif';
  }
  return `${italic?'italic ':''}${weight} ${Math.max(1,Math.round(px))}px ${fam}, ${generic}`;
}

function drawLabel(ctx, text, x, y, font, align, fg, edge, ow) {
  ctx.save();
  ctx.font=font; ctx.textAlign=align; ctx.textBaseline='alphabetic';
  if (ow>0) { ctx.lineJoin='round'; ctx.miterLimit=2; ctx.lineWidth=ow*2; ctx.strokeStyle=edge; ctx.strokeText(text,x,y); }
  ctx.fillStyle=fg; ctx.fillText(text,x,y);
  ctx.restore();
}

// Russian sequence per GOST 2.105 (skips ё з й о ч ъ ы ь).
const RU_SEQ='абвгдежиклмнпрстуфхцшщэюя';
// Panel letter for index i, continuing Latin or Russian (GOST) sequences.
function panelText(i, fmt) {
  if (i<0) return '';
  fmt=String(fmt||'');
  const m=fmt.match(/^([^A-Za-zА-Яа-яЁё]*)([A-Za-zА-Яа-яЁё])([^A-Za-zА-Яа-яЁё]*)$/);
  if (!m) return fmt;
  const ch=m[2], upper=ch!==ch.toLowerCase(), low=ch.toLowerCase();
  let l='';
  if (/[а-яё]/.test(low)) {
    const seq=RU_SEQ, N=seq.length;
    let start=seq.indexOf(low);
    if (start<0) { const full='абвгдеёжзийклмнопрстуфхцчшщъыьэюя'; const p=full.indexOf(low); start=0; for (let k=p;k<full.length;k++) { const q=seq.indexOf(full[k]); if (q>=0) { start=q; break; } } }
    let n=i+start;
    do { l=seq[n%N]+l; n=Math.floor(n/N)-1; } while (n>=0);
  } else {
    let n=i+(low.charCodeAt(0)-97);
    do { l=String.fromCharCode(97+n%26)+l; n=Math.floor(n/26)-1; } while (n>=0);
  }
  return m[1]+(upper?l.toUpperCase():l)+m[3];
}

// Current crop rectangle (defaults to above the footer).
function getCrop(item) {
  const W=item.imageData.width, H=item.imageData.height;
  const c=item.crop || {x:0, y:0, w:W, h:(item.plain ? H : item.analysis?.footerY) || H}; // pictures keep the footer
  const x=clamp(Math.round(c.x),0,W-1), y=clamp(Math.round(c.y),0,H-1);
  return {x, y, w:clamp(Math.round(c.w),1,W-x), h:clamp(Math.round(c.h),1,H-y)};
}
// Cropped source pixels as a canvas.
function baseCanvas(item, crop) {
  const adj=item.adj||{}, key=`${crop.x},${crop.y},${crop.w},${crop.h}|${adj.b||0},${adj.c||0},${adj.s||0}`;
  const ov=item.analysis?.footerDetected ? null : item.analysis?.overlay, er=!!(ov && ovEraseOn() && !item.noScale && !item.hideScale), k2=key+(er?'|er':'');
  if (item._base?.key===k2) return item._base.canvas;
  const c=document.createElement('canvas'); c.width=crop.w; c.height=crop.h;
  let src=item.imageData;
  if (er) { if (!item._erased) { item._erased=new ImageData(new Uint8ClampedArray(src.data),src.width,src.height); inpaintRect(item._erased,ov.erase); } src=item._erased; }
  c.getContext('2d').putImageData(src,-crop.x,-crop.y,crop.x,crop.y,crop.w,crop.h);
  if (adj.b||adj.c||adj.s) applyAdjust(c,adj);
  item._base={key:k2, canvas:c};
  return c;
}
function sourceBitmap(item) {
  if (item._src) return item._src;
  const c=document.createElement('canvas'); c.width=item.imageData.width; c.height=item.imageData.height;
  c.getContext('2d').putImageData(item.imageData,0,0);
  item._src=c; return c;
}

// Parse <b>/<i>/<sub>/<sup>… and H_{2}O shortcuts into styled runs.
function parseRich(src) {
  const txt=String(src||'').replace(/\^\{([^{}]*)\}/g,'<sup>$1</sup>').replace(/_\{([^{}]*)\}/g,'<sub>$1</sub>');
  const lines=[[]], st={b:0,i:0,u:0,s:0,sup:0,sub:0}, re=/<(\/?)(b|i|u|s|sup|sub)>|\n/gi;
  const push=t=>{ if (t) lines[lines.length-1].push({t, b:st.b>0, i:st.i>0, u:st.u>0, s:st.s>0, sup:st.sup>0, sub:st.sub>0}); };
  let last=0, m;
  while ((m=re.exec(txt))) {
    push(txt.slice(last,m.index)); last=re.lastIndex;
    if (m[0]==='\n') { lines.push([]); continue; }
    const tag=m[2].toLowerCase(); st[tag]=Math.max(0, st[tag]+(m[1]?-1:1));
  }
  push(txt.slice(last));
  return lines;
}
// Measure rich text lines.
function layoutRich(ctx, o, size, cfg) {
  const fam=o.font||cfg.fontFamily, lh=size*1.22;
  ctx.font=fontSpec(size,o.bold?700:400,o.italic,fam);
  const mm=ctx.measureText('Hg'), asc=mm.actualBoundingBoxAscent||size*0.75, des=mm.actualBoundingBoxDescent||size*0.22;
  let hasSup=false, maxW=0;
  const lines=parseRich(o.text).map(runs=>{
    let x=0; const items=[];
    for (const r of runs) {
      const sz=(r.sup||r.sub)?size*0.62:size, f=fontSpec(sz,(o.bold||r.b)?700:400,o.italic||r.i,fam);
      ctx.font=f; const w=ctx.measureText(r.t).width;
      if (r.sup) hasSup=true;
      items.push({t:r.t, f, x, w, sz, dy:r.sup?-size*0.36:r.sub?size*0.2:0, u:o.underline||r.u, s:o.strike||r.s});
      x+=w;
    }
    maxW=Math.max(maxW,x); return items;
  });
  const top=hasSup?size*0.12:0;
  return {lines, w:maxW, h:top+asc+(lines.length-1)*lh+des+size*0.08, asc:asc+top, lh};
}
function drawRich(ctx, lay, x0, y0, o) {
  ctx.save(); ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.lineJoin='round';
  lay.lines.forEach((items,li)=>{
    const base=y0+lay.asc+li*lay.lh;
    for (const it of items) {
      ctx.font=it.f; const X=x0+it.x, Y=base+it.dy, th=Math.max(1,Math.round(it.sz*0.07));
      const deco=[]; if (it.u) deco.push(Math.round(Y+Math.max(1,it.sz*0.12))); if (it.s) deco.push(Math.round(Y-it.sz*0.3));
      if (o.outline) {
        const ow=Math.max(1.5,it.sz*0.14);
        ctx.strokeStyle=o.outlineColor; ctx.lineWidth=ow; ctx.strokeText(it.t,X,Y);
        ctx.fillStyle=o.outlineColor; for (const dy of deco) ctx.fillRect(X-ow/2,dy-ow/2,it.w+ow,th+ow);
      }
      ctx.fillStyle=o.color; ctx.fillText(it.t,X,Y);
      for (const dy of deco) ctx.fillRect(X,dy,it.w,th);
    }
  });
  ctx.restore();
}
// Rectangle or ellipse.
function drawShape(ctx, o, W, H) {
  const x=o.x*W, y=o.y*H, w=o.w*W, h=o.h*H, sw=o.sw;
  ctx.save();
  ctx.beginPath();
  if (o.type==='rect') ctx.rect(x+sw/2,y+sw/2,Math.max(1,w-sw),Math.max(1,h-sw));
  else ctx.ellipse(x+w/2,y+h/2,Math.max(1,w/2-sw/2),Math.max(1,h/2-sw/2),0,0,Math.PI*2);
  if (o.fill) { ctx.globalAlpha=clamp(o.fillOpacity,0,100)/100; ctx.fillStyle=o.fillColor; ctx.fill(); ctx.globalAlpha=1; }
  ctx.setLineDash(o.dashed?[sw*3,sw*2]:[]);
  if (o.outline) { ctx.strokeStyle=o.outlineColor; ctx.lineWidth=sw+2*Math.max(1,Math.round(sw*0.5)); ctx.stroke(); }
  ctx.strokeStyle=o.color; ctx.lineWidth=sw; ctx.stroke();
  ctx.restore();
}
// Arrow or line, with optional outline and double head.
function drawArrow(ctx, o, W, H) {
  const x1=o.x1*W, y1=o.y1*H, x2=o.x2*W, y2=o.y2*H, sw=o.sw;
  const L=Math.hypot(x2-x1,y2-y1)||1, ux=(x2-x1)/L, uy=(y2-y1)/L;
  const hl=o.type==='arrow' ? Math.min(L*0.9,(o.head>0?o.head:Math.max(sw*4,8))) : 0, hw=hl*0.6;
  const heads=[]; if (hl) { heads.push([x2,y2,ux,uy]); if (o.double) heads.push([x1,y1,-ux,-uy]); }
  const sx=hl&&o.double?x1+ux*hl*0.8:x1, sy=hl&&o.double?y1+uy*hl*0.8:y1, ex=hl?x2-ux*hl*0.8:x2, ey=hl?y2-uy*hl*0.8:y2;
  const pass=(color,extra)=>{
    ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=sw+extra*2; ctx.lineCap=o.dashed?'butt':'round';
    ctx.setLineDash(o.dashed?[sw*3,sw*2]:[]);
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke(); ctx.setLineDash([]);
    for (const [tx,ty,dx,dy] of heads) {
      ctx.beginPath(); ctx.moveTo(tx,ty);
      ctx.lineTo(tx-dx*hl-dy*hw, ty-dy*hl+dx*hw); ctx.lineTo(tx-dx*hl+dy*hw, ty-dy*hl-dx*hw); ctx.closePath();
      ctx.fill(); if (extra) { ctx.lineJoin='miter'; ctx.lineWidth=extra*2; ctx.stroke(); }
    }
  };
  ctx.save();
  if (o.outline) pass(o.outlineColor, Math.max(1,Math.round(sw*0.5)));
  pass(o.color, 0);
  ctx.restore();
}

// Inset: magnified copy of the linked source rectangle, with a frame and optional connector lines.
function drawInset(ctx, o, src, snap, w, h) {
  const x=o.x*w, y=o.y*h, dw=o.w*w, dh=o.h*h, sw=Math.max(0.5,o.sw||2);
  const stroke=(fn)=>{ const pass=(col,extra)=>{ ctx.strokeStyle=col; ctx.lineWidth=sw+extra*2; ctx.setLineDash(o.dashed?[sw*3,sw*2]:[]); fn(); };
    if (o.outline) pass(o.outlineColor, Math.max(1,Math.round(sw*0.5))); pass(o.color,0); ctx.setLineDash([]); };
  ctx.save();
  if (src && snap) {
    const sx=src.x*w, sy=src.y*h, sW=Math.max(1,src.w*w), sH=Math.max(1,src.h*h);
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    ctx.drawImage(snap, sx, sy, sW, sH, x, y, dw, dh);
    if (o.fill) { ctx.globalAlpha=clamp(o.fillOpacity??25,0,100)/100; ctx.fillStyle=o.fillColor||o.color; ctx.fillRect(x,y,dw,dh); ctx.globalAlpha=1; }
    if (o.lines!==false) insetConnectors(ctx,stroke,sx,sy,sW,sH,x,y,dw,dh);
  }
  stroke(()=>ctx.strokeRect(x+sw/2, y+sw/2, Math.max(1,dw-sw), Math.max(1,dh-sw)));
  ctx.restore();
}
// Two corner-to-corner lines between the source box and the magnified view that do not cross either box.
function insetConnectors(ctx,stroke,sx,sy,sW,sH,x,y,dw,dh) {
  const A=[[sx,sy],[sx+sW,sy],[sx,sy+sH],[sx+sW,sy+sH]], B=[[x,y],[x+dw,y],[x,y+dh],[x+dw,y+dh]];
  const ins=(px,py,rx,ry,rw,rh)=>px>rx+0.5 && px<rx+rw-0.5 && py>ry+0.5 && py<ry+rh-0.5;
  let segs=[];
  for (let i=0;i<4;i++) { let ok=true; for (let t=0.03;t<0.98 && ok;t+=0.05) { const px=A[i][0]+(B[i][0]-A[i][0])*t, py=A[i][1]+(B[i][1]-A[i][1])*t; if (ins(px,py,sx,sy,sW,sH) || ins(px,py,x,y,dw,dh)) ok=false; } if (ok) segs.push(i); }
  if (segs.length>2) { let best=[segs[0],segs[1]], bd=-1; for (const i of segs) for (const j of segs) if (i<j) { const d=Math.hypot(A[i][0]-A[j][0],A[i][1]-A[j][1])+Math.hypot(B[i][0]-B[j][0],B[i][1]-B[j][1]); if (d>bd) { bd=d; best=[i,j]; } } segs=best; }
  if (segs.length) { ctx.lineCap='round'; stroke(()=>{ ctx.beginPath(); for (const i of segs) { ctx.moveTo(A[i][0],A[i][1]); ctx.lineTo(B[i][0],B[i][1]); } ctx.stroke(); }); }
}
// Compose: an inset sent as its own panel keeps a frame and connector lines to its source box in the source panel.
function drawComposeInsetLinks(ctx, cells) {
  for (const cell of cells) {
    const L=cell.it.insetLink; if (!L) continue;
    const sc=cells.find(q=>q.it.id===cell.it.insetOf); if (!sc) continue;
    const io=L.inset ? sc.it.objects?.find(q=>q.id===L.inset) : null; if (L.inset && !io) continue;
    const st=io||L, r=sc.it.objects?.find(q=>q.id===(io?.src||L.rect)); if (!r) continue;
    const k=sc.dw/Math.max(1,getCrop(sc.it).w), sw=Math.max(0.5,(st.sw||2)*k);
    const stroke=(fn)=>{ const pass=(col,extra)=>{ ctx.strokeStyle=col; ctx.lineWidth=sw+extra*2; ctx.setLineDash(st.dashed?[sw*3,sw*2]:[]); fn(); };
      if (st.outline) pass(st.outlineColor, Math.max(1,Math.round(sw*0.5))); pass(st.color,0); ctx.setLineDash([]); };
    const sx=sc.dx+r.x*sc.dw, sy=sc.dy+r.y*sc.dh, sW=Math.max(1,r.w*sc.dw), sH=Math.max(1,r.h*sc.dh);
    ctx.save();
    if (st.fill) { ctx.globalAlpha=clamp(st.fillOpacity??25,0,100)/100; ctx.fillStyle=st.fillColor||st.color; ctx.fillRect(cell.dx,cell.dy,cell.dw,cell.dh); ctx.globalAlpha=1; }
    if (st.lines!==false) insetConnectors(ctx,stroke,sx,sy,sW,sH,cell.dx,cell.dy,cell.dw,cell.dh);
    if (st.frame!==false) stroke(()=>ctx.strokeRect(cell.dx+sw/2, cell.dy+sw/2, Math.max(1,cell.dw-sw), Math.max(1,cell.dh-sw)));
    ctx.restore();
  }
}
// Rotation of texts and shapes, degrees stored in o.rot, applied around the box centre.
function objRotRad(o) { const r=Number(o.rot)||0; return r%360 ? r*Math.PI/180 : 0; }
function objRotate(ctx,cx,cy,a) { ctx.translate(cx,cy); ctx.rotate(a); ctx.translate(-cx,-cy); }
// Point p expressed in the unrotated frame of hit box h.
function unrotPt(h,p) { if (!h.rot) return p; const cx=h.x+h.w/2, cy=h.y+h.h/2, c=Math.cos(-h.rot), s=Math.sin(-h.rot), dx=p.x-cx, dy=p.y-cy; return {...p, x:cx+dx*c-dy*s, y:cy+dx*s+dy*c}; }
// Draw free objects and return their hit boxes.
function drawObjects(ctx, objects, w, h, cfg, ppt, defFs) {
  const hits=[];
  let snap=null;
  if (objects.some(o=>o.type==='inset')) { snap=document.createElement('canvas'); snap.width=ctx.canvas.width; snap.height=ctx.canvas.height; snap.getContext('2d').drawImage(ctx.canvas,0,0); }
  for (const o of objects) {
    if (o.type==='erase') {
      const lw=Math.max(1,o.r*w), P=o.pts||[]; if (!P.length) continue;
      ctx.save(); ctx.strokeStyle=ctx.fillStyle=o.color; ctx.lineWidth=lw; ctx.lineCap=ctx.lineJoin='round'; ctx.setLineDash([]);
      if (P.length===1) { ctx.beginPath(); ctx.arc(P[0][0]*w,P[0][1]*h,lw/2,0,Math.PI*2); ctx.fill(); }
      else { ctx.beginPath(); ctx.moveTo(P[0][0]*w,P[0][1]*h); for (let i=1;i<P.length;i++) ctx.lineTo(P[i][0]*w,P[i][1]*h); ctx.stroke(); }
      ctx.restore(); continue;
    }
    if (o.type==='text') {
      if (!o.text) continue;
      const fs=Math.max(4,Math.round(o.size>0?o.size*ppt:defFs));
      const lay=layoutRich(ctx,o,fs,cfg), tp=o.bg?Math.max(2,Math.round(fs*0.2)):0;
      const bw=Math.ceil(lay.w)+2*tp, bh=Math.ceil(lay.h)+2*tp;
      const bx0=Math.round(clamp(o.x*w,0,Math.max(0,w-bw))), by0=Math.round(clamp(o.y*h,0,Math.max(0,h-bh)));
      const rot=objRotRad(o); if (rot) { ctx.save(); objRotate(ctx,bx0+bw/2,by0+bh/2,rot); }
      if (o.bg) { ctx.fillStyle=o.bgColor; ctx.fillRect(bx0,by0,bw,bh); }
      drawRich(ctx,lay,bx0+tp,by0+tp,o);
      if (rot) ctx.restore();
      hits.push({kind:'obj', id:o.id, type:'text', x:bx0, y:by0, w:bw, h:bh, fs, rot});
    } else if (o.type==='rect' || o.type==='ellipse') {
      const rot=objRotRad(o); if (rot) { ctx.save(); objRotate(ctx,(o.x+o.w/2)*w,(o.y+o.h/2)*h,rot); }
      drawShape(ctx,o,w,h);
      if (rot) ctx.restore();
      hits.push({kind:'obj', id:o.id, type:o.type, x:o.x*w, y:o.y*h, w:o.w*w, h:o.h*h, rot});
    } else if (o.type==='inset') {
      if (insetSent(o)) continue;
      const src=objects.find(q=>q.id===o.src);
      if (src) { o.ar=Math.max(1,src.w*w)/Math.max(1,src.h*h); o.h=o.w*w/o.ar/h; }
      drawInset(ctx,o,src,snap,w,h);
      hits.push({kind:'obj', id:o.id, type:'inset', x:o.x*w, y:o.y*h, w:o.w*w, h:o.h*h});
    } else {
      drawArrow(ctx,o,w,h);
      hits.push({kind:'obj', id:o.id, type:o.type, seg:true, sw:o.sw, x1:o.x1*w, y1:o.y1*h, x2:o.x2*w, y2:o.y2*h,
        x:Math.min(o.x1,o.x2)*w, y:Math.min(o.y1,o.y2)*h, w:Math.abs(o.x2-o.x1)*w, h:Math.abs(o.y2-o.y1)*h});
    }
  }
  return hits;
}

// Draw the final image for one item. ov = per-call overrides (used by Compose).
function renderResult(item, ov) {
  const cfg=ov ? {...settings(), ...ov} : settings();
  const crop=getCrop(item), w=crop.w, h=crop.h, short=Math.min(w,h);
  const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(baseCanvas(item,crop),0,0);
  const edge='#000', sSt=lblStyle(item,'scale',cfg), pSt=lblStyle(item,'panel',cfg), fg=sSt.color;
  const hits=[], warnings=[];

  // Scale bar and unit label
  const noScale=!!item.noScale || !!item.hideScale;
  const scaleText=noScale?'':(item.targetScaleText||item.sourceScaleText);
  const label=noScale?'':displayScale(scaleText,cfg);
  const barW=noScale?Math.round(w*0.2):(item.targetBarPx||computeBarLengthPx(originalBarPx(item),item.sourceScaleText,scaleText));
  const ppt = w / (cfg.printWidthCm / 2.54 * 72);
  let fontSize = cfg.fontSizeMode==='fixed' ? cfg.fixedFontSize*ppt : cfg.fontSizeMode==='bar' ? barW*0.55 : short*cfg.autoFontPct;
  if (cfg.fontSizeMode!=='fixed') fontSize=clamp(fontSize,10,short*0.2);
  if (sSt.size>0) fontSize=sSt.size*ppt;
  fontSize=Math.max(4,Math.round(fontSize));
  const font=fontSpec(fontSize,cfg.fontWeight,cfg.italic,cfg.fontFamily);
  ctx.font=font;
  const tm=ctx.measureText(label);
  const textW=Math.ceil(tm.width);
  const ascent=Math.ceil(tm.actualBoundingBoxAscent||fontSize*0.72);
  const descent=Math.ceil(tm.actualBoundingBoxDescent||fontSize*0.2);
  const thickness=item.targetBarThicknessPx||Math.max(2,Math.round(fontSize*cfg.barThickness));
  const gap=Math.max(1,Math.round(fontSize*cfg.gap));
  const groupW=Math.max(barW,textW), groupH=ascent+descent+gap+thickness;
  const mx=Math.round(cfg.rightMargin*w), my=mx;
  const pad=sSt.hl?Math.max(2,Math.round(fontSize*0.3)):0;
  const boxW=groupW+2*pad, boxH=groupH+2*pad;
  let bx, by;
  const ovE=item.analysis?.footerDetected ? null : item.analysis?.overlay?.erase;
  if (item.scalePos) { bx=item.scalePos.x*w; by=item.scalePos.y*h; }
  else if (ovE && !ov) {
    // Optical overlay: put the new bar over the original one.
    const W0=item.imageData.width, H0=item.imageData.height;
    bx = ovE.x+ovE.w/2 < W0/2 ? ovE.x-crop.x : ovE.x+ovE.w-crop.x-boxW;
    by = ovE.y+ovE.h/2 < H0/2 ? ovE.y-crop.y : ovE.y+ovE.h-crop.y-boxH;
  } else {
    bx = cfg.scalePosition.endsWith('l') ? mx : w-mx-boxW;
    by = cfg.scalePosition.startsWith('t') ? my : h-my-boxH;
  }
  if (!noScale && (boxW>w || boxH>h)) warnings.push('The scale annotation is larger than the image. Reduce the font size or the output scale.');
  bx=Math.round(clamp(bx,0,Math.max(0,w-boxW))); by=Math.round(clamp(by,0,Math.max(0,h-boxH)));
  if (pad && !noScale) { ctx.fillStyle=sSt.hlColor; ctx.fillRect(bx,by,boxW,boxH); }
  const left=bx+pad, top=by+pad, ow=sSt.ol?Math.max(1,Math.round(fontSize*0.08)):0;
  const barX=Math.round(left+(groupW-barW)/2), textX=left+groupW/2;
  let barY, baseline;
  if (cfg.barBelow) { baseline=top+ascent; barY=top+ascent+descent+gap; }
  else { barY=top; baseline=top+thickness+gap+ascent; }
  if (!noScale) {
    if (ow) { ctx.fillStyle=sSt.olColor; ctx.fillRect(barX-ow,barY-ow,barW+2*ow,thickness+2*ow); }
    drawLabel(ctx,label,textX,baseline,font,'center',fg,sSt.olColor,ow);
    ctx.fillStyle=fg; ctx.fillRect(barX,barY,barW,thickness);
    hits.push({kind:'scale', x:bx, y:by, w:boxW, h:boxH});
  }

  // Panel letter: upper-left by default, or where the user dragged it
  if (!cfg.forceNoPanel && !item.noPanel && (cfg.panelEnabled || item.showPanel)) {
    const txt = cfg.labelOverride ? cfg.labelOverride : (item.panelLabel && !cfg.ignorePanelLabel) ? item.panelLabel : panelText(cfg.panelIndex ?? state.items.indexOf(item), cfg.panelFormat);
    if (txt) {
      const ps=pSt.size>0?Math.max(4,Math.round(pSt.size*ppt)):cfg.panelSize>0?Math.round(cfg.panelSize*ppt):Math.max(10,Math.round(short*0.07));
      const pf=fontSpec(ps,cfg.panelWeight,false,cfg.fontFamily);
      ctx.font=pf;
      const m=ctx.measureText(txt);
      const asc=Math.ceil(m.actualBoundingBoxAscent||ps*0.72), des=Math.ceil(m.actualBoundingBoxDescent||ps*0.2);
      const abl=Math.ceil(m.actualBoundingBoxLeft||0), tw=Math.ceil((m.actualBoundingBoxRight||m.width)+abl);
      const mg=Math.round(cfg.panelMargin*w), pp=pSt.hl?Math.max(2,Math.round(ps*0.25)):0;
      const pw=tw+2*pp, ph=asc+des+2*pp;
      let px=mg, py=mg;
      const pPos=cfg.panelPosOverride||item.panelPos; // Compose keeps its own letter positions
      if (pPos) { px=pPos.x*w; py=pPos.y*h; }
      px=Math.round(clamp(px,0,Math.max(0,w-pw))); py=Math.round(clamp(py,0,Math.max(0,h-ph)));
      if (pp) { ctx.fillStyle=pSt.hlColor; ctx.fillRect(px,py,pw,ph); }
      drawLabel(ctx,txt,px+pp+abl,py+pp+asc,pf,'left',pSt.color,pSt.olColor,pSt.ol?Math.max(1,Math.round(ps*0.06)):0);
      hits.push({kind:'panel', x:px, y:py, w:pw, h:ph});
    }
  }

  hits.push(...drawObjects(ctx,item.objects||[],w,h,cfg,ppt,fontSize));
  if (item.measShow && item.measures?.length) drawMeasuresFinal(ctx,item,crop,cfg,fontSize,sSt.color,ppt);

  const a=item.analysis;
  if (a?.footerDetected && !item.plain && crop.y+crop.h>a.footerY) warnings.push('The crop includes part of the image footer.');
  if (ov) canvas._hits=hits;
  if (!ov) item.renderMeta={ppt,barW,thickness,fontSize,left,top,right:left+groupW,bottom:top+groupH,scaleText,label,crop,hits,warnings};
  return canvas;
}

// Effective style for the scale label (k="scale") or panel letter (k="panel"): per-image override or global.
function lblStyle(it,k,cfg) {
  const s=it?.[k+'Style']||{}, g=k==='scale'?{hl:cfg.scaleHl,c:cfg.scaleHlColor,ol:cfg.scaleOl,oc:cfg.scaleOlColor}:{hl:cfg.panelHl,c:cfg.panelHlColor,ol:cfg.panelOl,oc:cfg.panelOlColor};
  return {size:s.size>0?s.size:0, color:s.color||(cfg.color==='black'?'#000000':'#ffffff'), hl:s.hl??!!g.hl, hlColor:s.hlColor||g.c||'#000000', ol:s.ol??!!g.ol, olColor:s.olColor||g.oc||'#000000'};
}
// Render and store item.outputCanvas.
function renderInto(item) {
  item.outputCanvas=renderResult(item);
  item.outputBlob=null;
  item.status='ok'; item.error='';
}

// Validate calibration, compute the output bar and render.
function finalizeAndRender(item) {
  if (item.noScale) { renderInto(item); return; }
  const orig=originalBarPx(item);
  if (!item.sourceScaleText) throw new Error('Source scale is unknown. Enter it in Calibration below.');
  if (!(orig>0)) throw new Error('Original scale bar was not detected. Enter “Original bar, px” in Calibration below.');
  item.targetScaleText=normalizeManualScale(item.targetScaleText||item.sourceScaleText);
  if (parseScaleText(item.targetScaleText).fam!==parseScaleText(item.sourceScaleText).fam) item.targetScaleText=item.sourceScaleText;
  item.targetBarPx=computeBarLengthPx(orig,item.sourceScaleText,item.targetScaleText);
  renderInto(item);
}

function canvasBlob(canvas) { return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not create PNG.')),'image/png')); }
async function ensureBlob(item) {
  if (!item?.outputCanvas) throw new Error('Process this image first.');
  if (!item.outputBlob) item.outputBlob=await canvasBlob(item.outputCanvas);
  return item.outputBlob;
}

// Full pipeline for one file: OCR → calibration → render.
async function processItem(item,index,total,cfg) {
  if (item.plain) { renderInto(item); item.status='ok'; renderUI(); return; }
  item.status='working'; item.error=''; renderUI();
  try {
    if (!item.sourceManual) {
      if (cfg.scaleMode==='manual') {
        if (!cfg.manualScale) throw new Error('Enter a valid manual source scale.');
        item.sourceScaleText=cfg.manualScale; item.ocrRaw='(manual source)';
      } else {
        setProgress(index/total,`OCR ${index+1}/${total}`);
        item.sourceScaleText='';
        const ocr=await readScaleOCR(item,p=>setProgress((index+p)/total,`${index+1}/${total}`));
        item.ocrRaw=ocr.raw; item.ocrConf=ocr.conf??null; item.ocrUnitGuess=!!ocr.unitGuessed; item.ocrDismissed=false; item.sourceScaleText=ocr.normalized;
      }
    }
    finalizeAndRender(item);
  } catch(e) {
    item.status='error'; item.error=e.message||String(e); item.outputCanvas=null; item.outputBlob=null;
  }
  renderUI();
}

