export const MIN_COLUMNS = 2;
export const MAX_COLUMNS = 8;
export const PAGE_SELECTORS = {
  home: 'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer',
  subscriptions: 'ytd-browse[page-subtype="subscriptions"] ytd-rich-grid-renderer',
  channel: 'ytd-browse[page-subtype="channels"] ytd-rich-grid-renderer',
};

export function columnsFor(containerWidth, targetWidth, gap = 8) {
  const width = Number(containerWidth);
  if (!Number.isFinite(width) || width <= 0) return MIN_COLUMNS;
  const columns = Math.floor((width + gap) / (targetWidth + gap));
  return Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, columns));
}

export function resolveColumns(setting, containerWidth, targetWidth, gap = 8) {
  if (setting !== 'auto') {
    const fixed = Number(setting);
    return Number.isFinite(fixed) ? fixed : columnsFor(containerWidth, targetWidth, gap);
  }
  return columnsFor(containerWidth, targetWidth, gap);
}

export function computeColumns(cfg, widths) {
  const { targetWidth, itemGap } = cfg.grid;
  return {
    home: resolveColumns(cfg.grid.home, widths.home, targetWidth, itemGap),
    subscriptions: resolveColumns(cfg.grid.subscriptions, widths.subscriptions, targetWidth, itemGap),
    channel: resolveColumns(cfg.grid.channel, widths.channel, targetWidth, itemGap),
  };
}

export function buildLayoutCss(cfg, columns) {
  const { grid } = cfg;
  const base = `ytd-rich-grid-renderer{--ytd-rich-grid-item-margin: ${grid.itemGap}px !important;--ytd-rich-grid-gutter-margin: ${grid.gutter}px !important;}`;
  const pages = Object.entries(PAGE_SELECTORS)
    .map(([page, selector]) => `${selector}{--ytd-rich-grid-items-per-row: ${columns[page]} !important;}`)
    .join('\n');
  const compact = [];
  if (cfg.compact?.hideAvatars) {
    compact.push('ytd-rich-item-renderer #avatar-link, ytd-rich-item-renderer yt-avatar-shape, yt-lockup-view-model yt-avatar-shape{display:none!important}');
  }
  if (cfg.compact?.hideMetadata) {
    compact.push('ytd-rich-item-renderer #metadata-line, ytd-rich-item-renderer yt-content-metadata-view-model{display:none!important}');
  }
  if (cfg.compact?.fullTitles) {
    compact.push('ytd-rich-item-renderer #video-title, ytd-rich-item-renderer yt-lockup-metadata-view-model{-webkit-line-clamp:unset!important;white-space:normal!important}');
  }
  return [base, pages, ...compact].join('\n');
}
