import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, matches } from '../src/features/settings/search.js';

test('tokenize lowercases and splits on whitespace', () => {
  assert.deepEqual(tokenize('  Player   Speed '), ['player', 'speed']);
});

test('matches requires every token', () => {
  assert.equal(matches('Player speed preference', ['speed']), true);
  assert.equal(matches('Player speed preference', ['player', 'speed']), true);
  assert.equal(matches('Player speed preference', ['player', 'comments']), false);
});
