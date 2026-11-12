import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, SHORTS_SELECTORS, ruleId } from '../src/features/interface/rules.js';
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
  for (const selector of SHORTS_SELECTORS) assert.ok(css.includes(selector), selector);
  assert.match(css, /ytd-guide-entry-renderer:has\(a\[href="\/shorts"\]/);
  assert.doesNotMatch(css, /#secondary-inner #related/);
  assert.doesNotMatch(css, /ytd-comments#comments/);
});

test('home rules are scoped to the home page and off by default', () => {
  const home = {
    shorts: true, posts: true, live: true, upcoming: true,
    watched: true, mixes: true, chips: true,
  };
  const { css } = buildInterfaceCss(RULES, config({ feed: home }));
  assert.match(css, /ytd-browse\[page-subtype="home"\] ytd-rich-item-renderer:has\(ytd-post-renderer\)/);
  assert.match(css, /overlay-style="LIVE"/);
  assert.match(css, /overlay-style="UPCOMING"/);
  assert.match(css, /a\[href\*="start_radio=1"\]/);
  assert.match(css, /ytd-feed-filter-chip-bar-renderer/);
});

test('feed.shorts uses the shared Shorts selectors', () => {
  const { css } = buildInterfaceCss(RULES, config());
  assert.match(css, /grid-shelf-view-model:has\(a\[href\^="\/shorts\/"\]\)/);
  assert.match(css, /ytd-rich-item-renderer:has\(a\[href\^="\/shorts\/"\]\)/);
});

test('the master switch disables everything', () => {
  const { css } = buildInterfaceCss(RULES, config({ enabled: false }));
  assert.equal(css, '');
});

test('a previewed rule is excluded and its selectors returned', () => {
  const id = ruleId({ group: 'feed', key: 'shorts' });
  const { css, previewSelectors } = buildInterfaceCss(RULES, config(), { hoveredId: id });
  assert.doesNotMatch(css, /grid-shelf-view-model/);
  assert.deepEqual(previewSelectors, SHORTS_SELECTORS);
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

test('subscriptions and search rules are scoped to their pages', () => {
  const cfg = config({
    subscriptions: { live: true, upcoming: true, mixes: true },
    search: { shelves: true, live: true, upcoming: true },
  });
  const { css } = buildInterfaceCss(RULES, cfg);
  assert.match(css, /ytd-browse\[page-subtype="subscriptions"\] ytd-rich-item-renderer:has\([^)]*overlay-style="LIVE"/);
  assert.match(css, /ytd-search ytd-shelf-renderer/);
  assert.match(css, /ytd-search ytd-video-renderer:has\([^)]*overlay-style="UPCOMING"/);
});

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

test('watch, channel and player rules produce the expected selectors', () => {
  const cfg = config({
    watch: { related: false, comments: false, chat: false, merch: false, playlist: true, description: true, actions: true, transcript: true },
    channel: { shortsTab: true, posts: true, trailer: true, live: true, upcoming: true },
    chrome: { endCards: false, cards: false, pauseOverlay: true },
  });
  const { css } = buildInterfaceCss(RULES, cfg);
  assert.match(css, /ytd-playlist-panel-renderer/);
  assert.match(css, /#description-inline-expander/);
  assert.match(css, /ytd-watch-metadata #actions/);
  assert.match(css, /ytd-transcript-renderer/);
  assert.match(css, /yt-tab-shape\[tab-title="Shorts"\]/);
  assert.match(css, /ytd-channel-video-player-renderer/);
  assert.match(css, /\.ytp-pause-overlay/);
});
