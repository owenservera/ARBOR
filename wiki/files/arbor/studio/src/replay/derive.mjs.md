# File: studio/src/replay/derive.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/replay/derive.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 30656 B |
| Lines | 479 |
| Hash | ff811f8e7e11 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| STREAM_DOM_JOIN_SCHEMA | const | 24 | yes | export const STREAM_DOM_JOIN_SCHEMA = &#39;capture-studio.stream-dom-join/1&#39;; |
| STREAM_ROLES_SCHEMA | export | 25 | yes | export { STREAM_ROLES_SCHEMA, STREAM_ROLE_CLASSIFIER_VERSION } |
| STREAM_ROLE_CLASSIFIER_VERSION | export | 25 | yes | export { STREAM_ROLES_SCHEMA, STREAM_ROLE_CLASSIFIER_VERSION } |
| STREAM_COMPONENTS_EVENT_CAP | const | 28 | no | const STREAM_COMPONENTS_EVENT_CAP = 20000; |
| derive | function | 30 | yes | export async function derive(session, profile, { onProgress, families, learner, joinImpl = joinStreamToDom, componentsImpl = applyStreamMap, acceptanceImpl = evaluateAcceptance, rolesImpl = buildStre… |
| knowledgeRun | const | 32 | no | const knowledgeRun = { schema: &#39;capture-studio.knowledge-status/1&#39;, |
| reducer | const | 36 | no | const reducer = new StreamReducer({ deltaDialect: profile?.decode?.delta ?? &#39;auto&#39;, keepEvents: true, maxEventsPerStream: 400 }); |
| shapes | const | 37 | no | const shapes = new ShapeInferencer(); |
| ds | const | 38 | no | const ds = { |
| rules | const | 42 | no | const rules = profile?.records ?? []; |
| recordSets | const | 43 | no | const recordSets = new Map(rules.map((r) =&gt; [r.name, session.dataset(`records-${r.name}`)])); |
| finals | const | 46 | no | const finals = new Map(rules.filter((r) =&gt; r.revisions === &#39;final&#39; &amp;&amp; r.key).map((r) =&gt; [r.name, new Map()])); |
| emit | function | 47 | no | const emit = (rule, recs) =&gt; { const f = finals.get(rule.name); if (!f) return recordSets.get(rule.name).push(recs); for (const r of recs) { const prev = f.get(r._key); f.set(r._key, { ...r, _revisio… |
| n | variable | 48 | no | let n = 0, batch = []; |
| firstSeqBySid | const | 49 | no | const firstSeqBySid = new Map(); // stream -&gt; first raw seq (orders stream messages for the join) |
| flush | function | 50 | no | const flush = () =&gt; { if (batch.length) { ds.events.push(batch); batch = []; } }; |
| siteName | variable | 52 | no | let siteName = &#39;&#39;; |
| corpus | const | 54 | no | const corpus = new CorpusCollector({ session, site: siteName }); |
| famEvents | const | 55 | no | const famEvents = {}; |
| evs | const | 58 | no | const evs = reducer.ingest(rec); |
| st | const | 61 | no | const st = reducer.streams.get(ev.sid); |
| summary | const | 74 | no | const summary = reducer.summary(); |
| domInspect | const | 80 | no | const domInspect = session.kv.get(&#39;DOM_INSPECT&#39;) ?? null; |
| domTurns | const | 81 | no | const domTurns = session.kv.get(&#39;DOM_TURNS&#39;) ?? []; |
| familyList | const | 82 | no | const familyList = families ? families.names().map((n) =&gt; families.load(n)) : []; |
| report | const | 83 | no | const report = shapes.report(reducer, { families: familyList, profile, domInspect, domTurns, calibrator: learner?.calibrator }); |
| corpusResult | const | 86 | no | const corpusResult = corpus.result(reducer); |
| familySets | const | 88 | no | const familySets = extractFamilyRecords(profile, reducer, { session, domTurns, eventRecords: famEvents }); |
| familyCounts | const | 89 | no | const familyCounts = {}; |
| assembled | const | 92 | no | const assembled = {}; |
| receipt | const | 96 | no | const receipt = buildReceipt(session, reducer, summary); |
| resetEntities | function | 105 | no | const resetEntities = () =&gt; session.dataset(&#39;entities&#39;).reset(); |
| knowledge | variable | 107 | no | let knowledge, stage = &#39;discover&#39;; |
| L | const | 109 | no | const L = learner ?? new ScopedLearner(); |
| model | const | 110 | no | const model = discoverModel(corpusResult.samples, { learner: L, ctx: { site: siteName, family: profile?.family ?? undefined }, families: familyList, patchGroups: corpusResult.patchGroups }); |
| resolutions | const | 112 | no | const resolutions = resolveModel(model); |
| entities | const | 113 | no | const entities = resolutions.flatMap((r) =&gt; r.entities); |
| subjectsAll | const | 115 | no | const subjectsAll = [...entities].sort((a, b) =&gt; b.observations - a.observations \|\| (a.eid &lt; b.eid ? -1 : 1)); |
| subjects | const | 116 | no | const subjects = subjectsAll.slice(0, 500).map((e) =&gt; ({ id: e.eid, kind: &#39;entity&#39;, attrs: e.attrs, t0: e.first, t1: e.last })); |
| blocksAll | const | 117 | no | const blocksAll = [...reducer.dom.blocks.values()].filter((b) =&gt; !b.removed &amp;&amp; (b.text?.length ?? 0) &gt;= 20); |
| elements | const | 118 | no | const elements = blocksAll.slice(-2000).map((b) =&gt; ({ id: b.id, text: b.text, firstT: b.firstT, lastT: b.lastT })); |
| renderedHyps | const | 119 | no | const renderedHyps = correlateRendered(subjects, elements); |
| actionHyps | const | 120 | no | const actionHyps = correlateActions(reducer.actions, summary.streams); |
| caps | const | 121 | no | const caps = { subjectsTotal: subjectsAll.length, subjectsUsed: subjects.length, elementsTotal: blocksAll.length, elementsUsed: elements.length }; |
| graph | const | 123 | no | const graph = buildGraph({ model, resolutions, renderedHyps, actionHyps, session }); |
| wide | const | 163 | no | const wide = await replayWide(session, profile); |
| streamDomJoin | function | 178 | no | function streamDomJoin(session, reducer, domTurnsRaw, { firstSeqBySid, joinImpl }) { |
| turns | const | 179 | no | const turns = Array.isArray(domTurnsRaw) ? domTurnsRaw : []; |
| value | variable | 180 | no | let value; |
| messages | const | 184 | no | const messages = buildStreamMessages(reducer, { firstSeqBySid }); |
| ms | const | 198 | no | const ms = value.summary.messageStatus; |
| replayWide | function | 207 | no | async function replayWide(session, profile) { |
| reducer | const | 209 | no | const reducer = new StreamReducer({ deltaDialect: profile?.decode?.delta ?? &#39;auto&#39;, keepEvents: true, maxEventsPerStream: STREAM_COMPONENTS_EVENT_CAP }); |
| streamRoles | function | 220 | no | function streamRoles(session, { rolesImpl, wide }) { |
| value | variable | 221 | no | let value; |
| streamRolesCurrent | function | 236 | yes | export function streamRolesCurrent(session) { |
| v | const | 238 | no | const v = session.kv.get(&#39;STREAM_ROLES&#39;, null); |
| streamComponents | function | 246 | no | async function streamComponents(session, profile, { componentsImpl, wide }) { |
| value | variable | 247 | no | let value; |
| reducer | const | 250 | no | const reducer = wide.reducer; |
| eventsBySid | const | 251 | no | const eventsBySid = new Map(); |
| events | const | 254 | no | const events = reducer.eventsOf(s.sid); |
| t | const | 266 | no | const t = value.totals; |
| STREAM_PREVIEW_CHARS | const | 275 | no | const STREAM_PREVIEW_CHARS = 160; |
| withStreamText | function | 276 | no | function withStreamText(links, messages) { |
| m | const | 279 | no | const m = messages[l.messageIndex]; |
| chars | const | 281 | no | const chars = Array.from(typeof m.text === &#39;string&#39; ? m.text : &#39;&#39;); |
| acceptanceLabel | function | 293 | no | async function acceptanceLabel(session, { acceptanceImpl }) { |
| previous | const | 298 | no | const previous = readAcceptance(session); |
| evaluated | const | 299 | no | const evaluated = await acceptanceImpl({ session, conversation: null }); |
| doc | const | 300 | no | const doc = reuseAcceptedContext(previous, evaluated); |
| runs | const | 304 | no | const runs = []; |
| last | const | 306 | no | const last = runs.at(-1); |
| parts | const | 310 | no | const parts = runs.map((r) =&gt; `${r.ids.length &gt; 1 ? `${r.ids[0]}-${r.ids.at(-1)}` : r.ids[0]} ${r.value}`); |
| buildReceipt | function | 319 | yes | export function buildReceipt(session, reducer, summary = reducer.summary()) { |
| m | const | 320 | no | const m = session.meta; |
| streams | const | 321 | no | const streams = summary.streams; |
| counts | const | 322 | no | const counts = summary.transportCounts; |
| kinds | const | 323 | no | const kinds = Object.keys(counts); |
| transport | const | 324 | no | const transport = kinds.includes(&#39;WEBSOCKET&#39;) &amp;&amp; kinds.some((k) =&gt; k.startsWith(&#39;HTTP_&#39;) \|\| k === &#39;EVENT_SOURCE&#39;) ? &#39;MIXED&#39; |
| armed | const | 327 | no | const armed = streams.filter((s) =&gt; s.armed === &#39;stream&#39;); |
| armedWithData | const | 328 | no | const armedWithData = armed.filter((s) =&gt; s.bytes &gt; 0); |
| armFailed | const | 329 | no | const armFailed = streams.filter((s) =&gt; s.armError); |
| streaming | const | 330 | no | const streaming = streams.filter((s) =&gt; [&#39;HTTP_SSE&#39;, &#39;HTTP_NDJSON&#39;, &#39;HTTP_STREAMED&#39;, &#39;EVENT_SOURCE&#39;, &#39;WEBSOCKET&#39;].includes(s.transport)); |
| chunks | const | 331 | no | const chunks = streams.reduce((a, s) =&gt; a + (s.chunks \|\| s.frames \|\| 0), 0); |
| bytes | const | 332 | no | const bytes = streams.reduce((a, s) =&gt; a + s.bytes, 0); |
| start | const | 333 | no | const start = reducer.run?.t ?? null; |
| firstByte | const | 334 | no | const firstByte = Math.min(...streaming.map((s) =&gt; s.firstChunkT ?? Infinity)); |
| last | const | 335 | no | const last = Math.max(...streaming.map((s) =&gt; s.endT ?? s.lastChunkT ?? -Infinity)); |
| lost | const | 336 | no | const lost = reducer.gaps.reduce((a, g) =&gt; a + (g.droppedRecords ?? 0), 0); |
| incomplete | const | 337 | no | const incomplete = streams.filter((s) =&gt; s.status === &#39;incomplete_at_stop&#39;).length; |
| verdict | const | 338 | no | const verdict = !streams.length ? &#39;BLOCKED&#39; : armedWithData.length &amp;&amp; !lost ? &#39;A1_RAW_CAPTURE_VIABLE&#39; : armedWithData.length ? &#39;A1_PARTIAL&#39; : &#39;A1_UNAVAILABLE&#39;; |
| host | variable | 339 | no | let host = &#39;&#39;; |
| listFamilyDatasets | function | 366 | no | function listFamilyDatasets(session) { |
| streamBytes | function | 373 | yes | export async function streamBytes(session, sid) { |
| parts | const | 374 | no | const parts = [], map = []; |
| offset | variable | 375 | no | let offset = 0; |
| iter | const | 376 | no | const iter = typeof session.streamRecords === &#39;function&#39; ? session.streamRecords(sid) : session.records(); |
| b | const | 380 | no | const b = Buffer.from(r.b64 ?? &#39;&#39;, &#39;base64&#39;); |
| b | const | 384 | no | const b = r.opcode === 2 ? Buffer.from(r.payload ?? &#39;&#39;, &#39;base64&#39;) : Buffer.from(r.payload ?? &#39;&#39;, &#39;utf8&#39;); |
| stateAt | function | 393 | yes | export async function stateAt(session, t, profile) { |
| reducer | const | 394 | no | const reducer = new StreamReducer({ deltaDialect: profile?.decode?.delta ?? &#39;auto&#39;, keepEvents: false }); |
| s | const | 396 | no | const s = reducer.summary(); |
| reconstructStream | function | 409 | yes | export async function reconstructStream(session, sid, { profile, dialect, limitEvents = 2000, useLocator = true, fromSeq = 0, deltaOpsLog = 200 } = {}) { |
| reducer | const | 410 | no | const reducer = new StreamReducer({ deltaDialect: dialect ?? profile?.decode?.delta ?? &#39;auto&#39;, keepEvents: true, maxEventsPerStream: limitEvents, deltaOpsLog, }); |
| iter | const | 414 | no | const iter = useLocator &amp;&amp; typeof session.streamRecords === &#39;function&#39; ? session.streamRecords(sid) : session.records(fromSeq &gt; 0 ? { fromSeq } : {}); |
| records | variable | 415 | no | let records = 0; |
| stream | const | 421 | no | const stream = reducer.summary().streams.find((s) =&gt; s.sid === sid) ?? null; |
| delta | const | 422 | no | const delta = reducer.deltaOf(sid); |
| streamText | function | 434 | yes | export async function streamText(session, sid, opts = {}) { |
| r | const | 435 | no | const r = await reconstructStream(session, sid, opts); |
| texts | const | 436 | no | const texts = r.assembled?.texts ?? []; |
| fromEvents | const | 437 | no | const fromEvents = r.events.filter((e) =&gt; typeof e.text === &#39;string&#39; &amp;&amp; e.text.length &gt; 0).map((e) =&gt; e.text); |
| search | function | 448 | yes | export async function search(sessions, query, { limit = 100 } = {}) { |
| q | const | 449 | no | const q = String(query).toLowerCase(); |
| hits | const | 450 | no | const hits = []; |
| hay | const | 453 | no | const hay = typeof ev.data === &#39;string&#39; ? ev.data : typeof ev.text === &#39;string&#39; ? ev.text : ev.json !== undefined ? JSON.stringify(ev.json) : &#39;&#39;; |
| i | const | 454 | no | const i = hay.toLowerCase().indexOf(q); |
| i | const | 458 | no | const i = (b.text ?? &#39;&#39;).toLowerCase().indexOf(q); |
| fidelityBreakdown | function | 466 | yes | export function fidelityBreakdown(reducer, summary, rawRecords) { |
| streams | const | 467 | no | const streams = summary.streams; |
| redactedStreams | const | 468 | no | const redactedStreams = streams.filter((s) =&gt; s.redactions &gt; 0); |
| protectedBy | const | 469 | no | const protectedBy = {}; |
| pausedNot | const | 471 | no | const pausedNot = (reducer.paused ?? []).reduce((a, p) =&gt; a + Object.values(p.notCaptured ?? {}).reduce((x, y) =&gt; x + y, 0), 0); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| ./reducer.mjs | import | 4 | [studio/src/replay/reducer.mjs](./reducer.mjs.md) |
| ../shapes/infer.mjs | import | 5 | [studio/src/shapes/infer.mjs](../shapes/infer.mjs.md) |
| ../shapes/extract.mjs | import | 6 | [studio/src/shapes/extract.mjs](../shapes/extract.mjs.md) |
| ../config.mjs | import | 7 | [studio/src/config.mjs](../config.mjs.md) |
| ../families/families.mjs | import | 8 | [studio/src/families/families.mjs](../families/families.mjs.md) |
| ../intel/corpus.mjs | import | 9 | [studio/src/intel/corpus.mjs](../intel/corpus.mjs.md) |
| ../profiles/profiles.mjs | import | 10 | [studio/src/profiles/profiles.mjs](../profiles/profiles.mjs.md) |
| ../intel/discover.mjs | import | 11 | [studio/src/intel/discover.mjs](../intel/discover.mjs.md) |
| ../intel/identity.mjs | import | 12 | [studio/src/intel/identity.mjs](../intel/identity.mjs.md) |
| ../intel/correlate.mjs | import | 13 | [studio/src/intel/correlate.mjs](../intel/correlate.mjs.md) |
| ../intel/graph.mjs | import | 14 | [studio/src/intel/graph.mjs](../intel/graph.mjs.md) |
| ../core/invariants.mjs | import | 15 | [studio/src/core/invariants.mjs](../core/invariants.mjs.md) |
| ../intel/learn.mjs | import | 16 | [studio/src/intel/learn.mjs](../intel/learn.mjs.md) |
| ../intel/join.mjs | import | 17 | [studio/src/intel/join.mjs](../intel/join.mjs.md) |
| ./stream-messages.mjs | import | 18 | [studio/src/replay/stream-messages.mjs](./stream-messages.mjs.md) |
| ../profiles/stream-map.mjs | import | 19 | [studio/src/profiles/stream-map.mjs](../profiles/stream-map.mjs.md) |
| ./stream-components.mjs | import | 20 | [studio/src/replay/stream-components.mjs](./stream-components.mjs.md) |
| ../capture/acceptance.mjs | import | 21 | [studio/src/capture/acceptance.mjs](../capture/acceptance.mjs.md) |
| ./stream-role.mjs | import | 22 | [studio/src/replay/stream-role.mjs](./stream-role.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/capture.mjs](../../bin/commands/capture.mjs.md) | ../../src/replay/derive.mjs |
| [studio/bin/commands/replay.mjs](../../bin/commands/replay.mjs.md) | ../../src/replay/derive.mjs |
| [studio/bin/lib/context.mjs](../../bin/lib/context.mjs.md) | ../../src/replay/derive.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/replay/derive.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/replay/derive.mjs |
| [studio/scripts/shape-atlas.mjs](../../scripts/shape-atlas.mjs.md) | ../src/replay/derive.mjs |
| [studio/src/capture/acceptance.mjs](../capture/acceptance.mjs.md) | ../replay/derive.mjs |
| [studio/src/capture/campaign.mjs](../capture/campaign.mjs.md) | ../replay/derive.mjs |
| [studio/src/mcp/runtime.mjs](../mcp/runtime.mjs.md) | ../replay/derive.mjs |
| [studio/src/mirror/index.mjs](../mirror/index.mjs.md) | ../replay/derive.mjs |
| [studio/src/replay/derive-all.mjs](./derive-all.mjs.md) | ./derive.mjs |
| [studio/src/studio/integration-hub.mjs](../studio/integration-hub.mjs.md) | ../replay/derive.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../replay/derive.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Offline reconstruction from the raw log: datasets, shapes, receipt, time travel, raw bytes.
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { StreamReducer, transportOf } from './reducer.mjs';
import { ShapeInferencer, templateUrl } from '../shapes/infer.mjs';
import { ruleMatchesEvent, extractRecords, extractFromAssembled } from '../shapes/extract.mjs';
import { collectorSourceSha } from '../config.mjs';
import { extractFamilyRecords, familyRecordsFromEvent } from '../families/families.mjs';
import { CorpusCollector } from '../intel/corpus.mjs';
import { siteOf } from '../profiles/profiles.mjs';
import { discoverModel, modelSummary } from '../intel/discover.mjs';
import { resolveModel } from '../intel/identity.mjs';
import { correlateRendered, correlateActions } from '../intel/correlate.mjs';
import { buildGraph } from '../intel/graph.mjs';
import { InvariantViolation, NSP_SCHEMA } from '../core/invariants.mjs';
import { ScopedLearner } from '../intel/learn.mjs';
import { joinStreamToDom } from '../intel/join.mjs';
import { buildStreamMessages } from './stream-messages.mjs';
import { applyStreamMap } from '../profiles/stream-map.mjs';
import { buildStreamComponents, STREAM_COMPONENTS_SCHEMA } from './stream-components.mjs';
import { evaluateAcceptance, writeAcceptance, readAcceptance, reuseAcceptedContext } from '../capture/acceptance.mjs';
import { buildStreamRoles, describeStreamRoles, STREAM_ROLES_SCHEMA, STREAM_ROLE_CLASSIFIER_VERSION } from './stream-role.mjs';

export const STREAM_DOM_JOIN_SCHEMA = 'capture-studio.stream-dom-join/1';
export { STREAM_ROLES_SCHEMA, STREAM_ROLE_CLASSIFIER_VERSION };
// Per-stream event window for the component pass: larger than the reducer's 400 so long answers
// are not cut short; any eviction is still reported as eventsOmitted.
const STREAM_COMPONENTS_EVENT_CAP = 20000;

export async function derive(session, profile, { onProgress, families, learner, joinImpl = joinStreamToDom, componentsImpl = applyStreamMap, acceptanceImpl = evaluateAcceptance, rolesImpl = buildStreamRoles } = {}) {
  // Fail closed during rebuild: old MODEL/entities must not appear to be current.
  const knowledgeRun = { schema: 'capture-studio.knowledge-status/1',
    status: 'deriving', startedAt: new Date().toISOString(), dataset: 'entities' };
  session.kv.set('KNOWLEDGE_STATUS', knowledgeRun);
  // Events kept in memory are bounded per stream (evidence + drift); the dataset keeps all of them.
  const reducer = new StreamReducer({ deltaDialect: profile?.decode?.delta ?? 'auto', keepEvents: true, maxEventsPerStream: 400 });
  const shapes = new ShapeInferencer();
  const ds = {
    events: session.dataset('events'), streams: session.dataset('streams'), timeline: session.dataset('timeline'),
  };
  for (const d of Object.values(ds)) d.reset();
  const rules = profile?.records ?? [];
  const recordSets = new Map(rules.map((r) => [r.name, session.dataset(`records-${r.name}`)]));
  for (const d of recordSets.values()) d.reset();
  // "final" revision mode keeps only the latest record per identity; "all" streams every observation.
  const finals = new Map(rules.filter((r) => r.revisions === 'final' && r.key).map((r) => [r.name, new Map()]));
  const emit = (rule, recs) => { const f = finals.get(rule.name); if (!f) return recordSets.get(rule.name).push(recs); for (const r of recs) { const prev = f.get(r._key); f.set(r._key, { ...r, _revision: (prev?._revision ?? 0) + 1 }); } };
  let n = 0, batch = [];
  const firstSeqBySid = new Map(); // stream -> first raw seq (orders stream messages for the join)
  const flush = () => { if (batch.length) { ds.events.push(batch); batch = []; } };
  // Complete-evidence collectors: fed with EVERY decoded event (not the bounded in-memory window).
  let siteName = '';
  try { siteName = siteOf(new URL(session.meta?.target?.url).hostname); } catch { /* no target url */ }
  const corpus = new CorpusCollector({ session, site: siteName });
  const famEvents = {};
  for await (const rec of session.records()) {
    if (rec.sid !== undefined && !firstSeqBySid.has(rec.sid)) firstSeqBySid.set(rec.sid, rec.seq);
    const evs = reducer.ingest(rec);
    for (const ev of evs) {
      batch.push(ev);
      const st = reducer.streams.get(ev.sid);
      corpus.addEvent(ev, st);
      for (const { dataset, record } of familyRecordsFromEvent(profile, ev, st, session)) (famEvents[dataset] ??= []).push(record);
      shapes.observeEvent(ev, st);
      for (const rule of rules) if (ruleMatchesEvent(rule, ev, st)) emit(rule, extractRecords(rule, ev, st));
    }
    if (batch.length > 500) flush();
    if (['action', 'nav', 'gap', 'run.start', 'run.end', 'lifecycle', 'done', 'fail', 'stream.armed', 'stream.arm_failed', 'ws.open', 'ws.close'].includes(rec.k)) {
      ds.timeline.push({ seq: rec.seq, t: rec.t, k: rec.k, sid: rec.sid, kind: rec.kind ?? rec.event, label: rec.target?.label, url: rec.url, reason: rec.reason, error: rec.error ?? rec.errorText });
    }
    if (++n % 5000 === 0) onProgress?.(n);
  }
  flush();
  const summary = reducer.summary();
  ds.streams.push(summary.streams.map((s) => ({ ...s, endpoint: `${s.method ?? (s.kind === 'ws' ? 'WS' : 'GET')} ${templateUrl(s.url)}` })));
  for (const rule of rules.filter((r) => r.source === 'assembled')) {
    for (const s of reducer.streams.values()) recordSets.get(rule.name).push(extractFromAssembled(rule, s._delta.doc, s));
  }
  for (const [name, f] of finals) recordSets.get(name).push([...f.values()]);
  const domInspect = session.kv.get('DOM_INSPECT') ?? null;
```

_First 80 of 480 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
