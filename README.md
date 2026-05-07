# Markdown Viewer

A Chrome extension that renders Markdown files as styled HTML, by [empiricapps.com](https://empiricapps.com).

## Install (development)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this directory
4. Click **Details** on the extension, scroll to **Allow access to file URLs** and turn it on

## Usage

Open any `.md` / `.markdown` file — local (`file://`) or remote (`http(s)://`) — in Chrome. The extension detects it by URL suffix and replaces the raw text with rendered HTML.

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

Built by [empiricapps.com](https://empiricapps.com). Uses marked, DOMPurify, highlight.js, Mermaid, KaTeX — see `vendor/` for bundled assets.
