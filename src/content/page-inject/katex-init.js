(() => {
  if (!window.renderMathInElement) { console.error('[md-viewer/katex] library not on window'); return; }
  const el = document.querySelector('.md-root');
  if (!el) return;
  try {
    window.renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false,
      errorColor: '#b42318'
    });
    console.log('[md-viewer/katex] rendered');
  } catch (e) {
    console.error('[md-viewer/katex] failed:', e && e.message, e);
  }
})();
