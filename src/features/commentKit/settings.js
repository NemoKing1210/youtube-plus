import { field } from '../../core/schema.js';

const THEMES = [
  { value: 'auto', labelKey: 'commentKit.themeAuto' },
  { value: 'light', labelKey: 'commentKit.themeLight' },
  { value: 'dark', labelKey: 'commentKit.themeDark' },
];

export function commentKitFields() {
  return {
    enabled: field.bool(false),
    theme: field.enum(THEMES.map(({ value }) => value), 'auto'),
    cache: field.bool(true),
    pageSize: field.int(50, { min: 10, max: 200 }),
    includeReplies: field.bool(true),
    timedComments: field.bool(true),
    heatmap: field.bool(true),
    transcripts: field.bool(true),
    liveChat: field.bool(true),
  };
}

export function commentKitTab() {
  const enabled = (section) => section.enabled === true;
  return {
    id: 'commentKit',
    titleKey: 'commentKit.title',
    icon: 'search',
    sections: [
      {
        titleKey: 'commentKit.panel',
        controls: [
          { type: 'switch', path: 'enabled', labelKey: 'commentKit.enabled', hintKey: 'commentKit.enabledHint' },
          { type: 'select', path: 'theme', labelKey: 'commentKit.theme', showIf: enabled, options: THEMES },
          { type: 'number', path: 'pageSize', labelKey: 'commentKit.pageSize', showIf: enabled, min: 10, max: 200 },
        ],
      },
      {
        titleKey: 'commentKit.comments',
        showIf: enabled,
        controls: [
          { type: 'switch', path: 'cache', labelKey: 'commentKit.cache', hintKey: 'commentKit.cacheHint' },
          { type: 'switch', path: 'includeReplies', labelKey: 'commentKit.includeReplies' },
          { type: 'switch', path: 'timedComments', labelKey: 'commentKit.timedComments' },
          { type: 'switch', path: 'heatmap', labelKey: 'commentKit.heatmap' },
        ],
      },
      {
        titleKey: 'commentKit.sources',
        showIf: enabled,
        controls: [
          { type: 'switch', path: 'transcripts', labelKey: 'commentKit.transcript' },
          { type: 'switch', path: 'liveChat', labelKey: 'commentKit.chat' },
        ],
      },
    ],
  };
}
