# File: hq/lib/evidence-join.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/evidence-join.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13467 B |
| Lines | 361 |
| Hash | a5f680640e83 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| isPlaceholderThread | function | 38 | yes | export function isPlaceholderThread(value) { |
| id | const | 40 | no | const id = String(value).trim(); |
| joinEvidence | function | 70 | yes | export function joinEvidence({ receipts = [], outcomes = [], decisions = [], registry = null } = {}) { |
| receiptList | const | 71 | no | const receiptList = Array.isArray(receipts) ? receipts : []; |
| outcomeList | const | 72 | no | const outcomeList = Array.isArray(outcomes) ? outcomes : []; |
| decisionList | const | 73 | no | const decisionList = Array.isArray(decisions) ? decisions : []; |
| outcomeByRequest | const | 78 | no | const outcomeByRequest = new Map(); |
| requestId | const | 80 | no | const requestId = doc?.requestId; |
| canName | const | 85 | no | const canName = typeof registry?.get === &#39;function&#39;; |
| records | const | 88 | no | const records = receiptList.map((receipt) =&gt; { const receiptId = receipt?.receiptId ?? receipt?.id ?? null; const requestId = receipt?.requestId ?? null; const actor = typeof receipt?.actor === &#39;stri… |
| receiptId | const | 89 | no | const receiptId = receipt?.receiptId ?? receipt?.id ?? null; |
| requestId | const | 90 | no | const requestId = receipt?.requestId ?? null; |
| actor | const | 91 | no | const actor = typeof receipt?.actor === &#39;string&#39; ? receipt.actor : (receipt?.actor?.id ?? null); |
| storedThreadId | const | 92 | no | const storedThreadId = storedThreadOf(receipt); |
| outcome | const | 93 | no | const outcome = requestId === null \|\| requestId === undefined \|\| requestId === &#39;&#39; |
| resolved | const | 96 | no | const resolved = resolveThread(storedThreadId, receiptId, canName ? registry : null); |
| decisionRows | const | 111 | no | const decisionRows = decisionList.map((doc) =&gt; ({ id: doc?.decisionId ?? doc?.id ?? null, effect: doc?.effect ?? null, kind: doc?.kind ?? null, at: doc?.decidedAt ?? doc?.at ?? null, |
| joinable | variable | 118 | no | let joinable = 0; |
| stored | variable | 119 | no | let stored = 0; |
| named | variable | 120 | no | let named = 0; |
| unknown | variable | 121 | no | let unknown = 0; |
| storedThreadOf | function | 142 | no | function storedThreadOf(receipt) { |
| after | const | 143 | no | const after = idOf(receipt?.thread?.after); |
| before | const | 145 | no | const before = idOf(receipt?.thread?.before); |
| idOf | function | 154 | no | function idOf(value) { |
| resolveThread | function | 170 | no | function resolveThread(storedThreadId, receiptId, registry) { |
| name | const | 172 | no | const name = lookupName(registry, receiptId); |
| lookupName | function | 184 | no | function lookupName(registry, receiptId) { |
| entry | variable | 187 | no | let entry = null; |
| name | const | 194 | no | const name = entry?.nid ?? entry?.name ?? null; |
| joinCompletionClaims | function | 223 | yes | export function joinCompletionClaims(claims = [], receipts = []) { |
| claimList | const | 224 | no | const claimList = Array.isArray(claims) ? claims : []; |
| byClaim | const | 226 | no | const byClaim = new Map(); |
| key | const | 228 | no | const key = r.claimId ?? r.requestId ?? null; |
| bucket | const | 230 | no | const bucket = byClaim.get(String(key)) ?? []; |
| records | const | 236 | no | const records = claimList.map((c) =&gt; { const id = c.claimId ?? c.requestId ?? null; const supports = byClaim.get(String(id ?? &#39;&#39;)) ?? []; const passing = supports.filter((r) =&gt; String(r.effect ?? &#39;&#39;)… |
| id | const | 237 | no | const id = c.claimId ?? c.requestId ?? null; |
| supports | const | 238 | no | const supports = byClaim.get(String(id ?? &#39;&#39;)) ?? []; |
| passing | const | 239 | no | const passing = supports.filter((r) =&gt; String(r.effect ?? &#39;&#39;).toLowerCase() === &#39;ok&#39;); |
| supported | variable | 249 | no | let supported = 0; |
| unsupported | variable | 250 | no | let unsupported = 0; |
| DEVICE_VERIFICATION_KIND | const | 272 | yes | export const DEVICE_VERIFICATION_KIND = &#39;device-verification&#39;; |
| deviceVerificationAbsence | function | 298 | yes | export function deviceVerificationAbsence({ capabilities = [], receipts = [], recon = [], } = {}) { |
| capList | const | 303 | no | const capList = Array.isArray(capabilities) ? capabilities : []; |
| receiptList | const | 304 | no | const receiptList = Array.isArray(receipts) ? receipts : []; |
| reconList | const | 305 | no | const reconList = Array.isArray(recon) ? recon : []; |
| deviceReceipts | const | 307 | no | const deviceReceipts = receiptList.filter( (r) =&gt; r &amp;&amp; String(r.kind ?? &#39;&#39;) === DEVICE_VERIFICATION_KIND, ); |
| byCap | const | 312 | no | const byCap = new Map(); |
| id | const | 314 | no | const id = cap?.id == null ? null : String(cap.id); |
| task | const | 319 | no | const task = r?.task == null ? null : String(r.task); |
| refs | const | 320 | no | const refs = Array.isArray(r?.sources) ? r.sources.map((s) =&gt; String(s?.ref ?? &#39;&#39;)) : []; |
| hits | const | 321 | no | const hits = [task, ...refs].filter((x) =&gt; x != null &amp;&amp; byCap.has(x)); |
| row | const | 323 | no | const row = byCap.get(id); |
| id | const | 331 | no | const id = row?.id == null ? null : String(row.id); |
| records | const | 338 | no | const records = []; |
| verified | variable | 339 | no | let verified = 0; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-035-device-verification-absence.mjs](../aii/fixtures/HQ-035-device-verification-absence.mjs.md) | ../../lib/evidence-join.mjs |
| [hq/aii/fixtures/HQ-047-completion-claims.mjs](../aii/fixtures/HQ-047-completion-claims.mjs.md) | ../../lib/evidence-join.mjs |
| [hq/aii/fixtures/HQ-055-strongest-evidence.mjs](../aii/fixtures/HQ-055-strongest-evidence.mjs.md) | ../../lib/evidence-join.mjs |
| [hq/test/evidence-join.test.mjs](../test/evidence-join.test.mjs.md) | ../lib/evidence-join.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | The receipt/outcome/decision join: what a channel receipt claimed, what its outcome |
| 5 | owner | channel-manager | — | channel-manager |
| 6 | task | — | — | evidence-join |
| 7 | invariant | — | — | a receipt joins its outcome by requestId only; a filename or any other id is never a key |
| 8 | invariant | — | — | the join is pure: the caller already read the arrays; nothing here reads or writes a feed |
| 9 | invariant | — | — | an absent or broken registry degrades a placeholder thread to &#39;unknown&#39;; it never throws |
| 10 | see | — | hq/lib/comms-roof.mjs | hq/lib/comms-roof.mjs |
| 11 | see | — | hq/lib/cnp.mjs | hq/lib/cnp.mjs |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context The receipt/outcome/decision join: what a channel receipt claimed, what its outcome
 *   says, and which source named the conversation the receipt touched.
 * @hq:owner channel-manager
 * @hq:task evidence-join
 * @hq:invariant a receipt joins its outcome by requestId only; a filename or any other id is never a key
 * @hq:invariant the join is pure: the caller already read the arrays; nothing here reads or writes a feed
 * @hq:invariant an absent or broken registry degrades a placeholder thread to 'unknown'; it never throws
 * @hq:see hq/lib/comms-roof.mjs
 * @hq:see hq/lib/cnp.mjs
 */

/** @typedef {'stored'|'named'|'unknown'} Basis */

/**
 * @typedef {{
 *   receiptId: string|null,
 *   requestId: any,
 *   actor: string|null,
 *   effect: string|null,
 *   storedThreadId: string|null,
 *   threadId: string|null,
 *   basis: Basis,
 *   outcomeEffect: string|null,
 *   evidenceState: string|null,
 *   joinable: boolean,
 * }} EvidenceRecord
 */

/**
 * A thread id that names a tab or a fresh conversation rather than a conversation.
 * A missing id is a placeholder too: there is nothing to resolve either way.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPlaceholderThread(value) {
  if (value === null || value === undefined) return true;
  const id = String(value).trim();
  if (!id) return true;
  return /live-tab$/i.test(id) || /^(new|t\d+)$/i.test(id) || /-new$/i.test(id);
}

/**
 * Join receipts to their outcomes and decisions.
 *
 * `receipts` are ledger documents (`{receiptId, requestId, actor:{id}, effect, thread:{after,before}}`),
 * or rows already flattened to `{storedThreadId}`. `outcomes` are documents carrying a `requestId`;
 * that field is the whole match. `decisions` are documents carrying `decisionId`, `effect`, `kind`
 * and `decidedAt`.
 *
 * `registry` is optional and needs only `.get(receiptId)` returning `{nid}` or a name string. It is
 * consulted only when the stored thread id is a placeholder or missing, so a real id is never
 * overwritten. With no registry, or one that fails, the record is `basis: 'unknown'` rather than an
 * exception.
 *
 * @param {{
 *   receipts?: any[],
 *   outcomes?: any[],
 *   decisions?: any[],
 *   registry?: {get: (key: string) => any} | null,
 * }} [input]
 * @returns {{
 *   records: EvidenceRecord[],
 *   decisions: {id: string|null, effect: string|null, kind: string|null, at: string|null}[],
 *   summary: {receipts: number, joinable: number, decisions: number, stored: number, named: number, unknown: number},
 * }}
 */
export function joinEvidence({ receipts = [], outcomes = [], decisions = [], registry = null } = {}) {
  const receiptList = Array.isArray(receipts) ? receipts : [];
  const outcomeList = Array.isArray(outcomes) ? outcomes : [];
  const decisionList = Array.isArray(decisions) ? decisions : [];

  // The only join key. An outcome without a requestId joins nothing; two outcomes naming
  // one request keep the last one, which is the order the caller read the ledger in.
  /** @type {Map<any, any>} */
  const outcomeByRequest = new Map();
  for (const doc of outcomeList) {
    const requestId = doc?.requestId;
```

_First 80 of 362 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
