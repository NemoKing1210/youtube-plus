import { SEL } from '../../core/constants.js';
import { countPlacement, visibleChild, watchVideoId } from './targets.js';

const WATCH_FLEXY = 'ytd-watch-flexy';
const LEGACY_WATCH_DISLIKE = '#actions #dislike-button';
const LEGACY_WATCH_LIKE = '#actions #like-button';
const BUTTON_TEXT = '.ytSpecButtonShapeNextButtonTextContent, .yt-spec-button-shape-next__button-text-content';
const RATING_GROUP = 'segmented-like-dislike-button-view-model, ytd-segmented-like-dislike-button-renderer';

export function ratingButton(control) {
  if (control?.matches('button')) return control;
  return control?.querySelector('button') ?? null;
}

/** Keep native updates made while the user's display format is applied. */
export function createLikeTextOverride() {
  let current = null;

  function restore() {
    if (current && current.node.data === current.applied) current.node.data = current.original;
    current = null;
  }

  return {
    set(node, text) {
      if (current?.node !== node) restore();
      if (!node || !text) {
        restore();
        return;
      }
      if (!current || node.data !== current.applied) current = { node, original: node.data };
      current.applied = text;
      if (node.data !== text) node.data = text;
    },
    restore,
  };
}

export function findWatchTarget(metadata, url, scope) {
  if (!metadata) return null;
  const watchPage = metadata.closest(WATCH_FLEXY);
  const player = visibleChild(watchPage ?? scope, SEL.player);
  const id = watchVideoId(url, player?.getVideoData?.()?.video_id, watchPage?.getAttribute('video-id'));
  if (!id) return null;

  const dislike = metadata.querySelector(SEL.watchDislike) ?? metadata.querySelector(LEGACY_WATCH_DISLIKE);
  const like = metadata.querySelector(SEL.watchLike) ?? metadata.querySelector(LEGACY_WATCH_LIKE);
  const button = ratingButton(dislike);
  const countArea = button?.querySelector(BUTTON_TEXT);
  const likeCount = like?.querySelector(BUTTON_TEXT);
  const likeText = likeCount && [...likeCount.childNodes].find((node) =>
    node.nodeType === 3 && /\p{Decimal_Number}/u.test(node.data),
  );
  return {
    id,
    placement: countPlacement(countArea ?? button),
    barAnchor: button && like ? dislike.closest(RATING_GROUP) : null,
    likeText,
  };
}
