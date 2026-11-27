import { field } from '../../core/schema.js';
import { t } from '../../i18n/index.js';
import { el } from '../../utils/dom.js';

const RYD_HOME = 'https://returnyoutubedislike.com';
const TOOLTIP_OPTIONS = [
  { value: 'dashLike', labelKey: 'dislikes.tooltipMode.dashLike' },
  { value: 'dashDislike', labelKey: 'dislikes.tooltipMode.dashDislike' },
  { value: 'both', labelKey: 'dislikes.tooltipMode.both' },
  { value: 'onlyLike', labelKey: 'dislikes.tooltipMode.onlyLike' },
  { value: 'onlyDislike', labelKey: 'dislikes.tooltipMode.onlyDislike' },
];
const FORMAT_OPTIONS = [
  { value: 'compactShort', labelKey: 'dislikes.format.compactShort' },
  { value: 'compactLong', labelKey: 'dislikes.format.compactLong' },
  { value: 'standard', labelKey: 'dislikes.format.standard' },
];

export function dislikesFields() {
  return {
    enabled: field.bool(false),
    showBar: field.bool(true),
    showPercent: field.bool(true),
    colorizeBar: field.bool(false),
    tooltipMode: field.enum(TOOLTIP_OPTIONS.map(({ value }) => value), 'dashLike'),
    format: field.enum(FORMAT_OPTIONS.map(({ value }) => value), 'compactShort'),
    reformatLikes: field.bool(false),
  };
}

function attribution() {
  const row = el('div', 'yp-row');
  const link = el('a', 'yp-link', t('dislikes.attribution'));
  link.href = RYD_HOME;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  row.append(link);
  return row;
}

export function dislikesTab() {
  return {
    id: 'dislikes',
    titleKey: 'dislikes.title',
    icon: 'thumbDown',
    sections: [
      {
        titleKey: 'dislikes.section.service',
        controls: [
          {
            type: 'switch',
            path: 'enabled',
            labelKey: 'dislikes.enabled',
            hintKey: 'dislikes.consent',
          },
          { type: 'custom', labelKey: 'dislikes.attribution', render: attribution },
        ],
      },
      {
        titleKey: 'dislikes.section.appearance',
        showIf: (section) => section.enabled === true,
        controls: [
          { type: 'switch', path: 'showBar', labelKey: 'dislikes.showBar' },
          {
            type: 'switch',
            path: 'showPercent',
            labelKey: 'dislikes.showPercent',
            showIf: (section) => section.showBar,
          },
          {
            type: 'switch',
            path: 'colorizeBar',
            labelKey: 'dislikes.colorizeBar',
            showIf: (section) => section.showBar,
          },
          {
            type: 'select',
            path: 'tooltipMode',
            labelKey: 'dislikes.tooltipMode',
            options: TOOLTIP_OPTIONS,
            showIf: (section) => section.showBar,
          },
          { type: 'select', path: 'format', labelKey: 'dislikes.format', options: FORMAT_OPTIONS },
          { type: 'switch', path: 'reformatLikes', labelKey: 'dislikes.reformatLikes' },
        ],
      },
    ],
  };
}
