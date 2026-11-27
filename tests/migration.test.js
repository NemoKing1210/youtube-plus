import test from 'node:test';
import assert from 'node:assert/strict';
import { interfaceFields, interfaceTab } from '../src/features/interface/settings.js';
import { field, normalizeFields } from '../src/core/schema.js';
import { shortsFields } from '../src/features/shorts/settings.js';
import { dislikesFields } from '../src/features/dislikes/settings.js';
import { commentKitFields } from '../src/features/commentKit/settings.js';
import '../src/features/general/index.js';
import { getFeatures } from '../src/core/features.js';

test('v0.1 interface settings survive normalization', () => {
  const old = {
    enabled: true,
    feed: { shorts: true },
    nav: { shorts: true, premium: false },
    watch: { related: true, comments: false, chat: false, merch: false },
    chrome: { endCards: false, cards: false },
  };
  const next = normalizeFields(interfaceFields(), old);
  assert.equal(next.enabled, true);
  assert.equal(next.feed.shorts, true);
  assert.equal(next.nav.premium, false);
  assert.equal(next.watch.related, true);
  assert.equal(next.subscriptions.watched, false);
  assert.equal(next.search.shelves, false);
  assert.deepEqual(next.custom, { enabled: false, selectors: [] });
});

test('a full v0.1 blob gains every new group with defaults', () => {
  const next = normalizeFields(interfaceFields(), {
    enabled: true,
    feed: { shorts: true },
    nav: { shorts: true, premium: false },
    watch: { related: true, comments: false, chat: false, merch: false },
    chrome: { endCards: false, cards: false },
  });
  assert.equal(next.feed.shorts, true);
  assert.equal(next.watch.related, true);
  assert.equal(next.subscriptions.mostRelevant, false);
  assert.equal(next.search.shelves, false);
  assert.equal(next.channel.shortsTab, false);
  assert.equal(next.custom.enabled, false);
});

test('custom selectors are normalized and capped', () => {
  const next = normalizeFields(interfaceFields(), {
    custom: { enabled: true, selectors: [' a ', 'a', 42, 'b'] },
  });
  assert.deepEqual(next.custom.selectors, ['a', 'b']);
});

test('the interface tab exposes the custom textarea', () => {
  const tab = interfaceTab();
  const section = tab.sections.find((item) => item.titleKey === 'interface.custom.title');
  assert.ok(section);
  assert.ok(
    section.controls.some(
      (control) => control.type === 'textarea' && control.path === 'custom.selectors',
    ),
  );
});

test('saved settings from before Shorts gain the opt-in defaults', () => {
  const { shorts } = normalizeFields({
    interface: field.record(interfaceFields()),
    shorts: field.record(shortsFields()),
  }, { interface: { enabled: true } });
  assert.deepEqual(shorts, {
    enabled: false,
    autoScroll: true,
    scrollDelay: 1,
    skipLong: true,
    maxDuration: 60,
  });
});

test('old backups keep the network and local comment features disabled', () => {
  const { dislikes, commentKit } = normalizeFields({
    interface: field.record(interfaceFields()),
    dislikes: field.record(dislikesFields()),
    commentKit: field.record(commentKitFields()),
  }, { interface: { enabled: true } });
  assert.equal(dislikes.enabled, false);
  assert.equal(dislikes.showBar, true);
  assert.equal(dislikes.format, 'compactShort');
  assert.equal(commentKit.enabled, false);
  assert.equal(commentKit.theme, 'auto');
  assert.equal(commentKit.pageSize, 50);
});

test('toast settings offer both centered positions and preserve saved corners', () => {
  const { fields, tabs } = getFeatures().find(({ id }) => id === 'general');
  const position = tabs[0].sections.flatMap(({ controls }) => controls)
    .find(({ path }) => path === 'toastPosition');
  const positions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];

  assert.equal(normalizeFields(fields, {}).toastPosition, 'bottom-center');
  assert.equal(normalizeFields(fields, { toastPosition: 'invalid' }).toastPosition, 'bottom-center');
  assert.deepEqual(position.options.map(({ value }) => value).sort(), positions.sort());
  for (const toastPosition of positions) {
    assert.equal(normalizeFields(fields, { toastPosition }).toastPosition, toastPosition);
  }
});
