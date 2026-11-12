import {
  LOCALE_FLAGS,
  LOCALE_FLAG_AUTO,
  LOCALE_NATIVE_NAMES,
  SUPPORTED_LOCALES,
  t,
} from '../../i18n/index.js';

export const TOAST_POSITIONS = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

function languageOptions() {
  return [
    { value: 'auto', label: `${LOCALE_FLAG_AUTO} ${t('general.languageAuto')}` },
    ...SUPPORTED_LOCALES.map((code) => ({
      value: code,
      label: `${LOCALE_FLAGS[code]} ${LOCALE_NATIVE_NAMES[code]}`,
    })),
  ];
}

/** General tab: language and menu, shortcuts, notifications. */
export function generalTab() {
  return {
    id: 'general',
    titleKey: 'general.title',
    icon: 'settings',
    sections: [
      {
        titleKey: 'general.section',
        descKey: 'general.sectionDesc',
        controls: [
          {
            type: 'select',
            path: 'language',
            labelKey: 'general.language',
            hintKey: 'general.languageHint',
            options: () => languageOptions(),
          },
          {
            type: 'switch',
            path: 'navButton',
            labelKey: 'general.navButton',
            hintKey: 'general.navButtonHint',
          },
        ],
      },
      {
        titleKey: 'general.section.keys',
        descKey: 'general.section.keysDesc',
        controls: [
          {
            type: 'switch',
            path: 'hotkey',
            labelKey: 'general.hotkey',
            hintKey: 'general.hotkeyHint',
          },
          {
            type: 'switch',
            path: 'hotkeyHint',
            labelKey: 'general.guideTooltip',
            hintKey: 'general.guideTooltipHint',
          },
        ],
      },
      {
        titleKey: 'general.section.toasts',
        descKey: 'general.section.toastsDesc',
        controls: [
          {
            type: 'switch',
            path: 'toastsEnabled',
            labelKey: 'general.toastsEnabled',
            hintKey: 'general.toastsEnabledHint',
          },
          {
            type: 'select',
            path: 'toastPosition',
            labelKey: 'general.toastPosition',
            hintKey: 'general.toastPositionHint',
            showIf: (section) => section.toastsEnabled === true,
            options: TOAST_POSITIONS.map((position) => ({
              value: position,
              labelKey: `general.toastPosition.${position}`,
            })),
          },
          {
            type: 'number',
            path: 'toastDuration',
            labelKey: 'general.toastDuration',
            hintKey: 'general.toastDurationHint',
            min: 0,
            max: 120,
            step: 1,
            showIf: (section) => section.toastsEnabled === true,
          },
        ],
      },
    ],
  };
}
