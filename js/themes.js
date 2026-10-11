// Themes. A theme sets the colors of the app and of the drawing (see css/themes.css).
// The choice is kept in this browser. It is not part of the project file.

export const THEMES = [
  { code: 'system', name: 'Same as this device', group: 'OpenWire', swatch: ['#ffffff', '#161d24', '#f2c12e'] },
  { code: 'light', name: 'OpenWire Light', group: 'OpenWire', swatch: ['#ffffff', '#26323f', '#f2c12e'] },
  { code: 'dark', name: 'OpenWire Dark', group: 'OpenWire', swatch: ['#161d24', '#1f2830', '#f2c12e'] },
  { code: 'latte', name: 'Latte', group: 'Catppuccin', swatch: ['#e6e9ef', '#4c4f69', '#8839ef'] },
  { code: 'frappe', name: 'Frappé', group: 'Catppuccin', swatch: ['#303446', '#414559', '#ca9ee6'] },
  { code: 'macchiato', name: 'Macchiato', group: 'Catppuccin', swatch: ['#24273a', '#363a4f', '#c6a0f6'] },
  { code: 'mocha', name: 'Mocha', group: 'Catppuccin', swatch: ['#1e1e2e', '#313244', '#cba6f7'] },
  { code: 'vscode-dark', name: 'Dark Modern', group: 'VS Code', swatch: ['#1f1f1f', '#252526', '#0078d4'] },
  { code: 'vscode-darkplus', name: 'Dark+', group: 'VS Code', swatch: ['#1e1e1e', '#252526', '#007acc'] },
  { code: 'vscode-light', name: 'Light Modern', group: 'VS Code', swatch: ['#ffffff', '#3b3b3b', '#005fb8'] },
];

const KEY = 'openwire.theme';
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

export function savedTheme() {
  try {
    const code = localStorage.getItem(KEY);
    return THEMES.some((t) => t.code === code) ? code : 'system';
  } catch {
    return 'system';
  }
}

let current = savedTheme();

function resolve(code) {
  if (code === 'system') return darkQuery.matches ? 'dark' : 'light';
  return code;
}

export function applyTheme(code = current) {
  current = THEMES.some((t) => t.code === code) ? code : 'system';
  const root = document.documentElement;
  const resolved = resolve(current);
  if (resolved === 'light') delete root.dataset.theme;
  else root.dataset.theme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue('--chrome').trim() || '#f5f7f9';
  for (const item of document.querySelectorAll('[data-theme-code]')) {
    item.setAttribute('aria-checked', String(item.dataset.themeCode === current));
  }
}

export function setTheme(code) {
  applyTheme(code);
  try {
    localStorage.setItem(KEY, current);
  } catch {
    /* This browser does not keep settings. The theme is used until the page closes. */
  }
}

export function themeName(code = current) {
  const t = THEMES.find((x) => x.code === code);
  return t ? (t.group === 'OpenWire' ? t.name : `${t.group} ${t.name}`) : '';
}

// Fills the theme menu. Each item runs the 'theme' command in app.js.
export function buildThemeMenu(list) {
  let group = '';
  const parts = [];
  for (const t of THEMES) {
    if (t.group !== group) {
      group = t.group;
      parts.push(`<p class="menu-group" role="presentation">${group}</p>`);
    }
    const dots = t.swatch.map((c) => `<span style="background:${c}"></span>`).join('');
    parts.push(`<button type="button" role="menuitemradio" aria-checked="false" data-cmd="theme" data-theme-code="${t.code}">
      <span class="theme-dots" aria-hidden="true">${dots}</span><span class="theme-name">${t.name}</span></button>`);
  }
  list.innerHTML = parts.join('');
  applyTheme();
}

darkQuery.addEventListener?.('change', () => {
  if (current === 'system') applyTheme();
});
