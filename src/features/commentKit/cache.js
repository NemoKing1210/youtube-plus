import { dedupeComments, normalizeComment } from './extract.js';

const VERSION = 1;
const TTL = 24 * 60 * 60 * 1000;
const MAX_VIDEOS = 50;
const MAX_COMMENTS = 2000;

function entryIsValid(entry, now) {
  return Number.isFinite(entry?.at) && entry.at <= now && now - entry.at < TTL
    && Number.isFinite(entry.usedAt) && Array.isArray(entry.comments);
}

/** Store JSON-compatible snapshots behind the userscript storage adapter. */
export function createCommentCache(read, write, now = Date.now) {
  function entries(time) {
    // Re-read before merging a write so another tab's captures remain intact.
    const value = read();
    const videos = value?.videos;
    return value?.version === VERSION && videos && typeof videos === 'object' && !Array.isArray(videos)
      ? new Map(Object.entries(videos).filter(([, entry]) => entryIsValid(entry, time)))
      : new Map();
  }

  function persist(videos) {
    const newest = [...videos].sort(([, a], [, b]) => b.usedAt - a.usedAt).slice(0, MAX_VIDEOS);
    return write({ version: VERSION, videos: Object.fromEntries(newest) });
  }

  return {
    get(videoId) {
      const time = now();
      const videos = entries(time);
      const entry = videos.get(videoId);
      if (!entry) return null;
      const comments = dedupeComments(entry.comments.slice(0, MAX_COMMENTS).map(normalizeComment));
      if (!comments.length) {
        videos.delete(videoId);
        persist(videos);
        return null;
      }
      if (time !== entry.usedAt) {
        videos.delete(videoId);
        videos.set(videoId, { ...entry, usedAt: time, comments });
        persist(videos);
      }
      return comments;
    },
    put(videoId, comments) {
      const time = now();
      const videos = entries(time);
      if (!comments.length) {
        if (videos.delete(videoId)) return persist(videos);
        return;
      }
      // Keep captures in their displayed order and serialize normalized fields only.
      const snapshot = dedupeComments(comments.slice(0, MAX_COMMENTS).map(normalizeComment));
      videos.delete(videoId);
      return persist([[videoId, { at: time, usedAt: time, comments: snapshot }], ...videos]);
    },
  };
}
