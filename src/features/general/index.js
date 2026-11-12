import { registerFeature } from '../../core/features.js';
import { field } from '../../core/schema.js';
import { configureLocale, SUPPORTED_LOCALES, t } from '../../i18n/index.js';
import { generalTab, TOAST_POSITIONS } from './settings.js';

/** Script-wide settings: UI language, guide entry, hotkey and toasts. */
registerFeature({
  id: 'general',
  order: 0,

  fields: {
    language: field.enum(['auto', ...SUPPORTED_LOCALES], 'auto'),
    navButton: field.bool(true),
    hotkey: field.bool(true),
    hotkeyHint: field.bool(true),
    toastsEnabled: field.bool(true),
    toastPosition: field.enum(TOAST_POSITIONS, 'top-right'),
    toastDuration: field.int(5, { min: 0, max: 120 }),
  },

  tabs: [generalTab()],

  apply(cfg) {
    configureLocale(cfg.language);
  },
});
