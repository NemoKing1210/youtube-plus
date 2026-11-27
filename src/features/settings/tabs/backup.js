import { Codes, logError } from '../../../core/debug.js';
import { exportSettings, importSettings } from '../../../core/settings.js';
import { t } from '../../../i18n/index.js';
import { showToast } from '../../../ui/toast.js';
import { el } from '../../../utils/dom.js';
import { downloadText } from '../../../utils/download.js';
import { createButton, createButtonRow } from '../controls.js';
import { createSection } from '../renderer.js';

/** Backup tab: transfer saved settings as text or a local JSON file. */
export const backupTab = {
  id: 'backup',
  titleKey: 'backup.title',
  icon: 'download',
  render(ctx) {
    const root = el('div', 'yp-tab');

    const exportCard = createSection(t('backup.exportTitle'));
    exportCard.append(el('p', 'yp-card__desc', t('backup.exportHint')));
    const exported = el('textarea', 'yp-textarea');
    exported.readOnly = true;
    exported.spellcheck = false;
    exported.value = exportSettings();
    exported.rows = 8;
    exported.setAttribute('aria-label', t('backup.exportTitle'));
    const exportedRow = el('div', 'yp-row yp-row--textarea');
    exportedRow.append(exported);
    const anchor = el('a');
    anchor.hidden = true;
    const download = createButton({
      label: t('backup.download'),
      variant: 'primary',
      onClick: () => {
        try {
          downloadText(anchor, 'youtube-plus-settings.json', exportSettings(), 'application/json');
        } catch (error) {
          logError(Codes.SETTINGS_EXPORT, 'could not start settings backup download', { error });
          showToast(t('backup.downloadFailed'), { type: 'error', force: true });
        }
      },
    });
    const copy = createButton({
      label: t('backup.copy'),
      variant: 'tonal',
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
    exportCard.append(createButtonRow(download, copy), exportedRow, anchor);

    const importCard = createSection(t('backup.importTitle'));
    importCard.append(el('p', 'yp-card__desc', t('backup.importHint')));
    const incoming = el('textarea', 'yp-textarea');
    incoming.spellcheck = false;
    incoming.placeholder = '{\n  "general": { … }\n}';
    incoming.rows = 8;
    incoming.setAttribute('aria-label', t('backup.importTitle'));
    const incomingRow = el('div', 'yp-row yp-row--textarea');
    incomingRow.append(incoming);
    const fileInput = el('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.hidden = true;
    let importRevision = 0;

    function applyBackup(json) {
      try {
        importSettings(json);
      } catch {
        showToast(t('backup.invalid'), { type: 'error', force: true });
        return;
      }
      ctx.reloadDraft?.();
      showToast(t('backup.imported'), { type: 'success' });
    }

    const canApply = (revision) =>
      revision === importRevision && root.isConnected && ctx.isDialogOpen();

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      fileInput.value = '';
      const revision = ++importRevision;
      let json;
      try {
        json = await file.text();
      } catch (error) {
        if (canApply(revision)) {
          logError(Codes.SETTINGS_IMPORT, 'could not read settings backup file', { error });
          showToast(t('backup.readFailed'), { type: 'error', force: true });
        }
        return;
      }
      if (canApply(revision)) applyBackup(json);
    });

    const choose = createButton({
      label: t('backup.importFile'),
      variant: 'primary',
      onClick: () => fileInput.click(),
    });
    const apply = createButton({
      label: t('backup.importButton'),
      variant: 'tonal',
      onClick: () => {
        importRevision += 1;
        applyBackup(incoming.value);
      },
    });
    importCard.append(incomingRow, createButtonRow(choose, apply), fileInput);

    root.append(exportCard, importCard);
    return root;
  },
};
