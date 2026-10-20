import { registerFeature } from '../../core/features.js';
import {
  applyForVideo,
  applyPlayerSettings,
  playerNavigate,
  playerScan,
} from './engine.js';
import { playerFields, playerTab } from './settings.js';

/**
 * Player improvements: default speed, preferred quality, optional position
 * restore, a PiP button and speed/PiP hotkeys.
 */
registerFeature({
  id: 'player',
  order: 30,
  fields: playerFields(),
  tabs: [playerTab()],

  init() {
    window.addEventListener('yt-player-updated', applyForVideo);
  },

  apply(cfg, prev) {
    applyPlayerSettings(cfg, prev);
  },

  scan() {
    playerScan();
  },

  navigate() {
    playerNavigate();
  },
});
