import { createVoteCache } from './cache.js';

const FIRST_COOLDOWN_MS = 60_000;
const MAX_COOLDOWN_MS = 60 * 60_000;

/** One active video, one request, and a cache shared by watch pages and Shorts. */
export function createVoteSession({ fetchVotes, now = Date.now, onFailure = () => {} }) {
  const cache = createVoteCache(now);
  let activeId = null;
  let activeRequest = null;
  let cooldown = 0;
  let retryAt = 0;

  async function load(id, request) {
    try {
      const votes = await fetchVotes(id, { signal: request.controller.signal });
      if (request !== activeRequest) return undefined;
      cooldown = 0;
      const result = votes?.deleted ? null : votes;
      cache.set(id, result);
      if (result === null) onFailure(new Error('No vote data'));
      return result;
    } catch (error) {
      if (request !== activeRequest) return undefined;
      if (error?.status === 429) {
        cooldown = Math.min(cooldown * 2 || FIRST_COOLDOWN_MS, MAX_COOLDOWN_MS);
        retryAt = now() + cooldown;
      } else {
        cache.set(id, null);
      }
      onFailure(error);
      return null;
    } finally {
      if (request === activeRequest) activeRequest = null;
    }
  }

  return {
    update(id) {
      if (id !== activeId) {
        activeRequest?.controller.abort();
        activeRequest = null;
        activeId = id;
      }
      if (!id) return undefined;
      const votes = cache.get(id);
      if (votes !== undefined) return votes;
      if (activeRequest) return activeRequest.result;
      if (now() < retryAt) return undefined;
      const request = { controller: new AbortController() };
      activeRequest = request;
      request.result = load(id, request);
      return request.result;
    },
  };
}
