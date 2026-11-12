#!/usr/bin/env node
// Provenance CLI.
//   node bin/prov.mjs record <requestId> <relativePath>
//   node bin/prov.mjs report [--files]
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recordArtifact, report } from '../src/provenance/ledger.mjs';

const harness = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webHarnessRoot = resolve(harness, '..');
const paths = {
  journalDir: join(webHarnessRoot, 'runtime', 'journal'),
  ledgerPath: join(webHarnessRoot, 'catalog', 'provenance', 'ledger.jsonl'),
  scopePath: join(webHarnessRoot, 'catalog', 'provenance', 'scope.json'),
  root: webHarnessRoot,
};

async function loadScope() {
  let text;
  try {
    text = await readFile(paths.scopePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const scope = JSON.parse(text);
  if (!Array.isArray(scope) || !scope.every(s => typeof s === 'string')) {
    const err = new Error('scope.json must be a JSON array of relative paths');
    err.code = 'PROVENANCE_BAD_SCOPE';
    throw err;
  }
  return scope;
}

async function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd === 'record') {
    const [requestId, relativePath] = rest;
    if (!requestId || !relativePath || rest.length !== 2) {
      const err = new Error('usage: prov.mjs record <requestId> <relativePath>');
      err.code = 'PROVENANCE_USAGE';
      throw err;
    }
    const rec = await recordArtifact({ ...paths, requestId, filePath: relativePath });
    console.log(JSON.stringify(rec, null, 2));
    return;
  }
  if (cmd === 'report') {
    const withFiles = rest.includes('--files');
    const r = await report({ ledgerPath: paths.ledgerPath, root: paths.root, scope: await loadScope() });
    if (!withFiles) delete r.files;
    console.log(JSON.stringify(r, null, 2));
    return;
  }
  const err = new Error('usage: prov.mjs record <requestId> <relativePath> | report [--files]');
  err.code = 'PROVENANCE_USAGE';
  throw err;
}

try {
  await main(process.argv.slice(2));
} catch (err) {
  process.stderr.write(`${err.code ?? 'PROVENANCE_ERROR'}: ${err.message}\n`);
  process.exitCode = 1;
}
