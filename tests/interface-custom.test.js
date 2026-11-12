import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSelector, sanitizeSelectors } from '../src/features/interface/custom.js';
import { buildInterfaceCss } from '../src/features/interface/css.js';

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

test('custom selectors produce a hiding rule', () => {
  const { css } = buildInterfaceCss([], { enabled: true }, { customSelectors: ['.ad', '.promo'] });
  assert.match(css, /\.ad\{display:none!important\}/);
  assert.match(css, /\.promo\{display:none!important\}/);
});
