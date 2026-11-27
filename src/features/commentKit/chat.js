import { SEL } from '../../core/constants.js';
import { normalizeDigits } from './parse.js';
import { filterText, includesText } from './search.js';

const FRAME = 'iframe#chatframe, ytd-live-chat-frame iframe';
const APP = 'yt-live-chat-app';
const LIST = 'yt-live-chat-item-list-renderer #items';
const MESSAGE = 'yt-live-chat-text-message-renderer, yt-live-chat-paid-message-renderer, yt-live-chat-paid-sticker-renderer, yt-live-chat-membership-item-renderer';
const BADGE = 'yt-live-chat-author-badge-renderer';
const ROLES = new Set(['owner', 'moderator', 'member', 'verified']);

function badgeName(value) {
  const key = String(value || '').toLowerCase();
  return ROLES.has(key) ? key : '';
}

function amountNumber(value) {
  const text = normalizeDigits(value).replace(/[^\d.,٫]/gu, '').replace('٫', '.');
  const decimal = text.match(/[.,](\d{1,2})$/u);
  const numeric = decimal ? `${text.slice(0, decimal.index).replace(/[.,]/gu, '')}.${decimal[1]}`
    : text.replace(/[.,]/gu, '');
  const result = Number(numeric);
  return Number.isFinite(result) && result >= 0 ? result : 0;
}

export function normalizeChat(raw) {
  const text = raw.text?.trim() || '';
  const amount = raw.amount?.trim() || '';
  if (raw.deleted || !text && !amount) return null;
  const author = raw.author?.trim() || '';
  const timestamp = raw.timestamp?.trim() || '';
  return {
    id: raw.id || JSON.stringify([timestamp, author, text, amount]),
    author, text, timestamp,
    badges: [...new Set((raw.badges || []).map(badgeName).filter(Boolean))],
    amount,
    amountValue: amountNumber(amount),
  };
}

function messageText(root) {
  if (!root) return '';
  if (root.nodeType === 3) return root.textContent;
  if (root.nodeName === 'IMG') return root.getAttribute('alt') || '';
  return Array.from(root.childNodes, messageText).join('');
}

function capture(node) {
  const author = node.querySelector('#author-name');
  const badgeNodes = [...node.querySelectorAll(BADGE)];
  return normalizeChat({
    id: node.id,
    author: author?.textContent,
    text: messageText(node.querySelector('#message, #header-subtext')) || node.querySelector('#sticker img')?.alt,
    amount: node.querySelector('#purchase-amount, #purchase-amount-chip')?.textContent,
    timestamp: node.querySelector('#timestamp')?.textContent,
    badges: [author?.getAttribute('type'), node.getAttribute('author-type'),
      ...badgeNodes.map((badge) => badge.getAttribute('type') || badge.querySelector('[icon]')?.getAttribute('icon'))],
    deleted: node.hasAttribute('is-deleted') || node.hasAttribute('deleted'),
  });
}

export function createChatBuffer(capacity = 2000) {
  const slots = Array(capacity);
  const ids = new Set();
  let next = 0;
  let size = 0;
  const buffer = {
    add(messages) {
      let added = 0;
      for (const message of messages) {
        if (!message || ids.has(message.id)) continue;
        if (size === capacity) ids.delete(slots[next].id);
        else size++;
        slots[next] = message;
        ids.add(message.id);
        next = (next + 1) % capacity;
        added++;
      }
      return added;
    },
    items() {
      if (size < capacity) return slots.slice(0, size);
      return slots.slice(next).concat(slots.slice(0, next));
    },
    remove(id) {
      if (!ids.has(id)) return false;
      const retained = buffer.items().filter((item) => item.id !== id);
      buffer.clear();
      buffer.add(retained);
      return true;
    },
    clear() { slots.fill(undefined); ids.clear(); next = 0; size = 0; },
  };
  return buffer;
}

export function filterChat(items, query = {}) {
  return filterText(items, query, (item) =>
    includesText(item.author, query.author)
    && (!query.badge || item.badges.includes(query.badge))
    && (!query.minAmount || item.amountValue >= query.minAmount));
}

function iframeDocument(frame, videoId) {
  try {
    const doc = frame?.contentDocument;
    const loadedId = doc?.URL ? new URL(doc.URL).searchParams.get('v') : null;
    return loadedId && loadedId !== videoId ? null : doc;
  } catch {
    return null;
  }
}

export function createChatCapture(page, notify, videoId) {
  const buffer = createChatBuffer();
  const seen = new WeakSet();
  let list;
  let frame;
  let observer;
  let frameObserver;
  let frameRoot;
  let paused = false;
  let pending = [];
  let timer;

  function flush() {
    clearTimeout(timer);
    timer = null;
    const added = buffer.add(pending);
    pending = [];
    if (added) notify(added);
  }

  function queue(message) {
    if (seen.has(message)) return;
    const item = capture(message);
    if (!item) return;
    seen.add(message);
    if (paused) return;
    pending.push(item);
    if (pending.length >= 2000) flush();
    else if (!timer) timer = setTimeout(flush, 100);
  }

  function append(node) {
    if (node.nodeType !== 1) return;
    const parentMessage = node.closest(MESSAGE);
    if (parentMessage) queue(parentMessage);
    else for (const message of node.querySelectorAll(MESSAGE)) queue(message);
  }

  function receive(records) {
    let deleted = false;
    for (const { target, type, addedNodes } of records) {
      if (type === 'attributes') {
        if (!target.id || !(target.hasAttribute('is-deleted') || target.hasAttribute('deleted'))) continue;
        pending = pending.filter(({ id }) => id !== target.id);
        if (buffer.remove(target.id)) deleted = true;
      } else {
        for (const node of addedNodes) append(node);
        const message = target.closest?.(MESSAGE);
        if (message) queue(message);
      }
    }
    if (deleted) notify(0);
  }

  function scan() {
    const nextFrame = page.querySelector(FRAME);
    if (frame !== nextFrame) {
      frame?.removeEventListener('load', scan);
      frame = nextFrame;
      frame?.addEventListener('load', scan);
    }
    const container = page.querySelector(SEL.chat);
    const visible = !container || (container.getClientRects().length > 0
      && getComputedStyle(container).visibility !== 'hidden');
    const frameDocument = visible && iframeDocument(frame, videoId);
    const nextList = visible ? page.querySelector(`${APP} ${LIST}`)
      || frameDocument?.querySelector(`${APP} ${LIST}`) || null : null;
    const nextFrameRoot = frameDocument?.documentElement;
    if (frameRoot !== nextFrameRoot) {
      frameObserver?.disconnect();
      frameRoot = nextFrameRoot;
      if (frameRoot) {
        // The frame can replace the item list without navigating or emitting a
        // parent-page mutation. Avoid re-querying during ordinary arrivals.
        frameObserver ||= new MutationObserver(() => { if (!list?.isConnected) scan(); });
        frameObserver.observe(frameRoot, { childList: true, subtree: true });
      }
    }
    if (list === nextList) return;
    observer?.disconnect();
    list = nextList;
    if (list) {
      append(list);
      // Fast chat messages may leave the list before the shared 350 ms scan.
      observer = new MutationObserver(receive);
      observer.observe(list, { childList: true, subtree: true, attributes: true,
        attributeFilter: ['is-deleted', 'deleted'] });
    }
    notify(0);
  }

  return {
    scan,
    get available() { return Boolean(list); },
    get paused() { return paused; },
    items: buffer.items,
    setPaused(next) {
      paused = next;
      if (paused && pending.length) flush();
    },
    clear() {
      clearTimeout(timer);
      timer = null;
      pending = [];
      buffer.clear();
      notify(0);
    },
    destroy() {
      frame?.removeEventListener('load', scan);
      observer?.disconnect();
      frameObserver?.disconnect();
      clearTimeout(timer);
      pending = [];
      buffer.clear();
    },
  };
}
