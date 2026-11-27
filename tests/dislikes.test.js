import test from 'node:test';
import assert from 'node:assert/strict';
import { SEL } from '../src/core/constants.js';
import { createVoteFetcher } from '../src/features/dislikes/api.js';
import { createVoteCache } from '../src/features/dislikes/cache.js';
import { createDislikesEngine } from '../src/features/dislikes/engine.js';
import { formatCount, ratingShare, ratingTooltip } from '../src/features/dislikes/format.js';
import { createVoteSession } from '../src/features/dislikes/session.js';
import { countPlacement, shortsVideoId, watchVideoId } from '../src/features/dislikes/targets.js';
import { createLikeTextOverride } from '../src/features/dislikes/watch.js';
import { findShortsTarget } from '../src/features/dislikes/shorts.js';

const firstId = 'dQw4w9WgXcQ';
const secondId = 'jNQXAC9IVRw';
const votes = { likes: 313_000, dislikes: 2_450, viewCount: 900_000, deleted: false };
const payload = {
  ...votes,
  id: firstId,
  dateCreated: '2024-01-01T00:00:00Z',
  rawLikes: 700,
  rawDislikes: 13,
  rating: 4.97,
};

test('vote fetch uses one anonymous GET with an encoded video id and an 8-second timeout', async () => {
  const rawId = 'video&extra=1?';
  const fetchVotes = createVoteFetcher(async (request) => {
    assert.equal(request.url, 'https://returnyoutubedislikeapi.com/votes?videoId=video%26extra%3D1%3F');
    assert.equal(request.method, 'GET');
    assert.equal(request.anonymous, true);
    assert.equal(request.timeout, 8000);
    return { ...payload, id: rawId };
  });
  assert.deepEqual(await fetchVotes(rawId), votes);
});

test('vote fetch returns null for missing data and rejects unrelated or invalid payloads', async () => {
  for (const response of [null, { ...payload, id: secondId }, { ...payload, dislikes: null },
    { ...payload, likes: -1 }, { ...payload, likes: '12' }]) {
    assert.equal(await createVoteFetcher(async () => response)(firstId), null);
  }
  const zero = { ...payload, likes: 0, dislikes: 0, viewCount: 0, deleted: true };
  assert.deepEqual(await createVoteFetcher(async () => zero)(firstId), {
    likes: 0, dislikes: 0, viewCount: 0, deleted: true,
  });
});

test('vote fetch distinguishes 404 from other HTTP failures', async () => {
  for (const status of [400, 404, 429, 500]) {
    const fetchVotes = createVoteFetcher(async () => {
      throw Object.assign(new Error(`HTTP ${status}`), { status });
    });
    if (status === 404) assert.equal(await fetchVotes(firstId), null);
    else await assert.rejects(fetchVotes(firstId), { status });
  }
});

test('vote fetch aborts the transport when the active request is cancelled', async () => {
  const controller = new AbortController();
  let calls = 0;
  let aborted = false;
  const fetchVotes = createVoteFetcher(({ onAbort }) => new Promise((resolve, reject) => {
    calls += 1;
    onAbort(() => {
      aborted = true;
      reject(new Error('Aborted'));
    });
  }));
  const pending = fetchVotes(firstId, { signal: controller.signal });
  controller.abort();
  assert.equal(await pending, null);
  assert.equal(aborted, true);
  assert.equal(await fetchVotes(firstId, { signal: controller.signal }), null);
  assert.equal(calls, 1);
});

test('cached votes expire after 24 hours and unavailable results expire after five minutes', () => {
  let time = 0;
  const cache = createVoteCache(() => time);
  cache.set(firstId, votes);
  cache.set(secondId, null);
  time = 5 * 60_000 - 1;
  assert.equal(cache.get(secondId), null);
  time += 1;
  cache.prune();
  assert.equal(cache.get(secondId), undefined);
  time = 24 * 60 * 60_000 - 1;
  assert.equal(cache.get(firstId), votes);
  time += 1;
  assert.equal(cache.get(firstId), undefined);
});

test('cache evicts the least recently used result when it exceeds 300 entries', () => {
  const cache = createVoteCache(() => 0);
  for (let id = 0; id < 300; id += 1) cache.set(id, votes);
  assert.equal(cache.get(0), votes);
  cache.set(300, votes);
  assert.equal(cache.get(1), undefined);
  assert.equal(cache.get(0), votes);
  assert.equal(cache.get(300), votes);
});

test('count display follows each format and locale and ignores invalid numbers', () => {
  assert.equal(formatCount(1_200, 'compactShort', 'en'), '1.2K');
  assert.equal(formatCount(1_200, 'compactLong', 'en'), '1.2 thousand');
  assert.equal(formatCount(1_200, 'standard', 'fr'), '1\u202f200');
  assert.equal(formatCount(0, 'standard', 'en'), '0');
  for (const invalid of [undefined, null, NaN, -1, Infinity, '1000']) {
    assert.equal(formatCount(invalid, 'standard', 'en'), '');
  }
});

test('rating share preserves exact ratios, centers zero votes and suppresses missing data', () => {
  assert.equal(ratingShare({ likes: 2, dislikes: 1 }), 2 / 3);
  assert.equal(ratingShare({ likes: 0, dislikes: 0 }), 0.5);
  assert.equal(ratingShare({ likes: 0, dislikes: 10 }), 0);
  assert.equal(ratingShare({ likes: 5, dislikes: 0 }), 1);
  assert.equal(ratingShare({ likes: Number.MAX_VALUE, dislikes: Number.MAX_VALUE }), 0.5);
  assert.equal(ratingShare({ likes: -1, dislikes: 0 }), null);
  assert.equal(ratingShare(null), null);
});

test('rating tooltip selects the configured sides and displays percentages to one decimal', () => {
  const translate = (key, data) => {
    if (key === 'dislikes.noVotes') return 'No votes yet';
    if (key === 'dislikes.tooltip.likes') return `Likes ${data.count}`;
    if (key === 'dislikes.tooltip.dislikes') return `Dislikes ${data.count}`;
    if (key === 'dislikes.tooltip.percent') return `${data.count} (${data.percent})`;
    return key;
  };
  const votes = { likes: 2, dislikes: 1 };
  const config = { format: 'standard', showPercent: true };
  const cases = {
    dashLike: 'Likes 2 (66.7%) — Dislikes 1 (33.3%)',
    dashDislike: 'Dislikes 1 (33.3%) — Likes 2 (66.7%)',
    both: 'Likes 2 (66.7%)\nDislikes 1 (33.3%)',
    onlyLike: 'Likes 2 (66.7%)',
    onlyDislike: 'Dislikes 1 (33.3%)',
  };
  for (const [tooltipMode, expected] of Object.entries(cases)) {
    assert.equal(ratingTooltip(votes, { ...config, tooltipMode }, 'en', translate), expected);
  }
  assert.equal(ratingTooltip(votes, { ...config, tooltipMode: 'onlyLike', showPercent: false }, 'en', translate), 'Likes 2');
  assert.equal(ratingTooltip({ likes: 0, dislikes: 0 }, config, 'en', translate), 'No votes yet');
  assert.equal(ratingTooltip(null, config, 'en', translate), '');
});

test('watch selection rejects stale player or page metadata during SPA navigation', () => {
  const url = new URL(`https://www.youtube.com/watch?v=${firstId}`);
  assert.equal(watchVideoId(url, firstId, firstId), firstId);
  assert.equal(watchVideoId(url, null, null), firstId);
  assert.equal(watchVideoId(url, secondId, firstId), null);
  assert.equal(watchVideoId(url, firstId, secondId), null);
  assert.equal(watchVideoId(new URL('https://www.youtube.com/watch'), firstId), firstId);
  assert.equal(watchVideoId(new URL('https://www.youtube.com/watch?v=bad'), firstId), null);
  assert.equal(watchVideoId(new URL(`https://www.youtube.com/results?v=${firstId}`), firstId), null);
});

test('the disabled feature accepts scan and navigate hooks without touching the transport', () => {
  let requests = 0;
  const engine = createDislikesEngine({
    fetchVotes: async () => { requests += 1; return votes; },
    onRenderFailure: (error) => { throw error; },
  });
  engine.apply({ enabled: false });
  engine.scan();
  engine.navigate();
  assert.equal(requests, 0);
});

test('a retained hidden Watch player cannot block requests for the active Watch page', (context) => {
  const activePlayer = { getVideoData: () => ({ video_id: firstId }), closest: () => null };
  const hiddenPlayer = { getVideoData: () => ({ video_id: secondId }), closest: () => ({}) };
  const activePage = {
    getAttribute: (name) => name === 'video-id' ? firstId : null,
    querySelectorAll: (selector) => selector === SEL.player ? [activePlayer] : [],
  };
  const activeMetadata = {
    closest: (selector) => selector === 'ytd-watch-flexy' ? activePage : null,
    querySelector: () => null,
  };
  const hiddenMetadata = { closest: () => ({}) };
  const scope = {
    querySelector: (selector) => selector === SEL.player ? hiddenPlayer : null,
    querySelectorAll: (selector) => {
      if (selector === SEL.watchMeta) return [hiddenMetadata, activeMetadata];
      return selector === SEL.player ? [hiddenPlayer, activePlayer] : [];
    },
  };
  const document = Object.assign(new EventTarget(), {
    querySelector: (selector) => {
      if (selector === SEL.pageManager) return scope;
      return selector === SEL.player ? hiddenPlayer : null;
    },
  });
  const globals = {
    document,
    location: new URL(`https://www.youtube.com/watch?v=${firstId}`),
    window: new EventTarget(),
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
  };
  Object.assign(globalThis, globals);
  const requests = [];
  const engine = createDislikesEngine({
    fetchVotes: async (id) => { requests.push(id); return null; },
    onRenderFailure: (error) => { throw error; },
  });
  context.after(() => {
    engine.apply({ enabled: false });
    for (const key of Object.keys(globals)) delete globalThis[key];
  });
  engine.apply({ enabled: true });
  assert.deepEqual(requests, [firstId]);
});

test('Shorts selection follows the active reel even before the address bar updates', () => {
  const url = new URL(`https://www.youtube.com/shorts/${firstId}?feature=share`);
  assert.equal(shortsVideoId(url, `/shorts/${secondId}?from=reel`), secondId);
  assert.equal(shortsVideoId(url, null, secondId), secondId);
  assert.equal(shortsVideoId(url, `/shorts/${secondId}`, firstId), null);
  assert.equal(shortsVideoId(url, null), firstId);
  assert.equal(shortsVideoId(url, `https://example.test/shorts/${secondId}`), firstId);
  assert.equal(shortsVideoId(url, '/shorts/not-a-video-id'), firstId);
  assert.equal(shortsVideoId(new URL('https://www.youtube.com/'), `/shorts/${secondId}`), null);
});

test('count placement prefers the native control and only Shorts gets a read-only fallback', () => {
  const button = {};
  const actionBar = {};
  assert.deepEqual(countPlacement(button, actionBar), { host: button, readOnly: false });
  assert.deepEqual(countPlacement(null, actionBar), { host: actionBar, readOnly: true });
  assert.equal(countPlacement(null, undefined), null);
});

test('Shorts places its estimate with the native dislike or Like control', () => {
  const like = {};
  const button = { matches: (selector) => selector === 'button' };
  const dislike = { matches: () => false, querySelector: () => button };
  const controls = new Map([['like-button-view-model, #like-button', like]]);
  const actionBar = { querySelector: (selector) => controls.get(selector) };
  const reel = {
    querySelector: (selector) => selector === SEL.shortsActionBar ? actionBar : null,
    getAttribute: () => firstId,
  };
  const page = { querySelector: () => reel };
  const url = new URL(`https://www.youtube.com/shorts/${firstId}`);

  assert.deepEqual(findShortsTarget(page, url).placement, {
    host: like, readOnly: true, shorts: true, prepend: false,
  });
  controls.set('dislike-button-view-model, #dislike-button', dislike);
  assert.deepEqual(findShortsTarget(page, url).placement, {
    host: dislike, readOnly: false, shorts: true, prepend: false,
  });
  controls.clear();
  assert.deepEqual(findShortsTarget(page, url).placement, {
    host: actionBar, readOnly: true, shorts: true, prepend: true,
  });
});

test('restore the exact native like text when reformatting is disabled', () => {
  const override = createLikeTextOverride();
  const native = { data: ' 313K ' };
  override.set(native, '313,000');
  override.set(native, '313 thousand');
  assert.equal(native.data, '313 thousand');
  override.restore();
  assert.equal(native.data, ' 313K ');
});

test('native edits survive cleanup and become the next restoration baseline', () => {
  const override = createLikeTextOverride();
  const native = { data: '313K' };
  override.set(native, '313,000');
  native.data = '314K';
  override.set(native, '313,000');
  override.restore();
  assert.equal(native.data, '314K');
  override.set(native, '313,000');
  native.data = '315K';
  override.restore();
  assert.equal(native.data, '315K');
});

test('vote session does not request while inactive and shares cached results across page changes', async () => {
  const ids = [];
  const session = createVoteSession({ fetchVotes: async (id) => { ids.push(id); return votes; } });
  await session.update(null);
  assert.deepEqual(ids, []);
  await Promise.all([session.update(firstId), session.update(firstId)]);
  await session.update(null);
  assert.equal(await session.update(firstId), votes);
  assert.deepEqual(ids, [firstId]);
});

test('vote session discards an older result and aborts it when the active video changes', async () => {
  let finishFirst;
  let firstSignal;
  const session = createVoteSession({
    fetchVotes: (id, { signal }) => {
      if (id === secondId) return Promise.resolve(votes);
      firstSignal = signal;
      return new Promise((resolve) => { finishFirst = resolve; });
    },
  });
  const previous = session.update(firstId);
  assert.equal(await session.update(secondId), votes);
  assert.equal(firstSignal.aborted, true);
  finishFirst({ ...votes, dislikes: 1 });
  assert.equal(await previous, undefined);
});

test('vote session reports a failure once and cools down across uncached ids after 429', async () => {
  let time = 0;
  let calls = 0;
  const failures = [];
  const session = createVoteSession({
    fetchVotes: async () => {
      calls += 1;
      if (calls === 2) throw Object.assign(new Error('HTTP 429'), { status: 429 });
      return votes;
    },
    now: () => time,
    onFailure: (error) => failures.push(error.status),
  });
  const thirdId = 'eY52Zsg-KVI';
  assert.equal(await session.update(firstId), votes);
  await Promise.all([session.update(secondId), session.update(secondId)]);
  assert.equal(await session.update(thirdId), undefined);
  assert.equal(await session.update(firstId), votes);
  assert.equal(calls, 2);
  assert.deepEqual(failures, [429]);
  time = 60_000;
  assert.equal(await session.update(thirdId), votes);
  assert.equal(calls, 3);
});

test('vote session caches negative and network failures so scans cannot flood logs', async () => {
  const failures = [];
  let calls = 0;
  const session = createVoteSession({
    fetchVotes: async (id) => {
      calls += 1;
      if (id === firstId) return null;
      throw new Error('Timeout');
    },
    onFailure: (error) => failures.push(error.message),
  });
  for (const id of [firstId, secondId, firstId, secondId]) assert.equal(await session.update(id), null);
  assert.equal(calls, 2);
  assert.deepEqual(failures, ['No vote data', 'Timeout']);
});
