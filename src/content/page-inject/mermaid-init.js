(async () => {
  if (!window.mermaid) { console.error('[md-viewer/mermaid] library not on window'); return; }
  const theme = document.documentElement.getAttribute('data-md-mermaid-theme') || 'default';
  try {
    window.mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: 'loose',
      flowchart: { htmlLabels: true, curve: 'basis', useMaxWidth: true },
      er: { useMaxWidth: true },
      sequence: { useMaxWidth: true },
      gantt: { useMaxWidth: false, leftPadding: 120, barHeight: 22, fontSize: 12 },
      timeline: { useMaxWidth: false },
      gitGraph: { useMaxWidth: true },
      pie: { useMaxWidth: true }
    });
    const nodes = document.querySelectorAll('.mermaid:not([data-processed])');
    console.log('[md-viewer/mermaid] rendering', nodes.length, 'diagrams, theme:', theme);
    if (typeof window.mermaid.run === 'function') {
      await window.mermaid.run({ nodes });
    } else if (typeof window.mermaid.init === 'function') {
      window.mermaid.init(undefined, nodes);
    } else {
      console.error('[md-viewer/mermaid] no run/init method');
    }
    console.log('[md-viewer/mermaid] done');
  } catch (e) {
    console.error('[md-viewer/mermaid] render failed:', e && e.message, e);
  }
})();
