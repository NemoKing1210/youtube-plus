import test from 'node:test';
import assert from 'node:assert/strict';
import { field, defaultsOf, normalizeField, normalizeFields, getPath, setPath } from '../src/core/schema.js';

test('bool rejects non-boolean values', () => {
  assert.equal(normalizeField(field.bool(true), 'yes'), true);
  assert.equal(normalizeField(field.bool(true), false), false);
});

test('enum accepts listed values, resolves functions and falls back', () => {
  assert.equal(normalizeField(field.enum(['a', 'b'], 'a'), 'b'), 'b');
  assert.equal(normalizeField(field.enum(['a', 'b'], 'a'), 'c'), 'a');
  assert.equal(normalizeField(field.enum(() => ['x'], 'x'), 'x'), 'x');
  assert.equal(normalizeField(field.enum(() => ['x'], 'x'), 'y'), 'x');
});

test('int rounds, clamps and falls back', () => {
  const spec = field.int(5, { min: 1, max: 10 });
  assert.equal(normalizeField(spec, 7.6), 8);
  assert.equal(normalizeField(spec, 0), 1);
  assert.equal(normalizeField(spec, 99), 10);
  assert.equal(normalizeField(spec, 'nope'), 5);
});

test('string trims, caps and falls back', () => {
  const spec = field.string('', { maxLength: 5 });
  assert.equal(normalizeField(spec, '  abcdef  '), 'abcde');
  assert.equal(normalizeField(spec, 42), '');
  assert.equal(normalizeField(spec, '   '), '');
});

test('list normalizes items, drops empties and caps the count', () => {
  const spec = field.list(field.string('', { maxLength: 4 }), { maxItems: 2 });
  assert.deepEqual(normalizeField(spec, [' a ', 42, 'bbbbbb', 'c']), ['a', 'bbbb']);
  assert.deepEqual(normalizeField(spec, 'nope'), []);
});

test('list honours an empty or negative cap', () => {
  const items = field.list(field.string(''));
  assert.deepEqual(normalizeField(field.list(field.string(''), { maxItems: 0 }), ['a']), []);
  assert.deepEqual(normalizeField(field.list(field.string(''), { maxItems: -1 }), ['a']), []);
  assert.deepEqual(normalizeField(items, ['a']), ['a']);
});

test('list dedupes entries and drops null items', () => {
  const spec = field.list(field.string(''));
  assert.deepEqual(normalizeField(spec, [' a ', 'a']), ['a']);
  assert.deepEqual(normalizeField(spec, ['a', null]), ['a']);
});

test('list defaults are independent copies', () => {
  const fields = { items: field.list(field.string('')) };
  const first = defaultsOf(fields);
  first.items.push('x');
  assert.deepEqual(defaultsOf(fields).items, []);
});

test('record drops unknown keys and fills defaults', () => {
  const fields = { a: field.bool(true), nested: field.record({ b: field.int(2) }) };
  assert.deepEqual(
    normalizeFields(fields, { a: false, nested: { b: 4, z: 1 }, extra: 1 }),
    { a: false, nested: { b: 4 } },
  );
});

test('defaultsOf returns independent copies', () => {
  const fields = { r: field.record({ x: field.bool(true) }) };
  const first = defaultsOf(fields);
  const second = defaultsOf(fields);
  first.r.x = false;
  assert.equal(second.r.x, true);
});

test('getPath and setPath handle dotted paths', () => {
  const object = { a: { b: 1 } };
  assert.equal(getPath(object, 'a.b'), 1);
  assert.equal(getPath(object, 'a.z'), undefined);
  setPath(object, 'a.c.d', 2);
  assert.equal(object.a.c.d, 2);
});
