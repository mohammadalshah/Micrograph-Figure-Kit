# Micrograph Figure Kit

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23318122.svg)](https://doi.org/10.5281/zenodo.23318122)

Micrograph Figure Kit is software for preparing publication figures from SEM, optical microscope and EDS images. It removes the instrument info footer, reads the original scale bar, draws a clean and accurate new scale bar, and arranges images into multi-panel figures at print size and dpi.

Everything runs locally in the browser. No installation, no internet connection, and no image ever leaves your computer.

Русская версия: [README.ru.md](README.ru.md). Full feature description: [`FEATURES.md`](FEATURES.md). Supported computers and browsers: [`docs/SYSTEM_REQUIREMENTS.md`](docs/SYSTEM_REQUIREMENTS.md).

---


## Features

**Clean & annotate**
- Detects the SEM info footer and crops it off.
- Finds the original scale bar (solid bars, split bars, tick rulers such as TESCAN and Hitachi S-3400) and reads its value with OCR.
- Optical microscope images: finds a bar drawn inside the picture, including bars on a label plate.
- **Pick bar**: drag a box around any scale bar the automatic search missed; the tool measures it, reads the label and replaces it.
- Draws a new scale bar with a round value, in your font, size, color, thickness and position.
- Panel letters ((a), (b)… or custom), text, arrows, lines, shapes and zoom insets.
- Free rotation of text and shapes (Shift snaps to 15°), Ctrl+click multi-select with align and distribute.
- Brush eraser with adjustable size; Alt+click picks a color from the image.
- Crop, brightness, contrast and sharpness per image, with batch apply.
- Measurements: distance, angle, particle (ellipse) and polygon with area, perimeter and equivalent diameter; CSV export.
- Optional OCR warning badge for low-confidence readings.
- Save PNG, all PNGs, ZIP with CSV audit, or all images as TIFF, PDF or SVG.

**Compose figure**
- Lays out processed images in rows (equal row height, equal cells, or free placement) at a set print width and dpi.
- Panel letters inside or outside the images; scale text at true point size.
- Text, shapes and arrows over the whole figure; Ctrl+click align of panels.
- Export as PNG with dpi information, uncompressed TIFF, PDF, SVG, CSV, or copy to the clipboard for Word and PowerPoint.

**EDS maps**
- Extracts element maps, the electron image and spectra from Oxford AZtec Word reports (.docx) or image files.
- Reads element names and the scale bar, removes burned-in labels, and applies Word-style brightness, contrast and sharpness.
- Reads element content (wt.% / at.%) from the report tables or the spectrum image.
- Builds a map figure (PNG, PDF, SVG, CSV, maps as ZIP), or sends maps to Compose as editable panels (Refresh updates them after EDS changes).

**General**
- Save and open sessions (.json).
- Undo / redo, keyboard shortcuts, saved themes, night mode, collapsible settings sections.
- English and Russian interface; English or Russian units (µm / мкм) and decimal comma.

## Supported files

- Images: TIFF, PNG, JPEG, BMP, WebP
- EDS reports: Word .docx (old .doc files must be re-saved as .docx)

## How to use

1. Download `Micrograph_Figure_Kit.html` and open it in a current browser (Chrome, Edge or Firefox). Double-clicking the file is enough.
2. Drop images into **1. Input images** and click **Process**.
3. Check each result. If a value or bar length is wrong, correct it under **Calibration**, or use **Pick bar**.
4. Save single PNGs, all images to a folder (PNG, TIFF, PDF or SVG), or a ZIP with a CSV audit.
5. For a multi-panel figure, open the **Compose figure** tab, set the width, dpi and layout, and save.

Tip: check the scale value of every image before publication. OCR is good but not infallible.

## Privacy and security

The page contains all its code and libraries. A built-in Content Security Policy blocks every outbound network connection, so images and results stay on your computer.

## Project structure (for developers)

Users only need the single HTML file. The source is split for readability and review:

```
src/
  index.html          page layout (template with @include markers)
  styles.css          all styles
  js/00-header.js     overview of the data model and module list
  js/01-05-*.js       core helpers, units, libraries, font storage, image decoding
  js/06-08-*.js       scale-bar detection, OCR, rendering
  js/09-14-*.js       Clean tab: ingestion, preview, downloads, canvas editing, events
  js/15-16-*.js       Compose tab and per-image label editor
  js/17*-*.js         EDS tab (17 maps, 17a element content, 17b export)
  js/18-startup.js    start-up
  js/20-26-*.js       session files, undo/redo, batch apply, shortcuts, measurements, EN/RU text, vector SVG export
  js/offline-ocr.js   starts the embedded OCR worker without network access
vendor/               unmodified third-party libraries (see vendor/README.md)
build.js              assembles Micrograph_Figure_Kit.html from src/ and vendor/
Micrograph_Figure_Kit.html   built single-file app (the file users open)
docs/                 developer documentation (MODULE_MAP.md)
```

Build (Node.js 16 or newer, no dependencies):

```
node build.js           # writes Micrograph_Figure_Kit.html
node build.js --check   # reports whether the HTML file matches the source
```

Module-by-module overview: [`docs/MODULE_MAP.md`](docs/MODULE_MAP.md). Edit files in `src/`, then rebuild. Edits made directly in the HTML file are overwritten by the next build.

## Citation

If Micrograph Figure Kit contributed to a thesis, dissertation, report or presentation, please cite it as:

> Alshah, M., & Kutzhanov, M. (2026). *Micrograph Figure Kit* (Version 1.0.0) [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.23318122

Citation in journal articles is welcome but not required.

## License

Copyright © 2026 Mohammad Alshah and Magzhan Kutzhanov. Released under the MIT License; see the `LICENSE` file.

## How this tool was made

Developed by Mohammad Alshah and Magzhan Kutzhanov with AI coding assistance. Requirements, test images, validation against known scale values and all design decisions are by the authors.

## Third-party software

This file includes the following open-source libraries, used under their licenses. Full license texts and copyright notices are in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

| Library | Version | License | Copyright |
|---|---|---|---|
| tesseract.js | 5.1.1 | Apache License 2.0 | © Jerome Wu and contributors |
| Tesseract OCR engine (WebAssembly core) | 5.x | Apache License 2.0 | © Google and contributors |
| Tesseract English trained data (eng.traineddata) | 4.0 | Apache License 2.0 | © Google and contributors |
| JSZip | 3.10.1 | MIT (dual-licensed MIT / GPLv3; used under MIT) | © 2009-2016 Stuart Knightley and contributors |
| pako | 1.0.11 | MIT and Zlib | © 2014-2017 Vitaly Puzrin and Andrei Tuputcyn |
| UTIF.js | 3.1.0 | MIT | © 2017 Photopea |

Bundled inside the Tesseract worker and WebAssembly core:

| Library | License |
|---|---|
| Leptonica | BSD-2-Clause |
| libpng | libpng-2.0 |
| zlib | Zlib |
| libjpeg (IJG) | IJG |
| libtiff | libtiff (BSD-style) |
| libwebp | BSD-3-Clause |
| giflib | MIT |
| Emscripten runtime | MIT (dual MIT / UIUC; used under MIT) |
| regenerator-runtime, is-electron, base64-js | MIT |
| ieee754 | BSD-3-Clause |
| wasm-feature-detect, idb-keyval | Apache-2.0 |

This software is based in part on the work of the Independent JPEG Group.

Instrument and software names (Hitachi, TESCAN, Oxford Instruments AZtec, Microsoft Word) are trademarks of their owners and are mentioned only to describe compatibility.
