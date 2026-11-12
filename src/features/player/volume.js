/** Clamp a video volume to the 0–1 range; invalid values use `fallback`. */
export function clampVolume(value, fallback = 1) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : fallback;
}

/** Convert a 0–100 percentage into a 0–1 volume. */
export function volumeFromPercent(percent, fallback = 1) {
  const number = Number(percent);
  return Number.isFinite(number) ? clampVolume(number / 100) : fallback;
}

/**
 * Decide whether a `volumechange` is a genuine user change worth persisting.
 *
 * `applied` is the value we assigned ourselves for the current video (or
 * `null` when no assignment is pending). A change landing on that same value
 * is the programmatic `volumechange`, not a hand-set volume, so it must not
 * overwrite the memory. Any other finite change is persisted.
 */
export function shouldPersistVolume({ applied, current, volumeEnabled, rememberVolume }) {
  if (volumeEnabled !== true || rememberVolume !== true) return false;
  const now = Number(current);
  if (!Number.isFinite(now)) return false;
  if (applied === null || applied === undefined) return true;
  const expected = Number(applied);
  return !(Number.isFinite(expected) && expected === now);
}
