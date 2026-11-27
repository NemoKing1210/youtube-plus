import { el } from '../../utils/dom.js';
import { makeMatcher } from './search.js';

export function highlightSegments(text, search, regex = false) {
  const { pattern } = makeMatcher(search, regex, 'giu');
  if (!pattern) return [{ text, match: false }];

  const segments = [];
  let position = 0;
  for (const match of text.matchAll(pattern)) {
    if (!match[0]) continue;
    if (match.index > position) segments.push({ text: text.slice(position, match.index), match: false });
    segments.push({ text: match[0], match: true });
    position = match.index + match[0].length;
  }
  if (position < text.length || !segments.length) segments.push({ text: text.slice(position), match: false });
  return segments;
}

export function highlightText(node, text, search, regex = false) {
  for (const segment of highlightSegments(text, search, regex)) {
    node.append(segment.match ? el('mark', 'yp-ck-highlight', segment.text) : segment.text);
  }
}
