/* =====================================================================
   Micrograph Figure Kit — application logic (runs fully in the browser)
   Copyright (c) 2026 Mohammad Alshah, Magzhan Kutzhanov. MIT License.

   Data model
     state.items[]   one entry per imported image. Holds the decoded pixels,
                     detection results (analysis), calibration
                     (sourceScaleText, barPxOverride), output scale
                     (targetScaleText, targetBarPx), crop, free objects
                     (text/shapes/arrows) and per-image label overrides
                     (hideScale, noPanel/showPanel, panelLabel,
                     scaleStyle, panelStyle).
     settings()      global options read from the left control panel.
     renderResult()  draws one item: crop → scale bar → panel letter →
                     objects. Used by all three tabs.

   Sections
      1. Core helpers and DOM references
      2. Units and scale text
      3. Libraries (Tesseract, JSZip, UTIF — embedded, no network)
      4. Font persistence (IndexedDB)
      5. Image decoding (BMP, TIFF, browser formats)
      6. Footer / scale-bar detection (SEM footers and optical overlay bars)
      7. OCR of the original scale label
      8. Rendering (labels, rich text, shapes, final image)
      9. File ingestion
     10. Preview and inspector UI
     11. Downloads (PNG, ZIP, CSV)
     12. Re-rendering helpers
     13. Canvas interaction (drag, resize, crop tool, Pick bar)
     14. Event wiring for the Clean tab
     15. Compose figure tab
     16. Per-image scale label / panel letter editor
     17. EDS maps tab (reading, processing, rendering, events)
    17a. EDS element content (wt.% / at.%)
    17b. EDS export and sending to Compose
     18. Start-up
   Second script block (runs after start-up)
     20. Session save / open
     21. Undo / redo
     22. Batch apply
     23. Keyboard shortcuts and night mode
     24. Measurements
     25. Interface language (EN / RU)
     26. Vector SVG export
     27. About window

   Privacy: everything runs in this page. No image, setting or result is
   sent anywhere; settings are kept in the browser's local storage.
   ===================================================================== */
'use strict';

