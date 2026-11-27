const DIGIT_BLOCKS = [0x660, 0x6f0, 0x966];
const SUFFIXES = {
  k: 1e3, mil: 1e3, 'тыс': 1e3, tsd: 1e3, ألف: 1e3, 千: 1e3,
  m: 1e6, mio: 1e6, mln: 1e6, 'млн': 1e6, millón: 1e6, millones: 1e6, mi: 1e6, million: 1e6,
  b: 1e9, bn: 1e9, mrd: 1e9, 'млрд': 1e9, bi: 1e9,
  万: 1e4, 萬: 1e4, 億: 1e8, 亿: 1e8,
};

export function normalizeDigits(value) {
  return String(value ?? '').normalize('NFKC').replace(/[٠-٩۰-۹०-९]/gu, (digit) => {
    const code = digit.codePointAt(0);
    return String(code - DIGIT_BLOCKS.find((start) => code >= start && code <= start + 9));
  });
}

export function parseCount(value) {
  const match = normalizeDigits(value).trim().toLowerCase()
    .match(/^(\d+(?:[.,٫٬'’\s]\d+)*)\s*([\p{L}]+)?\.?$/u);
  if (!match) return 0;
  const [, number, suffix] = match;
  if (suffix && !Object.hasOwn(SUFFIXES, suffix)) return 0;
  const digits = number.replace(/[\s٬'’]/gu, '');
  if (!suffix && !/^\d+$|^\d{1,3}(?:[.,]\d{3})+$/u.test(digits)) return 0;
  const amount = suffix ? Number(digits.replace(/[,٫]/u, '.')) : Number(digits.replace(/[.,]/gu, ''));
  const count = Math.round(amount * (suffix ? SUFFIXES[suffix] : 1));
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

export function parseReplyCount(label) {
  const match = normalizeDigits(label).toLowerCase().match(/(\d+(?:[.,٫٬'’\s]\d+)*)(?:\s*([千万萬億亿]|\p{L}+))?/u);
  if (!match) return 0;
  const [, number, suffix] = match;
  return parseCount(Object.hasOwn(SUFFIXES, suffix) ? `${number} ${suffix}` : number);
}

export function parseTimestamp(value) {
  const text = normalizeDigits(value).trim();
  if (!/^\d+(?::[0-5]\d){1,2}$/u.test(text)) return null;
  const seconds = text.split(':').reduce((total, part) => total * 60 + Number(part), 0);
  return Number.isSafeInteger(seconds) ? seconds : null;
}

export function timeLabel(seconds) {
  const pad = (part) => String(part).padStart(2, '0');
  const remainder = pad(Math.floor(seconds % 60));
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? `${minutes}:${remainder}` : `${Math.floor(minutes / 60)}:${pad(minutes % 60)}:${remainder}`;
}
