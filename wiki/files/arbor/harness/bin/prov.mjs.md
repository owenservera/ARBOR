# File: harness/bin/prov.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | harness/bin/prov.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2299 B |
| Lines | 66 |
| Hash | 3d2928c5b87c |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| harness | const | 10 | no | const harness = resolve(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;); |
| webHarnessRoot | const | 11 | no | const webHarnessRoot = resolve(harness, &#39;..&#39;); |
| paths | const | 12 | no | const paths = { |
| loadScope | function | 19 | no | async function loadScope() { |
| text | variable | 20 | no | let text; |
| scope | const | 27 | no | const scope = JSON.parse(text); |
| err | const | 29 | no | const err = new Error(&#39;scope.json must be a JSON array of relative paths&#39;); |
| main | function | 36 | no | async function main(argv) { |
| err | const | 41 | no | const err = new Error(&#39;usage: prov.mjs record &lt;requestId&gt; &lt;relativePath&gt;&#39;); |
| rec | const | 45 | no | const rec = await recordArtifact({ ...paths, requestId, filePath: relativePath }); |
| withFiles | const | 50 | no | const withFiles = rest.includes(&#39;--files&#39;); |
| r | const | 51 | no | const r = await report({ ledgerPath: paths.ledgerPath, root: paths.root, scope: await loadScope() }); |
| err | const | 56 | no | const err = new Error(&#39;usage: prov.mjs record &lt;requestId&gt; &lt;relativePath&gt; \| report [--files]&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 5 | external |
| node:path | import | 6 | external |
| node:url | import | 7 | external |
| ../src/provenance/ledger.mjs | import | 8 | [harness/src/provenance/ledger.mjs](../src/provenance/ledger.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
