# File: studio/src/studio/integration-hub.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/integration-hub.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 55644 B |
| Lines | 574 |
| Hash | 0074b82e20c5 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| str | const | 34 | no | const str = { type: &#39;string&#39; }; |
| pagination | const | 35 | no | const pagination = { offset: { type: &#39;integer&#39;, minimum: 0, maximum: 1000000 }, limit: { type: &#39;integer&#39;, minimum: 1, maximum: 1000 } }; |
| timeQuery | const | 36 | no | const timeQuery = { at: { description: &#39;Epoch milliseconds or ISO timestamp&#39;, type: [&#39;string&#39;, &#39;number&#39;] } }; |
| sessionQuery | const | 37 | no | const sessionQuery = { ...pagination, site: str, origin: str, status: str, profile: str, q: str }; |
| objectSchema | function | 38 | no | const objectSchema = (properties = {}, required = []) =&gt; ({ type: &#39;object&#39;, properties, ...(required.length ? { required } : {}) }); |
| KNOWLEDGE_STATUS_SCHEMA | const | 40 | yes | export const KNOWLEDGE_STATUS_SCHEMA = &#39;capture-studio.knowledge-status/1&#39;; |
| knowledgeView | function | 45 | yes | export function knowledgeView(s) { |
| outcome | const | 46 | no | const outcome = s.kv.get(&#39;KNOWLEDGE_STATUS&#39;, null); |
| model | const | 47 | no | const model = s.kv.get(&#39;MODEL&#39;, null); |
| createIntegrationHub | function | 56 | yes | export function createIntegrationHub({ paths, profileStore, learner, recorder, conversationRuntime, harnessApi, deriveSession, previewRecord, previewEvent, getPort, getAccessMode = () =&gt; &#39;local&#39;, cdp… |
| feed | const | 57 | no | const feed = new EventFeed(); |
| webhooks | const | 58 | no | const webhooks = new Webhooks(feed, { forbiddenPorts: () =&gt; [getPort(), cdpPort] }); |
| routes | const | 59 | no | const routes = []; |
| listeners | const | 60 | no | const listeners = []; |
| on | function | 61 | no | const on = (event, fn) =&gt; { recorder.on(event, fn); listeners.push([event, fn]); }; |
| publish | function | 62 | no | const publish = (type, data, session = recorder.session?.id ?? null) =&gt; feed.publish(type, data, session); |
| sessionOf | function | 70 | no | const sessionOf = (id = &#39;latest&#39;) =&gt; { |
| savedOnly | function | 79 | no | const savedOnly = (s) =&gt; { |
| knowledge | function | 83 | no | const knowledge = (s) =&gt; knowledgeView(s); |
| graphOf | function | 84 | no | const graphOf = (s, at) =&gt; { |
| stored | const | 86 | no | const stored = s.kv.get(&#39;GRAPH&#39;, null); |
| graph | const | 89 | no | const graph = new TemporalGraph(); |
| state | const | 92 | no | const state = graph.stateAt(at); |
| types | const | 93 | no | const types = new Map((stored.nodes ?? []).map((n) =&gt; [n.eid, n.type])); |
| datasetsOf | function | 96 | no | const datasetsOf = (s) =&gt; { |
| dir | const | 97 | no | const dir = path.join(s.dir, &#39;datasets&#39;); |
| selectedSessions | function | 100 | no | const selectedSessions = (q) =&gt; listSessions(paths.sessions).filter((s) =&gt; (!q.site \|\| siteFromSession(s) === q.site) &amp;&amp; (!q.origin \|\| originFromSession(s) === q.origin) &amp;&amp; (!q.status \|\| s.status ===… |
| profileFor | function | 104 | no | const profileFor = (s) =&gt; s.kv.get(&#39;PROFILE_SNAPSHOT&#39;) ?? profileStore.load(s.meta.profile?.name ?? &#39;generic&#39;); |
| originOfSession | function | 107 | no | const originOfSession = (s) =&gt; { try { return new URL(s.kv.get(&#39;RECEIPT&#39;, null)?.pageUrl ?? s.meta?.target?.url ?? &#39;&#39;).origin; } catch { return null; } }; |
| resolveSessions | function | 108 | no | const resolveSessions = (ids) =&gt; (Array.isArray(ids) ? ids : []).map((id) =&gt; { if (typeof id !== &#39;string&#39; \|\| !id.length) throw problem(400, &#39;sessionIds must be non-empty strings&#39;); const s = sessionO… |
| s | const | 110 | no | const s = sessionOf(id); savedOnly(s); |
| factoryCall | function | 114 | no | const factoryCall = (fn) =&gt; (...args) =&gt; { |
| intelligenceCall | function | 121 | no | const intelligenceCall = (fn) =&gt; async (...args) =&gt; { |
| candidateBody | const | 124 | no | const candidateBody = { type: &#39;object&#39;, description: &#39;aion.adaptive-webapp-adapter/1 candidate as returned by synthesize&#39; }; |
| add | function | 126 | no | function add(method, routePath, summary, handler, { query = {}, body, tool, contentType = &#39;application/json&#39;, annotations, inputSchema, pathParameters = {}, successStatus = 200 } = {}) { |
| s | const | 152 | no | const s = sessionOf(p.session); |
| s | const | 157 | no | const s = sessionOf(p.session), name = storageName(p.dataset, &#39;dataset&#39;); |
| ds | const | 158 | no | const ds = s.dataset(name); |
| s | const | 165 | no | const s = sessionOf(p.session); savedOnly(s); |
| result | const | 167 | no | const result = await deriveSession(s, body.profile); |
| s | const | 173 | no | const s = sessionOf(p.session); savedOnly(s); |
| profile | variable | 174 | no | let profile = null; |
| observation | const | 176 | no | const observation = await observeSession(s, { profile, acceptance: readAcceptance(s) }); |
| s | const | 181 | no | const s = sessionOf(p.session); savedOnly(s); |
| afterSeq | const | 182 | no | const afterSeq = integer(q.afterSeq, 0, Number.MAX_SAFE_INTEGER); |
| limit | const | 183 | no | const limit = integer(q.limit, 100, 1000, 1); |
| items | const | 185 | no | const items = [], corruptRecords = []; let lastSeq = afterSeq, hasMore = false, corruptCount = 0; |
| s | const | 198 | no | const s = sessionOf(p.session); savedOnly(s); |
| at | const | 199 | no | const at = timestamp(q.at); if (at === null) throw problem(400, &#39;at is required&#39;); |
| s | const | 203 | no | const s = sessionOf(p.session); savedOnly(s); |
| at | const | 204 | no | const at = timestamp(q.at); |
| reducer | const | 205 | no | const reducer = new StreamReducer({ deltaDialect: profileFor(s)?.decode?.delta ?? &#39;auto&#39;, keepEvents: false }); |
| stream | const | 210 | no | const stream = reducer.summary().streams.find((r) =&gt; r.sid === p.sid); |
| s | const | 215 | no | const s = sessionOf(p.session), from = timestamp(q.from, &#39;from&#39;), to = timestamp(q.to, &#39;to&#39;); |
| s | const | 221 | no | const s = sessionOf(p.session), { outcome, model } = knowledge(s); |
| s | const | 225 | no | const s = sessionOf(p.session), at = timestamp(q.at); |
| ds | const | 228 | no | const ds = s.dataset(&#39;entities&#39;); |
| s | const | 233 | no | const s = sessionOf(p.session), at = timestamp(q.at), graph = graphOf(s, null); |
| node | const | 234 | no | const node = graph.nodes.find((n) =&gt; n.eid === p.eid); |
| historical | const | 236 | no | const historical = at === null ? node : graphOf(s, at).nodes.find((n) =&gt; n.eid === p.eid); |
| s | const | 242 | no | const s = sessionOf(p.session), graph = graphOf(s, timestamp(q.at)); |
| nodes | const | 243 | no | const nodes = graph.nodes.filter((n) =&gt; !q.type \|\| n.type === q.type \|\| n.typeName === q.type); |
| selected | const | 244 | no | const selected = q.type ? new Set(nodes.map((n) =&gt; n.eid)) : null; |
| edges | const | 245 | no | const edges = graph.edges.filter((e) =&gt; (!q.kind \|\| e.kind === q.kind) &amp;&amp; (!q.status \|\| e.status === q.status) &amp;&amp; (!selected \|\| selected.has(e.from) \|\| selected.has(e.to))); |
| s | const | 249 | no | const s = sessionOf(p.session), graph = graphOf(s, timestamp(q.at)); |
| depth | const | 250 | no | const depth = integer(q.depth, 1, 4, 1), limit = integer(q.limit, 100, 1000, 1); |
| direction | const | 251 | no | const direction = q.direction ?? &#39;both&#39;; |
| seen | const | 254 | no | const seen = new Set([p.eid]), edges = new Map(); let frontier = [p.eid], truncated = false; |
| next | const | 256 | no | const next = [], current = new Set(frontier); |
| target | const | 259 | no | const target = direction !== &#39;in&#39; &amp;&amp; current.has(e.from) ? e.to : direction !== &#39;out&#39; &amp;&amp; current.has(e.to) ? e.from : null; |
| nodes | const | 267 | no | const nodes = graph.nodes.filter((n) =&gt; seen.has(n.eid)); |
| known | const | 268 | no | const known = new Set(nodes.map((n) =&gt; n.eid)); |
| s | const | 272 | no | const s = sessionOf(p.session), site = siteFromSession(s.meta), origin = originFromSession(s.meta); |
| at | const | 274 | no | const at = timestamp(q.at), limit = integer(q.limit, 50, 1000, 1); |
| capabilities | const | 278 | no | const capabilities = registerCapabilities({ add, paths, recorder, profileStore, sessionOf, savedOnly, profileFor, selectedSessions, publish, deriving, invalidateReplay }); |
| html | const | 281 | no | const html = readFileSync(new URL(&#39;./ui/live.html&#39;, import.meta.url), &#39;utf8&#39;); |
| learnerDir | const | 286 | no | const learnerDir = paths.learner ?? path.join(paths.root, &#39;learner&#39;); |
| readLearner | function | 287 | no | const readLearner = () =&gt; new ScopedLearner(learnerDir); |
| mutate | function | 288 | no | const mutate = (body, operation, { savesItself = false } = {}) =&gt; { |
| expected | const | 290 | no | const expected = integer(body.expectedRevision, undefined, Number.MAX_SAFE_INTEGER); |
| local | const | 292 | no | const local = readLearner(); |
| result | variable | 294 | no | let result; |
| local | const | 302 | no | const local = readLearner(); |
| local | const | 307 | no | const local = readLearner(); |
| local | const | 311 | no | const local = readLearner(); return { revision: local.revision, ...page(local.proposals.filter((p) =&gt; !q.status \|\| p.status === q.status), q) }; |
| local | const | 314 | no | const local = readLearner(); return { revision: local.revision, ...page(local.corrections, q) }; |
| local | const | 317 | no | const local = readLearner(); return { revision: local.revision, ...page(local.audit, q) }; |
| local | const | 320 | no | const local = readLearner(); return { revision: local.revision, versions: local.versions() }; |
| local | const | 323 | no | const local = readLearner(); return { revision: local.revision, items: local.promotionCandidates(integer(q.minSites, 2, 100, 2)), automaticallyApplied: false }; |
| s | const | 326 | no | const s = sessionOf(p.session), { model } = knowledge(s); |
| items | const | 327 | no | const items = (model.types ?? []).flatMap((type) =&gt; (type.fields ?? []).map((f) =&gt; ({ id: `${type.id}:${f.name}`, kind: &#39;field_role&#39;, type: type.id, name: f.name, role: f.role, entropy: f.roleEntropy… |
| revisionSchema | const | 330 | no | const revisionSchema = { type: &#39;integer&#39;, minimum: 0 }; |
| revision | const | 343 | no | const revision = integer(body.revision, undefined, Number.MAX_SAFE_INTEGER); |
| kind | const | 348 | no | const kind = text(body.kind, &#39;kind&#39;, 128); |
| priorSelectorsOf | function | 358 | no | const priorSelectorsOf = (priorName) =&gt; { |
| prior | const | 360 | no | const prior = adapterFactory?.loadRecord?.(priorName)?.candidate ?? null; |
| pick | function | 362 | no | const pick = (f) =&gt; (prior.features?.[f]?.selected?.candidate ? [prior.features[f].selected.candidate] : []); |
| liveProbesIfRequested | function | 365 | no | const liveProbesIfRequested = async (body) =&gt; { |
| pageOrigin | function | 368 | no | const pageOrigin = (() =&gt; { try { return new URL(recorder.pageUrl ?? &#39;&#39;).origin; } catch { return null; } })(); |
| sessions | const | 374 | no | const sessions = resolveSessions(body.sessionIds); |
| liveProbes | const | 375 | no | const liveProbes = await liveProbesIfRequested(body); |
| out | const | 376 | no | const out = adapterFactory.synthesize({ siteId: body.siteId, origin: body.origin, surface: body.surface, sessions, priorName: body.priorName ?? null, liveProbes }); |
| sessions | const | 385 | no | const sessions = resolveSessions(body.sessionIds); |
| sessions | const | 395 | no | const sessions = resolveSessions(body.sessionIds); |
| rec | const | 396 | no | const rec = adapterFactory.promote({ candidate: body.candidate, sessions, clientShadow: body.shadow ?? null, note: body.note ?? &#39;&#39;, expectedVersion: body.expectedVersion }); |
| entry | const | 408 | no | const entry = adapterFactory.list().find((x) =&gt; x.name === p.name); |
| adapter | const | 410 | no | const adapter = adapterFactory.loadLearned(p.name); |
| v | const | 418 | no | const v = integer(body.version, 1, Number.MAX_SAFE_INTEGER); |
| candidate | const | 430 | no | const candidate = record.candidate; |
| live | const | 431 | no | const live = q.live === &#39;1&#39; \|\| q.live === &#39;true&#39;; |
| pageOrigin | function | 434 | no | const pageOrigin = (() =&gt; { try { return new URL(recorder.pageUrl ?? &#39;&#39;).origin; } catch { return null; } })(); |
| s | const | 439 | no | const s = sessionOf(q.session); savedOnly(s); |
| sOrigin | const | 440 | no | const sOrigin = originOfSession(s); |
| a | const | 453 | no | const a = await getReadAdapter(p.id); |
| scopeBody | const | 464 | no | const scopeBody = objectSchema({ siteId: str, origin: str, surface: str, accountRef: str, training: { type: &#39;array&#39;, items: str }, heldout: { type: &#39;array&#39;, items: str }, trigger: { type: &#39;string&#39;, e… |
| readScope | function | 471 | no | const readScope = (body) =&gt; ({ siteId: body.siteId, origin: body.origin, surface: body.surface ?? &#39;chat&#39;, accountRef: body.accountRef ?? &#39;unknown&#39; }); |
| proposal | const | 475 | no | const proposal = await learningPipeline.proposeFromSessions({ scope: readScope(body), training: body.training, heldout: body.heldout, seed: body.seed ?? null, testOnly: body.testOnly === true, trigge… |
| querySchema | function | 510 | no | const querySchema = (r) =&gt; Object.fromEntries(Object.entries(r.query ?? {}).filter(([name]) =&gt; name !== &#39;required&#39;)); |
| toolsManifest | function | 511 | no | function toolsManifest() { |
| route | const | 522 | no | const route = routes.find((r) =&gt; r.tool === body.name); |
| schema | const | 524 | no | const schema = toolsManifest().tools.find((t) =&gt; t.name === body.name).inputSchema; |
| p | const | 527 | no | const p = Object.fromEntries(route.parts.filter((s) =&gt; s.startsWith(&#39;{&#39;)).map((s) =&gt; { const name = s.slice(1, -1); return [name, text(args[name], name, 512)]; })); |
| data | const | 528 | no | const data = route.contentType === &#39;text/event-stream&#39; &amp;&amp; route.method === &#39;GET&#39; |
| openapi | function | 534 | no | function openapi() { |
| spec | const | 535 | no | const spec = { openapi: &#39;3.1.0&#39;, info: { title: &#39;Capture Studio Integration API&#39;, version: VERSION, description: &#39;Local-first API v1. Default loopback mode needs no token; optional token mode accepts… |
| parameters | const | 539 | no | const parameters = [...r.parts.filter((s) =&gt; s.startsWith(&#39;{&#39;)).map((s) =&gt; ({ name: s.slice(1, -1), in: &#39;path&#39;, required: true, schema: r.pathParameters[s.slice(1, -1)] ?? str })), ...Object.entries(… |
| handle | function | 550 | no | async function handle(req, res, url, body) { |
| parts | variable | 553 | no | let parts; |
| matches | const | 556 | no | const matches = routes.filter((r) =&gt; r.parts.length === parts.length &amp;&amp; r.parts.every((v, i) =&gt; v.startsWith(&#39;{&#39;) \|\| v === parts[i])); |
| route | const | 557 | no | const route = matches.find((r) =&gt; r.method === req.method); |
| p | const | 562 | no | const p = Object.fromEntries(route.parts.flatMap((v, i) =&gt; v.startsWith(&#39;{&#39;) ? [[v.slice(1, -1), parts[i]]] : [])); |
| q | const | 563 | no | const q = Object.fromEntries(url.searchParams); |
| data | const | 564 | no | const data = await route.handler({ req, res, p, q, body: object(body) }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| ../store/session.mjs | import | 4 | [studio/src/store/session.mjs](../store/session.mjs.md) |
| ../replay/derive.mjs | import | 5 | [studio/src/replay/derive.mjs](../replay/derive.mjs.md) |
| ../shapes/observation.mjs | import | 6 | [studio/src/shapes/observation.mjs](../shapes/observation.mjs.md) |
| ../capture/acceptance.mjs | import | 7 | [studio/src/capture/acceptance.mjs](../capture/acceptance.mjs.md) |
| ../replay/reducer.mjs | import | 8 | [studio/src/replay/reducer.mjs](../replay/reducer.mjs.md) |
| ../intel/graph.mjs | import | 9 | [studio/src/intel/graph.mjs](../intel/graph.mjs.md) |
| ../intel/learn.mjs | import | 10 | [studio/src/intel/learn.mjs](../intel/learn.mjs.md) |
| ../intel/continuity.mjs | import | 11 | [studio/src/intel/continuity.mjs](../intel/continuity.mjs.md) |
| ./adapter-probes.mjs | import | 12 | [studio/src/studio/adapter-probes.mjs](./adapter-probes.mjs.md) |
| ../profiles/sites/index.mjs | import | 13 | [studio/src/profiles/sites/index.mjs](../profiles/sites/index.mjs.md) |
| ./adapter-factory-service.mjs | import | 14 | [studio/src/studio/adapter-factory-service.mjs](./adapter-factory-service.mjs.md) |
| ../store/versioned.mjs | import | 15 | [studio/src/store/versioned.mjs](../store/versioned.mjs.md) |
| ../config.mjs | import | 16 | [studio/src/config.mjs](../config.mjs.md) |
| ./event-feed.mjs | import | 17 | [studio/src/studio/event-feed.mjs](./event-feed.mjs.md) |
| ./webhooks.mjs | import | 18 | [studio/src/studio/webhooks.mjs](./webhooks.mjs.md) |
| ./capabilities.mjs | import | 19 | [studio/src/studio/capabilities.mjs](./capabilities.mjs.md) |
| ./http.mjs | import | 20 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ./conversation-tools.mjs | import | 21 | [studio/src/studio/conversation-tools.mjs](./conversation-tools.mjs.md) |
| ./harness-api.mjs | import | 22 | [studio/src/studio/harness-api.mjs](./harness-api.mjs.md) |
| ./recipe-routes.mjs | import | 23 | [studio/src/studio/recipe-routes.mjs](./recipe-routes.mjs.md) |
| ./world-service.mjs | import | 24 | [studio/src/studio/world-service.mjs](./world-service.mjs.md) |
| ./personal-agent-routes.mjs | import | 25 | [studio/src/studio/personal-agent-routes.mjs](./personal-agent-routes.mjs.md) |
| ./personal-app-routes.mjs | import | 26 | [studio/src/studio/personal-app-routes.mjs](./personal-app-routes.mjs.md) |
| ./bridge-commands.mjs | import | 27 | [studio/src/studio/bridge-commands.mjs](./bridge-commands.mjs.md) |
| ./commands.mjs | import | 28 | [studio/src/studio/commands.mjs](./commands.mjs.md) |
| ./agentic-files.mjs | import | 29 | [studio/src/studio/agentic-files.mjs](./agentic-files.mjs.md) |
| ./compare-routes.mjs | import | 30 | [studio/src/studio/compare-routes.mjs](./compare-routes.mjs.md) |
| ./orchestrator-routes.mjs | import | 31 | [studio/src/studio/orchestrator-routes.mjs](./orchestrator-routes.mjs.md) |
| ./provider-performance-routes.mjs | import | 32 | [studio/src/studio/provider-performance-routes.mjs](./provider-performance-routes.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/mcp/runtime.mjs](../mcp/runtime.mjs.md) | ../studio/integration-hub.mjs |
| [studio/src/studio/server.mjs](./server.mjs.md) | ./integration-hub.mjs |
| [studio/test/unit/consolidate-studio-src.test.mjs](../../test/unit/consolidate-studio-src.test.mjs.md) | ../../src/studio/integration-hub.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Versioned integration surface. Reuses the storage/replay/intelligence APIs; no second truth store.
import { readdirSync, existsSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Session, listSessions } from '../store/session.mjs';
import { stateAt } from '../replay/derive.mjs';
import { observeSession } from '../shapes/observation.mjs';
import { readAcceptance } from '../capture/acceptance.mjs';
import { StreamReducer } from '../replay/reducer.mjs';
import { TemporalGraph } from '../intel/graph.mjs';
import { ScopedLearner, SCOPES, ROLES, activeQuestions } from '../intel/learn.mjs';
import { buildSiteContinuity, siteFromSession, originFromSession } from '../intel/continuity.mjs';
import { transcriptFromSession, transcriptFromLivePage, probesFromLivePage } from './adapter-probes.mjs';
import { getReadAdapter, listReadAdapters } from '../profiles/sites/index.mjs';
import { AdapterFactoryError } from './adapter-factory-service.mjs';
import { validateExpectedVersion } from '../store/versioned.mjs';
import { VERSION, TOOL_ROOT } from '../config.mjs';
import { EventFeed, EVENT_TYPES } from './event-feed.mjs';
import { Webhooks } from './webhooks.mjs';
import { registerCapabilities, LIVE_EVENTS } from './capabilities.mjs';
import { problem, json, integer, text, object, storageName, timestamp, page, datasetPage, storeProblem, storeFields } from './http.mjs';
import { registerConversationTools } from './conversation-tools.mjs';
import { registerHarnessTools } from './harness-api.mjs';
import { registerRecipeRoutes } from './recipe-routes.mjs';
import { registerWorldRoutes } from './world-service.mjs';
import { registerPersonalAgentRoutes } from './personal-agent-routes.mjs';
import { registerPersonalAppRoutes } from './personal-app-routes.mjs';
import { registerBridgeRoutes } from './bridge-commands.mjs';
import { registerCommandRoutes } from './commands.mjs';
import { registerAgenticFileRoutes } from './agentic-files.mjs';
import { registerCompareRoutes } from './compare-routes.mjs';
import { registerOrchestratorRoutes } from './orchestrator-routes.mjs';
import { registerProviderPerformanceRoutes } from './provider-performance-routes.mjs';

const str = { type: 'string' };
const pagination = { offset: { type: 'integer', minimum: 0, maximum: 1000000 }, limit: { type: 'integer', minimum: 1, maximum: 1000 } };
const timeQuery = { at: { description: 'Epoch milliseconds or ISO timestamp', type: ['string', 'number'] } };
const sessionQuery = { ...pagination, site: str, origin: str, status: str, profile: str, q: str };
const objectSchema = (properties = {}, required = []) => ({ type: 'object', properties, ...(required.length ? { required } : {}) });

export const KNOWLEDGE_STATUS_SCHEMA = 'capture-studio.knowledge-status/1';
// Read guard over the ONE knowledge store: the session's own kv, written by replay/derive.mjs
// (KNOWLEDGE_STATUS + MODEL — single persistence owner). Producer -> consumer chain:
// session kv -> this guard -> graphOf and the knowledge/entities/graph/learning routes below.
// No second store, no cross-scope read; a marker from a foreign schema is refused, not consumed.
export function knowledgeView(s) {
  const outcome = s.kv.get('KNOWLEDGE_STATUS', null);
  const model = s.kv.get('MODEL', null);
  if (outcome && outcome.status !== 'complete') throw problem(409, `Knowledge is ${outcome.status}; stale derived outputs are unavailable`, 'KNOWLEDGE_UNAVAILABLE');
  if (outcome && outcome.schema !== undefined && outcome.schema !== KNOWLEDGE_STATUS_SCHEMA)
    throw problem(409, 'Knowledge status marker has an unrecognized schema; derive first', 'KNOWLEDGE_UNAVAILABLE');
  if (!model || model.error) throw problem(409, 'Session has no successful derived knowledge; derive first', 'KNOWLEDGE_UNAVAILABLE');
  return { outcome: outcome ?? { status: 'legacy-unverified' }, model,
    source: { owner: 'studio-session-kv', keys: ['KNOWLEDGE_STATUS', 'MODEL'], schema: outcome?.schema ?? null } };
}

export function createIntegrationHub({ paths, profileStore, learner, recorder, conversationRuntime, harnessApi, deriveSession, previewRecord, previewEvent, getPort, getAccessMode = () => 'local', cdpPort, deriving = new Set(), invalidateReplay = () => {}, adapterFactory = null, learningPipeline = null }) {
  const feed = new EventFeed();
  const webhooks = new Webhooks(feed, { forbiddenPorts: () => [getPort(), cdpPort] });
  const routes = [];
  const listeners = [];
  const on = (event, fn) => { recorder.on(event, fn); listeners.push([event, fn]); };
  const publish = (type, data, session = recorder.session?.id ?? null) => feed.publish(type, data, session);
  on('status', (s) => publish('status', s));
  on('started', (s) => publish('started', { id: s.id, target: recorder.session?.meta.target, profile: s.profile }, s.id));
  on('stopped', (s) => publish('stopped', { id: s.id, reason: s.reason, verify: s.verify }, s.id));
  on('warn', (e) => publish('warn', { message: String(e.message ?? e) }));
  on('record', (r) => publish('record', previewRecord(r)));
  on('event', (e) => publish('event', previewEvent(e)));

  const sessionOf = (id = 'latest') => {
    storageName(id, 'session');
    try { return Session.open(paths.sessions, id); }
    catch (e) {
      if (/matches \d+ sessions/.test(e.message)) throw problem(409, e.message, 'AMBIGUOUS_SESSION');
      if (/No session|No sessions/.test(e.message)) throw problem(404, e.message, 'NOT_FOUND');
      throw e;
    }
  };
  const savedOnly = (s) => {
    if (conversationRuntime?.isSessionActive(s.id)) throw problem(409, 'Finish conversation capture before replaying or rebuilding this session', 'SESSION_ACTIVE');
```

_First 80 of 575 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
