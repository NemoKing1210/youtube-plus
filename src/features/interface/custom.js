export const MAX_SELECTOR_LENGTH = 300;
export const MAX_CUSTOM_SELECTORS = 50;
const FORBIDDEN = /[{};@/\r\n]/;

/**
 * Validate a user-entered CSS selector. Returns the trimmed selector or null
 * when it is empty, too long, or contains a character that could break out of
 * the generated declaration block.
 *
 * @param {unknown} value
 * @returns {string|null}
 */
export function sanitizeSelector(value) {
  const selector = String(value ?? '').trim();
  if (!selector || selector.length > MAX_SELECTOR_LENGTH) return null;
  if (FORBIDDEN.test(selector)) return null;
  return selector;
}

/**
 * Sanitize a list of selectors: drop invalid and duplicate entries, preserve
 * order, and stop at the configured maximum.
 *
 * @param {unknown} list
 * @returns {string[]}
 */
export function sanitizeSelectors(list) {
  const out = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const selector = sanitizeSelector(raw);
    if (selector && !out.includes(selector)) out.push(selector);
    if (out.length >= MAX_CUSTOM_SELECTORS) break;
  }
  return out;
}
