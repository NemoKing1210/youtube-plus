/** Localized shelf titles, normalized so a finder can recognize them. */

export function normalizeTitle(value) {
  return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export const MOST_RELEVANT_TITLES = new Set([
  'most relevant',
  'más relevantes',
  'mais relevantes',
  'am relevantesten',
  'les plus pertinentes',
  'самое актуальное',
  '最も関連性の高い動画',
  '最相关',
]);

export function isMostRelevantTitle(value) {
  return MOST_RELEVANT_TITLES.has(normalizeTitle(value));
}
