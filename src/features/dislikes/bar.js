import { el } from '../../utils/dom.js';
import { ratingShare, ratingTooltip } from './format.js';

export function createRatingBar() {
  let bar = null;

  return function updateBar(anchor, votes, cfg, locale) {
    const share = cfg?.showBar && anchor ? ratingShare(votes) : null;
    if (share === null) {
      bar?.remove();
      bar = null;
      return;
    }

    if (!bar) {
      bar = el('div', 'yp-rating-bar');
      bar.setAttribute('aria-hidden', 'true');
      bar.append(el('span', 'yp-rating-bar__likes'), el('span', 'yp-rating-bar__dislikes'));
    }
    if (bar.parentElement !== anchor) anchor.append(bar);
    const title = ratingTooltip(votes, cfg, locale);
    const percent = `${share * 100}%`;
    if (bar.title !== title) {
      bar.title = title;
      bar.setAttribute('aria-label', title);
    }
    if (bar.style.getPropertyValue('--yp-like-share') !== percent) {
      bar.style.setProperty('--yp-like-share', percent);
    }
    bar.classList.toggle('yp-rating-bar--color', Boolean(cfg.colorizeBar && (votes.likes || votes.dislikes)));
  };
}
