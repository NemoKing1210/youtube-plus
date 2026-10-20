import { Codes, logError } from '../../core/debug.js';
import { SEL } from '../../core/constants.js';
import { buildInterfaceCss } from './css.js';
import { RULES, ruleId } from './rules.js';

/**
 * Applies the enabled rules: one generated stylesheet hides CSS rules;
 * `find` rules mark their matches with `data-yp-hide~="<id>"`, hidden by the
 * same stylesheet. Toggling a rule rewrites the stylesheet only.
 */

const STYLE_ID = 'yp-interface-style';
const PREVIEW_ID = 'yp-interface-preview';
const MARK_ATTR = 'data-yp-hide';
const PAGE_INTERVAL_MS = 120;

let config = null;
let hoveredId = null;
let pageTimer = 0;

function style(id) {
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement('style');
    node.id = id;
    (document.head || document.documentElement).append(node);
  }
  return node;
}

function render() {
  if (!config) return;
  const { css, previewSelectors } = buildInterfaceCss(RULES, config, { hoveredId });
  style(STYLE_ID).textContent = css;
  style(PREVIEW_ID).textContent = previewSelectors
    .map(
      (selector) =>
        `${selector}{outline:2px solid var(--yp-accent)!important;outline-offset:-2px!important}`,
    )
    .join('\n');
}

export function applyInterface(cfg) {
  config = cfg;
  render();
}

export function previewRule(id) {
  if (hoveredId === id) return;
  hoveredId = id;
  render();
}

function isOn(rule) {
  return config?.enabled === true && config[rule.group]?.[rule.key] === true;
}

function mark(rule, root) {
  const id = ruleId(rule);
  const enabled = isOn(rule);
  if (enabled) {
    let nodes = [];
    try {
      nodes = rule.find(root) || [];
    } catch (error) {
      logError(Codes.INTERFACE_RULE, `rule "${id}" failed`, { error });
    }
    for (const node of nodes) {
      const marks = new Set((node.getAttribute(MARK_ATTR) || '').split(/\s+/).filter(Boolean));
      marks.add(id);
      node.setAttribute(MARK_ATTR, [...marks].join(' '));
    }
    return;
  }
  for (const node of document.querySelectorAll(`[${MARK_ATTR}~="${id}"]`)) {
    const marks = (node.getAttribute(MARK_ATTR) || '')
      .split(/\s+/)
      .filter((value) => value && value !== id);
    if (marks.length) node.setAttribute(MARK_ATTR, marks.join(' '));
    else node.removeAttribute(MARK_ATTR);
  }
}

/**
 * Page-level pass for `find` rules. Throttled so YouTube's DOM churn cannot
 * starve it; scoped to the active page manager.
 */
export function runFind(root = document) {
  if (!config) return;
  const findRules = RULES.filter((rule) => typeof rule.find === 'function');
  if (!findRules.length) return;
  const scope = root.querySelector?.(SEL.pageManager) || root;
  for (const rule of findRules) mark(rule, scope);
}

export function scheduleFind() {
  if (pageTimer) return;
  pageTimer = setTimeout(() => {
    pageTimer = 0;
    runFind(document);
  }, PAGE_INTERVAL_MS);
}
