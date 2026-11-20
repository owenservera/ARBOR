# File: studio/src/mirror/ws.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/mirror/ws.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9150 B |
| Lines | 189 |
| Hash | d4a4cbf3a8ec |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| GUID | const | 9 | no | const GUID = &#39;258EAFA5-E914-47DA-95CA-C5AB0DC85B11&#39;; |
| OP | const | 10 | yes | export const OP = Object.freeze({ CONT: 0, TEXT: 1, BINARY: 2, CLOSE: 8, PING: 9, PONG: 10 }); |
| acceptKey | function | 12 | yes | export function acceptKey(key) { |
| encodeFrame | function | 16 | yes | export function encodeFrame(opcode, payload = Buffer.alloc(0), { fin = true } = {}) { |
| p | const | 17 | no | const p = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload), &#39;utf8&#39;); |
| len | const | 18 | no | const len = p.length; |
| header | variable | 19 | no | let header; |
| FrameParser | class | 27 | yes | export class FrameParser { |
| constructor | method | 28 | yes | constructor({ maxPayload = 64 * 1024 * 1024 } = {}) { this.buf = Buffer.alloc(0); this.maxPayload = maxPayload; } |
| push | method | 30 | yes | push(chunk) { |
| out | const | 32 | no | const out = []; |
| b | const | 34 | no | const b = this.buf; |
| fin | const | 36 | no | const fin = (b[0] &amp; 0x80) !== 0, rsv = b[0] &amp; 0x70, opcode = b[0] &amp; 0x0f; |
| masked | const | 37 | no | const masked = (b[1] &amp; 0x80) !== 0; |
| len | variable | 38 | no | let len = b[1] &amp; 0x7f, off = 2; |
| big | const | 43 | no | const big = b.readBigUInt64BE(2); |
| maskOff | const | 49 | no | const maskOff = off; |
| payload | variable | 52 | no | let payload = Buffer.from(b.subarray(off, off + len)); |
| WsConnection | class | 61 | yes | export class WsConnection extends EventEmitter { |
| constructor | method | 62 | yes | constructor(socket, { protocol = null, requireMask = true, maxMessage = 64 * 1024 * 1024 } = {}) { |
| _data | method | 81 | yes | _data(chunk) { |
| frames | variable | 82 | no | let frames; |
| code | const | 92 | no | const code = f.payload.length &gt;= 2 ? f.payload.readUInt16BE(0) : 1005; |
| reason | const | 93 | no | const reason = f.payload.length &gt; 2 ? f.payload.subarray(2).toString(&#39;utf8&#39;) : &#39;&#39;; |
| _message | method | 116 | yes | _message(opcode, data) { |
| _write | method | 120 | yes | _write(opcode, payload) { |
| frame | const | 122 | no | const frame = encodeFrame(opcode, payload); |
| send | method | 127 | yes | send(data, opcode) { |
| op | const | 129 | no | const op = opcode ?? (Buffer.isBuffer(data) ? OP.BINARY : OP.TEXT); |
| ping | method | 133 | yes | ping(data = Buffer.alloc(0)) { return this.state === &#39;open&#39; ? this._write(OP.PING, data) : false; } |
| close | method | 135 | yes | close(code = 1000, reason = &#39;&#39;) { |
| n | variable | 139 | no | let n = 123; |
| full | const | 140 | no | const full = Buffer.from(String(reason)); |
| r | const | 142 | no | const r = full.subarray(0, n); |
| p | const | 143 | no | const p = Buffer.alloc(2 + r.length); |
| t | const | 147 | no | const t = setTimeout(() =&gt; this.socket.destroy(), 1000); |
| terminate | method | 153 | yes | terminate() { this.socket.destroy(); this._closed(1006, &#39;terminated&#39;); } |
| _closed | method | 155 | yes | _closed(code, reason) { |
| acceptUpgrade | function | 164 | yes | export function acceptUpgrade(req, socket, head, { selectProtocol, extraHeaders = {} } = {}) { |
| key | const | 165 | no | const key = req.headers[&#39;sec-websocket-key&#39;]; |
| version | const | 166 | no | const version = req.headers[&#39;sec-websocket-version&#39;]; |
| reject | function | 167 | no | const reject = (status, text) =&gt; { |
| requested | const | 176 | no | const requested = String(req.headers[&#39;sec-websocket-protocol&#39;] ?? &#39;&#39;).split(&#39;,&#39;).map((s) =&gt; s.trim()).filter(Boolean); |
| protocol | const | 177 | no | const protocol = requested.length &amp;&amp; selectProtocol ? selectProtocol(requested) : null; |
| lines | const | 178 | no | const lines = [ |
| conn | const | 185 | no | const conn = new WsConnection(socket, { protocol: protocol &amp;&amp; requested.includes(protocol) ? protocol : null }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 6 | external |
| node:events | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/mirror/index.mjs](./index.mjs.md) | ./ws.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Minimal RFC 6455 WebSocket server side, zero dependencies.
//   - opening handshake (Sec-WebSocket-Accept, optional subprotocol, no extensions)
//   - frame parser for masked client frames: 7/16/64-bit lengths, fragmentation (opcode 0)
//   - text/binary send, ping -> pong, close handshake with status code + reason
// Compression extensions are never negotiated: captured frames are already payload-level.
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
export const OP = Object.freeze({ CONT: 0, TEXT: 1, BINARY: 2, CLOSE: 8, PING: 9, PONG: 10 });

export function acceptKey(key) {
  return createHash('sha1').update(String(key).trim() + GUID).digest('base64');
}

export function encodeFrame(opcode, payload = Buffer.alloc(0), { fin = true } = {}) {
  const p = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload), 'utf8');
  const len = p.length;
  let header;
  if (len < 126) { header = Buffer.alloc(2); header[1] = len; }
  else if (len < 65536) { header = Buffer.alloc(4); header[1] = 126; header.writeUInt16BE(len, 2); }
  else { header = Buffer.alloc(10); header[1] = 127; header.writeBigUInt64BE(BigInt(len), 2); }
  header[0] = (fin ? 0x80 : 0) | (opcode & 0x0f);
  return Buffer.concat([header, p]);
}

export class FrameParser {
  constructor({ maxPayload = 64 * 1024 * 1024 } = {}) { this.buf = Buffer.alloc(0); this.maxPayload = maxPayload; }
  // Returns complete frames; throws { code } on protocol violations.
  push(chunk) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk;
    const out = [];
    for (;;) {
      const b = this.buf;
      if (b.length < 2) break;
      const fin = (b[0] & 0x80) !== 0, rsv = b[0] & 0x70, opcode = b[0] & 0x0f;
      const masked = (b[1] & 0x80) !== 0;
      let len = b[1] & 0x7f, off = 2;
      if (rsv) throw Object.assign(new Error('RSV bits set without a negotiated extension'), { code: 1002 });
      if (len === 126) { if (b.length < 4) break; len = b.readUInt16BE(2); off = 4; }
      else if (len === 127) {
        if (b.length < 10) break;
        const big = b.readBigUInt64BE(2);
        if (big > BigInt(this.maxPayload)) throw Object.assign(new Error('frame too large'), { code: 1009 });
        len = Number(big); off = 10;
      }
      if (len > this.maxPayload) throw Object.assign(new Error('frame too large'), { code: 1009 });
      if (opcode >= 8 && (len > 125 || !fin)) throw Object.assign(new Error('invalid control frame'), { code: 1002 });
      const maskOff = off;
      if (masked) off += 4;
      if (b.length < off + len) break;
      let payload = Buffer.from(b.subarray(off, off + len));
      if (masked) { const m = b.subarray(maskOff, maskOff + 4); for (let i = 0; i < payload.length; i++) payload[i] ^= m[i & 3]; }
      this.buf = b.subarray(off + len);
      out.push({ fin, opcode, masked, payload });
    }
    return out;
  }
}

export class WsConnection extends EventEmitter {
  constructor(socket, { protocol = null, requireMask = true, maxMessage = 64 * 1024 * 1024 } = {}) {
    super();
    this.socket = socket;
    this.protocol = protocol;
    this.requireMask = requireMask;
    this.maxMessage = maxMessage;
    this.parser = new FrameParser({ maxPayload: maxMessage });
    this.partial = null;
    this.state = 'open';
    this.sent = { frames: 0, bytes: 0 };
    this.received = { frames: 0, bytes: 0 };
    socket.setNoDelay?.(true);
    socket.on('data', (d) => this._data(d));
    socket.on('close', () => this._closed(1006, ''));
    socket.on('error', () => this._closed(1006, 'socket error'));
  }

  get open() { return this.state === 'open'; }
```

_First 80 of 190 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
