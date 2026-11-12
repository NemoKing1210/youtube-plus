import { Codes, logError } from '../../core/debug.js';
import { SEL } from '../../core/constants.js';
import { ensureStyle } from '../../utils/style.js';
import { buildInterfaceCss } from './css.js';
import { sanitizeSelectors } from './custom.js';
import { RULES, ruleId } from './rules.js';

/**
 * Applies the enabled rules: one generated stylesheet hides CSS rules;
 * `find` rules mark their matches with `data-yp-hide~="<id>"`, hidden by the
 * same stylesheet. Toggling a rule rewrites the stylesheet only.
 */

const STYLE_ID = 'yp-interface-style';
const PREVIEW_ID = 'yp-interface-preview';
const OUTLINE = 'outline:2px solid var(--yp-accent)!important;outline-offset:-2px!important';
const PAGE_INTERVAL_MS = 120;

export const MARK_ATTR = 'data-yp-hide';
export const PREVIEW_ATTR = 'data-yp-preview';

let config = null;
let hoveredId = null;
let pageTimer = 0;

/** Add the rule id to a space-separated id list, preserving other marks. */
function addMark(node, attr, id) {
  const marks = new Set((node.getAttribute(attr) || '').split(/\s+/).filter(Boolean));
  if (marks.has(id)) return;
  marks.add(id);
  node.setAttribute(attr, [...marks].join(' '));
}

/** Remove one rule id, keeping the element's other marks. */
function removeMark(node, attr, id) {
  const marks = (node.getAttribute(attr) || '')
    .split(/\s+/)
    .filter((value) => value && value !== id);
  if (marks.length) node.setAttribute(attr, marks.join(' '));
  else node.removeAttribute(attr);
}

/**
 * Make the elements carrying `attr~="<id>"` exactly match `matches`: mark the
 * new matches and remove the id from elements that no longer match. Other
 * rule ids in the same attribute are untouched.
 *
 * @param {ParentNode} root
 * @param {string} attr
 * @param {string} id
 * @param {Iterable<Element>} matches
 * @returns {Set<Element>}
 */
export function syncMarks(root, attr, id, matches) {
  const wanted = matches instanceof Set ? matches : new Set(matches || []);
  for (const node of wanted) addMark(node, attr, id);
  for (const node of root.querySelectorAll(`[${attr}~="${id}"]`)) {
    if (!wanted.has(node)) removeMark(node, attr, id);
  }
  return wanted;
}

function customSelectors() {
  if (!config?.custom?.enabled) return [];
  return sanitizeSelectors(config.custom.selectors);
}

function render() {
  if (!config) return;
  const { css, previewSelectors } = buildInterfaceCss(RULES, config, {
    hoveredId,
    customSelectors: customSelectors(),
  });
  ensureStyle(STYLE_ID).textContent = css;

  const strokes = previewSelectors.map((selector) => `${selector}{${OUTLINE}}`);
  const hoveredFind = RULES.find(
    (rule) => typeof rule.find === 'function' && ruleId(rule) === hoveredId,
  );
  if (hoveredFind) strokes.push(`[${PREVIEW_ATTR}~="${hoveredId}"]{${OUTLINE}}`);
  ensureStyle(PREVIEW_ID).textContent = strokes.join('\n');
}

export function applyInterface(cfg) {
  config = cfg;
  render();
  runFind(document);
}

export function previewRule(id) {
  if (hoveredId === id) return;
  hoveredId = id;
  render();
  runFind(document);
}

function isOn(rule) {
  return config?.enabled === true && config[rule.group]?.[rule.key] === true;
}

function safeFind(rule, root) {
  try {
    return rule.find(root) || [];
  } catch (error) {
    logError(Codes.INTERFACE_RULE, `rule "${ruleId(rule)}" failed`, { error });
    return [];
  }
}

function mark(rule, root, preview) {
  const id = ruleId(rule);
  const matches = isOn(rule) || preview ? safeFind(rule, root) : [];
  if (preview) {
    syncMarks(root, MARK_ATTR, id, []);
    syncMarks(root, PREVIEW_ATTR, id, matches);
  } else {
    syncMarks(root, PREVIEW_ATTR, id, []);
    syncMarks(root, MARK_ATTR, id, isOn(rule) ? matches : []);
  }
}

/**
 * Page-level pass for `find` rules. Every rule is visited so stale marks are
 * cleared. Throttled so YouTube's DOM churn cannot starve it; scoped to the
 * active page manager.
 */
export function runFind(root = document) {
  if (!config) return;
  const findRules = RULES.filter((rule) => typeof rule.find === 'function');
  if (!findRules.length) return;
  const scope = root.querySelector?.(SEL.pageManager) || root;
  for (const rule of findRules) mark(rule, scope, ruleId(rule) === hoveredId);
}

export function scheduleFind() {
  if (pageTimer) return;
  pageTimer = setTimeout(() => {
    pageTimer = 0;
    runFind(document);
  }, PAGE_INTERVAL_MS);
}
