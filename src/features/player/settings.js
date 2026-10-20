import { field } from '../../core/schema.js';
import { t } from '../../i18n/index.js';

export const SPEEDS = ['0.25', '0.5', '0.75', '1', '1.25', '1.5', '1.75', '2'];
export const QUALITIES = ['auto', '1080', '720', '480', '360', '240'];

export function playerFields() {
  return {
    enabled: field.bool(true),
    speed: field.enum(SPEEDS, '1'),
    quality: field.enum(QUALITIES, 'auto'),
    resume: field.bool(false),
    pip: field.bool(true),
    hotkeys: field.bool(true),
  };
}

export function playerTab() {
  return {
    id: 'player',
    titleKey: 'player.title',
    sections: [
      {
        titleKey: 'player.section',
        controls: [
          { type: 'switch', path: 'enabled', labelKey: 'player.enabled' },
          {
            type: 'select',
            path: 'speed',
            labelKey: 'player.speed',
            showIf: (section) => section.enabled === true,
            options: SPEEDS.map((value) => ({ value, label: `${value}×` })),
          },
          {
            type: 'select',
            path: 'quality',
            labelKey: 'player.quality',
            showIf: (section) => section.enabled === true,
            options: () =>
              QUALITIES.map((value) => ({
                value,
                label: value === 'auto' ? t('player.qualityAuto') : `${value}p`,
              })),
          },
          {
            type: 'switch',
            path: 'resume',
            labelKey: 'player.resume',
            hintKey: 'player.resumeHint',
            showIf: (section) => section.enabled === true,
          },
          {
            type: 'switch',
            path: 'pip',
            labelKey: 'player.pip',
            hintKey: 'player.pipHint',
            showIf: (section) => section.enabled === true,
          },
          {
            type: 'switch',
            path: 'hotkeys',
            labelKey: 'player.hotkeys',
            hintKey: 'player.hotkeysHint',
            showIf: (section) => section.enabled === true,
          },
        ],
      },
    ],
  };
}
