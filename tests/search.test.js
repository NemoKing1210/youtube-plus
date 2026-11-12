import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, matches, buildIndex, searchIndex } from '../src/features/settings/search.js';
import { playerTab } from '../src/features/player/settings.js';

test('buildIndex resolves function-valued options', () => {
  const index = buildIndex([playerTab()]);
  assert.ok(index.some((entry) => entry.text.includes('1080')));
  assert.ok(searchIndex(index, '1080').length > 0);
});

test('tokenize lowercases and splits on whitespace', () => {
  assert.deepEqual(tokenize('  Player   Speed '), ['player', 'speed']);
});

test('matches requires every token', () => {
  assert.equal(matches('Player speed preference', ['speed']), true);
  assert.equal(matches('Player speed preference', ['player', 'speed']), true);
  assert.equal(matches('Player speed preference', ['player', 'comments']), false);
});

test('buildIndex indexes textarea controls', () => {
  const tabs = [{
    id: 'custom',
    titleKey: 'interface.title',
    sections: [{
      titleKey: 'interface.custom.title',
      controls: [{
        type: 'textarea',
        path: 'custom.selectors',
        labelKey: 'interface.custom.selectors',
        hintKey: 'interface.custom.selectorsHint',
      }],
    }],
  }];
  const index = buildIndex(tabs);
  assert.ok(index.some((entry) => entry.id === 'custom.selectors' && entry.label));
});

test('buildIndex indexes section descriptions', () => {
  const tabs = [{
    id: 't',
    titleKey: 'player.title',
    sections: [{
      titleKey: 'player.section',
      descKey: 'player.loopHint',
      controls: [{ type: 'switch', path: 'loop', labelKey: 'player.loop' }],
    }],
  }];
  const index = buildIndex(tabs);
  assert.ok(searchIndex(index, 'current video').length > 0);
  assert.equal(index[0].sectionTitle, 'Playback');
});
