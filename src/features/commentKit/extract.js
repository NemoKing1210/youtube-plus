import { SEL } from '../../core/constants.js';
import { parseCount, parseReplyCount } from './parse.js';

const THREAD = 'ytd-comment-thread-renderer';
const COMMENT = 'ytd-comment-view-model, ytd-comment-renderer';
const AUTHOR = '#author-text, #author-text a, #author-endpoint';
const BODY = '#content-text, #comment-content';
const VOTES = '#vote-count-middle, #vote-count-left';
const PUBLISHED = '#published-time-text';
const REPLIES = '#replies, ytd-comment-replies-renderer';
const REPLY_COUNT = '#more-replies, #less-replies, #replies #button';
const GIF = 'img[src*=".gif"], img[src*="giphy"], img[src*="tenor"], yt-gif-view-model';
const TRANSLATE = '#translate-button';
const ACTION = 'button, [role="button"]';
const CONTINUATION = 'ytd-continuation-item-renderer';

const ORIGIN = 'https://www.youtube.com';

export function youtubeUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  try {
    const url = new URL(raw, ORIGIN);
    return url.protocol === 'https:' && ['www.youtube.com', 'youtube.com', 'm.youtube.com'].includes(url.hostname)
      && !url.username && !url.password && !url.port ? url.href : '';
  } catch {
    return '';
  }
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function textOf(node, selector) {
  return cleanText(node.querySelector(selector)?.textContent);
}

function hrefOf(node) {
  return node?.getAttribute('href') || node?.querySelector('a[href]')?.getAttribute('href') || '';
}

function hash(value) {
  let result = 2166136261;
  for (let i = 0; i < value.length; i++) result = Math.imul(result ^ value.charCodeAt(i), 16777619);
  return (result >>> 0).toString(36);
}

export function normalizeComment(raw) {
  const text = cleanText(raw?.text);
  if (!text) return null;
  const author = cleanText(raw.author);
  const order = Number.isSafeInteger(raw.order) && raw.order >= 0 ? raw.order : 0;
  const permalink = youtubeUrl(raw.permalink);
  const nativeId = permalink && new URL(permalink).searchParams.get('lc');
  return {
    id: nativeId || cleanText(raw.id) || `local-${hash(`${author}\n${text}`)}-${order}`,
    author,
    authorUrl: youtubeUrl(raw.authorUrl),
    text,
    likeCount: parseCount(raw.likeText),
    likeText: cleanText(raw.likeText),
    publishedText: cleanText(raw.publishedText),
    order,
    replyCount: Number.isSafeInteger(raw.replyCount) && raw.replyCount > 0 ? raw.replyCount : 0,
    hasGif: raw.hasGif === true,
    hasLink: raw.hasLink === true,
    permalink,
    isReply: raw.isReply === true,
    parentId: raw.isReply === true ? cleanText(raw.parentId) : '',
  };
}

export function dedupeComments(comments) {
  const ids = new Set();
  return comments.filter((comment) => {
    if (!comment || ids.has(comment.id)) return false;
    ids.add(comment.id);
    return true;
  });
}

export function commentSection(page) {
  return page.querySelector(SEL.comments) || page.querySelector('ytd-comments');
}

export function extractComments(section, videoId, includeReplies = true) {
  const comments = [];
  const nodes = new Map();
  const parents = new Map();
  if (!section) return { comments, nodes };

  for (const node of section.querySelectorAll(COMMENT)) {
    if (node.closest('[hidden]') || node.parentElement?.closest(COMMENT)) continue;
    const isReply = Boolean(node.closest(REPLIES));
    if (isReply && !includeReplies) continue;
    const body = node.querySelector(BODY);
    if (!body) continue;
    const thread = node.closest(THREAD);
    const published = node.querySelector(PUBLISHED);
    const permalink = hrefOf(published);
    const linkedVideo = youtubeUrl(permalink) && new URL(permalink, ORIGIN).searchParams.get('v');
    if (videoId && linkedVideo && linkedVideo !== videoId) continue;
    const replyLabel = !isReply && thread ? textOf(thread, REPLY_COUNT) : '';
    const loadedReplies = !isReply && thread ? thread.querySelectorAll(`#replies :is(${COMMENT})`).length : 0;
    const item = normalizeComment({
      author: textOf(node, AUTHOR),
      authorUrl: hrefOf(node.querySelector(AUTHOR)),
      text: body.textContent,
      likeText: textOf(node, VOTES),
      publishedText: published?.textContent,
      order: comments.length,
      replyCount: Math.max(loadedReplies, parseReplyCount(replyLabel)),
      hasGif: Boolean(node.querySelector(GIF)),
      hasLink: Boolean(body.querySelector('a[href]')),
      permalink,
      isReply,
      parentId: isReply ? parents.get(thread) : '',
    });
    if (!item || nodes.has(item.id)) continue;
    if (!isReply && thread) parents.set(thread, item.id);
    nodes.set(item.id, node);
    comments.push(item);
  }
  return { comments, nodes };
}

export function nativeTranslate(node) {
  const renderer = node?.isConnected ? node.querySelector(TRANSLATE) : null;
  const action = renderer?.querySelector('button') || (renderer?.matches(ACTION) ? renderer : renderer?.querySelector(ACTION));
  return action && !action.closest('[hidden], [aria-disabled="true"]') && !action.disabled ? action : null;
}

export function scrollForComments(section) {
  const continuations = section?.querySelectorAll(CONTINUATION);
  const continuation = Array.from(continuations || []).find((node) => !node.closest(REPLIES));
  (continuation || section?.lastElementChild || section)?.scrollIntoView({ block: 'end' });
}
