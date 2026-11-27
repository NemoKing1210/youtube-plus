import { t } from '../../i18n/index.js';
import { debounce, el } from '../../utils/dom.js';
import { highlightText } from './highlight.js';
import { paginate } from './results.js';
import { filterText } from './search.js';
import { toTXT } from './export.js';
import { button, copyText, exportControls, input, pager, seekButton } from './ui.js';

export function createTranscriptView(context, announce) {
  const node = el('div', 'yp-ck-view');
  const search = input('commentKit.search', 'search');
  const actions = el('div', 'yp-ck-controls');
  const open = button('commentKit.openTranscript', () => context.openTranscript());
  const copy = button('commentKit.copyTranscript', () => copyText(toTXT(data.segments, 'transcript')));
  actions.append(open, copy);
  const notice = el('p', 'yp-ck-status');
  notice.setAttribute('role', 'status');
  const list = el('ol', 'yp-ck-list');
  list.setAttribute('aria-label', t('commentKit.transcript'));
  const pagination = pager((page) => { activePage = page; render(); });
  node.append(search.label, actions, exportControls('transcript', context.id, (all) => all ? data.segments : results),
    notice, list, pagination.node);

  let data;
  let results = [];
  let activePage = 0;

  function render() {
    const page = paginate(results, data.settings.pageSize, activePage);
    activePage = page.page;
    const fragment = document.createDocumentFragment();
    for (const segment of page.items) {
      const row = el('li', 'yp-ck-row yp-ck-segment');
      const text = el('p', 'yp-ck-text');
      highlightText(text, segment.text, search.node.value);
      row.append(seekButton(context.page, segment.start), text);
      fragment.append(row);
    }
    list.replaceChildren(fragment);
    pagination.update(page.page, page.pages);
    const key = !data.segments.length ? 'commentKit.noTranscript' : !page.total ? 'commentKit.noResults' : '';
    notice.textContent = key ? t(key) : '';
    open.hidden = data.segments.length > 0 || !data.canOpenTranscript;
    copy.hidden = !data.segments.length;
    announce(page.total);
  }

  function filter() {
    results = filterText(data.segments, { text: search.node.value }).items;
    render();
  }

  const onInput = debounce(() => { activePage = 0; filter(); }, 150);
  search.node.addEventListener('input', onInput);

  return {
    node,
    destroy: onInput.cancel,
    update(next) {
      const previous = data;
      data = next;
      if (previous?.segments !== next.segments || previous?.settings.pageSize !== next.settings.pageSize
          || previous?.canOpenTranscript !== next.canOpenTranscript) filter();
      else announce(results.length);
    },
  };
}
