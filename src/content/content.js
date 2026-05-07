(() => {
  if (!document.documentElement.hasAttribute('data-md-detected')) return;

  const log = (...a) => console.log('[md-viewer]', ...a);
  const warn = (...a) => console.warn('[md-viewer]', ...a);
  const errLog = (...a) => console.error('[md-viewer]', ...a);

  const DEFAULTS = {
    theme: 'auto',
    maxWidth: 'full',
    fontSize: 'medium',
    showTOC: false,
    tocWidth: 248,
    tocOpen: true,
    enableMermaid: false,
    enableKatex: false
  };
  const TOC_MIN_W = 160;
  const TOC_MAX_W = 460;
  const HLJS_MAP = {
    'github-light': 'github',
    'github-dark': 'github-dark',
    'sepia': 'stackoverflow-light',
    'dracula': 'dracula'
  };

  let rawText = '';
  let currentSettings = { ...DEFAULTS };
  let mode = 'rendered';
  let tocObserver = null;
  let mermaidLoaded = false;
  let katexLoaded = false;

  async function getSettings() {
    try { return await chrome.storage.sync.get(DEFAULTS); }
    catch { return { ...DEFAULTS }; }
  }

  function readBodyText() {
    const pre = document.body && document.body.querySelector('pre');
    if (pre && pre.innerText.trim()) return { source: '<pre>', text: pre.innerText };
    const bodyText = document.body && document.body.innerText && document.body.innerText.trim();
    if (bodyText) return { source: 'body.innerText', text: bodyText };
    return null;
  }

  async function getRaw() {
    let r = readBodyText();
    if (r) { log('source:', r.source); return r.text; }

    if (document.readyState !== 'complete') {
      log('body empty at document_end, waiting for window load');
      await new Promise(res => window.addEventListener('load', res, { once: true }));
      r = readBodyText();
      if (r) { log('source:', r.source, '(after load)'); return r.text; }
    }

    log('body still empty, asking service worker to fetch');
    try {
      const res = await chrome.runtime.sendMessage({ type: 'FETCH_TEXT', url: location.href });
      if (res && res.ok) { log('source: sw fetch, length', res.text.length); return res.text; }
      warn('sw fetch failed:', res && res.error);
      return null;
    } catch (e) { errLog('sendMessage failed:', e); return null; }
  }

  function resolveHljsTheme(theme) {
    if (theme === 'auto') {
      return matchMedia('(prefers-color-scheme: dark)').matches ? 'github-dark' : 'github';
    }
    return HLJS_MAP[theme] || 'github';
  }

  function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'auto') html.removeAttribute('data-md-theme');
    else html.setAttribute('data-md-theme', theme);

    const href = chrome.runtime.getURL(`vendor/hljs-themes/${resolveHljsTheme(theme)}.css`);
    let link = document.getElementById('md-hljs-theme');
    if (!link) {
      link = document.createElement('link');
      link.id = 'md-hljs-theme';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = href;
  }

  function applyLayout(s) {
    const html = document.documentElement;
    html.setAttribute('data-md-width', s.maxWidth || 'normal');
    html.setAttribute('data-md-size', s.fontSize || 'medium');
  }

  function setFavicon() {
    try {
      document.querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"]')
        .forEach(l => l.remove());
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = chrome.runtime.getURL('icons/icon-32.png');
      document.head.appendChild(link);
    } catch (e) { warn('favicon failed:', e); }
  }

  function injectBaseStyles() {
    if (document.getElementById('md-base-style')) return;
    const style = document.createElement('style');
    style.id = 'md-base-style';
    style.textContent = `
      :root {
        --md-bg: #fbfbf9; --md-surface: #ffffff; --md-text: #1f2328;
        --md-muted: #59636e; --md-heading: #0e1116; --md-border: #e4e7eb;
        --md-border-strong: #d0d7de; --md-link: #0550ae; --md-link-hover: #0969da;
        --md-code-bg: #f1f3f5; --md-pre-bg: #f6f8fa; --md-accent: #0969da;
        --md-font-body: -apple-system, BlinkMacSystemFont, "Inter",
                        "Segoe UI Variable", "Segoe UI", "Helvetica Neue",
                        Helvetica, Arial, "Apple Color Emoji",
                        "Segoe UI Emoji", sans-serif;
        --md-font-mono: ui-monospace, "SF Mono", "JetBrains Mono",
                        Menlo, "Cascadia Code", Consolas, monospace;
        --md-max-width: none;
        --md-font-size: 17px;
      }
      :root[data-md-width="narrow"] { --md-max-width: 620px; }
      :root[data-md-width="normal"] { --md-max-width: 720px; }
      :root[data-md-width="wide"]   { --md-max-width: 860px; }
      :root[data-md-width="full"]   { --md-max-width: none; }
      :root[data-md-size="small"]  { --md-font-size: 15px; }
      :root[data-md-size="large"]  { --md-font-size: 19px; }

      @media (prefers-color-scheme: dark) {
        :root:not([data-md-theme]) {
          --md-bg: #0d1117; --md-surface: #161b22; --md-text: #e6edf3;
          --md-muted: #8b949e; --md-heading: #f0f6fc; --md-border: #21262d;
          --md-border-strong: #30363d; --md-link: #79c0ff; --md-link-hover: #a5d6ff;
          --md-code-bg: #1c2128; --md-pre-bg: #161b22; --md-accent: #58a6ff;
        }
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
        --md-font-body: "Iowan Old Style", "Palatino Linotype", Palatino,
                        Georgia, "Times New Roman", serif;
      }
      :root[data-md-theme="dracula"] {
        --md-bg: #282a36; --md-surface: #343746; --md-text: #f8f8f2;
        --md-muted: #6272a4; --md-heading: #ffffff; --md-border: #44475a;
        --md-border-strong: #6272a4; --md-link: #8be9fd; --md-link-hover: #bafff9;
        --md-code-bg: #343746; --md-pre-bg: #21222c; --md-accent: #bd93f9;
      }

      html, body { margin: 0; padding: 0; background: var(--md-bg); color: var(--md-text); }
      body {
        font-family: var(--md-font-body);
        font-size: var(--md-font-size);
        line-height: 1.7;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-feature-settings: "kern", "liga", "calt";
        padding-left: var(--md-toc-space, 0);
        transition: padding-left .15s ease;
      }
      :root.md-toc-resizing body { transition: none; }
      @media (max-width: 1024px) { body { padding-left: 0 !important; } }
      .md-page { max-width: var(--md-max-width); margin: 0 auto; padding: 3.5rem clamp(1.5rem, 5vw, 4rem) 6rem; }
      .md-root > :first-child { margin-top: 0; }
      .md-root > :last-child { margin-bottom: 0; }

      .md-root h1, .md-root h2, .md-root h3,
      .md-root h4, .md-root h5, .md-root h6 {
        color: var(--md-heading);
        font-weight: 700; line-height: 1.25;
        letter-spacing: -0.01em; margin: 2em 0 0.6em;
        scroll-margin-top: 1.5rem;
      }
      .md-root h1 {
        font-size: 2.25em; letter-spacing: -0.022em; margin-top: 0;
        padding-bottom: 0.35em; border-bottom: 1px solid var(--md-border);
      }
      .md-root h2 {
        font-size: 1.55em; padding-bottom: 0.3em;
        border-bottom: 1px solid var(--md-border);
      }
      .md-root h3 { font-size: 1.25em; }
      .md-root h4 { font-size: 1.05em; }
      .md-root h5 { font-size: 0.95em; color: var(--md-muted); }
      .md-root h6 { font-size: 0.85em; color: var(--md-muted);
                    text-transform: uppercase; letter-spacing: 0.06em; }

      .md-root p { margin: 0 0 1.2em; }
      .md-root strong { font-weight: 600; color: var(--md-heading); }
      .md-root em { font-style: italic; }

      .md-root a {
        color: var(--md-link); text-decoration: none;
        border-bottom: 1px solid color-mix(in srgb, var(--md-link) 35%, transparent);
        transition: color .15s ease, border-color .15s ease;
      }
      .md-root a:hover { color: var(--md-link-hover); border-bottom-color: currentColor; }

      .md-root code {
        font-family: var(--md-font-mono); font-size: 0.87em;
        background: var(--md-code-bg);
        padding: 0.15em 0.4em; border-radius: 5px;
        border: 1px solid var(--md-border);
      }
      .md-root pre {
        margin: 1.4em 0; padding: 1.1em 1.25em;
        background: var(--md-pre-bg); border: 1px solid var(--md-border);
        border-radius: 10px; overflow-x: auto;
        line-height: 1.55; font-size: 0.9em;
      }
      .md-root pre code {
        font-family: var(--md-font-mono);
        background: transparent !important; border: none; padding: 0; font-size: inherit;
      }
      .md-root pre code.hljs { background: transparent !important; padding: 0; }

      .md-root blockquote {
        margin: 1.4em 0; padding: 0.3em 1.2em; color: var(--md-muted);
        border-left: 3px solid var(--md-accent);
        background: color-mix(in srgb, var(--md-accent) 5%, transparent);
        border-radius: 0 6px 6px 0;
      }
      .md-root blockquote > :first-child { margin-top: 0; }
      .md-root blockquote > :last-child { margin-bottom: 0; }

      .md-root ul, .md-root ol { padding-left: 1.6em; margin: 0 0 1.2em; }
      .md-root li { margin: 0.3em 0; }
      .md-root li > p { margin: 0.5em 0; }
      .md-root ul ul, .md-root ol ol, .md-root ul ol, .md-root ol ul { margin: 0.25em 0; }

      .md-root img { max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 1.4em auto; }

      .md-root table {
        width: 100%; margin: 1.4em 0; border-collapse: collapse;
        font-size: 0.95em; border-radius: 8px; overflow: hidden;
        border: 1px solid var(--md-border);
      }
      .md-root th, .md-root td {
        padding: 0.65em 0.9em; border-bottom: 1px solid var(--md-border); text-align: left;
      }
      .md-root tr:last-child td { border-bottom: none; }
      .md-root th { font-weight: 600; background: var(--md-surface); color: var(--md-heading); }
      .md-root tbody tr:hover td { background: color-mix(in srgb, var(--md-accent) 5%, transparent); }

      .md-root hr { border: none; height: 1px; background: var(--md-border); margin: 2.5em 0; }

      .md-root kbd {
        font-family: var(--md-font-mono); font-size: 0.85em;
        padding: 0.1em 0.5em; background: var(--md-surface);
        border: 1px solid var(--md-border-strong); border-bottom-width: 2px;
        border-radius: 4px; color: var(--md-text);
      }

      .md-root input[type="checkbox"] { margin-right: 0.45em; accent-color: var(--md-accent); }
      .md-root li:has(> input[type="checkbox"]) { list-style: none; margin-left: -1.3em; }

      ::selection { background: color-mix(in srgb, var(--md-accent) 30%, transparent); }

      /* Mermaid */
      .md-root .mermaid {
        margin: 1.4em 0; padding: 1em;
        background: var(--md-surface);
        border: 1px solid var(--md-border);
        border-radius: 10px;
        overflow-x: auto;
        text-align: center;
      }
      .md-root .mermaid svg { display: inline-block; max-width: 100%; height: auto; }
      /* wide diagrams: allow natural width + scroll */
      .md-root .mermaid[data-wide="1"] { text-align: left; }
      .md-root .mermaid[data-wide="1"] svg { max-width: none; }

      /* Raw view */
      .md-raw {
        max-width: var(--md-max-width);
        margin: 3rem auto;
        padding: 1.5rem 1.75rem;
        background: var(--md-pre-bg);
        border: 1px solid var(--md-border);
        border-radius: 10px;
        font-family: var(--md-font-mono);
        font-size: 0.9em;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
        color: var(--md-text);
      }

      /* TOC sidebar */
      .md-toc {
        position: fixed; top: 3rem; left: 1.5rem;
        width: 248px;
        max-height: calc(100vh - 5rem);
        overflow-y: auto;
        font-family: var(--md-font-body);
        font-size: 13px;
        line-height: 1.5;
        color: var(--md-text);
        padding: 1.1rem 1rem 1.1rem 1.25rem;
        background: var(--md-surface);
        border: 1px solid var(--md-border);
        border-radius: 12px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);
      }
      .md-toc::before {
        content: "Contents";
        display: block;
        font-size: 11px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.09em;
        color: var(--md-muted);
        margin-bottom: 0.7em;
        padding-bottom: 0.55em;
        border-bottom: 1px solid var(--md-border);
      }
      .md-toc ul { list-style: none; padding: 0; margin: 0; }
      .md-toc > ul > li > a {
        font-weight: 600;
        color: var(--md-heading);
        font-size: 13.5px;
      }
      .md-toc ul ul {
        padding-left: 0.7em; margin: 0.3em 0 0.55em;
        border-left: 1px solid var(--md-border);
      }
      .md-toc ul ul a {
        font-weight: 500;
        font-size: 12.5px;
        color: var(--md-muted);
      }
      .md-toc li { margin: 0.25em 0; }
      .md-toc a {
        text-decoration: none; border: none;
        display: block;
        padding: 0.3em 0.65em;
        margin-left: -0.65em;
        border-left: 3px solid transparent;
        border-radius: 0 6px 6px 0;
        transition: color .15s ease, background .15s ease,
                    border-color .15s ease, padding-left .15s ease;
      }
      .md-toc a:hover {
        color: var(--md-heading);
        background: color-mix(in srgb, var(--md-accent) 8%, transparent);
      }
      .md-toc a.active {
        color: var(--md-accent) !important;
        background: color-mix(in srgb, var(--md-accent) 12%, transparent);
        border-left-color: var(--md-accent);
        font-weight: 700 !important;
      }
      .md-toc::-webkit-scrollbar { width: 6px; }
      .md-toc::-webkit-scrollbar-thumb {
        background: var(--md-border-strong);
        border-radius: 3px;
      }
      .md-toc::-webkit-scrollbar-thumb:hover { background: var(--md-muted); }
      .md-toc-resizer {
        position: absolute;
        top: 0; right: -2px; bottom: 0;
        width: 6px;
        cursor: ew-resize;
        background: transparent;
        transition: background .15s ease;
        border-radius: 4px;
        z-index: 1;
      }
      .md-toc-resizer:hover {
        background: color-mix(in srgb, var(--md-accent) 35%, transparent);
      }
      .md-toc.resizing .md-toc-resizer {
        background: var(--md-accent);
      }
      :root.md-toc-resizing,
      :root.md-toc-resizing body {
        cursor: ew-resize !important;
        user-select: none !important;
      }

      .md-toc-toggle {
        position: fixed;
        top: 0.75rem;
        left: 1.5rem;
        z-index: 100;
        width: 34px;
        height: 34px;
        background: var(--md-surface);
        border: 1px solid var(--md-border);
        border-radius: 9px;
        cursor: pointer;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 0;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        transition: background .15s ease, border-color .15s ease, box-shadow .15s ease;
      }
      .md-toc-toggle:hover {
        border-color: var(--md-border-strong);
        box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 4px 10px rgba(0,0,0,0.05);
      }
      .md-toc-toggle:focus-visible {
        outline: 2px solid var(--md-accent);
        outline-offset: 2px;
      }
      .md-toc-toggle span {
        display: block;
        width: 16px;
        height: 2px;
        background: var(--md-text);
        border-radius: 1px;
        transition: transform .2s ease, opacity .2s ease;
      }
      :root[data-md-toc-open] .md-toc-toggle span:nth-child(1) {
        transform: translateY(6px) rotate(45deg);
      }
      :root[data-md-toc-open] .md-toc-toggle span:nth-child(2) {
        opacity: 0;
      }
      :root[data-md-toc-open] .md-toc-toggle span:nth-child(3) {
        transform: translateY(-6px) rotate(-45deg);
      }
      :root:not([data-md-toc-open]) .md-toc { display: none; }

      @media (max-width: 1024px) {
        .md-toc { display: none; }
        .md-toc-toggle { display: none; }
      }

      /* Error banner */
      .md-error {
        position: fixed; top: 1rem; left: 50%; transform: translateX(-50%);
        z-index: 9999; padding: .6em 1em;
        background: #fff1f0; color: #b42318; border: 1px solid #fda29b;
        border-radius: 8px; font: 13px/1.4 var(--md-font-body);
      }
    `;
    document.head.appendChild(style);
  }

  function slugify(s) {
    return (s || '').toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section';
  }

  function addHeadingIds(root) {
    const used = new Map();
    root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      let id = h.id || slugify(h.textContent);
      let n = 0, base = id;
      while (used.has(id)) { n++; id = `${base}-${n}`; }
      used.set(id, 1);
      h.id = id;
    });
  }

  function clampTocWidth(w) {
    const n = Number(w);
    if (!Number.isFinite(n)) return 248;
    return Math.max(TOC_MIN_W, Math.min(TOC_MAX_W, Math.round(n)));
  }

  function setTocSpace(width) {
    const root = document.documentElement;
    if (!width) root.style.removeProperty('--md-toc-space');
    else root.style.setProperty('--md-toc-space', (width + 48) + 'px');
  }

  function setTocOpen(open, persist = false) {
    const root = document.documentElement;
    if (open) root.setAttribute('data-md-toc-open', '');
    else root.removeAttribute('data-md-toc-open');
    if (open) setTocSpace(clampTocWidth(currentSettings.tocWidth));
    else setTocSpace(0);
    if (persist && currentSettings.tocOpen !== open) {
      currentSettings.tocOpen = open;
      chrome.storage.sync.set({ tocOpen: open }).catch(() => {});
    }
  }

  function addTocToggle() {
    const existing = document.querySelector('.md-toc-toggle');
    if (existing) existing.remove();
    const btn = document.createElement('button');
    btn.className = 'md-toc-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle table of contents');
    btn.innerHTML = '<span></span><span></span><span></span>';
    btn.addEventListener('click', () => {
      setTocOpen(!currentSettings.tocOpen, true);
    });
    document.body.appendChild(btn);
  }

  function buildTOC(root) {
    const headings = root.querySelectorAll('h2, h3');
    if (headings.length < 2) return null;
    const nav = document.createElement('nav');
    nav.className = 'md-toc';
    nav.setAttribute('aria-label', 'Table of contents');
    nav.style.width = clampTocWidth(currentSettings.tocWidth) + 'px';
    const rootUl = document.createElement('ul');
    let currentSub = null;
    headings.forEach(h => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      a.dataset.targetId = h.id;
      li.appendChild(a);
      if (h.tagName === 'H2') {
        rootUl.appendChild(li);
        currentSub = null;
      } else {
        if (!currentSub) {
          currentSub = document.createElement('ul');
          const last = rootUl.lastElementChild;
          (last || rootUl).appendChild(currentSub);
        }
        currentSub.appendChild(li);
      }
    });
    nav.appendChild(rootUl);

    const resizer = document.createElement('div');
    resizer.className = 'md-toc-resizer';
    resizer.setAttribute('role', 'separator');
    resizer.setAttribute('aria-orientation', 'vertical');
    resizer.setAttribute('aria-label', 'Resize table of contents');
    nav.appendChild(resizer);

    return nav;
  }

  let tocSaveTimer = null;
  function attachTocResizer(nav) {
    const resizer = nav.querySelector('.md-toc-resizer');
    if (!resizer) return;
    let startX = 0;
    let startWidth = 0;

    const onMove = (e) => {
      const w = clampTocWidth(startWidth + (e.clientX - startX));
      nav.style.width = w + 'px';
      setTocSpace(w);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      nav.classList.remove('resizing');
      document.documentElement.classList.remove('md-toc-resizing');
      const finalW = parseInt(nav.style.width, 10);
      if (Number.isFinite(finalW) && finalW !== currentSettings.tocWidth) {
        currentSettings.tocWidth = finalW;
        clearTimeout(tocSaveTimer);
        tocSaveTimer = setTimeout(() => {
          chrome.storage.sync.set({ tocWidth: finalW }).catch(() => {});
        }, 200);
      }
    };

    resizer.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      startX = e.clientX;
      startWidth = nav.offsetWidth;
      nav.classList.add('resizing');
      document.documentElement.classList.add('md-toc-resizing');
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  function activateTOC(nav, root) {
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    const links = nav.querySelectorAll('a');
    const byId = new Map();
    links.forEach(l => byId.set(l.dataset.targetId, l));
    const seen = new Set();
    tocObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) seen.add(e.target.id);
        else seen.delete(e.target.id);
      });
      links.forEach(l => l.classList.remove('active'));
      const first = [...root.querySelectorAll('h2, h3')].find(h => seen.has(h.id));
      if (first) {
        const l = byId.get(first.id);
        if (l) l.classList.add('active');
      }
    }, { rootMargin: '-8% 0px -70% 0px', threshold: 0 });
    root.querySelectorAll('h2, h3').forEach(h => tocObserver.observe(h));
  }

  function rewriteUrls(root, base) {
    const resolve = (url) => {
      if (!url) return url;
      if (/^(https?:|data:|mailto:|chrome-extension:|file:|#)/i.test(url)) return url;
      try { return new URL(url, base).toString(); } catch { return url; }
    };
    root.querySelectorAll('a[href]').forEach(a => {
      a.setAttribute('href', resolve(a.getAttribute('href')));
      if (/^https?:/i.test(a.getAttribute('href') || '')) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });
    root.querySelectorAll('img[src]').forEach(img => {
      img.setAttribute('src', resolve(img.getAttribute('src')));
    });
  }

  function highlightCode(root) {
    if (typeof hljs === 'undefined') return;
    root.querySelectorAll('pre code').forEach(el => {
      if (el.classList.contains('language-mermaid')) return;
      try { hljs.highlightElement(el); } catch (e) { warn('hljs failed:', e); }
    });
  }

  function injectScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.charset = 'utf-8';
      s.setAttribute('charset', 'utf-8');
      s.src = src;
      s.onload = () => res();
      s.onerror = () => rej(new Error('load failed: ' + src));
      (document.head || document.documentElement).appendChild(s);
    });
  }
  function injectStylesheet(href) {
    if (document.querySelector(`link[data-md-css="${href}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.dataset.mdCss = href;
    document.head.appendChild(l);
  }
  function mermaidThemeFor(t) {
    if (t === 'github-dark' || t === 'dracula') return 'dark';
    if (t === 'sepia') return 'neutral';
    if (t === 'auto') return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default';
    return 'default';
  }

  async function renderMermaid(root) {
    if (!currentSettings.enableMermaid) return;
    const codes = root.querySelectorAll('pre > code.language-mermaid');
    if (!codes.length) return;
    log('mermaid: converting', codes.length, 'blocks');

    codes.forEach((code, i) => {
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.id = 'md-mermaid-' + i;
      div.textContent = code.textContent;
      code.parentElement.replaceWith(div);
    });

    try {
      if (!mermaidLoaded) {
        log('mermaid: loading library');
        await injectScript(chrome.runtime.getURL('vendor/mermaid.min.js') + '?v=10.9.1');
        mermaidLoaded = true;
      }
      const theme = mermaidThemeFor(currentSettings.theme);
      document.documentElement.setAttribute('data-md-mermaid-theme', theme);
      await injectScript(chrome.runtime.getURL('src/content/page-inject/mermaid-init.js') + '?t=' + Date.now());
    } catch (e) { warn('mermaid failed:', e); }
  }

  async function renderKatex(root) {
    if (!currentSettings.enableKatex) return;
    const text = root.textContent;
    if (!/\$[^$\n]+?\$|\$\$[\s\S]+?\$\$/.test(text)) return;

    injectStylesheet(chrome.runtime.getURL('vendor/katex/katex.min.css'));
    try {
      if (!katexLoaded) {
        await injectScript(chrome.runtime.getURL('vendor/katex/katex.min.js') + '?v=0.16.10');
        await injectScript(chrome.runtime.getURL('vendor/katex/auto-render.min.js') + '?v=0.16.10');
        katexLoaded = true;
      }
      await injectScript(chrome.runtime.getURL('src/content/page-inject/katex-init.js') + '?t=' + Date.now());
    } catch (e) { warn('katex failed:', e); }
  }

  function renderArticle() {
    marked.setOptions({ gfm: true, breaks: false });
    const html = marked.parse(rawText);
    const safe = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'formaction']
    });

    const titleMatch = rawText.match(/^#[ \t]+(.+)$/m);
    if (titleMatch && titleMatch[1].trim()) document.title = titleMatch[1].trim();

    document.body.innerHTML =
      '<main class="md-page"><article class="md-root">' + safe + '</article></main>';

    const root = document.querySelector('.md-root');
    if (!root) { errLog('article root missing after render'); return; }

    addHeadingIds(root);
    rewriteUrls(root, location.href);
    highlightCode(root);

    setTocSpace(0);
    document.documentElement.removeAttribute('data-md-toc-open');
    if (currentSettings.showTOC) {
      const toc = buildTOC(root);
      if (toc) {
        document.body.appendChild(toc);
        activateTOC(toc, root);
        attachTocResizer(toc);
        addTocToggle();
        setTocOpen(currentSettings.tocOpen !== false, false);
      }
    }

    renderMermaid(root);
    renderKatex(root);

    mode = 'rendered';
    document.documentElement.setAttribute('data-md-rendered', '');
  }

  function renderRaw() {
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
    const pre = document.createElement('pre');
    pre.className = 'md-raw';
    pre.textContent = rawText;
    document.body.innerHTML = '';
    document.body.appendChild(pre);
    mode = 'raw';
  }

  function toggleView() {
    try {
      if (mode === 'rendered') renderRaw();
      else renderArticle();
    } catch (e) {
      errLog('toggle failed:', e);
      showBanner('Toggle failed — check console.');
    }
  }

  function showBanner(text) {
    const existing = document.querySelector('.md-error');
    if (existing) existing.remove();
    const b = document.createElement('div');
    b.className = 'md-error';
    b.textContent = text;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 3500);
  }

  async function boot() {
    try {
      const [raw, settings] = await Promise.all([getRaw(), getSettings()]);
      if (!raw || !raw.trim()) { warn('no content available'); return; }
      if (typeof marked === 'undefined') return errLog('marked missing');
      if (typeof DOMPurify === 'undefined') return errLog('DOMPurify missing');

      rawText = raw;
      currentSettings = settings;

      setFavicon();
      injectBaseStyles();
      applyTheme(settings.theme);
      applyLayout(settings);
      renderArticle();
      chrome.runtime.sendMessage({ type: 'DETECTED' }).catch(() => {});
      log('rendered, settings:', settings);

      chrome.storage.onChanged.addListener((changes) => {
        let reRender = false;
        for (const k of Object.keys(changes)) {
          const nv = changes[k].newValue;
          currentSettings[k] = nv;
          if (k === 'theme') applyTheme(nv);
          else if (k === 'maxWidth' || k === 'fontSize') applyLayout(currentSettings);
          else if (k === 'showTOC' || k === 'enableMermaid' || k === 'enableKatex') reRender = true;
          else if (k === 'tocWidth') {
            const t = document.querySelector('.md-toc');
            if (t && !t.classList.contains('resizing')) {
              const w = clampTocWidth(nv);
              t.style.width = w + 'px';
              if (document.documentElement.hasAttribute('data-md-toc-open')) setTocSpace(w);
            }
          }
          else if (k === 'tocOpen') {
            if (document.querySelector('.md-toc')) setTocOpen(!!nv, false);
          }
        }
        if (reRender && mode === 'rendered') renderArticle();
      });

      chrome.runtime.onMessage.addListener((msg) => {
        if (msg && msg.type === 'TOGGLE_VIEW') toggleView();
      });
    } catch (e) {
      errLog('boot failed:', e);
      showBanner('Markdown Viewer: render failed. Check console.');
    }
  }

  boot();
})();
