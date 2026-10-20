export const MAX_POSITIONS = 500;
/** Positions expire after 90 days. */
export const TTL_MS = 90 * 24 * 60 * 60 * 1000;

/** A stored position is worth restoring between 10 s and 15 s before the end. */
export function shouldRestore(position, duration) {
  if (!position || !Number.isFinite(position.t) || !Number.isFinite(duration)) return false;
  return position.t >= 10 && position.t <= duration - 15;
}

/** Drop expired entries and keep only the newest `MAX_POSITIONS`. */
export function prunePositions(map, now = Date.now()) {
  const entries = Object.entries(map || {}).filter(
    ([, position]) =>
      position &&
      Number.isFinite(position.at) &&
      Number.isFinite(position.t) &&
      now - position.at <= TTL_MS,
  );
  entries.sort((a, b) => b[1].at - a[1].at);
  return Object.fromEntries(entries.slice(0, MAX_POSITIONS));
}
