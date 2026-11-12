import pkg from '../../package.json' with { type: 'json' };

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export const SCRIPT_NAME = 'YouTube Plus';
export const SCRIPT_VERSION = pkg.version;
export const REPO_URL = 'https://github.com/NemoKing1210/youtube-plus';
export const AUTHOR_HANDLE = 'NemoKing1210';
export const AUTHOR_URL = 'https://github.com/NemoKing1210';

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

export const SETTINGS_KEY = 'yp_settings_v1';
export const POSITIONS_KEY = 'yp_positions_v1';
export const VOLUME_KEY = 'yp_volume_v1';

/* ------------------------------------------------------------------ */
/* DOM conventions                                                     */
/* ------------------------------------------------------------------ */

/** Marks the root of every element we inject (excluded from DOM scans). */
export const UI_ATTR = 'data-yp-ui';
/** Elements that are ours (never rescanned). */
export const OWN_SELECTOR = `[${UI_ATTR}]`;
/** Set on <html> once the script booted (guards double injection). */
export const ROOT_ATTR = 'data-yp-root';
/** Set on <html> with the detected YouTube theme (light | dark). */
export const THEME_ATTR = 'data-yp-theme';

/* ------------------------------------------------------------------ */
/* Timing / limits                                                     */
/* ------------------------------------------------------------------ */

/** Debounce for DOM mutation rescans. */
export const SCAN_DEBOUNCE_MS = 350;
/** Poll interval for SPA URL changes that bypass the History API hooks. */
export const NAVIGATION_POLL_MS = 500;

/* ------------------------------------------------------------------ */
/* YouTube selectors                                                   */
/*                                                                     */
/* YouTube's DOM changes often. Prefer element names and stable        */
/* attributes; keep every selector used by more than one module here.  */
/* ------------------------------------------------------------------ */

export const SEL = Object.freeze({
  app: 'ytd-app',
  pageManager: '#page-manager',
  masthead: 'ytd-masthead',
  guide: 'ytd-guide-renderer',
  watchMeta: 'ytd-watch-metadata',
  secondaryInner: '#secondary-inner',
  related: '#secondary-inner #related',
  comments: 'ytd-comments#comments',
  chat: '#chat-container',
  player: '#movie_player',
  video: '#movie_player video',
  rightControls: '.ytp-right-controls',
});
