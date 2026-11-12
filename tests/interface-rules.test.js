import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, GROUPS, ruleId, ruleLabelKey } from '../src/features/interface/rules.js';
import { interfaceTab } from '../src/features/interface/settings.js';
import en from '../src/i18n/locales/en.js';

test('rule ids are unique', () => {
  const ids = RULES.map(ruleId);
  assert.equal(new Set(ids).size, ids.length);
});

test('every rule has a target and a known group', () => {
  for (const rule of RULES) {
    assert.ok(GROUPS.includes(rule.group), `${ruleId(rule)}: unknown group`);
    const hasCss = Array.isArray(rule.css) && rule.css.length > 0;
    const hasFind = typeof rule.find === 'function';
    assert.ok(hasCss || hasFind, `${ruleId(rule)}: no css or find`);
  }
});

test('every rule has an English label and optional hint', () => {
  for (const rule of RULES) {
    assert.ok(en[ruleLabelKey(rule)], `missing ${ruleLabelKey(rule)}`);
    if (rule.hint) assert.ok(en[`${ruleLabelKey(rule)}Hint`], `missing hint for ${ruleId(rule)}`);
  }
});

test('experimental rules are off by default', () => {
  for (const rule of RULES.filter((item) => item.experimental)) {
    assert.notEqual(rule.on, true, `${ruleId(rule)} must default to off`);
  }
});

test('GROUPS lists the catalogue sections in display order', () => {
  assert.deepEqual(GROUPS, [
    'nav',
    'feed',
    'subscriptions',
    'search',
    'watch',
    'channel',
    'chrome',
  ]);
});

test('interfaceTab adds the custom section after the rule groups', () => {
  const tab = interfaceTab();
  const index = tab.sections.findIndex((section) => section.titleKey === 'interface.custom.title');
  assert.ok(index > 0);
  const lastGroup = tab.sections.reduce(
    (last, section, at) => (section.titleKey.startsWith('interface.group.') ? at : last),
    -1,
  );
  assert.ok(index > lastGroup);

  const section = tab.sections[index];
  assert.equal(section.showIf({ enabled: false }), false);
  assert.equal(section.showIf({ enabled: true }), true);

  const toggle = section.controls.find((control) => control.path === 'custom.enabled');
  assert.equal(toggle?.type, 'switch');
  assert.equal(toggle?.labelKey, 'interface.custom.enabled');

  const area = section.controls.find((control) => control.path === 'custom.selectors');
  assert.equal(area?.type, 'textarea');
  assert.equal(area?.labelKey, 'interface.custom.selectors');
  assert.equal(area?.hintKey, 'interface.custom.selectorsHint');
  assert.equal(area?.rows, 5);
  assert.equal(area?.parse, 'list');
  assert.equal(area?.showIf({ custom: { enabled: false } }), false);
  assert.equal(area?.showIf({ custom: { enabled: true } }), true);

  const warning = section.controls.find((control) => control.type === 'hint');
  assert.equal(warning?.textKey, 'interface.custom.warning');
});

test('interfaceTab resolves hints: explicit, experimental fallback, then none', () => {
  const rules = [
    { group: 'nav', key: 'plain', css: ['x'] },
    { group: 'nav', key: 'hinted', hint: true, css: ['x'] },
    { group: 'nav', key: 'experimental', experimental: true, css: ['x'] },
    { group: 'nav', key: 'both', hint: true, experimental: true, css: ['x'] },
  ];
  const hintFor = (id) =>
    interfaceTab(rules)
      .sections.flatMap((section) => section.controls)
      .find((control) => control.ruleId === id).hintKey;

  assert.equal(hintFor('nav.plain'), undefined);
  assert.equal(hintFor('nav.hinted'), 'interface.rule.nav.hintedHint');
  assert.equal(hintFor('nav.experimental'), 'interface.experimentalHint');
  assert.equal(hintFor('nav.both'), 'interface.rule.nav.bothHint');
});
