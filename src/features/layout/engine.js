import { Codes, logError } from '../../core/debug.js';
import { debounce } from '../../utils/dom.js';
import { ensureStyle } from '../../utils/style.js';
import { buildLayoutCss, computeColumns, PAGE_SELECTORS } from './grid.js';

/**
 * Applies the layout preferences as one generated stylesheet. The stylesheet
 * scales the rich grid to a target thumbnail width and hides card extras; it
 * is rewritten on apply, DOM scans, navigation and window resize, and cleared
 * when the feature is disabled.
 */

const STYLE_ID = 'yp-layout-style';
let cfg = null;
let bound = false;

const scheduleRender = debounce(render, 150);

function widthOf(page) {
  const node = document.querySelector(PAGE_SELECTORS[page]);
  return node?.clientWidth || window.innerWidth;
}

function render() {
  try {
    const style = ensureStyle(STYLE_ID);
    if (!cfg?.enabled) {
      if (style.textContent) style.textContent = '';
      return;
    }
    const widths = {
      home: widthOf('home'),
      subscriptions: widthOf('subscriptions'),
      channel: widthOf('channel'),
    };
    const css = buildLayoutCss(cfg, computeColumns(cfg, widths));
    if (style.textContent !== css) style.textContent = css;
  } catch (error) {
    logError(Codes.LAYOUT_APPLY, 'layout render failed', { error });
  }
}

export function applyLayout(next) {
  cfg = next;
  if (cfg?.enabled && !bound) {
    window.addEventListener('resize', scheduleRender);
    bound = true;
  }
  if (!cfg?.enabled && bound) {
    window.removeEventListener('resize', scheduleRender);
    bound = false;
  }
  render();
}

export function layoutScan() {
  if (cfg?.enabled) scheduleRender();
}

export function layoutNavigate() {
  if (cfg?.enabled) scheduleRender();
}
