const FAVICON = {
  light: '/icons/favicon-light.png',
  dark: '/icons/favicon-dark.png',
};

const THEME_COLOR = {
  light: '#f4f4f5',
  dark: '#1a1a1a',
};

function setLink(rel, href, extra = {}) {
  const selector = `link[rel="${rel}"][data-carvio-brand]`;
  let link = document.querySelector(selector);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    link.setAttribute('data-carvio-brand', '');
    document.head.appendChild(link);
  }
  link.href = href;
  Object.entries(extra).forEach(([key, value]) => {
    link.setAttribute(key, value);
  });
}

export function syncBrandAssets(theme) {
  const favicon = theme === 'dark' ? FAVICON.dark : FAVICON.light;
  setLink('icon', favicon, { type: 'image/png', sizes: '32x32' });

  const themeColor = theme === 'dark' ? THEME_COLOR.dark : THEME_COLOR.light;
  let meta = document.querySelector('meta[name="theme-color"][data-carvio-brand]');
  if (!meta) {
    meta = document.querySelector('meta[name="theme-color"]') || document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('data-carvio-brand', '');
    if (!meta.parentNode) document.head.appendChild(meta);
  }
  meta.content = themeColor;
}
