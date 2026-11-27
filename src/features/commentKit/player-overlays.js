import { SEL, THEME_ATTR } from '../../core/constants.js';
import { t } from '../../i18n/index.js';
import { debounce, el } from '../../utils/dom.js';
import { timeLabel } from './parse.js';
import { buildTimedIndex, findTimedComments, heatmapBuckets, seekTo } from './timestamps.js';
import { button } from './ui.js';

const PROGRESS = '.ytp-progress-bar-container';

export function createPlayerOverlays(page, onDuration) {
  let video;
  let player;
  let progress;
  let settings;
  let comments;
  let index = [];
  let duration = NaN;
  let overlay;
  let heatmap;
  let shown = '';
  let dismissed = false;
  let last = -Infinity;

  function hideTimed() {
    overlay?.remove();
    overlay = null;
    shown = '';
  }

  function updateTimed(force = false) {
    if (dismissed || !settings?.timedComments || !video || video.paused || !Number.isFinite(duration)) {
      hideTimed();
      return;
    }
    const now = performance.now();
    if (!force && now - last < 250) return;
    last = now;
    const matches = findTimedComments(index, video.currentTime).slice(0, 4);
    if (!matches.length) {
      hideTimed();
      return;
    }
    const key = matches.map(({ comment }) => comment.id).join('\n');
    if (key === shown) return;
    shown = key;
    if (!overlay) {
      overlay = el('aside', 'yp-comment-kit yp-ck-timed');
      overlay.setAttribute('aria-label', t('commentKit.timedComments'));
      player.append(overlay);
    }
    if (settings.theme !== 'auto') overlay.setAttribute(THEME_ATTR, settings.theme);
    else overlay.removeAttribute(THEME_ATTR);
    const heading = el('div', 'yp-ck-header');
    heading.append(el('strong', '', t('commentKit.timedComments')), button('commentKit.dismiss', () => {
      dismissed = true;
      hideTimed();
    }));
    const list = el('ul', 'yp-ck-timed-list');
    for (const { comment } of matches) {
      const row = el('li');
      row.append(el('strong', '', comment.author), el('p', 'yp-ck-text', comment.text));
      list.append(row);
    }
    overlay.replaceChildren(heading, list);
  }

  function renderHeatmap() {
    if (!settings?.heatmap || !progress || !index.length) {
      heatmap?.remove();
      heatmap = null;
      return;
    }
    const buckets = heatmapBuckets(index, duration);
    if (!buckets.length) {
      heatmap?.remove();
      heatmap = null;
      return;
    }
    const focused = heatmap?.contains(document.activeElement) ? document.activeElement.dataset.ypBucket : '';
    if (!heatmap) {
      heatmap = el('div', 'yp-ck-heatmap');
      heatmap.setAttribute('role', 'group');
      heatmap.setAttribute('aria-label', t('commentKit.heatmap'));
      heatmap.addEventListener('keydown', (event) => {
        const { target, key } = event;
        if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
        event.preventDefault();
        const sibling = key === 'ArrowLeft' ? target.previousElementSibling : target.nextElementSibling;
        if (sibling) {
          target.tabIndex = -1;
          sibling.tabIndex = 0;
          sibling.focus();
        }
      });
    }
    const maxCount = Math.max(...buckets.map(({ count }) => count));
    const markers = buckets.map(({ start, percent, count }, markerIndex) => {
      const marker = el('button', 'yp-ck-marker');
      marker.type = 'button';
      marker.dataset.ypBucket = String(markerIndex);
      marker.tabIndex = String(markerIndex) === (focused || '0') ? 0 : -1;
      marker.title = t('commentKit.marker', { count, time: timeLabel(start) });
      marker.setAttribute('aria-label', marker.title);
      marker.style.left = `${percent}%`;
      marker.style.setProperty('--yp-marker-height', `${4 + 10 * count / maxCount}px`);
      marker.addEventListener('click', () => seekTo(page, start));
      return marker;
    });
    heatmap.replaceChildren(...markers);
    if (heatmap.parentElement !== progress) progress.append(heatmap);
    if (focused) markers[Number(focused)]?.focus({ preventScroll: true });
  }

  const timeUpdate = () => updateTimed();

  function refresh(force = false) {
    const next = video?.duration ?? NaN;
    const changed = !Object.is(duration, next);
    if (!force && !changed) return;
    duration = next;
    index = Number.isFinite(duration) && (settings?.timedComments || settings?.heatmap)
      ? buildTimedIndex(comments || [], duration) : [];
    hideTimed();
    renderHeatmap();
    updateTimed(true);
    if (changed) onDuration(duration);
  }

  const durationChange = () => refresh();
  const binding = [
    ['timeupdate', timeUpdate], ['pause', hideTimed], ['play', timeUpdate],
    ['loadedmetadata', durationChange], ['durationchange', durationChange], ['emptied', durationChange],
  ];
  const onResize = debounce(renderHeatmap, 150);
  window.addEventListener('resize', onResize, { passive: true });

  return {
    update(nextComments, nextSettings) {
      const nextPlayer = page.querySelector(SEL.player);
      const nextVideo = nextPlayer?.querySelector('video');
      const nextProgress = nextPlayer?.querySelector(PROGRESS);
      const inputsChanged = comments !== nextComments || settings !== nextSettings;
      const bindingsChanged = player !== nextPlayer || video !== nextVideo || progress !== nextProgress;
      comments = nextComments;
      settings = nextSettings;
      if (bindingsChanged) {
        for (const [event, listener] of binding) video?.removeEventListener(event, listener);
        video = nextVideo;
        player = nextPlayer;
        progress = nextProgress;
        for (const [event, listener] of binding) video?.addEventListener(event, listener, { passive: true });
      }
      refresh(inputsChanged || bindingsChanged);
    },
    destroy() {
      for (const [event, listener] of binding) video?.removeEventListener(event, listener);
      window.removeEventListener('resize', onResize);
      onResize.cancel();
      hideTimed();
      heatmap?.remove();
    },
  };
}
