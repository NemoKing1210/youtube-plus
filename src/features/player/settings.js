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
  const showPlayer = (section) => section.enabled === true;
  const showVolume = (section) => showPlayer(section) && section.volumeEnabled === true;

  return {
    id: 'player',
    titleKey: 'player.title',
    icon: 'play',
    sections: [
      {
        titleKey: 'player.section',
        descKey: 'player.sectionDesc',
        controls: [
          {
            type: 'switch',
            path: 'enabled',
            labelKey: 'player.enabled',
            hintKey: 'player.enabledHint',
          },
          {
            type: 'select',
            path: 'speed',
            labelKey: 'player.speed',
            hintKey: 'player.speedHint',
            showIf: showPlayer,
            options: SPEEDS.map((value) => ({ value, label: `${value}×` })),
          },
          {
            type: 'select',
            path: 'quality',
            labelKey: 'player.quality',
            hintKey: 'player.qualityHint',
            showIf: showPlayer,
            options: () =>
              QUALITIES.map((value) => ({
                value,
                label:
                  value === 'auto'
                    ? t('player.qualityAuto')
                    : (QUALITY_LABELS[value] ?? `${value}p`),
              })),
          },
        ],
      },
      {
        titleKey: 'player.section.sound',
        descKey: 'player.section.soundDesc',
        showIf: showPlayer,
        controls: [
          {
            type: 'switch',
            path: 'volumeEnabled',
            labelKey: 'player.volumeEnabled',
            hintKey: 'player.volumeEnabledHint',
          },
          {
            type: 'number',
            path: 'volume',
            labelKey: 'player.volume',
            min: 0,
            max: 100,
            step: 1,
            showIf: showVolume,
          },
          {
            type: 'switch',
            path: 'rememberVolume',
            labelKey: 'player.rememberVolume',
            hintKey: 'player.volumeHint',
            showIf: showVolume,
          },
        ],
      },
      {
        titleKey: 'player.section.behavior',
        descKey: 'player.section.behaviorDesc',
        showIf: showPlayer,
        controls: [
          {
            type: 'switch',
            path: 'loop',
            labelKey: 'player.loop',
            hintKey: 'player.loopHint',
          },
          {
            type: 'switch',
            path: 'resume',
            labelKey: 'player.resume',
            hintKey: 'player.resumeHint',
          },
          {
            type: 'switch',
            path: 'pip',
            labelKey: 'player.pip',
            hintKey: 'player.pipHint',
          },
        ],
      },
      {
        titleKey: 'player.section.keys',
        descKey: 'player.section.keysDesc',
        showIf: showPlayer,
        controls: [
          {
            type: 'switch',
            path: 'hotkeys',
            labelKey: 'player.hotkeys',
            hintKey: 'player.hotkeysHint',
          },
        ],
      },
    ],
  };
}
