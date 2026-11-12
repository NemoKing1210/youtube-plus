import { UI_ATTR } from '../core/constants.js';

/**
 * Return the `<style id>` node, creating it on first use. Injected nodes carry
 * `data-yp-ui`, so the DOM scanner ignores them.
 *
 * @param {string} id
 * @returns {HTMLStyleElement}
 */
export function ensureStyle(id) {
  let node = document.getElementById(id);
  if (node) return node;
  node = document.createElement('style');
  node.id = id;
  node.setAttribute(UI_ATTR, '');
  (document.head || document.documentElement).append(node);
  return node;
}
