import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

const REQUIRED = [
  '--yp-primary', '--yp-primary-soft', '--yp-on-primary', '--yp-danger',
  '--yp-brand', '--yp-surface', '--yp-surface-2', '--yp-surface-3',
  '--yp-border', '--yp-muted', '--yp-radius-card', '--yp-radius-dialog',
  '--yp-duration-fast', '--yp-duration', '--yp-duration-slow', '--yp-ease',
];

test('every required token is declared', () => {
  for (const token of REQUIRED) assert.match(css, new RegExp(`${token}:`), token);
});

test('dark and light define the theme-dependent tokens', () => {
  const dark = css.slice(css.indexOf("data-yp-theme='dark'"), css.indexOf("data-yp-theme='light'"));
  const light = css.slice(css.indexOf("data-yp-theme='light'"), css.indexOf(':root:not'));
  for (const token of ['--yp-primary', '--yp-surface', '--yp-surface-2', '--yp-border', '--yp-muted']) {
    assert.match(dark, new RegExp(`${token}:`), `dark ${token}`);
    assert.match(light, new RegExp(`${token}:`), `light ${token}`);
  }
  assert.match(dark, /--yp-primary:\s*#3ea6ff/i);
  assert.match(light, /--yp-primary:\s*#065fd4/i);
});
