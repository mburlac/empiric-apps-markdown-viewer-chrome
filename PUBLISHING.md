# Publishing to Chrome Web Store

## One-time setup

1. Create a Chrome Web Store developer account: <https://chrome.google.com/webstore/devconsole>.
   - **$5 one-time fee** (pays for identity verification).
   - Requires a Google account.
2. Verify the homepage domain `empiricapps.com` (optional, gives "Verified" badge on listing).

## Build the upload package

```bash
./scripts/pack.sh
```

Output: `dist/markdown-viewer-<version>.zip` — the artifact uploaded to the store.

The zip contains `manifest.json`, icons, `src/`, and `vendor/`. Tests, scripts, and local dev files are excluded.

## Store listing assets

Before submitting, prepare these assets (the store requires them):

| Asset | Size | Purpose |
|-------|------|---------|
| Icon | 128×128 PNG | auto-pulled from `icons/icon-128.png` |
| Screenshots | 1280×800 or 640×400, up to 5 | show the extension in action on a real .md file |
| Small promo tile | 440×280 PNG | shown in store search results |
| Large promo tile | 920×680 PNG | optional, for featured placement |
| Marquee promo | 1400×560 PNG | optional, for homepage features |

Screenshot suggestions:
- `showcase.md` rendered in GitHub Light theme
- Same file in Dracula theme
- TOC sidebar expanded
- Mermaid diagram rendered
- Options page

## Listing copy

**Title**: Markdown Viewer

**Short description** (max 132 chars):
> Render Markdown files beautifully in Chrome — 5 themes, syntax highlighting, TOC, Mermaid, KaTeX. By empiricapps.com.

**Detailed description** (example — refine before submission):
> Markdown Viewer turns any `.md` / `.markdown` file in Chrome into a beautifully styled page.
>
> **Features**
> - 5 themes: Auto, GitHub Light, GitHub Dark, Sepia, Dracula
> - Syntax highlighting for ~35 languages via highlight.js
> - Table of contents sidebar with scroll tracking
> - Mermaid diagrams (flowchart, sequence, class, state, ER, gantt, pie, journey, git graph, mindmap, quadrant)
> - KaTeX math rendering (inline `$…$` and display `$$…$$`)
> - Adjustable reading width and font size
> - Toggle rendered / raw with one click
> - XSS-safe: all output sanitized with DOMPurify
> - Works on local files (`file://`) and remote raw-file URLs
>
> **Privacy**
> All rendering happens locally in your browser. No data is sent to any server. No analytics.
>
> Built by [empiricapps.com](https://empiricapps.com).

**Category**: Productivity (or Developer Tools)

**Language**: English

## Permissions justification

In the store review form you'll be asked to justify each permission:

- `storage` — "Persist user preferences (theme, reading width, font size, TOC toggle) across tabs and sessions."
- `activeTab` — "Toggle rendered/raw view when the user clicks the toolbar icon."
- `host_permissions: file:///*, http://*/*, https://*/*` — "The extension must read any tab that may contain Markdown, regardless of host, so it can detect and render `.md` files. No data is transmitted."

## Submit

1. Go to <https://chrome.google.com/webstore/devconsole>.
2. **+ New item** → upload `dist/markdown-viewer-<version>.zip`.
3. Fill in the store listing (title, descriptions, screenshots, promo tile).
4. Set visibility: **Public** or **Unlisted**.
5. Submit for review.

**Review timeline**: typically 1–3 business days for a first submission. Expect an extra round if permissions need more justification.

## Updates after launch

1. Bump `"version"` in `manifest.json` (e.g. `0.2.0` → `0.2.1`).
2. `./scripts/pack.sh`.
3. In the Dev Console → your item → **Package** → upload new zip → submit for review.

Tip: keep a `CHANGELOG.md` so the "What's new" box in the store listing is easy to fill.
