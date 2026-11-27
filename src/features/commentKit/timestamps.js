import { SEL } from '../../core/constants.js';
import { parseTimestamp } from './parse.js';

const TOKENS = /(?:https?:\/\/|www\.)[^\s]+|[\p{Nd}０-９]+(?::[\p{Nd}０-９]+){1,}/giu;
const INVALID_NEIGHBOR = /[\p{L}\p{N}_:/=]/u;

export function parseTimestamps(text, duration = Infinity) {
  const times = new Map();
  for (const match of text.matchAll(TOKENS)) {
    const raw = match[0];
    if (INVALID_NEIGHBOR.test(text[match.index - 1] || '')
        || INVALID_NEIGHBOR.test(text[match.index + raw.length] || '')) continue;
    const seconds = parseTimestamp(raw);
    if (seconds === null || seconds > duration || times.has(seconds)) continue;
    times.set(seconds, { raw, seconds });
  }
  return [...times.values()].sort((a, b) => a.seconds - b.seconds);
}

export function buildTimedIndex(comments, duration) {
  return comments.flatMap((comment) => parseTimestamps(comment.text, duration)
    .map(({ seconds }) => ({ comment, seconds }))).sort((a, b) => a.seconds - b.seconds);
}

export function findTimedComments(index, at, radius = 2) {
  let low = 0;
  let high = index.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (index[middle].seconds < at - radius) low = middle + 1;
    else high = middle;
  }
  const matches = [];
  const added = new Set();
  for (let i = low; i < index.length && index[i].seconds <= at + radius; i++) {
    const match = index[i];
    if (added.has(match.comment.id)) continue;
    matches.push(match);
    added.add(match.comment.id);
  }
  return matches;
}

export function heatmapBuckets(index, duration, count = 100) {
  if (!Number.isFinite(duration) || duration <= 0) return [];
  const buckets = Array(count).fill(0);
  for (const { seconds } of index) {
    if (seconds < 0 || seconds > duration) continue;
    buckets[Math.min(count - 1, Math.floor(seconds / duration * count))]++;
  }
  return buckets.flatMap((hits, index) => hits
    ? [{ start: index / count * duration, percent: index / count * 100, count: hits }]
    : []);
}

export function seekTo(page, seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return false;
  const player = page?.querySelector(SEL.player);
  const video = player?.querySelector('video');
  if (!video || !Number.isFinite(video.duration) || seconds > video.duration) return false;
  // Userscript isolated worlds can hide YouTube's player API.
  if (typeof player.seekTo === 'function') player.seekTo(seconds, true);
  else video.currentTime = seconds;
  return true;
}
