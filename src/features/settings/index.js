import { GM_registerMenuCommand } from '$';
import { on } from '../../core/bus.js';
import { registerFeature } from '../../core/features.js';
import { t } from '../../i18n/index.js';
import { ensureNavButton, setNavButtonHandler } from './nav-button.js';
import { syncHotkey } from './hotkey.js';
import { openSettings } from './panel.js';
import { aboutTab } from './tabs/about.js';
import { backupTab } from './tabs/backup.js';

export { openSettings } from './panel.js';

/**
 * The settings UI itself is a feature: it owns no settings, but contributes
 * the Backup / About tabs, the userscript-manager menu command, the guide
 * entry and the Ctrl+M hotkey.
 */
registerFeature({
  id: 'settings',
  order: 900,
  fields: {},
  tabs: [backupTab, aboutTab],

  init() {
    setNavButtonHandler(() => openSettings());
    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand(t('menu.settings'), () => openSettings());
    }
    // Language, the guide entry and the hotkey live in the "general" section.
    on('settings:general', syncChrome);
    syncChrome();
  },

  scan() {
    ensureNavButton();
  },
});

function syncChrome() {
  ensureNavButton();
  syncHotkey();
}
