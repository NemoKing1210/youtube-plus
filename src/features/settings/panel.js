import { SCRIPT_NAME, SCRIPT_VERSION } from '../../core/constants.js';
import { emit } from '../../core/bus.js';
import { getFeatures } from '../../core/features.js';
import { getDefaults, getSettings, saveSettings } from '../../core/settings.js';
import { t } from '../../i18n/index.js';
import { icon } from '../../ui/icons.js';
import { lockPageScroll, unlockPageScroll } from '../../ui/scroll-lock.js';
import { showToast } from '../../ui/toast.js';
import { el } from '../../utils/dom.js';
import { confirmDialog } from './confirm.js';
import { renderTab } from './renderer.js';
import { buildIndex, highlight, searchIndex, tokenize } from './search.js';

/**
 * Settings dialog shell: header, search, tab strip, lazily rendered panels
 * and a Reset / Cancel / Save footer. Panels edit a *draft* copy of the
 * settings; nothing is persisted (or applied) until Save.
 */

const ROOT_ID = 'yp-settings-root';

const cloneSettings = (settings) => JSON.parse(JSON.stringify(settings));

let state = null;

/** Tabs contributed by every registered feature, in feature order. */
function collectTabs() {
  const tabs = [];
  for (const feature of getFeatures()) {
    for (const tab of feature.tabs || []) tabs.push({ ...tab, featureId: feature.id });
  }
  return tabs;
}

const isSettingsOpen = () => Boolean(state);

function tabButton(tab, active) {
  const button = el('button', `yp-settings__tab${active ? ' is-active' : ''}`);
  button.type = 'button';
  button.id = `yp-tab-${tab.id}`;
  button.dataset.ypTab = tab.id;
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-selected', active ? 'true' : 'false');
  button.setAttribute('aria-controls', `yp-panel-${tab.id}`);
  button.tabIndex = active ? 0 : -1;
  button.append(el('span', 'yp-settings__tab-label', t(tab.titleKey)));
  if (tab.badge) button.append(el('span', 'yp-settings__badge'));
  return button;
}

function updateBadges() {
  if (!state) return;
  for (const tab of state.tabs) {
    if (!tab.badge) continue;
    const node = state.dialog.querySelector(`#yp-tab-${CSS.escape(tab.id)} .yp-settings__badge`);
    if (!node) continue;
    const text = tab.badge(state.draft);
    node.textContent = text || '';
    node.hidden = !text;
  }
}

function ensurePanel(tab) {
  let entry = state.rendered.get(tab.id);
  if (entry) return entry;

  const panel = el('div', 'yp-settings__panel');
  panel.id = `yp-panel-${tab.id}`;
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `yp-tab-${tab.id}`);
  panel.hidden = true;

  const view = renderTab(tab, {
    draft: state.draft,
    featureId: tab.featureId,
    onChange: updateBadges,
    onPreview: (ruleId) => emit('interface:preview', ruleId),
    rerender: rerenderAll,
    reloadDraft,
  });
  panel.append(view.root);
  state.dialog.querySelector('.yp-settings__body').append(panel);

  entry = { panel, view };
  state.rendered.set(tab.id, entry);
  return entry;
}

function activateTab(tabId) {
  const tab = state.tabs.find((candidate) => candidate.id === tabId);
  if (!tab) return;
  state.active = tabId;
  ensurePanel(tab);

  state.dialog.querySelectorAll('[data-yp-tab]').forEach((button) => {
    const on = button.dataset.ypTab === tabId;
    button.classList.toggle('is-active', on);
    button.setAttribute('aria-selected', on ? 'true' : 'false');
    button.tabIndex = on ? 0 : -1;
  });
  for (const [id, entry] of state.rendered) {
    const on = id === tabId;
    entry.panel.classList.toggle('is-active', on);
    entry.panel.hidden = !on;
  }
  state.dialog.querySelector('.yp-settings__body').scrollTop = 0;
}

function rerenderAll() {
  if (!state) return;
  for (const { panel } of state.rendered.values()) panel.remove();
  state.rendered.clear();
  activateTab(state.active);
  updateBadges();
}

/** Replace the draft with the persisted settings (after an import). */
function reloadDraft() {
  if (!state) return;
  state.draft = cloneSettings(getSettings());
  rerenderAll();
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

function setActiveResult(index, scroll = true) {
  const { search } = state;
  const items = [...search.results.querySelectorAll('.yp-hit')];
  search.active = items.length ? Math.max(0, Math.min(items.length - 1, index)) : -1;
  items.forEach((item, i) => {
    const on = i === search.active;
    item.classList.toggle('is-active', on);
    item.setAttribute('aria-selected', on ? 'true' : 'false');
    if (on) {
      search.input.setAttribute('aria-activedescendant', item.id);
      if (scroll) item.scrollIntoView({ block: 'nearest' });
    }
  });
}

function renderResults() {
  if (!state?.search) return;
  const { search } = state;
  const query = search.input.value;
  const tokens = tokenize(query);
  search.clear.hidden = !query;
  state.dialog.classList.toggle('is-searching', tokens.length > 0);
  search.results.replaceChildren();
  search.found = [];
  search.active = -1;
  if (!tokens.length) {
    emit('interface:preview', null);
    return;
  }

  search.index ??= buildIndex(state.tabs);
  search.found = searchIndex(search.index, query);
  if (!search.found.length) {
    search.results.append(el('p', 'yp-hits__empty', t('panel.searchEmpty')));
    return;
  }
  search.found.forEach((entry, i) => {
    const item = el('button', 'yp-hit');
    item.type = 'button';
    item.id = `yp-hit-${i}`;
    item.setAttribute('role', 'option');
    item.tabIndex = -1;
    const crumb = [entry.tabTitle, entry.sectionTitle]
      .filter((part) => part && part !== entry.label)
      .join(' › ');
    const title = el('span', 'yp-hit__title');
    title.append(highlight(entry.label, tokens));
    item.append(title);
    if (crumb) item.append(el('span', 'yp-hit__crumb', crumb));
    if (entry.hint) {
      const hint = el('span', 'yp-hit__hint');
      hint.append(highlight(entry.hint, tokens));
      item.append(hint);
    }
    item.addEventListener('mousemove', () => {
      if (search.active !== i) setActiveResult(i, false);
    });
    item.addEventListener('click', () => jumpTo(entry));
    search.results.append(item);
  });
  setActiveResult(0, false);
}

function clearSearch() {
  if (!state?.search) return;
  state.search.input.value = '';
  renderResults();
  emit('interface:preview', null);
}

/** Open the tab of a result, scroll to the setting and flash it. */
function jumpTo(entry) {
  clearSearch();
  activateTab(entry.tabId);
  if (entry.kind === 'tab') return;
  const panel = state.rendered.get(entry.tabId)?.panel;
  if (!panel) return;
  const pick = (id) => panel.querySelector(`[data-yp-find="${CSS.escape(id)}"]`);
  let node = pick(entry.id);
  if (!node && entry.sectionId) node = pick(entry.sectionId);
  if (!node || node.hidden) return;
  node.scrollIntoView({ block: 'center', behavior: 'smooth' });
  node.classList.remove('is-found');
  void node.offsetWidth;
  node.classList.add('is-found');
  node.addEventListener('animationend', () => node.classList.remove('is-found'), { once: true });
}

function buildSearch() {
  const row = el('div', 'yp-settings__search');
  const box = el('div', 'yp-search');
  const glyph = el('span', 'yp-search__icon');
  glyph.innerHTML = icon('search');
  const input = el('input', 'yp-search__input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = `${t('panel.search')}  ( / )`;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-label', t('panel.search'));
  input.setAttribute('aria-expanded', 'true');
  input.setAttribute('aria-controls', 'yp-settings-results');
  const clear = el('button', 'yp-search__clear');
  clear.type = 'button';
  clear.hidden = true;
  clear.innerHTML = icon('close');
  clear.setAttribute('aria-label', t('panel.searchClear'));
  clear.title = t('panel.searchClear');
  box.append(glyph, input, clear);
  row.append(box);

  const results = el('div', 'yp-hits');
  results.id = 'yp-settings-results';
  results.setAttribute('role', 'listbox');
  results.setAttribute('aria-label', t('panel.search'));

  input.addEventListener('input', renderResults);
  clear.addEventListener('click', () => {
    clearSearch();
    input.focus();
  });
  input.addEventListener('keydown', (event) => {
    if (!state?.search) return;
    if (event.key === 'ArrowDown') setActiveResult(state.search.active + 1);
    else if (event.key === 'ArrowUp') setActiveResult(state.search.active - 1);
    else if (event.key === 'Enter' && state.search.found[state.search.active]) {
      jumpTo(state.search.found[state.search.active]);
    } else return;
    event.preventDefault();
  });

  return {
    row,
    results,
    search: { input, clear, results, index: null, found: [], active: -1 },
  };
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export function closeSettings() {
  if (!state) return;
  document.removeEventListener('keydown', onKeyDown, true);
  emit('interface:preview', null);
  state.root.remove();
  state = null;
  unlockPageScroll();
}

function focusables() {
  if (!state) return [];
  return [
    ...state.dialog.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((node) => !node.hidden && node.offsetParent !== null);
}

function onKeyDown(event) {
  if (!state) return;
  if (document.querySelector('.yp-confirm-overlay')) return;

  const typing =
    event.target instanceof Element &&
    event.target.closest('input, textarea, select, [contenteditable="true"]');
  const shortcut =
    (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) ||
    ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k');
  if (shortcut && state.search) {
    event.preventDefault();
    event.stopPropagation();
    state.search.input.focus();
    state.search.input.select();
    return;
  }

  if (event.key === 'Escape') {
    event.stopPropagation();
    if (state.search?.input.value) {
      clearSearch();
      return;
    }
    closeSettings();
    return;
  }
  if (event.key !== 'Tab') return;

  const nodes = focusables();
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function save() {
  if (!state) return;
  saveSettings(state.draft);
  showToast(t('panel.saved'), { type: 'success' });
  closeSettings();
}

async function reset() {
  if (!state) return;
  const confirmed = await confirmDialog({
    title: t('panel.resetTitle'),
    message: t('panel.resetText'),
    confirmLabel: t('common.reset'),
    danger: true,
  });
  if (!confirmed || !state) return;
  state.draft = getDefaults();
  rerenderAll();
}

function buildDialog(tabs, active) {
  const root = el('div', 'yp-settings-backdrop');
  root.id = ROOT_ID;

  const dialog = el('div', 'yp-settings');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'yp-settings-title');

  const header = el('header', 'yp-settings__header');
  const close = el('button', 'yp-settings__x');
  close.type = 'button';
  close.dataset.ypClose = '';
  close.setAttribute('aria-label', t('common.close'));
  close.title = t('common.close');
  close.innerHTML = icon('close');
  const heading = el('div', 'yp-settings__heading');
  const title = el('h2', 'yp-settings__title', SCRIPT_NAME);
  title.id = 'yp-settings-title';
  heading.append(title, el('p', 'yp-settings__ver', `v${SCRIPT_VERSION}`));
  header.append(close, heading);

  const searchUi = buildSearch();

  const strip = el('div', 'yp-settings__tabs');
  strip.setAttribute('role', 'tablist');
  strip.setAttribute('aria-label', SCRIPT_NAME);
  for (const tab of tabs) strip.append(tabButton(tab, tab.id === active));

  const body = el('div', 'yp-settings__body');
  body.append(searchUi.results);

  const actions = el('div', 'yp-settings__actions');
  const resetButton = el('button', 'yp-btn-ui yp-btn-ui--ghost yp-btn-ui--danger', t('common.reset'));
  const spacer = el('span', 'yp-settings__spacer');
  const cancelButton = el('button', 'yp-btn-ui yp-btn-ui--ghost', t('common.cancel'));
  const saveButton = el('button', 'yp-btn-ui yp-btn-ui--primary', t('common.save'));
  for (const button of [resetButton, cancelButton, saveButton]) button.type = 'button';
  resetButton.addEventListener('click', reset);
  cancelButton.addEventListener('click', closeSettings);
  saveButton.addEventListener('click', save);
  actions.append(resetButton, spacer, cancelButton, saveButton);

  dialog.append(header, searchUi.row, strip, body, actions);
  root.append(dialog);

  root.addEventListener('click', (event) => {
    if (event.target === root || event.target.closest?.('[data-yp-close]')) closeSettings();
  });

  strip.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-yp-tab]');
    if (button) activateTab(button.dataset.ypTab);
  });
  strip.addEventListener('keydown', (event) => {
    const buttons = [...strip.querySelectorAll('[data-yp-tab]')];
    const current = event.target.closest?.('[data-yp-tab]');
    if (!current) return;
    const index = buttons.indexOf(current);
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (index - 1 + buttons.length) % buttons.length;
    } else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    activateTab(buttons[next].dataset.ypTab);
    buttons[next].focus();
  });

  return { root, dialog, search: searchUi.search };
}

/** Open the settings dialog (optionally on a given tab id). */
export function openSettings(tabId) {
  closeSettings();
  const tabs = collectTabs();
  if (!tabs.length) return;
  const active = tabs.some((tab) => tab.id === tabId) ? tabId : tabs[0].id;

  const { root, dialog, search } = buildDialog(tabs, active);
  state = {
    root,
    dialog,
    draft: cloneSettings(getSettings()),
    tabs,
    active,
    rendered: new Map(),
    search,
  };

  document.addEventListener('keydown', onKeyDown, true);
  (document.body || document.documentElement).append(root);
  lockPageScroll();
  activateTab(active);
  requestAnimationFrame(updateBadges);
}

export { isSettingsOpen };
