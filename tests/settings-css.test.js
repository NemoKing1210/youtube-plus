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
