# File: studio/src/studio/capability-index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/capability-index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6520 B |
| Lines | 148 |
| Hash | ee3b64f341ac |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CAP_STATE | const | 14 | yes | export const CAP_STATE = { N: 0, P: 1, Y: 2 }; |
| CAP_STATE_BY_CODE | const | 15 | no | const CAP_STATE_BY_CODE = Object.fromEntries(Object.entries(CAP_STATE).map(([k, v]) =&gt; [v, k])); |
| CAP_RE | const | 17 | no | const CAP_RE = /^(?:\\[\\[\|⟦)C(\\d+)\\\|(\\d+)\\\|(\\d+)\\\|(\\d+)\\\|([^\|⟧\\]]+)(?:\\]\\]\|⟧)$/; |
| encodeCapability | function | 20 | yes | export function encodeCapability({ num, domain, state, evidence = &#39;-&#39;, version = 1 }) { |
| n | const | 21 | no | const n = Number(num); |
| d | const | 22 | no | const d = Number(domain); |
| raw | const | 25 | no | const raw = String(state ?? &#39;&#39;).trim().toUpperCase(); |
| s | const | 26 | no | const s = raw in CAP_STATE ? CAP_STATE[raw] : (/^[012]$/.test(raw) ? Number(raw) : NaN); |
| ev | const | 28 | no | const ev = String(evidence ?? &#39;-&#39;).replace(/\\\|/g, &#39;/&#39;).trim() \|\| &#39;-&#39;; |
| parseCapability | function | 33 | yes | export function parseCapability(line) { |
| m | const | 34 | no | const m = CAP_RE.exec(String(line ?? &#39;&#39;).trim()); |
| version | const | 36 | no | const version = Number(m[1]); |
| state | const | 37 | no | const state = Number(m[4]); |
| parseCapabilityDoc | function | 49 | yes | export function parseCapabilityDoc(markdown) { |
| lines | const | 50 | no | const lines = String(markdown ?? &#39;&#39;).split(&#39;\\n&#39;); |
| entries | const | 51 | no | const entries = []; |
| domain | variable | 52 | no | let domain = 0; |
| domainTitle | variable | 53 | no | let domainTitle = &#39;&#39;; |
| heading | const | 55 | no | const heading = /^## (\\d+) · (.+?)\\s*$/.exec(line.trim()); |
| row | const | 61 | no | const row = /^\\\|\\s*(\\d+)\\s*\\\|\\s*(.+?)\\s*\\\|\\s*([NPY?])\\s*\\\|\\s*$/.exec(line.trim()); |
| renderCapabilityRow | function | 71 | yes | export function renderCapabilityRow(entry) { |
| renderCapabilityRows | function | 76 | yes | export function renderCapabilityRows(frames, lexicon) { |
| text | const | 79 | no | const text = lexicon.get(f.num); |
| summariseCapabilities | function | 87 | yes | export function summariseCapabilities(frames) { |
| byState | const | 88 | no | const byState = { N: 0, P: 0, Y: 0 }; |
| byDomain | const | 89 | no | const byDomain = {}; |
| EVIDENCE_OUTCOME | const | 103 | yes | export const EVIDENCE_OUTCOME = { fail: 0, partial: 1, pass: 2 }; |
| OUTCOME_BY_CODE | const | 104 | no | const OUTCOME_BY_CODE = Object.fromEntries(Object.entries(EVIDENCE_OUTCOME).map(([k, v]) =&gt; [v, k])); |
| EV_RE | const | 105 | no | const EV_RE = /^(?:\\[\\[\|⟦)E(\\d+)\\\|(\\d+)\\\|([^\|⟧\\]]+)\\\|(\\d+)\\\|([^\|⟧\\]]+)(?:\\]\\]\|⟧)$/; |
| encodeEvidence | function | 107 | yes | export function encodeEvidence({ cap, site, outcome, receipt, version = 1 }) { |
| c | const | 108 | no | const c = Number(cap); |
| raw | const | 110 | no | const raw = String(outcome ?? &#39;&#39;).trim().toLowerCase(); |
| o | const | 111 | no | const o = raw in EVIDENCE_OUTCOME ? EVIDENCE_OUTCOME[raw] : (/^[012]$/.test(raw) ? Number(raw) : NaN); |
| r | const | 113 | no | const r = String(receipt ?? &#39;&#39;).replace(/^sha256:/i, &#39;&#39;).slice(0, 8); |
| s | const | 115 | no | const s = String(site ?? &#39;&#39;).replace(/\\\|/g, &#39;/&#39;); |
| parseEvidence | function | 120 | yes | export function parseEvidence(line) { |
| m | const | 121 | no | const m = EV_RE.exec(String(line ?? &#39;&#39;).trim()); |
| outcome | const | 123 | no | const outcome = Number(m[4]); |
| deriveCapabilityState | function | 135 | yes | export function deriveCapabilityState(evidence) { |
| parsed | const | 139 | no | const parsed = evidence.map((e) =&gt; (typeof e === &#39;string&#39; ? parseEvidence(e) : e)); |
| best | variable | 140 | no | let best = 0; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./capability-index.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Capability index: encodes the 100-item channel list as frames over a lexicon. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-13 |
| 5 | see | — | docs/integration/CHANNEL-CAPABILITIES.md | docs/integration/CHANNEL-CAPABILITIES.md |
| 6 | invariant | — | — | the document is a pure function of (frames, lexicon): decode(encode(doc)) === doc. |
| 7 | invariant | — | — | a frame carries state, never prose; the prose lives once, in the lexicon. |

## Excerpt

```javascript
/**
 * @hq:context Capability index: encodes the 100-item channel list as frames over a lexicon.
 * @hq:owner atlas
 * @hq:task VC-13
 * @hq:see docs/integration/CHANNEL-CAPABILITIES.md
 * @hq:invariant the document is a pure function of (frames, lexicon): decode(encode(doc)) === doc.
 * @hq:invariant a frame carries state, never prose; the prose lives once, in the lexicon.
 */
// The list is the objective; the encoding is the superpower. A capability frame is
//   [[C1|<num>|<domain>|<state>|<evidence>]]
// where num indexes the lexicon entry (the capability sentence) and state is N/P/Y as 0/1/2.
// Determinism means the markdown table can be regenerated from frames alone — no rewriting by hand.

export const CAP_STATE = { N: 0, P: 1, Y: 2 };
const CAP_STATE_BY_CODE = Object.fromEntries(Object.entries(CAP_STATE).map(([k, v]) => [v, k]));

const CAP_RE = /^(?:\[\[|⟦)C(\d+)\|(\d+)\|(\d+)\|(\d+)\|([^|⟧\]]+)(?:\]\]|⟧)$/;

/** Encode one capability frame. `evidence` is a short ref or '-' for none. */
export function encodeCapability({ num, domain, state, evidence = '-', version = 1 }) {
  const n = Number(num);
  const d = Number(domain);
  if (!Number.isInteger(n) || n < 1) throw new Error('CAP_BAD_NUM');
  if (!Number.isInteger(d) || d < 1) throw new Error('CAP_BAD_DOMAIN');
  const raw = String(state ?? '').trim().toUpperCase();
  const s = raw in CAP_STATE ? CAP_STATE[raw] : (/^[012]$/.test(raw) ? Number(raw) : NaN);
  if (!Number.isInteger(s)) throw new Error(`CAP_BAD_STATE: "${state}"`);
  const ev = String(evidence ?? '-').replace(/\|/g, '/').trim() || '-';
  return `[[C${version}|${n}|${d}|${s}|${ev}]]`;
}

/** Parse one capability frame back into data. */
export function parseCapability(line) {
  const m = CAP_RE.exec(String(line ?? '').trim());
  if (!m) throw new Error('CAP_NOT_A_FRAME');
  const version = Number(m[1]);
  const state = Number(m[4]);
  if (!(state in CAP_STATE_BY_CODE)) throw new Error(`CAP_BAD_STATE: "${m[4]}"`);
  return {
    type: 'capability', version, num: Number(m[2]), domain: Number(m[3]),
    state, stateName: CAP_STATE_BY_CODE[state], evidence: m[5] === '-' ? null : m[5],
  };
}

/**
 * Read the markdown list into entries. Only the numbered capability rows are entries; everything
 * else in the document is structure this module must not touch.
 */
export function parseCapabilityDoc(markdown) {
  const lines = String(markdown ?? '').split('\n');
  const entries = [];
  let domain = 0;
  let domainTitle = '';
  for (const line of lines) {
    const heading = /^## (\d+) · (.+?)\s*$/.exec(line.trim());
    if (heading) {
      domain = Number(heading[1]);
      domainTitle = heading[2];
      continue;
    }
    const row = /^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*([NPY?])\s*\|\s*$/.exec(line.trim());
    if (!row) continue;
    entries.push({
      num: Number(row[1]), domain, domainTitle, text: row[2], state: row[3],
    });
  }
  return entries;
}

/** Render one markdown row, exactly as the document formats it. */
export function renderCapabilityRow(entry) {
  return `| ${entry.num} | ${entry.text} | ${entry.state} |`;
}

/** Rebuild the numbered rows of a document from frames plus the lexicon the frames index. */
export function renderCapabilityRows(frames, lexicon) {
  return frames
    .map((f) => {
      const text = lexicon.get(f.num);
      if (!text) throw new Error(`CAP_LEXICON_MISSING: ${f.num}`);
```

_First 80 of 149 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
