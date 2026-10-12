// =====================================================================
// Micrograph Figure Kit — 26. Vector SVG export
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    While an SVG export runs, every 2D canvas context is wrapped: drawing still happens on the canvas
//    (so text measuring and pixel reads work) and each drawing call is also recorded as SVG.
//    Labels, scale bars, shapes, arrows and measurements become editable SVG text and paths;
//    the micrograph (and anything built from pixel operations) is embedded as a lossless PNG.
// =====================================================================
const SVGX={on:false, sid:0};
const SVG_TAU=Math.PI*2;
const svgEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const svgN=v=>String(+(+v).toFixed(3));
function svgMatrix(m) { return (m.a===1 && m.b===0 && m.c===0 && m.d===1 && m.e===0 && m.f===0) ? '' : ` transform="matrix(${[m.a,m.b,m.c,m.d,m.e,m.f].map(svgN).join(' ')})"`; }
// Canvas colour string → SVG colour + opacity (rgba() is not understood by every SVG editor).
function svgPaint(c, alpha) {
  if (typeof c!=='string') return null;
  let col=c, o=1; const m=/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(c);
  if (m) { col=`rgb(${Math.round(m[1])},${Math.round(m[2])},${Math.round(m[3])})`; if (m[4]!=null) o=+m[4]; }
  return {col, o:o*alpha};
}
const svgPaintAttr=(p,kind)=>`${kind}="${p.col}"`+(p.o<1?` ${kind}-opacity="${svgN(p.o)}"`:'');
function svgFont(f) {
  const m=/^\s*(?:(italic|oblique)\s+)?(?:(normal|small-caps)\s+)?(?:(bold|bolder|lighter|normal|\d{3})\s+)?(?:\w+\s+)?([\d.]+)px(?:\/[\d.]+\w*)?\s+(.+)$/i.exec(f||'');
  if (!m) return 'font-size="10"';
  const w=m[3]==='bold'?'700':(m[3]&&m[3]!=='normal'?m[3]:'400');
  return `font-family="${svgEsc(m[5].replace(/"/g,"'"))}" font-size="${svgN(m[4])}" font-weight="${w}"`+(m[1]?` font-style="${m[1]}"`:'');
}
const SVG_ANCHOR={left:'start', start:'start', center:'middle', right:'end', end:'end'};
const SVG_BASE={top:'text-before-edge', hanging:'hanging', middle:'central', bottom:'text-after-edge', ideographic:'ideographic'};

class SvgRec {
  constructor(canvas, ctx) {
    this.sid=SVGX.sid; this.canvas=canvas; this.ctx=ctx; this.ops=[]; this.raster=false; this.path=[]; this.hasPt=false;
    const self=this;
    this.proxy=new Proxy(ctx,{
      get(t,p) { if (p in SvgRec.H) return (...a)=>SvgRec.H[p].call(self,...a); const v=Reflect.get(t,p); return typeof v==='function'?v.bind(t):v; },
      set(t,p,v) { return Reflect.set(t,p,v); },
    });
  }
  pt(x,y) { const m=this.ctx.getTransform(); return [m.a*x+m.c*y+m.e, m.b*x+m.d*y+m.f]; }
  M(x,y) { const [X,Y]=this.pt(x,y); this.path.push('M'+svgN(X)+' '+svgN(Y)); this.hasPt=true; }
  L(x,y) { const [X,Y]=this.pt(x,y); this.path.push('L'+svgN(X)+' '+svgN(Y)); this.hasPt=true; }
  C(a,b,c,d,e,f) { const p=[...this.pt(a,b),...this.pt(c,d),...this.pt(e,f)]; this.path.push('C'+p.map(svgN).join(' ')); this.hasPt=true; }
  arcSeg(cx,cy,rx,ry,rot,a0,a1,ccw) {
    let d=a1-a0;
    if (!ccw) { if (d>=SVG_TAU) d=SVG_TAU; else if (d<0) d=(d%SVG_TAU)+SVG_TAU; }
    else { if (d<=-SVG_TAU) d=-SVG_TAU; else if (d>0) d=(d%SVG_TAU)-SVG_TAU; }
    const cr=Math.cos(rot), sr=Math.sin(rot), P=(u,v)=>[cx+rx*u*cr-ry*v*sr, cy+rx*u*sr+ry*v*cr];
    const s0=P(Math.cos(a0),Math.sin(a0)); if (this.hasPt) this.L(...s0); else this.M(...s0);
    const n=Math.max(1,Math.ceil(Math.abs(d)/(Math.PI/2)-1e-9)), st=d/n, k=4/3*Math.tan(st/4);
    for (let i=0;i<n;i++) {
      const t=a0+i*st, t2=t+st, c0=Math.cos(t), s_=Math.sin(t), c2=Math.cos(t2), s2=Math.sin(t2);
      this.C(...P(c0-k*s_, s_+k*c0), ...P(c2+k*s2, s2-k*c2), ...P(c2,s2));
    }
  }
  scale() { const m=this.ctx.getTransform(); return Math.sqrt(Math.abs(m.a*m.d-m.b*m.c))||1; }
  strokeAttrs() {
    const c=this.ctx, k=this.scale(), p=svgPaint(c.strokeStyle,c.globalAlpha); if (!p) { this.raster=true; return null; }
    const dash=c.getLineDash();
    return svgPaintAttr(p,'stroke')+` stroke-width="${svgN(c.lineWidth*k)}" stroke-linecap="${c.lineCap}" stroke-linejoin="${c.lineJoin}" stroke-miterlimit="${svgN(c.miterLimit)}"`+(dash.length?` stroke-dasharray="${dash.map(v=>svgN(v*k)).join(' ')}"`:'');
  }
  fillAttrs() { const c=this.ctx, p=svgPaint(c.fillStyle,c.globalAlpha); if (!p) { this.raster=true; return null; } return svgPaintAttr(p,'fill'); }
  text(t,x,y,stroke) {
    const c=this.ctx, a=stroke?this.strokeAttrs():this.fillAttrs(); if (!a) return;
    const anc=SVG_ANCHOR[c.textAlign]||'start', bl=SVG_BASE[c.textBaseline];
    this.ops.push(`<text xml:space="preserve" x="${svgN(x)}" y="${svgN(y)}"${svgMatrix(c.getTransform())} ${svgFont(c.font)}`+(anc!=='start'?` text-anchor="${anc}"`:'')+(bl?` dominant-baseline="${bl}"`:'')+(stroke?' fill="none" '+a:' '+a)+`>${svgEsc(t)}</text>`);
  }
  // Pixels of any image source (or part of it) as a PNG data URL, without recording the copy.
  rasterURL(img,sx,sy,sw,sh) {
    const t=document.createElement('canvas'); t.width=Math.max(1,Math.round(sw)); t.height=Math.max(1,Math.round(sh));
    SvgRec.getCtx.call(t,'2d').drawImage(img,sx,sy,sw,sh,0,0,t.width,t.height); return t.toDataURL('image/png');
  }
}
SvgRec.getCtx=HTMLCanvasElement.prototype.getContext;
SvgRec.H={
  beginPath() { this.path=[]; this.hasPt=false; this.ctx.beginPath(); },
  moveTo(x,y) { this.M(x,y); this.ctx.moveTo(x,y); },
  lineTo(x,y) { if (this.hasPt) this.L(x,y); else this.M(x,y); this.ctx.lineTo(x,y); },
  closePath() { if (this.hasPt) this.path.push('Z'); this.ctx.closePath(); },
  rect(x,y,w,h) { this.M(x,y); this.L(x+w,y); this.L(x+w,y+h); this.L(x,y+h); this.path.push('Z'); this.ctx.rect(x,y,w,h); },
  arc(cx,cy,r,a0,a1,ccw) { this.arcSeg(cx,cy,r,r,0,a0,a1,!!ccw); this.ctx.arc(cx,cy,r,a0,a1,ccw); },
  ellipse(cx,cy,rx,ry,rot,a0,a1,ccw) { this.arcSeg(cx,cy,rx,ry,rot,a0,a1,!!ccw); this.ctx.ellipse(cx,cy,rx,ry,rot,a0,a1,ccw); },
  quadraticCurveTo(qx,qy,x,y) { this.path.push('Q'+[...this.pt(qx,qy),...this.pt(x,y)].map(svgN).join(' ')); this.hasPt=true; this.ctx.quadraticCurveTo(qx,qy,x,y); },
  bezierCurveTo(a,b,c,d,x,y) { this.C(a,b,c,d,x,y); this.ctx.bezierCurveTo(a,b,c,d,x,y); },
  fill(...a) { const f=this.fillAttrs(); if (f && this.path.length) this.ops.push(`<path d="${this.path.join('')}" ${f}/>`); this.ctx.fill(...a); },
  stroke(...a) { const s=this.strokeAttrs(); if (s && this.path.length) this.ops.push(`<path d="${this.path.join('')}" fill="none" ${s}/>`); this.ctx.stroke(...a); },
  fillRect(x,y,w,h) { const sv=[this.path,this.hasPt]; this.path=[]; this.hasPt=false; this.M(x,y); this.L(x+w,y); this.L(x+w,y+h); this.L(x,y+h); this.path.push('Z');
    const f=this.fillAttrs(); if (f) this.ops.push(`<path d="${this.path.join('')}" ${f}/>`); [this.path,this.hasPt]=sv; this.ctx.fillRect(x,y,w,h); },
  strokeRect(x,y,w,h) { const sv=[this.path,this.hasPt]; this.path=[]; this.hasPt=false; this.M(x,y); this.L(x+w,y); this.L(x+w,y+h); this.L(x,y+h); this.path.push('Z');
    const s=this.strokeAttrs(); if (s) this.ops.push(`<path d="${this.path.join('')}" fill="none" ${s}/>`); [this.path,this.hasPt]=sv; this.ctx.strokeRect(x,y,w,h); },
  clearRect(x,y,w,h) { const m=this.ctx.getTransform(), cv=this.canvas;
    if (m.isIdentity && x<=0 && y<=0 && x+w>=cv.width && y+h>=cv.height) this.ops=[]; else this.raster=true; this.ctx.clearRect(x,y,w,h); },
  fillText(t,x,y,mw) { this.text(t,x,y,false); if (mw!=null) this.ctx.fillText(t,x,y,mw); else this.ctx.fillText(t,x,y); },
  strokeText(t,x,y,mw) { this.text(t,x,y,true); if (mw!=null) this.ctx.strokeText(t,x,y,mw); else this.ctx.strokeText(t,x,y); },
  putImageData(...a) { this.raster=true; this.ctx.putImageData(...a); },
  clip(...a) { this.raster=true; this.ctx.clip(...a); },
  drawImage(img,...a) {
    const W=img.width||img.naturalWidth||0, H=img.height||img.naturalHeight||0;
    let sx=0, sy=0, sw=W, sh=H, dx, dy, dw=W, dh=H;
    if (a.length<=4) { [dx,dy]=a; if (a.length===4) [,,dw,dh]=a; } else [sx,sy,sw,sh,dx,dy,dw,dh]=a;
    const m=this.ctx.getTransform(), rec=img.__svgRec, alpha=this.ctx.globalAlpha<1?` opacity="${svgN(this.ctx.globalAlpha)}"`:'';
    if (W && H) {
      if (rec && rec.sid===SVGX.sid && !rec.raster && a.length<=4) {
        // A canvas drawn with recorded calls: nest its vector content, scaled into the target box.
        this.ops.push(`<g${svgMatrix(m.translate(dx,dy).scale(dw/W,dh/H))}${alpha}>\n${rec.ops.join('\n')}\n</g>`);
      } else {
        this.ops.push(`<image x="${svgN(dx)}" y="${svgN(dy)}" width="${svgN(dw)}" height="${svgN(dh)}" preserveAspectRatio="none"${svgMatrix(m)}${alpha} xlink:href="${this.rasterURL(img,sx,sy,sw,sh)}"/>`);
      }
    }
    this.ctx.drawImage(img,...a);
  },
};
HTMLCanvasElement.prototype.getContext=function(type,...a) {
  const ctx=SvgRec.getCtx.call(this,type,...a);
  if (!SVGX.on || type!=='2d' || !ctx) return ctx;
  if (this.__svgRec?.sid!==SVGX.sid) this.__svgRec=new SvgRec(this,ctx);
  return this.__svgRec.proxy;
};
// Render once more with recording on and write an SVG at the printed size (mm).
// render() must return the canvas it drew; if vector recording is not possible, the raster SVG is used.
async function svgVector(render, dpi, fallback) {
  let cv=null; SVGX.sid++; SVGX.on=true;
  try { cv=render(); } catch (_) { cv=null; } finally { SVGX.on=false; }
  const rec=cv?.__svgRec;
  if (!rec || rec.sid!==SVGX.sid || rec.raster) return svgBlob(cv||fallback, dpi);
  const w=cv.width, h=cv.height, mm=v=>String(+(v/dpi*25.4).toFixed(2));
  return new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'+mm(w)+'mm" height="'+mm(h)+'mm" viewBox="0 0 '+w+' '+h+'">\n'+rec.ops.join('\n')+'\n</svg>\n'],{type:'image/svg+xml'});
}
