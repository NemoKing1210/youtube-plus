import test from 'node:test';
import assert from 'node:assert/strict';
import { SEL } from '../src/core/constants.js';
import { defaultsOf, normalizeFields } from '../src/core/schema.js';
import {
  canArmAdvance,
  createShortsEngine,
  isShortsPath,
  shouldSkip,
} from '../src/features/shorts/engine.js';
import { shortsFields, shortsTab } from '../src/features/shorts/settings.js';

test('Shorts defaults opt out of both behaviors with the master switch', () => {
  assert.deepEqual(defaultsOf(shortsFields()), {
    enabled: false,
    autoScroll: true,
    scrollDelay: 1,
    skipLong: true,
    maxDuration: 60,
  });
});

test('Shorts settings clamp delay and duration', () => {
  const fields = shortsFields();
  const low = normalizeFields(fields, { scrollDelay: -1, maxDuration: 4 });
  assert.equal(low.scrollDelay, 0);
  assert.equal(low.maxDuration, 5);
  const high = normalizeFields(fields, { scrollDelay: 11, maxDuration: 601 });
  assert.equal(high.scrollDelay, 10);
  assert.equal(high.maxDuration, 600);
});

test('Shorts settings show the delay for either behavior', () => {
  const [autoScroll, longVideos] = shortsTab().sections;
  const delay = autoScroll.controls.find(({ path }) => path === 'scrollDelay');
  const limit = longVideos.controls.find(({ path }) => path === 'maxDuration');
  assert.equal(delay.showIf({ enabled: false, autoScroll: true, skipLong: true }), false);
  assert.equal(delay.showIf({ enabled: true, autoScroll: false, skipLong: false }), false);
  assert.equal(delay.showIf({ enabled: true, autoScroll: true, skipLong: false }), true);
  assert.equal(delay.showIf({ enabled: true, autoScroll: false, skipLong: true }), true);
  assert.equal(limit.showIf({ enabled: true, autoScroll: true, skipLong: false }), false);
  assert.equal(limit.showIf({ enabled: true, autoScroll: false, skipLong: true }), true);
});

test('the Shorts guard accepts the feed and individual Short routes', () => {
  for (const path of ['/shorts', '/shorts/', '/shorts/AbCd_012-3']) {
    assert.equal(isShortsPath(path), true, path);
  }
  for (const path of ['/watch', '/shorts-related', '/channel/user/shorts', '/shorts/id/extra']) {
    assert.equal(isShortsPath(path), false, path);
  }
});

test('only a finite duration above a positive limit qualifies for skipping', () => {
  assert.equal(shouldSkip(5.1, 5), true);
  for (const [duration, limit] of [[5, 5], [0, 5], [NaN, 5], [Infinity, 5], [90, -1], [90, 0]]) {
    assert.equal(shouldSkip(duration, limit), false);
  }
});

test('advance needs an enabled behavior and an unhandled current reel with no pending timer', () => {
  const eligible = { enabled: true, current: true, handled: false, pending: false };
  assert.equal(canArmAdvance(eligible), true);
  for (const state of [{ enabled: false }, { current: false }, { handled: true }, { pending: true }]) {
    assert.equal(canArmAdvance({ ...eligible, ...state }), false);
  }
});

function makeVideo(duration = 30) {
  return Object.assign(new EventTarget(), {
    paused: false,
    ended: false,
    seeking: false,
    duration,
    currentTime: 0,
    currentSrc: 'blob:short',
  });
}

function harness(t, { duration, config, playerDuration, hiddenRoot } = {}) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let video = makeVideo(duration);
  let reel = {
    closest: () => null,
    querySelector: (selector) => {
      if (selector === SEL.shortsVideo) return video;
      return playerDuration === undefined ? null : { getDuration: () => playerDuration };
    },
  };
  let advances = 0;
  let showNextButton = true;
  const nextButton = { click: () => { advances += 1; }, getAttribute: () => null };
  const root = {
    closest: () => null,
    querySelectorAll: (selector) => selector === SEL.shortsActive ? [reel] : [],
    querySelector: (selector) => {
      if (selector === SEL.shortsActive) return reel;
      if (selector === SEL.shortsNext && showNextButton) return nextButton;
      return null;
    },
  };
  const scope = {
    querySelectorAll: (selector) => selector === SEL.shortsRoot
      ? [hiddenRoot, root].filter(Boolean) : [],
  };
  const location = { pathname: '/shorts/first', href: 'https://www.youtube.com/shorts/first' };
  const window = new EventTarget();
  Object.assign(globalThis, {
    location,
    window,
    document: {
      querySelector: (selector) => {
        if (selector === SEL.pageManager) return scope;
        return selector === SEL.shortsRoot ? hiddenRoot || root : null;
      },
    },
  });
  const shorts = createShortsEngine((error) => { throw error; });
  const apply = (overrides) => shorts.applyShortsSettings({
    ...defaultsOf(shortsFields()), enabled: true, ...config, ...overrides,
  });
  t.after(() => {
    apply({ enabled: false });
    for (const key of ['location', 'window', 'document']) delete globalThis[key];
  });
  return {
    ...shorts,
    apply,
    location,
    window,
    nextButton,
    get video() { return video; },
    get advances() { return advances; },
    removeNextButton(nextReel) {
      showNextButton = false;
      reel.nextElementSibling = nextReel;
    },
    changeShort(id, { reuse = false } = {}) {
      location.pathname = `/shorts/${id}`;
      location.href = `https://www.youtube.com${location.pathname}`;
      if (!reuse) {
        video = makeVideo();
        reel = { ...reel };
      }
    },
    end() {
      video.paused = true;
      video.ended = true;
      video.dispatchEvent(new Event('ended'));
    },
    tick(ms = 0) { t.mock.timers.tick(ms); },
  };
}

test('the looping fallback and ended event share a single delayed advance', (t) => {
  const page = harness(t, { config: { scrollDelay: 2 } });
  page.apply();
  page.video.currentTime = 29.76;
  page.video.dispatchEvent(new Event('timeupdate'));
  page.shortsScan();
  page.end();
  page.tick(1999);
  assert.equal(page.advances, 0);
  page.tick(1);
  assert.equal(page.advances, 1);
  page.end();
  page.tick(2000);
  assert.equal(page.advances, 1);
});

test('the current Shorts page binds even when YouTube retains a hidden page', (t) => {
  const hiddenRoot = { closest: () => ({}), querySelector: () => null };
  const page = harness(t, { hiddenRoot });
  page.apply();
  page.end();
  page.tick(1000);
  assert.equal(page.advances, 1);
});

test('manual wheel navigation cancels the pending advance until a new reel is active', (t) => {
  const page = harness(t);
  page.apply();
  page.end();
  page.window.dispatchEvent(new Event('wheel'));
  page.end();
  page.tick(1000);
  assert.equal(page.advances, 0);

  page.changeShort('second');
  page.shortsNavigate();
  page.end();
  page.tick(1000);
  assert.equal(page.advances, 1);
});

test('a URL change invalidates the pending advance before the navigation hook', (t) => {
  const page = harness(t);
  page.apply();
  page.end();
  page.changeShort('second', { reuse: true });
  page.tick(1000);
  assert.equal(page.advances, 0);

  page.shortsNavigate();
  page.video.dispatchEvent(new Event('loadedmetadata'));
  page.end();
  page.tick(1000);
  assert.equal(page.advances, 1);
});

test('master and end switches cancel an armed advance', (t) => {
  const page = harness(t);
  page.apply();
  page.end();
  page.apply({ autoScroll: false });
  page.tick(1000);
  assert.equal(page.advances, 0);

  page.apply();
  page.end();
  page.apply({ enabled: false });
  page.end();
  page.tick(1000);
  assert.equal(page.advances, 0);
});

test('a long paused video is skipped once after playback starts and the delay elapses', (t) => {
  const page = harness(t, { duration: 90, config: { scrollDelay: 2, autoScroll: false } });
  page.video.paused = true;
  page.apply();
  page.tick(2000);
  page.video.dispatchEvent(new Event('durationchange'));
  assert.equal(page.advances, 0);

  page.video.paused = false;
  page.video.dispatchEvent(new Event('play'));
  page.tick(1900);
  page.video.dispatchEvent(new Event('durationchange'));
  assert.equal(page.advances, 0);
  page.tick(100);
  assert.equal(page.advances, 1);
  page.video.dispatchEvent(new Event('durationchange'));
  page.tick(2000);
  assert.equal(page.advances, 1);
});

test('changing the maximum duration cancels and re-arms a skip for the active reel', (t) => {
  const page = harness(t, { duration: 90 });
  page.apply();
  page.apply({ maxDuration: 120 });
  page.tick(1000);
  assert.equal(page.advances, 0);

  page.apply({ maxDuration: 30 });
  page.tick(1000);
  assert.equal(page.advances, 1);
});

test('the active player supplies fresh duration when the video has no metadata', (t) => {
  const page = harness(t, { duration: NaN, playerDuration: 90 });
  page.apply();
  page.tick(1000);
  assert.equal(page.advances, 1);
});

test('a live duration cannot arm a skip from the player fallback', (t) => {
  const page = harness(t, { duration: Infinity, playerDuration: 90 });
  page.apply();
  page.tick(1000);
  assert.equal(page.advances, 0);
});

test('if a next button is absent, the next reel scrolls into view', (t) => {
  const page = harness(t, { config: { scrollDelay: 0 } });
  const scrolls = [];
  page.removeNextButton({
    matches: (selector) => selector.includes('ytd-reel-video-renderer'),
    scrollIntoView: (options) => scrolls.push(options),
  });
  page.apply();
  page.end();
  page.tick();
  assert.deepEqual(scrolls, [{ behavior: 'smooth', block: 'start' }]);
  assert.equal(page.advances, 0);
});

test('a disabled next button and a missing next reel leave the last Short in place', (t) => {
  const page = harness(t, { config: { scrollDelay: 0 } });
  page.nextButton.disabled = true;
  page.apply();
  page.end();
  page.tick();
  assert.equal(page.advances, 0);

  page.changeShort('second');
  page.removeNextButton();
  page.shortsNavigate();
  page.end();
  page.tick();
  assert.equal(page.advances, 0);
});
