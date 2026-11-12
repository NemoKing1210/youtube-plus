import assert from 'node:assert/strict';
import test from 'node:test';
import { setRevealed } from '../src/features/settings/reveal.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fakeNode({ connected = true, hidden = false } = {}) {
  const classes = new Set();
  return {
    hidden,
    isConnected: connected,
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
    },
    classes,
  };
}

function setReducedMotion(matches) {
  globalThis.window = { matchMedia: () => ({ matches }) };
  return () => {
    delete globalThis.window;
  };
}

test('a disconnected node hides synchronously without animation classes', () => {
  const restore = setReducedMotion(false);
  const node = fakeNode({ connected: false });
  setRevealed(node, false);
  assert.equal(node.hidden, true);
  assert.equal(node.classes.size, 0);
  restore();
});

test('a disconnected node becomes visible without animation classes', () => {
  const restore = setReducedMotion(false);
  const node = fakeNode({ connected: false, hidden: true });
  setRevealed(node, true);
  assert.equal(node.hidden, false);
  assert.equal(node.classes.size, 0);
  restore();
});

test('showing fades in through is-revealing and clears it after the duration', async () => {
  const restore = setReducedMotion(false);
  const node = fakeNode({ hidden: true });
  setRevealed(node, true, { duration: 20 });
  assert.equal(node.hidden, false);
  assert.ok(node.classList.contains('is-revealing'));
  await sleep(50);
  assert.equal(node.classList.contains('is-revealing'), false);
  restore();
});

test('hiding is capped at 120ms even when a longer duration is passed', async () => {
  const restore = setReducedMotion(false);
  const node = fakeNode();
  setRevealed(node, false, { duration: 400 });
  assert.ok(node.classList.contains('is-hiding'));
  await sleep(220);
  assert.equal(node.hidden, true);
  assert.equal(node.classList.contains('is-hiding'), false);
  restore();
});

test('a rapid show then hide settles hidden with no stuck class', async () => {
  const restore = setReducedMotion(false);
  const node = fakeNode({ hidden: true });
  setRevealed(node, true, { duration: 20 });
  setRevealed(node, false, { duration: 20 });
  await sleep(80);
  assert.equal(node.hidden, true);
  assert.equal(node.classes.size, 0);
  restore();
});

test('reduced motion toggles hidden immediately with no classes', () => {
  const restore = setReducedMotion(true);
  const node = fakeNode();
  setRevealed(node, false);
  assert.equal(node.hidden, true);
  assert.equal(node.classes.size, 0);
  setRevealed(node, true);
  assert.equal(node.hidden, false);
  assert.equal(node.classes.size, 0);
  restore();
});
