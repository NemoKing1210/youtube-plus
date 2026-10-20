import test from 'node:test';
import assert from 'node:assert/strict';
import { configureLocale, t } from '../src/i18n/index.js';
import { getFeatures } from '../src/core/features.js';
import '../src/features/general/index.js';

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

test('the language auto option follows the active locale', () => {
  configureLocale('ru');
  const general = getFeatures().find((feature) => feature.id === 'general');
  const language = general.tabs[0].sections[0].controls.find((control) => control.path === 'language');
  const options = typeof language.options === 'function' ? language.options() : language.options;
  assert.ok(options[0].label.includes('Автоматически'));
});
