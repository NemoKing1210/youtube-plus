import { el } from '../../utils/dom.js';
import { iconNode } from '../../ui/icons.js';
import { attachRipple } from '../../ui/ripple.js';

export function createRow(className = '') {
  return el('div', `yp-row${className ? ` ${className}` : ''}`);
}

function textBlock(label, hint) {
  const text = el('div', 'yp-row__text');
  text.append(el('span', 'yp-row__label', label));
  if (hint) text.append(el('span', 'yp-row__hint', hint));
  return text;
}

export function createSwitch({ label, hint, checked, onChange }) {
  const row = createRow('yp-row--switch');
  const control = el('label', 'yp-switch');
  const input = el('input', 'yp-switch__input');
  input.type = 'checkbox';
  input.checked = Boolean(checked);
  input.setAttribute('aria-label', label);
  input.addEventListener('change', () => onChange(input.checked));
  const track = el('span', 'yp-switch__track');
  track.setAttribute('aria-hidden', 'true');
  control.append(input, track);
  row.append(textBlock(label, hint), control);
  return { row, input };
}

export function createSelect({ label, hint, options, value, onChange }) {
  const row = createRow('yp-row--select');
  const wrapper = el('span', 'yp-select');
  const control = el('select', 'yp-select__input');
  control.setAttribute('aria-label', label);
  for (const option of options) {
    const node = document.createElement('option');
    node.value = option.value;
    node.textContent = option.label;
    node.selected = option.value === value;
    control.append(node);
  }
  control.addEventListener('change', () => onChange(control.value));
  const chevron = el('span', 'yp-select__chevron');
  chevron.append(iconNode('chevronDown', 18));
  wrapper.append(control, chevron);
  row.append(textBlock(label, hint), wrapper);
  return { row, control };
}

export function createNumber({ label, hint, value, min, max, step, onChange }) {
  const row = createRow('yp-row--number');
  const control = el('input', 'yp-number');
  control.type = 'number';
  control.inputMode = 'numeric';
  control.setAttribute('aria-label', label);
  if (Number.isFinite(min)) control.min = String(min);
  if (Number.isFinite(max)) control.max = String(max);
  if (Number.isFinite(step)) control.step = String(step);
  control.value = String(value ?? '');
  const commit = () => {
    const next = Number(control.value);
    if (!Number.isFinite(next)) {
      control.value = String(value ?? '');
      return;
    }
    onChange(next);
  };
  control.addEventListener('change', commit);
  row.append(textBlock(label, hint), control);
  return { row, control };
}

export function createTextarea({ label, hint, value, placeholder, rows = 4, onChange }) {
  const row = createRow('yp-row--textarea');
  const control = el('textarea', 'yp-textarea');
  control.rows = rows;
  control.value = String(value ?? '');
  control.setAttribute('aria-label', label);
  if (placeholder) control.placeholder = placeholder;
  control.spellcheck = false;
  control.addEventListener('change', () => onChange(control.value));
  row.append(textBlock(label, hint), control);
  return { row, control };
}

export function createHint(text) {
  const hint = el('p', 'yp-hint');
  const glyph = el('span', 'yp-hint__icon');
  glyph.append(iconNode('info', 16));
  hint.append(glyph, text);
  return hint;
}

export function createButton({ label, variant = 'ghost', onClick }) {
  const button = el('button', `yp-btn-ui yp-btn-ui--${variant}`, label);
  button.type = 'button';
  attachRipple(button);
  button.addEventListener('click', onClick);
  return button;
}

export function createButtonRow(button) {
  const row = createRow('yp-row--button');
  row.append(button);
  return row;
}
