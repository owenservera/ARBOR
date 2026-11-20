# File: studio/src/studio/server.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/server.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 54282 B |
| Lines | 706 |
| Hash | 194609ed52e6 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| UI | const | 47 | no | const UI = new URL(&#39;./ui/index.html&#39;, import.meta.url); |
| validateAcceptanceContext | function | 51 | no | function validateAcceptanceContext(body) { |
| c | const | 56 | no | const c = body.conversation; |
| r | const | 64 | no | const r = c.completionRule; |
| b | const | 70 | no | const b = c.baseline; |
| startStudio | function | 82 | yes | export async function startStudio({ paths, profileStore, familyStore, cdpPort = 9222, port = 7878, token, lanPair = process.env.CAPTURE_STUDIO_LAN_PAIR === &#39;1&#39;, lanHost = process.env.CAPTURE_STUDIO_L… |
| publicHostList | const | 86 | no | const publicHostList = (Array.isArray(publicHosts) ? publicHosts : String(publicHosts ?? &#39;&#39;).split(&#39;,&#39;)) |
| storedTokenFile | const | 93 | no | const storedTokenFile = lanPair &amp;&amp; token === undefined ? pairingTokenPath(paths.root) : null; |
| lan | variable | 97 | no | let lan = null; |
| chosen | const | 101 | no | const chosen = pickLanAddress(lanAddresses(), lanHost); |
| bindHost | const | 105 | no | const bindHost = lanPair ? &#39;0.0.0.0&#39; : &#39;127.0.0.1&#39;; |
| conversationEvents | const | 107 | no | const conversationEvents = createConversationEvents({ runtime: conversationRuntime }); |
| conversationApi | const | 108 | no | const conversationApi = createConversationApi({ runtime: conversationRuntime, events: conversationEvents }); |
| learner | const | 110 | no | const learner = new ScopedLearner(paths.learner ?? path.join(paths.root, &#39;learner&#39;)); |
| recorder | const | 111 | no | const recorder = new Recorder({ sessionsDir: paths.sessions, profileStore, familyStore, port: cdpPort, rawOptions, learner }); |
| famOpt | const | 112 | no | const famOpt = { families: familyStore, learner }; |
| replayCache | const | 113 | no | const replayCache = new Map(); |
| reducerFor | function | 115 | no | async function reducerFor(session, profile) { |
| key | const | 116 | no | const key = session.id; |
| r | const | 118 | no | const r = new StreamReducer({ deltaDialect: profile?.decode?.delta ?? &#39;auto&#39;, keepEvents: true, maxEventsPerStream: 3000 }); |
| deriving | const | 124 | no | const deriving = new Set(); |
| deriveSession | function | 125 | no | async function deriveSession(session, profileName) { |
| profile | const | 131 | no | const profile = profileName ? profileStore.load(storageName(profileName, &#39;profile&#39;)) |
| result | const | 133 | no | const result = await derive(session, profile, famOpt); |
| intentBindings | const | 151 | no | const intentBindings = createIntentBindingStore({ dir: path.join(paths.root, &#39;intent-bindings&#39;) }); |
| harnessRuns | const | 152 | no | const harnessRuns = createHarnessRunStore({ dir: path.join(paths.root, &#39;harness-runs&#39;), toolExecutor: conversationToolExecutor(conversationRuntime), retryableTools: HARNESS_RETRYABLE_TOOLS }); |
| harnessApi | const | 153 | no | const harnessApi = createHarnessApi({ runs: harnessRuns, intentBindings, conversationRuntime }); |
| learnedStore | const | 160 | no | const learnedStore = new VersionedStore(path.join(paths.root, &#39;learned-adapters&#39;), { kind: &#39;learned adapter&#39; }); |
| adapterFactory | const | 161 | no | const adapterFactory = createAdapterFactory({ learnedStore }); |
| learningPipeline | const | 167 | no | const learningPipeline = createStudioLearningPipeline({ sessionsDir: paths.sessions, store: learnedStore }); |
| hub | const | 168 | no | const hub = createIntegrationHub({ paths, profileStore, learner, recorder, conversationRuntime, harnessApi, deriveSession, previewRecord: preview, previewEvent, getPort: () =&gt; port, getAccessMode: ()… |
| driveApi | const | 169 | no | const driveApi = createDriveApi({ dataDir: paths.root, port: cdpPort, drive, campaign }); |
| activeToken | variable | 173 | no | let activeToken = token; |
| storedTokenStamp | variable | 174 | no | let storedTokenStamp = storedTokenFile ? pairingTokenStamp(paths.root) : 0; |
| currentToken | function | 175 | no | const currentToken = () =&gt; { |
| stamp | const | 177 | no | const stamp = pairingTokenStamp(paths.root); |
| stored | const | 179 | no | const stored = readPairingToken(paths.root); |
| tokenBuf | function | 184 | no | const tokenBuf = () =&gt; Buffer.from(currentToken()); |
| authed | function | 185 | no | const authed = (req) =&gt; { |
| cookie | const | 187 | no | const cookie = /(?:^\|;\\s*)studio_token=([^;]+)/.exec(req.headers.cookie ?? &#39;&#39;)?.[1]; |
| given | const | 188 | no | const given = Buffer.from(cookie ?? req.headers[&#39;x-studio-token&#39;] ?? &#39;&#39;); |
| expected | const | 189 | no | const expected = tokenBuf(); |
| tokenMatches | function | 193 | no | const tokenMatches = (given) =&gt; { |
| buf | const | 194 | no | const buf = Buffer.from(given ?? &#39;&#39;); |
| expected | const | 195 | no | const expected = tokenBuf(); |
| hostCache | variable | 200 | no | let hostCache = { at: 0, port: null, hosts: [] }; |
| trustedHosts | function | 201 | no | const trustedHosts = () =&gt; { |
| loopback | const | 202 | no | const loopback = [`127.0.0.1:${port}`, `localhost:${port}`, ...publicHostList]; |
| companion | const | 210 | no | const companion = companionIngress({ root: paths.root, publish: (type, data, session) =&gt; hub.feed?.publish?.(type, data, session), ingestVisits:createWebMemoryCoreIngestor({root:paths.root}) }); |
| companionPath | const | 211 | no | const companionPath = &#39;/api/v1/browser-companion/events&#39;; |
| server | const | 212 | no | const server = http.createServer(async (req, res) =&gt; { try { const url = new URL(req.url, `http://127.0.0.1:${port}`); const host = (req.headers.host ?? &#39;&#39;).toLowerCase(); const trusted = trustedHost… |
| url | const | 214 | no | const url = new URL(req.url, `http://127.0.0.1:${port}`); |
| host | const | 215 | no | const host = (req.headers.host ?? &#39;&#39;).toLowerCase(); |
| trusted | const | 216 | no | const trusted = trustedHosts(); |
| raw | variable | 219 | no | let raw = &#39;&#39;; |
| body | variable | 223 | no | let body = null; |
| reply | const | 225 | no | const reply = await companion(req, { port, body }); |
| viaPublic | const | 231 | no | const viaPublic = publicHostList.includes(host); |
| script | const | 265 | no | const script = url.pathname.endsWith(&#39;.mjs&#39;); |
| file | const | 266 | no | const file = new URL(script ? &#39;./ui/drive.mjs&#39; : &#39;./ui/drive.html&#39;, import.meta.url); |
| script | const | 272 | no | const script = url.pathname.endsWith(&#39;.mjs&#39;); |
| file | const | 273 | no | const file = new URL(script ? &#39;./ui/mobile.mjs&#39; : &#39;./ui/mobile.html&#39;, import.meta.url); |
| worker | const | 289 | no | const worker = url.pathname === &#39;/mobile-sw.js&#39;; |
| script | const | 302 | no | const script = url.pathname.endsWith(&#39;.mjs&#39;); |
| file | const | 303 | no | const file = new URL(script ? &#39;./ui/personal-agent.mjs&#39; : &#39;./ui/personal-agent.html&#39;, import.meta.url); |
| script | const | 312 | no | const script = url.pathname.endsWith(&#39;.mjs&#39;); |
| CHAT_MODULES | const | 316 | no | const CHAT_MODULES = { &#39;/ui/universal-chat.mjs&#39;: &#39;./ui/universal-chat.mjs&#39;, &#39;/ui/world-view.mjs&#39;: &#39;./ui/world-view.mjs&#39;, &#39;/ui/native-bridge.mjs&#39;: &#39;./ui/native-bridge.mjs&#39; }; |
| file | const | 317 | no | const file = CHAT_MODULES[url.pathname] ?? (script ? &#39;./ui/chat.mjs&#39; : &#39;./ui/chat.html&#39;); |
| body | const | 324 | no | const body = [&#39;POST&#39;, &#39;PUT&#39;, &#39;PATCH&#39;].includes(req.method) ? await readBody(req) : {}; |
| route | function | 335 | no | async function route(req, res, url, body) { |
| p | const | 336 | no | const p = url.pathname.slice(5).split(&#39;/&#39;).map(decodeURIComponent); |
| q | const | 337 | no | const q = Object.fromEntries(url.searchParams); |
| mutating | const | 345 | no | const mutating = a === &#39;record&#39; \|\| a === &#39;chrome&#39; |
| sessionOf | function | 351 | no | const sessionOf = (id) =&gt; { |
| browser | variable | 364 | no | let browser = null, verified = false; |
| version | const | 366 | no | const version = await browserVersion({ port: cdpPort }); |
| state | const | 371 | no | const state = !browser ? &#39;not-running&#39; : verified ? &#39;available&#39; : &#39;profile-unverified&#39;; |
| r | const | 387 | no | const r = await recorder.stop({ reason: &#39;user_stop&#39; }); |
| s | const | 389 | no | const s = sessionOf(r.id); |
| dres | const | 390 | no | const dres = await deriveSession(s); |
| s | const | 411 | no | const s = sessionOf(b); |
| conversation | const | 447 | no | const conversation = validateAcceptanceContext(body); |
| previous | const | 448 | no | const previous = readAcceptance(s); |
| evaluated | const | 449 | no | const evaluated = await evaluateAcceptance({ session: s, conversation }); |
| doc | const | 450 | no | const doc = reuseAcceptedContext(previous, evaluated); |
| site | const | 458 | no | const site = siteFromSession(s.meta); |
| origin | const | 459 | no | const origin = originFromSession(s.meta); |
| max | const | 483 | no | const max = Number(q.max ?? 2 * 1024 * 1024); |
| chunks | const | 484 | no | const chunks = map.filter((m) =&gt; m.offset &lt; max).map((m) =&gt; ({ ...m, text: bytes.subarray(m.offset, Math.min(m.offset + m.length, max)).toString(&#39;utf8&#39;) })); |
| after | const | 492 | no | const after = q.after === undefined ? null : Number(q.after); |
| limit | const | 494 | no | const limit = Math.min(Math.max(Math.trunc(Number(q.limit ?? 2000)) \|\| 2000, 1), 5000); |
| out | const | 495 | no | const out = []; |
| more | variable | 496 | no | let more = false, lastSeq = null; |
| prof | const | 508 | no | const prof = profileStore.load(s.meta.profile.name); |
| asm | const | 509 | no | const asm = new DeltaAssembler(prof.decode?.delta ?? &#39;auto&#39;); |
| n | const | 510 | no | const n = Number(q.n ?? Infinity); |
| total | variable | 511 | no | let total = 0, lastSeq = null, lastT = null; |
| at | const | 517 | no | const at = new DeltaAssembler(prof.decode?.delta ?? &#39;auto&#39;); |
| cnt | variable | 518 | no | let cnt = 0, seqAt = null, tAt = null; |
| dir | const | 526 | no | const dir = mkdtempSync(path.join(os.tmpdir(), &#39;studio-export-&#39;)); |
| fmt | const | 527 | no | const fmt = q.format ?? &#39;jsonl&#39;; |
| file | const | 528 | no | const file = path.join(dir, `${s.id}-${q.dataset}.${fmt}`); |
| file | const | 534 | no | const file = path.join(mkdtempSync(path.join(os.tmpdir(), &#39;studio-export-&#39;)), `${s.id}.md`); |
| ids | const | 541 | no | const ids = q.session ? [q.session] : listSessions(paths.sessions).slice(0, Number(q.sessions ?? 20)).map((x) =&gt; x.id); |
| ds | const | 551 | no | const ds = `family-${b}-${q.entity ?? &#39;message&#39;}`; |
| out | const | 552 | no | const out = []; |
| sess | const | 554 | no | const sess = sessionOf(meta.id); |
| draft | const | 562 | no | const draft = normalizeProfile(body.profile ?? profileStore.load(body.profileName)); |
| reducer | variable | 563 | no | let reducer, domTurns; |
| records | const | 566 | no | const records = {}; |
| rows | const | 568 | no | const rows = []; |
| fam | const | 572 | no | const fam = extractFamilyRecords(draft, reducer, { session: { id: body.source?.id }, domTurns }); |
| family | const | 573 | no | const family = Object.fromEntries(Object.entries(fam).map(([k, v]) =&gt; [k, { count: v.length, sample: v.slice(-Number(body.limit ?? 30)) }])); |
| saved | const | 580 | no | const saved = profileStore.save(b, profile, note); |
| sg | const | 584 | no | const sg = body.suggestion; |
| saved | const | 599 | no | const saved = profileStore.save(b, profile, note); |
| actualPort | const | 610 | no | const actualPort = server.address().port; |
| closing | function | 616 | no | let closing; |
| close | function | 617 | no | const close = () =&gt; closing ??= (async () =&gt; { try { await conversationRuntime.close(); await driveApi.close(); if (recorder.state === &#39;recording&#39;) await recorder.stop({ reason: &#39;studio_shutdown&#39; });… |
| lanInfo | const | 621 | no | const lanInfo = lan ? { bind: bindHost, address: lan.address, addresses: lanAddresses().map((a) =&gt; a.address), get pairingUrl() { return pairingUrl({ address: lan.address, port: actualPort, token: cu… |
| listDatasets | function | 627 | no | function listDatasets(s) { |
| phoneRemovedPage | function | 633 | no | function phoneRemovedPage() { |
| send | function | 645 | no | function send(res, code, data) { |
| isStr | const | 647 | no | const isStr = typeof data === &#39;string&#39;; |
| isHtml | const | 648 | no | const isHtml = isStr &amp;&amp; /^&lt;!doctype html&gt;/i.test(data); |
| readBody | function | 657 | no | function readBody(req) { |
| n | variable | 659 | no | let n = 0, oversized = false; const parts = []; |
| body | const | 670 | no | const body = parts.length ? JSON.parse(Buffer.concat(parts).toString(&#39;utf8&#39;)) : {}; |
| preview | function | 679 | no | function preview(r) { |
| out | const | 680 | no | const out = { seq: r.seq, t: r.t, k: r.k, sid: r.sid }; |
| previewEvent | function | 700 | no | function previewEvent(e) { |
| out | const | 701 | no | const out = { ...e }; |
| cap | function | 702 | no | const cap = (s) =&gt; (typeof s === &#39;string&#39; &amp;&amp; s.length &gt; 4000 ? s.slice(0, 4000) + `… [+${s.length - 4000} chars in full record]` : s); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:http | import | 7 | external |
| node:fs | import | 8 | external |
| node:crypto | import | 9 | external |
| ./browser-companion/ingress.mjs | import | 10 | [studio/src/studio/browser-companion/ingress.mjs](./browser-companion/ingress.mjs.md) |
| ./browser-companion/web-memory-core.mjs | import | 11 | [studio/src/studio/browser-companion/web-memory-core.mjs](./browser-companion/web-memory-core.mjs.md) |
| node:os | import | 12 | external |
| node:path | import | 13 | external |
| ../capture/recorder.mjs | import | 14 | [studio/src/capture/recorder.mjs](../capture/recorder.mjs.md) |
| ../cdp/discovery.mjs | import | 15 | [studio/src/cdp/discovery.mjs](../cdp/discovery.mjs.md) |
| ../chrome/launch.mjs | import | 16 | [studio/src/chrome/launch.mjs](../chrome/launch.mjs.md) |
| ../chrome/browser-ownership.mjs | import | 17 | [studio/src/chrome/browser-ownership.mjs](../chrome/browser-ownership.mjs.md) |
| ../store/session.mjs | import | 18 | [studio/src/store/session.mjs](../store/session.mjs.md) |
| ../replay/derive.mjs | import | 19 | [studio/src/replay/derive.mjs](../replay/derive.mjs.md) |
| ../capture/acceptance.mjs | import | 20 | [studio/src/capture/acceptance.mjs](../capture/acceptance.mjs.md) |
| ../export/export.mjs | import | 21 | [studio/src/export/export.mjs](../export/export.mjs.md) |
| ../profiles/apply.mjs | import | 22 | [studio/src/profiles/apply.mjs](../profiles/apply.mjs.md) |
| ../profiles/profiles.mjs | import | 23 | [studio/src/profiles/profiles.mjs](../profiles/profiles.mjs.md) |
| ../profiles/model-ops.mjs | import | 24 | [studio/src/profiles/model-ops.mjs](../profiles/model-ops.mjs.md) |
| ../families/families.mjs | import | 25 | [studio/src/families/families.mjs](../families/families.mjs.md) |
| ../shapes/extract.mjs | import | 26 | [studio/src/shapes/extract.mjs](../shapes/extract.mjs.md) |
| ../replay/reducer.mjs | import | 27 | [studio/src/replay/reducer.mjs](../replay/reducer.mjs.md) |
| ../config.mjs | import | 28 | [studio/src/config.mjs](../config.mjs.md) |
| ../intel/learn.mjs | import | 29 | [studio/src/intel/learn.mjs](../intel/learn.mjs.md) |
| ../intel/continuity.mjs | import | 30 | [studio/src/intel/continuity.mjs](../intel/continuity.mjs.md) |
| ./integration-hub.mjs | import | 31 | [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) |
| ../store/versioned.mjs | import | 32 | [studio/src/store/versioned.mjs](../store/versioned.mjs.md) |
| ./adapter-factory-service.mjs | import | 33 | [studio/src/studio/adapter-factory-service.mjs](./adapter-factory-service.mjs.md) |
| ./adapter-learning-pipeline.mjs | import | 34 | [studio/src/studio/adapter-learning-pipeline.mjs](./adapter-learning-pipeline.mjs.md) |
| ./intent-bindings.mjs | import | 35 | [studio/src/studio/intent-bindings.mjs](./intent-bindings.mjs.md) |
| ../profiles/sites/index.mjs | import | 36 | [studio/src/profiles/sites/index.mjs](../profiles/sites/index.mjs.md) |
| ./platform-x.mjs | import | 37 | [studio/src/studio/platform-x.mjs](./platform-x.mjs.md) |
| ./http.mjs | import | 38 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ./http-encode.mjs | import | 39 | [studio/src/studio/http-encode.mjs](./http-encode.mjs.md) |
| ./drive-api.mjs | import | 40 | [studio/src/studio/drive-api.mjs](./drive-api.mjs.md) |
| ./conversation-api.mjs | import | 41 | [studio/src/studio/conversation-api.mjs](./conversation-api.mjs.md) |
| ./conversation-events.mjs | import | 42 | [studio/src/studio/conversation-events.mjs](./conversation-events.mjs.md) |
| ../capture/harness-runs.mjs | import | 43 | [studio/src/capture/harness-runs.mjs](../capture/harness-runs.mjs.md) |
| ./harness-api.mjs | import | 44 | [studio/src/studio/harness-api.mjs](./harness-api.mjs.md) |
| ./lan-pair.mjs | import | 45 | [studio/src/studio/lan-pair.mjs](./lan-pair.mjs.md) |
| ../decode/delta.mjs | dynamic | 507 | [studio/src/decode/delta.mjs](../decode/delta.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/capture.mjs](../../bin/commands/capture.mjs.md) | ../../src/studio/server.mjs |
| [studio/bin/commands/selftest.mjs](../../bin/commands/selftest.mjs.md) | ../../src/studio/server.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Studio: loopback-only local web UI + JSON API. Localhost opens without a token by default.
// Opt-in token mode retains the HttpOnly SameSite cookie; both modes keep loopback binding,
// Host and Origin checks, which need no user interaction.
// Explicit opt-in LAN pairing (`lanPair`) is the single exception to loopback binding: it binds
// 0.0.0.0, REQUIRES token mode, and widens the Host/Origin allow-list only to this machine's own
// interface addresses/hostname (never wildcard), so DNS-rebinding names are still refused.
import http from 'node:http';
import { createReadStream, mkdtempSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { companionIngress, companionState } from './browser-companion/ingress.mjs';
import { createWebMemoryCoreIngestor } from './browser-companion/web-memory-core.mjs';
import os from 'node:os';
import path from 'node:path';
import { Recorder } from '../capture/recorder.mjs';
import { listTargets, browserVersion, isReachable } from '../cdp/discovery.mjs';
import { launchChrome } from '../chrome/launch.mjs';
import { verifyBrowserOwner } from '../chrome/browser-ownership.mjs';
import { Session, listSessions } from '../store/session.mjs';
import { derive, streamBytes, stateAt, search } from '../replay/derive.mjs';
import { readAcceptance, evaluateAcceptance, writeAcceptance, reuseAcceptedContext } from '../capture/acceptance.mjs';
import { exportDataset, exportTranscript } from '../export/export.mjs';
import { applySuggestion } from '../profiles/apply.mjs';
import { profileDiff, normalizeProfile } from '../profiles/profiles.mjs';
import { applyModelOp } from '../profiles/model-ops.mjs';
import { extractFamilyRecords } from '../families/families.mjs';
import { ruleMatchesEvent, extractRecords } from '../shapes/extract.mjs';
import { StreamReducer } from '../replay/reducer.mjs';
import { VERSION } from '../config.mjs';
import { ScopedLearner } from '../intel/learn.mjs';
import { buildSiteContinuity, siteFromSession, originFromSession, continuityTime } from '../intel/continuity.mjs';
import { createIntegrationHub } from './integration-hub.mjs';
import { VersionedStore } from '../store/versioned.mjs';
import { createAdapterFactory } from './adapter-factory-service.mjs';
import { createStudioLearningPipeline } from './adapter-learning-pipeline.mjs';
import { createIntentBindingStore } from './intent-bindings.mjs';
import { setLearnedAdapterProvider } from '../profiles/sites/index.mjs';
import { handlePlatformX } from './platform-x.mjs';
import { problem, storageName, STORE_ERROR_STATUS, storeFields } from './http.mjs';
import { sendEncoded, staticFile } from './http-encode.mjs';
import { createDriveApi } from './drive-api.mjs';
import { createConversationApi, defaultConversationRuntime } from './conversation-api.mjs';
import { createConversationEvents } from './conversation-events.mjs';
import { createHarnessRunStore } from '../capture/harness-runs.mjs';
import { createHarnessApi, registerHarnessTools, conversationToolExecutor, HARNESS_RETRYABLE_TOOLS } from './harness-api.mjs';
import { lanAddresses, pickLanAddress, lanHostHeaders, pairingUrl, isCookieSafeToken, ensurePairingToken, readPairingToken, pairingTokenPath, pairingTokenStamp } from './lan-pair.mjs';

const UI = new URL('./ui/index.html', import.meta.url);

// Drive context for the explicit acceptance evaluation (POST /api/v1/sessions/{session}/acceptance).
// Bounded and closed: unknown fields are rejected so the evaluator never sees unvalidated context.
function validateAcceptanceContext(body) {
  if (body === undefined || body === null) return null;
  if (typeof body !== 'object' || Array.isArray(body)) throw problem(400, 'Body must be an object');
  if (Object.keys(body).some((k) => k !== 'conversation')) throw problem(400, 'Unexpected request field');
  if (body.conversation === undefined || body.conversation === null) return null;
  const c = body.conversation;
  if (typeof c !== 'object' || Array.isArray(c)) throw problem(400, 'conversation must be an object');
  if (Object.keys(c).some((k) => !['prompt', 'expectedReplyWords', 'completionRule', 'baseline'].includes(k))) throw problem(400, 'Unexpected conversation field');
  if (typeof c.prompt !== 'string' || !c.prompt || c.prompt.length > 250000) throw problem(400, 'conversation.prompt must be a nonempty string of at most 250000 characters');
  if (c.expectedReplyWords !== undefined
    && (!Array.isArray(c.expectedReplyWords) || c.expectedReplyWords.length > 50
      || c.expectedReplyWords.some((w) => typeof w !== 'string' || !w || w.length > 1000))) throw problem(400, 'expectedReplyWords must be at most 50 nonempty strings of at most 1000 characters');
  if (c.completionRule !== undefined) {
    const r = c.completionRule;
    if (!r || typeof r !== 'object' || Array.isArray(r) || typeof r.stableObserved !== 'boolean'
      || (r.requireDone !== undefined && typeof r.requireDone !== 'boolean')
      || Object.keys(r).some((k) => !['stableObserved', 'requireDone'].includes(k))) throw problem(400, 'completionRule must be { stableObserved: boolean, requireDone?: boolean }');
  }
  if (c.baseline !== undefined && c.baseline !== null) {
    const b = c.baseline;
    if (!b || typeof b !== 'object' || Array.isArray(b)
      || !Number.isSafeInteger(b.userTurns) || b.userTurns < 0
      || !Number.isSafeInteger(b.assistantTurns) || b.assistantTurns < 0
      || (b.sampledAt !== undefined && !Number.isFinite(Date.parse(b.sampledAt)))
      || Object.keys(b).some((k) => !['userTurns', 'assistantTurns', 'sampledAt'].includes(k))) throw problem(400, 'baseline must be { userTurns, assistantTurns, sampledAt? } with nonnegative integer counts');
  }
  return c;
}

// `lanPair` is an explicit opt-in (option, `--lan-pair`, or CAPTURE_STUDIO_LAN_PAIR=1). It is the ONLY way the
```

_First 80 of 707 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
