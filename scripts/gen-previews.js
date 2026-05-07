#!/usr/bin/env node
// Generate standalone preview HTML files for the Chrome Web Store screenshots.
// Each HTML renders showcase.md in one of our themes; Chrome headless then screenshots them.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE = fs.readFileSync(path.join(ROOT, 'tests/fixtures/showcase.md'), 'utf8');
const OUT_DIR = path.join(ROOT, 'dist/screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Escape for embedding in <script type="text/markdown">
const escapedMd = FIXTURE.replace(/<\/script>/gi, '<\\/script>');

const THEMES = [
  // Shot 1: hero — light theme, top of page with TOC and overview
  { key: 'github-light', hljs: 'github', mermaid: 'default', scrollTo: null, showTOC: true },
  // Shot 2: dark theme showing flowchart diagram
  { key: 'github-dark',  hljs: 'github-dark', mermaid: 'dark', scrollTo: 'architecture-flowchart', showTOC: true },
  // Shot 3: dracula theme with code highlighting
  { key: 'dracula',      hljs: 'dracula', mermaid: 'dark', scrollTo: 'code-many-languages', showTOC: true, suffix: '-code' },
  // Shot 4: sepia reading mode with math
  { key: 'sepia',        hljs: 'stackoverflow-light', mermaid: 'neutral', scrollTo: 'math-when-katex-is-enabled', showTOC: false },
  // Shot 5: github-dark showing pie chart + user journey
  { key: 'github-dark',  hljs: 'github-dark', mermaid: 'dark', scrollTo: 'pie-chart-bundle-composition', showTOC: true, suffix: '-diagrams' }
];

// Base CSS extracted from content.js — duplicated here so previews render without the extension
const BASE_CSS = `
:root {
  --md-bg: #fbfbf9; --md-surface: #ffffff; --md-text: #1f2328;
  --md-muted: #59636e; --md-heading: #0e1116; --md-border: #e4e7eb;
  --md-border-strong: #d0d7de; --md-link: #0550ae; --md-link-hover: #0969da;
  --md-code-bg: #f1f3f5; --md-pre-bg: #f6f8fa; --md-accent: #0969da;
  --md-font-body: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI Variable",
                  "Segoe UI", "Helvetica Neue", Helvetica, Arial, "Apple Color Emoji",
                  "Segoe UI Emoji", sans-serif;
  --md-font-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, "Cascadia Code", Consolas, monospace;
  --md-max-width: 720px;
  --md-font-size: 17px;
}
:root[data-md-theme="github-dark"] {
  --md-bg: #0d1117; --md-surface: #161b22; --md-text: #e6edf3;
  --md-muted: #8b949e; --md-heading: #f0f6fc; --md-border: #21262d;
  --md-border-strong: #30363d; --md-link: #79c0ff; --md-link-hover: #a5d6ff;
  --md-code-bg: #1c2128; --md-pre-bg: #161b22; --md-accent: #58a6ff;
}
:root[data-md-theme="sepia"] {
  --md-bg: #f4ecd8; --md-surface: #ebe1c6; --md-text: #433422;
  --md-muted: #7a6a52; --md-heading: #2a1e10; --md-border: #d8ccb2;
  --md-border-strong: #bdad8b; --md-link: #9b4a14; --md-link-hover: #b85a1d;
  --md-code-bg: #ebe1c6; --md-pre-bg: #ebe1c6; --md-accent: #a0522d;
  --md-font-body: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif;
}
:root[data-md-theme="dracula"] {
  --md-bg: #282a36; --md-surface: #343746; --md-text: #f8f8f2;
  --md-muted: #6272a4; --md-heading: #ffffff; --md-border: #44475a;
  --md-border-strong: #6272a4; --md-link: #8be9fd; --md-link-hover: #bafff9;
  --md-code-bg: #343746; --md-pre-bg: #21222c; --md-accent: #bd93f9;
}
html, body { margin: 0; padding: 0; background: var(--md-bg); color: var(--md-text); }
body { font-family: var(--md-font-body); font-size: var(--md-font-size); line-height: 1.7;
  text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale; font-feature-settings: "kern","liga","calt"; }
.md-page { max-width: var(--md-max-width); margin: 0 auto; padding: 3.5rem 1.5rem 6rem; }
.md-root > :first-child { margin-top: 0; }
.md-root h1, .md-root h2, .md-root h3, .md-root h4, .md-root h5, .md-root h6 {
  color: var(--md-heading); font-weight: 700; line-height: 1.25; letter-spacing: -0.01em;
  margin: 2em 0 0.6em; scroll-margin-top: 1.5rem; }
.md-root h1 { font-size: 2.25em; letter-spacing: -0.022em; margin-top: 0;
  padding-bottom: 0.35em; border-bottom: 1px solid var(--md-border); }
.md-root h2 { font-size: 1.55em; padding-bottom: 0.3em; border-bottom: 1px solid var(--md-border); }
.md-root h3 { font-size: 1.25em; }
.md-root p { margin: 0 0 1.2em; }
.md-root strong { font-weight: 600; color: var(--md-heading); }
.md-root a { color: var(--md-link); text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--md-link) 35%, transparent); }
.md-root code { font-family: var(--md-font-mono); font-size: 0.87em; background: var(--md-code-bg);
  padding: 0.15em 0.4em; border-radius: 5px; border: 1px solid var(--md-border); }
.md-root pre { margin: 1.4em 0; padding: 1.1em 1.25em; background: var(--md-pre-bg);
  border: 1px solid var(--md-border); border-radius: 10px; overflow-x: auto;
  line-height: 1.55; font-size: 0.9em; }
.md-root pre code { font-family: var(--md-font-mono); background: transparent !important;
  border: none; padding: 0; font-size: inherit; }
.md-root pre code.hljs { background: transparent !important; padding: 0; }
.md-root blockquote { margin: 1.4em 0; padding: 0.3em 1.2em; color: var(--md-muted);
  border-left: 3px solid var(--md-accent);
  background: color-mix(in srgb, var(--md-accent) 5%, transparent);
  border-radius: 0 6px 6px 0; }
.md-root ul, .md-root ol { padding-left: 1.6em; margin: 0 0 1.2em; }
.md-root li { margin: 0.3em 0; }
.md-root table { width: 100%; margin: 1.4em 0; border-collapse: collapse; font-size: 0.95em;
  border-radius: 8px; overflow: hidden; border: 1px solid var(--md-border); }
.md-root th, .md-root td { padding: 0.65em 0.9em; border-bottom: 1px solid var(--md-border); text-align: left; }
.md-root tr:last-child td { border-bottom: none; }
.md-root th { font-weight: 600; background: var(--md-surface); color: var(--md-heading); }
.md-root hr { border: none; height: 1px; background: var(--md-border); margin: 2.5em 0; }
.md-root kbd { font-family: var(--md-font-mono); font-size: 0.85em; padding: 0.1em 0.5em;
  background: var(--md-surface); border: 1px solid var(--md-border-strong);
  border-bottom-width: 2px; border-radius: 4px; color: var(--md-text); }
.md-root .mermaid { margin: 1.4em 0; padding: 1em; background: var(--md-surface);
  border: 1px solid var(--md-border); border-radius: 10px; overflow-x: auto; text-align: center; }
.md-root .mermaid svg { display: inline-block; max-width: 100%; height: auto; }
/* TOC — narrower for screenshots so it doesn't overlap body */
.md-toc { position: fixed; top: 2rem; left: 1rem; width: 210px;
  max-height: calc(100vh - 4rem); overflow-y: auto;
  font-family: var(--md-font-body); font-size: 13px; line-height: 1.5;
  color: var(--md-text); padding: 1.1rem 1rem 1.1rem 1.25rem;
  background: var(--md-surface); border: 1px solid var(--md-border);
  border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06); }
.md-toc::before { content: "Contents"; display: block; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.09em; color: var(--md-muted);
  margin-bottom: 0.7em; padding-bottom: 0.55em; border-bottom: 1px solid var(--md-border); }
.md-toc ul { list-style: none; padding: 0; margin: 0; }
.md-toc > ul > li > a { font-weight: 600; color: var(--md-heading); font-size: 13.5px; }
.md-toc ul ul { padding-left: 0.7em; margin: 0.3em 0 0.55em;
  border-left: 1px solid var(--md-border); }
.md-toc ul ul a { font-weight: 500; font-size: 12.5px; color: var(--md-muted); }
.md-toc li { margin: 0.25em 0; }
.md-toc a { text-decoration: none; border: none; display: block;
  padding: 0.3em 0.65em; margin-left: -0.65em; border-left: 3px solid transparent;
  border-radius: 0 6px 6px 0; color: inherit; }
`;

function htmlFor(theme) {
  const themeAttr = theme.key === 'auto' ? '' : ` data-md-theme="${theme.key}"`;
  return `<!doctype html>
<html lang="en"${themeAttr}>
<head>
<meta charset="utf-8">
<title>Markdown Viewer Preview — ${theme.key}${theme.suffix || ''}</title>
<script src="../../vendor/marked.min.js"></script>
<script src="../../vendor/dompurify.min.js"></script>
<script src="../../vendor/highlight.min.js"></script>
<link rel="stylesheet" href="../../vendor/hljs-themes/${theme.hljs}.css">
<link rel="stylesheet" href="../../vendor/katex/katex.min.css">
<script src="../../vendor/mermaid.min.js"></script>
<script src="../../vendor/katex/katex.min.js"></script>
<script src="../../vendor/katex/auto-render.min.js"></script>
<style>${BASE_CSS}</style>
</head>
<body>
<script type="text/markdown" id="raw">${escapedMd}</script>
<main class="md-page"><article class="md-root"></article></main>
${theme.showTOC ? '<nav class="md-toc" id="toc"></nav>' : ''}
<script>
(async () => {
  function slugify(s) {
    return (s||'').toLowerCase().trim()
      .replace(/[^\\w\\s-]/g,'').replace(/[\\s_]+/g,'-').replace(/^-+|-+$/g,'') || 'section';
  }
  const raw = document.getElementById('raw').textContent;
  marked.setOptions({ gfm: true, breaks: false });
  const html = marked.parse(raw);
  const safe = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style','script','iframe','object','embed','form']
  });
  const root = document.querySelector('.md-root');
  root.innerHTML = safe;

  const used = new Map();
  root.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
    let id = slugify(h.textContent);
    let base = id, n = 0;
    while (used.has(id)) { n++; id = base + '-' + n; }
    used.set(id, 1); h.id = id;
  });

  root.querySelectorAll('pre code').forEach(el => {
    if (el.classList.contains('language-mermaid')) return;
    try { hljs.highlightElement(el); } catch(e) {}
  });

  root.querySelectorAll('pre > code.language-mermaid').forEach(code => {
    const d = document.createElement('div');
    d.className = 'mermaid';
    d.textContent = code.textContent;
    code.parentElement.replaceWith(d);
  });
  if (window.mermaid) {
    try {
      window.mermaid.initialize({
        startOnLoad: false, theme: '${theme.mermaid}', securityLevel: 'loose',
        flowchart: { htmlLabels: true, curve: 'basis', useMaxWidth: true },
        gantt: { useMaxWidth: false, barHeight: 22, fontSize: 12 },
        gitGraph: { useMaxWidth: true }, pie: { useMaxWidth: true }
      });
      await window.mermaid.run({ querySelector: '.mermaid' });
    } catch(e) { console.error('mermaid:', e); }
  }

  if (window.renderMathInElement) {
    window.renderMathInElement(root, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }

  // Build TOC
  const tocEl = document.getElementById('toc');
  if (tocEl) {
    const headings = root.querySelectorAll('h2, h3');
    const ul = document.createElement('ul');
    let sub = null;
    headings.forEach(h => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + h.id; a.textContent = h.textContent;
      li.appendChild(a);
      if (h.tagName === 'H2') { ul.appendChild(li); sub = null; }
      else {
        if (!sub) { sub = document.createElement('ul'); (ul.lastElementChild || ul).appendChild(sub); }
        sub.appendChild(li);
      }
    });
    tocEl.appendChild(ul);
  }

  // Wait for late paints (mermaid SVG, katex fonts)
  await new Promise(r => setTimeout(r, 3500));

  // Scroll to target section (do last, after mermaid rendered)
  const scrollTarget = ${JSON.stringify(theme.scrollTo)};
  if (scrollTarget) {
    const target = document.getElementById(scrollTarget);
    if (target) {
      target.scrollIntoView({ block: 'start' });
      window.scrollBy(0, -24);
    } else {
      console.warn('scrollTarget not found:', scrollTarget);
    }
  }
  await new Promise(r => setTimeout(r, 300));
  document.title = 'READY';
})();
</script>
</body>
</html>`;
}

THEMES.forEach(t => {
  const name = t.key + (t.suffix || '');
  fs.writeFileSync(path.join(OUT_DIR, `preview-${name}.html`), htmlFor(t));
  console.log('wrote preview-' + name + '.html');
});
