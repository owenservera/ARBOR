# File: hq/test/kg-import-product.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/kg-import-product.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13409 B |
| Lines | 282 |
| Hash | b36924ab50ef |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REPO | const | 29 | no | const REPO = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;); |
| CLI | const | 30 | no | const CLI = join(REPO, &#39;hq&#39;, &#39;bin&#39;, &#39;hq.mjs&#39;); |
| BIN_DIR | const | 31 | no | const BIN_DIR = PACKAGED_NATIVE_BIN_DIR.split(&#39;/&#39;); |
| temp | function | 33 | no | function temp(prefix) { |
| workspace | function | 37 | no | function workspace(files) { |
| root | const | 38 | no | const root = temp(&#39;hq-kg-import-product-&#39;); |
| project | const | 39 | no | const project = join(root, &#39;demo&#39;); |
| db | const | 42 | no | const db = openMemoryDb(); |
| exportOf | function | 47 | no | function exportOf(db, root) { |
| dir | const | 48 | no | const dir = join(root, &#39;.hq&#39;); |
| outPath | const | 50 | no | const outPath = join(dir, &#39;kg-exchange.jsonl&#39;); |
| statePath | const | 51 | no | const statePath = join(dir, &#39;kg-export-state.json&#39;); |
| exported | const | 52 | no | const exported = exportGraphExchange({ db, outPath, statePath }); |
| localImporterDir | function | 57 | no | function localImporterDir() { |
| dirs | const | 58 | no | const dirs = [ |
| names | const | 65 | no | const names = process.platform === &#39;win32&#39; ? [&#39;hqkg-import.exe&#39;, &#39;hqkg-import&#39;] : [&#39;hqkg-import&#39;, &#39;hqkg-import.exe&#39;]; |
| cliWorkspace | function | 70 | no | function cliWorkspace() { |
| ws | const | 71 | no | const ws = temp(&#39;hq-kg-cli-&#39;); |
| root | const | 88 | no | const root = temp(&#39;hq-kg-resolve-&#39;); |
| binDir | const | 89 | no | const binDir = join(root, ...BIN_DIR); |
| exe | const | 91 | no | const exe = join(binDir, process.platform === &#39;win32&#39; ? &#39;hqkg-import.exe&#39; : &#39;hqkg-import&#39;); |
| resolved | const | 94 | no | const resolved = resolveGraphImporter({ root, env: {} }); |
| root | const | 103 | no | const root = temp(&#39;hq-kg-resolve-missing-&#39;); |
| spawns | variable | 104 | no | let spawns = 0; |
| out | const | 105 | no | const out = importGraphExchange({ root, journal: join(root, &#39;kg.hqj&#39;), exchange: join(root, &#39;exchange.jsonl&#39;), env: {}, spawn: () =&gt; { spawns += 1; throw new Error(&#39;must not spawn&#39;); }, }); |
| SEP | const | 116 | no | const SEP = process.platform === &#39;win32&#39; ? &#39;\\\\&#39; : &#39;/&#39;; |
| calls | const | 119 | no | const calls = []; |
| out | const | 120 | no | const out = importGraphExchange({ root: REPO, journal: &#39;J&#39;, exchange: &#39;E&#39;, env: { [IMPORT_MODE_ENV]: &#39;cargo&#39; }, spawn: (program, args) =&gt; { calls.push({ program, args }); |
| parsed | const | 147 | no | const parsed = parseImporterOutput( &#39;schema=repos-hq.hqkg-exchange/1 source=repos-hq.index namespace=repos-hq.index digest=abc\\n&#39; + &#39;node inserted=2 updated=1 unchanged=0 deleted=3 edge inserted=0 up… |
| legacy | const | 158 | no | const legacy = parseImporterOutput(&#39;schema=s source=repos-hq.index digest=d\\nepoch before=1 after=2 dry_run=false wrote_snapshot=true\\n&#39;); |
| out | const | 163 | no | const out = importGraphExchange({ root: REPO, journal: &#39;J&#39;, exchange: &#39;E&#39;, namespace: SOURCE_NAMESPACE, env: { [IMPORT_MODE_ENV]: &#39;cargo&#39; }, spawn: () =&gt; ({ status: 0, |
| importerDir | const | 184 | no | const importerDir = localImporterDir(); |
| env | const | 193 | no | const env = { ...process.env, [IMPORTER_BIN_DIR_ENV]: importerDir, [IMPORT_MODE_ENV]: &#39;packaged&#39; }; |
| first | const | 195 | no | const first = exportOf(db, root); |
| firstImport | const | 196 | no | const firstImport = importGraphExchange({ root, journal: first.journal, exchange: first.outPath, namespace: SOURCE_NAMESPACE, env, }); |
| firstAck | const | 205 | no | const firstAck = acknowledgeGraphExport({ statePath: first.statePath, digest: first.exported.digest, acknowledgment: { epochBefore: firstImport.epochBefore, epochAfter: firstImport.epochAfter }, }); |
| committed | const | 210 | no | const committed = JSON.parse(readFileSync(first.statePath, &#39;utf8&#39;)); |
| replay | const | 215 | no | const replay = importGraphExchange({ root, journal: first.journal, exchange: first.outPath, namespace: SOURCE_NAMESPACE, env, }); |
| second | const | 225 | no | const second = exportOf(db, root); |
| secondImport | const | 227 | no | const secondImport = importGraphExchange({ root, journal: second.journal, exchange: second.outPath, namespace: SOURCE_NAMESPACE, env, }); |
| secondAck | const | 232 | no | const secondAck = acknowledgeGraphExport({ statePath: second.statePath, digest: second.exported.digest, acknowledgment: { epochBefore: secondImport.epochBefore, epochAfter: secondImport.epochAfter, s… |
| blocked | const | 240 | no | const blocked = importGraphExchange({ root, journal: second.journal, exchange: second.outPath, namespace: &#39;not-our-namespace&#39;, env, }); |
| ws | const | 257 | no | const ws = cliWorkspace(); |
| env | const | 259 | no | const env = { ...process.env, [IMPORT_MODE_ENV]: &#39;packaged&#39; }; |
| payload | variable | 261 | no | let payload = null; |
| status | variable | 262 | no | let status = 0; |
| out | const | 264 | no | const out = execFileSync(process.execPath, [CLI, &#39;kg&#39;, &#39;sync&#39;, &#39;--json&#39;], { cwd: ws, encoding: &#39;utf8&#39;, env, stdio: [&#39;ignore&#39;, &#39;pipe&#39;, &#39;ignore&#39;], }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 14 | external |
| node:assert/strict | import | 15 | external |
| node:fs | import | 16 | external |
| node:os | import | 17 | external |
| node:path | import | 18 | external |
| node:url | import | 19 | external |
| node:child_process | import | 20 | external |
| ../lib/schema.mjs | import | 21 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/indexer.mjs | import | 22 | [hq/lib/indexer.mjs](../lib/indexer.mjs.md) |
| ../lib/kg-export.mjs | import | 23 | [hq/lib/kg-export.mjs](../lib/kg-export.mjs.md) |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | A registered source change must reach the native graph through the |
| 7 | invariant | — | — | No new graph, journal or interpreter: the exchange comes from the |
| 10 | invariant | — | — | Every database is in-memory and every fixture lives under a |
| 12 | see | — | hq/lib/kg-export.mjs | hq/lib/kg-export.mjs · native/hqkg/src/bin/hqkg-import.rs · |

## Excerpt

```javascript
// hq/test/kg-import-product.test.mjs — the packaged native-import path.
//
// @hq:context A registered source change must reach the native graph through the
//   frozen package's own hqkg-import binary, with no Cargo on the machine, and
//   the exchange state may advance only on the importer's verified
//   acknowledgment.
// @hq:invariant No new graph, journal or interpreter: the exchange comes from the
//   incumbent producer (hq/lib/kg-export.mjs) and the journal is the one the
//   importer already owns.
// @hq:invariant Every database is in-memory and every fixture lives under a
//   disposable temp directory.
// @hq:see hq/lib/kg-export.mjs · native/hqkg/src/bin/hqkg-import.rs ·
//   tools/packaging/prepare-host-runtime.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { openMemoryDb } from '../lib/schema.mjs';
import { indexProject } from '../lib/indexer.mjs';
import {
  acknowledgeGraphExport, exportGraphExchange, importGraphExchange, parseImporterOutput,
  resolveGraphImporter, SOURCE_NAMESPACE, PACKAGED_NATIVE_BIN_DIR,
  IMPORT_MODE_ENV, IMPORTER_BIN_DIR_ENV,
} from '../lib/kg-export.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = join(REPO, 'hq', 'bin', 'hq.mjs');
const BIN_DIR = PACKAGED_NATIVE_BIN_DIR.split('/');

function temp(prefix) {
  return mkdtempSync(join(tmpdir(), prefix));
}

function workspace(files) {
  const root = temp('hq-kg-import-product-');
  const project = join(root, 'demo');
  mkdirSync(join(project, 'src'), { recursive: true });
  for (const [rel, text] of Object.entries(files)) writeFileSync(join(project, rel), text, 'utf8');
  const db = openMemoryDb();
  indexProject({ root, db, project: { name: 'demo', path: project }, options: { useGit: false } });
  return { root, project, db };
}

function exportOf(db, root) {
  const dir = join(root, '.hq');
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, 'kg-exchange.jsonl');
  const statePath = join(dir, 'kg-export-state.json');
  const exported = exportGraphExchange({ db, outPath, statePath });
  return { exported, outPath, statePath, journal: join(dir, 'kg-journal.hqj') };
}

/** Existing local importer binary, if the checkout has one built. */
function localImporterDir() {
  const dirs = [
    process.env[IMPORTER_BIN_DIR_ENV],
    join(REPO, 'target', 'release'),
    join(REPO, 'target', 'debug'),
    join(REPO, 'native', 'hqkg', 'target', 'release'),
    join(REPO, 'native', 'hqkg', 'target', 'debug'),
  ].filter(Boolean);
  const names = process.platform === 'win32' ? ['hqkg-import.exe', 'hqkg-import'] : ['hqkg-import', 'hqkg-import.exe'];
  for (const dir of dirs) if (names.some((name) => existsSync(join(dir, name)))) return dir;
  return null;
}

function cliWorkspace() {
  const ws = temp('hq-kg-cli-');
  mkdirSync(join(ws, '.hq'), { recursive: true });
  writeFileSync(join(ws, '.hq', 'config.json'), JSON.stringify({ db: '.hq/index.db', maxFileBytes: 200000, ignores: [] }));
  writeFileSync(join(ws, 'projects.json'), JSON.stringify({
    version: 1,
    projects: [{ name: 'demo', path: 'demo', tags: [], addedAt: '2026-11-10T00:00:00.000Z' }],
  }));
  mkdirSync(join(ws, 'demo', 'src'), { recursive: true });
  writeFileSync(join(ws, 'demo', 'src', 'one.mjs'), 'export const alpha = 1;\n');
  return ws;
```

_First 80 of 282 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
