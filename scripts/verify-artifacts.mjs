import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTIFACT_FILES } from './lib/artifacts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

function hash(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

for (const name of ARTIFACT_FILES) {
  const built = join(dist, name);
  const install = join(root, name);
  if (!existsSync(built) || !existsSync(install)) {
    console.error(`verify-artifacts: missing ${name}; run npm run build`);
    process.exit(1);
  }
  if (hash(built) !== hash(install)) {
    console.error(`verify-artifacts: ${name} differs from dist/${name}`);
    process.exit(1);
  }
  console.log(`ok  dist ↔ root  ${name}`);
}

const EXPECTED_GRANTS = ['GM_getValue', 'GM_registerMenuCommand', 'GM_setValue', 'GM_xmlhttpRequest'];
const EXPECTED_CONNECT = ['returnyoutubedislikeapi.com'];
const meta = readFileSync(join(root, 'youtube-plus.meta.js'), 'utf8');

for (const [key, expected] of [['grant', EXPECTED_GRANTS], ['connect', EXPECTED_CONNECT]]) {
  const values = [...meta.matchAll(new RegExp(`^// @${key}\\s+(\\S+)`, 'gm'))]
    .map((match) => match[1]).sort();
  if (JSON.stringify(values) !== JSON.stringify(expected)) {
    console.error(`verify-artifacts: unexpected @${key}: ${values.join(', ') || 'none'}`);
    process.exit(1);
  }
  console.log(`ok  ${key.padEnd(12)} ${values.length}/${expected.length} expected`);
}
