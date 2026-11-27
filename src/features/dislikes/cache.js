const MAX_ENTRIES = 300;
const POSITIVE_TTL_MS = 24 * 60 * 60_000;
const NEGATIVE_TTL_MS = 5 * 60_000;

/** In-memory cache: `undefined` is a miss, `null` is a recent no-data result. */
export function createVoteCache(now = Date.now) {
  const entries = new Map();

  function prune() {
    const time = now();
    for (const [id, entry] of entries) {
      if (entry.expires <= time) entries.delete(id);
    }
    while (entries.size > MAX_ENTRIES) entries.delete(entries.keys().next().value);
  }

  return {
    get(id) {
      const entry = entries.get(id);
      if (!entry) return undefined;
      entries.delete(id);
      if (entry.expires <= now()) return undefined;
      entries.set(id, entry);
      return entry.value;
    },
    set(id, value) {
      const ttl = value === null ? NEGATIVE_TTL_MS : POSITIVE_TTL_MS;
      entries.delete(id);
      entries.set(id, { value, expires: now() + ttl });
      prune();
    },
    prune,
  };
}
