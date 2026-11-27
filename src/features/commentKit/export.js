import { t } from '../../i18n/index.js';
import { downloadText } from '../../utils/download.js';
import { timeLabel } from './parse.js';

const FIELDS = {
  comments: ['author', 'text', 'likeCount', 'publishedText', 'permalink', 'replyCount'],
  transcript: ['start', 'text'],
  chat: ['author', 'text', 'timestamp', 'badges', 'amount'],
};
const FORMATS = new Set(['csv', 'json', 'txt']);

function csvCell(value) {
  if (Array.isArray(value)) value = value.join(', ');
  let cell = String(value ?? '');
  if (typeof value === 'string' && /^[\t\r\n]|^\s*[=+\-@]/u.test(cell)) cell = `'${cell}`;
  return /[",\r\n]/u.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell;
}

export function toCSV(items, source) {
  if (!items.length) return '';
  const fields = FIELDS[source];
  const rows = items.map((item) => fields.map((key) => csvCell(item[key])).join(','));
  return `\ufeff${fields.join(',')}\r\n${rows.join('\r\n')}\r\n`;
}

export function toJSON(items, source) {
  return JSON.stringify(items.map((item) =>
    Object.fromEntries(FIELDS[source].map((key) => [key, item[key] ?? null]))), null, 2);
}

export function toTXT(items, source) {
  if (source === 'transcript') return items.map(({ start, text }) => `${timeLabel(start)} ${text}`).join('\n');
  return items.map((item) => {
    const details = [item.author, item.publishedText || item.timestamp, item.amount, item.badges?.join(', ')].filter(Boolean);
    if (source === 'comments') {
      details.push(t('commentKit.likeCount', { count: item.likeCount }), t('commentKit.replyCount', { count: item.replyCount }));
    }
    return [details.join(' · '), item.text, item.permalink].filter(Boolean).join('\n');
  }).join('\n\n');
}

export function exportFilename(source, id, format, date = new Date()) {
  const safe = String(id || '').replace(/[^A-Za-z0-9_-]+/gu, '-').replace(/^-+|-+$/gu, '').slice(0, 80);
  const stamp = date.toISOString().replace(/[T:.]/gu, '-').replace(/Z$/u, '');
  return `youtube-plus-${Object.hasOwn(FIELDS, source) ? source : 'export'}-${safe || 'page'}-${stamp}.${FORMATS.has(format) ? format : 'txt'}`;
}

export function downloadExport(anchor, items, source, id, format) {
  const writers = { csv: [toCSV, 'text/csv'], json: [toJSON, 'application/json'], txt: [toTXT, 'text/plain'] };
  const [write, type] = writers[format];
  downloadText(anchor, exportFilename(source, id, format), write(items, source), type);
}
