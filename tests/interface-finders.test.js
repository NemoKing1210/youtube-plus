import test from 'node:test';
import assert from 'node:assert/strict';
import { findWatched, findMostRelevant } from '../src/features/interface/finders.js';

test('findWatched returns only items with a resume overlay', () => {
  const watched = { querySelector: () => ({}) };
  const normal = { querySelector: () => null };
  const scope = { querySelectorAll: () => [watched, normal] };
  assert.deepEqual(findWatched(scope), [watched]);
});

test('findWatched tolerates an empty page', () => {
  assert.deepEqual(findWatched({ querySelectorAll: () => [] }), []);
});

test('findMostRelevant marks the section containing the shelf', () => {
  const section = { id: 'section' };
  const shelf = {
    querySelector: () => ({ textContent: 'Most relevant' }),
    closest: () => section,
  };
  const other = {
    querySelector: () => ({ textContent: 'Shorts' }),
    closest: () => ({ id: 'other' }),
  };
  const scope = { querySelectorAll: () => [shelf, other] };
  assert.deepEqual(findMostRelevant(scope), [section]);
});
