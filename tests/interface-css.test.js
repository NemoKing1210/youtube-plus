import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, ruleId } from '../src/features/interface/rules.js';
import { buildInterfaceCss } from '../src/features/interface/css.js';

const config = (overrides = {}) => ({
  enabled: true,
  feed: { shorts: true },
  nav: {
    shorts: true,
    premium: false,
    home: false,
    subscriptions: false,
    history: false,
    playlists: false,
    watchLater: false,
    liked: false,
    downloads: false,
    explore: false,
    moreFromYouTube: false,
    footer: false,
  },
  watch: { related: false, comments: false, chat: false, merch: false },
  chrome: { endCards: false, cards: false },
  ...overrides,
});

test('defaults hide both Shorts rules only', () => {
  const { css } = buildInterfaceCss(RULES, config());
  assert.match(css, /grid-shelf-view-model:has\(ytm-shorts-lockup-view-model\)/);
  assert.match(css, /ytd-guide-entry-renderer:has\(a\[href="\/shorts"\]/);
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

const navAll = {
  shorts: true,
  premium: true,
  home: true,
  subscriptions: true,
  history: true,
  playlists: true,
  watchLater: true,
  liked: true,
  downloads: true,
  explore: true,
  moreFromYouTube: true,
  footer: true,
};

test('guide rules match by href instead of localized titles', () => {
  const { css } = buildInterfaceCss(RULES, config({ nav: navAll }));
  assert.match(css, /ytd-guide-entry-renderer:has\(a\[href="\/shorts"\]/);
  assert.match(css, /a#endpoint\[href="\/feed\/history"\]/);
  assert.match(css, /a#endpoint\[href\*="list=WL"\]/);
  assert.match(css, /a#endpoint\[href\*="list=LL"\]/);
  assert.match(css, /ytd-guide-renderer #footer/);
});

test('guide entries are off by default except shorts', () => {
  const { css } = buildInterfaceCss(RULES, config());
  assert.doesNotMatch(css, /a#endpoint\[href="\/feed\/history"\]/);
  assert.doesNotMatch(css, /a#endpoint\[href="\/"\]/);
});
