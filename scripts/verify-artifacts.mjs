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

const EXPECTED_GRANTS = ['GM_getValue', 'GM_registerMenuCommand', 'GM_setValue'];
const meta = readFileSync(join(root, 'youtube-plus.meta.js'), 'utf8');
const grants = [...meta.matchAll(/^\/\/ @grant\s+(\S+)/gm)].map((match) => match[1]).sort();
if (JSON.stringify(grants) !== JSON.stringify(EXPECTED_GRANTS)) {
  console.error(`verify-artifacts: unexpected grants: ${grants.join(', ') || 'none'}`);
  process.exit(1);
}
console.log('ok  grants      3/3 expected');
