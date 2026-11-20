# File: hq/lib/aii/runner.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/aii/runner.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10117 B |
| Lines | 291 |
| Hash | 141b3f51ce1c |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEFAULT_TIMEOUT_MS | const | 30 | yes | export const DEFAULT_TIMEOUT_MS = 120_000; |
| HEAVY_TIMEOUT_MS | const | 31 | yes | export const HEAVY_TIMEOUT_MS = 300_000; |
| withTimeout | function | 33 | no | function withTimeout(promise, ms, onTimeout) { |
| timer | const | 36 | no | const timer = setTimeout(() =&gt; { const err = new Error(onTimeout ?? `fixture exceeded ${ms}ms`); err.code = &#39;AII_TIMEOUT&#39;; reject(err); }, ms); |
| err | const | 37 | no | const err = new Error(onTimeout ?? `fixture exceeded ${ms}ms`); |
| brief | function | 49 | no | function brief(row) { |
| runOne | function | 62 | yes | export async function runOne(entry, { root, timeoutMs = null, cache = null, allowWrites = false } = {}) { |
| startedAt | const | 63 | no | const startedAt = Date.now(); |
| base | const | 64 | no | const base = { |
| finish | function | 80 | no | const finish = (patch) =&gt; ({ ...base, ...patch, durationMs: Date.now() - startedAt, }); |
| text | variable | 88 | no | let text; |
| fixtureSha | const | 94 | no | const fixtureSha = sha256Text(text); |
| planDrift | const | 95 | no | const planDrift = entry.sha &amp;&amp; entry.sha !== fixtureSha; |
| mod | const | 100 | no | const mod = await import(`${pathToFileURL(entry.path).href}?sha=${fixtureSha}`); |
| message | const | 103 | no | const message = String(err?.message ?? err); |
| status | const | 104 | no | const status = /^invalid fixture/.test(message) ? &#39;invalid&#39; : &#39;load&#39;; |
| expectedSha | const | 118 | no | const expectedSha = expectationsDigest(def.expected); |
| limit | const | 119 | no | const limit = Number(timeoutMs) &gt; 0 ? Number(timeoutMs) : (entry.tier === &#39;heavy&#39; ? HEAVY_TIMEOUT_MS : DEFAULT_TIMEOUT_MS); |
| store | const | 120 | no | const store = { cwd: root, timeoutMs: limit, cache, allowWrites, violations: [], probes: [] }; |
| findings | variable | 122 | no | let findings; |
| missing | const | 176 | no | const missing = def.expected.filter((exp) =&gt; !findings.some((row) =&gt; matchesFinding(exp, row))); |
| countHits | function | 190 | no | function countHits(store) { |
| runFixtures | function | 204 | yes | export async function runFixtures(fixtures, { root, jobs = 8, budgetMs = 0, cache = new Map(), |
| list | const | 213 | no | const list = Array.isArray(fixtures) ? fixtures : []; |
| results | const | 214 | no | const results = new Array(list.length); |
| startedAt | const | 215 | no | const startedAt = now(); |
| width | const | 216 | no | const width = Math.max(1, Math.min(Number(jobs) \|\| 1, list.length \|\| 1, 16)); |
| next | variable | 217 | no | let next = 0; |
| budgetSpent | function | 219 | no | const budgetSpent = () =&gt; Number(budgetMs) &gt; 0 &amp;&amp; now() - startedAt &gt;= Number(budgetMs); |
| worker | function | 221 | no | async function worker() { |
| index | const | 223 | no | const index = next++; |
| entry | const | 225 | no | const entry = list[index]; |
| result | const | 245 | no | const result = await runOne(entry, { root, timeoutMs: entry.timeoutMs, cache, allowWrites }); |
| recordResults | function | 259 | yes | export async function recordResults(db, results, { catalogSha = &#39;&#39;, project = &#39;repos-hq&#39; } = {}) { |
| recorded | const | 260 | no | const recorded = []; |
| errors | const | 261 | no | const errors = []; |
| receipt | const | 265 | no | const receipt = await recordReceiptWithRetry(db, buildFixtureReceipt(result, { catalogSha, project })); |
| recordReceiptWithRetry | function | 276 | no | async function recordReceiptWithRetry(db, receipt, attempts = 6) { |
| lastError | variable | 277 | no | let lastError = null; |
| message | const | 282 | no | const message = String(err?.message ?? err); |
| AII_FIXTURE_KIND | export | 291 | yes | export { AII_FIXTURE_KIND } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 22 | external |
| node:url | import | 23 | external |
| ./registry.mjs | import | 24 | [hq/lib/aii/registry.mjs](./registry.mjs.md) |
| ./receipts-policy.mjs | import | 25 | [hq/lib/aii/receipts-policy.mjs](./receipts-policy.mjs.md) |
| ./plan.mjs | import | 26 | [hq/lib/aii/plan.mjs](./plan.mjs.md) |
| ../../aii/fixtures/harness.mjs | import | 27 | [hq/aii/fixtures/harness.mjs](../../aii/fixtures/harness.mjs.md) |
| ../receipts.mjs | import | 28 | [hq/lib/receipts.mjs](../receipts.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/aii/runner.mjs — bounded execution of AII fixtures.
//
// Three properties the old runner lacked, each of which made a >30 minute run
// indistinguishable from a hung one:
//
//   1. A per-fixture wall clock. A probe that hangs is cut at its own timeout
//      and the fixture is reported as `timeout`, not as silence.
//   2. A run budget. Once spent, the remaining fixtures are reported as
//      `budget-exhausted` instead of being started, so a partial pass is a
//      truthful partial pass with a stated reason.
//   3. A probe cache. Several fixtures re-run the same expensive scan
//      (`docs health`, `conflicts`, `zcode-doctor`); inside one process the
//      result cannot have changed, so it is reused and the saving is reported.
//
// Read-only enforcement lives in the harness probe context (see
// hq/aii/fixtures/harness.mjs). The runner only opens the context; a refused
// probe surfaces as status `mutating-probe` rather than being silently allowed.
//
// This module never writes views and never mutates the journal. It returns
// results; scripts/aii-verify.mjs decides what to persist.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { AII_FIXTURE_KIND } from './registry.mjs';
import { buildFixtureReceipt, expectationsDigest } from './receipts-policy.mjs';
import { sha256Text } from './plan.mjs';
import { defineFixture, matchesFinding, probeContext } from '../../aii/fixtures/harness.mjs';
import { recordReceipt } from '../receipts.mjs';

export const DEFAULT_TIMEOUT_MS = 120_000;
export const HEAVY_TIMEOUT_MS = 300_000;

function withTimeout(promise, ms, onTimeout) {
  if (!Number.isFinite(ms) || ms <= 0) return promise;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(onTimeout ?? `fixture exceeded ${ms}ms`);
      err.code = 'AII_TIMEOUT';
      reject(err);
    }, ms);
    if (typeof timer?.unref === 'function') timer.unref();
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

function brief(row) {
  if (!row) return null;
  if (row instanceof RegExp) return `re:${row.source}/${row.flags}`;
  return String(row);
}

/**
 * runOne — import and execute exactly one fixture file.
 *
 * @param {object} entry plan fixture row (id, name, path, relPath, sha, tier)
 * @param {{root: string, timeoutMs?: number, cache?: Map, allowWrites?: boolean}} options
 * @returns {Promise<object>} result row, never throws
 */
export async function runOne(entry, { root, timeoutMs = null, cache = null, allowWrites = false } = {}) {
  const startedAt = Date.now();
  const base = {
    id: entry.id,
    name: entry.name,
    relPath: entry.relPath,
    tier: entry.tier ?? 'standard',
    fixtureSha: entry.sha ?? null,
    expectedSha: null,
    findings: 0,
    missing: [],
    probes: [],
    probeCacheHits: 0,
    durationMs: 0,
    status: 'fail',
    problem: null,
    error: null,
  };
  const finish = (patch) => ({
```

_First 80 of 292 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
