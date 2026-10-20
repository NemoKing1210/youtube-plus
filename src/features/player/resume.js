import { POSITIONS_KEY } from '../../core/constants.js';
import { Codes, logError } from '../../core/debug.js';
import { getValue, setValue } from '../../core/storage.js';
import { prunePositions, shouldRestore } from './positions.js';

function persist(map) {
  if (!setValue(POSITIONS_KEY, map)) {
    logError(Codes.PLAYER_POSITIONS, 'failed to persist video positions');
  }
}

export function loadPositions() {
  return prunePositions(getValue(POSITIONS_KEY, {}));
}

export function savePosition(videoId, seconds) {
  if (!videoId || !Number.isFinite(seconds) || seconds < 10) return;
  const map = loadPositions();
  map[videoId] = { t: Math.round(seconds), at: Date.now() };
  persist(prunePositions(map));
}

export function readPosition(videoId) {
  return loadPositions()[videoId] || null;
}

export function clearPosition(videoId) {
  if (!videoId) return;
  const map = loadPositions();
  if (!(videoId in map)) return;
  delete map[videoId];
  persist(map);
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
