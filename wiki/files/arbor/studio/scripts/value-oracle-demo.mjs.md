# File: studio/scripts/value-oracle-demo.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/value-oracle-demo.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1992 B |
| Lines | 22 |
| Hash | 71e98e81a95d |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 8 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| tr | const | 9 | no | const tr = JSON.parse(readFileSync(path.join(here, &#39;..&#39;, &#39;test&#39;, &#39;fixtures&#39;, &#39;value-oracle&#39;, &#39;demo.json&#39;), &#39;utf8&#39;)); |
| dataRoot | const | 10 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;aion-oracle-71-synthetic-&#39;)); |
| sessionDir | const | 11 | no | const sessionDir = path.join(dataRoot, &#39;sessions&#39;, tr.meta.id); |
| core | const | 16 | no | const core = { defaultDataDir: () =&gt; dataRoot, |
| result | const | 20 | no | const result = await packetFromSavedSession({ sessionId: tr.meta.id, home: dataRoot, outDir: path.join(dataRoot, &#39;output&#39;), core }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| node:os | import | 5 | external |
| node:url | import | 6 | external |
| ../src/export/saved-session-outcome.mjs | import | 7 | [studio/src/export/saved-session-outcome.mjs](../src/export/saved-session-outcome.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Synthetic-only saved-session demonstration. Uses Core reader doubles; not a live Studio integration test.
import { readFileSync, mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { packetFromSavedSession } from '../src/export/saved-session-outcome.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const tr = JSON.parse(readFileSync(path.join(here, '..', 'test', 'fixtures', 'value-oracle', 'demo.json'), 'utf8'));
const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'aion-oracle-71-synthetic-'));
const sessionDir = path.join(dataRoot, 'sessions', tr.meta.id);
mkdirSync(path.join(sessionDir, 'kv'), { recursive: true }); mkdirSync(path.join(sessionDir, 'datasets'), { recursive: true });
writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(tr.meta, null, 2));
writeFileSync(path.join(sessionDir, 'kv', 'DOM_TURNS.json'), JSON.stringify(tr.turns, null, 2));
writeFileSync(path.join(sessionDir, 'kv', 'KNOWLEDGE_STATUS.json'), JSON.stringify({ status: 'complete', entityCount: 0 }, null, 2));
const core = { defaultDataDir: () => dataRoot,
  open: (_dir, id) => ({ id, dir: sessionDir, meta: tr.meta, kv: { get: (k, d) => { try { return JSON.parse(readFileSync(path.join(sessionDir, 'kv', k + '.json'), 'utf8')); } catch { return d; } } } }),
  buildTranscript: () => tr,
  readAcceptance: () => ({ verdict: 'unassessed', reasons: ['synthetic fixture: no canonical acceptance raw digest'] }) };
const result = await packetFromSavedSession({ sessionId: tr.meta.id, home: dataRoot, outDir: path.join(dataRoot, 'output'), core });
console.log(JSON.stringify({ synthetic_mock_core: true, source_session: sessionDir, verified_dom_refs: result.packet.derivation.original_dom_locators_verified,
  acceptance: result.packet.acceptance.verdict, outputs: result.outDir, independent_qa_accepted: false }, null, 2));
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
