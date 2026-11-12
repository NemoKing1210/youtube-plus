import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/locales/en.js';
import ru from '../src/i18n/locales/ru.js';
import zh from '../src/i18n/locales/zh.js';
import es from '../src/i18n/locales/es.js';
import pt from '../src/i18n/locales/pt.js';
import de from '../src/i18n/locales/de.js';
import fr from '../src/i18n/locales/fr.js';
import ja from '../src/i18n/locales/ja.js';

const locales = { en, ru, zh, es, pt, de, fr, ja };

test('all locales define the same keys', () => {
  const expected = Object.keys(en).sort();
  for (const [name, map] of Object.entries(locales)) {
    assert.deepEqual(Object.keys(map).sort(), expected, name);
  }
});

test('card descriptions exist for every interface group', () => {
  for (const group of ['feed', 'nav', 'subscriptions', 'search', 'watch', 'channel', 'chrome']) {
    assert.ok(`interface.group.${group}Desc` in en, group);
  }
});
