import { t } from '../../i18n/index.js';
import { debounce, el } from '../../utils/dom.js';
import { filterChat } from './chat.js';
import { highlightText } from './highlight.js';
import { paginate } from './results.js';
import { button, exportControls, input, pager, select } from './ui.js';

const BADGES = [
  ['owner', 'commentKit.owner'], ['moderator', 'commentKit.moderator'],
  ['member', 'commentKit.member'], ['verified', 'commentKit.verified'],
];
const BADGE_LABELS = Object.fromEntries(BADGES);

export function createChatView(context, announce) {
  const node = el('div', 'yp-ck-view');
  const search = input('commentKit.search', 'search');
  const author = input('commentKit.author', 'search');
  const badge = select('commentKit.badge', [['', 'commentKit.anyBadge'], ...BADGES]);
  const amount = input('commentKit.minAmount', 'number', { min: 0, step: 'any' });
  const criteria = el('div', 'yp-ck-controls');
  criteria.append(author.label, badge.label, amount.label);
  const filters = el('details');
  filters.append(el('summary', '', t('commentKit.filters')), criteria);
  const actions = el('div', 'yp-ck-controls');
  const pause = button('commentKit.pauseChat', () => context.setChatPaused(!data.chatPaused));
  const clear = button('commentKit.clearChat', () => {
    follow = true;
    unread = 0;
    context.clearChat();
  });
  const latest = button('commentKit.latest', () => {
    follow = true;
    unread = 0;
    render();
  });
  actions.append(pause, clear, latest);
  const unreadLabel = el('span');
  unreadLabel.setAttribute('role', 'status');
  const notice = el('p', 'yp-ck-status');
  notice.setAttribute('role', 'status');
  const list = el('ol', 'yp-ck-list yp-ck-chat-list');
  list.tabIndex = 0;
  list.setAttribute('aria-label', t('commentKit.chat'));
  const pagination = pager((page) => {
    follow = false;
    activePage = page;
    render();
  });
  node.append(search.label, filters, actions, unreadLabel,
    exportControls('chat', context.id, (all) => all ? data.messages : results),
    notice, list, pagination.node);

  let data;
  let results = [];
  let activePage = 0;
  let follow = true;
  let unread = 0;

  function render() {
    if (follow) activePage = Math.max(0, Math.ceil(results.length / data.settings.pageSize) - 1);
    const page = paginate(results, data.settings.pageSize, activePage);
    activePage = page.page;
    const scrollTop = list.scrollTop;
    const fragment = document.createDocumentFragment();
    for (const item of page.items) {
      const row = el('li', 'yp-ck-row');
      const meta = el('div', 'yp-ck-meta');
      meta.append(el('strong', '', item.author), el('span', '', item.timestamp));
      for (const role of item.badges) meta.append(el('span', 'yp-ck-badge', t(BADGE_LABELS[role])));
      if (item.amount) meta.append(el('strong', 'yp-ck-badge', item.amount));
      const text = el('p', 'yp-ck-text');
      highlightText(text, item.text, search.node.value);
      row.append(meta, text);
      fragment.append(row);
    }
    list.replaceChildren(fragment);
    list.scrollTop = follow ? list.scrollHeight : scrollTop;
    pagination.update(page.page, page.pages);
    updateStatus();
  }

  function updateStatus() {
    const key = !data.chatAvailable ? 'commentKit.noChat'
      : data.chatPaused ? 'commentKit.chatPaused' : !results.length ? 'commentKit.noResults' : '';
    const status = key ? t(key) : '';
    if (notice.textContent !== status) notice.textContent = status;
    const pauseText = t(data.chatPaused ? 'commentKit.resumeChat' : 'commentKit.pauseChat');
    if (pause.textContent !== pauseText) pause.textContent = pauseText;
    pause.disabled = !data.chatAvailable;
    clear.disabled = !data.messages.length;
    latest.disabled = follow;
    const unseen = unread ? t('commentKit.unread', { count: unread }) : '';
    if (unreadLabel.textContent !== unseen) unreadLabel.textContent = unseen;
    announce(results.length);
  }

  function filter() {
    results = filterChat(data.messages, {
      text: search.node.value, author: author.node.value, badge: badge.node.value, minAmount: amount.node.valueAsNumber,
    }).items;
    render();
  }

  list.addEventListener('scroll', () => {
    if (follow && list.scrollHeight - list.scrollTop - list.clientHeight > 5) {
      follow = false;
      updateStatus();
    }
  }, { passive: true });
  const onInput = debounce(() => { activePage = 0; filter(); }, 150);
  for (const field of [search, author, amount]) field.node.addEventListener('input', onInput);
  badge.node.addEventListener('change', onInput);

  return {
    node,
    destroy: onInput.cancel,
    update(next) {
      const previous = data;
      data = next;
      if (!follow && previous && data.chatSequence !== previous.chatSequence) {
        unread += Math.max(0, data.chatSequence - previous.chatSequence);
      }
      if (previous?.messages !== next.messages || previous?.settings.pageSize !== next.settings.pageSize) filter();
      else updateStatus();
    },
  };
}
