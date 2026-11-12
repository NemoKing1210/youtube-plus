import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTitle, isMostRelevantTitle } from '../src/features/interface/titles.js';

test('normalizeTitle collapses whitespace and lowercases', () => {
  assert.equal(normalizeTitle('  Most   Relevant '), 'most relevant');
  assert.equal(normalizeTitle(null), '');
});

test('isMostRelevantTitle matches localized titles', () => {
  assert.equal(isMostRelevantTitle('Most relevant'), true);
  assert.equal(isMostRelevantTitle('Más relevantes'), true);
  assert.equal(isMostRelevantTitle('Самое актуальное'), true);
  assert.equal(isMostRelevantTitle('Shorts'), false);
});
