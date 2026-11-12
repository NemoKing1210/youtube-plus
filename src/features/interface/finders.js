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
