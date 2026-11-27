import { SEL } from '../../core/constants.js';
import { logInfo } from '../../core/debug.js';
import { isOwnNode } from '../../utils/dom.js';

const SHORTS_PLAYER = '#shorts-player, #movie_player';
const REEL = 'ytd-reel-video-renderer, ytd-reel-video-renderer-cow';
const REEL_SLOT = '.reel-video-in-sequence-new';
const EDITABLE = 'input, select, textarea, [contenteditable]:not([contenteditable="false"])';
const NAVIGATION_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']);
const LOOP_END_WINDOW = 0.25;

export function isShortsPath(pathname) {
  return /^\/shorts(?:\/[^/]+)?\/?$/.test(pathname);
}

export function shouldSkip(duration, maxDuration) {
  return Number.isFinite(duration) && Number.isFinite(maxDuration) &&
    maxDuration > 0 && duration > maxDuration;
}

export function canArmAdvance({ enabled, current, handled, pending }) {
  return enabled && current && !handled && !pending;
}

function nextShort({ root, reel }) {
  const button = root.querySelector(SEL.shortsNext);
  if (button) {
    if (!button.disabled && button.getAttribute('aria-disabled') !== 'true') button.click();
    return;
  }

  const slot = reel.closest(REEL_SLOT);
  if (slot) {
    const next = slot.nextElementSibling;
    if (next?.querySelector(REEL)) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  let next = reel.nextElementSibling;
  while (next && !next.matches(REEL)) next = next.nextElementSibling;
  next?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function createShortsEngine(onError) {
  let config = null;
  let item = null;
  let pending = null;
  let watching = false;

  const protect = (operation, advancing = false) => (...args) => {
    try {
      operation(...args);
    } catch (error) {
      onError(error, advancing);
    }
  };

  function running() {
    return config?.enabled && (config.autoScroll || config.skipLong) && isShortsPath(location.pathname);
  }

  function locate() {
    const scope = document.querySelector(SEL.pageManager) ?? document;
    const root = [...scope.querySelectorAll(SEL.shortsRoot)].find((node) => !node.closest('[hidden]'));
    const reel = root && [...root.querySelectorAll(SEL.shortsActive)].find((node) => !node.closest('[hidden]'));
    const video = reel?.querySelector(SEL.shortsVideo);
    if (!video) return null;
    return { root, reel, video, player: reel.querySelector(SHORTS_PLAYER) };
  }

  function current() {
    if (!item || !running() || item.url !== location.href) return null;
    const active = locate();
    if (!active || active.reel !== item.reel || active.video !== item.video) return null;

    // A navigation may update the URL before the player switches its video.
    const expectedId = location.pathname.split('/')[2];
    const loadedId = active.player?.getVideoData?.()?.video_id;
    if (expectedId && loadedId) return expectedId === loadedId ? active : null;
    if (item.waitingForMetadata && item.source === active.video.currentSrc) return null;
    return active;
  }

  function cancelPending() {
    if (!pending) return;
    clearTimeout(pending.timer);
    pending = null;
  }

  function behaviorEnabled(reason) {
    return reason === 'end' ? config.autoScroll : config.skipLong;
  }

  function durationOf({ video, player }) {
    const { duration } = video;
    if (duration > 0) return duration;
    return player?.getDuration?.();
  }

  function eligibleToSkip(active) {
    if (!config.skipLong) return false;
    const duration = durationOf(active);
    if (!(duration > 0) && !item.loggedUnknownDuration) {
      item.loggedUnknownDuration = true;
      logInfo('shorts', 'duration unavailable for the active Short');
    }
    return shouldSkip(duration, config.maxDuration);
  }

  const fire = protect((request) => {
    if (pending !== request) return;
    pending = null;
    const active = current();
    if (!active || item !== request.item || !behaviorEnabled(request.reason)) return;

    const { video } = item;
    if (request.reason === 'skip') {
      if (!eligibleToSkip(active)) return;
      if (video.paused) {
        item.waitingToPlay = true;
        return;
      }
    } else if (video.paused && !video.ended) {
      return;
    }

    item.handled = true;
    nextShort(active);
  }, true);

  function arm(reason, active = current()) {
    if (!canArmAdvance({
      enabled: Boolean(config && behaviorEnabled(reason)),
      current: Boolean(active),
      handled: item?.handled,
      pending,
    })) return;

    const request = { item, reason, timer: 0 };
    request.timer = setTimeout(() => fire(request), config.scrollDelay * 1000);
    pending = request;
  }

  function checkSkip() {
    if (!item || item.handled) return;
    const active = current();
    if (!active || !eligibleToSkip(active)) {
      if (pending?.reason === 'skip') cancelPending();
      item.waitingToPlay = false;
    } else if (!item.waitingToPlay) {
      arm('skip', active);
    }
  }

  const mediaListeners = {
    ended: protect(() => {
      if (!config?.autoScroll || !item?.video.ended) return;
      const active = current();
      if (!active) return;
      if (pending?.reason === 'skip') cancelPending();
      arm('end', active);
    }),
    timeupdate: protect(() => {
      const video = item?.video;
      if (!config?.autoScroll || item?.handled || pending || !video || video.paused || video.seeking) return;
      if (Number.isFinite(video.duration) && video.duration > 0 &&
          video.currentTime >= video.duration - LOOP_END_WINDOW) arm('end');
    }),
    loadedmetadata: protect(() => {
      if (!item) return;
      item.waitingForMetadata = false;
      checkSkip();
    }),
    durationchange: protect(checkSkip),
    play: protect(() => {
      if (!item?.waitingToPlay) return;
      item.waitingToPlay = false;
      checkSkip();
    }),
  };

  const manualNavigation = protect((event) => {
    if (!item || item.handled || item.url !== location.href || isOwnNode(event.target)) return;
    if (event.type === 'keydown' &&
        (!NAVIGATION_KEYS.has(event.key) || event.target?.closest?.(EDITABLE))) return;
    cancelPending();
    item.handled = true;
  });
  const manualEvents = ['wheel', 'touchmove', 'keydown'];

  function releaseItem() {
    cancelPending();
    if (!item) return;
    for (const [event, listener] of Object.entries(mediaListeners)) {
      item.video.removeEventListener(event, listener);
    }
    item = null;
  }

  function teardown() {
    releaseItem();
    if (!watching) return;
    for (const event of manualEvents) window.removeEventListener(event, manualNavigation, true);
    watching = false;
  }

  function bindActive() {
    if (!running()) {
      teardown();
      return;
    }

    const active = locate();
    if (!active) {
      teardown();
      return;
    }
    if (!watching) {
      for (const event of manualEvents) {
        window.addEventListener(event, manualNavigation, { capture: true, passive: true });
      }
      watching = true;
    }

    const { reel, video } = active;
    const { href, pathname } = location;
    const reused = item?.reel === reel && item.video === video;
    if (reused && item.pathname === pathname) {
      if (item.url !== href) {
        // A URL change within the same Short cancels its pending action.
        if (pending || item.waitingToPlay) item.handled = true;
        cancelPending();
        item.url = href;
      }
      return;
    }

    const waitingForMetadata = reused && item.source === video.currentSrc;
    releaseItem();
    item = { reel, video, pathname, url: href, source: video.currentSrc, waitingForMetadata };
    for (const [event, listener] of Object.entries(mediaListeners)) {
      video.addEventListener(event, listener);
    }
  }

  const shortsScan = protect(() => {
    bindActive();
    checkSkip();
  });

  return {
    applyShortsSettings: protect((next) => {
      config = next;
      if (pending?.reason === 'end' && !config?.autoScroll) cancelPending();
      bindActive();
      checkSkip();
    }),
    shortsScan,
    shortsNavigate: shortsScan,
  };
}
