import { exportSettings, importSettings } from '../../../core/settings.js';
import { t } from '../../../i18n/index.js';
import { showToast } from '../../../ui/toast.js';
import { el } from '../../../utils/dom.js';
import { createButton, createButtonRow } from '../controls.js';
import { createSection } from '../renderer.js';

/** Backup tab: copy the settings JSON out, paste a backup in. */
export const backupTab = {
  id: 'backup',
  titleKey: 'backup.title',
  icon: 'download',
  render(ctx) {
    const root = el('div', 'yp-tab');

    const exportCard = createSection(t('backup.exportTitle'));
    exportCard.append(el('p', 'yp-card__desc', t('backup.exportHint')));
    const exported = document.createElement('textarea');
    exported.className = 'yp-textarea';
    exported.readOnly = true;
    exported.spellcheck = false;
    exported.value = exportSettings();
    exported.rows = 8;
    exported.setAttribute('aria-label', t('backup.exportTitle'));
    const exportedRow = el('div', 'yp-row yp-row--textarea');
    exportedRow.append(exported);
    const copy = createButton({
      label: t('backup.copy'),
      variant: 'primary',
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(exportSettings());
          showToast(t('backup.copied'), { type: 'success' });
        } catch {
          exported.select();
          showToast(t('backup.copyFailed'), { type: 'warning' });
        }
      },
    });
    exportCard.append(exportedRow, createButtonRow(copy));

    const importCard = createSection(t('backup.importTitle'));
    importCard.append(el('p', 'yp-card__desc', t('backup.importHint')));
    const incoming = document.createElement('textarea');
    incoming.className = 'yp-textarea';
    incoming.spellcheck = false;
    incoming.placeholder = '{\n  "general": { … }\n}';
    incoming.rows = 8;
    incoming.setAttribute('aria-label', t('backup.importTitle'));
    const incomingRow = el('div', 'yp-row yp-row--textarea');
    incomingRow.append(incoming);
    const apply = createButton({
      label: t('backup.importButton'),
      variant: 'primary',
      onClick: () => {
        try {
          importSettings(incoming.value);
          ctx.reloadDraft?.();
          showToast(t('backup.imported'), { type: 'success' });
        } catch {
          showToast(t('backup.invalid'), { type: 'error', force: true });
        }
      },
    });
    importCard.append(incomingRow, createButtonRow(apply));

    root.append(exportCard, importCard);
    return root;
  },
};
