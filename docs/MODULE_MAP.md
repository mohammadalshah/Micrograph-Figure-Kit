# Module map

The app is plain JavaScript split into numbered modules. `build.js` inserts them, in this order, into two `<script>` blocks of the HTML file: modules 00–18, then 20–27 (letter suffixes such as 06a or 17c load right after their number). Modules share top-level names (no imports): a module may use anything defined in a lower-numbered one, and function declarations are visible throughout their script block.

`src/js/offline-ocr.js` is included separately in `<head>`; it builds the OCR worker from the embedded engine and language data.

## 00-header.js (52 lines)
Overview of the data model and module list.

## 01-core.js (112 lines)
1. Core helpers and DOM references
Also the Greek-letter row shared by the text toolbars on all tabs (`rtGreekFill`, `rtGreekToggle`).

Defines: `
1. Core helpers and DOM references
Also the Greek-letter row shared by the text toolbars on all tabs (`rtGreekFill`, `rtGreekToggle`).

, `# Module map

The app is plain JavaScript split into numbered modules. `build.js` inserts them, in this order, into two `<script>` blocks of the HTML file: modules 00–18, then 20–27 (letter suffixes such as 06a or 17c load right after their number). Modules share top-level names (no imports): a module may use anything defined in a lower-numbered one, and function declarations are visible throughout their script block.

`src/js/offline-ocr.js` is included separately in `<head>`; it builds the OCR worker from the embedded engine and language data.

## 00-header.js (52 lines)
Overview of the data model and module list.

, `lsSet`, `els`, `state`, `ACCEPTED`, `UNITS`, `UNIT_LABELS`, `SERIF_FONTS`, `OCR_WHITELIST`, `GREEK_LOWER`, `rtGreekFill`, `rtGreekToggle`, `uid`, `extOf`, `clamp`, `sleep`, `num`, `setVal`, `showToast`, `setProgress`, `hideProgress`, `getScaleMode`, `GREEK_UPPER`

## 02-units.js (136 lines)
2. Units and scale text — Parsing, normalising, converting and formatting values like "0.5 µm".

Defines: `activeUnit`, `setActiveUnit`, `relabelUnitButtons`, `fmtNum`, `trimZeros`, `numericScaleText`, `convertUnitValue`, `unitKey`, `normalizeManualScale`, `parseScaleText`, `formatScale`, `displayScale`, `computeBarLengthPx`, `computeScaleTextFromBarLength`, `originalBarPx`, `renderable`, `settings`

## 03-libraries.js (14 lines)
3. Libraries — tesseract.js (OCR), JSZip (ZIP / .docx) and UTIF (TIFF) are embedded in

Defines: `needLib`, `ensureTesseract`, `ensureJSZip`, `ensureUTIF`

## 04-font-storage.js (100 lines)
4. Font persistence — Imported font files are kept in IndexedDB so they survive reloads; each imported font is stored and listed separately.

Defines: `openDB`, `idbSet`, `idbGet`, `idbDelete`, `installFontBuffer`, `updateFontStatus`, `loadStoredFont`, `installExtraFont`, `importedFontName`, `saveExtraFontList`, `removeExtraFont`

## 05-decode.js (105 lines)
5. Image decoding — Every format ends up as ImageData in item.imageData.

Defines: `decodeFile`, `decodeBrowserImage`, `decodeBMP`, `decodeTIFF`

## 06-detection.js (419 lines)
6. Footer / scale-bar detection — SEM images: the info footer, the original bar and candidate label boxes.

Defines: `imageDataToGray`, `detectFooterY`, `detectFooterUniform`, `otsuThreshold`, `footerBinary`, `removeLongLines`, `connectedComponents`, `runProfile`, `detectSolidBar`, `findBarNearText`, `detectRulerBar`, `labelCandidates`, `inpaintRect`, `ovEraseOn`, `analyzeImage`

## 06a-overlay-detection.js (307 lines)
6a. Overlay scale bars — Optical, TEM and STEM images: bars drawn inside the picture, grey or coloured (yellow, red…), with their labels.

Defines: `detectOverlayBar`, `overlayColorKeys`, `colorKeyGray`, `colorKeyImageData`, `overlayScaleStyle`, `detectOverlayBarAt`

## 07-ocr.js (232 lines)
7. OCR of the original scale label — Tesseract reads the label next to the detected bar.

Defines: `ocrWorkerPromise`, `ocrProgressCb`, `OCR_CONF_MIN`, `ocrWarnOn`, `ocrUnsure`, `getOCRWorker`, `maskOCRCanvas`, `prepareOCRCanvas`, `niceScaleValue`, `parseOCRScales`, `maskHasDescender`, `fixOverlayUnit`, `readScaleOCR`

## 08-render.js (400 lines)
8. Rendering — Everything that draws on the output canvas.

Defines: `fontSpec`, `drawLabel`, `RU_SEQ`, `panelText`, `getCrop`, `baseCanvas`, `sourceBitmap`, `parseRich`, `layoutRich`, `drawRich`, `drawShape`, `drawArrow`, `drawInset`, `objRotRad`, `objRotate`, `unrotPt`, `drawObjects`, `renderResult`, `lblStyle`, `renderInto`, `finalizeAndRender`, `canvasBlob`, `ensureBlob`, `processItem`, `insetConnectors`, `drawComposeInsetLinks`

## 09-ingest.js (46 lines)
9. File ingestion

Defines: `addFiles`, `setPlain`, `removeItem`, `clearAll`, `selectedItem`

## 10-inspector.js (399 lines)
10. Preview and inspector UI — Source/result canvases, object list and the right-hand inspector.

Defines: `statusLabel`, `drawSource`, `displayK`, `objTarget`, `objDims`, `objRefresh`, `objRerender`, `drawSelection`, `selObj`, `multiIds`, `toggleMulti`, `drawMulti`, `shiftObjPx`, `alignObjects`, `rotBounds`, `rotHandlePos`, `syncAlignRow`, `selHit`, `objHandles`, `paintResult`, `syncScaleField`, `updateCropInputs`, `OBJ_NAMES`, `objLabel`, `objGroup`, `setChk`, `fillObjFont`, `renderObjList`, `syncObjProps`, `syncSelectedControls`, `syncPreview`, `syncOcrBadge`, `moveItemTo`, `moveItemBy`, `renderUI`, `escapeHTML`

## 11-downloads.js (183 lines)
11. Downloads — Single PNG, all PNGs to a folder, ZIP and CSV audit.

Defines: `safeBase`, `saveBlob`, `writeBlobToDirectory`, `freeDirName`, `chooseOutputFolder`, `saveProcessedItem`, `cleanDpi`, `cleanPng`, `cleanBlob`, `uniqueName`, `saveAllSeparate`, `csvJoin`, `auditCSV`, `downloadZip`

## 12-rerender.js (75 lines)
12. Re-rendering helpers — Debounced redraws after settings or per-image edits.

Defines: `rerenderAllNow`, `rerenderAllTimer`, `scheduleRerenderAll`, `selTimer`, `rerenderSelectedSoon`, `syncLengthFromScaleForSelected`, `syncScaleFromLengthForSelected`, `liveRedrawTimer`, `scheduleSelectedLiveRedraw`

## 13-canvas.js (310 lines)
13. Canvas interaction — Result preview: select, move, resize. Source preview: crop tool and Pick bar.

Defines: `canvasPoint`, `distSeg`, `findHit`, `findHandle`, `HANDLE_CURSOR`, `moveObj`, `resizeObj`, `resultDrag`, `dragFrame`, `groupFor`, `moveGroup`, `redrawResultFast`, `endResultDrag`, `aspectRatio`, `cropMode`, `snapV`, `adjustCrop`, `showLoupe`, `cropDrag`, `cropFrame`, `lastCropEvt`, `pickDrag`, `setPickBar`, `pickBarFromRect`, `endCropDrag`, `endPickDrag`, `onCropChanged`

## 14-clean-events.js (553 lines)
14. Event wiring for the Clean tab

Defines: `updatePtHint`, `updateScaleExample`, `globalControls`, `applyAdjust`, `adjEls`, `syncAdjUI`, `adjChanged`, `adjTimer`, `THEME_IDS`, `THEME_KEY`, `themeEls`, `themeCapture`, `THEME_DEFAULT`, `themeLoad`, `themeStore`, `themeFill`, `themeApply`, `isUnprocessed`, `runProcess`, `ADV_DEFAULTS`, `defaultObj`, `makeInset`, `cloneObj`, `deleteObj`, `bindProp`, `objEraserBtn`, `eraseRing`, `objEraseOn`, `erasing`, `eraseFrame`, `setObjEraser`, `eraseDoc`, `eraseRedraw`, `eraseRingAt`, `THEME_LAST`, `THEME_AUTO`, `insetCanvas`, `insetSent`, `insetToCompose`, `insetSendAll`, `insetRefreshSent`, `figureInsetToCompose`, `eraseSizeEl`, `eraseColorEl`

## 15-compose.js (408 lines)
15. Compose figure tab — Lays processed images out in rows at a print width/dpi and adds figure-wide objects.

Defines: `compose`, `finishCompose`, `syncCompose`, `compItems`, `compCfg`, `layoutCompose`, `renderCompose`, `compZoom`, `applyCompZoom`, `setCompZoom`, `paintCompose`, `compPMulti`, `compAlignInfo`, `compAlign`, `renderCompList`, `compTimer`, `scheduleCompose`, `compCellAt`, `panelCorners`, `panelHandleAt`, `seedFree`, `ensureFree`, `compPanelClick`, `compDrag`, `compFrame`, `compPanelDrag`, `compLetterDrag`, `compLetterAt`, `endCompDrag`, `compPanelMove`, `compItemsAll`

## 15a-compose-table.js (171 lines)
15a. Compose table — A table frame for the figure: images sit in cells (empty cells allowed), grid lines, header cells on any side with rich text, merged headers and rotated side headers.

Defines: `TBL_SIDES`, `TBL_GREEK`, `tblGreek`, `tblNew`, `tblSanitize`, `tblHdrN`, `tblHdrCells`, `tblSpans`, `tblMerged`, `tblAssign`, `tblOrder`, `tblMove`, `tblHdrObj`, `layoutTable`, `drawCompTable`, `tblSlotAt`, `tblEl`, `tblFillFont`, `tblRenderHeaders`, `tblSyncUI`

## 15b-compose-export.js (110 lines)
15b. Compose export — Figure files built locally: PNG with dpi, TIFF, PDF, raster SVG, CSV; save and copy buttons. `pngWithDpi`, `tiffBlob`, `pdfBlob`, `saveOut` and `csvNum` are also used by modules 11, 14 and 17b (at click time).

Defines: `crc32`, `pngWithDpi`, `tiffBlob`, `flatRGB`, `zDeflate`, `pdfBlob`, `svgBlob`, `csvBlob`, `saveOut`, `csvNum`, `saveFigure`

## 16-label-editor.js (147 lines)
16. Per-image scale label / panel letter editor — One editor factory, mounted in the Clean inspector and in the Compose panel.

Defines: `lblRerender`, `makeLblEditor`, `objHome`, `moveObjControls`

## 17-eds.js (664 lines)
17. EDS maps tab — Extracts element maps from AZtec .docx reports, cleans them and builds a map figure.

Defines: `E`, `edsEls`, `eds`, `ELEMENTS`, `ROLE_NAMES`, `ROLE_ORDER`, `edsProgress`, `parseElementLine`, `pixelStats`, `edsContentBox`, `edsClassify`, `tileLabel`, `flattenOnWhite`, `edsReadDocx`, `edsAddFiles`, `detectOverlayBoxes`, `edsBoxes`, `fillBoxMedian`, `edsCfg`, `edsProcessed`, `wordContrastFactor`, `wordLevelsLUT`, `boxBlur`, `applySharpness`, `autoLevels`, `niceValue`, `umPerSrcPx`, `scaleTextFor`, `edsLayoutTiles`, `scaleShownOn`, `edsPlace`, `renderTile`, `renderEdsFigure`, `renderEds`, `paintEds`, `renderEdsList`, `edsSelTile`, `syncEdsSel`, `edsTimer`, `scheduleEds`, `edsDetectFrame`, `edsReadTitle`, `edsReadFramedScale`, `edsAnalyzing`, `edsAnalyzeTile`, `edsAnalyzeAll`, `edsReanalyze`, `edsAutoCal`, `withSel`, `edsReanalyzeSafe`, `linkRange`

## 17a-eds-quant.js (177 lines)
17a. EDS element content (wt.% / at.%) — Reads quantification from the report tables or by OCR of spectrum tiles; text drawn on maps.

Defines: `parseQuantLines`, `parseQuantBox`, `edsSetQuant`, `edsSyncQuantStatus`, `edsQuantText`, `quantOCRCanvas`, `repairQuantLines`, `pickQuant`, `quantComplete`, `edsReadQuantOCR`

## 17b-eds-export.js (125 lines)
17b. EDS export and sending to Compose — Saves single maps / the EDS figure and turns EDS tiles into Compose items.

Defines: `edsPxPerPtFor`, `edsTileExport`, `edsFileName`, `edsMakeItem`, `edsBuildMapItem`, `edsBuildFigItem`, `edsRefreshSent`, `edsRefreshGroup`

## 17c-eds-groups.js (51 lines)
17c. EDS groups — Each Word report is a group with its own maps, calibration, erase boxes, element content and panel settings.

Defines: `edsGroupCur`, `edsHasAny`, `edsGroupStash`, `edsGroupLoad`, `edsGroupBlank`, `edsGroupNew`, `edsHistReset`, `edsGroupSwitch`, `edsGroupRemove`, `renderEdsGroups`

## 17d-eds-canvas.js (68 lines)
17d. EDS preview interaction — Select maps, erase boxes, and move labels, content values and scale bars by mouse or keyboard.

Defines: `edsCellAt`, `edsErase`, `edsMove`, `edsMoveFrame`, `edsHitAt`, `edsEndMove`

## 18-startup.js (10 lines)
18. Start-up

## 20-session.js (206 lines)
20. Session save / open (.json project file) — Images are embedded as data URLs; values read from a file are treated as untrusted. Format version 2 keeps inset links; version 1 files are repaired on open (`sessRelinkInsets`).

Defines: `SESSION_VER`, `sessRelinkInsets`, `sessPlain`, `sessRevive`, `sessImgToURL`, `sessURLToImg`, `SESS_SKIP_ID`, `sessCaptureSettings`, `sessApplySettings`, `saveSession`, `openSession`, `SESSION_SKIP`, `sessFin`, `sessBox`, `sessBoxes`, `sessPosMap`, `sessCleanTile`, `sessCleanCal`, `sessCleanErase`, `sessCleanEdsSettings`

## 21-history.js (111 lines)
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

## 25a-i18n-ru.js (193 lines)
25a. Russian interface text — English → Russian dictionary used by module 25.

Defines: `I18N_RU`

## 25-i18n.js (101 lines)
25. Interface language (EN / RU) — Translates the page text in place; the English text is restored on switching back.

Defines: `RU`, `PAT`, `PREFIX`, `norm`, `tr`, `INL`, `SKIP`, `done`, `inlineOnly`, `doAttrs`, `doText`, `walk`, `restore`, `obs`, `btn`, `paintBtn`, `setLang`, `saved`, `inp`

## 26-svg-export.js (128 lines)
26. Vector SVG export — records canvas drawing calls during an SVG export and writes them as SVG text and paths; pixel content is embedded as PNG.

Defines: `SVGX`, `SVG_TAU`, `svgEsc`, `svgN`, `svgMatrix`, `svgPaint`, `svgPaintAttr`, `svgFont`, `SVG_ANCHOR`, `SVG_BASE`, `svgVector`

## 27-about.js (40 lines)
27. About window (ⓘ button next to the language switch) — program name, short description, features, authors with e-mails, MIT License; text follows the interface language.

Defines: `ABOUT_TXT`, `ABOUT_AUTHORS`, `aboutShow`
