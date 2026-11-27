import { SEL } from '../../core/constants.js';
import { createDislikesRenderer } from './render.js';
import { createVoteSession } from './session.js';
import { findShortsTarget } from './shorts.js';
import { visibleChild } from './targets.js';
import { findWatchTarget } from './watch.js';

const PAGE_ATTRIBUTES = ['is-active', 'video-id', 'hidden'];

export function createDislikesEngine({ fetchVotes, onFailure, onRenderFailure }) {
  const session = createVoteSession({ fetchVotes, onFailure });
  const render = createDislikesRenderer();
  let cfg = null;
  let waiting = null;
  let observer = null;
  let observed = null;

  function observe(scope) {
    if (scope === observed) return;
    observer?.disconnect();
    observed = scope;
    if (!scope) return;
    observer ??= new MutationObserver(scan);
    observer.observe(scope, { subtree: true, attributes: true, attributeFilter: PAGE_ATTRIBUTES });
  }

  function sync() {
    let target = null;
    let observedPage = null;
    if (cfg?.enabled) {
      const url = new URL(location.href);
      const scope = document.querySelector(SEL.pageManager);
      if (url.pathname === '/watch') {
        const metadata = visibleChild(scope, SEL.watchMeta);
        observedPage = scope;
        target = findWatchTarget(metadata, url, scope);
      } else if (url.pathname.startsWith('/shorts/')) {
        const page = visibleChild(scope, SEL.shortsRoot);
        observedPage = page ?? scope;
        target = findShortsTarget(page, url);
      }
    }
    observe(observedPage);

    const result = session.update(target?.id ?? null);
    if (result instanceof Promise) {
      render(null, null, cfg);
      if (result !== waiting) {
        waiting = result;
        result.then(() => {
          if (waiting !== result) return;
          waiting = null;
          // Navigation, the player, and the action bar can all change during a request.
          scan();
        });
      }
    } else {
      waiting = null;
      render(target, result, cfg);
    }
  }

  function scan() {
    try {
      sync();
    } catch (error) {
      onRenderFailure(error);
    }
  }

  function apply(next) {
    if (next?.enabled && !cfg?.enabled) {
      document.addEventListener('loadedmetadata', scan, true);
      window.addEventListener('yt-player-updated', scan);
    } else if (!next?.enabled && cfg?.enabled) {
      document.removeEventListener('loadedmetadata', scan, true);
      window.removeEventListener('yt-player-updated', scan);
    }
    cfg = next;
    scan();
  }

  return { apply, scan, navigate: scan };
}
