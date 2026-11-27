import { getLocale, t } from '../../i18n/index.js';
import { iconNode } from '../../ui/icons.js';
import { el } from '../../utils/dom.js';
import { createRatingBar } from './bar.js';
import { formatCount } from './format.js';
import { createLikeTextOverride } from './watch.js';

export function createDislikesRenderer() {
  const updateBar = createRatingBar();
  const likeOverride = createLikeTextOverride();
  let count = null;

  function updateCount(placement, votes, cfg, locale) {
    if (!placement || !votes || count?.node.parentElement !== placement.host ||
        count.readOnly !== placement.readOnly || count.shorts !== placement.shorts) {
      count?.node.remove();
      count = null;
    }
    if (!placement || !votes) return;

    if (!count) {
      const { readOnly, shorts } = placement;
      const node = el('span', shorts ? 'yp-shorts-dislike' : 'yp-dislike-count');
      const text = readOnly ? el('span') : node;
      if (readOnly) node.append(iconNode('thumbDown', 14), text);
      count = { node, text, readOnly, shorts };
    }

    const { host, prepend, after } = placement;
    if (after) {
      if (after.nextElementSibling !== count.node) after.after(count.node);
    } else if (prepend) {
      if (host.firstElementChild !== count.node) host.prepend(count.node);
    } else if (count.node.parentElement !== host) {
      host.append(count.node);
    }

    const formatted = formatCount(votes.dislikes, cfg.format, locale);
    const title = t('dislikes.estimate', { count: formatted });
    if (count.text.textContent !== formatted) count.text.textContent = formatted;
    if (count.node.title !== title) {
      count.node.title = title;
      count.node.setAttribute('aria-label', title);
    }
  }

  return function render(target, votes, cfg) {
    const locale = getLocale();
    updateCount(target?.placement, votes, cfg, locale);
    updateBar(target?.barAnchor, votes, cfg, locale);
    if (cfg?.reformatLikes && target?.likeText && votes) {
      likeOverride.set(target.likeText, formatCount(votes.likes, cfg.format, locale));
    } else {
      likeOverride.restore();
    }
  };
}
