import { DEFAULT_TOAST_POSITION } from '../core/constants.js';
import { getFeatureSettings } from '../core/settings.js';
import { t } from '../i18n/index.js';
import { el } from '../utils/dom.js';
import { iconNode } from './icons.js';

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
    host = el('div');
    host.id = HOST_ID;
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
  const host = ensureHost(config.toastPosition ?? DEFAULT_TOAST_POSITION);
  const node = el('div', `yp-toast yp-toast--${type}`);

  const iconWrap = el('span', 'yp-toast__icon');
  iconWrap.append(iconNode(type === 'success' ? 'check' : type));
  const body = el('div', 'yp-toast__body');
  if (type === 'error') body.setAttribute('role', 'alert');
  body.append(
    el('strong', 'yp-toast__title', title || t(`toast.title.${type}`)),
    el('p', 'yp-toast__message', message),
  );
  const close = el('button', 'yp-toast__close');
  close.type = 'button';
  close.setAttribute('aria-label', t('common.close'));
  close.append(iconNode('close', 16));
  node.append(iconWrap, body, close);

  let timer = 0;
  let leaving = false;
  let hovered = false;
  let focused = false;
  const pause = () => clearTimeout(timer);
  const dismiss = () => {
    if (leaving) return;
    leaving = true;
    pause();
    close.disabled = true;
    node.classList.add('is-leaving');
    setTimeout(() => node.remove(), 200);
  };
  const arm = () => {
    pause();
    if (!leaving && !hovered && !focused && seconds > 0) {
      timer = setTimeout(dismiss, seconds * 1000);
    }
  };
  node.addEventListener('mouseenter', () => {
    hovered = true;
    pause();
  });
  node.addEventListener('mouseleave', () => {
    hovered = false;
    arm();
  });
  close.addEventListener('focus', () => {
    focused = true;
    pause();
  });
  close.addEventListener('blur', () => {
    focused = false;
    arm();
  });
  close.addEventListener('click', dismiss);

  host.appendChild(node);
  arm();
  return { node, dismiss };
}
