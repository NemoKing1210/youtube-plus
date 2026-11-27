import { SEL } from '../../core/constants.js';
import { countPlacement, shortsVideoId } from './targets.js';
import { ratingButton } from './watch.js';

const SHORTS_PLAYER = '#shorts-player, #movie_player';
const SHORTS_LINK = 'a[href^="/shorts/"]';
const SHORTS_DISLIKE = 'dislike-button-view-model, #dislike-button';
const SHORTS_LIKE = 'like-button-view-model, #like-button';

export function findShortsTarget(page, url) {
  const reel = page?.querySelector(SEL.shortsActive);
  if (!reel) return null;
  const player = reel.querySelector(SHORTS_PLAYER);
  const playerId = player?.getVideoData?.()?.video_id;
  const link = reel.querySelector(SHORTS_LINK)?.getAttribute('href');
  const id = shortsVideoId(url, link, playerId || reel.getAttribute('video-id'));
  if (!id) return null;

  const actionBar = reel.querySelector(SEL.shortsActionBar);
  const dislike = actionBar?.querySelector(SHORTS_DISLIKE);
  const button = ratingButton(dislike);
  const like = actionBar?.querySelector(SHORTS_LIKE);
  const native = button && dislike;
  const placement = countPlacement(native, like ?? actionBar);
  if (placement) {
    placement.shorts = true;
    placement.prepend = !native && !like;
    if (native === button && button) {
      placement.host = button.parentElement;
      placement.after = button;
    }
  }
  return { id, placement };
}
