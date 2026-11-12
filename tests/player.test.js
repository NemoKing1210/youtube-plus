import test from 'node:test';
import assert from 'node:assert/strict';
import { stepSpeed } from '../src/features/player/speed.js';
import { qualityLevel } from '../src/features/player/quality.js';
import { shouldRestore, prunePositions, MAX_POSITIONS, TTL_MS } from '../src/features/player/positions.js';
import { clampVolume, volumeFromPercent } from '../src/features/player/volume.js';
import { applyLoop } from '../src/features/player/loop.js';

test('stepSpeed moves by 0.25 and clamps', () => {
  assert.equal(stepSpeed(1, 0.25), 1.25);
  assert.equal(stepSpeed(2, 0.25), 2);
  assert.equal(stepSpeed(0.25, -0.25), 0.25);
  assert.equal(stepSpeed(1.1, 0.25), 1.35);
});

test('qualityLevel maps preferences', () => {
  assert.equal(qualityLevel('1080'), 'hd1080');
  assert.equal(qualityLevel('480'), 'large');
  assert.equal(qualityLevel('auto'), null);
  assert.equal(qualityLevel('unknown'), null);
});

test('qualityLevel maps 4K and 8K preferences', () => {
  assert.equal(qualityLevel('4320'), 'highres');
  assert.equal(qualityLevel('2160'), 'hd2160');
  assert.equal(qualityLevel('1440'), 'hd1440');
  assert.equal(qualityLevel('144'), 'tiny');
});

test('shouldRestore uses the 10s / duration-15s window', () => {
  assert.equal(shouldRestore({ t: 10 }, 100), true);
  assert.equal(shouldRestore({ t: 9.9 }, 100), false);
  assert.equal(shouldRestore({ t: 85 }, 100), true);
  assert.equal(shouldRestore({ t: 85.1 }, 100), false);
  assert.equal(shouldRestore(null, 100), false);
  assert.equal(shouldRestore({ t: 10 }, NaN), false);
});

test('volume helpers clamp and convert percentages', () => {
  assert.equal(volumeFromPercent(70), 0.7);
  assert.equal(volumeFromPercent(150), 1);
  assert.equal(volumeFromPercent(-5), 0);
  assert.equal(volumeFromPercent('x'), 1);
  assert.equal(clampVolume(0.4), 0.4);
  assert.equal(clampVolume(NaN, 0.5), 0.5);
});

test('applyLoop sets the video loop flag', () => {
  const video = { loop: false };
  assert.equal(applyLoop(video, true), true);
  assert.equal(video.loop, true);
  assert.equal(applyLoop(video, false), true);
  assert.equal(video.loop, false);
  assert.equal(applyLoop(null, true), false);
});

test('prunePositions drops expired entries and keeps the newest 500', () => {
  const now = 10 * TTL_MS;
  const map = { old: { t: 20, at: now - TTL_MS - 1 }, fresh: { t: 30, at: now } };
  assert.deepEqual(Object.keys(prunePositions(map, now)), ['fresh']);

  const many = {};
  for (let i = 0; i < MAX_POSITIONS + 5; i += 1) {
    many[`v${i}`] = { t: 10, at: now - (MAX_POSITIONS + 5) + i };
  }
  const pruned = prunePositions(many, now);
  assert.equal(Object.keys(pruned).length, MAX_POSITIONS);
  assert.ok(!('v1' in pruned));
});
