/**
 * Structured console diagnostics for YouTube Plus.
 *
 * Every failure carries a stable `YP-####` code: grep the codebase for the
 * code to jump straight to the throw site. Errors and warnings always print;
 * `logInfo` traces print only in verbose mode, enabled via
 * `localStorage.setItem('yp_debug', '1')` or `window.__YP_DEBUG__ = true`.
 */

export const Codes = {
  /** A bus listener threw while handling an event. */
  BUS_LISTENER: 'YP-1001',
  /** Persisting settings to GM storage failed. */
  SETTINGS_PERSIST: 'YP-1002',
  /** Importing a settings backup failed. */
  SETTINGS_IMPORT: 'YP-1003',
  /** A feature hook (init/apply/scan/navigate) threw. */
  FEATURE_HOOK: 'YP-1010',
  /** A navigation hook threw. */
  NAVIGATION_HOOK: 'YP-1020',
  /** An interface rule threw while previewing or applying. */
  INTERFACE_RULE: 'YP-1101',
  /** The player feature failed to apply its settings. */
  PLAYER_APPLY: 'YP-1201',
  /** Reading or writing saved video positions failed. */
  PLAYER_POSITIONS: 'YP-1202',
};

const BADGE_STYLE =
  'background:#ff0033;color:#fff;border-radius:3px;padding:1px 6px;font-weight:bold';
const WARN_BADGE_STYLE =
  'background:#b58900;color:#fff;border-radius:3px;padding:1px 6px;font-weight:bold';
const CODE_STYLE = 'font-weight:bold';
const INFO_STYLE = 'color:#909090';

export function isVerbose() {
  try {
    if (typeof window !== 'undefined' && window.__YP_DEBUG__ === true) return true;
  } catch {
    /* sandbox without window access */
  }
  try {
    return localStorage.getItem('yp_debug') === '1';
  } catch {
    return false;
  }
}

/** Build an Error carrying a stable code plus structured details. */
export function fail(code, message, details, cause) {
  const error = new Error(`[${code}] ${message}`);
  error.code = code;
  if (details !== undefined) error.details = details;
  if (cause !== undefined) error.cause = cause;
  return error;
}

function print(printer, badge, code, message, details) {
  if (details === undefined) {
    printer(`%cYouTube Plus%c ${code} ${message}`, badge, CODE_STYLE);
  } else {
    printer(`%cYouTube Plus%c ${code} ${message}`, badge, CODE_STYLE, details);
  }
}

/** Always printed: a failure the user or developer must see. */
export function logError(code, message, details) {
  print(console.error, BADGE_STYLE, code, message, details);
}

/** Always printed: degraded behavior that recovered on its own. */
export function logWarn(code, message, details) {
  print(console.warn, WARN_BADGE_STYLE, code, message, details);
}

/** Printed only in verbose mode: traces for development. */
export function logInfo(area, message, details) {
  if (!isVerbose()) return;
  if (details === undefined) {
    console.info(`%cYouTube Plus · ${area}%c ${message}`, INFO_STYLE, '');
  } else {
    console.info(`%cYouTube Plus · ${area}%c ${message}`, INFO_STYLE, '', details);
  }
}
