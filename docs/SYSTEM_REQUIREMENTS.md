# System requirements

Micrograph Figure Kit is a single HTML file that runs inside a web browser. There is nothing to install. The OCR engine, the TIFF/DOCX readers and all other libraries are embedded in the file, so it works without internet access.

Русская версия: [SYSTEM_REQUIREMENTS.ru.md](SYSTEM_REQUIREMENTS.ru.md).

## What you do **not** need

- **Installation or administrator rights** — not needed. Copy the HTML file to any folder or USB stick and double-click it.
- **Internet connection** — not needed. The page makes no network connections.
- **Java, .NET, Python, Node.js, MATLAB, ImageJ, Microsoft Office** — not needed. Node.js is used only by developers who rebuild the HTML file from `src/` (`node build.js`).
- **A graphics card / GPU** — not needed. Everything runs on the processor.

## Browser (the only real requirement)

The program needs a browser released in **2020 or later**. It uses modern JavaScript and WebAssembly (for OCR) that older browsers cannot run.

| Browser | Minimum version | Recommended |
|---|---|---|
| Google Chrome | 80 | current version |
| Microsoft Edge (Chromium) | 80 | current version |
| Mozilla Firefox | 74 | current version or 115 ESR+ |
| Safari (macOS) | 13.1 | 16.4 or later |
| Yandex Browser, Opera, Vivaldi, Brave | any version from 2020 on | current version |

Not supported: **Internet Explorer** (any version) and the old **Edge Legacy** (Edge 18 and earlier, Windows 10 before 2020).

### Features that depend on the browser

| Feature | Chrome / Edge | Firefox | Safari |
|---|---|---|---|
| All processing, OCR, measurements, compose, EDS | yes | yes | yes |
| "Save to folder" (batch writes into a chosen folder) | yes (86+) | no — each file is downloaded instead | no — each file is downloaded instead |
| "Save as…" dialog with chosen file name | yes (86+) | browser download | browser download |
| Compressed PDF export | yes (80+) | 113+ (older: larger, uncompressed PDF) | 16.4+ (older: larger PDF) |
| Copy figure to clipboard | yes | 127+ | 13.1+ |
| Remembering settings between sessions | yes | yes | yes (may be off in private mode) |

Chrome or Edge on a desktop computer gives the full feature set.

## Operating systems

| System | Works? | Notes |
|---|---|---|
| Windows 11 | yes | Edge is preinstalled and works as is. |
| Windows 10 | yes | Use Edge (Chromium), Chrome or Firefox. |
| Windows 8 / 8.1 | yes | Last supported browsers: Chrome 109, Edge 109, Firefox 115 ESR. These run the program fully, but no longer receive security updates. |
| Windows 7 | yes | Same as Windows 8.1. Install Chrome 109 or Firefox 115 ESR if only Internet Explorer is present. |
| Windows Vista | no | Newest available browsers (Chrome 49, Firefox 52 ESR) are too old. |
| Windows XP | no | Same as Vista. Unofficial browser forks for XP exist; they are not tested and not supported. Use another computer, or move the images by USB. |
| macOS 11 Big Sur or later | yes | Safari, Chrome or Firefox. |
| macOS 10.15 Catalina | yes | Safari 15, or Chrome up to 128. |
| macOS 10.13 High Sierra / 10.14 Mojave | yes | Safari 13.1+ (update the system), Chrome up to 116, or Firefox 115 ESR. |
| macOS 10.12 Sierra and older | mostly no | Safari is too old; Firefox 115 ESR may work on 10.12, not tested. |
| Linux (Ubuntu, Debian, Fedora, Astra, ALT, RED OS, etc.) | yes | Chrome, Chromium, Firefox or Yandex Browser. |
| ChromeOS | yes | Chrome. |
| iPad / Android tablet | partly | Opens and runs, but the interface is built for a mouse and large screen, and tablets limit image memory. Not recommended. |
| Phone | no | Screen too small; memory limits. |

Running inside a virtual machine, over Remote Desktop, or from a network drive works the same as on a local computer.

## Hardware

| | Minimum | Recommended |
|---|---|---|
| Processor | 64-bit dual-core, 2 GHz (2012 or newer) | quad-core or better |
| Memory (RAM) | 4 GB | 8 GB; 16 GB for large batches or large EDS sets |
| Free disk space | 100 MB (program file + saved results) | depends on the number of images |
| Screen | 1366 × 768 | 1920 × 1080 or larger |
| Input | mouse or touchpad | mouse (brush eraser and dragging are easier) |

**Memory use.** Each open image keeps several working copies in memory. A typical 2048 × 1536 SEM image uses roughly 50–80 MB; a 6144 × 4608 stitched image can use 500 MB or more. If the browser becomes slow or the tab crashes, process fewer images at a time, or close other tabs.

**32-bit Windows.** Works with a 32-bit browser, but one browser tab can use only about 2 GB of memory. Process small batches (around 10–20 images).

**Speed.** OCR of the scale label takes about 1–3 seconds per image on a typical office computer. The first OCR after opening the file takes a few seconds longer while the engine starts.

## Other situations

- **Corporate or institute computers with restrictions.** The program needs permission to open local HTML files with JavaScript and to download files. If a group policy blocks this, ask IT to allow it or use a computer without the restriction. No firewall exceptions are needed, since the program makes no network connections.
- **Antivirus warnings.** Some antivirus programs scan large HTML files with embedded code more slowly; opening may take a few extra seconds. The file contains no executable programs.
- **Computers without internet (isolated lab PCs, instrument PCs).** Fully supported; copy the HTML file by USB.
- **Running on the microscope's own PC.** Possible if it has a supported browser (often Windows 7 or 10). Many instrument PCs still run Windows XP; in that case copy the images to another computer.
- **Private / incognito mode.** Works, but settings are not remembered after the window is closed.
- **Input formats.** TIFF, PNG, JPEG, BMP, GIF, WebP, and AZtec Word reports (.docx). No extra codecs are needed.
