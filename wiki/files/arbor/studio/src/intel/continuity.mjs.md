# File: studio/src/intel/continuity.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/intel/continuity.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18406 B |
| Lines | 332 |
| Hash | 34eeae287edd |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| siteFromSession | function | 11 | yes | export function siteFromSession(meta = {}) { |
| host | const | 13 | no | const host = new URL(meta.target?.url).hostname.toLowerCase(); |
| originFromSession | function | 20 | yes | export function originFromSession(meta = {}) { |
| url | const | 22 | no | const url = new URL(meta.target?.url); |
| continuityTime | function | 28 | yes | export function continuityTime(value) { |
| n | const | 32 | no | const n = Number(value); |
| parsed | const | 35 | no | const parsed = Date.parse(value); |
| byTime | function | 39 | no | const byTime = (a, b) =&gt; (a.t ?? Infinity) - (b.t ?? Infinity) |
| recordRevisions | function | 45 | no | function recordRevisions(entity, sessionId, sessionCreatedAt) { |
| source | const | 46 | no | const source = Array.isArray(entity.revisions) &amp;&amp; entity.revisions.length |
| safeJoin | function | 65 | no | function safeJoin(entity, site, origin, keyField) { |
| key | const | 69 | no | const key = entity.key; |
| usableKey | const | 70 | no | const usableKey = (typeof key === &#39;string&#39; \|\| typeof key === &#39;number&#39;) |
| reviewTypeDrift | function | 80 | no | function reviewTypeDrift(records, stats) { |
| groups | const | 81 | no | const groups = new Map(); |
| k | const | 84 | no | const k = JSON.stringify([r.origin, r.keyField, r.keyType, String(r.key)]); |
| hints | const | 88 | no | const hints = []; |
| sampled | const | 93 | no | const sampled = group.slice(0, 32); |
| a | const | 96 | no | const a = sampled[i], b = sampled[j]; |
| fieldsA | const | 98 | no | const fieldsA = new Set(a.fields), fieldsB = new Set(b.fields); |
| overlapCount | const | 99 | no | const overlapCount = [...fieldsA].filter((f) =&gt; fieldsB.has(f)).length; |
| union | const | 100 | no | const union = new Set([...fieldsA, ...fieldsB]).size; |
| overlap | const | 101 | no | const overlap = union ? overlapCount / union : 0; |
| sameName | const | 102 | no | const sameName = a.typeName &amp;&amp; b.typeName &amp;&amp; a.typeName.toLowerCase() === b.typeName.toLowerCase(); |
| buildSiteContinuity | function | 125 | yes | export async function buildSiteContinuity(sessionsDir, { site, origin = null, eid = null, asOf = null, limit = 50, includeHistory = false, } = {}) { |
| requestedAt | const | 129 | no | const requestedAt = asOf === null \|\| asOf === undefined ? null : continuityTime(asOf); |
| maxReturn | const | 131 | no | const maxReturn = Number.isInteger(Number(limit)) &amp;&amp; Number(limit) &gt;= 1 |
| sessions | const | 136 | no | const sessions = listSessions(sessionsDir).filter((m) =&gt; siteFromSession(m) === site &amp;&amp; (origin === null \|\| originFromSession(m) === origin)); |
| stats | const | 138 | no | const stats = { |
| groups | const | 148 | no | const groups = new Map(); |
| session | const | 150 | no | const session = Session.open(sessionsDir, meta.id); |
| model | const | 151 | no | const model = session.kv.get(&#39;MODEL&#39;, null); |
| outcome | const | 152 | no | const outcome = session.kv.get(&#39;KNOWLEDGE_STATUS&#39;, null); |
| state | const | 153 | no | const state = outcome?.status ?? &#39;legacy&#39;; |
| incomplete | function | 154 | no | const incomplete = (reason) =&gt; { |
| dataset | const | 173 | no | const dataset = session.dataset(&#39;entities&#39;); |
| present | const | 174 | no | const present = existsSync(dataset.file); |
| sessionEntities | const | 182 | no | const sessionEntities = []; |
| input | const | 187 | no | const input = createReadStream(dataset.file, { encoding: &#39;utf8&#39; }); |
| lines | const | 188 | no | const lines = createInterface({ input, crlfDelay: Infinity }); |
| entity | const | 192 | no | const entity = JSON.parse(line); |
| createdAt | const | 211 | no | const createdAt = continuityTime(meta.createdAt); |
| origin | const | 212 | no | const origin = originFromSession(meta); |
| types | const | 213 | no | const types = new Map((model.types ?? []).map((t) =&gt; [t.id, t])); |
| eidCounts | const | 214 | no | const eidCounts = new Map(); |
| eidOccurrences | const | 216 | no | const eidOccurrences = new Map(); |
| occurrence | const | 219 | no | const occurrence = (eidOccurrences.get(e.eid) ?? 0) + 1; |
| legacyCollision | const | 221 | no | const legacyCollision = eidCounts.get(e.eid) &gt; 1; |
| typeInfo | const | 223 | no | const typeInfo = types.get(e.type); |
| keyField | const | 224 | no | const keyField = typeInfo?.key?.field ?? null; |
| joinable | const | 225 | no | const joinable = !legacyCollision &amp;&amp; safeJoin(e, site, origin, keyField); |
| keyType | const | 232 | no | const keyType = e.keyType === &#39;number&#39; \|\| e.keyType === &#39;string&#39; |
| groupKey | const | 234 | no | const groupKey = joinable |
| item | variable | 237 | no | let item = groups.get(groupKey); |
| entries | const | 261 | no | const entries = [], driftRecords = []; |
| revisions | const | 264 | no | const revisions = requestedAt === null ? item.history |
| materialize | const | 269 | no | const materialize = !eid \|\| eid === item.id \|\| eid === item.eid; |
| attrs | const | 270 | no | const attrs = {}; |
| visibleSessionIds | const | 276 | no | const visibleSessionIds = [...new Set(revisions.map((rv) =&gt; rv.session))].sort(); |
| times | const | 277 | no | const times = revisions.map((rv) =&gt; rv.t).filter((t) =&gt; t !== null); |
| result | const | 278 | no | const result = { |
| source | const | 297 | no | const source = revisions.find((r) =&gt; r.seq !== null \|\| r.domId !== null) ?? revisions[0]; |
| typeDriftHints | const | 310 | no | const typeDriftHints = reviewTypeDrift(driftRecords, stats); |
| matched | const | 311 | no | const matched = eid ? entries.filter((e) =&gt; e.id === eid \|\| e.eid === eid) : entries; |
| returned | const | 312 | no | const returned = matched.slice(0, maxReturn); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../store/session.mjs | import | 5 | [studio/src/store/session.mjs](../store/session.mjs.md) |
| node:fs | import | 6 | external |
| node:readline | import | 7 | external |
| ../profiles/profiles.mjs | import | 8 | [studio/src/profiles/profiles.mjs](../profiles/profiles.mjs.md) |
| ./history.mjs | import | 9 | [studio/src/intel/history.mjs](./history.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/knowledge.mjs](../../bin/commands/knowledge.mjs.md) | ../../src/intel/continuity.mjs |
| [studio/bin/lib/context.mjs](../../bin/lib/context.mjs.md) | ../../src/intel/continuity.mjs |
| [studio/bin/lib/util.mjs](../../bin/lib/util.mjs.md) | ../../src/intel/continuity.mjs |
| [studio/src/studio/integration-hub.mjs](../studio/integration-hub.mjs.md) | ../intel/continuity.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../intel/continuity.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Cross-session continuity: a derived, read-through knowledge view over saved session entities.
// No second mutable truth store: deleting/rederiving a session changes this view automatically.
// Only explicitly keyed identities within the same proven site/type scope are joined.
// Keyless and scope-unknown entities remain session-local to avoid false merges.
import { Session, listSessions } from '../store/session.mjs';
import { existsSync, createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { siteOf } from '../profiles/profiles.mjs';
import { foldRevision, summarizeRevisions } from './history.mjs';

export function siteFromSession(meta = {}) {
  try {
    const host = new URL(meta.target?.url).hostname.toLowerCase();
    return host ? siteOf(host) : '';
  } catch { return ''; } // A free-form session label is not a trustworthy site identity.
}

// Registrable site is a discovery grouping, not proof of a shared account/tenant.
// Exact origin is a narrower, observable boundary for automatic keyed joins.
export function originFromSession(meta = {}) {
  try {
    const url = new URL(meta.target?.url);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname
      ? url.origin : '';
  } catch { return ''; }
}

export function continuityTime(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  if (/^\d{10,13}$/.test(value)) {
    const n = Number(value);
    return value.length === 10 ? n * 1000 : n;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const byTime = (a, b) => (a.t ?? Infinity) - (b.t ?? Infinity)
  || (a.sessionCreatedAt ?? 0) - (b.sessionCreatedAt ?? 0)
  || a.session.localeCompare(b.session)
  || (a.seq ?? 0) - (b.seq ?? 0)
  || String(a.sid ?? '').localeCompare(String(b.sid ?? ''));

function recordRevisions(entity, sessionId, sessionCreatedAt) {
  const source = Array.isArray(entity.revisions) && entity.revisions.length
    ? entity.revisions
    : [{ t: entity.last ?? entity.first ?? null, seq: null, sid: null,
        changed: Object.keys(entity.attrs ?? {}), values: entity.attrs ?? {},
        provenanceBasis: 'session-final-state-only' }];
  return source.map((r) => ({
    session: sessionId,
    sessionCreatedAt,
    sid: r.sid ?? null,
    seq: r.seq ?? null,
    domId: r.domId ?? null,
    t: continuityTime(r.t),
    changed: r.changed ?? Object.keys(r.values ?? {}),
    values: r.values ?? {},
    ...(Array.isArray(r.removed) && r.removed.length ? { removed: r.removed } : {}),
    provenanceBasis: r.provenanceBasis ?? (r.values === undefined ? 'revision-values-unavailable' : 'recorded-revision'),
  }));
}

function safeJoin(entity, site, origin, keyField) {
  // The keyed resolver stringifies inferred key values. A missing field can therefore
  // appear as the literal "undefined" (or "null") and must never establish a
  // cross-session identity. Conservatively isolate ambiguous literal keys too.
  const key = entity.key;
  const usableKey = (typeof key === 'string' || typeof key === 'number')
    && String(key).trim().length > 0
    && !['undefined', 'null', 'nan'].includes(String(key).trim().toLowerCase());
  return entity.method === 'key' && usableKey && !!origin && !!keyField
    && entity.scope === site && !!entity.type && !!entity.eid;
}

// A review-only indication, never an inferred identity merge or probability.
// Require a shared origin, exact key and key-field semantics, distinct sessions,
// and materially overlapping structural fields before even surfacing a hint.
function reviewTypeDrift(records, stats) {
```

_First 80 of 333 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
