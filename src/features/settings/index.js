import { GM_registerMenuCommand } from '$';
import { registerFeature } from '../../core/features.js';
import { t } from '../../i18n/index.js';
import { openSettings } from './panel.js';

export { openSettings } from './panel.js';

/**
 * The settings UI itself is a feature: it owns no settings, but contributes
 * the userscript-manager menu command and (later tasks) the guide entry,
 * hotkey and Backup / About tabs.
 */
registerFeature({
  id: 'settings',
  order: 900,
  fields: {},
  tabs: [],

  init() {
    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand(t('menu.settings'), () => openSettings());
    }
  },
});
