import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, ruleId } from '../src/features/interface/rules.js';
import { buildInterfaceCss } from '../src/features/interface/css.js';

const config = (overrides = {}) => ({
  enabled: true,
  feed: { shorts: true },
  nav: { shorts: true, premium: false },
  watch: { related: false, comments: false, chat: false, merch: false },
  chrome: { endCards: false, cards: false },
  ...overrides,
});

test('defaults hide both Shorts rules only', () => {
  const { css } = buildInterfaceCss(RULES, config());
  assert.match(css, /grid-shelf-view-model:has\(ytm-shorts-lockup-view-model\)/);
  assert.match(css, /ytd-guide-entry-renderer:has\(a\[title="Shorts"\]\)/);
  assert.doesNotMatch(css, /#secondary-inner #related/);
  assert.doesNotMatch(css, /ytd-comments#comments/);
});

test('the master switch disables everything', () => {
  const { css } = buildInterfaceCss(RULES, config({ enabled: false }));
  assert.equal(css, '');
});

test('a previewed rule is excluded and its selectors returned', () => {
  const id = ruleId({ group: 'feed', key: 'shorts' });
  const { css, previewSelectors } = buildInterfaceCss(RULES, config(), { hoveredId: id });
  assert.doesNotMatch(css, /grid-shelf-view-model/);
  assert.deepEqual(previewSelectors, [
    'grid-shelf-view-model:has(ytm-shorts-lockup-view-model)',
    'ytd-reel-shelf-renderer',
    'ytd-rich-shelf-renderer[is-shorts]',
  ]);
});

test('a previewed rule is returned even when it is off', () => {
  const id = ruleId({ group: 'watch', key: 'comments' });
  const { css, previewSelectors } = buildInterfaceCss(
    RULES,
    config({ feed: { shorts: false }, nav: { shorts: false, premium: false } }),
    { hoveredId: id },
  );
  assert.equal(css, '');
  assert.deepEqual(previewSelectors, ['ytd-comments#comments']);
});
