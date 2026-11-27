import { SEL } from '../../core/constants.js';
import { Codes, logError } from '../../core/debug.js';
import { t } from '../../i18n/index.js';
import { showToast } from '../../ui/toast.js';
import { debounce, isOwnNode } from '../../utils/dom.js';
import { createChatCapture } from './chat.js';
import { createChatView } from './chat-view.js';
import { createCommentsView } from './comments-view.js';
import { commentSection, extractComments, scrollForComments } from './extract.js';
import { createPanel, createToggle } from './panel.js';
import { createPlayerOverlays } from './player-overlays.js';
import { createTranscriptView } from './transcript-view.js';
import { nativeTranscriptButton, readTranscript, transcriptRoot } from './transcript.js';

const WATCH = 'ytd-watch-flexy, ytd-watch-grid';
const CHANNEL = 'ytd-browse[page-subtype="channels"], ytd-browse';
const CHANNEL_PATH = /^\/(?:@[^/]+|(?:channel|c|user)\/[^/]+)(?:\/|$)/u;
const COMMENT_HEADER = 'ytd-comments-header-renderer, #header';
const CHANNEL_HEADER = '#page-header, #header';
const WATCH_HEADER = 'ytd-watch-metadata, #above-the-fold';

const VIEWS = { comments: createCommentsView, transcript: createTranscriptView, chat: createChatView };

function visible(node) {
  return node && !node.closest('[hidden]') && node.getClientRects().length > 0
    && getComputedStyle(node).visibility !== 'hidden';
}

export function resolvePage(root, href) {
  const url = new URL(href);
  const watch = url.pathname === '/watch';
  const id = watch ? url.searchParams.get('v') : url.pathname.match(CHANNEL_PATH)?.[0].replace(/\/$/u, '');
  if (!id) return null;
  const manager = root.querySelector(SEL.pageManager);
  const page = manager && [...manager.querySelectorAll(watch ? WATCH : CHANNEL)].find((node) => {
    if (node.closest('[hidden]')) return false;
    const loaded = watch && node.getAttribute('video-id');
    return !loaded || loaded === id;
  });
  return page ? { page, id, watch } : null;
}

function recordsMatch(previous, next) {
  return previous.length === next.length && previous.every((record, index) => {
    const replacement = next[index];
    return Object.keys(record).every((key) => record[key] === replacement[key]);
  });
}

function nativeChanges(records) {
  return records.some(({ target, type, addedNodes, removedNodes }) => !isOwnNode(target)
    && (type !== 'childList' || [...addedNodes, ...removedNodes].some((node) => !isOwnNode(node))));
}

export function createCommentPage({ page, id, watch }, panelState, cache, transcripts) {
  let settings;
  let comments = [];
  let commentNodes = new Map();
  let section;
  let sectionVisible = false;
  let commentsObserver;
  let transcript;
  let transcriptObserver;
  let segments = [];
  let canOpenTranscript = false;
  let chat;
  let messages = [];
  let chatSequence = 0;
  let duration = Infinity;
  let overlays;
  let toggle;
  let panel;
  let loadTimer;
  let loading = false;
  let commentError = false;
  let transcriptError = false;
  let cacheError = false;
  let snapshotPending = false;
  let exhausted = false;
  let seeded = false;

  function cacheReport(error) {
    if (cacheError) return;
    cacheError = true;
    logError(Codes.COMMENTKIT_CACHE, 'comment cache failed', { error });
    showToast(t('commentKit.cacheFailed'), { type: 'error' });
  }

  function syncPanel() {
    if (!panel) return;
    panel.update({
      settings, watch, comments, commentNodes, duration, segments, canOpenTranscript,
      messages, chatSequence, chatAvailable: chat?.available, chatPaused: chat?.paused,
      canLoadComments: sectionVisible && !exhausted, loading, commentError,
    });
  }

  function writeCache() {
    if (!snapshotPending || !settings.cache) return;
    snapshotPending = false;
    try {
      if (cache.put(id, comments) === false) cacheReport('storage unavailable');
    } catch (error) {
      cacheReport(error);
    }
  }

  const saveSnapshot = debounce(writeCache, 1000);

  function refreshComments(force = false) {
    if (!section) return;
    try {
      const previousError = commentError;
      const { comments: next, nodes } = extractComments(section, watch ? id : null, settings.includeReplies);
      commentError = false;
      const changed = !recordsMatch(comments, next);
      if (next.length || !seeded || force) {
        seeded = false;
        if (changed) {
          comments = next;
          if (settings.cache && watch) {
            snapshotPending = true;
            saveSnapshot();
          }
          syncOverlays();
        }
        if (changed || commentNodes.size !== nodes.size
            || [...nodes].some(([key, node]) => commentNodes.get(key) !== node)) commentNodes = nodes;
      }
      if (changed && next.length) exhausted = false;
      if (changed || previousError || panel) syncPanel();
    } catch (error) {
      if (!commentError) {
        logError(Codes.COMMENTKIT_EXTRACT, 'comment collection failed', { error });
        showToast(t('commentKit.loadFailed'), { type: 'error' });
      }
      commentError = true;
      syncPanel();
    }
  }

  function endLoading() {
    clearTimeout(loadTimer);
    loading = false;
    syncPanel();
  }

  function loadComments() {
    if (!section || loading) return;
    loading = true;
    syncPanel();
    const before = comments.length;
    scrollForComments(section);
    let attempts = 0;
    function poll() {
      refreshComments();
      if (comments.length > before) return endLoading();
      if (++attempts < 5) loadTimer = setTimeout(poll, 450);
      else {
        exhausted = true;
        endLoading();
      }
    }
    loadTimer = setTimeout(poll, 450);
  }

  function getTranscript() {
    if (!transcript) return;
    try {
      const { language, segments: current } = readTranscript(transcript);
      transcriptError = false;
      const cached = transcripts.get(id, language);
      if (current.length && (!cached || !recordsMatch(cached, current))) transcripts.put(id, language, current);
      const next = current.length ? transcripts.get(id, language) : cached || [];
      if (recordsMatch(segments, next)) return;
      segments = next;
      syncPanel();
    } catch (error) {
      if (transcriptError) return;
      transcriptError = true;
      logError(Codes.COMMENTKIT_EXTRACT, 'transcript collection failed', { error });
      showToast(t('commentKit.loadFailed'), { type: 'error' });
    }
  }

  const scanComments = debounce(refreshComments, 250);
  const scanTranscript = debounce(getTranscript, 150);

  function bindComments() {
    const next = commentSection(page);
    sectionVisible = Boolean(visible(next));
    if (next === section) return;
    commentsObserver?.disconnect();
    scanComments.cancel();
    section = next;
    exhausted = false;
    if (!section) {
      if (commentNodes.size) commentNodes = new Map();
      return;
    }
    commentsObserver = new MutationObserver((records) => { if (nativeChanges(records)) scanComments(); });
    commentsObserver.observe(section, { childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ['hidden', 'href', 'src'] });
    if (!seeded) refreshComments();
  }

  function bindTranscript() {
    const next = watch && settings.transcripts ? transcriptRoot(page) : null;
    canOpenTranscript = Boolean(watch && settings.transcripts && nativeTranscriptButton(page));
    if (next === transcript) return;
    transcript?.removeEventListener('change', scanTranscript);
    transcriptObserver?.disconnect();
    scanTranscript.cancel();
    transcript = next;
    transcriptError = false;
    if (!transcript) {
      if (!settings.transcripts) segments = [];
      return;
    }
    transcript.addEventListener('change', scanTranscript, { passive: true });
    transcriptObserver = new MutationObserver((records) => { if (nativeChanges(records)) scanTranscript(); });
    transcriptObserver.observe(transcript, { childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ['aria-selected'] });
    getTranscript();
  }

  function openTranscript() {
    const native = nativeTranscriptButton(page);
    if (native) native.click();
    else showToast(t('commentKit.noTranscript'), { type: 'info' });
  }

  function syncChat() {
    if (watch && settings.liveChat) {
      chat ||= createChatCapture(page, (added) => {
        chatSequence += added;
        messages = chat.items();
        syncPanel();
      }, id);
      chat.scan();
    } else if (chat) {
      chat.destroy();
      chat = null;
      messages = [];
    }
  }

  function syncOverlays() {
    if (!watch) return;
    overlays ||= createPlayerOverlays(page, (value) => {
      duration = Number.isFinite(value) ? value : Infinity;
      syncPanel();
    });
    overlays.update(comments, settings);
  }

  function openChanged(open, restoreFocus = true) {
    panelState.setOpen(open);
    syncChrome();
    if (open && restoreFocus) panel?.focus();
    else if (restoreFocus) toggle?.focus();
  }

  const context = {
    page, id, openTranscript,
    refreshComments: () => { exhausted = false; refreshComments(true); },
    loadComments,
    setChatPaused(paused) { chat?.setPaused(paused); syncPanel(); },
    clearChat() { chat?.clear(); },
  };

  function syncChrome() {
    const nativeHeader = section?.querySelector(COMMENT_HEADER) || section;
    const anchor = sectionVisible && visible(nativeHeader) ? nativeHeader
      : [...page.querySelectorAll(watch ? WATCH_HEADER : CHANNEL_HEADER)].find(visible) || page;
    toggle ||= createToggle(() => openChanged(!panelState.open));
    if (toggle.parentElement !== anchor) {
      if (anchor === page) anchor.prepend(toggle);
      else anchor.append(toggle);
    }
    const expanded = String(panelState.open);
    if (toggle.getAttribute('aria-expanded') !== expanded) toggle.setAttribute('aria-expanded', expanded);
    if (!panelState.open) {
      panel?.destroy();
      panel = null;
      return;
    }
    panel ||= createPanel({
      close: () => openChanged(false),
      makeView: (source, announce) => VIEWS[source](context, announce),
    });
    const column = watch && page.querySelector(SEL.secondaryInner);
    const dock = visible(column) && window.innerWidth > 760;
    const host = dock ? column : page;
    panel.node.classList.toggle('yp-ck-fixed', !dock);
    if (panel.node.parentElement !== host) host.prepend(panel.node);
    syncPanel();
  }

  const resize = debounce(syncChrome, 150);
  window.addEventListener('resize', resize, { passive: true });

  return {
    scan(next) {
      const repliesChanged = settings && settings.includeReplies !== next.includeReplies;
      if (!settings && next.cache && watch) {
        try {
          const cached = cache.get(id);
          if (cached) {
            comments = next.includeReplies ? cached : cached.filter((comment) => !comment.isReply);
            seeded = true;
          }
        } catch (error) {
          cacheReport(error);
        }
      }
      settings = next;
      bindComments();
      if (repliesChanged) refreshComments(true);
      bindTranscript();
      syncChat();
      syncOverlays();
      syncChrome();
    },
    relocalize() {
      toggle?.remove();
      toggle = null;
      panel?.destroy();
      panel = null;
      syncChrome();
    },
    destroy(persist = false) {
      clearTimeout(loadTimer);
      window.removeEventListener('resize', resize);
      resize.cancel();
      scanComments.cancel();
      scanTranscript.cancel();
      saveSnapshot.cancel();
      if (persist) writeCache();
      commentsObserver?.disconnect();
      transcriptObserver?.disconnect();
      transcript?.removeEventListener('change', scanTranscript);
      chat?.destroy();
      overlays?.destroy();
      panel?.destroy();
      toggle?.remove();
    },
  };
}
