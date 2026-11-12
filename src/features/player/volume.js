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
