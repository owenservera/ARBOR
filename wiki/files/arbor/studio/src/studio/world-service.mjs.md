# File: studio/src/studio/world-service.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/world-service.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 22164 B |
| Lines | 299 |
| Hash | 7b443a0ac6e3 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| digest | function | 22 | no | const digest = (s) =&gt; createHash(&#39;sha256&#39;).update(s).digest(&#39;hex&#39;).slice(0, 40); |
| conversationId | function | 23 | no | const conversationId = (session) =&gt; `c-${digest(session)}`; |
| check | function | 24 | no | const check = (yes, message) =&gt; { if (!yes) throw problem(400, message, &#39;WORLD_INVALID_INPUT&#39;); }; |
| fields | function | 25 | no | const fields = (body, allowed) =&gt; { |
| title | function | 29 | no | const title = (s) =&gt; { check(typeof s === &#39;string&#39; &amp;&amp; s.trim().length &gt; 0 &amp;&amp; s.length &lt;= 300, &#39;title must contain 1..300 characters&#39;); return s.trim(); }; |
| ids | function | 30 | no | const ids = (value, prefix) =&gt; { |
| publicRecord | function | 34 | no | const publicRecord = ({ name, changeNote, ...record }) =&gt; record; |
| createWorldService | function | 37 | yes | export function createWorldService({ paths, isSessionActive = () =&gt; false }) { |
| store | const | 38 | no | const store = new VersionedStore(path.join(paths.root, &#39;world&#39;), { kind: &#39;world item&#39; }); |
| bridge | const | 39 | no | const bridge = createBridgeStore({ root: paths.root }); |
| appContent | const | 40 | no | const appContent = new VersionedStore(path.join(paths.root, &#39;personal-app-content&#39;), { kind: &#39;personal app content&#39; }); |
| load | function | 41 | no | const load = (id, kind) =&gt; { |
| value | variable | 43 | no | let value; |
| metadata | function | 48 | no | const metadata = (m) =&gt; { |
| observed | const | 49 | no | const observed = buildObservation({ session: { meta: m } }); |
| origin | variable | 50 | no | let origin = null; try { origin = new URL(m.target?.url).origin; } catch { /* no observed location */ } |
| allMetadata | function | 64 | no | const allMetadata = () =&gt; listSessions(paths.sessions, { includeRawBytes: false }).filter((m) =&gt; typeof m.id === &#39;string&#39; &amp;&amp; /^[a-z0-9][a-z0-9._-]{0,127}$/i.test(m.id)); |
| active | function | 65 | no | const active = (m, request) =&gt; [&#39;recording&#39;, &#39;stopping&#39;].includes(m.status) \|\| isSessionActive(m.id, request); |
| importedConversation | function | 66 | no | const importedConversation = (id) =&gt; { |
| conversationMetadata | function | 73 | no | const conversationMetadata = (id, request = {}) =&gt; { |
| imported | const | 75 | no | const imported = importedConversation(id); |
| m | const | 80 | no | const m = request.metadata.find((m) =&gt; conversationId(m.id) === id); |
| resolve | function | 85 | no | const resolve = (id, request = {}) =&gt; { |
| imported | const | 87 | no | const imported = importedConversation(id); if (imported) return imported; |
| m | const | 89 | no | const m = request.metadata.find((m) =&gt; conversationId(m.id) === id); |
| save | function | 94 | no | const save = (id, value, expectedVersion) =&gt; publicRecord(store.compareAndSave(id, value, { expectedVersion })); |
| list | function | 95 | no | const list = (kind, query) =&gt; { |
| names | const | 96 | no | const names = store.names(), selected = page(names.filter((id) =&gt; id.startsWith(kind === &#39;project&#39; ? &#39;p-&#39; : &#39;n-&#39;)), query); |
| service | const | 99 | no | const service = { |
| items | const | 101 | no | const items = [], failures = []; |
| names | const | 102 | no | const names = appContent.names(), selected = names.slice(0, 500); |
| content | const | 105 | no | const content = assertPersonalAppContent(appContent.load(id), id); |
| mode | const | 113 | no | const mode = q.custody ?? &#39;observed&#39;; |
| rows | const | 116 | no | const rows = request.metadata, observed = rows.filter((m) =&gt; !active(m, request)).map((m) =&gt; ({ ...metadata(m), custody: &#39;observed&#39;, importedFrom: null })); |
| imported | const | 117 | no | const imported = mode === &#39;observed&#39; ? [] : store.names().filter(importedConversationId).map(importedConversation) |
| selected | const | 120 | no | const selected = page(mode === &#39;imported&#39; ? imported : mode === &#39;all&#39; ? [...observed, ...imported] : observed, q); |
| imported | const | 125 | no | const imported = importedConversation(id); |
| localId | const | 131 | no | const localId = `${id}:turn:${index}`, source = message.source &amp;&amp; typeof message.source === &#39;object&#39; ? { ...message.source } : {}; |
| m | const | 136 | no | const m = resolve(id, request); |
| unavailable | function | 137 | no | const unavailable = (reason) =&gt; ({ ...metadata(m), messages: [], coverage: { state: &#39;unavailable&#39;, reason, fullNativeThread: &#39;unknown&#39;, acceptance: &#39;not-assessed&#39;, richContent: &#39;unavailable&#39; } }); |
| session | variable | 140 | no | let session; |
| turns | variable | 144 | no | let turns; |
| present | const | 147 | no | const present = Array.isArray(turns); |
| messages | const | 148 | no | const messages = (present ? turns : []).map((turn, index) =&gt; ({ id: `${id}:turn:${index}`, role: turn?.role ?? &#39;unknown&#39;, text: typeof turn?.text === &#39;string&#39; ? turn.text : &#39;&#39;, blocks: structuredClon… |
| cap | const | 171 | no | const cap = Number.isInteger(limit) ? Math.max(1, Math.min(limit, 100)) : 50; |
| items | const | 173 | no | const items = bridge.list({limit:200}).items.filter(r =&gt; wantedConversation === null \|\| r.conversationId === wantedConversation).slice(0,cap); |
| id | const | 188 | no | const id = `p-${randomUUID()}`; |
| old | const | 194 | no | const old = load(id, &#39;project&#39;); |
| conversationIds | const | 195 | no | const conversationIds = body.conversationIds === undefined ? old.conversationIds : ids(body.conversationIds, &#39;c&#39;); |
| noteIds | const | 196 | no | const noteIds = body.noteIds === undefined ? old.noteIds : ids(body.noteIds, &#39;n&#39;); |
| memberIds | const | 200 | no | const memberIds = body.memberIds === undefined ? old.memberIds ?? [] : relations.validateRefs(body.memberIds, old.memberIds ?? []); |
| unit | const | 219 | no | const unit = resolveNoteUnit(noteUnits(record), address); |
| old | const | 229 | no | const old = id ? load(id, &#39;note&#39;) : null; |
| blocks | const | 231 | no | const blocks = body.blocks === undefined \|\| body.blocks === null ? null : validateNoteBlocks(body.blocks); |
| derived | const | 232 | no | const derived = blocks ? noteBodyFromBlocks(blocks) : null; |
| text | const | 234 | no | const text = body.body === undefined ? derived : body.body; |
| commentsOn | const | 237 | no | const commentsOn = body.commentsOn === undefined ? old?.commentsOn ?? [] : relations.validateSelections(body.commentsOn, old?.commentsOn ?? []); |
| readControlLineage | function | 246 | no | const readControlLineage = () =&gt; { |
| plans | variable | 247 | no | let plans=[],rules=[],journalAvailable=true,rulesAvailable=true; |
| relations | const | 261 | no | const relations = createWorldRelations({ store, service, save, readControlLineage }); |
| registerWorldRoutes | function | 267 | yes | export function registerWorldRoutes({ add, paths, isSessionActive }) { |
| service | const | 268 | no | const service = createWorldService({ paths, isSessionActive }); |
| route | function | 269 | no | const route = (method, url, fn) =&gt; add(method, &#39;/world&#39; + url, &#39;Offline personal world&#39;, (args) =&gt; { try { return fn(args); } catch (e) { throw e.status ? e : storeProblem(e); } }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 1 | external |
| node:crypto | import | 2 | external |
| ../store/session.mjs | import | 3 | [studio/src/store/session.mjs](../store/session.mjs.md) |
| ./bridge-commands.mjs | import | 4 | [studio/src/studio/bridge-commands.mjs](./bridge-commands.mjs.md) |
| ./world-bootstrap.mjs | import | 5 | [studio/src/studio/world-bootstrap.mjs](./world-bootstrap.mjs.md) |
| ./world-conversation-activity.mjs | import | 6 | [studio/src/studio/world-conversation-activity.mjs](./world-conversation-activity.mjs.md) |
| ./relay-journal-correlation.mjs | import | 7 | [studio/src/studio/relay-journal-correlation.mjs](./relay-journal-correlation.mjs.md) |
| ../store/versioned.mjs | import | 8 | [studio/src/store/versioned.mjs](../store/versioned.mjs.md) |
| ./personal-app-content.mjs | import | 9 | [studio/src/studio/personal-app-content.mjs](./personal-app-content.mjs.md) |
| ./http.mjs | import | 10 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ../shapes/observation.mjs | import | 11 | [studio/src/shapes/observation.mjs](../shapes/observation.mjs.md) |
| ./world-url.mjs | import | 12 | [studio/src/studio/world-url.mjs](./world-url.mjs.md) |
| ./world-relations.mjs | import | 13 | [studio/src/studio/world-relations.mjs](./world-relations.mjs.md) |
| ./world-control-lineage.mjs | import | 14 | [studio/src/studio/world-control-lineage.mjs](./world-control-lineage.mjs.md) |
| ../../../apps/vivim-host/control/journal.mjs | import | 15 | [apps/vivim-host/control/journal.mjs](../../../apps/vivim-host/control/journal.mjs.md) |
| ../../../apps/vivim-host/control/personal-rule-store.mjs | import | 16 | [apps/vivim-host/control/personal-rule-store.mjs](../../../apps/vivim-host/control/personal-rule-store.mjs.md) |
| ../../../apps/vivim-host/control/intent-planner.mjs | import | 17 | [apps/vivim-host/control/intent-planner.mjs](../../../apps/vivim-host/control/intent-planner.mjs.md) |
| ./world-search.mjs | import | 18 | [studio/src/studio/world-search.mjs](./world-search.mjs.md) |
| ./world-transfer.mjs | import | 19 | [studio/src/studio/world-transfer.mjs](./world-transfer.mjs.md) |
| ./world-note-units.mjs | import | 20 | [studio/src/studio/world-note-units.mjs](./world-note-units.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./world-service.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { Session, listSessions } from '../store/session.mjs';
import { createBridgeStore } from './bridge-commands.mjs';
import { readWorldPersonalization } from './world-bootstrap.mjs';
import { readStudioConversationActivity } from './world-conversation-activity.mjs';
import { readRelayJournalCorrelations } from './relay-journal-correlation.mjs';
import { VersionedStore } from '../store/versioned.mjs';
import { assertPersonalAppContent } from './personal-app-content.mjs';
import { problem, storeProblem, page } from './http.mjs';
import { buildObservation } from '../shapes/observation.mjs';
import { sanitizeProviderUrl, sanitizedSource } from './world-url.mjs';
import { createWorldRelations } from './world-relations.mjs';
import { projectControlLineageSnapshot } from './world-control-lineage.mjs';
import { createControlJournal } from '../../../apps/vivim-host/control/journal.mjs';
import { createPersonalRuleStore } from '../../../apps/vivim-host/control/personal-rule-store.mjs';
import { loadControlCatalog } from '../../../apps/vivim-host/control/intent-planner.mjs';
import { registerWorldSearchRoutes } from './world-search.mjs';
import { registerWorldTransferRoutes, importedConversationId } from './world-transfer.mjs';
import { noteUnits, noteUnitAddressing, noteUnitRef, resolveNoteUnit, validateNoteBlocks, noteBodyFromBlocks } from './world-note-units.mjs';

const digest = (s) => createHash('sha256').update(s).digest('hex').slice(0, 40);
const conversationId = (session) => `c-${digest(session)}`;
const check = (yes, message) => { if (!yes) throw problem(400, message, 'WORLD_INVALID_INPUT'); };
const fields = (body, allowed) => {
  check(body && typeof body === 'object' && !Array.isArray(body), 'Object required');
  check(Object.keys(body).every((k) => allowed.includes(k)), 'Unknown field');
};
const title = (s) => { check(typeof s === 'string' && s.trim().length > 0 && s.length <= 300, 'title must contain 1..300 characters'); return s.trim(); };
const ids = (value, prefix) => {
  check(Array.isArray(value) && value.length <= 1000 && value.every((s) => typeof s === 'string' && new RegExp(`^${prefix}-[a-z0-9-]{1,60}$`).test(s)), 'Invalid member IDs');
  return [...new Set(value)];
};
const publicRecord = ({ name, changeNote, ...record }) => record;

// Only user-owned overlays live here. Messages remain projections of saved session evidence.
export function createWorldService({ paths, isSessionActive = () => false }) {
  const store = new VersionedStore(path.join(paths.root, 'world'), { kind: 'world item' });
  const bridge = createBridgeStore({ root: paths.root });
  const appContent = new VersionedStore(path.join(paths.root, 'personal-app-content'), { kind: 'personal app content' });
  const load = (id, kind) => {
    check(typeof id === 'string' && new RegExp(`^${kind === 'project' ? 'p' : 'n'}-[a-z0-9-]{1,60}$`).test(id), 'Invalid item ID');
    let value;
    try { value = store.load(id); } catch (e) { if (e.code === 'STORE_NO_SUCH_ITEM') throw problem(404, 'Item not found', 'WORLD_NOT_FOUND'); throw e; }
    if (value.kind !== kind) throw problem(404, 'Item not found', 'WORLD_NOT_FOUND');
    return value;
  };
  const metadata = (m) => {
    const observed = buildObservation({ session: { meta: m } });
    let origin = null; try { origin = new URL(m.target?.url).origin; } catch { /* no observed location */ }
    return ({ id: conversationId(m.id), sessionId: m.id, title: m.target?.title ?? m.label ?? m.id,
    status: m.status ?? 'unknown', createdAt: m.createdAt ?? null,
    identity: { nativeThreadId: observed.conversation.nativeRef, accountId: observed.account.ref,
      state: observed.conversation.nativeRef ? 'partial' : 'unknown',
      provider: { value: observed.provider, state: observed.provider ? 'source-observed' : 'unknown', basis: 'session.json/site' },
      origin: { value: origin, state: origin ? 'source-observed' : 'unknown', basis: 'session.json/target/url' },
      thread: { ...observed.conversation, state: observed.conversation.nativeRef ? 'qualified-inference' : 'unknown' },
      account: observed.account, observedAt: m.createdAt ?? null,
      qualification: 'Saved observation only; URL parsing and runtime ownership do not prove account identity or full archive identity' },
    source: { sessionId: m.id, kind: 'saved-session', providerUrl: sanitizeProviderUrl(m.target?.url ?? null) },
    identityScope: 'source-observation-alias; use world objects for durable local references' });
  };
  // World projections need metadata only, never a synchronous walk of every raw segment.
  const allMetadata = () => listSessions(paths.sessions, { includeRawBytes: false }).filter((m) => typeof m.id === 'string' && /^[a-z0-9][a-z0-9._-]{0,127}$/i.test(m.id));
  const active = (m, request) => ['recording', 'stopping'].includes(m.status) || isSessionActive(m.id, request);
  const importedConversation = (id) => {
    if (!importedConversationId(id)) return null;
    let record;
    try { record = store.load(id); } catch (e) { if (e.code === 'STORE_NO_SUCH_ITEM') return null; throw e; }
    if (record.kind !== 'conversation' || record.custody !== 'imported-snapshot') throw problem(409, 'Imported conversation record is inconsistent', 'WORLD_IMPORT_CORRUPT');
    return publicRecord(record);
  };
  const conversationMetadata = (id, request = {}) => {
    check(typeof id === 'string' && /^c-(?:[a-f0-9]{40}|i[a-f0-9]{38})$/.test(id), 'Invalid conversation ID');
    const imported = importedConversation(id);
    if (imported) return { id: imported.id, sessionId: null, title: imported.title, status: 'imported', createdAt: imported.importedFrom?.observedAt ?? null,
      identity: imported.identity, source: sanitizedSource(imported.source), identityScope: 'imported snapshot; not local capture identity',
      availability: 'imported', availabilityReason: 'IMPORTED_SNAPSHOT', custody: 'imported', importedFrom: imported.importedFrom };
    request.metadata ??= allMetadata();
    const m = request.metadata.find((m) => conversationId(m.id) === id);
```

_First 80 of 300 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
