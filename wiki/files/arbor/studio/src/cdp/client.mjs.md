# File: studio/src/cdp/client.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/cdp/client.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16593 B |
| Lines | 352 |
| Hash | dee91a26cc59 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CdpError | class | 12 | yes | export class CdpError extends Error { |
| constructor | method | 13 | yes | constructor(method, error) { |
| CdpTimeoutError | class | 21 | yes | export class CdpTimeoutError extends CdpError { |
| constructor | method | 22 | yes | constructor(method, ms) { super(method, { message: `timed out after ${ms} ms` }); this.timeoutMs = ms; } |
| CdpSession | class | 25 | yes | export class CdpSession extends EventEmitter { |
| constructor | method | 26 | yes | constructor(connection, sessionId, targetInfo) { |
| send | method | 34 | yes | send(method, params = {}, opts) { |
| trySend | method | 39 | yes | async trySend(method, params = {}, opts) { |
| CdpConnection | class | 45 | yes | export class CdpConnection extends EventEmitter { |
| connect | method | 46 | yes | static async connect(wsUrl, { timeoutMs = 10_000, requestTimeoutMs = 0 } = {}) { |
| ws | const | 48 | no | const ws = new WebSocket(wsUrl); |
| settled | variable | 54 | no | let settled = false; |
| fail | function | 55 | no | const fail = (message) =&gt; { |
| t | const | 61 | no | const t = setTimeout(() =&gt; fail(`CDP connect timeout: ${wsUrl}`), timeoutMs); |
| constructor | method | 69 | yes | constructor(ws, { requestTimeoutMs = 0, url = null } = {}) { |
| _send | method | 86 | yes | _send(method, params, sessionId, { timeoutMs } = {}) { |
| id | const | 88 | no | const id = this.nextId++; |
| msg | const | 89 | no | const msg = { id, method, params }; |
| limit | const | 91 | no | const limit = timeoutMs ?? this.requestTimeoutMs; |
| entry | const | 93 | no | const entry = { resolve, reject, method, sessionId, startedAt: Date.now() }; |
| send | method | 109 | yes | send(method, params = {}, opts) { return this._send(method, params, undefined, opts); } |
| trySend | method | 110 | yes | async trySend(method, params = {}, opts) { try { return await this.send(method, params, opts); } catch { return null; } } |
| _onMessage | method | 112 | yes | _onMessage(data) { |
| text | const | 113 | no | const text = typeof data === &#39;string&#39; ? data : Buffer.from(data).toString(&#39;utf8&#39;); |
| msg | variable | 116 | no | let msg; |
| p | const | 119 | no | const p = this.pending.get(msg.id); |
| sessionId | const | 133 | no | const sessionId = msg.params?.sessionId; |
| s | const | 134 | no | const s = this.sessions.get(sessionId); |
| target | const | 137 | no | const target = msg.sessionId ? this.sessions.get(msg.sessionId) : this; |
| _onClose | method | 146 | yes | _onClose(ev) { |
| attach | method | 158 | yes | async attach(targetId, { timeoutMs } = {}) { |
| s | variable | 160 | no | let s = this.sessions.get(sessionId); |
| detach | method | 166 | yes | async detach(sessionId) { |
| s | const | 167 | no | const s = this.sessions.get(sessionId); |
| session | method | 173 | yes | session(sessionId) { return this.sessions.get(sessionId); } |
| sessionForTarget | method | 174 | yes | sessionForTarget(targetId) { for (const s of this.sessions.values()) if (s.targetInfo?.targetId === targetId) return s; return null; } |
| ping | method | 177 | yes | async ping({ timeoutMs = 5000 } = {}) { |
| started | const | 178 | no | const started = Date.now(); |
| startHeartbeat | method | 184 | yes | startHeartbeat({ intervalMs = 15_000, timeoutMs = 5000 } = {}) { |
| stopHeartbeat | method | 194 | yes | stopHeartbeat() { if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; } } |
| close | method | 199 | yes | close() { this.stopHeartbeat(); try { this.ws.close(); } catch { /* ignore */ } } |
| ResilientCdpConnection | class | 214 | yes | export class ResilientCdpConnection extends EventEmitter { |
| constructor | method | 215 | yes | constructor({ discover, wsUrl = null, maxAttempts = 10, baseDelayMs = 250, maxDelayMs = 10_000, requestTimeoutMs = 0, heartbeatMs = 0, autoReconnect = true, } = {}) { |
| _log | method | 235 | yes | _log(entry) { this.history.push({ at: Date.now(), ...entry }); if (this.history.length &gt; 100) this.history.shift(); } |
| _resolveUrl | method | 237 | yes | async _resolveUrl() { |
| v | const | 238 | no | const v = await this.discover(); |
| url | const | 239 | no | const url = typeof v === &#39;string&#39; ? v : v?.webSocketDebuggerUrl; |
| open | method | 244 | yes | async open() { |
| _wire | method | 255 | yes | _wire() { |
| conn | const | 256 | no | const conn = this.conn; |
| _reconnectLoop | method | 267 | yes | async _reconnectLoop(lostAt) { |
| delay | const | 270 | no | const delay = Math.min(this.maxDelayMs, this.baseDelayMs * 2 ** (attempt - 1)); |
| conn | const | 277 | no | const conn = await CdpConnection.connect(url, { requestTimeoutMs: this.requestTimeoutMs }); |
| reattached | const | 282 | no | const reattached = []; |
| session | const | 285 | no | const session = await conn.attach(targetId); |
| downtimeMs | const | 290 | no | const downtimeMs = Date.now() - lostAt; |
| attach | method | 305 | yes | async attach(targetId, onSession) { |
| session | const | 307 | no | const session = await this.conn.attach(targetId); |
| releaseAttachment | method | 312 | yes | releaseAttachment(targetId) { return this.attachments.delete(targetId); } |
| send | method | 314 | yes | send(method, params = {}, opts) { |
| session | method | 319 | yes | session(sessionId) { return this.conn?.session(sessionId) ?? null; } |
| close | method | 323 | yes | close() { this.closedByUser = true; this.conn?.close(); } |
| connectWithRetry | function | 327 | yes | export async function connectWithRetry(discover, { maxAttempts = 20, baseDelayMs = 250, maxDelayMs = 5000, requestTimeoutMs = 0 } = {}) { |
| last | variable | 328 | no | let last; |
| v | const | 331 | no | const v = await discover(); |
| url | const | 332 | no | const url = typeof v === &#39;string&#39; ? v : v?.webSocketDebuggerUrl; |
| sleep | function | 343 | yes | export function sleep(ms) { return new Promise((r) =&gt; { const t = setTimeout(r, ms); t.unref?.(); }); } |
| assertLoopbackUrl | function | 346 | yes | export function assertLoopbackUrl(url) { |
| u | const | 347 | no | const u = new URL(url); |
| host | const | 348 | no | const host = u.hostname.replace(/^\\[\|\\]$/g, &#39;&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:events | import | 10 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/human-check.mjs](../../scripts/human-check.mjs.md) | ../src/cdp/client.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/cdp/client.mjs |
| [studio/scripts/loadlab.mjs](../../scripts/loadlab.mjs.md) | ../src/cdp/client.mjs |
| [studio/scripts/probe-site.mjs](../../scripts/probe-site.mjs.md) | ../src/cdp/client.mjs |
| [studio/src/capture/actions.mjs](../capture/actions.mjs.md) | ../cdp/client.mjs |
| [studio/src/capture/chatgpt-chat-index-reader.mjs](../capture/chatgpt-chat-index-reader.mjs.md) | ../cdp/client.mjs |
| [studio/src/capture/conversation-browser-adapter.mjs](../capture/conversation-browser-adapter.mjs.md) | ../cdp/client.mjs |
| [studio/src/capture/recorder.mjs](../capture/recorder.mjs.md) | ../cdp/client.mjs |
| [studio/src/cdp/discovery.mjs](./discovery.mjs.md) | ./client.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Minimal, dependency-free Chrome DevTools Protocol client.
// One browser-level WebSocket; per-target sessions use flatten mode (sessionId on each message).
// Node >= 22 provides a global WebSocket implementation.
//
// Resilience lives in two layers:
//   CdpConnection            one socket, optional per-request timeouts, optional heartbeat
//   ResilientCdpConnection   re-discovers the DevTools endpoint and reconnects with backoff,
//                            re-attaches the targets the caller asked for, and reports every
//                            transition so a capture can record an honest coverage note.
import { EventEmitter } from 'node:events';

export class CdpError extends Error {
  constructor(method, error) {
    super(`${method}: ${error?.message ?? 'CDP error'}${error?.data ? ` (${error.data})` : ''}`);
    this.code = error?.code;
    this.method = method;
    this.detail = error;
  }
}

export class CdpTimeoutError extends CdpError {
  constructor(method, ms) { super(method, { message: `timed out after ${ms} ms` }); this.timeoutMs = ms; }
}

export class CdpSession extends EventEmitter {
  constructor(connection, sessionId, targetInfo) {
    super();
    this.setMaxListeners(100);
    this.connection = connection;
    this.sessionId = sessionId;
    this.targetInfo = targetInfo;
    this.detached = false;
  }
  send(method, params = {}, opts) {
    if (this.detached) return Promise.reject(new CdpError(method, { message: 'session detached' }));
    return this.connection._send(method, params, this.sessionId, opts);
  }
  // Fire-and-forget variant: never rejects, returns null on failure. Useful for optional domains.
  async trySend(method, params = {}, opts) {
    try { return await this.send(method, params, opts); } catch (e) { this.emit('send-failed', { method, error: String(e?.message ?? e) }); return null; }
  }
  get targetId() { return this.targetInfo?.targetId; }
}

export class CdpConnection extends EventEmitter {
  static async connect(wsUrl, { timeoutMs = 10_000, requestTimeoutMs = 0 } = {}) {
    assertLoopbackUrl(wsUrl);
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    // A failed or timed-out connect closes its own socket: otherwise a socket that opens late is a
    // live DevTools connection nobody owns, and its handle keeps the process alive. A socket that
    // closes before 'open' fails at once instead of waiting out the whole timeout.
    await new Promise((resolve, reject) => {
      let settled = false;
      const fail = (message) => {
        if (settled) return;
        settled = true; clearTimeout(t);
        try { ws.close(); } catch { /* not yet open */ }
        reject(new Error(message));
      };
      const t = setTimeout(() => fail(`CDP connect timeout: ${wsUrl}`), timeoutMs);
      ws.addEventListener('open', () => { if (settled) { try { ws.close(); } catch { /* ignore */ } return; } settled = true; clearTimeout(t); resolve(); }, { once: true });
      ws.addEventListener('error', (e) => fail(`CDP connect failed: ${e?.message ?? wsUrl}`), { once: true });
      ws.addEventListener('close', () => fail(`CDP connect closed before open: ${wsUrl}`), { once: true });
    });
    return new CdpConnection(ws, { requestTimeoutMs, url: wsUrl });
  }

  constructor(ws, { requestTimeoutMs = 0, url = null } = {}) {
    super();
    this.setMaxListeners(100);
    this.ws = ws;
    this.url = url;
    this.requestTimeoutMs = requestTimeoutMs;
    this.nextId = 1;
    this.pending = new Map();
    this.sessions = new Map();
    this.closed = false;
    this.openedAt = Date.now();
    this.stats = { sent: 0, received: 0, events: 0, errors: 0, timeouts: 0, bytesIn: 0 };
```

_First 80 of 353 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
