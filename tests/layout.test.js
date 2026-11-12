import test from 'node:test';
import assert from 'node:assert/strict';
import { columnsFor, resolveColumns, computeColumns, buildLayoutCss } from '../src/features/layout/grid.js';

test('columnsFor targets a thumbnail width and clamps', () => {
  assert.equal(columnsFor(1200, 320, 8), 3);
  assert.equal(columnsFor(1920, 320, 8), 5);
  assert.equal(columnsFor(300, 320, 8), 2);
  assert.equal(columnsFor(4000, 220, 8), 8);
  assert.equal(columnsFor(NaN, 320, 8), 2);
});

test('resolveColumns uses a fixed setting or auto', () => {
  assert.equal(resolveColumns('4', 1920, 320, 8), 4);
  assert.equal(resolveColumns('auto', 1920, 320, 8), 5);
});

test('computeColumns resolves each page independently', () => {
  const cfg = { grid: { home: 'auto', subscriptions: '4', channel: 'auto', targetWidth: 320, itemGap: 8 } };
  assert.deepEqual(
    computeColumns(cfg, { home: 1920, subscriptions: 1200, channel: 900 }),
    { home: 5, subscriptions: 4, channel: 2 },
  );
});

test('buildLayoutCss scopes columns to each page', () => {
  const cfg = { grid: { home: 'auto', subscriptions: '4', channel: 'auto', targetWidth: 320, itemGap: 8, gutter: 16 }, compact: {} };
  const css = buildLayoutCss(cfg, { home: 5, subscriptions: 4, channel: 3 });
  assert.match(css, /ytd-browse\[page-subtype="home"\] ytd-rich-grid-renderer\{[^}]*--ytd-rich-grid-items-per-row: 5 !important/);
  assert.match(css, /ytd-browse\[page-subtype="subscriptions"\] ytd-rich-grid-renderer\{[^}]*--ytd-rich-grid-items-per-row: 4 !important/);
  assert.match(css, /--ytd-rich-grid-item-margin: 8px !important/);
  assert.match(css, /--ytd-rich-grid-gutter-margin: 16px !important/);
});
