import { SEL } from '../../core/constants.js';
import { showToast } from '../../ui/toast.js';
import { togglePip } from './pip.js';
import { SPEED_STEP, stepSpeed } from './speed.js';

let bound = false;

function isTyping(target) {
  return (
    target instanceof Element &&
    (target.closest('input, textarea, select, [contenteditable="true"]') !== null ||
      target.getAttribute('role') === 'textbox')
  );
}

function applyRate(player, video, rate) {
  if (typeof player?.setPlaybackRate === 'function') player.setPlaybackRate(rate);
  else if (video) video.playbackRate = rate;
}

function onKeyDown(event) {
  if (event.ctrlKey || event.metaKey) return;
  if (isTyping(event.target)) return;
  if (document.querySelector('#yp-settings-root, .yp-confirm-overlay')) return;

  const player = document.querySelector(SEL.player);
  const video = document.querySelector(SEL.video);
  if (!player || !video) return;

  if (event.altKey && event.code === 'KeyP') {
    event.preventDefault();
    togglePip(video);
    return;
  }
  if (event.altKey) return;

  let delta = 0;
  if (event.code === 'BracketRight') delta = SPEED_STEP;
  else if (event.code === 'BracketLeft') delta = -SPEED_STEP;
  else return;

  event.preventDefault();
  const rate = stepSpeed(video.playbackRate, delta);
  applyRate(player, video, rate);
  showToast(`${rate.toFixed(2)}×`, { type: 'info', duration: 1.2, force: false });
}

export function bindPlayerHotkeys() {
  if (bound) return;
  document.addEventListener('keydown', onKeyDown, true);
  bound = true;
}

export function unbindPlayerHotkeys() {
  if (!bound) return;
  document.removeEventListener('keydown', onKeyDown, true);
  bound = false;
}
