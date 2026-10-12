# Module map

The app is plain JavaScript split into numbered modules. `build.js` inserts them, in this order, into two `<script>` blocks of the HTML file: modules 00–18, then 20–26. Modules share top-level names (no imports): a module may use anything defined in a lower-numbered one, and function declarations are visible throughout their script block.

`src/js/offline-ocr.js` is included separately in `<head>`; it builds the OCR worker from the embedded engine and language data.

## 00-header.js (50 lines)
Overview of the data model and module list.

## 01-core.js (98 lines)
1. Core helpers and DOM references

Defines: `$`, `$$`, `lsSet`, `els`, `state`, `ACCEPTED`, `UNITS`, `UNIT_LABELS`, `SERIF_FONTS`, `OCR_WHITELIST`, `uid`, `extOf`, `clamp`, `sleep`, `num`, `setVal`, `showToast`, `setProgress`, `hideProgress`, `getScaleMode`

## 02-units.js (132 lines)
2. Units and scale text — Parsing, normalising, converting and formatting values like "0.5 µm".

Defines: `activeUnit`, `setActiveUnit`, `relabelUnitButtons`, `fmtNum`, `trimZeros`, `numericScaleText`, `convertUnitValue`, `unitKey`, `normalizeManualScale`, `parseScaleText`, `formatScale`, `displayScale`, `computeBarLengthPx`, `computeScaleTextFromBarLength`, `originalBarPx`, `renderable`, `settings`

## 03-libraries.js (14 lines)
3. Libraries — tesseract.js (OCR), JSZip (ZIP / .docx) and UTIF (TIFF) are embedded in

Defines: `needLib`, `ensureTesseract`, `ensureJSZip`, `ensureUTIF`

## 04-font-storage.js (71 lines)
4. Font persistence — An imported font file is kept in IndexedDB so it survives reloads.

Defines: `openDB`, `idbSet`, `idbGet`, `idbDelete`, `installFontBuffer`, `updateFontStatus`, `loadStoredFont`

## 05-decode.js (105 lines)
5. Image decoding — Every format ends up as ImageData in item.imageData.

Defines: `decodeFile`, `decodeBrowserImage`, `decodeBMP`, `decodeTIFF`

## 06-detection.js (613 lines)
6. Footer / scale-bar detection — SEM images: the info footer, the original bar and candidate label boxes.

Defines: `imageDataToGray`, `detectFooterY`, `detectFooterUniform`, `otsuThreshold`, `footerBinary`, `removeLongLines`, `connectedComponents`, `runProfile`, `detectSolidBar`, `findBarNearText`, `detectRulerBar`, `labelCandidates`, `detectOverlayBar`, `inpaintRect`, `ovEraseOn`, `analyzeImage`

## 07-ocr.js (206 lines)
7. OCR of the original scale label — Tesseract reads the label next to the detected bar.

Defines: `ocrWorkerPromise`, `OCR_CONF_MIN`, `ocrWarnOn`, `ocrUnsure`, `getOCRWorker`, `maskOCRCanvas`, `prepareOCRCanvas`, `niceScaleValue`, `parseOCRScales`, `readScaleOCR`

## 08-render.js (373 lines)
8. Rendering — Everything that draws on the output canvas.

Defines: `fontSpec`, `drawLabel`, `RU_SEQ`, `panelText`, `getCrop`, `baseCanvas`, `sourceBitmap`, `parseRich`, `layoutRich`, `drawRich`, `drawShape`, `drawArrow`, `drawInset`, `objRotRad`, `objRotate`, `unrotPt`, `drawObjects`, `renderResult`, `lblStyle`, `renderInto`, `finalizeAndRender`, `canvasBlob`, `ensureBlob`, `processItem`

## 09-ingest.js (46 lines)
9. File ingestion

Defines: `addFiles`, `setPlain`, `removeItem`, `clearAll`, `selectedItem`

## 10-inspector.js (397 lines)
10. Preview and inspector UI — Source/result canvases, object list and the right-hand inspector.

Defines: `statusLabel`, `drawSource`, `displayK`, `objTarget`, `objDims`, `objRefresh`, `objRerender`, `drawSelection`, `selObj`, `multiIds`, `toggleMulti`, `drawMulti`, `shiftObjPx`, `alignObjects`, `rotBounds`, `rotHandlePos`, `syncAlignRow`, `selHit`, `objHandles`, `paintResult`, `syncScaleField`, `updateCropInputs`, `OBJ_NAMES`, `objLabel`, `objGroup`, `setChk`, `fillObjFont`, `renderObjList`, `syncObjProps`, `syncSelectedControls`, `syncPreview`, `syncOcrBadge`, `moveItemTo`, `moveItemBy`, `renderUI`, `escapeHTML`

## 11-downloads.js (183 lines)
11. Downloads — Single PNG, all PNGs to a folder, ZIP and CSV audit.

Defines: `safeBase`, `saveBlob`, `writeBlobToDirectory`, `freeDirName`, `chooseOutputFolder`, `saveProcessedItem`, `cleanDpi`, `cleanPng`, `cleanBlob`, `uniqueName`, `saveAllSeparate`, `csvJoin`, `auditCSV`, `downloadZip`

## 12-rerender.js (75 lines)
12. Re-rendering helpers — Debounced redraws after settings or per-image edits.

Defines: `rerenderAllNow`, `rerenderAllTimer`, `scheduleRerenderAll`, `selTimer`, `rerenderSelectedSoon`, `syncLengthFromScaleForSelected`, `syncScaleFromLengthForSelected`, `liveRedrawTimer`, `scheduleSelectedLiveRedraw`

## 13-canvas.js (308 lines)
13. Canvas interaction — Result preview: select, move, resize. Source preview: crop tool and Pick bar.

Defines: `canvasPoint`, `distSeg`, `findHit`, `findHandle`, `HANDLE_CURSOR`, `moveObj`, `resizeObj`, `resultDrag`, `groupFor`, `moveGroup`, `redrawResultFast`, `endResultDrag`, `aspectRatio`, `cropMode`, `snapV`, `adjustCrop`, `showLoupe`, `cropDrag`, `setPickBar`, `pickBarFromRect`, `endCropDrag`, `endPickDrag`, `onCropChanged`

## 14-clean-events.js (475 lines)
14. Event wiring for the Clean tab

Defines: `updatePtHint`, `updateScaleExample`, `globalControls`, `applyAdjust`, `adjEls`, `syncAdjUI`, `adjChanged`, `adjTimer`, `THEME_IDS`, `THEME_KEY`, `themeEls`, `themeCapture`, `THEME_DEFAULT`, `themeLoad`, `themeStore`, `themeFill`, `themeApply`, `isUnprocessed`, `runProcess`, `ADV_DEFAULTS`, `defaultObj`, `makeInset`, `cloneObj`, `deleteObj`, `bindProp`, `objEraserBtn`, `eraseRing`, `objEraseOn`, `setObjEraser`, `eraseDoc`, `eraseRedraw`, `eraseRingAt`

## 15-compose.js (460 lines)
15. Compose figure tab — Lays processed images out in rows at a print width/dpi and adds figure-wide objects.

Defines: `compose`, `finishCompose`, `syncCompose`, `compItems`, `compCfg`, `layoutCompose`, `renderCompose`, `compZoom`, `applyCompZoom`, `setCompZoom`, `paintCompose`, `compPMulti`, `compAlignInfo`, `compAlign`, `renderCompList`, `compTimer`, `scheduleCompose`, `compCellAt`, `panelCorners`, `panelHandleAt`, `seedFree`, `ensureFree`, `compPanelClick`, `compDrag`, `endCompDrag`, `compPanelMove`, `crc32`, `pngWithDpi`, `tiffBlob`, `flatRGB`, `zDeflate`, `pdfBlob`, `svgBlob`, `csvBlob`, `saveOut`, `csvNum`, `saveFigure`

## 16-label-editor.js (147 lines)
16. Per-image scale label / panel letter editor — One editor factory, mounted in the Clean inspector and in the Compose panel.

Defines: `lblRerender`, `makeLblEditor`, `objHome`, `moveObjControls`

## 17-eds.js (602 lines)
17. EDS maps tab — Extracts element maps from AZtec .docx reports, cleans them and builds a map figure.

Defines: `E`, `edsEls`, `eds`, `ELEMENTS`, `ROLE_NAMES`, `ROLE_ORDER`, `edsProgress`, `parseElementLine`, `pixelStats`, `edsClassify`, `tileLabel`, `flattenOnWhite`, `edsReadDocx`, `edsAddFiles`, `detectOverlayBoxes`, `edsBoxes`, `fillBoxMedian`, `edsCfg`, `edsProcessed`, `wordContrastFactor`, `wordLevelsLUT`, `boxBlur`, `applySharpness`, `autoLevels`, `niceValue`, `umPerSrcPx`, `scaleTextFor`, `edsLayoutTiles`, `scaleShownOn`, `renderTile`, `renderEdsFigure`, `renderEds`, `paintEds`, `renderEdsList`, `edsSelTile`, `syncEdsSel`, `edsTimer`, `scheduleEds`, `edsDetectFrame`, `edsReadTitle`, `edsReadFramedScale`, `edsAnalyzing`, `edsAnalyzeAll`, `edsAutoCal`, `edsCellAt`, `edsErase`, `withSel`, `linkRange`

## 17a-eds-quant.js (158 lines)
17a. EDS element content (wt.% / at.%) — Reads quantification from the report tables or by OCR of spectrum tiles; text drawn on maps.

Defines: `parseQuantLines`, `parseQuantBox`, `edsSetQuant`, `edsSyncQuantStatus`, `edsQuantText`, `quantOCRCanvas`, `repairQuantLines`, `pickQuant`, `edsReadQuantOCR`

## 17b-eds-export.js (112 lines)
17b. EDS export and sending to Compose — Saves single maps / the EDS figure and turns EDS tiles into Compose items.

Defines: `edsPxPerPtFor`, `edsTileExport`, `edsFileName`, `edsMakeItem`, `edsBuildMapItem`, `edsBuildFigItem`, `edsRefreshSent`

## 18-startup.js (10 lines)
18. Start-up

## 20-session.js (126 lines)
20. Session save / open (.json project file) — Images are embedded as data URLs; values read from a file are treated as untrusted.

Defines: `SESSION_VER`, `sessPlain`, `sessRevive`, `sessImgToURL`, `sessURLToImg`, `SESS_SKIP_ID`, `sessCaptureSettings`, `sessApplySettings`, `saveSession`, `openSession`

## 21-history.js (110 lines)
21. Undo / redo (one history per tab)

Defines: `HIST`, `histView`, `histPanelSettings`, `histApplySettings`, `histSnap`, `HIST_KEEP`, `histAssign`, `histApply`, `histButtons`, `histCheck`, `histSchedule`, `histStep`

## 22-batch.js (33 lines)
22. Batch apply — Crop and picture adjustments copied from the selected image to others.

Defines: `batchTargets`, `syncBatch`

## 23-shortcuts.js (84 lines)
23. Keyboard shortcuts and night mode — Physical keys, so shortcuts also work with a Russian keyboard layout.

Defines: `SC_LIST`, `scClip`, `scKey`, `scTyping`, `scClick`, `scHelp`

## 24-measure.js (293 lines)
24. Measurements — Distance, angle, particle (ellipse) and polygon; table, statistics, CSV.

Defines: `MEAS_TYPES`, `MEAS_HINTS`, `measState`, `measUmPerPx`, `measCalc`, `measComma`, `measNum`, `measU`, `measLen`, `measArea`, `measMain`, `measDetail`, `measPath`, `measArc`, `measCaps`, `measLum`, `measStyleOf`, `measLabelAt`, `measNear`, `drawMeasuresFinal`, `measOverlay`, `measSetTool`, `measAfter`, `measCommit`, `measDelete`, `measRows`, `measStats`, `renderMeasCard`, `measTable`, `measCSV`, `measScopeItems`, `measStyleTimer`, `measTarget`

## 25-i18n.js (274 lines)
25. Interface language (EN / RU) — Translates the page text in place; the English text is restored on switching back.

Defines: `RU`, `PAT`, `PREFIX`, `norm`, `tr`, `INL`, `SKIP`, `done`, `inlineOnly`, `doAttrs`, `doText`, `walk`, `restore`, `obs`, `btn`, `paintBtn`, `setLang`, `saved`

## 26-svg-export.js (128 lines)
26. Vector SVG export — records canvas drawing calls during an SVG export and writes them as SVG text and paths; pixel content is embedded as PNG.

Defines: `SVGX`, `SVG_TAU`, `svgEsc`, `svgN`, `svgMatrix`, `svgPaint`, `svgPaintAttr`, `svgFont`, `SVG_ANCHOR`, `SVG_BASE`, `svgVector`

## 27-about.js (40 lines)
27. About window (ⓘ button next to the language switch) — program name, short description, features, authors with e-mails, MIT License; text follows the interface language.

Defines: `ABOUT_TXT`, `ABOUT_AUTHORS`, `aboutShow`
