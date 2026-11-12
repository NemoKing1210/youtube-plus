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
  assert.deepEqual(next.custom, { enabled: false, selectors: [] });
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
