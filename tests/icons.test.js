import test from 'node:test';
import assert from 'node:assert/strict';
import { ICON_NAMES } from '../src/ui/icons.js';

test('settings and tab icons exist', () => {
  for (const name of ['settings', 'close', 'search', 'info', 'eyeOff', 'grid', 'play', 'download', 'chevronDown']) {
    assert.ok(ICON_NAMES.includes(name), name);
  }
});
