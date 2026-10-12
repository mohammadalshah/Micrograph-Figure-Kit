# Vendored libraries

Third-party code embedded in the built HTML files. All files are unmodified upstream releases. License texts are in [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).

| Path | Library | Version | License | Upstream |
|---|---|---|---|---|
| `jszip/jszip.min.js` | JSZip | 3.10.1 | MIT (dual MIT / GPLv3; used under MIT) | https://github.com/Stuk/jszip |
| `pako/pako.min.js` | pako | 1.0.11 | MIT and Zlib | https://github.com/nodeca/pako |
| `utif/UTIF.js` | UTIF.js (includes a JPEG decoder derived from Mozilla pdf.js) | 3.1.0 | MIT; pdf.js part Apache-2.0 | https://github.com/photopea/UTIF.js |
| `tesseract/tesseract.min.js` | tesseract.js | 5.1.1 | Apache-2.0 | https://github.com/naptha/tesseract.js |
| `tesseract/worker.min.js` | tesseract.js worker | 5.1.1 | Apache-2.0 | https://github.com/naptha/tesseract.js |
| `tesseract/tesseract-core.js` | tesseract.js-core (Tesseract + Leptonica and image libraries compiled to WebAssembly) | 5.x | Apache-2.0 (bundled libraries: see notices) | https://github.com/naptha/tesseract.js-core |
| `tesseract/eng.traineddata.gz` | Tesseract English model | 4.0 | Apache-2.0 | https://github.com/naptha/tessdata |

The last three files are embedded as base64 by `build.js` so OCR runs from a local file without network access.
