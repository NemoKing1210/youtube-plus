import { ruleId } from './rules.js';

/**
 * Build the hiding stylesheet for the enabled rules. A previewed rule is
 * excluded and its selectors returned so the engine can outline them instead.
 *
 * @param {Array<{group:string,key:string,css?:string[]}>} rules
 * @param {object} cfg - the `interface` settings section
 * @param {{ hoveredId?: string|null }} [options]
 * @returns {{ css: string, previewSelectors: string[] }}
 */
export function buildInterfaceCss(rules, cfg, { hoveredId = null } = {}) {
  if (!cfg?.enabled) return { css: '', previewSelectors: [] };

  const chunks = [];
  let previewSelectors = [];

  for (const rule of rules) {
    if (cfg[rule.group]?.[rule.key] !== true) continue;
    const selectors = rule.css ? (Array.isArray(rule.css) ? rule.css : [rule.css]) : [];
    if (!selectors.length) continue;
    if (ruleId(rule) === hoveredId) {
      previewSelectors = selectors;
      continue;
    }
    for (const selector of selectors) chunks.push(`${selector}{display:none!important}`);
  }

  return { css: chunks.join('\n'), previewSelectors };
}
