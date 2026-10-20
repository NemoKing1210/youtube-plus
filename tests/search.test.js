import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, matches, buildIndex, searchIndex } from '../src/features/settings/search.js';
import { playerTab } from '../src/features/player/settings.js';

test('buildIndex resolves function-valued options', () => {
  const index = buildIndex([playerTab()]);
  assert.ok(index.some((entry) => entry.text.includes('1080')));
  assert.ok(searchIndex(index, '1080').length > 0);
});

test('tokenize lowercases and splits on whitespace', () => {
  assert.deepEqual(tokenize('  Player   Speed '), ['player', 'speed']);
});

test('matches requires every token', () => {
  assert.equal(matches('Player speed preference', ['speed']), true);
  assert.equal(matches('Player speed preference', ['player', 'speed']), true);
  assert.equal(matches('Player speed preference', ['player', 'comments']), false);
});
