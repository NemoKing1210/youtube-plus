import test from 'node:test';
import assert from 'node:assert/strict';
import { emit, on } from '../src/core/bus.js';

test('emit passes arguments and unsubscribe removes the listener', () => {
  const seen = [];
  const off = on('demo', (...args) => seen.push(args));
  emit('demo', 1, 'two');
  off();
  emit('demo', 3);
  assert.deepEqual(seen, [[1, 'two']]);
});

test('a throwing listener does not block the others', (t) => {
  const spy = t.mock.method(console, 'error', () => {});
  const seen = [];
  on('throwing', () => {
    throw new Error('boom');
  });
  on('throwing', (value) => seen.push(value));
  emit('throwing', 42);
  assert.deepEqual(seen, [42]);
  assert.equal(spy.mock.callCount(), 1);
});
