import { field } from '../../core/schema.js';
import { t } from '../../i18n/index.js';

export const SPEEDS = ['0.25', '0.5', '0.75', '1', '1.25', '1.5', '1.75', '2'];
export const QUALITIES = ['auto', '4320', '2160', '1440', '1080', '720', '480', '360', '240', '144'];
const QUALITY_LABELS = { 4320: '4320p (8K)', 2160: '2160p (4K)' };

export function playerFields() {
  return {
    enabled: field.bool(true),
    speed: field.enum(SPEEDS, '1'),
    quality: field.enum(QUALITIES, 'auto'),
    volumeEnabled: field.bool(false),
    volume: field.int(70, { min: 0, max: 100 }),
    rememberVolume: field.bool(true),
    loop: field.bool(false),
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
                label:
                  value === 'auto'
                    ? t('player.qualityAuto')
                    : (QUALITY_LABELS[value] ?? `${value}p`),
              })),
          },
          {
            type: 'switch',
            path: 'volumeEnabled',
            labelKey: 'player.volumeEnabled',
            showIf: (section) => section.enabled === true,
          },
          {
            type: 'number',
            path: 'volume',
            labelKey: 'player.volume',
            min: 0,
            max: 100,
            step: 1,
            showIf: (section) => section.enabled === true && section.volumeEnabled === true,
          },
          {
            type: 'switch',
            path: 'rememberVolume',
            labelKey: 'player.rememberVolume',
            hintKey: 'player.volumeHint',
            showIf: (section) => section.enabled === true && section.volumeEnabled === true,
          },
          {
            type: 'switch',
            path: 'loop',
            labelKey: 'player.loop',
            hintKey: 'player.loopHint',
            showIf: (section) => section.enabled === true,
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
