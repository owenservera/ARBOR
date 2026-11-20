# File: hq/test/semantic-convergence.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/semantic-convergence.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 17309 B |
| Lines | 345 |
| Hash | e498bcff7fdd |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AT | const | 16 | no | const AT = &#39;2026-01-01T00:00:00.000Z&#39;; |
| HASH | const | 17 | no | const HASH = &#39;e&#39;.repeat(64); |
| ROADMAP | const | 19 | no | const ROADMAP = { |
| REGISTRY | const | 29 | no | const REGISTRY = { |
| JOURNEY | const | 53 | no | const JOURNEY = { |
| CROSSWALK | const | 58 | no | const CROSSWALK = { |
| GAPS | const | 82 | no | const GAPS = { schema: &#39;vivim.activation-gaps/1&#39;, gaps: [] }; |
| makeFixture | function | 84 | no | function makeFixture(root, extra = {}) { |
| sync | function | 95 | no | function sync(db, root, now = &#39;2026-11-02T00:00:00.000Z&#39;) { |
| seedCodeIndex | function | 102 | no | function seedCodeIndex(db, { projectName = &#39;vivim-web-harness&#39; } = {}) { |
| mkProject | function | 103 | no | const mkProject = (name, path) =&gt; Number( db.prepare(&#39;INSERT INTO projects(name, path, added_at) VALUES (?, ?, ?)&#39;).run(name, path, AT).lastInsertRowid, ); |
| mkFile | function | 106 | no | const mkFile = (projectId, path) =&gt; Number( db.prepare(`INSERT INTO files(project_id, path, abs_path, lang, kind, size, mtime_ms, hash, lines) VALUES (?, ?, ?, &#39;javascript&#39;, &#39;source&#39;, 10, 1, ?, 5)`).… |
| mkSymbol | function | 110 | no | const mkSymbol = (projectId, fileId, name, kind, line) =&gt; |
| projectId | const | 114 | no | const projectId = mkProject(projectName, &#39;/tmp/space-a&#39;); |
| a | const | 115 | no | const a = mkFile(projectId, &#39;src/a.mjs&#39;); |
| otherId | const | 118 | no | const otherId = mkProject(&#39;other-space&#39;, &#39;/tmp/space-b&#39;); |
| b | const | 119 | no | const b = mkFile(otherId, &#39;src/other.mjs&#39;); |
| withSyncedVivim | function | 124 | no | function withSyncedVivim(fn, options = {}) { |
| root | const | 125 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-semconv-&#39;)); |
| db | const | 127 | no | const db = openMemoryDb(); |
| result | const | 129 | no | const result = sync(db, root); |
| j001 | const | 146 | no | const j001 = JSON.parse(db.prepare(&quot;SELECT payload FROM vivim_records WHERE kind=&#39;journey&#39; AND id=&#39;J001&#39;&quot;).get().payload); |
| j002 | const | 152 | no | const j002 = JSON.parse(db.prepare(&quot;SELECT payload FROM vivim_records WHERE kind=&#39;journey&#39; AND id=&#39;J002&#39;&quot;).get().payload); |
| before | const | 161 | no | const before = db.prepare(&#39;SELECT kind, id, payload FROM vivim_records ORDER BY kind, id&#39;).all(); |
| again | const | 162 | no | const again = sync(db, mkdtempSync(join(tmpdir(), &#39;hq-semconv-b-&#39;)), undefined); |
| after | const | 164 | no | const after = db.prepare(&#39;SELECT kind, id, payload FROM vivim_records ORDER BY kind, id&#39;).all(); |
| root | const | 170 | no | const root = mkdtempSync(join(tmpdir(), &#39;hq-semconv-pid-&#39;)); |
| db | const | 172 | no | const db = openMemoryDb(); |
| result | const | 175 | no | const result = sync(db, root); |
| rows | const | 177 | no | const rows = db.prepare(&#39;SELECT project_id FROM vivim_records WHERE project_id IS NULL&#39;).all(); |
| distinct | const | 179 | no | const distinct = db.prepare(&#39;SELECT DISTINCT project_id FROM vivim_records&#39;).all(); |
| explained | const | 194 | no | const explained = explainVivimRecord(db, { id: &#39;CAP-01&#39; }); |
| rel | const | 199 | no | const rel = explained.relationships; |
| requirement | const | 217 | no | const requirement = explainVivimRecord(db, { id: &#39;CAP-01#acceptance&#39; }); |
| journey | const | 221 | no | const journey = explainVivimRecord(db, { id: &#39;J001&#39; }); |
| task | const | 230 | no | const task = explainVivimRecord(db, { id: &#39;D01&#39; }); |
| results | const | 253 | no | const results = kbQuery(db, { query: &#39;shared catalogue builder&#39; }); |
| vivimRows | const | 254 | no | const vivimRows = results.filter((entry) =&gt; entry.kind === &#39;vivim&#39;); |
| capability | const | 257 | no | const capability = results.find((entry) =&gt; entry.id === &#39;vivim:capability:CAP-01&#39;); |
| requirement | const | 267 | no | const requirement = results.find((entry) =&gt; entry.id === &#39;vivim:requirement:CAP-01#acceptance&#39;); |
| sorted | const | 272 | no | const sorted = results.slice().sort((a, b) =&gt; (b.score - a.score) \|\| (a.id &lt; b.id ? -1 : 1)); |
| onlyVivim | const | 279 | no | const onlyVivim = kbQuery(db, { query: &#39;catalogue&#39;, kind: &#39;vivim&#39; }); |
| byAlias | const | 284 | no | const byAlias = kbQuery(db, { query: &#39;catalogue&#39;, kind: &#39;requirement&#39; }); |
| results | const | 310 | no | const results = kbQuery(db, { query: &#39;shared catalogue builder&#39; }); |
| ids | const | 311 | no | const ids = results.map((entry) =&gt; entry.id); |
| health | const | 323 | no | const health = kbHealth(db); |
| db | const | 334 | no | const db = openMemoryDb(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| bun:test | import | 5 | external |
| node:assert/strict | import | 6 | external |
| node:fs | import | 7 | external |
| node:os | import | 8 | external |
| node:path | import | 9 | external |
| ../lib/schema.mjs | import | 10 | [hq/lib/schema.mjs](../lib/schema.mjs.md) |
| ../lib/vivim.mjs | import | 11 | [hq/lib/vivim.mjs](../lib/vivim.mjs.md) |
| ../lib/kb.mjs | import | 14 | [hq/lib/kb.mjs](../lib/kb.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/semantic-convergence.test.mjs — R2 semantic convergence (ZAIQ-006):
// journey<->capability crosswalk edges, the joined `vivim explain` read view,
// and the VIVIM product ledger in the unified KB read model. All joins reuse
// existing tables (vivim_records, files, symbols) — no new store is created.
import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openMemoryDb } from '../lib/schema.mjs';
import {
  syncVivim, explainVivimRecord, vivimTablesPresent,
} from '../lib/vivim.mjs';
import { kbQuery, kbHealth, kbExport } from '../lib/kb.mjs';

const AT = '2026-01-01T00:00:00.000Z';
const HASH = 'e'.repeat(64);

const ROADMAP = {
  schema: 1,
  activePhase: { id: 'PH1', status: 'active', source: 'owner', runtimeExecution: 'authorized', allowed: 'implement', blocked: 'none', release: '2026-11' },
  items: [
    { id: 'D01', title: 'Ship catalogue builder', status: 'done', owner: 'a', refs: [], depends_on: [], notes: '' },
    { id: 'D02', title: 'Health endpoint', status: 'open', owner: 'a', refs: [], depends_on: [], notes: '' },
  ],
  milestones: [{ id: 'M1', title: 'Milestone One', status: 'done', acceptance: 'accept M1', notes: '' }],
};

const REGISTRY = {
  schema: 'vivim.atomic-capabilities/1',
  items: [
    {
      id: 'CAP-01', title: 'Shared catalogue builder', kind: 'atomic_feature',
      productPriority: 'P0', executionWave: 'unassigned', decisionState: 'execution_dependent',
      spec: 'dev/prd/01.md',
      acceptance: 'Cloud and Direct status return the same capabilities document',
      links: {
        roadmap: ['D01'],
        existingSourceCandidates: [{ path: 'src/a.mjs' }, { path: 'src/missing.mjs' }],
        verifiedSymbols: [{ name: 'buildCatalogue' }, { name: 'sharedRelay' }],
        sourceResolution: 'symbol_declaration_verified_behavior_unverified',
      },
    },
    {
      id: 'CAP-02', title: 'Host health snapshot', kind: 'atomic_feature',
      productPriority: 'P1', executionWave: 'unassigned', decisionState: 'execution_dependent',
      spec: 'dev/prd/02.md', acceptance: 'Host exposes readiness',
      links: { roadmap: ['D02'] },
    },
  ],
};

const JOURNEY = {
  schema: 'vivim.user-journey-activation-graph/1',
  phases: [{ id: 'A', name: 'Phase A', groups: [{ id: 'A1', name: 'Group A1', step_ids: ['J001', 'J002'] }] }],
};

const CROSSWALK = {
  schema: 'vivim.journey-to-capability-crosswalk/1',
  entries: [
    {
      journeyId: 'J001', source: 'src/a.mjs', sourceSymbol: 'buildCatalogue',
      atomicCandidateIds: ['CAP-01', 'CAP-02'], strongerSymbolCandidateIds: ['CAP-01'],
      topologyNodeIds: [], roadmapTaskIds: ['D01'],
      matchPolicy: 'lexical source or curated source candidate only; not execution proof',
    },
    {
      // all-empty entry: J002 must keep the exact pre-crosswalk payload shape
      journeyId: 'J002', source: 'src/b.mjs', sourceSymbol: null,
      atomicCandidateIds: [], strongerSymbolCandidateIds: [], topologyNodeIds: [], roadmapTaskIds: [],
      matchPolicy: 'lexical source or curated source candidate only; not execution proof',
    },
    {
      // dangling journey reference: recorded as skipped, never a record
      journeyId: 'J999', source: 'src/x.mjs', sourceSymbol: null,
      atomicCandidateIds: ['CAP-01'], strongerSymbolCandidateIds: [], topologyNodeIds: [], roadmapTaskIds: [],
      matchPolicy: 'lexical source or curated source candidate only; not execution proof',
    },
  ],
};
```

_First 80 of 346 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
