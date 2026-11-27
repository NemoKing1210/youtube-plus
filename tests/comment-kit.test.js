import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultsOf, normalizeFields } from '../src/core/schema.js';
import { commentKitFields, commentKitTab } from '../src/features/commentKit/settings.js';
import { createPanelState } from '../src/features/commentKit/panel-state.js';
import { parseCount, parseReplyCount, parseTimestamp } from '../src/features/commentKit/parse.js';
import { normalizeComment, dedupeComments, extractComments, nativeTranslate } from '../src/features/commentKit/extract.js';
import { createCommentCache } from '../src/features/commentKit/cache.js';
import { filterComments, randomComment, sortComments, tallyOptions } from '../src/features/commentKit/search.js';
import { highlightSegments } from '../src/features/commentKit/highlight.js';
import { actionsFor, paginate } from '../src/features/commentKit/results.js';
import { buildTimedIndex, findTimedComments, heatmapBuckets, parseTimestamps } from '../src/features/commentKit/timestamps.js';
import { createTranscriptCache, normalizeSegment } from '../src/features/commentKit/transcript.js';
import { createChatBuffer, createChatCapture, filterChat, normalizeChat } from '../src/features/commentKit/chat.js';
import { exportFilename, toCSV, toJSON, toTXT } from '../src/features/commentKit/export.js';

const fresh = { author: '林', text: 'Sunrise at 0:05', order: 0 };
const reply = { author: 'Jo', text: 'Sunrise', order: 1, isReply: true, parentId: 'abc', likeText: '12', hasGif: true };
const popular = { author: 'Amina', text: 'SUNSET', order: 2, likeText: '2.4K', replyCount: 6, hasLink: true };
const comments = [fresh, reply, popular].map(normalizeComment);

test('old settings opt out of Comment Kit and valid preferences survive normalization', () => {
  assert.equal(defaultsOf(commentKitFields()).enabled, false);
  assert.equal(defaultsOf(commentKitFields()).pageSize, 50);
  assert.equal(normalizeFields(commentKitFields(), { pageSize: 999 }).pageSize, 200);
  assert.equal(normalizeFields(commentKitFields(), { theme: 'dark' }).theme, 'dark');
  assert.equal(commentKitTab().sections[1].showIf({ enabled: false }), false);
});

test('panel open state persists across controller recreation and ignores malformed stored state', () => {
  let stored = 'true';
  const create = () => createPanelState(() => stored, (value) => { stored = value; });
  const first = create();
  assert.equal(first.open, false);
  first.setOpen(true);
  assert.equal(create().open, true);
  first.setOpen(false);
  assert.equal(create().open, false);
});

test('counts support localized grouping, decimal suffixes and digits', () => {
  for (const [text, expected] of [
    ['1.2K', 1200], ['1,234', 1234], ['1 234', 1234], ['1,2 mil', 1200],
    ['1,2 тыс.', 1200], ['2.5万', 25000], ['１２万', 120000], ['١٫٥ ألف', 1500],
    ['1,2 Mio.', 1200000], ['loved by many', 0], ['99,99', 0], ['-15', 0],
  ]) assert.equal(parseCount(text), expected, text);
  assert.equal(parseReplyCount('２万件の返信'), 20000);
  assert.equal(parseReplyCount('Show 1 234 replies'), 1234);
  assert.equal(parseTimestamp('1:02:03'), 3723);
  assert.equal(parseTimestamp('０:０５'), 5);
  assert.equal(parseTimestamp('99:99'), null);
  assert.equal(parseTimestamp('1:70:02'), null);
});

test('comments preserve Unicode and normalize the YouTube permalink identity', () => {
  const item = normalizeComment({ ...fresh, authorUrl: '/@channel', permalink: '/watch?v=abcdefghijk&lc=abc' });
  assert.equal(item.id, 'abc');
  assert.equal(item.authorUrl, 'https://www.youtube.com/@channel');
  assert.equal(item.text, 'Sunrise at 0:05');
  assert.equal(item.author, '林');
  assert.equal(normalizeComment({ ...fresh, text: '  ' }), null);
  assert.equal(normalizeComment({ ...fresh, authorUrl: 'javascript:alert(1)' }).authorUrl, '');
  assert.equal(dedupeComments([item, item, null, comments[1]]).length, 2);
});

test('extraction associates loaded replies and discards nodes left by a previous watch page', () => {
  function nativeComment(id, video, body, thread, reply = false) {
    return {
      closest(selector) {
        if (selector === 'ytd-comment-thread-renderer') return thread;
        if (selector.startsWith('#replies')) return reply ? thread : null;
        return null;
      },
      querySelector(selector) {
        if (selector.startsWith('#content-text')) return { textContent: body, querySelector: () => null };
        if (selector === '#published-time-text') {
          return {
            textContent: 'now',
            getAttribute: () => `/watch?v=${video}&lc=${id}`,
          };
        }
        return null;
      },
    };
  }
  const thread = { querySelector: () => ({ textContent: '1.2K replies' }), querySelectorAll: () => [loaded] };
  const top = nativeComment('top', 'video', 'A visible comment', thread);
  const loaded = nativeComment('reply', 'video', 'A loaded reply', thread, true);
  const stale = nativeComment('wrong', 'old', 'A stale comment', thread);
  const root = { querySelectorAll: () => [top, loaded, stale, loaded] };

  const result = extractComments(root, 'video');
  assert.deepEqual(result.comments.map(({ id, isReply, parentId, replyCount }) => [id, isReply, parentId, replyCount]), [
    ['top', false, '', 1200], ['reply', true, 'top', 0],
  ]);
  assert.equal(result.nodes.get('reply'), loaded);
  const topLevel = extractComments(root, 'video', false);
  assert.deepEqual(topLevel.comments.map(({ id, replyCount }) => [id, replyCount]), [['top', 1200]]);
  assert.equal(topLevel.nodes.has('reply'), false);
});

test('native translation uses the actual enabled button inside the renderer', () => {
  const button = { disabled: false, closest: () => null, getAttribute: () => null };
  const wrapper = {
    matches: () => false,
    querySelector: (selector) => selector.startsWith('button') ? button : null,
    closest: () => null,
    getAttribute: () => null,
  };
  const comment = { isConnected: true, querySelector: () => wrapper };
  assert.equal(nativeTranslate(comment), button);
  button.disabled = true;
  assert.equal(nativeTranslate(comment), null);
});

test('persistent comment cache expires, discards corrupt entries and evicts least recently used videos', () => {
  let value = { version: 9 };
  let now = 10;
  const cache = createCommentCache(() => value, (next) => { value = structuredClone(next); }, () => now);
  assert.equal(cache.get('unknown'), null);
  cache.put('old', comments);
  for (let i = 0; i < 49; i++) {
    now++;
    cache.put(`v${i}`, comments);
  }
  now++;
  cache.get('old');
  cache.put('new', comments);
  assert.equal(cache.get('v0'), null);
  assert.equal(cache.get('old').length, 3);
  assert.equal(Object.keys(value.videos).length, 50);
  now += 86400000;
  assert.equal(cache.get('old'), null);
  cache.put('many', Array.from({ length: 2001 }, (_, order) => ({ ...comments[0], id: String(order), order })));
  assert.equal(cache.get('many').length, 2000);
});

test('an open tab preserves videos captured by a second tab', () => {
  let stored;
  const create = () => createCommentCache(() => stored, (next) => { stored = structuredClone(next); }, () => 10);
  const first = create();
  const second = create();
  first.put('first', comments);
  second.put('second', comments);
  first.put('third', comments);
  assert.deepEqual(Object.keys(stored.videos).sort(), ['first', 'second', 'third']);
});

test('filters, sorts and picks only the matching comments', () => {
  assert.deepEqual(filterComments(comments, { text: 'sunrise', includeReplies: false }).items, [comments[0]]);
  assert.deepEqual(filterComments(comments, { author: 'jo', minLikes: 12, hasGif: true }).items, [comments[1]]);
  assert.deepEqual(filterComments(comments, { hasLink: true, hasReply: true }).items, [comments[2]]);
  assert.deepEqual(filterComments(comments, { text: '^sunset$', regex: true }).items, [comments[2]]);
  assert.deepEqual(sortComments(comments, 'likes'), [comments[2], comments[1], comments[0]]);
  assert.deepEqual(sortComments(comments, 'oldest'), [...comments].reverse());
  assert.equal(randomComment([comments[1]], () => 0.99), comments[1]);
  assert.equal(randomComment([], () => 0.99), null);
});

test('invalid, oversized and costly regexes fall back to literal matching', () => {
  for (const text of ['[', 'a'.repeat(201), '(a+)+$']) {
    const item = normalizeComment({ ...fresh, text });
    const result = filterComments([item], { text, regex: true });
    assert.equal(result.error, true);
    assert.deepEqual(result.items, [item]);
  }
});

test('highlights are text segments, preserve punctuation and ignore zero-width matches', () => {
  assert.deepEqual(highlightSegments('<b>Äpfel</b>', 'äPFEL'), [
    { text: '<b>', match: false }, { text: 'Äpfel', match: true }, { text: '</b>', match: false },
  ]);
  assert.deepEqual(highlightSegments('abc', '^', true), [{ text: 'abc', match: false }]);
});

test('pagination clamps to the available pages and polls require whole-comment matches', () => {
  assert.deepEqual(paginate(comments, 2, 10), { items: [comments[2]], page: 1, pages: 2, total: 3 });
  assert.deepEqual(tallyOptions(comments, ['Sunrise', 'sunrise', 'sunset']), [
    { label: 'Sunrise', count: 1 }, { label: 'sunset', count: 1 },
  ]);
  assert.deepEqual(actionsFor(comments[0], null), { copy: true, permalink: false, author: false, translate: false });
});

test('timestamps ignore URLs and malformed values, dedupe and honor duration', () => {
  assert.deepEqual(parseTimestamps('0:05 https://example.org/0:06 #0:05 99:99 1:02:03 9:00', 4000), [
    { raw: '0:05', seconds: 5 }, { raw: '9:00', seconds: 540 }, { raw: '1:02:03', seconds: 3723 },
  ]);
  assert.deepEqual(parseTimestamps('0:05 0:06', 5), [{ raw: '0:05', seconds: 5 }]);
});

test('the timed index finds nearby comments once and buckets the duration endpoint safely', () => {
  const other = normalizeComment({ ...fresh, text: '0:04 0:06 0:10', order: 3 });
  const index = buildTimedIndex([comments[0], other], 10);
  assert.deepEqual(findTimedComments(index, 5).map(({ comment, seconds }) => [comment.id, seconds]),
    [[other.id, 4], [comments[0].id, 5]]);
  assert.deepEqual(heatmapBuckets(index, 10, 2), [
    { start: 0, percent: 0, count: 1 }, { start: 5, percent: 50, count: 3 },
  ]);
  assert.deepEqual(heatmapBuckets(index, Infinity), []);
});

test('transcript normalization and cache respect video, language and duplicate text', () => {
  const one = normalizeSegment('0:05', ' 同じ ', 0);
  const two = normalizeSegment('0:10', '同じ', 1);
  assert.deepEqual(one, { start: 5, text: '同じ', order: 0 });
  assert.equal(normalizeSegment('99:99', 'invalid', 0), null);
  const cache = createTranscriptCache();
  cache.put('v', 'ja', [one, two]);
  assert.deepEqual(cache.get('v', 'ja'), [one, two]);
  assert.equal(cache.get('v', 'en'), null);
  assert.equal(cache.get('other', 'ja'), null);
});

test('live chat normalizes badges and paid amounts, dedupes and stays bounded', () => {
  const paid = normalizeChat({ id: 'x', author: 'Ana', text: '🎉', amount: '€1,50', timestamp: '12:00',
    badges: ['moderator', 'unknown', 'moderator', 'verified'] });
  const free = normalizeChat({ id: 'y', author: 'Bo', text: 'hello', timestamp: '12:01' });
  assert.equal(paid.amountValue, 1.5);
  assert.deepEqual(paid.badges, ['moderator', 'verified']);
  assert.equal(normalizeChat({ id: 'ignored', text: '[deleted]', deleted: true }), null);
  const ring = createChatBuffer(2);
  ring.add([paid, free, paid]);
  assert.deepEqual(ring.items(), [paid, free]);
  assert.deepEqual(filterChat(ring.items(), { badge: 'moderator', minAmount: 1.5 }).items, [paid]);
  const newest = normalizeChat({ id: 'z', author: 'Cy', text: 'new' });
  ring.add([newest]);
  assert.deepEqual(ring.items(), [free, newest]);
  ring.clear();
  assert.deepEqual(ring.items(), []);
});

test('chat removes a message deleted by YouTube without losing subsequent arrivals', () => {
  const messages = ['first', 'deleted', 'last', 'new'].map((id) => normalizeChat({ id, text: id }));
  const ring = createChatBuffer(3);
  ring.add(messages.slice(0, 3));
  ring.remove('deleted');
  ring.add(messages.slice(3));
  assert.deepEqual(ring.items().map(({ id }) => id), ['first', 'last', 'new']);
});

test('same-frame chat list replacement rebinds capture without a parent-page scan', async (t) => {
  const observers = new Set();
  const previousObserver = globalThis.MutationObserver;
  globalThis.MutationObserver = class {
    constructor(callback) { this.callback = callback; }
    observe(target) { this.target = target; observers.add(this); }
    disconnect() { observers.delete(this); }
  };
  t.after(() => { globalThis.MutationObserver = previousObserver; });

  function makeList(id) {
    const message = {
      id,
      getAttribute: () => null,
      hasAttribute: () => false,
      querySelectorAll: () => [],
      querySelector: (selector) => selector.startsWith('#message')
        ? { childNodes: [{ nodeType: 3, textContent: id }] }
        : null,
    };
    return { isConnected: true, nodeType: 1, closest: () => null, querySelectorAll: () => [message] };
  }
  const original = makeList('first');
  let list = original;
  const frameRoot = {};
  const frame = {
    addEventListener() {},
    removeEventListener() {},
    contentDocument: { URL: 'https://www.youtube.com/live_chat?v=old', documentElement: frameRoot, querySelector: () => list },
  };
  const page = { querySelector: (selector) => selector.startsWith('iframe') ? frame : null };
  const chat = createChatCapture(page, () => {}, 'current');
  t.after(() => chat.destroy());
  chat.scan();
  assert.equal(chat.available, false, 'the previous video’s chat is excluded');
  frame.contentDocument.URL = 'https://www.youtube.com/live_chat?v=current';
  chat.scan();
  assert.ok([...observers].some(({ target }) => target === original), 'the initial list is observed');
  original.isConnected = false;
  list = makeList('replacement');
  for (const observer of [...observers]) {
    if (observer.target === frameRoot) observer.callback([{ addedNodes: [list], removedNodes: [original] }]);
  }
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.deepEqual(chat.items().map(({ id }) => id), ['first', 'replacement']);
  assert.ok(![...observers].some(({ target }) => target === original), 'old list detached');
});

test('exports preserve the same ordered records, quote CSV and use safe filenames', () => {
  const values = [{ start: 5, text: 'a,"文"\nb', order: 8 }];
  assert.equal(toCSV(values, 'transcript'), '\ufeffstart,text\r\n5,"a,""文""\nb"\r\n');
  assert.deepEqual(JSON.parse(toJSON(values, 'transcript')), [{ start: 5, text: 'a,"文"\nb' }]);
  assert.equal(toTXT(values, 'transcript'), '0:05 a,"文"\nb');
  assert.equal(toCSV([], 'comments'), '');
  assert.equal(toCSV([{ author: '=2+3', text: '+command' }], 'comments').includes("'=2+3,'+command"), true);
  assert.match(exportFilename('transcript', '../unsafe: ID', 'csv', new Date('2026-11-26T00:00:01.002Z')),
    /^youtube-plus-transcript-unsafe-ID-2026-11-26-00-00-01-002\.csv$/);
});

test('plain text export includes likes and reply counts', () => {
  assert.equal(toTXT([comments[2]], 'comments'), 'Amina · Likes: 2400 · Replies: 6\nSUNSET');
});
