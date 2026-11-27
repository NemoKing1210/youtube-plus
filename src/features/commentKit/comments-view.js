import { t } from '../../i18n/index.js';
import { showToast } from '../../ui/toast.js';
import { debounce, el } from '../../utils/dom.js';
import { nativeTranslate } from './extract.js';
import { highlightText } from './highlight.js';
import { actionsFor, paginate } from './results.js';
import { filterComments, randomComment, sortComments, tallyOptions } from './search.js';
import { parseTimestamps } from './timestamps.js';
import { button, copyText, exportControls, input, pager, seekButton, select } from './ui.js';

export function createCommentsView(context, announce) {
  const node = el('div', 'yp-ck-view');
  const search = input('commentKit.search', 'search');
  const regex = input('commentKit.regex', 'checkbox');
  const author = input('commentKit.author', 'search');
  const likes = input('commentKit.minLikes', 'number', { min: 0 });
  const gif = input('commentKit.hasGif', 'checkbox');
  const link = input('commentKit.hasLink', 'checkbox');
  const reply = input('commentKit.hasReply', 'checkbox');
  const include = input('commentKit.includeReplies', 'checkbox');
  const sort = select('commentKit.sort', [
    ['newest', 'commentKit.newest'], ['oldest', 'commentKit.oldest'], ['likes', 'commentKit.likes'],
    ['replies', 'commentKit.replies'], ['author', 'commentKit.author'],
  ]);
  const criteria = el('div', 'yp-ck-controls');
  criteria.append(author.label, likes.label, regex.label, gif.label, link.label, reply.label, include.label, sort.label);
  const filters = el('details');
  filters.append(el('summary', '', t('commentKit.filters')), criteria);
  const actions = el('div', 'yp-ck-controls');
  const refresh = button('commentKit.refresh', context.refreshComments);
  const load = button('commentKit.loadMore', context.loadComments);
  const random = button('commentKit.random', pick);
  actions.append(refresh, load, random);
  const poll = el('details');
  const pollOptions = input('commentKit.pollOptions', 'text', { maxLength: 500 });
  const table = el('table', 'yp-ck-poll');
  table.hidden = true;
  poll.append(el('summary', '', t('commentKit.poll')), pollOptions.label, button('commentKit.tally', renderPoll), table);
  const notice = el('p', 'yp-ck-status');
  notice.setAttribute('role', 'status');
  const list = el('ol', 'yp-ck-list');
  list.setAttribute('aria-label', t('commentKit.comments'));
  const pagination = pager((page) => { activePage = page; render(); });
  node.append(search.label, filters, actions, poll,
    exportControls('comments', context.id, (all) => all ? allComments() : results),
    notice, list, pagination.node);

  let data;
  let activePage = 0;
  let results = [];
  let query;
  let rows = new Map();

  function allComments() {
    return data.comments.filter((item) => data.settings.includeReplies || !item.isReply);
  }

  function options() {
    return {
      text: search.node.value,
      regex: regex.node.checked,
      author: author.node.value,
      minLikes: likes.node.valueAsNumber,
      hasGif: gif.node.checked,
      hasLink: link.node.checked,
      hasReply: reply.node.checked,
      includeReplies: data.settings.includeReplies && include.node.checked,
    };
  }

  function linkTo(key, url) {
    const anchor = el('a', 'yp-ck-action', t(key));
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    return anchor;
  }

  function commentRow(item) {
    const row = el('li', 'yp-ck-row');
    row.tabIndex = -1;
    if (item.isReply) row.classList.add('yp-ck-reply');
    const meta = el('div', 'yp-ck-meta');
    meta.append(el('strong', '', item.author), el('span', '', item.publishedText));
    if (item.likeText) meta.append(el('span', '', t('commentKit.likeCount', { count: item.likeText })));
    if (item.replyCount) meta.append(el('span', '', t('commentKit.replyCount', { count: item.replyCount })));
    const text = el('p', 'yp-ck-text');
    highlightText(text, item.text, query.text, query.regex);
    row.append(meta, text);
    const toolbar = el('div', 'yp-ck-controls yp-ck-row-actions');
    const translate = nativeTranslate(data.commentNodes.get(item.id));
    const available = actionsFor(item, translate);
    if (available.copy) toolbar.append(button('commentKit.copyText', () => copyText(item.text)));
    if (available.permalink) toolbar.append(button('commentKit.copyLink', () => copyText(item.permalink)));
    if (available.author) toolbar.append(linkTo('commentKit.openAuthor', item.authorUrl));
    if (available.translate) toolbar.append(button('commentKit.translate', () => {
      const control = nativeTranslate(data.commentNodes.get(item.id));
      if (control) control.click();
      else showToast(t('commentKit.unavailable'), { type: 'info' });
    }));
    if (data.watch) {
      for (const { raw, seconds } of parseTimestamps(item.text, data.duration)) {
        toolbar.append(seekButton(context.page, seconds, raw));
      }
    }
    row.append(toolbar);
    return row;
  }

  function renderPoll() {
    const counts = tallyOptions(results, pollOptions.node.value.split(','));
    table.hidden = !counts.length;
    const body = el('tbody');
    for (const { label, count } of counts) {
      const row = el('tr');
      const heading = el('th', '', label);
      heading.scope = 'row';
      row.append(heading, el('td', '', String(count)));
      body.append(row);
    }
    table.replaceChildren(body);
  }

  function render(refilter = false) {
    if (refilter || !query) {
      query = options();
      const filtered = filterComments(data.comments, query);
      query.error = filtered.error;
      results = sortComments(filtered.items, sort.node.value);
    }
    const page = paginate(results, data.settings.pageSize, activePage);
    activePage = page.page;
    const fragment = document.createDocumentFragment();
    rows = new Map();
    for (const item of page.items) {
      const row = commentRow(item);
      rows.set(item.id, row);
      fragment.append(row);
    }
    list.replaceChildren(fragment);
    pagination.update(page.page, page.pages);
    random.disabled = !page.total;
    if (!table.hidden) renderPoll();
    renderStatus();
  }

  function renderStatus() {
    const key = data.commentError ? 'commentKit.loadFailed'
      : query.error ? 'commentKit.regexError'
        : data.loading ? 'commentKit.loading'
          : !results.length ? data.comments.length ? 'commentKit.noResults' : 'commentKit.noComments' : '';
    const text = key ? t(key) : '';
    if (notice.textContent !== text) notice.textContent = text;
    load.disabled = data.loading || !data.canLoadComments;
    announce(results.length);
  }

  function pick() {
    const match = randomComment(results);
    if (!match) return;
    const page = Math.floor(results.indexOf(match) / data.settings.pageSize);
    if (page !== activePage) {
      activePage = page;
      render();
    }
    const row = rows.get(match.id);
    if (!row) return;
    row.classList.remove('yp-ck-flash');
    row.scrollIntoView({ block: 'nearest' });
    row.focus({ preventScroll: true });
    requestAnimationFrame(() => row.classList.add('yp-ck-flash'));
  }

  const filter = () => { activePage = 0; render(true); };
  const onInput = debounce(filter, 150);
  for (const field of [search, author, likes]) field.node.addEventListener('input', onInput);
  for (const field of [regex, gif, link, reply, include, sort]) field.node.addEventListener('change', filter);

  return {
    node,
    destroy: onInput.cancel,
    update(next) {
      const previous = data;
      data = next;
      if (previous?.settings.includeReplies !== next.settings.includeReplies) {
        include.node.disabled = !next.settings.includeReplies;
        include.node.checked = next.settings.includeReplies;
      }
      if (previous?.comments !== next.comments || previous?.commentNodes !== next.commentNodes
          || previous?.duration !== next.duration || previous?.settings.pageSize !== next.settings.pageSize
          || previous?.settings.includeReplies !== next.settings.includeReplies) render(true);
      else renderStatus();
    },
  };
}
