# File: studio/src/capture/recorder.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/recorder.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 49524 B |
| Lines | 863 |
| Hash | 37ee9fb527e5 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SHAPE_FORCE_PER_SID | const | 28 | no | const SHAPE_FORCE_PER_SID = 50; // the first events of every sid are always observed (endpoint coverage) |
| SHAPE_MAX_STRIDE | const | 29 | no | const SHAPE_MAX_STRIDE = 64; // at the queue cap, one event in this many is observed |
| TIMING_SECTIONS | const | 33 | no | const TIMING_SECTIONS = [&#39;statusTick&#39;, &#39;persistTick&#39;, &#39;persistStateWrite&#39;, &#39;persistShapesWrite&#39;, &#39;persistMetaWrite&#39;, &#39;shapeReport&#39;, &#39;shapeFlush&#39;, &#39;shapeDrain&#39;, &#39;finalize&#39;, &#39;finalizeIngest&#39;]; |
| TERMINAL_KINDS | const | 34 | no | const TERMINAL_KINDS = new Set([&#39;done&#39;, &#39;fail&#39;, &#39;ws.close&#39;]); |
| round3 | function | 35 | no | const round3 = (n) =&gt; Math.round(n * 1000) / 1000; |
| newTiming | function | 36 | no | function newTiming() { return Object.fromEntries(TIMING_SECTIONS.map((k) =&gt; [k, { count: 0, lastMs: 0, maxMs: 0, totalMs: 0 }])); } |
| Recorder | class | 39 | yes | export class Recorder extends EventEmitter { |
| constructor | method | 40 | yes | constructor({ sessionsDir, profileStore, familyStore = null, port = 9222, rawOptions = {}, allBodies = false, liveEventsPerStream = 2000, maxSessionBytes = 0, learner = null, maxStreamBytes = 0, reco… |
| start | method | 94 | yes | async start({ target: selector, profile: profileName, label, tabs, follow, owner, onSessionCreated, exactTarget = false } = {}) { |
| version | const | 103 | no | const version = await browserVersion({ port: this.port }); |
| targets | const | 104 | no | const targets = await listTargets({ port: this.port }); |
| fallbackSelector | const | 107 | no | const fallbackSelector = this.tabs === &#39;all&#39; &amp;&amp; targets.length &gt; 1 ? &#39;0&#39; : undefined; |
| target | const | 108 | no | const target = exactTarget ? targets.find((t) =&gt; t.id === selector) : pickTarget(targets, selector \|\| fallbackSelector); |
| profile | const | 113 | no | const profile = profileName ? this.profileStore.load(profileName) : this.profileStore.selectFor(target.url); |
| host | function | 118 | no | const host = (() =&gt; { try { return new URL(target.url).hostname; } catch { return &#39;page&#39;; } })(); |
| fd | const | 133 | no | const fd = openSync(`${this.session.dir}/session.json`, &#39;r+&#39;); |
| append | function | 147 | no | const append = (rec) =&gt; this._append(rec); |
| _wireConnection | method | 181 | yes | _wireConnection() { |
| conn | const | 182 | no | const conn = this.conn; |
| _onChildAttached | method | 191 | yes | async _onChildAttached(conn, p, parentSessionId) { |
| child | const | 192 | no | const child = conn.session(p.sessionId); |
| release | function | 195 | no | const release = () =&gt; child.send(&#39;Runtime.runIfWaitingForDebugger&#39;).catch(() =&gt; {}); |
| parentTag | const | 196 | no | const parentTag = this.sessionTags.get(parentSessionId); |
| info | const | 198 | no | const info = p.targetInfo ?? {}; |
| tag | const | 199 | no | const tag = `c${++this.childN}`; |
| entry | const | 200 | no | const entry = { targetId: info.targetId, tag, type: info.type, role: &#39;child&#39;, parentTag, url: info.url, session: child, attachedAt: Date.now() }; |
| _wirePage | method | 223 | yes | _wirePage() { |
| _resetTargets | method | 236 | yes | _resetTargets() { |
| _pageUrlFor | method | 248 | yes | _pageUrlFor(tag) { |
| root | const | 249 | no | const root = (tag &amp;&amp; this.tagRoot?.get(tag)) ?? tag ?? &#39;p&#39;; |
| _emitTarget | method | 255 | yes | _emitTarget(entry, state, reason) { |
| openerTag | const | 258 | no | const openerTag = entry.openerId ? this.targets.get(entry.openerId)?.tag : undefined; |
| _trackedHosts | method | 265 | yes | _trackedHosts() { |
| out | const | 266 | no | const out = new Set(); |
| h | const | 269 | no | const h = hostOf(e.role === &#39;primary&#39; ? (this.pageUrl ?? e.url) : e.url); |
| _followedCount | method | 275 | yes | _followedCount() { let n = 0; for (const e of this.targets.values()) if (e.role === &#39;tab&#39; \|\| e.role === &#39;popup&#39; \|\| e.role === &#39;worker&#39;) n++; return n; } |
| _setupDiscovery | method | 279 | yes | async _setupDiscovery() { |
| conn | const | 280 | no | const conn = this.conn; |
| res | const | 287 | no | const res = await conn.send(&#39;Target.getTargets&#39;).catch(() =&gt; null); |
| present | const | 289 | no | const present = new Set(res.targetInfos.map((t) =&gt; t.targetId)); |
| _considerTarget | method | 296 | yes | _considerTarget(info) { |
| id | const | 298 | no | const id = info.targetId; |
| tracked | const | 299 | no | const tracked = this.targets.get(id); |
| u | const | 308 | no | const u = String(info.url ?? &#39;&#39;); |
| trackedIds | const | 310 | no | const trackedIds = new Set(); |
| d | const | 312 | no | const d = followDecision(info, { tabs: this.tabs, follow: this.follow, trackedIds, trackedHosts: this._trackedHosts(), count: this._followedCount(), maxTargets: this.maxTargets, }); |
| _onTargetInfoChanged | method | 328 | yes | _onTargetInfoChanged(info) { |
| e | const | 330 | no | const e = this.targets.get(info.targetId); |
| hostChanged | const | 333 | no | const hostChanged = hostOf(info.url) !== hostOf(e.url); |
| _reconsiderCandidates | method | 342 | yes | _reconsiderCandidates() { |
| _attachTarget | method | 346 | yes | async _attachTarget(info, role, existingTag = null) { |
| id | const | 347 | no | const id = info.targetId; |
| reattach | const | 348 | no | const reattach = !!existingTag; |
| tag | const | 349 | no | const tag = existingTag ?? (role === &#39;worker&#39; ? `w${++this.workerN}` : `t${++this.tabN}`); |
| conn | const | 350 | no | const conn = this.conn; |
| entry | const | 351 | no | const entry = this.targets.get(id) ?? { targetId: id, tag, type: info.type, role, openerId: info.openerId, url: info.url, attachedAt: Date.now() }; |
| attachSession | variable | 357 | no | let attachSession = null; |
| session | const | 359 | no | const session = await conn.attach(id); |
| targetInfo | const | 368 | no | const targetInfo = { type: info.type, targetId: id }; |
| _setupSecondaryPage | method | 398 | yes | async _setupSecondaryPage(session, entry) { |
| hostChanged | const | 402 | no | const hostChanged = hostOf(frame.url) !== hostOf(entry.url); |
| _onTargetGone | method | 412 | yes | _onTargetGone(targetId, reason, session = null) { |
| e | const | 413 | no | const e = this.targets.get(targetId); |
| tap | method | 426 | yes | tap(opts = {}) { return createLiveTap(this, opts); } |
| targetList | method | 428 | yes | targetList() { |
| _setupPage | method | 437 | yes | async _setupPage({ reconnected = false } = {}) { |
| append | function | 438 | no | const append = (rec) =&gt; this._append(rec); |
| profile | const | 439 | no | const profile = this.profile; |
| primary | const | 441 | no | const primary = this.targets.get(this.targetId); |
| hostChanged | const | 448 | no | const hostChanged = hostOf(frame.url) !== hostOf(this.pageUrl); |
| _tryReconnect | method | 474 | yes | async _tryReconnect(reason) { |
| lostAt | const | 477 | no | const lostAt = Date.now(); |
| openStreams | const | 478 | no | const openStreams = this.net.openStreams(); |
| present | const | 485 | no | const present = await targetStillPresent(this.targetId, { port: this.port }); |
| wsUrl | const | 487 | no | const wsUrl = await browserWsUrl({ port: this.port }); |
| conn | const | 488 | no | const conn = await CdpConnection.connect(wsUrl, { requestTimeoutMs: 30_000 }); |
| _maybeSwitchProfile | method | 512 | yes | _maybeSwitchProfile(url) { |
| h | const | 515 | no | const h = new URL(url).hostname; |
| pause | method | 524 | yes | pause() { |
| resume | method | 531 | yes | resume() { |
| _resetShapeQueue | method | 546 | yes | _resetShapeQueue() { |
| _offerShape | method | 552 | yes | _offerShape(ev, stream) { |
| depth | const | 556 | no | const depth = this._shapeQ.length - this._shapeQi; |
| sid | const | 557 | no | const sid = ev.sid ?? &#39;&#39;; |
| seen | const | 558 | no | const seen = (this._shapeSeen.get(sid) ?? 0) + 1; |
| soft | const | 562 | no | const soft = Math.floor(this.maxShapeQueue / 2); |
| stride | const | 564 | no | const stride = 1 + Math.floor((depth - soft) * (SHAPE_MAX_STRIDE - 1) / Math.max(1, this.maxShapeQueue - soft)); |
| _scheduleShapeDrain | method | 574 | yes | _scheduleShapeDrain() { |
| _drainShapes | method | 578 | yes | _drainShapes(budgetMs) { |
| t0 | const | 579 | no | const t0 = performance.now(); |
| deadline | const | 580 | no | const deadline = budgetMs === Infinity ? Infinity : t0 + budgetMs; |
| q | const | 581 | no | const q = this._shapeQ; |
| n | variable | 582 | no | let n = 0; |
| item | const | 584 | no | const item = q[this._shapeQi]; |
| flushShapes | method | 597 | yes | flushShapes() { |
| t0 | const | 598 | no | const t0 = performance.now(); |
| _mark | method | 605 | yes | _mark(section, t0) { |
| ms | const | 606 | no | const ms = performance.now() - t0; |
| s | const | 607 | no | const s = this.timing[section]; |
| _timingSnapshot | method | 612 | yes | _timingSnapshot() { |
| out | const | 613 | no | const out = {}; |
| s | const | 615 | no | const s = this.timing[k]; |
| _append | method | 621 | yes | _append(rec) { |
| terminal | const | 630 | no | const terminal = TERMINAL_KINDS.has(rec.k); |
| tFin | const | 631 | no | const tFin = terminal ? performance.now() : 0; |
| seq | const | 632 | no | const seq = this.session.raw.append(rec); |
| full | const | 634 | no | const full = { seq, t: Date.now(), ...rec }; |
| derived | variable | 638 | no | let derived; |
| _persist | method | 657 | yes | _persist() { |
| t0 | const | 659 | no | const t0 = performance.now(); |
| st | const | 660 | no | const st = this.status(); |
| t | variable | 661 | no | let t = performance.now(); |
| stateWrite | const | 662 | no | const stateWrite = this._writeKvAsync(&#39;STATE&#39;, st); |
| rep | const | 664 | no | const rep = this.liveReport(); |
| shapesWrite | const | 666 | no | const shapesWrite = this._writeKvAsync(&#39;SHAPES&#39;, rep); |
| _writeKvAsync | method | 676 | yes | _writeKvAsync(key, value) { |
| write | variable | 677 | no | let write; |
| _persistFailed | method | 683 | yes | _persistFailed(what, error) { |
| _persistSync | method | 689 | yes | _persistSync() { |
| t0 | const | 691 | no | const t0 = performance.now(); |
| st | const | 692 | no | const st = this.status(); |
| liveReport | method | 700 | yes | liveReport() { |
| families | const | 702 | no | const families = this.familyStore ? this.familyStore.names().map((n) =&gt; this.familyStore.load(n)) : []; |
| t0 | const | 703 | no | const t0 = performance.now(); |
| rep | const | 704 | no | const rep = this.shapes.report(this.reducer, { families, profile: this.profile, domInspect: this.lastInspect, domTurns: this.lastTurns, calibrator: this.learner?.calibrator }); |
| status | method | 709 | yes | status() { |
| t0 | const | 711 | no | const t0 = performance.now(); |
| out | const | 712 | no | const out = { |
| _onLost | method | 739 | yes | async _onLost(reason) { |
| stop | method | 755 | yes | stop(options = {}) { |
| attempt | const | 758 | no | const attempt = this._stop(options).catch((error) =&gt; { if (this._stopPromise === attempt) this._stopPromise = null; this._markStopFailed(error, options.reason); throw error; }); |
| _markStopFailed | method | 767 | yes | _markStopFailed(error, reason = &#39;user_stop&#39;) { |
| meta | const | 773 | no | const meta = this.session?.meta; |
| _stop | method | 782 | yes | async _stop({ reason = &#39;user_stop&#39; } = {}) { |
| open | const | 788 | no | const open = this.net.openStreams(); |
| verify | const | 816 | no | const verify = await this.session.verify(); |
| result | const | 827 | no | const result = { id: this.session.id, dir: this.session.dir, reason, verify, summary: this.reducer.summary() }; |
| recordConversationObservation | method | 832 | yes | recordConversationObservation(record) { |
| seq | const | 834 | no | const seq = this._append({ ...record, k: &#39;conversation.observation&#39; }); |
| raw | const | 836 | no | const raw = this.session.raw; |
| count | const | 838 | no | const count = raw.queue.length; raw.flush(); |
| inspectDom | method | 846 | yes | async inspectDom() { const r = await this.dom.inspect(); this.lastInspect = r; return r; } |
| domTurns | method | 847 | yes | async domTurns() { const t = await this.dom.turns(); this.lastTurns = t; return t; } |
| domBlocks | method | 848 | yes | async domBlocks(id) { return this.dom.blocksOf(id); } |
| snapshotDom | method | 849 | yes | async snapshotDom() { |
| snap | const | 850 | no | const snap = await this.dom.snapshot(); |
| highlight | method | 854 | yes | async highlight(id) { return this.dom.highlight(id); } |
| reloadPage | method | 857 | yes | async reloadPage() { this._append({ k: &#39;lifecycle&#39;, event: &#39;reload_requested_by_user&#39; }); await this.page.send(&#39;Page.reload&#39;, { ignoreCache: false }); return true; } |
| stripForDataset | function | 860 | no | function stripForDataset(ev) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:events | import | 12 | external |
| node:os | import | 13 | external |
| node:fs | import | 14 | external |
| ../cdp/client.mjs | import | 15 | [studio/src/cdp/client.mjs](../cdp/client.mjs.md) |
| ../cdp/discovery.mjs | import | 16 | [studio/src/cdp/discovery.mjs](../cdp/discovery.mjs.md) |
| ../store/session.mjs | import | 17 | [studio/src/store/session.mjs](../store/session.mjs.md) |
| ./network.mjs | import | 18 | [studio/src/capture/network.mjs](./network.mjs.md) |
| ./dom.mjs | import | 19 | [studio/src/capture/dom.mjs](./dom.mjs.md) |
| ../replay/reducer.mjs | import | 20 | [studio/src/replay/reducer.mjs](../replay/reducer.mjs.md) |
| ../shapes/infer.mjs | import | 21 | [studio/src/shapes/infer.mjs](../shapes/infer.mjs.md) |
| ./privacy.mjs | import | 22 | [studio/src/capture/privacy.mjs](./privacy.mjs.md) |
| ../config.mjs | import | 23 | [studio/src/config.mjs](../config.mjs.md) |
| ./live-tap.mjs | import | 24 | [studio/src/capture/live-tap.mjs](./live-tap.mjs.md) |
| ./targets.mjs | import | 25 | [studio/src/capture/targets.mjs](./targets.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/capture.mjs](../../bin/commands/capture.mjs.md) | ../../src/capture/recorder.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/capture/recorder.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/capture/recorder.mjs |
| [studio/src/capture/actions.mjs](./actions.mjs.md) | ./recorder.mjs |
| [studio/src/capture/conversation-browser-adapter.mjs](./conversation-browser-adapter.mjs.md) | ./recorder.mjs |
| [studio/src/mcp/runtime.mjs](../mcp/runtime.mjs.md) | ../capture/recorder.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../capture/recorder.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Recorder: one capture run, anchored on one user-selected tab (the "primary").
// Wires CDP -> NetworkRecorder (L1) + DomObserver (L3) -> RawLog, and mirrors every persisted
// record through the StreamReducer (L2) so the live studio shows exactly what replay would.
//
// Multi-target (one session, one raw log, sids prefixed by target tag):
//   p    primary tab (DOM observation stays bound to it)
//   tN   other tabs ({ tabs: 'all' }) and popups / new tabs opened by a recorded page (follow)
//   wN   service / shared workers of the recorded sites (follow)
//   cN   auto-attached children of any recorded target: OOPIFs, dedicated workers (recursive)
// Every attach/detach is a 'lifecycle' record and a 'target' event. recorder.tap(opts) returns a
// live decoded-event tap (see live-tap.mjs).
import { EventEmitter } from 'node:events';
import os from 'node:os';
import { fsyncSync, openSync, closeSync } from 'node:fs';
import { CdpConnection, sleep } from '../cdp/client.mjs';
import { browserVersion, listTargets, pickTarget, browserWsUrl, targetStillPresent } from '../cdp/discovery.mjs';
import { Session, listSessions } from '../store/session.mjs';
import { NetworkRecorder } from './network.mjs';
import { DomObserver } from './dom.mjs';
import { StreamReducer } from '../replay/reducer.mjs';
import { ShapeInferencer } from '../shapes/infer.mjs';
import { capturePrivacy } from './privacy.mjs';
import { collectorSourceSha, VERSION } from '../config.mjs';
import { createLiveTap } from './live-tap.mjs';
import { followDecision, hostOf } from './targets.mjs';

// Shape observation sampling (derived data only; raw and reducer are never sampled).
const SHAPE_FORCE_PER_SID = 50; // the first events of every sid are always observed (endpoint coverage)
const SHAPE_MAX_STRIDE = 64;    // at the queue cap, one event in this many is observed

// Synchronous section timings, exposed as status().stats.timing. Each section costs two
// performance.now() calls per execution. finalize* cover only terminal records (done/fail/ws.close).
const TIMING_SECTIONS = ['statusTick', 'persistTick', 'persistStateWrite', 'persistShapesWrite', 'persistMetaWrite', 'shapeReport', 'shapeFlush', 'shapeDrain', 'finalize', 'finalizeIngest'];
const TERMINAL_KINDS = new Set(['done', 'fail', 'ws.close']);
const round3 = (n) => Math.round(n * 1000) / 1000;
function newTiming() { return Object.fromEntries(TIMING_SECTIONS.map((k) => [k, { count: 0, lastMs: 0, maxMs: 0, totalMs: 0 }])); }

// @serves 021,091,099
export class Recorder extends EventEmitter {
  constructor({
    sessionsDir, profileStore, familyStore = null, port = 9222, rawOptions = {}, allBodies = false,
    liveEventsPerStream = 2000, maxSessionBytes = 0, learner = null, maxStreamBytes = 0,
    reconnect = true, maxReconnectAttempts = 6, reconnectBaseDelayMs = 400, heartbeatMs = 15_000,
    tabs = 'one', follow = true, maxTargets = 32, pauseNewTargets = null, ignoreTargetUrls = [],
    deferShapes = true, maxShapeQueue = 5000, shapeSliceMs = 4,
    liveJsonMaxBytes = 2 * 1024 * 1024,
  }) {
    super();
    // tabs: 'one' = the selected tab only; 'all' = every web tab in the browser.
    // follow: popups/new tabs opened by recorded pages + service/shared workers of recorded sites,
    // and recursive auto-attach of children (OOPIFs, dedicated workers).
    this.tabs = tabs === 'all' ? 'all' : 'one';
    this.follow = follow !== false;
    this.maxTargets = maxTargets;
    // Pause new child targets until Network is enabled on them, so their first requests are seen.
    this.pauseNewTargets = pauseNewTargets ?? this.follow;
    // Never follow these (string = URL prefix, RegExp = test). The studio should pass its own
    // origin so { tabs: 'all' } cannot record the studio's live feed into itself.
    this.ignoreTargetUrls = ignoreTargetUrls;
    this.setMaxListeners(50);
    this.sessionsDir = sessionsDir;
    this.profileStore = profileStore;
    this.port = port;
    this.rawOptions = rawOptions;
    this.allBodies = allBodies;
    this.liveEventsPerStream = liveEventsPerStream;
    this.familyStore = familyStore;
    this.learner = learner; // optional ScopedLearner: supplies the suggestion calibrator
    this.maxSessionBytes = maxSessionBytes; // 0 = unlimited; otherwise stop cleanly with reason quota_reached
    this.maxStreamBytes = maxStreamBytes;   // 0 = unlimited per-stream body cap
    // DevTools transport resilience. Reconnecting cannot resume a response body that was already
    // in flight (Chrome only streams content for requests armed while live), so every reconnect is
    // recorded with an explicit coverage note and affected streams are marked.
    this.reconnect = reconnect;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.reconnectBaseDelayMs = reconnectBaseDelayMs;
    this.heartbeatMs = heartbeatMs;
    this.reconnects = 0;
    // Shape observation queue (see _offerShape). deferShapes:false = synchronous observeEvent.
    this.deferShapes = deferShapes !== false;
```

_First 80 of 864 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
