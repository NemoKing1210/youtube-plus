import { t } from '../../i18n/index.js';

/** Split a query into lower-case tokens. */
export function tokenize(text) {
  return String(text ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

/** True when every token occurs in `text`. */
export function matches(text, tokens) {
  const haystack = String(text ?? '').toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function controlText(control) {
  const label = control.labelKey ? t(control.labelKey) : control.textKey ? t(control.textKey) : '';
  const hint = control.hintKey ? t(control.hintKey) : '';
  const options = (control.options || []).map((option) => option.label ?? t(option.labelKey));
  return { label, hint, text: [label, hint, ...options].join(' ') };
}

/**
 * Flatten tab specs into searchable entries. Built from the specs, so a
 * control is searchable as soon as it declares a label — no extra metadata.
 */
export function buildIndex(tabs) {
  const index = [];
  for (const tab of tabs) {
    const tabTitle = t(tab.titleKey);
    if (typeof tab.render === 'function' || !tab.sections) {
      index.push({
        kind: 'tab',
        id: `tab:${tab.id}`,
        tabId: tab.id,
        tabTitle,
        sectionTitle: '',
        label: tabTitle,
        hint: '',
        text: tabTitle,
      });
      continue;
    }
    for (const section of tab.sections) {
      const sectionTitle = section.titleKey ? t(section.titleKey) : '';
      const sectionId = `${tab.id}:${section.titleKey ?? index.length}`;
      for (const control of section.controls || []) {
        const { label, hint, text } = controlText(control);
        if (!label) continue;
        index.push({
          kind: 'control',
          id: control.path || control.labelKey || control.textKey || '',
          tabId: tab.id,
          tabTitle,
          sectionId,
          sectionTitle,
          label,
          hint,
          text: `${sectionTitle} ${text}`,
        });
      }
    }
  }
  return index;
}

function score(entry, tokens) {
  const label = entry.label.toLowerCase();
  let value = 0;
  if (label === tokens.join(' ')) value += 4;
  if (label.startsWith(tokens[0])) value += 2;
  if (tokens.every((token) => label.includes(token))) value += 1;
  return value;
}

export function searchIndex(index, query) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  return index
    .filter((entry) => matches(entry.text, tokens))
    .sort((a, b) => score(b, tokens) - score(a, tokens));
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wrap matched tokens in `<mark>` (DOM only). */
export function highlight(text, tokens) {
  const fragment = document.createDocumentFragment();
  if (!tokens.length) {
    fragment.append(document.createTextNode(text));
    return fragment;
  }
  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'ig');
  let last = 0;
  for (const match of String(text).matchAll(pattern)) {
    if (match.index > last) {
      fragment.append(document.createTextNode(text.slice(last, match.index)));
    }
    const mark = document.createElement('mark');
    mark.textContent = match[0];
    fragment.append(mark);
    last = match.index + match[0].length;
  }
  if (last < text.length) fragment.append(document.createTextNode(text.slice(last)));
  return fragment;
}
