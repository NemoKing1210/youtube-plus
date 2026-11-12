import { SEL, VOLUME_KEY } from '../../core/constants.js';
import { Codes, logError, logInfo } from '../../core/debug.js';
import { getValue, setValue } from '../../core/storage.js';
import { ensurePipButton, removePipButton } from './pip.js';
import { bindPlayerHotkeys, unbindPlayerHotkeys } from './hotkeys.js';
import { applyLoop } from './loop.js';
import { qualityLevel } from './quality.js';
import { clearPosition, restorePosition, savePosition } from './resume.js';
import { clampVolume, shouldPersistVolume, volumeFromPercent } from './volume.js';

/**
 * Player lifecycle. YouTube reuses `#movie_player` across navigations, so all
 * state is keyed by video id and every application is guarded to run once per
 * video: a manual speed change by the user is never overwritten.
 */

const SAVE_EVERY_MS = 5000;
const QUALITY_VERIFY_MS = 2000;
const MAX_QUALITY_TRIES = 2;
const VOLUME_SAVE_MS = 500;

let cfg = null;
let state = freshState();
let boundVideo = null;
let lastSave = 0;
let qualityTimer = 0;
let volumeTimer = 0;
// Value we assigned to the element ourselves; its `volumechange` must not be
// mistaken for a hand-set volume and persisted.
let suppressedVolume = null;

function freshState() {
  return {
    videoId: null,
    speedApplied: false,
    qualityTries: 0,
    restoreAttempted: false,
    volumeApplied: false,
  };
}

const playerEl = () => document.querySelector(SEL.player);
const videoEl = () => document.querySelector(SEL.video);

function videoIdOf(player) {
  const id = player?.getVideoData?.()?.video_id;
  if (id) return id;
  return new URL(location.href).searchParams.get('v') || null;
}

function applySpeed(player, video) {
  if (state.speedApplied) return;
  const rate = Number(cfg?.speed);
  if (!Number.isFinite(rate)) return;
  if (typeof player?.setPlaybackRate === 'function') player.setPlaybackRate(rate);
  else video.playbackRate = rate;
  state.speedApplied = true;
  logInfo('player', 'speed applied', { videoId: state.videoId, rate });
}

function applyQuality(player) {
  if (!cfg || cfg.quality === 'auto') {
    clearTimeout(qualityTimer);
    return;
  }
  if (state.qualityTries > 0) return;
  const level = qualityLevel(cfg.quality);
  if (!level) return;
  const videoId = state.videoId;
  state.qualityTries = 1;
  try {
    player.setPlaybackQualityRange?.(level, level);
  } catch {
    /* the player API is best-effort */
  }
  clearTimeout(qualityTimer);
  qualityTimer = setTimeout(() => {
    if (
      !cfg ||
      cfg.quality === 'auto' ||
      state.videoId !== videoId ||
      state.qualityTries >= MAX_QUALITY_TRIES
    ) {
      return;
    }
    try {
      if (player.getPlaybackQuality?.() === level) return;
      state.qualityTries = MAX_QUALITY_TRIES;
      player.setPlaybackQualityRange?.(level, level);
    } catch {
      /* ignore */
    }
  }, QUALITY_VERIFY_MS);
}

function applyResume(player, video) {
  if (state.restoreAttempted) return;
  const duration = Number(player?.getDuration?.() ?? video?.duration);
  if (!Number.isFinite(duration)) return;
  state.restoreAttempted = true;
  if (!cfg?.resume) return;
  if (restorePosition(player, video, state.videoId)) {
    logInfo('player', 'position restored', { videoId: state.videoId });
  }
}

function applyVolume(video) {
  if (!cfg?.volumeEnabled || state.volumeApplied) return;
  const stored = cfg.rememberVolume ? getValue(VOLUME_KEY, null) : null;
  const volume =
    typeof stored === 'number' && Number.isFinite(stored)
      ? clampVolume(stored)
      : volumeFromPercent(cfg.volume);
  state.volumeApplied = true;
  // Assigning the current value fires no event, and there is nothing to
  // suppress; assigning a new one makes the matching `volumechange` ours.
  if (video.volume === volume) return;
  suppressedVolume = volume;
  video.volume = volume;
  logInfo('player', 'volume applied', { videoId: state.videoId, volume });
}

/** Apply every per-video preference exactly once. */
export function applyForVideo() {
  try {
    applyCurrentVideo();
  } catch (error) {
    logError(Codes.PLAYER_APPLY, 'failed to apply player settings', { error });
  }
}

function applyCurrentVideo() {
  if (!cfg || cfg.enabled === false) return;
  const player = playerEl();
  const video = videoEl();
  if (!player || !video) return;

  // Self-sufficient: re-enabling the feature (teardown detached the listeners)
  // and any DOM scan both restore the wiring here. Idempotent: binding the
  // same element returns early, and the single `loadedmetadata` handler is
  // this very `applyForVideo`, so no duplicate handler is installed.
  bindVideo(video);

  const id = videoIdOf(player);
  if (id && id !== state.videoId) {
    state = freshState();
    state.videoId = id;
  }
  if (!id) return;

  const duration = Number(player.getDuration?.() ?? video.duration);
  if (video.readyState < 1 && !Number.isFinite(duration)) return;

  applySpeed(player, video);
  applyQuality(player);
  applyResume(player, video);
  applyVolume(video);
  applyLoop(video, cfg.loop);
}

function onTimeUpdate() {
  if (!cfg?.enabled || !cfg.resume) return;
  const now = Date.now();
  if (now - lastSave < SAVE_EVERY_MS) return;
  lastSave = now;

  const player = playerEl();
  const video = videoEl();
  if (!video) return;
  const duration = Number(player?.getDuration?.() ?? video.duration);
  if (!Number.isFinite(duration)) return;

  if (duration - video.currentTime <= 5) clearPosition(state.videoId);
  else savePosition(state.videoId, video.currentTime);
}

function onEnded() {
  clearPosition(state.videoId);
}

function onSeeked() {
  if (!cfg?.enabled || !cfg.resume || !boundVideo) return;
  if (boundVideo.currentTime < 10) clearPosition(state.videoId);
}

function onVolumeChange() {
  // Consume the one-shot suppression: the first event after our assignment is
  // the programmatic one; anything later is a genuine change.
  const applied = suppressedVolume;
  suppressedVolume = null;
  clearTimeout(volumeTimer);
  volumeTimer = 0;

  const video = boundVideo;
  if (!video) return;
  const persist = shouldPersistVolume({
    applied,
    current: video.volume,
    volumeEnabled: cfg?.volumeEnabled === true,
    rememberVolume: cfg?.rememberVolume === true,
  });
  if (!persist) return;
  // Capture the element that produced this change: if YouTube swaps the
  // <video> before the throttle fires, the save must be dropped rather than
  // persisting the replacement element's default volume.
  volumeTimer = setTimeout(() => {
    volumeTimer = 0;
    if (!cfg?.volumeEnabled || !cfg.rememberVolume || boundVideo !== video) return;
    setValue(VOLUME_KEY, video.volume);
  }, VOLUME_SAVE_MS);
}

function unbindVideo() {
  // Cancel any pending save even if no element is currently bound, so an
  // unbind/teardown never leaves a callback that could write stale state.
  clearTimeout(volumeTimer);
  volumeTimer = 0;
  suppressedVolume = null;
  if (!boundVideo) return;
  boundVideo.removeEventListener('loadedmetadata', applyForVideo);
  boundVideo.removeEventListener('timeupdate', onTimeUpdate);
  boundVideo.removeEventListener('seeked', onSeeked);
  boundVideo.removeEventListener('ended', onEnded);
  boundVideo.removeEventListener('volumechange', onVolumeChange);
  boundVideo = null;
}

function bindVideo(video) {
  if (!video || video === boundVideo) return;
  unbindVideo();
  boundVideo = video;
  video.addEventListener('loadedmetadata', applyForVideo);
  video.addEventListener('timeupdate', onTimeUpdate);
  video.addEventListener('seeked', onSeeked);
  video.addEventListener('ended', onEnded);
  video.addEventListener('volumechange', onVolumeChange);
}

export function resetPlayerState() {
  clearTimeout(qualityTimer);
  state = freshState();
  lastSave = 0;
}

function teardown() {
  clearTimeout(qualityTimer);
  clearTimeout(volumeTimer);
  volumeTimer = 0;
  removePipButton();
  unbindPlayerHotkeys();
  unbindVideo();
  const video = videoEl();
  if (video) {
    video.playbackRate = 1;
    video.loop = false;
  }
  resetPlayerState();
}

/** React to settings changes (init + every save). */
export function applyPlayerSettings(next, prev) {
  cfg = next;
  if (!cfg || cfg.enabled === false) {
    teardown();
    return;
  }
  if (!prev || prev.enabled === false) resetPlayerState();
  if (prev && prev.speed !== next.speed) state.speedApplied = false;
  if (prev && prev.quality !== next.quality) state.qualityTries = 0;
  if (prev && prev.resume !== next.resume) state.restoreAttempted = false;
  if (
    prev &&
    (prev.volumeEnabled !== next.volumeEnabled ||
      prev.volume !== next.volume ||
      prev.rememberVolume !== next.rememberVolume)
  ) {
    state.volumeApplied = false;
  }
  if (prev && prev.loop !== next.loop) {
    const video = videoEl();
    if (video) applyLoop(video, cfg.loop);
  }

  if (cfg.pip) ensurePipButton();
  else removePipButton();

  if (cfg.hotkeys) bindPlayerHotkeys();
  else unbindPlayerHotkeys();

  applyForVideo();
}

/** Scan hook: attach to the current video and apply pending preferences. */
export function playerScan() {
  if (!cfg || cfg.enabled === false) return;
  const video = videoEl();
  if (!video) return;
  bindVideo(video);
  if (cfg.pip) ensurePipButton();
  applyForVideo();
}

export function playerNavigate() {
  if (!cfg || cfg.enabled === false) return;
  const urlId = new URL(location.href).searchParams.get('v');
  if (!urlId || urlId !== state.videoId) resetPlayerState();
  setTimeout(applyForVideo, 0);
}
