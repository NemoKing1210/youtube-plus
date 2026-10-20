import test from 'node:test';
import assert from 'node:assert/strict';
import { registerFeature, getFeatures, runHook } from '../src/core/features.js';

test('registerFeature validates id and fields', () => {
  assert.throws(() => registerFeature({ fields: {} }), /id/);
  assert.throws(() => registerFeature({ id: 'no-fields' }), /fields/);
});

test('features are ordered and duplicates are rejected', () => {
  registerFeature({ id: 'later', order: 50, fields: {} });
  registerFeature({ id: 'earlier', order: 10, fields: {} });
  assert.throws(() => registerFeature({ id: 'later', order: 60, fields: {} }), /duplicate/);
  const ids = getFeatures()
    .map((feature) => feature.id)
    .filter((id) => id === 'earlier' || id === 'later');
  assert.deepEqual(ids, ['earlier', 'later']);
});

test('a failing hook does not block the next feature', (t) => {
  const spy = t.mock.method(console, 'error', () => {});
  const seen = [];
  registerFeature({
    id: 'h1',
    order: 1,
    fields: {},
    scan() {
      throw new Error('boom');
    },
  });
  registerFeature({
    id: 'h2',
    order: 2,
    fields: {},
    scan() {
      seen.push('h2');
    },
  });
  runHook('scan', {});
  assert.deepEqual(seen, ['h2']);
  assert.equal(spy.mock.callCount(), 1);
});
