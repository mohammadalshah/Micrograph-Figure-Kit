#!/usr/bin/env node
/*
  Micrograph Figure Kit — build script (Node.js 16+, no dependencies)

  Assembles the single-file app from src/ and vendor/:
    src/index.html is the page template. Two kinds of markers are replaced:
      <!--@include PATH-->   inserts the text file at PATH (one trailing newline removed)
      <!--@base64 PATH-->    inserts the file at PATH encoded as base64 (used for the
                             Tesseract worker, WebAssembly core and English language data,
                             so OCR works from file:// without any network access)

  Usage
    node build.js           write Micrograph_Figure_Kit.html in the project folder
    node build.js --check   rebuild in memory and exit with code 1 if the HTML file is out of date
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const TEMPLATE = 'src/index.html';
const OUTPUTS = ['Micrograph_Figure_Kit.html'];

const readBuf = (p) => fs.readFileSync(path.join(ROOT, p));
const readText = (p) => readBuf(p).toString('utf8').replace(/\r\n/g, '\n'); // tolerate Windows line endings

function build() {
  const used = [];
  const html = readText(TEMPLATE).replace(/<!--@(include|base64) ([^\s>]+)-->/g, (_, kind, p) => {
    used.push(p);
    return kind === 'base64' ? readBuf(p).toString('base64') : readText(p).replace(/\n$/, '');
  });
  return { html, used };
}

const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

const { html, used } = build();
const check = process.argv.includes('--check');
let stale = 0;

for (const out of OUTPUTS) {
  const file = path.join(ROOT, out);
  if (check) {
    const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    const ok = cur === html;
    if (!ok) stale++;
    console.log(`${ok ? 'up to date' : 'OUT OF DATE'}  ${out}`);
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html, 'utf8');
    console.log(`wrote ${out}  (${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB)`);
  }
}
console.log(`${used.length} source files, sha256 ${sha256(html)}`);
if (stale) { console.error('Run "node build.js" to update the HTML files.'); process.exit(1); }
