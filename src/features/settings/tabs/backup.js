import { exportSettings, importSettings } from '../../../core/settings.js';
import { t } from '../../../i18n/index.js';
import { showToast } from '../../../ui/toast.js';
import { el } from '../../../utils/dom.js';

/** Backup tab: copy the settings JSON out, paste a backup in. */
export const backupTab = {
  id: 'backup',
  titleKey: 'backup.title',
  render(ctx) {
    const root = el('div', 'yp-tab');

    const exportSection = el('section', 'yp-section');
    exportSection.append(
      el('h3', 'yp-section__title', t('backup.exportTitle')),
      el('p', 'yp-section__desc', t('backup.exportHint')),
    );
    const exported = document.createElement('textarea');
    exported.className = 'yp-textarea';
    exported.readOnly = true;
    exported.spellcheck = false;
    exported.value = exportSettings();
    exported.rows = 8;
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'yp-btn-ui yp-btn-ui--primary';
    copy.textContent = t('backup.copy');
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(exportSettings());
        showToast(t('backup.copied'), { type: 'success' });
      } catch {
        exported.select();
        showToast(t('backup.copyFailed'), { type: 'warning' });
      }
    });
    const copyRow = el('div', 'yp-row yp-row--button');
    copyRow.append(copy);
    exportSection.append(exported, copyRow);

    const importSection = el('section', 'yp-section');
    importSection.append(
      el('h3', 'yp-section__title', t('backup.importTitle')),
      el('p', 'yp-section__desc', t('backup.importHint')),
    );
    const incoming = document.createElement('textarea');
    incoming.className = 'yp-textarea';
    incoming.spellcheck = false;
    incoming.placeholder = '{\n  "general": { … }\n}';
    incoming.rows = 8;
    const apply = document.createElement('button');
    apply.type = 'button';
    apply.className = 'yp-btn-ui yp-btn-ui--primary';
    apply.textContent = t('backup.importButton');
    apply.addEventListener('click', () => {
      try {
        importSettings(incoming.value);
        ctx.reloadDraft?.();
        showToast(t('backup.imported'), { type: 'success' });
      } catch {
        showToast(t('backup.invalid'), { type: 'error', force: true });
      }
    });
    const importRow = el('div', 'yp-row yp-row--button');
    importRow.append(apply);
    importSection.append(incoming, importRow);

    root.append(exportSection, importSection);
    return root;
  },
};
