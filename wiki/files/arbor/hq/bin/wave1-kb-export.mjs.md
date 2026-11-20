# File: hq/bin/wave1-kb-export.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/bin/wave1-kb-export.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1704 B |
| Lines | 26 |
| Hash | dd7f6590bfcb |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| argv | const | 7 | no | const argv = process.argv.slice(2); |
| get | function | 8 | no | function get(flag) { const i = argv.indexOf(flag); return i &lt; 0 ? null : argv[i+1]; } |
| main | function | 9 | no | function main() { |
| dbPath | const | 10 | no | const dbPath = get(&#39;--db&#39;), manifestPath = get(&#39;--manifest&#39;); |
| manifest | const | 15 | no | const manifest = JSON.parse(readFileSync(manifestPath,&#39;utf8&#39;)); |
| projectId | const | 16 | no | const projectId = Number(get(&#39;--project-id&#39;)); |
| limit | const | 17 | no | const limit = get(&#39;--limit&#39;) == null ? 200 : Number(get(&#39;--limit&#39;)); |
| db | const | 18 | no | const db = new DatabaseSync(resolve(dbPath), { readOnly: true }); |
| result | const | 21 | no | const result = exportWave1KbSemantic(db, { projectId, projectName:get(&#39;--project-name&#39;), rootId:get(&#39;--root&#39;), sourceRevision:get(&#39;--revision&#39;), sourceManifest:manifest.sources, limit }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:sqlite | import | 3 | external |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| ../lib/wave1-kb-read.mjs | import | 6 | [hq/lib/wave1-kb-read.mjs](../lib/wave1-kb-read.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
/** Wave 1 Lane B export: strictly read-only source DB, stdout data-only JSON. */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { exportWave1KbSemantic } from '../lib/wave1-kb-read.mjs';
const argv = process.argv.slice(2);
function get(flag) { const i = argv.indexOf(flag); return i < 0 ? null : argv[i+1]; }
function main() {
  const dbPath = get('--db'), manifestPath = get('--manifest');
  if (!dbPath || !manifestPath || !get('--project-id') || !get('--project-name') || !get('--root') || !get('--revision')) {
    throw new Error('Usage: node hq/bin/wave1-kb-export.mjs --db PATH --manifest verified-sources.json --project-id N --project-name NAME --root ROOT-ID --revision 40HEX [--limit N]');
  }
  if (!existsSync(dbPath) || !existsSync(manifestPath)) throw new Error('missing source database or source manifest (never created)');
  const manifest = JSON.parse(readFileSync(manifestPath,'utf8'));
  const projectId = Number(get('--project-id'));
  const limit = get('--limit') == null ? 200 : Number(get('--limit'));
  const db = new DatabaseSync(resolve(dbPath), { readOnly: true });
  try {
    db.exec('PRAGMA query_only=ON');
    const result = exportWave1KbSemantic(db, { projectId, projectName:get('--project-name'), rootId:get('--root'),
      sourceRevision:get('--revision'), sourceManifest:manifest.sources, limit });
    process.stdout.write(JSON.stringify(result, null, 2)+'\n');
  } finally { db.close(); }
}
try { main(); } catch (error) { console.error(`wave1-kb-export: ${error.code ?? 'BLOCKED'}: ${error.message}`); process.exitCode=2; }
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
