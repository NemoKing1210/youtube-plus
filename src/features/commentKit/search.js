const MAX_PATTERN_LENGTH = 200;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

/** Keep user patterns responsive while matching on the page's main thread. */
function expensivePattern(pattern) {
  const tokens = pattern.match(/\\.|\[(?:\\.|[^\]\\])*\]|\(\?:|\(\?<[\p{L}\p{N}_]+>|\{\d+(?:,\d*)?\}|./gu) || [];
  let repeats = 0;
  let optional = 0;
  for (const [index, token] of tokens.entries()) {
    if (/^\\[1-9k]$/u.test(token) || token === '?' && tokens[index - 1] === '(') return true;
    if (!/^[*+?{]/u.test(token) || (token === '?' && /^[*+?{]/u.test(tokens[index - 1]))) continue;
    if (tokens[index - 1] === ')' || /^\{\d{4,}|,\d{4,}\}/u.test(token)) return true;
    if (token === '?') optional++;
    else if (/[,*+]/u.test(token)) repeats++;
  }
  return repeats > 1 || optional > 8;
}

export function makeMatcher(value, regex = false, flags = 'iu') {
  const text = String(value ?? '').trim();
  if (!text) return { pattern: null, error: false };
  if (regex) {
    try {
      if (text.length <= MAX_PATTERN_LENGTH && !expensivePattern(text)) {
        return { pattern: new RegExp(text, flags), error: false };
      }
    } catch {
      // Invalid input remains usable as a literal.
    }
  }
  return { pattern: new RegExp(escapeRegex(text), flags), error: regex };
}

export function filterText(items, query = {}, accept = () => true) {
  const { pattern, error } = makeMatcher(query.text, query.regex);
  return { items: items.filter((item) => accept(item) && (!pattern || pattern.test(item.text))), error };
}

export function includesText(value, search) {
  return !search || String(value || '').toLowerCase().includes(search.trim().toLowerCase());
}

export function filterComments(comments, query = {}) {
  return filterText(comments, query, (item) =>
    (query.includeReplies !== false || !item.isReply)
    && includesText(item.author, query.author)
    && (!query.minLikes || item.likeCount >= query.minLikes)
    && (!query.hasGif || item.hasGif)
    && (!query.hasLink || item.hasLink)
    && (!query.hasReply || item.replyCount > 0));
}

export function sortComments(comments, sort = 'newest') {
  const byOrder = (a, b) => a.order - b.order;
  const compare = {
    newest: byOrder,
    oldest: (a, b) => byOrder(b, a),
    likes: (a, b) => b.likeCount - a.likeCount || byOrder(a, b),
    replies: (a, b) => b.replyCount - a.replyCount || byOrder(a, b),
    author: (a, b) => a.author.localeCompare(b.author) || byOrder(a, b),
  };
  return [...comments].sort(Object.hasOwn(compare, sort) ? compare[sort] : byOrder);
}

export function randomComment(items, random = Math.random) {
  return items[Math.floor(random() * items.length)] || null;
}

export function tallyOptions(items, labels) {
  const counts = new Map();
  for (const name of labels) {
    const label = name.trim();
    const key = label.toLowerCase();
    if (label && !counts.has(key)) counts.set(key, { label, count: 0 });
  }
  for (const item of items) {
    const vote = counts.get(item.text.trim().toLowerCase());
    if (vote) vote.count++;
  }
  return [...counts.values()];
}
