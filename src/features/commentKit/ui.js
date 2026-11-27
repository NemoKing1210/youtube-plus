import { t } from '../../i18n/index.js';
import { showToast } from '../../ui/toast.js';
import { el } from '../../utils/dom.js';
import { downloadExport } from './export.js';
import { timeLabel } from './parse.js';
import { seekTo } from './timestamps.js';

export function button(key, action, className = '') {
  const node = el('button', className, t(key));
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

export function labeled(key, node) {
  const label = el('label', 'yp-ck-field');
  label.append(el('span', '', t(key)), node);
  return label;
}

export function input(key, type, options = {}) {
  const node = el('input');
  node.type = type;
  for (const [name, value] of Object.entries(options)) node[name] = value;
  const label = labeled(key, node);
  if (type === 'checkbox') label.classList.add('yp-ck-check');
  return { label, node };
}

export function select(key, options) {
  const node = el('select');
  for (const [value, title] of options) {
    const option = el('option', '', t(title));
    option.value = value;
    node.append(option);
  }
  return { label: labeled(key, node), node };
}

export function pager(change) {
  let index = 0;
  const previous = button('commentKit.previous', () => change(index - 1));
  const next = button('commentKit.next', () => change(index + 1));
  const label = el('span');
  const node = el('div', 'yp-ck-pager');
  node.append(previous, label, next);
  return {
    node,
    update(page, pages) {
      index = page;
      previous.disabled = page <= 0;
      next.disabled = page >= pages - 1;
      label.textContent = t('commentKit.page', { page: page + 1, pages });
      node.hidden = pages <= 1;
    },
  };
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(t('commentKit.copied'), { type: 'success' });
  } catch {
    showToast(t('commentKit.copyFailed'), { type: 'error' });
  }
}

export function seekButton(page, seconds, label = timeLabel(seconds)) {
  const node = el('button', 'yp-ck-time', label);
  node.type = 'button';
  node.setAttribute('aria-label', t('commentKit.seek', { time: label }));
  node.addEventListener('click', () => {
    if (!seekTo(page, seconds)) showToast(t('commentKit.seekFailed'), { type: 'error' });
  });
  return node;
}

export function exportControls(source, id, getItems) {
  const details = el('details', 'yp-ck-export');
  const controls = el('div', 'yp-ck-controls');
  const all = input('commentKit.exportAll', 'checkbox');
  const anchor = el('a');
  anchor.hidden = true;
  for (const format of ['csv', 'json', 'txt']) {
    const action = el('button', '', format.toUpperCase());
    action.type = 'button';
    action.addEventListener('click', () => {
      const items = getItems(all.node.checked);
      if (!items.length) {
        showToast(t('commentKit.noExport'), { type: 'info' });
        return;
      }
      try {
        downloadExport(anchor, items, source, id, format);
      } catch {
        showToast(t('commentKit.exportFailed'), { type: 'error' });
      }
    });
    controls.append(action);
  }
  details.append(el('summary', '', t('commentKit.export')), all.label, controls, anchor);
  return details;
}
