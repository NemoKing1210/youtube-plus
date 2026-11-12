import { isMostRelevantTitle } from './titles.js';

/**
 * Finders for targets that cannot be expressed as a CSS selector. They only
 * report matches; the engine marks them with `data-yp-hide` and hides them.
 */

const ITEM_SELECTOR =
  'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer';
const RESUME_SELECTOR = 'ytd-thumbnail-overlay-resume-playback-renderer';

/**
 * Videos YouTube remembers a playback position for show a resume overlay on
 * their thumbnail.
 *
 * @param {ParentNode} root
 * @returns {Element[]}
 */
export function findWatched(root) {
  return [...root.querySelectorAll(ITEM_SELECTOR)].filter((item) =>
    item.querySelector(RESUME_SELECTOR),
  );
}

const SHELF_TITLE_SELECTOR =
  '#rich-shelf-header #title, #title-container > #title, .rich-shelf-header #title, #title';

/**
 * The localized "Most relevant" shelf has no stable selector, so match its
 * title text and mark the enclosing section. Several shelves can share one
 * section, so sections are deduplicated in document order.
 *
 * @param {ParentNode} root
 * @returns {Element[]}
 */
export function findMostRelevant(root) {
  const sections = [...root.querySelectorAll('ytd-rich-shelf-renderer')]
    .filter((shelf) => isMostRelevantTitle(shelf.querySelector(SHELF_TITLE_SELECTOR)?.textContent))
    .map((shelf) => shelf.closest('ytd-rich-section-renderer') || shelf);
  return [...new Set(sections)];
}
