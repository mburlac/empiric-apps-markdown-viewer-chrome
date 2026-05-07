(() => {
  const MD_SUFFIX = /\.(md|markdown|mdown|mkd|mdx)($|[?#])/i;
  if (MD_SUFFIX.test(location.pathname) || MD_SUFFIX.test(location.href)) {
    document.documentElement.setAttribute('data-md-detected', '');
  }
})();
