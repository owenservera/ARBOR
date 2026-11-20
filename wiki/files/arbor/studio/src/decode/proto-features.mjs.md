# File: studio/src/decode/proto-features.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/decode/proto-features.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 23743 B |
| Lines | 583 |
| Hash | a79f1f54df82 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROTO_FEATURES_VERSION | const | 46 | yes | export const PROTO_FEATURES_VERSION = 1; |
| PROTO_FEATURES_SCHEMA | const | 47 | yes | export const PROTO_FEATURES_SCHEMA = `proto-features/${PROTO_FEATURES_VERSION}`; |
| PROTO_FEATURE_DEFAULTS | const | 49 | yes | export const PROTO_FEATURE_DEFAULTS = Object.freeze( Object.assign(Object.create(null), { maxFrames: 4096, // analyzed records; further records are counted, not examined maxBytesPerFrame: 262144, // … |
| MAX_DISTINCT_REASONS | const | 61 | no | const MAX_DISTINCT_REASONS = 32; |
| VALUE_KINDS | const | 62 | no | const VALUE_KINDS = new Set([&#39;varint&#39;, &#39;fixed32&#39;, &#39;fixed64&#39;, &#39;string&#39;]); |
| resolveProtoFeatureOptions | function | 64 | yes | export function resolveProtoFeatureOptions(opts) { |
| o | const | 65 | no | const o = opts ?? {}; |
| resolved | const | 69 | no | const resolved = {}; |
| raw | const | 71 | no | const raw = o[key]; |
| newMissTracker | function | 87 | no | function newMissTracker() { |
| newPathState | function | 91 | no | function newPathState(path) { |
| createProtoFeatureExtractor | function | 119 | yes | export function createProtoFeatureExtractor(opts) { |
| o | const | 120 | no | const o = resolveProtoFeatureOptions(opts); |
| recordsSeen | variable | 123 | no | let recordsSeen = 0; |
| analyzed | variable | 124 | no | let analyzed = 0; |
| ignoredBeyondCap | variable | 125 | no | let ignoredBeyondCap = 0; |
| invalidRecords | variable | 126 | no | let invalidRecords = 0; |
| incompleteRecords | variable | 127 | no | let incompleteRecords = 0; |
| skippedOversize | variable | 128 | no | let skippedOversize = 0; |
| corruptFrames | variable | 131 | no | let corruptFrames = 0; |
| budgetFrames | variable | 132 | no | let budgetFrames = 0; // decoder maxFields abort: budget, not corruption |
| partialTopLevelEntries | variable | 133 | no | let partialTopLevelEntries = 0; |
| ambiguousEntries | variable | 134 | no | let ambiguousEntries = 0; |
| fieldsTotal | variable | 135 | no | let fieldsTotal = 0; |
| messageEntries | variable | 136 | no | let messageEntries = 0; |
| maxDepthObserved | variable | 137 | no | let maxDepthObserved = 0; |
| corruptReasons | const | 138 | no | const corruptReasons = new Map(); |
| corruptReasonOther | variable | 139 | no | let corruptReasonOther = 0; |
| framesWithPositionalPaths | variable | 140 | no | let framesWithPositionalPaths = 0; |
| atomsIdentical | variable | 143 | no | let atomsIdentical = 0; |
| identicalStreak | variable | 144 | no | let identicalStreak = 0; |
| identicalStreakMax | variable | 145 | no | let identicalStreakMax = 0; |
| structurallySame | variable | 146 | no | let structurallySame = 0; |
| changedTransitions | variable | 147 | no | let changedTransitions = 0; |
| frameShrunk | variable | 148 | no | let frameShrunk = 0; |
| frameStructureExtensions | variable | 149 | no | let frameStructureExtensions = 0; |
| frameStructureExtensionSuppressed | variable | 150 | no | let frameStructureExtensionSuppressed = 0; |
| identityInterruptions | variable | 151 | no | let identityInterruptions = 0; |
| prefixExtensions | variable | 154 | no | let prefixExtensions = 0; |
| prefixAddedChars | variable | 155 | no | let prefixAddedChars = 0; |
| prefixShrinks | variable | 156 | no | let prefixShrinks = 0; |
| prefixAttributionSuppressed | variable | 157 | no | let prefixAttributionSuppressed = 0; |
| scalarKinds | const | 160 | no | const scalarKinds = { varint: 0, fixed64: 0, fixed32: 0 }; |
| stringEntries | variable | 161 | no | let stringEntries = 0; |
| bytesEntries | variable | 162 | no | let bytesEntries = 0; |
| bytesLenTotal | variable | 163 | no | let bytesLenTotal = 0; |
| bytesLenMax | variable | 164 | no | let bytesLenMax = 0; |
| valueEqual | const | 165 | no | const valueEqual = { varint: 0, fixed64: 0, fixed32: 0, string: 0 }; |
| valueChanged | const | 166 | no | const valueChanged = { varint: 0, fixed64: 0, fixed32: 0, string: 0 }; |
| valueUnverified | variable | 167 | no | let valueUnverified = 0; |
| valueUnverifiedBy | const | 168 | no | const valueUnverifiedBy = newMissTracker(); |
| oversizeStringValues | variable | 169 | no | let oversizeStringValues = 0; |
| pathStates | const | 172 | no | const pathStates = new Map(); |
| pathStatesSkippedEntries | variable | 173 | no | let pathStatesSkippedEntries = 0; |
| retainedChars | variable | 176 | no | let retainedChars = 0; |
| retentionBudgetRefusals | variable | 177 | no | let retentionBudgetRefusals = 0; |
| prev | variable | 179 | no | let prev = null; // { structure, payload } of the last analyzed frame |
| lastObs | variable | 182 | no | let lastObs = { status: &#39;none&#39;, fields: 0, depth: 0, ambiguous: 0, identical: false, structure: &#39;none&#39;, prefixExtensions: 0, prefixAddedChars: 0 }; |
| setObs | function | 183 | no | const setObs = (status) =&gt; { lastObs = { status, fields: 0, depth: 0, ambiguous: 0, identical: false, structure: &#39;none&#39;, prefixExtensions: 0, prefixAddedChars: 0 }; }; |
| interrupt | function | 186 | no | const interrupt = () =&gt; { |
| bumpReason | function | 194 | no | const bumpReason = (reason) =&gt; { |
| countUnverifiedAt | function | 200 | no | const countUnverifiedAt = (st, reason) =&gt; { |
| breakValueAdjacency | function | 207 | no | const breakValueAdjacency = (st) =&gt; { |
| recordValue | function | 214 | no | const recordValue = (st, kind, text) =&gt; { |
| oversize | const | 215 | no | const oversize = kind === &#39;string&#39; &amp;&amp; text.length &gt; o.maxStringCharsPerPath; |
| reason | variable | 216 | no | let reason = null; |
| added | const | 239 | no | const added = text.length - st.value.length; |
| updatePathState | function | 288 | no | const updatePathState = (e) =&gt; { |
| st | variable | 289 | no | let st = pathStates.get(e.path); |
| buildStructure | function | 314 | no | const buildStructure = (flat) =&gt; { |
| out | const | 315 | no | const out = new Array(flat.length); |
| e | const | 317 | no | const e = flat[k]; |
| sameStructureAt | function | 323 | no | const sameStructureAt = (a, b) =&gt; a.path === b.path &amp;&amp; a.kind === b.kind &amp;&amp; a.len === b.len &amp;&amp; a.ambiguous === b.ambiguous; |
| analyzeFrame | function | 325 | no | const analyzeFrame = (buf) =&gt; { |
| res | const | 326 | no | const res = decodeProtobuf(buf, { maxDepth: o.maxDepth, maxFields: o.maxFields }); |
| px0 | const | 336 | no | const px0 = prefixExtensions; const pa0 = prefixAddedChars; const amb0 = ambiguousEntries; |
| rel | variable | 337 | no | let rel = &#39;first&#39;; let identical = false; |
| flat | const | 339 | no | const flat = flattenProtobuf(res.tree); |
| structure | const | 342 | no | const structure = buildStructure(flat); |
| anyPositional | variable | 343 | no | let anyPositional = false; |
| P | const | 355 | no | const P = prev.structure; |
| C | const | 356 | no | const C = structure; |
| n | const | 357 | no | const n = Math.min(P.length, C.length); |
| same | variable | 358 | no | let same = true; |
| payloadIdentical | const | 365 | no | const payloadIdentical = prev.payload.equals(buf); |
| payload | variable | 405 | no | let payload; |
| complete | variable | 406 | no | let complete = true; |
| inspectionTruncated | const | 452 | no | const inspectionTruncated = |
| paths | const | 474 | no | const paths = []; |
| inspectionTruncated | const | 494 | no | const inspectionTruncated = |
| extractProtoFeatures | function | 577 | yes | export function extractProtoFeatures(records, opts) { |
| ex | const | 578 | no | const ex = createProtoFeatureExtractor(opts); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./protobuf.mjs | import | 40 | [studio/src/decode/protobuf.mjs](./protobuf.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/decode/decoders.mjs](./decoders.mjs.md) | ./proto-features.mjs |
| [studio/src/replay/stream-role.mjs](../replay/stream-role.mjs.md) | ../decode/proto-features.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Structural feature extractor over ordered, ALREADY-DECOMPRESSED protobuf payload frames.
// Pure and deterministic: no I/O, no Date, no random, zero dependencies beyond the existing
// schema-less decoder (src/decode/protobuf.mjs). Does NOT duplicate inflate / envelope framing
// and never re-parses payload bytes; callers hand in per-stream payloads (Buffer/Uint8Array)
// or frame records {payload, complete?}.
//
// WHAT IS MEASURED:
// - STRING PREFIX OBSERVATION (per path, adjacent frames only): retained previous string at a
//   same numerically-identical, NON-positional unindexed path vs current string.
//     current.startsWith(previous) -> prefixExtensions + prefixAddedChars (cumulative counts)
//     previous.startsWith(current) -> prefixShrinks; otherwise plain valueChanged, NOT delta
//   Identical strings/frames are legitimate equal transitions, counted, never deduplicated.
//   Strictly observational: no snapshot/delta dialect, no concatenation authorization, no
//   reply/role/timestamp attribution; values are never emitted.
// - SUPPRESSION: positional identities (any [i] index segment) never get prefix attribution;
//   their textual changes stay valueChanged and the suppressed observation is counted
//   (attributionSuppressed). Cardinality/order changes to a repeated family rename [i] paths
//   entirely; unique paths are identity-stable regardless of document order. Frames whose
//   flatten contains indexed paths surface in sequence.containsPositionalPathsFrames.
// - FRAME STRUCTURE EXTENSION (frameStructureExtensions): separately-named, structure-only
//   view over the FLATTENED ENTRY LIST (paths/kinds/ambiguous, no values): the current entry
//   list strictly extends the previous one. A shape observation only, NOT a payload delta
//   claim; suppressed when the previous structure contains positional paths.
// - Ambiguity: decoder ambiguous flags (string that also parses as a ONE-field message) are
//   counted per frame and per path. DOCUMENTED LIMIT (no alternate parser): a wire-type-2
//   blob parsing as a MULTI-field message is silently classified 'message' even for printable
//   text; features reflect the tree as decoded, un-recoverable from the tree.
// - Budget honesty: frame cap / per-frame byte cap / decoder maxFields abort / path-state cap
//   / retention refusals / oversize strings are budget conditions in their own counters,
//   NEVER "corrupt", never a complete proof of absence (integrity.completeProof stays false).
//   Retention budget preventing comparison marks it unverified — never guessed.
//
// RETENTION BOUNDS (explicit, enforced; no unbounded payload history or distinct sets):
// - Per-path retained last-string budget: maxStringCharsPerPath (UTF-16 units);
//   total retained last-value chars: maxTotalRetainedChars.
// - One retained previous payload copy (<= maxBytesPerFrame) for exact identical-frame
//   detection; one retained previous structure list (paths/kinds/len, bounded by maxFields);
//   corrupt-reason histogram capped at 32 distinct + overflow.

import { decodeProtobuf, flattenProtobuf } from './protobuf.mjs';

// THE shared contract constants. The schema string and the integer version describe the same contract
// ('proto-features/<version>') and are the ONLY values consumers (stream-role coverage, scoreboard,
// tests) may compare against; nobody re-types them. A snapshot whose schema or version differs from these
// is UNSUPPORTED and must be treated conservatively (opaque), never interpreted.
export const PROTO_FEATURES_VERSION = 1;
export const PROTO_FEATURES_SCHEMA = `proto-features/${PROTO_FEATURES_VERSION}`;

export const PROTO_FEATURE_DEFAULTS = Object.freeze(
  Object.assign(Object.create(null), {
    maxFrames: 4096, // analyzed records; further records are counted, not examined
    maxBytesPerFrame: 262144, // larger payloads are skipped (budget, not corruption)
    maxPaths: 2048, // per-path state slots; extra entries only counted
    maxDepth: 6, // message nesting cap passed through to the decoder
    maxFields: 20000, // decoder field budget per frame (also bounds structure lists)
    maxStringCharsPerPath: 512, // per-path retained last-string budget in UTF-16 units
    maxTotalRetainedChars: 65536, // total retained last-value chars across all paths
  }),
);

const MAX_DISTINCT_REASONS = 32;
const VALUE_KINDS = new Set(['varint', 'fixed32', 'fixed64', 'string']);

export function resolveProtoFeatureOptions(opts) {
  const o = opts ?? {};
  if (typeof o !== 'object' || Array.isArray(o)) {
    throw new TypeError(`opts must be an object or omitted, got ${typeof opts}`);
  }
  const resolved = {};
  for (const key of Object.keys(PROTO_FEATURE_DEFAULTS)) {
    const raw = o[key];
    if (raw === undefined) {
      resolved[key] = PROTO_FEATURE_DEFAULTS[key];
      continue;
    }
    if (typeof raw !== 'number' || !Number.isInteger(raw) || !Number.isFinite(raw) || raw < 1) {
      throw new TypeError(`option ${key} must be a finite positive integer, got ${String(raw)}`);
    }
    resolved[key] = raw;
  }
```

_First 80 of 584 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
