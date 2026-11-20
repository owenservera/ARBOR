# File: studio/src/capture/network.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/network.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 32426 B |
| Lines | 549 |
| Hash | d325c56898da |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| NetworkRecorder | class | 19 | yes | export class NetworkRecorder extends EventEmitter { |
| constructor | method | 20 | yes | constructor({ append, profile, getPageUrl, options = {} }) { |
| setProfile | method | 46 | yes | setProfile(p) { |
| _sid | method | 54 | yes | _sid(tag, requestId) { return `${tag}:${requestId}`; } |
| _policy | method | 58 | yes | _policy(url, resourceType, tag) { |
| pageUrl | const | 59 | no | const pageUrl = this.getPageUrl(tag); |
| c | const | 60 | no | const c = this.profile.capture ?? {}; |
| attach | method | 76 | yes | async attach(session, tag, targetInfo = {}) { |
| failed | function | 81 | no | const failed = (e) =&gt; { this.stats.handlerErrors++; this.emit(&#39;error&#39;, e); }; |
| on | function | 82 | no | const on = (ev, fn) =&gt; session.on(ev, (p) =&gt; { try { const r = fn(p); if (r &amp;&amp; typeof r.then === &#39;function&#39;) r.then(undefined, failed); } catch (e) { failed(e); } }); |
| reattach | method | 112 | yes | async reattach(session, tag, targetInfo = {}) { |
| orphaned | const | 114 | no | const orphaned = []; |
| markConnectionLost | method | 130 | yes | markConnectionLost(reason = &#39;devtools_connection_lost&#39;) { |
| open | const | 131 | no | const open = []; |
| detachSession | method | 136 | yes | detachSession(sessionId) { |
| entry | const | 137 | no | const entry = this.sessions.get(sessionId); |
| n | variable | 140 | no | let n = 0; |
| _onRequest | method | 153 | yes | _onRequest(session, tag, p, targetInfo) { |
| sid | const | 154 | no | const sid = this._sid(tag, p.requestId); |
| url | const | 155 | no | const url = p.request.url; |
| prev | const | 159 | no | const prev = this.reqs.get(sid); |
| pol | const | 167 | no | const pol = this._policy(url, p.type, tag); |
| st | const | 170 | no | const st = { sid, url, body: pol.body, reason: pol.reason, armed: false, chunks: 0, bytes: 0, session, |
| rec | const | 175 | no | const rec = { |
| _onResponse | method | 189 | yes | async _onResponse(session, tag, p) { |
| sid | const | 190 | no | const sid = this._sid(tag, p.requestId); |
| st | const | 191 | no | const st = this.reqs.get(sid); |
| r | const | 193 | no | const r = p.response; |
| res | const | 202 | no | const res = await this._armStream(session, p.requestId, st); |
| _armStream | method | 226 | yes | async _armStream(session, requestId, st) { |
| last | variable | 227 | no | let last; |
| msg | const | 233 | no | const msg = String(e?.message ?? e); |
| _appendProtectedChunk | method | 244 | yes | _appendProtectedChunk(st, result, extra = {}) { |
| rec | const | 257 | no | const rec = { k: &#39;chunk&#39;, sid: st.sid, n: bytes.length, b64: bytes.toString(&#39;base64&#39;), |
| _chunk | method | 266 | yes | _chunk(st, buf, extra = {}) { |
| room | const | 271 | no | const room = this.maxStreamBytes - (st.bytes + (st.guard?.pending.length ?? 0)); |
| _admit | method | 282 | yes | _admit(st, buf, extra = {}) { |
| _truncateStream | method | 297 | yes | _truncateStream(st, reason, cap, droppedLen) { |
| withheld | const | 298 | no | const withheld = st.guard?.pending.length ?? 0; |
| _onData | method | 307 | yes | _onData(tag, p) { |
| st | const | 308 | no | const st = this.reqs.get(this._sid(tag, p.requestId)); |
| buf | const | 311 | no | const buf = Buffer.from(p.data, &#39;base64&#39;), extra = { ct: p.timestamp, enc: p.encodedDataLength }; |
| _bufferWhileArming | method | 320 | yes | _bufferWhileArming(st, buf, extra) { |
| _onFinished | method | 329 | yes | _onFinished(session, tag, p) { |
| st | const | 330 | no | const st = this.reqs.get(this._sid(tag, p.requestId)); |
| _finalize | method | 337 | yes | async _finalize(session, st, p) { |
| r | const | 347 | no | const r = await session.send(&#39;Network.getResponseBody&#39;, { requestId: p.requestId }); |
| buf | const | 348 | no | const buf = Buffer.from(r.body ?? &#39;&#39;, r.base64Encoded ? &#39;base64&#39; : &#39;utf8&#39;); |
| guard | const | 352 | no | const guard = this.privacy.localRaw ? null : new ChunkCredentialGuard(); |
| first | const | 353 | no | const first = guard ? guard.push(buf) : { bytes: buf, redactions: [], excluded: false }; |
| last | const | 354 | no | const last = guard ? (first.excluded ? first : guard.finish()) |
| bytes | const | 361 | no | const bytes = Buffer.concat([first.bytes, last.bytes]); |
| redactions | const | 362 | no | const redactions = [...first.redactions, ...last.redactions.map((x) =&gt; ({ ...x, offset: x.offset + first.bytes.length }))]; |
| rec | const | 365 | no | const rec = { k: &#39;body&#39;, sid: st.sid, n: bytes.length, b64: bytes.toString(&#39;base64&#39;), |
| _onFailed | method | 383 | yes | _onFailed(tag, p) { |
| st | const | 384 | no | const st = this.reqs.get(this._sid(tag, p.requestId)); |
| _onEventSource | method | 394 | yes | _onEventSource(tag, p) { |
| st | const | 395 | no | const st = this.reqs.get(this._sid(tag, p.requestId)); |
| bytes | const | 406 | no | const bytes = Buffer.from(String(p.data ?? &#39;&#39;), &#39;utf8&#39;); |
| rec | const | 408 | no | const rec = { k: &#39;es.msg&#39;, sid: st.sid, ct: p.timestamp, |
| result | const | 412 | no | const result = (st.esGuard ??= new FrameCredentialGuard()).push(rec, bytes); |
| _onWsCreated | method | 423 | yes | _onWsCreated(tag, p, targetInfo) { |
| sid | const | 424 | no | const sid = this._sid(tag, p.requestId); |
| pol | const | 426 | no | const pol = this._policy(p.url, null, tag); // WebSockets are governed by capture.websockets, not resource types |
| _onWsHandshakeRequest | method | 433 | yes | _onWsHandshakeRequest(tag, p) { |
| st | const | 434 | no | const st = this.reqs.get(this._sid(tag, p.requestId)); |
| headers | const | 436 | no | const headers = this.privacy.headers(p.request?.headers ?? {}); |
| proto | const | 437 | no | const proto = headers[&#39;sec-websocket-protocol&#39;] ?? headers[&#39;Sec-WebSocket-Protocol&#39;]; |
| _onWsHandshake | method | 441 | yes | _onWsHandshake(tag, p) { |
| st | const | 442 | no | const st = this.reqs.get(this._sid(tag, p.requestId)); |
| _lateJoinWs | method | 452 | yes | _lateJoinWs(tag, requestId, targetInfo = {}) { |
| sid | const | 453 | no | const sid = this._sid(tag, requestId); |
| c | const | 454 | no | const c = this.profile.capture ?? {}; |
| mode | const | 455 | no | const mode = c.lateWebSockets ?? &#39;body&#39;; |
| pageUrl | const | 457 | no | const pageUrl = this.getPageUrl(tag) ?? &#39;&#39;; |
| pageInScope | const | 458 | no | const pageInScope = !!pageUrl &amp;&amp; inScope(this.profile, pageUrl, pageUrl); |
| body | const | 460 | no | const body = mode === &#39;body&#39;; |
| st | const | 461 | no | const st = { sid, url: null, ws: true, body, frames: 0, bytes: 0, chunks: 0, lateJoin: true, |
| _appendSafeWsFrame | method | 473 | yes | _appendSafeWsFrame(frame) { |
| _onWsFrame | method | 478 | yes | _onWsFrame(tag, p, dir, targetInfo = {}) { |
| st | variable | 479 | no | let st = this.reqs.get(this._sid(tag, p.requestId)); |
| f | const | 482 | no | const f = p.response ?? {}; |
| data | const | 483 | no | const data = f.payloadData ?? &#39;&#39;; |
| size | const | 484 | no | const size = f.opcode === 2 ? Buffer.from(data, &#39;base64&#39;).length : Buffer.byteLength(data); |
| metadata | const | 485 | no | const metadata = { k: &#39;ws.frame_meta&#39;, sid: st.sid, dir, opcode: f.opcode, size, ct: p.timestamp }; |
| withheld | const | 502 | no | const withheld = st.frameGuard?.bytes ?? 0; |
| bytes | const | 513 | no | const bytes = f.opcode === 2 ? Buffer.from(data, &#39;base64&#39;) : Buffer.from(data, &#39;utf8&#39;); |
| payload | variable | 519 | no | let payload, redactions; |
| rec | const | 522 | no | const rec = { k: &#39;ws.frame&#39;, sid: st.sid, dir, opcode: f.opcode, payload, ct: p.timestamp, securityDelayed: true }; |
| gated | const | 525 | no | const gated = (st.frameGuard ??= new FrameCredentialGuard()).push(rec, bytes); |
| openStreams | method | 538 | yes | openStreams() { return [...this.reqs.values()].filter((s) =&gt; !s.ignored).map((s) =&gt; s.sid); } |
| openStreamDetail | method | 541 | yes | openStreamDetail() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:events | import | 13 | external |
| ./redact.mjs | import | 14 | [studio/src/capture/redact.mjs](./redact.mjs.md) |
| ./privacy.mjs | import | 15 | [studio/src/capture/privacy.mjs](./privacy.mjs.md) |
| ./stream-guard.mjs | import | 16 | [studio/src/capture/stream-guard.mjs](./stream-guard.mjs.md) |
| ../profiles/profiles.mjs | import | 17 | [studio/src/profiles/profiles.mjs](../profiles/profiles.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/capture/network.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/capture/network.mjs |
| [studio/src/capture/recorder.mjs](./recorder.mjs.md) | ./network.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// L1 network capture for one tab (plus its auto-attached iframes/workers).
//
// Read-only by construction: uses Network.* observation only. It never uses Fetch.* interception
// (taking an intercepted body stream would require the collector to re-supply the response).
//
// Per in-scope response:
//   1. Network.streamResourceContent(requestId) is armed at responseReceived. Its bufferedData holds
//      bytes received before arming (recorded with pre:true); afterwards each Network.dataReceived
//      carries the next chunk as base64, in order.
//   2. If arming fails (unsupported, already finished, ...), the failure is recorded and, when the
//      profile allows, Network.getResponseBody is attempted at loadingFinished (marked retrospective).
//   3. WebSocket frames and browser-parsed EventSource messages are recorded as separate views.
import { EventEmitter } from 'node:events';
import { isSensitiveUrl } from './redact.mjs';
import { capturePrivacy } from './privacy.mjs';
import { ChunkCredentialGuard, FrameCredentialGuard } from './stream-guard.mjs';
import { inScope } from '../profiles/profiles.mjs';

export class NetworkRecorder extends EventEmitter {
  constructor({ append, profile, getPageUrl, options = {} }) {
    super();
    this.append = append;              // (rec) => seq|null  — writes to raw log + live pipeline
    this.profile = profile;
    this.privacy = capturePrivacy(profile);
    this.getPageUrl = getPageUrl;
    this.options = options;
    this.reqs = new Map();             // sid -> state
    this.stats = {
      captureMode: this.privacy.mode,
      requests: 0, outOfScope: 0, metadataOnly: 0, streamed: 0, armFailed: 0, armRetried: 0,
      retrospective: 0, chunks: 0, bytes: 0, wsFrames: 0, wsControlFrames: 0, esMessages: 0,
      sensitiveExcluded: 0, redactions: 0, truncatedStreams: 0, reattaches: 0, handlerErrors: 0,
      wsLateJoined: 0, wsMetadataFrames: 0,
    };
    this.sessions = new Map();         // sessionId -> { tag, session, targetInfo }
    // 0 = unlimited. A per-stream cap keeps one runaway response from filling the disk; the cut is
    // always recorded as body.truncated so the coverage stays explicit.
    this.maxStreamBytes = options.maxStreamBytes ?? profile?.capture?.maxStreamBytes ?? 0;
    this.armRetries = options.armRetries ?? profile?.capture?.armRetries ?? 1;
    this.armRetryDelayMs = options.armRetryDelayMs ?? 60;
    // Per-stream memory budget for chunks held while Network.streamResourceContent is pending.
    // Overflow stops buffering for that stream and is recorded as body.truncated (arming_buffer_overflow).
    this.maxPendingArmBytes = options.maxPendingArmBytes ?? profile?.capture?.maxPendingArmBytes ?? 8 * 1024 * 1024;
  }

  setProfile(p) {
    this.profile = p;
    this.privacy = capturePrivacy(p);
    this.stats.captureMode = this.privacy.mode;
    if (this.options.maxStreamBytes === undefined) this.maxStreamBytes = p?.capture?.maxStreamBytes ?? this.maxStreamBytes;
    if (this.options.maxPendingArmBytes === undefined) this.maxPendingArmBytes = p?.capture?.maxPendingArmBytes ?? this.maxPendingArmBytes;
  }

  _sid(tag, requestId) { return `${tag}:${requestId}`; }

  // `tag` identifies the recorded target (p, t1, w1, c3 ...); with several tabs in one run the
  // scope is judged against the page that issued the request, not the primary tab.
  _policy(url, resourceType, tag) {
    const pageUrl = this.getPageUrl(tag);
    const c = this.profile.capture ?? {};
    if (!url.startsWith('http') && !url.startsWith('ws')) return { capture: false, reason: 'non_network_scheme' };
    if (!inScope(this.profile, url, pageUrl)) {
      return this.profile.scope?.thirdParty === 'metadata' ? { capture: true, body: false, reason: 'third_party_metadata' } : { capture: false, reason: 'out_of_scope' };
    }
    // The PC-local default records in-scope traffic without automatic auth
    // suppression or format allowlists. Profiles still control site scope.
    if (this.privacy.localRaw) return { capture: true, body: true, reason: 'local_raw' };
    if (isSensitiveUrl(url, c.sensitive ?? [])) return { capture: true, body: false, reason: 'credential_policy' };
    if ((c.exclude ?? []).some((re) => new RegExp(re, 'i').test(url))) return { capture: true, body: false, reason: 'profile_exclude' };
    if (this.options.allBodies) return { capture: true, body: true };
    if ((c.include ?? []).some((re) => new RegExp(re, 'i').test(url))) return { capture: true, body: true };
    if (resourceType && !(c.bodyResourceTypes ?? []).includes(resourceType)) return { capture: true, body: false, reason: 'resource_type_metadata_only' };
    return { capture: true, body: true };
  }

  async attach(session, tag, targetInfo = {}) {
    this.sessions.set(session.sessionId, { tag, session, targetInfo });
    // Handlers may be async (_onResponse arms the stream; _onFinished starts _finalize): a rejection
    // is counted and reported the same way as a synchronous throw, never left unhandled (which
    // terminates a Node 22 process, i.e. the whole recorder).
```

_First 80 of 550 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
