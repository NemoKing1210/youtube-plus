import { SCRIPT_NAME, SEL } from '../../core/constants.js';
import { getFeatureSettings } from '../../core/settings.js';
import { iconNode } from '../../ui/icons.js';
import { el } from '../../utils/dom.js';

const GUIDE_LIST = `${SEL.guide} ytd-guide-section-renderer #items`;
const NAV_ATTR = 'data-yp-nav';

let openHandler = () => {};

export function setNavButtonHandler(fn) {
  openHandler = fn;
}

function general() {
  try {
    return getFeatureSettings('general') || {};
  } catch {
    return {};
  }
}

function createButton() {
  const button = el('button', 'yp-guide-button');
  button.type = 'button';
  button.setAttribute(NAV_ATTR, '');
  button.setAttribute('aria-haspopup', 'dialog');
  button.append(iconNode('settings', 24), el('span', 'yp-guide-button__label', SCRIPT_NAME));
  button.addEventListener('click', () => openHandler());
  return button;
}

export function ensureNavButton() {
  const cfg = general();
  const list = cfg.navButton === false ? null : document.querySelector(GUIDE_LIST);
  const existing = [...document.querySelectorAll(`[${NAV_ATTR}]`)];
  const current = existing.find((node) => node.localName === 'button' && node.parentElement === list);
  for (const node of existing) {
    if (node !== current) node.remove();
  }
  if (!list) return;

  const button = current ?? createButton();
  const hint = cfg.hotkey !== false && cfg.hotkeyHint !== false;
  const title = hint ? `${SCRIPT_NAME} (Ctrl+M)` : SCRIPT_NAME;
  if (button.title !== title) button.title = title;
  if (!current) list.append(button);
}
