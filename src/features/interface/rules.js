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
 * @property {'feed'|'nav'|'watch'|'chrome'} group
 * @property {string} key
 * @property {boolean} [on]      - enabled by default
 * @property {boolean} [hint]    - has a `<label>Hint` locale string
 * @property {string[]} [css]
 * @property {(root: ParentNode) => Element[]} [find]
 */

export const GROUPS = ['feed', 'nav', 'watch', 'chrome'];

export const RULES = [
  {
    group: 'feed',
    key: 'shorts',
    on: true,
    css: [
      'grid-shelf-view-model:has(ytm-shorts-lockup-view-model)',
      'ytd-reel-shelf-renderer',
      'ytd-rich-shelf-renderer[is-shorts]',
    ],
  },
  {
    group: 'nav',
    key: 'shorts',
    on: true,
    hint: true,
    css: [
      'ytd-guide-entry-renderer:has(a[title="Shorts"])',
      'ytd-mini-guide-entry-renderer:has(a[title="Shorts"])',
    ],
  },
  {
    group: 'nav',
    key: 'premium',
    css: [
      'a#endpoint[href="/premium"]',
      'a#endpoint[href^="https://music.youtube.com"]',
      'a#endpoint[href^="https://www.youtubekids.com"]',
      'a#endpoint[href^="/feed/storefront"]',
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
  { group: 'chrome', key: 'endCards', css: ['.html5-endscreen'] },
  { group: 'chrome', key: 'cards', css: ['.ytp-cards-teaser', '.ytp-cards-button'] },
];

export function ruleId(rule) {
  return `${rule.group}.${rule.key}`;
}

export function ruleLabelKey(rule) {
  return `interface.rule.${rule.group}.${rule.key}`;
}
