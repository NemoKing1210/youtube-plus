import test from 'node:test';
import assert from 'node:assert/strict';
import { syncMarks, MARK_ATTR } from '../src/features/interface/engine.js';

function node(attrs = {}) {
  return {
    attrs: { ...attrs },
    getAttribute(name) { return this.attrs[name] ?? null; },
    setAttribute(name, value) { this.attrs[name] = String(value); },
    removeAttribute(name) { delete this.attrs[name]; },
  };
}

function root(nodes) {
  return {
    querySelectorAll(selector) {
      const match = /^\[([\w-]+)~="([^"]+)"\]$/.exec(selector);
      if (!match) return [];
      const [, attr, id] = match;
      return nodes.filter((item) => (item.attrs[attr] || '').split(/\s+/).includes(id));
    },
  };
}

test('syncMarks adds marks and removes stale ones', () => {
  const a = node();
  const b = node();
  const scope = root([a, b]);
  syncMarks(scope, MARK_ATTR, 'feed.watched', [a, b]);
  assert.equal(a.getAttribute(MARK_ATTR), 'feed.watched');
  assert.equal(b.getAttribute(MARK_ATTR), 'feed.watched');
  syncMarks(scope, MARK_ATTR, 'feed.watched', [a]);
  assert.equal(a.getAttribute(MARK_ATTR), 'feed.watched');
  assert.equal(b.getAttribute(MARK_ATTR), null);
});

test('syncMarks preserves other rules marks', () => {
  const a = node({ [MARK_ATTR]: 'other' });
  const scope = root([a]);
  syncMarks(scope, MARK_ATTR, 'feed.watched', [a]);
  assert.equal(a.getAttribute(MARK_ATTR), 'other feed.watched');
  syncMarks(scope, MARK_ATTR, 'feed.watched', []);
  assert.equal(a.getAttribute(MARK_ATTR), 'other');
});
