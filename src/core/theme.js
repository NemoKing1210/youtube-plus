import { THEME_ATTR } from './constants.js';

/**
 * YouTube sets `dark` on <html> in dark mode and removes it in light mode.
 * Mirror that into data-yp-theme for our UI. Background luminance is a
 * fallback in case the attribute is renamed; a transparent root falls back
 * to <body>, and a fully transparent page is treated as light.
 */

function backgroundColor(element) {
  if (!element) return null;
  const background = getComputedStyle(element).backgroundColor;
  const match = background.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?/i);
  if (!match) return null;
  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  if (alpha === 0) return null;
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
}

function luminance({ r, g, b }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** @returns {'light'|'dark'} */
export function detectTheme() {
  const root = document.documentElement;
  if (root.hasAttribute('dark')) return 'dark';

  const color = backgroundColor(root) || backgroundColor(document.body);
  if (!color) return 'light';
  return luminance(color) < 0.4 ? 'dark' : 'light';
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
