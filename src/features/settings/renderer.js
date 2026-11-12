import { getPath, setPath } from '../../core/schema.js';
import { t } from '../../i18n/index.js';
import { el } from '../../utils/dom.js';
import {
  createButton,
  createButtonRow,
  createHint,
  createNumber,
  createRow,
  createSelect,
  createSwitch,
  createTextarea,
} from './controls.js';

const label = (key) => (key ? t(key) : '');

function resolveOptions(spec) {
  const options = typeof spec.options === 'function' ? spec.options() : spec.options || [];
  return options.map((option) => ({
    value: option.value,
    label: option.label ?? t(option.labelKey),
  }));
}

function findId(spec) {
  return spec.path || spec.labelKey || spec.textKey || '';
}

/**
 * Turns a declarative tab spec into DOM bound to the settings draft.
 *
 * Tab spec: { id, titleKey, badge?(draft), sections: SectionSpec[] }
 *        or { id, titleKey, badge?, render(ctx) → Node }
 *
 * Control spec (`path` is relative to the feature's section):
 *   { type: 'switch', path, labelKey, hintKey? }
 *   { type: 'select', path, labelKey, hintKey?, options | () => options }
 *   { type: 'number', path, labelKey, hintKey?, min?, max?, step? }
 *   { type: 'textarea', path, labelKey, hintKey?, placeholder?, rows?, parse? }
 *   { type: 'hint', textKey }
 *   { type: 'button', labelKey, variant?, onClick(ctx) }
 *   { type: 'group', controls: ControlSpec[] }
 *   { type: 'custom', render(ctx) → Node }
 * `showIf(section, root)` hides a control or a section. A control may carry
 * `ruleId`, which is sent through `ctx.onPreview` on hover/focus.
 */
export function renderTab(tab, ctx) {
  const root = el('div', 'yp-tab');
  if (typeof tab.render === 'function') {
    root.append(tab.render(ctx));
    return { root };
  }

  const section = ctx.draft[ctx.featureId] ?? {};
  const visibility = [];
  const get = (spec) => getPath(section, spec.path);
  const set = (spec, value) => {
    setPath(section, spec.path, value);
    refresh();
    ctx.onChange?.();
  };

  function refresh() {
    for (const { node, showIf } of visibility) {
      node.hidden = !showIf(section, ctx.draft);
    }
  }

  function build(spec) {
    switch (spec.type) {
      case 'switch':
        return createSwitch({
          label: label(spec.labelKey),
          hint: label(spec.hintKey),
          checked: get(spec),
          onChange: (value) => set(spec, value),
        }).row;
      case 'select':
        return createSelect({
          label: label(spec.labelKey),
          hint: label(spec.hintKey),
          options: resolveOptions(spec),
          value: get(spec),
          onChange: (value) => set(spec, value),
        }).row;
      case 'number':
        return createNumber({
          label: label(spec.labelKey),
          hint: label(spec.hintKey),
          value: get(spec),
          min: spec.min,
          max: spec.max,
          step: spec.step,
          onChange: (value) => set(spec, value),
        }).row;
      case 'textarea': {
        const isList = spec.parse === 'list';
        const value = get(spec);
        return createTextarea({
          label: label(spec.labelKey),
          hint: label(spec.hintKey),
          value: isList ? (Array.isArray(value) ? value.join('\n') : '') : value,
          placeholder: spec.placeholder,
          rows: spec.rows,
          onChange: (text) => set(spec, isList ? text.split(/\r?\n/) : text),
        }).row;
      }
      case 'hint':
        return createHint(label(spec.textKey));
      case 'button':
        return createButtonRow(
          createButton({
            label: label(spec.labelKey),
            variant: spec.variant,
            onClick: () => spec.onClick?.(ctx),
          }),
        );
      case 'group': {
        const group = createRow('yp-group');
        for (const child of spec.controls) append(group, child);
        return group;
      }
      case 'custom':
        return spec.render(ctx);
      default:
        return null;
    }
  }

  function append(parent, spec) {
    const node = build(spec);
    if (!node) return;
    node.dataset.ypFind = findId(spec);
    if (spec.showIf) visibility.push({ node, showIf: spec.showIf });
    if (spec.ruleId) {
      node.addEventListener('pointerenter', () => ctx.onPreview?.(spec.ruleId));
      node.addEventListener('pointerleave', () => ctx.onPreview?.(null));
      node.addEventListener('focusin', () => ctx.onPreview?.(spec.ruleId));
      node.addEventListener('focusout', () => ctx.onPreview?.(null));
    }
    parent.append(node);
  }

  for (const sectionSpec of tab.sections || []) {
    const box = el('section', 'yp-section');
    box.dataset.ypFind = `${tab.id}:${sectionSpec.titleKey ?? ''}`;
    if (sectionSpec.titleKey) {
      box.append(el('h3', 'yp-section__title', t(sectionSpec.titleKey)));
    }
    if (sectionSpec.descKey) box.append(el('p', 'yp-section__desc', t(sectionSpec.descKey)));
    for (const spec of sectionSpec.controls || []) append(box, spec);
    if (sectionSpec.showIf) visibility.push({ node: box, showIf: sectionSpec.showIf });
    root.append(box);
  }

  refresh();
  return { root, refresh };
}

/** Build a section node for custom renderers. */
export function createSection(title) {
  const box = el('section', 'yp-section');
  if (title) box.append(el('h3', 'yp-section__title', title));
  return box;
}
