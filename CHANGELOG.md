# Changelog

All notable changes to Micrograph Figure Kit. Versions follow `MAJOR.MINOR.PATCH`.

## [1.1.0] – 2026-10-29

### Fixed
- EDS: element maps in reports with wide white margins were not recognized.
- EDS: element content drawn inside the spectrum picture was not read.
- EDS: changing the image type by hand did not read the label and scale bar.
- EDS: "Read from spectrum / report" was slow.
- EDS: after Clear and loading new maps, Refresh in Compose replaced figures sent earlier with the new maps.
- Insets lost the link to their area after Undo, Redo or reopening a session.
- Optical micrographs: thick scale bars were not found, automatically or with Pick bar.
- Optical micrographs: some scale values were misread (wrong digit or nm instead of µm).
- TEM/STEM images: coloured scale bars and labels (yellow, red…) were not found, automatically or with Pick bar; dark images with the bar at the bottom were taken for an SEM footer.
- Sessions: values read from a session file are now checked before use. EDS group settings only change EDS controls, and map boxes, positions, levels, image types and calibration are limited to valid values, so a damaged file can no longer freeze the tab or half-replace the current work.
- Diffraction patterns: reciprocal scale labels such as "2 1/nm" were not read.
- Advanced settings: Default now switches off all three options (detection overlay, OCR warning, optical scale bar erase); before, only the detection overlay was reset.
- Fonts: importing a second font replaced the first. Every imported font is now stored and listed separately; several files can be imported at once. Remove imported font removes the selected one, or all of them when a system font is selected.

### Added
- EDS: each Word report is loaded as its own group with its own maps, scale, erase boxes, element content and settings. Click a group to edit it; Clear or × removes one group. Refresh in Compose rebuilds each figure from its own group. Sessions keep the groups.
- EDS: Position menus for element labels, element content and scale bars (corners, top or bottom center). Each can also be dragged on the preview to a new place on its map; double-click puts it back. With the keyboard: arrows move the box of the selected map (Shift = larger steps), B switches between label, content and scale bar, Home resets. Moved positions are kept per map in groups, Undo/Redo and sessions.
- Compose: panel letters can be dragged to a new place, inside or outside the panels. Double-click a letter to put it back.
- EDS: "Read label and scale again" button for the selected image.
- Text tools on all tabs: all Greek letters (lower and upper case).
- Contrast outline with its own color for the scale bar and unit, panel letters, EDS element labels and element content, on all tabs; kept in themes.
- Insets: fill color and opacity, as for the inset area.
- Insets: "To Compose with panel letter" / "without letter" makes the magnified part a separate panel in Compose. The dashed area stays on the source image and connector lines link it to the new panel, following it when panels move. Also available for insets drawn in Compose and from the Compose panel list (⧉A / ⧉).
- Compose: Insert table puts the panels in a table with full grid lines. Header cells on any side (top, bottom, left, right) with rich text (bold, italic, sub/superscript, Greek), font, size and color; left/right headers can be rotated 90°; a header can be merged over several cells. Panels are dropped into cells from the preview or the panel list; cells may stay empty. Kept in Undo/Redo and sessions.
- Compose: inset panels follow changes in tab 1 (inset area moved or resized, inset color, lines, fill); Refresh rebuilds them too.

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
