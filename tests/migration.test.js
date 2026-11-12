import test from 'node:test';
import assert from 'node:assert/strict';
import { interfaceFields, interfaceTab } from '../src/features/interface/settings.js';
import { normalizeFields } from '../src/core/schema.js';

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
