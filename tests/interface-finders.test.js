import test from 'node:test';
import assert from 'node:assert/strict';
import { findWatched } from '../src/features/interface/finders.js';

test('findWatched returns only items with a resume overlay', () => {
  const watched = { querySelector: () => ({}) };
  const normal = { querySelector: () => null };
  const scope = { querySelectorAll: () => [watched, normal] };
  assert.deepEqual(findWatched(scope), [watched]);
});

test('findWatched tolerates an empty page', () => {
  assert.deepEqual(findWatched({ querySelectorAll: () => [] }), []);
});
