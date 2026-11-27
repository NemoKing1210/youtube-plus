import { t } from '../../i18n/index.js';

const COUNT_OPTIONS = {
  compactShort: { notation: 'compact', compactDisplay: 'short' },
  compactLong: { notation: 'compact', compactDisplay: 'long' },
  standard: { maximumFractionDigits: 0 },
};
const PERCENT_OPTIONS = { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 };

function validCount(value) {
  return Number.isFinite(value) && value >= 0;
}

export function formatCount(value, mode, locale) {
  if (!validCount(value)) return '';
  return new Intl.NumberFormat(locale, COUNT_OPTIONS[mode] ?? COUNT_OPTIONS.standard).format(value);
}

export function ratingShare(votes) {
  const { likes, dislikes } = votes ?? {};
  if (votes?.deleted || !validCount(likes) || !validCount(dislikes)) return null;
  const total = likes + dislikes;
  if (total === 0) return 0.5;
  return Number.isFinite(total) ? likes / total : (likes / 2) / (likes / 2 + dislikes / 2);
}

export function ratingTooltip(votes, cfg, locale, translate = t) {
  const share = ratingShare(votes);
  if (share === null) return '';
  if (votes.likes === 0 && votes.dislikes === 0) return translate('dislikes.noVotes');

  const formatPercent = cfg.showPercent && new Intl.NumberFormat(locale, PERCENT_OPTIONS);
  const side = (key, value, ratio) => {
    const count = translate(key, { count: formatCount(value, cfg.format, locale) });
    return formatPercent
      ? translate('dislikes.tooltip.percent', { count, percent: formatPercent.format(ratio) })
      : count;
  };
  const likes = side('dislikes.tooltip.likes', votes.likes, share);
  const dislikes = side('dislikes.tooltip.dislikes', votes.dislikes, 1 - share);
  switch (cfg.tooltipMode) {
    case 'dashDislike': return `${dislikes} — ${likes}`;
    case 'both': return `${likes}\n${dislikes}`;
    case 'onlyLike': return likes;
    case 'onlyDislike': return dislikes;
    default: return `${likes} — ${dislikes}`;
  }
}
