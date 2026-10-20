import { SEL } from '../../core/constants.js';
import { t } from '../../i18n/index.js';
import { el } from '../../utils/dom.js';
import { iconNode } from '../../ui/icons.js';

const BUTTON_CLASS = 'yp-pip';

/** Add the PiP button next to YouTube's own controls. */
export function ensurePipButton() {
  if (document.pictureInPictureEnabled !== true) {
    removePipButton();
    return;
  }
  const controls = document.querySelector(SEL.rightControls);
  if (!controls) return;
  if (controls.querySelector(`.${BUTTON_CLASS}`)) return;

  const button = el('button', `${BUTTON_CLASS} ytp-button`);
  button.type = 'button';
  const label = t('player.pip');
  button.title = label;
  button.setAttribute('aria-label', label);
  button.append(iconNode('pip'));
  button.addEventListener('click', () => {
    const video = document.querySelector(SEL.video);
    if (video) togglePip(video);
  });

  const settingsButton = controls.querySelector('.ytp-settings-button');
  if (settingsButton?.parentElement) {
    settingsButton.parentElement.insertBefore(button, settingsButton);
  } else {
    controls.append(button);
  }
  syncButton();
}

export function removePipButton() {
  for (const node of document.querySelectorAll(`.${BUTTON_CLASS}`)) node.remove();
}

export function togglePip(video) {
  if (!video || document.pictureInPictureEnabled !== true) return;
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture().catch(() => {});
    return;
  }
  video.requestPictureInPicture?.().catch(() => {});
}

function syncButton() {
  const button = document.querySelector(`.${BUTTON_CLASS}`);
  if (!button) return;
  button.classList.toggle('is-active', Boolean(document.pictureInPictureElement));
}

document.addEventListener('enterpictureinpicture', syncButton, true);
document.addEventListener('leavepictureinpicture', syncButton, true);
