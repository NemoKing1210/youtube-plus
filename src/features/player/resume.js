import { POSITIONS_KEY } from '../../core/constants.js';
import { getValue, setValue } from '../../core/storage.js';
import { prunePositions, shouldRestore } from './positions.js';

export function loadPositions() {
  return prunePositions(getValue(POSITIONS_KEY, {}));
}

export function savePosition(videoId, seconds) {
  if (!videoId || !Number.isFinite(seconds) || seconds < 10) return;
  const map = loadPositions();
  map[videoId] = { t: Math.round(seconds), at: Date.now() };
  setValue(POSITIONS_KEY, prunePositions(map));
}

export function readPosition(videoId) {
  return loadPositions()[videoId] || null;
}

export function clearPosition(videoId) {
  if (!videoId) return;
  const map = loadPositions();
  if (!(videoId in map)) return;
  delete map[videoId];
  setValue(POSITIONS_KEY, map);
}

/** Seek once to the stored position. Returns whether a seek happened. */
export function restorePosition(player, video, videoId) {
  const position = readPosition(videoId);
  const duration = Number(player?.getDuration?.() ?? video?.duration);
  if (!shouldRestore(position, duration)) return false;
  if (typeof player?.seekTo === 'function') player.seekTo(position.t, true);
  else if (video) video.currentTime = position.t;
  return true;
}
