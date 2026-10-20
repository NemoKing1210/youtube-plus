/**
 * i18n consistency check.
 *
 *  - every key used in src/ must exist in EVERY locale → errors, non-zero exit
 *    (English is the source of truth and the runtime fallback);
 *  - keys defined but never used are listed as warnings.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');

const NAMESPACES = [
  'panel',
  'toast',
  'general',
  'about',
  'backup',
  'nav',
  'menu',
  'common',
  'interface',
  'player',
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === 'locales') continue;
      yield* walk(path);
    } else if (name.endsWith('.js')) {
      yield path;
    }
  }
}

async function loadLocales() {
  const dir = join(src, 'i18n', 'locales');
  if (!existsSync(dir)) return {};
  const out = {};
  for (const name of readdirSync(dir)) {
    if (name === 'index.js' || !name.endsWith('.js')) continue;
    const mod = await import(pathToFileURL(join(dir, name)).href);
    out[name.replace(/\.js$/, '')] = mod.default;
  }
  return out;
}

function usedKeys(en) {
  const keys = new Set();
  const full = new RegExp(
    `['"\`]((?:${NAMESPACES.join('|')})(?:\\.[A-Za-z0-9-]+)+)['"\`]`,
    'g',
  );
  for (const file of walk(src)) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(full)) keys.add(match[1]);
  }
  for (const key of [...keys]) if (key.endsWith('.')) keys.delete(key);
  return keys;
}

/** Keys built from data at runtime (see the generators in the feature files). */
async function dynamicKeys() {
  const keys = new Set();
  for (const position of ['top-right', 'top-left', 'bottom-right', 'bottom-left']) {
    keys.add(`general.toastPosition.${position}`);
  }
  for (const level of ['success', 'info', 'warning', 'error']) keys.add(`toast.title.${level}`);

  const rulesPath = join(src, 'features', 'interface', 'rules.js');
  if (existsSync(rulesPath)) {
    const rules = await import(pathToFileURL(rulesPath).href);
    for (const rule of rules.RULES) {
      const key = rules.ruleLabelKey(rule);
      keys.add(key);
      if (rule.hint) keys.add(`${key}Hint`);
    }
  }
  return keys;
}

const locales = await loadLocales();
const english = locales.en || {};
const used = new Set([...usedKeys(english), ...(await dynamicKeys())]);
let errors = 0;

for (const locale of Object.keys(locales)) {
  const missing = [...used].filter((key) => !(key in locales[locale])).sort();
  if (missing.length) {
    errors += missing.length;
    console.error(`\n✖ "${locale}" is missing ${missing.length} used key(s):`);
    for (const key of missing) console.error(`    ${key}`);
  }
}

const unused = Object.keys(english).filter((key) => !used.has(key)).sort();
if (unused.length) {
  console.warn(`\n! ${unused.length} English key(s) not referenced from code:`);
  for (const key of unused) console.warn(`    ${key}`);
}

console.log('\nLocale coverage (vs English):');
const total = Object.keys(english).length;
for (const [locale, map] of Object.entries(locales)) {
  const have = Object.keys(english).filter((key) => key in map).length;
  console.log(
    `  ${locale.padEnd(3)} ${String(have).padStart(4)} / ${total}  (${Math.round((have / total) * 100)}%)`,
  );
}

if (errors) {
  console.error(`\ni18n check failed: ${errors} missing key(s).`);
  process.exit(1);
}
console.log('\ni18n check passed.');
