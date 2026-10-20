import { getFeatureSettings } from '../../core/settings.js';
import { closeSettings, isSettingsOpen, openSettings } from './panel.js';

/** Ctrl+M toggles the settings dialog (outside inputs and confirmations). */
let bound = false;

function general() {
  try {
    return getFeatureSettings('general') || {};
  } catch {
    return {};
  }
}

function isTyping(target) {
  return (
    target instanceof Element &&
    (target.closest('input, textarea, select, [contenteditable="true"]') !== null ||
      target.getAttribute('role') === 'textbox')
  );
}

function onKeyDown(event) {
  if (event.ctrlKey !== true || event.altKey || event.metaKey) return;
  if (event.code !== 'KeyM') return;
  if (isTyping(event.target)) return;
  if (document.querySelector('.yp-confirm-overlay')) return;
  event.preventDefault();
  event.stopPropagation();
  if (isSettingsOpen()) closeSettings();
  else openSettings();
}

export function syncHotkey() {
  const enabled = general().hotkey !== false;
  if (enabled && !bound) {
    document.addEventListener('keydown', onKeyDown, true);
    bound = true;
  } else if (!enabled && bound) {
    document.removeEventListener('keydown', onKeyDown, true);
    bound = false;
  }
}

export function unbindHotkey() {
  if (!bound) return;
  document.removeEventListener('keydown', onKeyDown, true);
  bound = false;
}
