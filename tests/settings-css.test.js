import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const css = readFileSync(
  join(import.meta.dirname, '..', 'src', 'styles', 'settings.css'),
  'utf8',
);

/** Return the declaration block of the first rule whose selector matches. */
function ruleBlock(selectorPattern) {
  const match = css.match(new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`));
  return match ? match[1] : null;
}

test('hidden attribute wins over component display rules', () => {
  const block = ruleBlock(String.raw`\.yp-settings\s+\[hidden\]`);
  assert.ok(block, 'settings.css must scope a [hidden] rule to the dialog');
  assert.match(block, /display:\s*none/);
});

test('conditional rows have reveal and hide animations', () => {
  assert.match(css, /\.is-revealing[^{]*\{[^}]*animation:/);
  assert.match(css, /\.is-hiding[^{]*\{[^}]*animation:/);
  assert.match(css, /@keyframes\s+yp-reveal-in/);
  assert.match(css, /@keyframes\s+yp-reveal-out/);
});

test('the dialog gives navigation and actions their own space around the scrolling pane', () => {
  const dialog = ruleBlock(String.raw`(?:^|\n)\.yp-settings`);
  assert.match(dialog, /'header header'\s+auto\s+'tabs content'\s+minmax\([^)]*,\s*1fr\)\s+'actions actions'\s+auto/);
  assert.match(css, /'header'\s+auto\s+'tabs'\s+auto\s+'content'\s+minmax\([^)]*,\s*1fr\)\s+'actions'\s+auto/);
  assert.match(ruleBlock(String.raw`\.yp-settings__body`), /overflow:\s*auto/);
});

test('new settings entrances and press effects require full motion', () => {
  const start = css.indexOf('@media (prefers-reduced-motion: no-preference)');
  const end = css.indexOf('@media (prefers-reduced-motion: reduce)', start);
  assert.ok(start >= 0 && end > start);
  const motion = css.slice(start, end);
  assert.match(motion, /\.yp-settings__panel:not\(\[hidden\]\)/);
  assert.match(motion, /\.yp-hits:not\(\[hidden\]\)/);
  assert.match(motion, /\.yp-confirm\s*\{[^}]*animation:/);
  assert.match(motion, /\.yp-settings__tab:active/);
  assert.match(motion, /\.yp-switch__input:active/);
});
