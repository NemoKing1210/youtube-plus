import { SCRIPT_NAME } from '../../core/constants.js';
import { getFeatureSettings } from '../../core/settings.js';
import { icon } from '../../ui/icons.js';

/**
 * Adds a "YouTube Plus" row to the left guide by cloning a native entry, so
 * typography, spacing and hover chrome match. Re-inserted idempotently: the
 * guide is rebuilt on navigation and on late content updates.
 */

const NAV_ATTR = 'data-yp-nav';
const ROW_ATTR = 'data-yp-ui';

let openHandler = () => {};
export function setNavButtonHandler(fn) {
  openHandler = fn;
}

function guideList() {
  return document.querySelector('ytd-guide-renderer ytd-guide-section-renderer #items');
}

function general() {
  try {
    return getFeatureSettings('general') || {};
  } catch {
    return {};
  }
}

function applyLabel(row) {
  const anchor = row.querySelector('a') || row;
  anchor.setAttribute('title', SCRIPT_NAME);
  anchor.setAttribute('aria-label', SCRIPT_NAME);

  const labelNode =
    anchor.querySelector('.title') ||
    [...anchor.querySelectorAll('*')]
      .filter((node) => node.children.length === 0 && node.textContent.trim())
      .pop();
  if (labelNode) labelNode.textContent = SCRIPT_NAME;
  else anchor.append(document.createTextNode(SCRIPT_NAME));

  const iconNode = anchor.querySelector('.icon, yt-icon, svg');
  if (iconNode) iconNode.innerHTML = icon('settings', 24);

  const cfg = general();
  const hint = cfg.hotkey !== false && cfg.hotkeyHint !== false;
  anchor.title = hint ? `${SCRIPT_NAME} (Ctrl+M)` : SCRIPT_NAME;
}

function wire(row) {
  row.setAttribute(NAV_ATTR, '');
  row.setAttribute(ROW_ATTR, '');
  row.removeAttribute('is-primary');
  row.removeAttribute('aria-current');
  row.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));

  const anchor = row.querySelector('a') || row;
  anchor.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      openHandler();
    },
    true,
  );
}

export function ensureNavButton() {
  const cfg = general();
  const existing = [...document.querySelectorAll(`[${NAV_ATTR}]`)];

  if (cfg.navButton === false) {
    existing.forEach((row) => row.remove());
    return;
  }

  if (existing.length) {
    existing.slice(1).forEach((row) => row.remove());
    applyLabel(existing[0]);
    return;
  }

  const list = guideList();
  if (!list) return; // retried on the next scan
  const template = list.querySelector('ytd-guide-entry-renderer');
  if (!template) return;

  const row = template.cloneNode(true);
  wire(row);
  applyLabel(row);
  list.append(row);
}
