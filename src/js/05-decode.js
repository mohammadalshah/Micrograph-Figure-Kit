// =====================================================================
// Micrograph Figure Kit — 5. Image decoding
// Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.
//    Every format ends up as ImageData in item.imageData.
// =====================================================================
async function decodeFile(file) {
  const ext = extOf(file.name);
  if (ext === 'bmp') return decodeBMP(await file.arrayBuffer());
  if (ext === 'tif' || ext === 'tiff') return decodeTIFF(await file.arrayBuffer());
  return decodeBrowserImage(file);
}

async function decodeBrowserImage(file) {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(file);
    const c = document.createElement('canvas'); c.width = bitmap.width; c.height = bitmap.height;
    const ctx = c.getContext('2d', {willReadFrequently:true});
    ctx.drawImage(bitmap, 0, 0); bitmap.close?.();
    return ctx.getImageData(0, 0, c.width, c.height);
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const im = new Image(); im.onload = () => resolve(im); im.onerror = reject; im.src = url;
    });
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d', {willReadFrequently:true}); ctx.drawImage(img,0,0);
    return ctx.getImageData(0,0,c.width,c.height);
  } finally { URL.revokeObjectURL(url); }
}

// BMP decoder (8/24/32-bit, uncompressed) for SEM exports browsers cannot read reliably.
function decodeBMP(buffer) {
  const dv = new DataView(buffer);
  if (dv.getUint16(0, true) !== 0x4D42) throw new Error('Invalid BMP file.');
  const pixelOffset = dv.getUint32(10, true);
  const dibSize = dv.getUint32(14, true);
  if (dibSize < 40) throw new Error('BMP DIB ≥ 40 bytes is required.');
  const width = dv.getInt32(18, true);
  const heightRaw = dv.getInt32(22, true);
  const height = Math.abs(heightRaw);
  const topDown = heightRaw < 0;
  const planes = dv.getUint16(26, true);
  const bpp = dv.getUint16(28, true);
  const compression = dv.getUint32(30, true);
  if (planes !== 1 || (compression !== 0 && !(compression === 3 && bpp === 32))) throw new Error('Only uncompressed BMP (BI_RGB) is supported.');
  if (![8,24,32].includes(bpp)) throw new Error(`BMP ${bpp}-bit is not supported yet. Use 8/24/32-bit.`);
  if (!(width > 0 && height > 0) || width * height > 200e6) throw new Error('BMP size is invalid or too large.');

  let palette = null;
  if (bpp === 8) {
    const colorsUsed = Math.min(256, dv.getUint32(46, true) || 256);
    const paletteStart = 14 + dibSize;
    palette = new Array(colorsUsed);
    for (let i=0; i<colorsUsed; i++) {
      const p = paletteStart + i*4;
      palette[i] = [dv.getUint8(p+2), dv.getUint8(p+1), dv.getUint8(p), 255];
    }
  }

  const rowStride = (Math.ceil(width * bpp / 8) + 3) & ~3;
  if (pixelOffset + rowStride * height > buffer.byteLength) throw new Error('BMP file is truncated.');
  // 32-bit BI_BITFIELDS: channel masks follow the 40-byte header (also where V4/V5 headers keep them).
  let bf = null;
  if (compression === 3) {
    const mk = m => { if (!m) return null; let s = 0; while (!((m >>> s) & 1)) s++; return {m, s, max: m >>> s}; };
    bf = [mk(dv.getUint32(54, true)), mk(dv.getUint32(58, true)), mk(dv.getUint32(62, true))];
    if (bf.some(x => !x)) bf = null;
  }
  const out = new Uint8ClampedArray(width * height * 4);
  for (let y=0; y<height; y++) {
    const srcY = topDown ? y : (height - 1 - y);
    const row = pixelOffset + srcY * rowStride;
    for (let x=0; x<width; x++) {
      const o = (y*width + x)*4;
      if (bpp === 8) {
        const idx = dv.getUint8(row+x);
        const c = palette[idx] || [idx,idx,idx,255];
        out[o]=c[0]; out[o+1]=c[1]; out[o+2]=c[2]; out[o+3]=255;
      } else if (bpp === 24) {
        const p = row + x*3;
        out[o]=dv.getUint8(p+2); out[o+1]=dv.getUint8(p+1); out[o+2]=dv.getUint8(p); out[o+3]=255;
      } else {
        const p = row + x*4;
        if (bf) { const v = dv.getUint32(p, true); for (let c = 0; c < 3; c++) out[o+c] = Math.round(((v & bf[c].m) >>> bf[c].s) * 255 / bf[c].max); out[o+3] = 255; continue; }
        out[o]=dv.getUint8(p+2); out[o+1]=dv.getUint8(p+1); out[o+2]=dv.getUint8(p); out[o+3]=255;
      }
    }
  }
  return new ImageData(out, width, height);
}

async function decodeTIFF(buffer) {
  const UTIF = await ensureUTIF();
  const ifds = UTIF.decode(buffer);
  if (!ifds?.length) throw new Error('TIFF does not contain images.');
  const tw = ifds[0].t256?.[0] || 0, th = ifds[0].t257?.[0] || 0;
  if (tw * th > 200e6) throw new Error('TIFF size is invalid or too large.');
  UTIF.decodeImage(buffer, ifds[0]);
  const rgba = UTIF.toRGBA8(ifds[0]);
  const id = new ImageData(new Uint8ClampedArray(rgba), ifds[0].width, ifds[0].height);
  id.pages = ifds.length; // multi-page TIFF: only the first page is used (noted in addFiles)
  return id;
}

