import { ruleId } from './rules.js';
import { sanitizeSelectors } from './custom.js';

/**
 * Build the hiding stylesheet for the enabled rules. A previewed rule is
 * excluded and its selectors returned so the engine can outline them instead.
 * Custom selectors are sanitized here as well as at the settings boundary
 * (defense in depth), so raw input never reaches the stylesheet.
 *
 * @param {Array<{group:string,key:string,css?:string[]}>} rules
 * @param {object} cfg - the `interface` settings section
 * @param {{ hoveredId?: string|null, customSelectors?: string[] }} [options]
 * @returns {{ css: string, previewSelectors: string[] }}
 */
export function buildInterfaceCss(rules, cfg, { hoveredId = null, customSelectors = [] } = {}) {
  if (!cfg?.enabled) return { css: '', previewSelectors: [] };

  const chunks = [];
  let previewSelectors = [];

  for (const rule of rules) {
    const isHovered = ruleId(rule) === hoveredId;
    if (!isHovered && cfg[rule.group]?.[rule.key] !== true) continue;
    const selectors = rule.css ? (Array.isArray(rule.css) ? rule.css : [rule.css]) : [];
    if (!selectors.length) continue;
    if (isHovered) {
      previewSelectors = selectors;
      continue;
    }
    for (const selector of selectors) chunks.push(`${selector}{display:none!important}`);
  }

  for (const selector of sanitizeSelectors(customSelectors)) {
    chunks.push(`${selector}{display:none!important}`);
  }

  return { css: chunks.join('\n'), previewSelectors };
}
