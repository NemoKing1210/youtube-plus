import test from 'node:test';
import assert from 'node:assert/strict';
import { generalTab } from '../src/features/general/settings.js';
import { interfaceTab } from '../src/features/interface/settings.js';
import { layoutTab } from '../src/features/layout/settings.js';
import { playerTab } from '../src/features/player/settings.js';
import { aboutTab } from '../src/features/settings/tabs/about.js';
import { ICON_NAMES } from '../src/ui/icons.js';
import en from '../src/i18n/locales/en.js';

const tabs = [generalTab(), interfaceTab(), layoutTab(), playerTab(), aboutTab];

test('tab ids, titles and icons', () => {
  const ids = tabs.map((tab) => tab.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const tab of tabs) {
    assert.ok(tab.titleKey in en, tab.id);
    assert.ok(ICON_NAMES.includes(tab.icon), `${tab.id}: ${tab.icon}`);
  }
});

test('spec tabs have titled sections and unique control paths', () => {
  for (const tab of tabs) {
    if (!tab.sections) continue; // custom render() tabs
    const paths = [];
    for (const section of tab.sections) {
      assert.ok(section.titleKey in en, `${tab.id} section`);
      if (section.descKey) assert.ok(section.descKey in en, `${tab.id} ${section.descKey}`);
      for (const control of section.controls || []) {
        if (control.hintKey) assert.ok(control.hintKey in en, control.hintKey);
        if (control.path) paths.push(control.path);
      }
    }
    assert.equal(new Set(paths).size, paths.length, `${tab.id} duplicate path`);
  }
});
