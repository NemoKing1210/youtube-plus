const API_BASE = 'https://returnyoutubedislikeapi.com';
const REQUEST_TIMEOUT_MS = 8000;

function voteCount(value) {
  return Number.isInteger(value) && value >= 0;
}

function normalizeVotes(response, videoId) {
  if (!response || (response.id != null && response.id !== videoId)) return null;
  const { likes, dislikes, viewCount, deleted } = response;
  if (!voteCount(likes) || !voteCount(dislikes)) return null;
  return {
    likes,
    dislikes,
    viewCount: voteCount(viewCount) ? viewCount : null,
    deleted: deleted === true,
  };
}

/** Bind the vote API to the shared GM transport. */
export function createVoteFetcher(request) {
  return async function fetchVotes(videoId, { signal } = {}) {
    if (!videoId || signal?.aborted) return null;
    let abortRequest;
    const abort = () => abortRequest?.();
    signal?.addEventListener('abort', abort, { once: true });
    try {
      const response = await request({
        url: `${API_BASE}/votes?videoId=${encodeURIComponent(videoId)}`,
        method: 'GET',
        anonymous: true,
        timeout: REQUEST_TIMEOUT_MS,
        allow404: true,
        onAbort(handle) {
          abortRequest = handle;
          if (signal?.aborted) abort();
        },
      });
      return signal?.aborted ? null : normalizeVotes(response, videoId);
    } catch (error) {
      if (signal?.aborted || error?.status === 404) return null;
      throw error;
    } finally {
      signal?.removeEventListener('abort', abort);
    }
  };
}
