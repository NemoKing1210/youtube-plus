import { THEME_ATTR } from './constants.js';

/**
 * YouTube sets `dark` on <html> in dark mode and removes it in light mode.
 * Mirror that into data-yp-theme for our UI. Background luminance is a
 * fallback in case the attribute is renamed.
 */

/** @returns {'light'|'dark'} */
export function detectTheme() {
  const root = document.documentElement;
  if (root.hasAttribute('dark')) return 'dark';
  const background = getComputedStyle(root).backgroundColor;
  const rgb = background.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!rgb) return 'light';
  const luminance =
    (0.2126 * Number(rgb[1]) + 0.7152 * Number(rgb[2]) + 0.0722 * Number(rgb[3])) / 255;
  return luminance < 0.4 ? 'dark' : 'light';
}

/** @param {'light'|'dark'} [theme] */
export function applyTheme(theme = detectTheme()) {
  const next = theme === 'dark' ? 'dark' : 'light';
  if (document.documentElement.getAttribute(THEME_ATTR) !== next) {
    document.documentElement.setAttribute(THEME_ATTR, next);
  }
  return next;
}

/** Watch theme flips on <html>. Returns a disconnect function. */
export function observeTheme(onChange) {
  let last = applyTheme();
  onChange?.(last);

  const run = () => {
    const next = applyTheme();
    if (next !== last) {
      last = next;
      onChange?.(next);
    }
  };

  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['dark', 'class', 'style'],
  });

  return () => observer.disconnect();
}
