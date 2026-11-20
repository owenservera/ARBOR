# File: hq/lib/aii/receipts-policy.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/aii/receipts-policy.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10108 B |
| Lines | 240 |
| Hash | d1e9d4c01c33 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HEX64 | const | 26 | no | const HEX64 = /^[0-9a-f]{64}$/; |
| fixtureDigestLegacy | function | 28 | yes | export function fixtureDigestLegacy(id, findingsCount) { |
| fixtureFingerprint | function | 38 | yes | export function fixtureFingerprint({ id, fixtureSha, catalogSha, expectedSha, findingsCount }) { |
| payload | const | 39 | no | const payload = canonicalJson({ schema: &#39;hq.aii-fixture-fingerprint/1&#39;, id: String(id ?? &#39;&#39;), fixtureSha: String(fixtureSha ?? &#39;&#39;), catalogSha: String(catalogSha ?? &#39;&#39;), |
| expectationsDigest | function | 51 | yes | export function expectationsDigest(expected = []) { |
| rows | const | 52 | no | const rows = (Array.isArray(expected) ? expected : []).map((row) =&gt; ({ what: row?.what instanceof RegExp ? `re:${row.what.source}/${row.what.flags}` : String(row?.what ?? &#39;&#39;), where: row?.where insta… |
| buildFixtureReceipt | function | 59 | yes | export function buildFixtureReceipt(result, { catalogSha = &#39;&#39;, project = &#39;repos-hq&#39; } = {}) { |
| fingerprint | const | 60 | no | const fingerprint = fixtureFingerprint({ id: result.id, fixtureSha: result.fixtureSha, catalogSha, expectedSha: result.expectedSha, |
| fixtureRefs | function | 81 | no | function fixtureRefs(receipt) { |
| receiptCreatedAt | function | 88 | no | function receiptCreatedAt(receipt) { |
| newest | function | 92 | no | function newest(receipts) { |
| classifyReceipts | function | 100 | yes | export function classifyReceipts({ receipts = [], plan, strict = false, allowLegacy = false } = {}) { |
| canonicalByTask | const | 101 | no | const canonicalByTask = new Map(); |
| fixtureByPath | const | 102 | no | const fixtureByPath = new Map(); |
| byTask | const | 108 | no | const byTask = new Map(); |
| task | const | 110 | no | const task = String(receipt?.task ?? &#39;&#39;); |
| rows | const | 116 | no | const rows = new Map(); |
| all | const | 118 | no | const all = byTask.get(id) ?? []; |
| boundToCanonical | const | 119 | no | const boundToCanonical = all.filter((r) =&gt; fixtureRefs(r).some((ref) =&gt; ref.path === canonical.relPath)); |
| foreignOnly | const | 120 | no | const foreignOnly = all.filter((r) =&gt; { const refs = fixtureRefs(r); return refs.length &gt; 0 &amp;&amp; refs.every((ref) =&gt; ref.path !== canonical.relPath); }); |
| refs | const | 121 | no | const refs = fixtureRefs(r); |
| unbound | const | 124 | no | const unbound = all.filter((r) =&gt; fixtureRefs(r).length === 0); |
| receipt | const | 127 | no | const receipt = newest(boundToCanonical); |
| ref | const | 128 | no | const ref = fixtureRefs(receipt).find((r) =&gt; r.path === canonical.relPath); |
| shaMatches | const | 129 | no | const shaMatches = ref?.sha256 === canonical.sha; |
| receipt | const | 142 | no | const receipt = newest(unbound); |
| receipt | const | 153 | no | const receipt = newest(foreignOnly); |
| applyJournalPolicy | function | 184 | yes | export function applyJournalPolicy(classification, { journal = null, plan, strict = false } = {}) { |
| canonicalByTask | const | 185 | no | const canonicalByTask = new Map(); |
| canonical | const | 188 | no | const canonical = canonicalByTask.get(id); |
| entry | const | 190 | no | const entry = journal?.entries?.[canonical.relPath]; |
| legacy | const | 201 | no | const legacy = journal?.legacyFailures?.[id]; |
| freshPass | const | 202 | no | const freshPass = entry &amp;&amp; entry.sha === canonical.sha &amp;&amp; entry.status === &#39;pass&#39;; |
| coverageReceipts | function | 217 | yes | export function coverageReceipts(classification) { |
| out | const | 218 | no | const out = []; |
| summarizeEvidence | function | 226 | yes | export function summarizeEvidence(classification) { |
| states | const | 227 | no | const states = [&#39;verified&#39;, &#39;stale&#39;, &#39;legacy&#39;, &#39;foreign&#39;, &#39;failed&#39;, &#39;absent&#39;]; |
| counts | const | 228 | no | const counts = Object.fromEntries(states.map((s) =&gt; [s, 0])); |
| isSha256 | function | 238 | yes | export function isSha256(value) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 22 | external |
| ../util.mjs | import | 23 | [hq/lib/util.mjs](../util.mjs.md) |
| ./registry.mjs | import | 24 | [hq/lib/aii/registry.mjs](./registry.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/harness.mjs](../../aii/fixtures/harness.mjs.md) | ../../lib/aii/receipts-policy.mjs |
| [hq/lib/aii/runner.mjs](./runner.mjs.md) | ./receipts-policy.mjs |
| [hq/lib/aii/views.mjs](./views.mjs.md) | ./receipts-policy.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/aii/receipts-policy.mjs — which AII receipt may prove which scenario.
//
// The old policy was task-keyed only: any receipt whose task was `HQ-0NN`
// promoted the scenario, regardless of which fixture file produced it, whether
// that file still existed, or whether the file had changed since. With
// duplicate ids (two files, one id) the last receipt to be written decided the
// result, and a superseded sibling could invalidate a passing canonical file.
//
// This module makes the decision explicit and inspectable:
//
//   verified  canonical fixture ref + hash equal to the current file   -> proof
//   stale     canonical fixture ref + hash differs                     -> proof of an older file
//   legacy    receipt with no fixture ref at all                       -> unbound
//   foreign   receipt bound only to a quarantined duplicate             -> not proof
//   failed    a fresh journal attempt at the current hash failed        -> contradicts proof
//   absent    no receipt ever recorded                                  -> nothing
//
// Default coverage counts verified + stale (the historical ledger keeps its
// meaning); `--strict` counts only verified. A fresh failure at the current
// fixture hash demotes either way: current evidence beats an old pass.

import { createHash } from 'node:crypto';
import { canonicalJson } from '../util.mjs';
import { AII_FIXTURE_KIND } from './registry.mjs';

const HEX64 = /^[0-9a-f]{64}$/;

export function fixtureDigestLegacy(id, findingsCount) {
  return createHash('sha256').update(`${id}\0${Number(findingsCount) || 0}`).digest('hex');
}

/**
 * fixtureFingerprint — receipt digest bound to the exact evidence that produced
 * it: fixture bytes, locked expectations, catalog and finding count. Editing a
 * fixture therefore creates a new receipt identity instead of silently reusing
 * the old one.
 */
export function fixtureFingerprint({ id, fixtureSha, catalogSha, expectedSha, findingsCount }) {
  const payload = canonicalJson({
    schema: 'hq.aii-fixture-fingerprint/1',
    id: String(id ?? ''),
    fixtureSha: String(fixtureSha ?? ''),
    catalogSha: String(catalogSha ?? ''),
    expectedSha: String(expectedSha ?? ''),
    findingsCount: Number(findingsCount) || 0,
  });
  return createHash('sha256').update(payload).digest('hex');
}

/** expectationsDigest — stable over {what, where} including RegExp sources. */
export function expectationsDigest(expected = []) {
  const rows = (Array.isArray(expected) ? expected : []).map((row) => ({
    what: row?.what instanceof RegExp ? `re:${row.what.source}/${row.what.flags}` : String(row?.what ?? ''),
    where: row?.where instanceof RegExp ? `re:${row.where.source}/${row.where.flags}` : row?.where == null ? null : String(row.where),
  }));
  return createHash('sha256').update(canonicalJson(rows)).digest('hex');
}

export function buildFixtureReceipt(result, { catalogSha = '', project = 'repos-hq' } = {}) {
  const fingerprint = fixtureFingerprint({
    id: result.id,
    fixtureSha: result.fixtureSha,
    catalogSha,
    expectedSha: result.expectedSha,
    findingsCount: result.findings,
  });
  return {
    kind: AII_FIXTURE_KIND,
    task: result.id,
    project,
    sources: [
      { ref: 'fixture:' + String(result.fixtureRel).replaceAll('\\', '/'), sha256: result.fixtureSha },
      { ref: 'catalog:docs/AII-CATALOG.md', sha256: catalogSha },
      { ref: 'expectations:' + String(result.fixtureRel).replaceAll('\\', '/'), sha256: result.expectedSha },
    ],
    digest: fingerprint,
    bytes: Number(result.findings) || 0,
  };
}
```

_First 80 of 241 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
