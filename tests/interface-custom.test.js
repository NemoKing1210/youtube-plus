import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSelector, sanitizeSelectors } from '../src/features/interface/custom.js';
import { buildInterfaceCss } from '../src/features/interface/css.js';
import { interfaceFields } from '../src/features/interface/settings.js';
import { normalizeFields } from '../src/core/schema.js';

test('sanitizeSelector accepts normal selectors', () => {
  assert.equal(
    sanitizeSelector('  ytd-watch-metadata #foo > .bar  '),
    'ytd-watch-metadata #foo > .bar',
  );
});

test('sanitizeSelector rejects CSS injection and empty values', () => {
  assert.equal(sanitizeSelector('body { display: none }'), null);
  assert.equal(sanitizeSelector('a; b'), null);
  assert.equal(sanitizeSelector('@media x'), null);
  assert.equal(sanitizeSelector('a\nb'), null);
  assert.equal(sanitizeSelector(''), null);
  assert.equal(sanitizeSelector('x'.repeat(301)), null);
});

test('sanitizeSelector allows a bare slash', () => {
  assert.equal(sanitizeSelector('a[href^="/watch"]'), 'a[href^="/watch"]');
});

test('sanitizeSelector rejects comment delimiters and backslashes', () => {
  assert.equal(sanitizeSelector('a/*x*/'), null);
  assert.equal(sanitizeSelector('a*/b'), null);
  assert.equal(sanitizeSelector('a\\'), null);
});

test('sanitizeSelector enforces the exact length boundary', () => {
  assert.equal(sanitizeSelector('x'.repeat(300)), 'x'.repeat(300));
  assert.equal(sanitizeSelector('x'.repeat(301)), null);
});

test('sanitizeSelectors dedupes, caps and preserves order', () => {
  const list = Array.from({ length: 60 }, (_, i) => `.c${i}`);
  list.push('.c0', '');
  const out = sanitizeSelectors(list);
  assert.equal(out.length, 50);
  assert.equal(out[0], '.c0');
  assert.equal(out[49], '.c49');
});

test('over-long selectors survive normalization and are dropped by the sanitizer', () => {
  const overLong = 'x'.repeat(301);
  const normalized = normalizeFields(interfaceFields(), {
    custom: { enabled: true, selectors: [overLong] },
  });
  // The schema cap (1000) is a storage guard: it must not truncate the line
  // into a shorter selector that could match unintended elements.
  assert.equal(normalized.custom.selectors.length, 1);
  assert.equal(normalized.custom.selectors[0].length, 301);
  // The sanitizer enforces the real 300-character limit.
  assert.deepEqual(sanitizeSelectors(normalized.custom.selectors), []);
});

test('custom selectors produce a hiding rule', () => {
  const { css } = buildInterfaceCss([], { enabled: true }, { customSelectors: ['.ad', '.promo'] });
  assert.match(css, /\.ad\{display:none!important\}/);
  assert.match(css, /\.promo\{display:none!important\}/);
});
