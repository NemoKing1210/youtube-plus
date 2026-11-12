import { field } from '../../core/schema.js';
import { GROUPS, RULES, ruleLabelKey } from './rules.js';

/** Derive the settings fields from the rule list. */
export function interfaceFields(rules = RULES) {
  const groups = {};
  for (const rule of rules) {
    if (!groups[rule.group]) groups[rule.group] = {};
    groups[rule.group][rule.key] = field.bool(rule.on === true);
  }

  const fields = { enabled: field.bool(true) };
  for (const [group, groupFields] of Object.entries(groups)) {
    fields[group] = field.record(groupFields);
  }
  fields.custom = field.record({
    enabled: field.bool(false),
    // Storage guard only. Keep over-long lines intact so the sanitizer can
    // reject them (> MAX_SELECTOR_LENGTH) instead of truncating them into a
    // shorter selector that might match unintended elements.
    selectors: field.list(field.string('', { maxLength: 1000 }), { maxItems: 50 }),
  });
  return fields;
}

/** Derive the Interface tab from the rule list. */
export function interfaceTab(rules = RULES) {
  const sections = [
    {
      titleKey: 'interface.section',
      controls: [
        { type: 'switch', path: 'enabled', labelKey: 'interface.enabled' },
        { type: 'hint', textKey: 'interface.hint' },
      ],
    },
  ];

  for (const group of GROUPS) {
    const groupRules = rules.filter((rule) => rule.group === group);
    if (!groupRules.length) continue;
    sections.push({
      titleKey: `interface.group.${group}`,
      showIf: (section) => section.enabled === true,
      controls: groupRules.map((rule) => ({
        type: 'switch',
        path: `${group}.${rule.key}`,
        labelKey: ruleLabelKey(rule),
        hintKey: rule.hint
          ? `${ruleLabelKey(rule)}Hint`
          : rule.experimental
            ? 'interface.experimentalHint'
            : undefined,
        ruleId: `${group}.${rule.key}`,
      })),
    });
  }

  sections.push({
    titleKey: 'interface.custom.title',
    showIf: (section) => section.enabled === true,
    controls: [
      { type: 'switch', path: 'custom.enabled', labelKey: 'interface.custom.enabled' },
      {
        type: 'textarea',
        path: 'custom.selectors',
        labelKey: 'interface.custom.selectors',
        hintKey: 'interface.custom.selectorsHint',
        rows: 5,
        parse: 'list',
        showIf: (section) => section.custom?.enabled === true,
      },
      { type: 'hint', textKey: 'interface.custom.warning' },
    ],
  });

  return { id: 'interface', titleKey: 'interface.title', sections };
}
