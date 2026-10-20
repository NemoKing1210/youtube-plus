import test from 'node:test';
import assert from 'node:assert/strict';
import { configureLocale, t } from '../src/i18n/index.js';

test('t uses the configured locale, falls back to English, then to the key', () => {
  configureLocale('en');
  assert.equal(t('menu.settings'), 'Settings');
  configureLocale('ru');
  assert.equal(t('menu.settings'), 'Настройки');
  assert.equal(t('missing.key'), 'missing.key');
});

test('fmt substitutes named variables', () => {
  configureLocale('en');
  assert.equal(t('toast.progress', { percent: 42 }), '42%');
});
