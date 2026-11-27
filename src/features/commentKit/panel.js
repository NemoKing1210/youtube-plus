import { THEME_ATTR } from '../../core/constants.js';
import { t } from '../../i18n/index.js';
import { el } from '../../utils/dom.js';
import { button } from './ui.js';

const SOURCES = [
  { id: 'comments', key: 'commentKit.comments' },
  { id: 'transcript', key: 'commentKit.transcript' },
  { id: 'chat', key: 'commentKit.chat' },
];
const PANEL_ID = 'yp-comment-kit';

export function createToggle(onToggle) {
  const node = button('commentKit.title', onToggle, 'yp-ck-toggle');
  node.setAttribute('aria-controls', PANEL_ID);
  return node;
}

export function createPanel({ close, makeView }) {
  const node = el('section', 'yp-comment-kit');
  node.id = PANEL_ID;
  node.setAttribute('aria-labelledby', 'yp-ck-title');
  const header = el('header', 'yp-ck-header');
  const title = el('h2', '', t('commentKit.title'));
  title.id = 'yp-ck-title';
  const closeButton = button('commentKit.close', close);
  header.append(title, closeButton);
  const tabs = el('div', 'yp-ck-tabs');
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', t('commentKit.sources'));
  const content = el('div', 'yp-ck-content');
  const count = el('footer', 'yp-ck-count');
  count.setAttribute('aria-live', 'polite');
  count.setAttribute('aria-atomic', 'true');
  node.append(header, tabs, content, count);

  const tabButtons = new Map();
  const views = new Map();
  let source = 'comments';
  let options = [];
  let data;

  function announce(total) {
    const text = total === null ? '' : t('commentKit.count', { count: total });
    if (count.textContent !== text) count.textContent = text;
  }

  function select(id, focus = false) {
    source = id;
    for (const [key, tab] of tabButtons) {
      tab.setAttribute('aria-selected', String(key === source));
      tab.tabIndex = key === source ? 0 : -1;
    }
    if (!views.has(source)) {
      const view = makeView(source, (total) => { if (source === id) announce(total); });
      view.node.id = `yp-ck-view-${source}`;
      view.node.setAttribute('role', 'tabpanel');
      view.node.setAttribute('aria-labelledby', `yp-ck-tab-${source}`);
      content.append(view.node);
      views.set(source, view);
    }
    for (const [key, view] of views) view.node.hidden = key !== source;
    announce(null);
    views.get(source).update(data);
    if (focus) tabButtons.get(id)?.focus();
  }

  for (const { id, key } of SOURCES) {
    const tab = button(key, () => select(id));
    tab.id = `yp-ck-tab-${id}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `yp-ck-view-${id}`);
    tabButtons.set(id, tab);
    tabs.append(tab);
  }

  tabs.addEventListener('keydown', (event) => {
    const current = options.indexOf(source);
    const positions = {
      ArrowLeft: (current + options.length - 1) % options.length,
      ArrowRight: (current + 1) % options.length,
      Home: 0,
      End: options.length - 1,
    };
    if (!Object.hasOwn(positions, event.key)) return;
    event.preventDefault();
    select(options[positions[event.key]], true);
  });

  return {
    node,
    focus() { closeButton.focus(); },
    update(next) {
      data = next;
      if (next.settings.theme === 'auto') node.removeAttribute(THEME_ATTR);
      else if (node.getAttribute(THEME_ATTR) !== next.settings.theme) node.setAttribute(THEME_ATTR, next.settings.theme);
      options = SOURCES.filter(({ id }) => id === 'comments'
        || next.watch && (id === 'transcript' ? next.settings.transcripts : next.settings.liveChat))
        .map(({ id }) => id);
      for (const [id, tab] of tabButtons) tab.hidden = !options.includes(id);
      if (!options.includes(source) || !views.has(source)) select('comments');
      else views.get(source).update(data);
    },
    destroy() {
      for (const view of views.values()) view.destroy?.();
      node.remove();
    },
  };
}
