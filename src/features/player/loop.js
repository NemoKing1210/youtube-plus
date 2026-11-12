/** @returns {boolean} whether a video element was updated */
export function applyLoop(video, enabled) {
  if (!video) return false;
  video.loop = Boolean(enabled);
  return true;
}
