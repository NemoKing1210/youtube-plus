import { t } from '../../i18n/index.js';
import { el } from '../../utils/dom.js';

/**
 * Small modal confirmation. Resolves `true` only when the user confirms.
 * @param {{ title: string, message: string, confirmLabel: string, danger?: boolean }} options
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title, message, confirmLabel, danger = false }) {
  return new Promise((resolve) => {
    const overlay = el('div', 'yp-confirm-overlay');
    overlay.setAttribute('role', 'presentation');

    const dialog = el('div', 'yp-confirm');
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.append(el('h3', 'yp-confirm__title', title), el('p', 'yp-confirm__text', message));

    const actions = el('div', 'yp-confirm__actions');
    const cancel = el('button', 'yp-btn-ui yp-btn-ui--tonal', t('common.cancel'));
    const confirm = el('button', `yp-btn-ui yp-btn-ui--${danger ? 'danger' : 'primary'}`, confirmLabel);
    cancel.type = 'button';
    confirm.type = 'button';
    actions.append(cancel, confirm);
    dialog.append(actions);
    overlay.append(dialog);
    (document.body || document.documentElement).append(overlay);

    const finish = (value) => {
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      resolve(value);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        finish(false);
      }
    };

    cancel.addEventListener('click', () => finish(false));
    confirm.addEventListener('click', () => finish(true));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) finish(false);
    });
    document.addEventListener('keydown', onKey, true);
    confirm.focus();
  });
}
