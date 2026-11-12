import { field } from '../../core/schema.js';
import { t } from '../../i18n/index.js';

export const GRID_COLUMNS = ['auto', '3', '4', '5', '6', '7', '8'];

const PAGES = ['home', 'subscriptions', 'channel'];

/** True when at least one page lets the grid pick its own column count. */
function hasAutoPage(section) {
  return PAGES.some((page) => section.grid?.[page] === 'auto');
}

const columnOptions = () =>
  GRID_COLUMNS.map((value) => ({
    value,
    label: value === 'auto' ? t('layout.auto') : `${value}`,
  }));

export function layoutFields() {
  return {
    enabled: field.bool(true),
    grid: field.record({
      home: field.enum(GRID_COLUMNS, 'auto'),
      subscriptions: field.enum(GRID_COLUMNS, 'auto'),
      channel: field.enum(GRID_COLUMNS, 'auto'),
      targetWidth: field.int(320, { min: 220, max: 480 }),
      gutter: field.int(16, { min: 0, max: 64 }),
      itemGap: field.int(8, { min: 0, max: 32 }),
    }),
    compact: field.record({
      hideAvatars: field.bool(false),
      hideMetadata: field.bool(false),
      fullTitles: field.bool(false),
    }),
  };
}

export function layoutTab() {
  const showGrid = (section) => section.enabled === true;

  return {
    id: 'layout',
    titleKey: 'layout.title',
    sections: [
      {
        titleKey: 'layout.section.grid',
        controls: [
          { type: 'switch', path: 'enabled', labelKey: 'layout.enabled' },
          {
            type: 'select',
            path: 'grid.home',
            labelKey: 'layout.home',
            showIf: showGrid,
            options: columnOptions,
          },
          {
            type: 'select',
            path: 'grid.subscriptions',
            labelKey: 'layout.subscriptions',
            showIf: showGrid,
            options: columnOptions,
          },
          {
            type: 'select',
            path: 'grid.channel',
            labelKey: 'layout.channel',
            showIf: showGrid,
            options: columnOptions,
          },
          {
            type: 'number',
            path: 'grid.targetWidth',
            labelKey: 'layout.targetWidth',
            min: 220,
            max: 480,
            showIf: (section) => showGrid(section) && hasAutoPage(section),
          },
          {
            type: 'number',
            path: 'grid.gutter',
            labelKey: 'layout.gutter',
            min: 0,
            max: 64,
            showIf: showGrid,
          },
          {
            type: 'number',
            path: 'grid.itemGap',
            labelKey: 'layout.itemGap',
            min: 0,
            max: 32,
            showIf: showGrid,
          },
        ],
      },
      {
        titleKey: 'layout.section.cards',
        showIf: showGrid,
        controls: [
          { type: 'switch', path: 'compact.hideAvatars', labelKey: 'layout.hideAvatars' },
          {
            type: 'switch',
            path: 'compact.hideMetadata',
            labelKey: 'layout.hideMetadata',
            hintKey: 'layout.hideMetadataHint',
          },
          { type: 'switch', path: 'compact.fullTitles', labelKey: 'layout.fullTitles' },
        ],
      },
    ],
  };
}
