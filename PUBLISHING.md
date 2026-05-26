# Publishing

Two stores, two zips. Build them with `./scripts/pack.sh` (Chrome) and `./scripts/pack-firefox.sh` (Firefox).

# Chrome Web Store

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

---

# Firefox Add-ons (AMO)

## One-time setup

1. Create an AMO developer account: <https://addons.mozilla.org/developers/>.
   - **Free** — no signup fee.
   - Requires a Firefox account.
2. Extension ID is fixed: `markdown-viewer@empiricapps.com` (set in `manifest.firefox.json`). Do not change it after first submission — AMO ties updates to this ID.

## Build the upload package

```bash
./scripts/pack-firefox.sh
```

Output: `dist/markdown-viewer-firefox-<version>.zip`. Script stages a build dir where `manifest.firefox.json` is copied as `manifest.json`, then zips it together with `icons/`, `src/`, `vendor/`.

## Differences from the Chrome build

- `browser_specific_settings.gecko` — Firefox extension ID + `strict_min_version: 115` (ESR baseline).
- `background.scripts` instead of `background.service_worker` — Firefox MV3 service worker support is still flaky as of FF 121; classic background scripts are more reliable.
- `options_ui` instead of `options_page` — opens settings inside `about:addons` (Firefox convention).
- `chrome.action.setBadgeTextColor` is feature-gated in the service worker — Firefox doesn't expose it.
- A banner instructs the user to enable "Access your data for file URLs" in `about:addons` if `file://` content fails to load.

## file:/// permission (user-side)

Firefox does **not** grant `file:///` access automatically, even with the manifest permission. After install, the user must:

1. Open `about:addons` → Markdown Viewer → **Permissions** tab.
2. Toggle on **Access your data for file URLs**.

Mention this in the AMO listing.

## Listing copy

**Title**: Markdown Viewer

**Summary** (max 250 chars):
> Render Markdown files beautifully in Firefox — 5 themes, syntax highlighting, TOC, Mermaid, KaTeX. By empiricapps.com.

**Description**: re-use the Chrome detailed description, but replace "Chrome" with "Firefox" and add a final note:

> **File access on Firefox**: to render local `.md` files (`file://`), open `about:addons` → Markdown Viewer → Permissions → enable "Access your data for file URLs".

## Submit

1. Go to <https://addons.mozilla.org/developers/addon/submit/>.
2. Distribution: **On this site** (listed on AMO).
3. Upload `dist/markdown-viewer-firefox-<version>.zip` — the validator runs automatically.
4. License: same as Chrome listing (MIT per `LICENSE`).
5. Fill in summary, description, categories (Productivity / Developer Tools), screenshots.
6. Submit for review.

**Review timeline**: first submission is human-reviewed (1–7 days typical). Subsequent updates often pass automated review in minutes if no new permissions are introduced.

## Updates after launch

1. Bump `"version"` in both `manifest.json` **and** `manifest.firefox.json`.
2. `./scripts/pack-firefox.sh`.
3. AMO Developer Hub → Markdown Viewer → **Upload New Version**.

