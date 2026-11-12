import { findWatched, findMostRelevant } from './finders.js';

/**
 * Declarative clean-up rules. A rule hides something on YouTube and is
 * toggled by one boolean in settings (`interface[group][key]`).
 *
 * A rule supplies `css` (a selector or a list) — hidden by one generated
 * stylesheet — or `find(root)` for targets that cannot be expressed as a
 * selector (mark matches with `data-yp-hide~="<id>"`).
 *
 * To add a rule: append an entry here and add its label to the locales
 * (`interface.rule.<group>.<key>` plus `<…>Hint` when `hint` is set).
 *
 * @typedef {object} Rule
 * @property {'nav'|'feed'|'subscriptions'|'search'|'watch'|'channel'|'chrome'} group
 * @property {string} key
 * @property {boolean} [on]      - enabled by default
 * @property {boolean} [hint]    - has a `<label>Hint` locale string
 * @property {boolean} [experimental] - off by default; hint falls back to `interface.experimentalHint`
 * @property {string[]} [css]
 * @property {(root: ParentNode) => Element[]} [find]
 */

export const GROUPS = ['nav', 'feed', 'subscriptions', 'search', 'watch', 'channel', 'chrome'];

/** Shorts shelves shared by feed rules (Task 8 wires them into `feed.shorts`). */
export const SHORTS_SELECTORS = [
  'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])',
  'ytd-reel-shelf-renderer',
  'grid-shelf-view-model:has(a[href^="/shorts/"])',
  'shorts-lockup-view-model:has(a[href^="/shorts/"])',
  'ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"])',
  'ytd-rich-item-renderer:has(a[href^="/shorts/"])',
];

export const RULES = [
  {
    group: 'feed',
    key: 'shorts',
    on: true,
    hint: true,
    css: SHORTS_SELECTORS,
  },
  {
    group: 'feed',
    key: 'posts',
    css: [
      'ytd-browse[page-subtype="home"] ytd-rich-section-renderer:has(ytd-post-renderer)',
      'ytd-browse[page-subtype="home"] ytd-rich-item-renderer:has(ytd-post-renderer)',
    ],
  },
  {
    group: 'feed',
    key: 'live',
    css: [
      'ytd-browse[page-subtype="home"] ytd-rich-item-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="LIVE"])',
    ],
  },
  {
    group: 'feed',
    key: 'upcoming',
    css: [
      'ytd-browse[page-subtype="home"] ytd-rich-item-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="UPCOMING"])',
    ],
  },
  {
    group: 'feed',
    key: 'watched',
    hint: true,
    find: (root) => {
      const page = root.querySelector?.('ytd-browse[page-subtype="home"]');
      return page ? findWatched(page) : [];
    },
  },
  {
    group: 'feed',
    key: 'mixes',
    css: [
      'ytd-browse[page-subtype="home"] ytd-rich-item-renderer:has(a[href*="start_radio=1"])',
      'ytd-browse[page-subtype="home"] ytd-radio-renderer',
    ],
  },
  {
    group: 'feed',
    key: 'chips',
    css: ['ytd-feed-filter-chip-bar-renderer'],
  },
  {
    group: 'nav',
    key: 'shorts',
    on: true,
    hint: true,
    css: [
      'ytd-guide-entry-renderer:has(a[href="/shorts"], a[href^="/shorts/"])',
      'ytd-mini-guide-entry-renderer:has(a[href="/shorts"], a[href^="/shorts/"])',
    ],
  },
  {
    group: 'nav',
    key: 'premium',
    css: [
      'ytd-guide-entry-renderer:has(a#endpoint[href="/premium"])',
      'ytd-guide-entry-renderer:has(a#endpoint[href^="https://music.youtube.com"])',
      'ytd-guide-entry-renderer:has(a#endpoint[href^="https://www.youtubekids.com"])',
      'ytd-guide-entry-renderer:has(a#endpoint[href^="/feed/storefront"])',
      'ytd-mini-guide-entry-renderer:has(a[href="/premium"])',
      'ytd-mini-guide-entry-renderer:has(a[href^="https://music.youtube.com"])',
      'ytd-mini-guide-entry-renderer:has(a[href^="https://www.youtubekids.com"])',
      'ytd-mini-guide-entry-renderer:has(a[href^="/feed/storefront"])',
    ],
  },
  {
    group: 'nav',
    key: 'home',
    css: [
      'ytd-guide-entry-renderer:has(a#endpoint[href="/"])',
      'ytd-mini-guide-entry-renderer:has(a[href="/"])',
    ],
  },
  {
    group: 'nav',
    key: 'subscriptions',
    css: [
      'ytd-guide-entry-renderer:has(a#endpoint[href="/feed/subscriptions"])',
      'ytd-mini-guide-entry-renderer:has(a[href="/feed/subscriptions"])',
    ],
  },
  {
    group: 'nav',
    key: 'history',
    css: [
      'ytd-guide-entry-renderer:has(a#endpoint[href="/feed/history"])',
      'ytd-mini-guide-entry-renderer:has(a[href="/feed/history"])',
    ],
  },
  {
    group: 'nav',
    key: 'playlists',
    css: [
      'ytd-guide-entry-renderer:has(a#endpoint[href="/feed/playlists"])',
      'ytd-mini-guide-entry-renderer:has(a[href="/feed/playlists"])',
    ],
  },
  {
    group: 'nav',
    key: 'watchLater',
    css: [
      'ytd-guide-entry-renderer:has(a#endpoint[href*="list=WL"])',
      'ytd-mini-guide-entry-renderer:has(a[href*="list=WL"])',
    ],
  },
  {
    group: 'nav',
    key: 'liked',
    css: [
      'ytd-guide-entry-renderer:has(a#endpoint[href*="list=LL"])',
      'ytd-mini-guide-entry-renderer:has(a[href*="list=LL"])',
    ],
  },
  {
    group: 'nav',
    key: 'downloads',
    css: [
      'ytd-guide-entry-renderer:has(a#endpoint[href="/feed/downloads"])',
      'ytd-mini-guide-entry-renderer:has(a[href="/feed/downloads"])',
    ],
  },
  {
    group: 'nav',
    key: 'explore',
    css: [
      'ytd-guide-entry-renderer:has(a#endpoint[href="/feed/explore"])',
      'ytd-guide-entry-renderer:has(a#endpoint[href="/feed/trending"])',
      'ytd-guide-entry-renderer:has(a#endpoint[href="/feed/music"])',
      'ytd-guide-entry-renderer:has(a#endpoint[href="/feed/shopping"])',
      'ytd-mini-guide-entry-renderer:has(a[href="/feed/explore"])',
      'ytd-mini-guide-entry-renderer:has(a[href="/feed/trending"])',
      'ytd-mini-guide-entry-renderer:has(a[href="/feed/music"])',
      'ytd-mini-guide-entry-renderer:has(a[href="/feed/shopping"])',
    ],
  },
  {
    group: 'nav',
    key: 'moreFromYouTube',
    css: [
      'ytd-guide-section-renderer:has(a#endpoint[href="/premium"])',
      'ytd-guide-section-renderer:has(a#endpoint[href^="https://music.youtube.com"])',
      'ytd-guide-section-renderer:has(a#endpoint[href^="https://www.youtubekids.com"])',
    ],
  },
  { group: 'nav', key: 'footer', css: ['ytd-guide-renderer #footer'] },
  {
    group: 'subscriptions',
    key: 'mostRelevant',
    experimental: true,
    hint: true,
    find: (root) => {
      const page = root.querySelector?.('ytd-browse[page-subtype="subscriptions"]');
      return page ? findMostRelevant(page) : [];
    },
  },
  {
    group: 'subscriptions',
    key: 'watched',
    find: (root) => {
      const page = root.querySelector?.('ytd-browse[page-subtype="subscriptions"]');
      return page ? findWatched(page) : [];
    },
  },
  {
    group: 'subscriptions',
    key: 'live',
    css: [
      'ytd-browse[page-subtype="subscriptions"] ytd-rich-item-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="LIVE"])',
    ],
  },
  {
    group: 'subscriptions',
    key: 'upcoming',
    css: [
      'ytd-browse[page-subtype="subscriptions"] ytd-rich-item-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="UPCOMING"])',
    ],
  },
  {
    group: 'subscriptions',
    key: 'mixes',
    css: [
      'ytd-browse[page-subtype="subscriptions"] ytd-rich-item-renderer:has(a[href*="start_radio=1"])',
      'ytd-browse[page-subtype="subscriptions"] ytd-radio-renderer',
    ],
  },
  {
    group: 'search',
    key: 'shelves',
    hint: true,
    css: ['ytd-search ytd-shelf-renderer', 'ytd-search ytd-horizontal-card-list-renderer'],
  },
  {
    group: 'search',
    key: 'watched',
    find: (root) => {
      const page = root.querySelector?.('ytd-search');
      return page ? findWatched(page) : [];
    },
  },
  {
    group: 'search',
    key: 'live',
    css: [
      'ytd-search ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="LIVE"])',
    ],
  },
  {
    group: 'search',
    key: 'upcoming',
    css: [
      'ytd-search ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="UPCOMING"])',
    ],
  },
  { group: 'watch', key: 'related', css: ['#secondary-inner #related'] },
  { group: 'watch', key: 'comments', css: ['ytd-comments#comments'] },
  { group: 'watch', key: 'chat', css: ['#chat-container'] },
  {
    group: 'watch',
    key: 'merch',
    css: ['#donation-shelf', 'ytd-merch-shelf-renderer', 'ytd-product-list'],
  },
  {
    group: 'watch',
    key: 'playlist',
    css: ['ytd-playlist-panel-renderer', '#playlist'],
  },
  {
    group: 'watch',
    key: 'description',
    css: [
      '#description-inline-expander',
      'ytd-text-inline-expander#description',
      'ytd-watch-metadata #description',
    ],
  },
  {
    group: 'watch',
    key: 'actions',
    hint: true,
    css: ['ytd-watch-metadata #actions', '#actions-inner'],
  },
  {
    group: 'watch',
    key: 'transcript',
    css: ['ytd-transcript-renderer', '#panels ytd-transcript-renderer'],
  },
  {
    group: 'channel',
    key: 'shortsTab',
    experimental: true,
    hint: true,
    css: [
      'yt-tab-shape[tab-title="Shorts"]',
      'tp-yt-paper-tab:has(.tab-title[title="Shorts"])',
    ],
  },
  {
    group: 'channel',
    key: 'posts',
    css: [
      'ytd-browse[page-subtype="channels"] ytd-rich-section-renderer:has(ytd-post-renderer)',
      'ytd-backstage-post-thread-renderer',
    ],
  },
  {
    group: 'channel',
    key: 'trailer',
    css: ['ytd-channel-video-player-renderer', '#channel-trailer'],
  },
  {
    group: 'channel',
    key: 'live',
    css: [
      'ytd-browse[page-subtype="channels"] ytd-rich-item-renderer:has([overlay-style="LIVE"])',
    ],
  },
  {
    group: 'channel',
    key: 'upcoming',
    css: [
      'ytd-browse[page-subtype="channels"] ytd-rich-item-renderer:has([overlay-style="UPCOMING"])',
    ],
  },
  { group: 'chrome', key: 'endCards', css: ['.html5-endscreen'] },
  { group: 'chrome', key: 'cards', css: ['.ytp-cards-teaser', '.ytp-cards-button'] },
  { group: 'chrome', key: 'pauseOverlay', css: ['.ytp-pause-overlay'] },
];

export function ruleId(rule) {
  return `${rule.group}.${rule.key}`;
}

export function ruleLabelKey(rule) {
  return `interface.rule.${rule.group}.${rule.key}`;
}
