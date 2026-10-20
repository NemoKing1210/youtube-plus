import { SEL } from '../../core/constants.js';
import { Codes, logError, logInfo } from '../../core/debug.js';
import { ensurePipButton, removePipButton } from './pip.js';
import { bindPlayerHotkeys, unbindPlayerHotkeys } from './hotkeys.js';
import { qualityLevel } from './quality.js';
import { clearPosition, restorePosition, savePosition } from './resume.js';

/**
 * Player lifecycle. YouTube reuses `#movie_player` across navigations, so all
 * state is keyed by video id and every application is guarded to run once per
 * video: a manual speed change by the user is never overwritten.
 */

const SAVE_EVERY_MS = 5000;
const QUALITY_VERIFY_MS = 2000;
const MAX_QUALITY_TRIES = 2;

let cfg = null;
let state = freshState();
let boundVideo = null;
let lastSave = 0;
let qualityTimer = 0;

function freshState() {
  return { videoId: null, speedApplied: false, qualityTries: 0, restoreAttempted: false };
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

function unbindVideo() {
  if (!boundVideo) return;
  boundVideo.removeEventListener('loadedmetadata', applyForVideo);
  boundVideo.removeEventListener('timeupdate', onTimeUpdate);
  boundVideo.removeEventListener('seeked', onSeeked);
  boundVideo.removeEventListener('ended', onEnded);
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
}

export function resetPlayerState() {
  clearTimeout(qualityTimer);
  state = freshState();
  lastSave = 0;
}

function teardown() {
  clearTimeout(qualityTimer);
  removePipButton();
  unbindPlayerHotkeys();
  const video = videoEl();
  if (video) video.playbackRate = 1;
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
