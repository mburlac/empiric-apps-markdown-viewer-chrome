# Markdown Viewer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/mburlac/empiric-apps-markdown-viewer-chrome)](https://github.com/mburlac/empiric-apps-markdown-viewer-chrome/releases/latest)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4)](https://developer.chrome.com/docs/extensions/develop/migrate)
[![Privacy: local-only](https://img.shields.io/badge/Privacy-local--only-brightgreen)](#privacy)

A Chrome extension that renders Markdown files as beautifully styled pages — themes, syntax highlighting, table of contents, Mermaid diagrams, and KaTeX math. By [empiricapps.com](https://empiricapps.com).

## Install

**From source (recommended for development):**

1. Clone this repo
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select this directory
5. Click **Details** on the extension, scroll to **Allow access to file URLs** and turn it on

**From release zip:** download the latest [release](https://github.com/mburlac/empiric-apps-markdown-viewer-chrome/releases/latest) and load the extracted folder via *Load unpacked*.

## Usage

Open any `.md` / `.markdown` file — local (`file://`) or remote (`http(s)://`) — in Chrome. The extension detects it by URL suffix and replaces the raw text with rendered HTML.

## Privacy

All rendering happens locally in your browser. No data is sent to any server. No analytics, no telemetry, no remote code execution — every dependency is bundled under `vendor/`.

## Testing

Fixtures live in `tests/fixtures/`. Drag `tests/fixtures/basic.md` onto a Chrome tab to verify rendering.

## Icons

`icons/icon.svg` is the source of truth. Regenerate PNGs with:

```
./scripts/build-icons.sh
```

Requires ImageMagick (`brew install imagemagick`).

## Features

- 5 themes: Auto, GitHub Light, GitHub Dark, Sepia, Dracula
- Syntax highlighting (highlight.js, ~35 languages)
- TOC sidebar with active-heading tracking
- Mermaid diagrams (lazy-loaded)
- KaTeX math (lazy-loaded)
- Toggle rendered / raw via toolbar icon
- Configurable reading width and font size
- Works on `file://`, `http://`, and `https://`

## Publishing

See [PUBLISHING.md](./PUBLISHING.md) for Chrome Web Store submission steps. Build the zip with:

```bash
./scripts/pack.sh
```

## License & credits

[MIT](LICENSE), built by [empiricapps.com](https://empiricapps.com). Bundled vendor libraries retain their own licenses (marked: MIT, DOMPurify: Apache 2.0 / MPL 2.0, highlight.js: BSD-3-Clause, Mermaid: MIT, KaTeX: MIT) — see `vendor/`.
