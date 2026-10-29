# Micrograph Figure Kit — features in detail

Русская версия: [FEATURES.ru.md](FEATURES.ru.md).

This document describes every part of the tool. For a short overview and quick start, see `README.md`.

---

## 1. General

- **One file, fully offline.** Open `Micrograph_Figure_Kit.html` in Chrome, Edge or Firefox. All code, the OCR engine and its language data are inside the file. A Content Security Policy blocks every outbound connection, so images never leave the computer.
- **Three tabs:** Clean & annotate, Compose figure, EDS maps.
- **Collapsible sections.** Every settings card in every tab can be folded. The open/closed state is remembered in the browser.
- **Resizable settings panel.** Drag the divider between the settings and the preview; double-click it to reset.
- **Interface language:** English or Russian, switched at any time. Scale units can be English (µm, nm) or Russian (мкм, нм) independently, with point or comma as decimal separator.
- **Themes.** Save the current label, font, panel letter and Compose settings under a name, apply it later, export it to a file or import it on another computer. The last theme can be applied automatically on start.
- **Sessions.** Save the whole working state (images, calibrations, objects, layout) to a `.json` file and open it later.
- **Undo / redo** and keyboard shortcuts.

## 2. Clean & annotate

### 2.1 Input and processing
- Drop or choose images: TIFF, PNG, JPEG, BMP, WebP. Click **Process** to analyse all of them.
- Each image gets a status: read automatically, read with low confidence, or needs checking.

### 2.2 Original/source scale value
- **Auto read.** Local OCR reads the original scale text next to the bar in the SEM footer. Works with dark, gray and light footers, and with solid, split, ruler-type (TESCAN, Hitachi S-3400) and segmented bars.
- **Manual source value.** One original value for all files, for instruments whose label cannot be read.
- Units: nm, µm, mm, m, Å.
- The bar length is measured between the inner edges of the end ticks, so every image is calibrated the same way.
- Ruler labels read at several scales and corrected to round numbers. A unit printed under a ruler (for example "mm") is read as the value's unit.
- **OCR warning badge** (off by default). Turn it on to mark readings with low confidence, for example a "10m" near the bar interpreted as 10 µm.

### 2.3 Footer and optical images
- The instrument info footer is detected and cropped off.
- **Optical microscope images:** a bar drawn inside the picture is found, including bars on a white framed label plate. The search is limited to the lower 45 % and upper 30 % of the image, so sample features are not mistaken for a bar.
- **Erase the original scale bar in optical images** (off by default): paints over the old bar and label before the new bar is drawn.
- **Pick bar:** drag a box around any bar the automatic search missed. The tool measures it, reads the label and replaces it.

### 2.4 Calibration
- For the selected image, shows the detected bar length in pixels and the source value.
- Correct a wrong value or bar length by hand; the result is recalculated at once.

### 2.5 Scale label (new scale bar)
- Output value chosen automatically as a round number, or set by hand per image. The bar length is computed from the calibration.
- Layout: unit on top and bar below, or bar on top and unit below.
- Position: any corner. Margin in % of image width.
- Color of bar and text: white or black, with an optional background highlight in any color.
- **Bar thickness** and **bar ↔ text gap**, both as a fraction of the font size.
- **Contrast outline** around the bar and unit, with its own color. Kept in themes.

### 2.6 Font
- Font family (Times New Roman, Cambria, Georgia and other system fonts), bold, regular or bold italic.
- **Import font files.** Several files can be imported at once; each font is stored and listed separately. **Remove imported font** removes the selected one, or all of them when a system font is selected.
- Size: fixed in pt as in Word (calculated for a given figure width in print, cm), automatic from the image size, or automatic from the bar length.

### 2.7 Panel letter
- Adds a letter to the upper-left corner of each image in file order. The **Text** field sets the format: `a`, `(a)`, `A`, `a)` and so on; any other text is used as written. Default: `(a)`.
- Bold or regular, size in pt (0 = auto), margin, optional highlight and contrast outline with its own color.
- The letter of one image can be overridden in **Scale label and panel letter on this image**.

### 2.8 Scale label and panel letter on this image
- Per-image overrides of the scale text, letter, size, color and highlight. Empty fields follow the main **Scale label** and **Panel letter** settings.

### 2.9 Brightness, contrast, sharpness
- −100 … +100 % per image, 0 = original. **Apply to all** copies the values to every image; **Reset** returns to the original.

### 2.10 Crop
- Free crop or fixed aspect ratio (1 : 1, 4 : 3 and others). Batch apply to images of the same size, the same aspect ratio or all images.

### 2.11 Text, shapes and arrows
- **+ Text**, rectangle, ellipse, line, arrow and **Inset** (magnified view of a region; move or resize the dashed area to choose what is enlarged).
- **Inset options:** fill color and opacity, as for the inset area. **To Compose with panel letter** / **without letter** sends the magnified part to Compose as a separate panel. The dashed area stays on the source image and connector lines link it to the new panel, following it when panels move.
- **Greek letters** (lower and upper case) in the text tools on all tabs.
- Properties per object: color, fill, background, outline, size, font. Duplicate and delete.
- **Free rotation:** drag the round handle above a text or shape. Hold Shift to snap to 15° steps.
- **Multi-select and alignment:** Ctrl+click to select several objects. With two or more selected, align lefts, rights, tops or bottoms, make the same width or height, or distribute evenly.
- **Brush eraser:** paint over anything on the image. Size in pixels, white by default. Alt+click samples a color from the image. Esc leaves the eraser.

### 2.12 Measurements
- **Distance** and **Angle.**
- **Particle (ellipse)** and **Polygon:** area, perimeter and equivalent diameter.
- Values in calibrated units. Table for this image or all images; copy the table or export CSV. Optionally show the measurements on the image (included in export).

### 2.13 Output files
- **Save PNG** for the selected image, **Save all PNGs separately**, or a **ZIP** with a CSV audit of all scale readings.
- **Save all TIFF / PDF / SVG:** each processed image as a separate file. The resolution follows **Print width**, so the file opens at the printed size with the chosen point sizes; PNG files carry the same resolution. Files with the same name get `_2`, `_3`… instead of overwriting each other. PDF contains the lossless picture. SVG is vector: scale bar, labels, panel letters, text, shapes, arrows and measurements stay editable in Illustrator or Inkscape, with the micrograph embedded as a lossless image (also in Compose and EDS exports).
- On Chrome/Edge desktop, choose an output folder once and save all files directly into it.

## 3. Compose figure

- **Layout:** images per row (for example `2` or `3,2` for uneven rows); equal row height, equal cells, or free placement with drag and resize.
- **Size:** figure width in cm, resolution 150 / 300 / 600 / 1200 dpi, spacing between images and outer margin in mm, white, black or transparent background.
- **Labels:** renumber panel letters a, b, c… in figure order, keep the letters from the Clean tab, or none. Letter inside the image or outside (above left or centred). Drag a letter to any place inside or outside the panels; double-click puts it back. **Keep true point sizes** redraws the labels for each panel's printed size.
- **Scale label and letter per panel:** overrides for the selected panel.
- **Text, shapes and arrows** on the whole figure, for example arrows between panels.
- **Multi-select and alignment** of panels with Ctrl+click, as in the Clean tab.
- **Insets as panels.** Insets drawn in Compose, or sent from the panel list (⧉A with letter / ⧉ without), become separate panels with connector lines to the dashed area. Inset panels follow changes made in the Clean tab (area moved or resized, color, lines, fill).
- **Table.** **Insert table** places the panels in a table with full grid lines. Header cells on any side (top, bottom, left, right) with rich text (bold, italic, sub/superscript, Greek), font, size and color. Left and right headers can be rotated 90°; a header can be merged over several cells. Drop panels into cells from the preview or the panel list; cells may stay empty. Kept in Undo/Redo and sessions.
- **Refresh** rebuilds maps sent from EDS with the current settings of their EDS group, keeping their position and panel letter. Inset panels are rebuilt too. **Clear** empties the figure; ✕ removes one panel.
- **Export:** PNG with dpi, uncompressed TIFF, PDF, SVG, CSV (file, scale, position and printed size of each panel), and **Copy** to the clipboard for Word and PowerPoint.

## 4. EDS maps

- **Import:** Oxford AZtec Word reports (.docx) or image files. Element maps, the electron image and spectra are extracted automatically. Old .doc files must be re-saved as .docx.
- **Groups.** Each Word report is loaded as its own group with its own maps, scale, erase boxes, element content and settings. Click a group to edit it; × removes one group. Sessions keep the groups.
- **Selected image:** levels, auto levels for all maps, reset, **Read label and scale again**, save this PNG.
- **Clean-up (all images):** removes burned-in labels and scale bars; brightness, contrast and sharpness.
- **Element labels:** element and line (Fe Kα1) or element only (Fe); same color as the map, white or black; optional contrast outline with its own color.
- **Element content:** wt.% or at.% read from the report tables or the spectrum image, written at the bottom centre of each map. Unit text wt.% / at.%, мас.% / ат.% or %; 0–2 decimals; size in pt.
- **Scale bar:** read from the electron image or calibrated by hand; shown on the electron image only, on every image, or none.
- **Positions.** Element labels, element content and scale bars each have a Position menu (corners, top or bottom centre). Each can also be dragged on the preview to a new place on its map; double-click puts it back. Keyboard: arrows move the box of the selected map (Shift = larger steps), B switches between label, content and scale bar, Home resets. Moved positions are kept per map, in Undo/Redo and sessions.
- **Figure layout:** electron image large with maps on the right, equal tiles, or one row; dpi, spacing, background.
- **Export:** figure PNG, PDF, SVG, CSV (maps with wt.% and at.%), all maps as ZIP.
- **Send maps to Compose** (as editable panels with element and content labels) or **Send figure to Compose.** **Clear** empties only the EDS tab; maps already in Compose stay there.

## 5. Tips

- Check the scale value of every image before publication. OCR is good but not infallible; turn on the OCR warning badge to see uncertain readings.
- For LaTeX, export PDF or SVG and insert with `\includegraphics`.
