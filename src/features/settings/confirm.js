import { t } from '../../i18n/index.js';
import { el } from '../../utils/dom.js';

/**
 * Small modal confirmation. Resolves `true` only when the user confirms.
 * @param {{ title: string, message: string, confirmLabel: string, danger?: boolean }} options
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title, message, confirmLabel, danger = false }) {
  return new Promise((resolve) => {
    const previousFocus = document.activeElement;
    const overlay = el('div', 'yp-confirm-overlay');
    overlay.setAttribute('role', 'presentation');

    const dialog = el('div', 'yp-confirm');
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-modal', 'true');
    const heading = el('h3', 'yp-confirm__title', title);
    heading.id = 'yp-confirm-title';
    const description = el('p', 'yp-confirm__text', message);
    description.id = 'yp-confirm-description';
    dialog.setAttribute('aria-labelledby', heading.id);
    dialog.setAttribute('aria-describedby', description.id);
    dialog.append(heading, description);

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
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      resolve(value);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        finish(false);
      } else if (event.key === 'Tab') {
        event.preventDefault();
        (document.activeElement === cancel ? confirm : cancel).focus();
      }
    };

    cancel.addEventListener('click', () => finish(false));
    confirm.addEventListener('click', () => finish(true));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) finish(false);
    });
    document.addEventListener('keydown', onKey, true);
    cancel.focus();
  });
}
