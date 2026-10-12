# Changelog

All notable changes to Micrograph Figure Kit. Versions follow `MAJOR.MINOR.PATCH`.

## [1.0.0] – 2026-10-12

First public release.

### Clean & annotate
- SEM footer detection and removal; scale bar detection for solid, split and tick-ruler bars (TESCAN, Hitachi S-3400).
- OCR of the original scale value; ruler values read at several scales and corrected to round numbers.
- Optical microscope overlay bars, including bars on a framed label plate.
- Pick bar: manual box selection of any scale bar.
- "Treat as picture" for schematics and photos: no scale bar, footer kept.
- New scale bar, panel letters, text, arrows, shapes, insets; crop and picture adjustments.
- Measurements: distance, angle, particle (ellipse) and polygon area, perimeter and equivalent diameter; CSV export.

### Compose figure
- Row, grid and free layouts at print width and dpi; panel letters inside or outside.
- Clipboard export; Refresh rebuilds images sent from EDS maps.

### EDS maps
- Import of Oxford AZtec .docx reports; element, scale and wt.% / at.% reading.
- Map figure export; Send maps to Compose with editable element and content labels.

### Export
- PNG, TIFF and PDF at the print resolution; SVG with editable text and vector shapes (Illustrator, Inkscape).
- CSV files use `;` and decimal commas in Russian mode for Excel.

### General
- Sessions, undo/redo, keyboard shortcuts, themes, night mode, English/Russian interface.
- One HTML file, fully offline; Content Security Policy blocks all network access.
