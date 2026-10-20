import { UI_ATTR } from '../core/constants.js';
import { getFeatureSettings } from '../core/settings.js';
import { t } from '../i18n/index.js';
import { el } from '../utils/dom.js';
import { escapeAttr } from '../utils/html.js';
import { icon } from './icons.js';

const HOST_ID = 'yp-toast-host';

function general() {
  try {
    return getFeatureSettings('general') || {};
  } catch {
    return {};
  }
}

function ensureHost(position) {
  let host = document.getElementById(HOST_ID);
  if (!host?.isConnected) {
    host = document.createElement('div');
    host.id = HOST_ID;
    host.setAttribute(UI_ATTR, '');
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-relevant', 'additions');
    (document.body || document.documentElement).appendChild(host);
  }
  host.className = `yp-toast-host yp-toast-host--${position}`;
  return host;
}

/**
 * @param {string} message
 * @param {{ type?: 'info'|'success'|'warning'|'error', title?: string, duration?: number, force?: boolean }} [options]
 */
export function showToast(message, { type = 'info', title, duration, force = false } = {}) {
  const config = general();
  if (!force && config.toastsEnabled === false) return null;

  const seconds = duration ?? config.toastDuration ?? 5;
  const host = ensureHost(config.toastPosition || 'top-right');
  const node = el('div', `yp-toast yp-toast--${type}`);
  node.setAttribute('role', type === 'error' ? 'alert' : 'status');
  node.innerHTML = `<span class="yp-toast__icon">${icon(
    type === 'success' ? 'check' : type,
  )}</span><div class="yp-toast__body"><strong class="yp-toast__title">${escapeAttr(
    title || t(`toast.title.${type}`),
  )}</strong><p class="yp-toast__message">${escapeAttr(message)}</p></div>`;

  let timer = 0;
  const dismiss = () => {
    clearTimeout(timer);
    node.classList.add('is-leaving');
    setTimeout(() => node.remove(), 200);
  };
  const arm = () => {
    clearTimeout(timer);
    if (seconds > 0) timer = setTimeout(dismiss, seconds * 1000);
  };
  node.addEventListener('mouseenter', () => clearTimeout(timer));
  node.addEventListener('mouseleave', arm);

  host.appendChild(node);
  arm();
  return { node, dismiss };
}
