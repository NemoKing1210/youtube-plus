export const MIN_SPEED = 0.25;
export const MAX_SPEED = 2;
export const SPEED_STEP = 0.25;

/** Step the playback rate by `delta`, clamp to 0.25–2 and round to 2 decimals. */
export function stepSpeed(current, delta) {
  const base = Number.isFinite(Number(current)) ? Number(current) : 1;
  const next = Math.round((base + Number(delta)) * 100) / 100;
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, next));
}
