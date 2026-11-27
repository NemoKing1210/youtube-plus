import { field } from '../../core/schema.js';

export function shortsFields() {
  return {
    enabled: field.bool(false),
    autoScroll: field.bool(true),
    scrollDelay: field.int(1, { min: 0, max: 10 }),
    skipLong: field.bool(true),
    maxDuration: field.int(60, { min: 5, max: 600 }),
  };
}

export function shortsTab() {
  const showShorts = (section) => section.enabled === true;
  const showDelay = (section) => showShorts(section) && (section.autoScroll || section.skipLong);
  const showLimit = (section) => showShorts(section) && section.skipLong === true;
  const { scrollDelay, maxDuration } = shortsFields();

  return {
    id: 'shorts',
    titleKey: 'shorts.title',
    icon: 'chevronDown',
    sections: [
      {
        titleKey: 'shorts.section.autoScroll',
        controls: [
          {
            type: 'switch',
            path: 'enabled',
            labelKey: 'shorts.enabled',
            hintKey: 'shorts.enabledHint',
          },
          {
            type: 'switch',
            path: 'autoScroll',
            labelKey: 'shorts.autoScroll',
            hintKey: 'shorts.autoScrollHint',
            showIf: showShorts,
          },
          {
            type: 'number',
            path: 'scrollDelay',
            labelKey: 'shorts.scrollDelay',
            hintKey: 'shorts.scrollDelayHint',
            min: scrollDelay.min,
            max: scrollDelay.max,
            step: 1,
            showIf: showDelay,
          },
        ],
      },
      {
        titleKey: 'shorts.section.longVideos',
        showIf: showShorts,
        controls: [
          {
            type: 'switch',
            path: 'skipLong',
            labelKey: 'shorts.skipLong',
            hintKey: 'shorts.skipLongHint',
          },
          {
            type: 'number',
            path: 'maxDuration',
            labelKey: 'shorts.maxDuration',
            min: maxDuration.min,
            max: maxDuration.max,
            step: 1,
            showIf: showLimit,
          },
        ],
      },
    ],
  };
}
