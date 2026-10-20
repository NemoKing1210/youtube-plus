import { registerFeature } from '../../core/features.js';
import { field } from '../../core/schema.js';
import {
  configureLocale,
  LOCALE_FLAGS,
  LOCALE_FLAG_AUTO,
  LOCALE_NATIVE_NAMES,
  SUPPORTED_LOCALES,
  t,
} from '../../i18n/index.js';

const TOAST_POSITIONS = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

function languageOptions() {
  return [
    { value: 'auto', label: `${LOCALE_FLAG_AUTO} ${t('general.languageAuto')}` },
    ...SUPPORTED_LOCALES.map((code) => ({
      value: code,
      label: `${LOCALE_FLAGS[code]} ${LOCALE_NATIVE_NAMES[code]}`,
    })),
  ];
}

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

  tabs: [
    {
      id: 'general',
      titleKey: 'general.title',
      sections: [
        {
          titleKey: 'general.section',
          controls: [
            {
              type: 'select',
              path: 'language',
              labelKey: 'general.language',
              options: () => languageOptions(),
            },
            {
              type: 'switch',
              path: 'navButton',
              labelKey: 'general.navButton',
              hintKey: 'general.navButtonHint',
            },
            {
              type: 'switch',
              path: 'hotkey',
              labelKey: 'general.hotkey',
              hintKey: 'general.hotkeyHint',
            },
            { type: 'switch', path: 'hotkeyHint', labelKey: 'general.guideTooltip' },
            { type: 'switch', path: 'toastsEnabled', labelKey: 'general.toastsEnabled' },
            {
              type: 'select',
              path: 'toastPosition',
              labelKey: 'general.toastPosition',
              options: TOAST_POSITIONS.map((position) => ({
                value: position,
                labelKey: `general.toastPosition.${position}`,
              })),
            },
            {
              type: 'number',
              path: 'toastDuration',
              labelKey: 'general.toastDuration',
              min: 0,
              max: 120,
              step: 1,
            },
          ],
        },
      ],
    },
  ],

  apply(cfg) {
    configureLocale(cfg.language);
  },
});
