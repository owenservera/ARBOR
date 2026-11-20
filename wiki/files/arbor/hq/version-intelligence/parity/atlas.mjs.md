# File: hq/version-intelligence/parity/atlas.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/parity/atlas.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8781 B |
| Lines | 146 |
| Hash | 2d22c4ae5b4f |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ATLAS_SCHEMA | const | 8 | yes | export const ATLAS_SCHEMA = &#39;arbor.hvi.parity-atlas/1&#39;; |
| SOURCE_STATES | const | 9 | yes | export const SOURCE_STATES = Object.freeze([&#39;EXACT_BLOB&#39;, &#39;SAME_PATH_CHANGED&#39;, &#39;EXACT_RELOCATION&#39;, &#39;MISSING_AT_TARGET&#39;, &#39;UNOBSERVABLE&#39;]); |
| CAPABILITY_STATES | const | 11 | yes | export const CAPABILITY_STATES = Object.freeze([&#39;UNKNOWN&#39;,&#39;PRESENT_EQUIVALENT_CONFIRMED&#39;, &#39;PRESENT_CHANGED&#39;,&#39;IMPORTED_NOT_WIRED&#39;,&#39;SOURCE_WIRED_UNVERIFIED&#39;, &#39;RUNTIME_VERIFIED&#39;,&#39;DESIGN_ONLY&#39;,&#39;RESEARCH_… |
| SHA | const | 14 | no | const SHA = /^[0-9a-f]{40}$/; |
| REPO | const | 15 | no | const REPO = /^[A-Za-z0-9_.-]+\\/[A-Za-z0-9_.-]+$/; |
| SECRET | const | 16 | no | const SECRET = /^(?:\\.env.*\|.*\\.env\|.*\\.pem\|.*\\.p12\|.*\\.keystore\|session\\.json\|storage-state\\.json\|release-profile\\.json\|cookies\|login data)$/i; |
| MAX_ENTRIES | const | 17 | no | const MAX_ENTRIES = 10000; |
| MAX_EVIDENCE | const | 18 | no | const MAX_EVIDENCE = 10000; |
| fail | function | 19 | no | function fail(code) { throw new Error(&#39;HVI_PARITY_&#39; + code); } |
| safePath | function | 20 | no | function safePath(path) { |
| parts | const | 24 | no | const parts = path.split(&#39;/&#39;); |
| pin | function | 28 | no | function pin(source) { |
| manifest | function | 34 | no | function manifest(source) { |
| p | const | 35 | no | const p = pin(source); |
| found | const | 37 | no | const found = new Map(); |
| path | const | 39 | no | const path = safePath(entry?.path); |
| canonical | function | 46 | no | function canonical(value) { |
| digest | function | 52 | no | function digest(value) { return createHash(&#39;sha256&#39;).update(JSON.stringify(canonical(value))).digest(&#39;hex&#39;); } |
| sourceKey | function | 53 | no | function sourceKey(ref) { return ref.repo + &#39;@&#39; + ref.commitSha + &#39;:&#39; + ref.path; } |
| sourceMatches | function | 54 | no | function sourceMatches(ref, entry, p) { |
| indexEvidence | function | 58 | no | function indexEvidence(evidence) { |
| map | const | 60 | no | const map = new Map(); |
| ownerFor | function | 74 | no | function ownerFor(path, owners) { |
| acceptDecision | function | 77 | no | function acceptDecision(path, owners, decisions, evidence) { |
| row | const | 78 | no | const row = decisions.filter(x=&gt;x.path===path); |
| d | const | 81 | no | const d=row[0]; |
| buildParityAtlas | function | 96 | yes | export function buildParityAtlas(input={}) { |
| donor | const | 97 | no | const donor=manifest(input.donor), target=manifest(input.target); |
| evidence | const | 101 | no | const evidence=indexEvidence(input.sourceEvidence??[]); |
| targetByPath | const | 102 | no | const targetByPath=new Map(target.entries.map(e=&gt;[e.path,e])); |
| targetByBlob | const | 103 | no | const targetByBlob=new Map(); |
| rows | const | 105 | no | const rows=[]; |
| found | const | 107 | no | const found=targetByPath.get(entry.path); |
| relocated | const | 108 | no | const relocated=targetByBlob.get(entry.blobSha)?.[0]??null; |
| same | const | 109 | no | const same=found?.blobSha===entry.blobSha; |
| sourceState | const | 110 | no | const sourceState=same?&#39;EXACT_BLOB&#39;:found?&#39;SAME_PATH_CHANGED&#39;: |
| targetEntries | const | 112 | no | const targetEntries=found?[found]:(relocated?[relocated]:[]); |
| inspected | const | 113 | no | const inspected=[...evidence.values()].filter(e=&gt; [&#39;source_symbol&#39;,&#39;source_blob&#39;,&#39;contract&#39;].includes(e.kind) &amp;&amp; e.inspected===true &amp;&amp; sourceMatches(e.source,entry,donor)); |
| d | const | 116 | no | const d=acceptDecision(entry.path,input.owners??[],input.ownerDecisions??[],evidence); |
| capabilityState | variable | 117 | no | let capabilityState=d?.state??&#39;UNKNOWN&#39;; |
| evidenceIds | const | 124 | no | const evidenceIds=[...new Set([...inspected.map(x=&gt;x.id),...(d?.evidenceIds??[])])].sort(); |
| inspected | const | 138 | no | const inspected=rows.filter(x=&gt;x.inspected).length; |
| counts | const | 139 | no | const counts=Object.fromEntries(SOURCE_STATES.map(s=&gt;[s,rows.filter(r=&gt;r.source_state===s).length])); |
| body | const | 140 | no | const body={schema:ATLAS_SCHEMA,donorPin:{repo:donor.repo,sha:donor.commitSha,completeness:donor.completeness}, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 6 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/version-intelligence/integration/parity-evidence-adapter.mjs](../integration/parity-evidence-adapter.mjs.md) | ../parity/atlas.mjs |
| [hq/version-intelligence/parity/atlas.test.mjs](./atlas.test.mjs.md) | ./atlas.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * ARBOR HVI Lane D — pure source/capability parity projection.
 * Inputs are already-acquired pinned manifests, not live refs or filesystem paths.
 * No I/O, store, graph mutation, scheduler, permission grant or effect execution.
 */
import { createHash } from 'node:crypto';

export const ATLAS_SCHEMA = 'arbor.hvi.parity-atlas/1';
export const SOURCE_STATES = Object.freeze(['EXACT_BLOB', 'SAME_PATH_CHANGED',
  'EXACT_RELOCATION', 'MISSING_AT_TARGET', 'UNOBSERVABLE']);
export const CAPABILITY_STATES = Object.freeze(['UNKNOWN','PRESENT_EQUIVALENT_CONFIRMED',
  'PRESENT_CHANGED','IMPORTED_NOT_WIRED','SOURCE_WIRED_UNVERIFIED',
  'RUNTIME_VERIFIED','DESIGN_ONLY','RESEARCH_IMPLEMENTED','INTENTIONALLY_EXCLUDED','BLOCKED']);
const SHA = /^[0-9a-f]{40}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SECRET = /^(?:\.env.*|.*\.env|.*\.pem|.*\.p12|.*\.keystore|session\.json|storage-state\.json|release-profile\.json|cookies|login data)$/i;
const MAX_ENTRIES = 10000;
const MAX_EVIDENCE = 10000;
function fail(code) { throw new Error('HVI_PARITY_' + code); }
function safePath(path) {
  if (typeof path !== 'string' || !path.length || path.length > 1024
    || path.includes('\\') || path.startsWith('/') || /[\x00-\x1f]/.test(path)
    || /[?#]/.test(path)) fail('SCOPE_ESCAPE');
  const parts = path.split('/');
  if (parts.some(p => !p || p === '.' || p === '..' || SECRET.test(p))) fail('SCOPE_ESCAPE');
  return path;
}
function pin(source) {
  if (!source || !REPO.test(source.repo) || !SHA.test(source.commitSha)
      || !['complete','partial','blocked','missing'].includes(source.completeness)) fail('INVALID_PIN');
  if (source.scope !== 'development') fail('SOURCE_UNAUTHORIZED');
  return { repo: source.repo, commitSha: source.commitSha, completeness: source.completeness };
}
function manifest(source) {
  const p = pin(source);
  if (!Array.isArray(source.entries) || source.entries.length > MAX_ENTRIES) fail('RESOURCE_LIMIT');
  const found = new Map();
  for (const entry of source.entries) {
    const path = safePath(entry?.path);
    if (found.has(path)) fail('DUPLICATE_PATH');
    if (!SHA.test(entry?.blobSha)) fail('INVALID_BLOB');
    found.set(path, Object.freeze({ path, blobSha: entry.blobSha, kind: entry.kind ?? 'blob' }));
  }
  return { ...p, entries: [...found.values()].sort((a,b)=>a.path.localeCompare(b.path)) };
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,canonical(v)]));
  return value;
}
function digest(value) { return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex'); }
function sourceKey(ref) { return ref.repo + '@' + ref.commitSha + ':' + ref.path; }
function sourceMatches(ref, entry, p) {
  return Boolean(ref && ref.repo === p.repo && ref.commitSha === p.commitSha
    && ref.path === entry.path && ref.blobSha === entry.blobSha);
}
function indexEvidence(evidence) {
  if (!Array.isArray(evidence) || evidence.length > MAX_EVIDENCE) fail('RESOURCE_LIMIT');
  const map = new Map();
  for (const e of evidence) {
    if (!e || typeof e.id !== 'string' || !/^[\w.:@/-]{1,200}$/.test(e.id)
        || !['source_blob','source_symbol','contract','fixture','executed_test','host_receipt','device_receipt','owner_decision'].includes(e.kind)) fail('INVALID_EVIDENCE');
    if (map.has(e.id)) fail('DUPLICATE_EVIDENCE');
    if (e.source) {
      if (!REPO.test(e.source.repo) || !SHA.test(e.source.commitSha)
        || !SHA.test(e.source.blobSha)) fail('INVALID_EVIDENCE_SOURCE');
      safePath(e.source.path);
    }
    map.set(e.id, e);
  }
  return map;
}
function ownerFor(path, owners) {
  return owners.filter(x => x && x.path === path && typeof x.owner === 'string');
}
function acceptDecision(path, owners, decisions, evidence) {
  const row = decisions.filter(x=>x.path===path);
  if (row.length>1) fail('CONFLICTING_DECISIONS');
  if (!row.length) return null;
```

_First 80 of 147 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
