# File: studio/src/studio/bridge-commands.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/bridge-commands.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11718 B |
| Lines | 199 |
| Hash | c8c9b396c5db |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONSUMERS | const | 11 | yes | export const CONSUMERS = [&#39;grokbot&#39;, &#39;harness&#39;, &#39;bootstrap&#39;]; |
| KINDS | const | 12 | yes | export const KINDS = [&#39;command&#39;, &#39;intent&#39;, &#39;stage&#39;]; |
| ID | const | 13 | no | const ID = /^cmd-[a-f0-9]{16}$/; |
| MAX_TEXT | const | 14 | no | const MAX_TEXT = 8000, MAX_RESULT = 64000; |
| queueCache | const | 20 | no | const queueCache = new Map(); |
| TAIL_BYTES | const | 21 | no | const TAIL_BYTES = 64; |
| cacheHits | variable | 22 | no | let cacheHits = 0, cacheMisses = 0, cacheIncremental = 0; |
| bridgeStoreCacheStats | function | 25 | yes | export function bridgeStoreCacheStats() { |
| parseLines | function | 31 | no | function parseLines(map, bytes) { |
| lastNewline | const | 32 | no | const lastNewline = bytes.lastIndexOf(0x0a); |
| text | const | 34 | no | const text = bytes.subarray(0, lastNewline + 1).toString(&#39;utf8&#39;); |
| fingerprint | function | 42 | no | function fingerprint(bytes, end, length = TAIL_BYTES) { |
| readRegion | function | 47 | no | function readRegion(fd, start, length) { |
| buf | const | 48 | no | const buf = Buffer.allocUnsafe(length); |
| read | variable | 49 | no | let read = 0; |
| n | const | 51 | no | const n = readSync(fd, buf, read, length - read, start + read); |
| createBridgeStore | function | 58 | yes | export function createBridgeStore({ root }) { |
| dir | const | 59 | no | const dir = path.join(root, &#39;bridge&#39;), file = path.join(dir, &#39;commands.jsonl&#39;); |
| load | function | 60 | no | const load = () =&gt; { |
| st | const | 62 | no | const st = statSync(file); |
| cached | const | 63 | no | const cached = queueCache.get(file); |
| fd | const | 70 | no | const fd = openSync(file, &#39;r&#39;); |
| result | variable | 71 | no | let result = null; |
| before | const | 73 | no | const before = fingerprint(readRegion(fd, 0, cached.size), cached.size); |
| appended | const | 75 | no | const appended = readRegion(fd, cached.size, st.size - cached.size); |
| head | const | 79 | no | const head = readRegion(fd, 0, end); |
| map | const | 93 | no | const map = new Map(); |
| bytes | const | 94 | no | const bytes = readFileSync(file); |
| write | function | 99 | no | const write = (rec) =&gt; { mkdirSync(dir, { recursive: true, mode: 0o700 }); appendFileSync(file, JSON.stringify(rec) + &#39;\\n&#39;, { mode: 0o600 }); return rec; }; |
| claimLock | const | 101 | no | const claimLock = path.join(dir, &#39;claim.lock&#39;); |
| withClaimLock | function | 102 | no | const withClaimLock = fn =&gt; { |
| fd | const | 104 | no | const fd = openSync(claimLock, &#39;wx&#39;, 0o600); |
| get | function | 108 | no | const get = (id) =&gt; { |
| r | const | 110 | no | const r = load().get(id); if (!r) throw problem(404, &#39;No such bridge command&#39;, &#39;NOT_FOUND&#39;); return r; |
| now | function | 112 | no | const now = () =&gt; new Date().toISOString(); |
| studioKey | function | 116 | no | const studioKey=id=&gt;&#39;relay-&#39;+id; |
| items | variable | 121 | no | let items = [...load().values()].sort((a, b) =&gt; b.createdAt.localeCompare(a.createdAt)); |
| entries | const | 133 | no | const entries=new Map(ids.map(id=&gt;[id,[]])); |
| r | variable | 137 | no | let r;try{r=JSON.parse(line);}catch{continue;} |
| t | const | 153 | no | const t = now(); |
| commandId | const | 154 | no | const commandId=id ?? &#39;cmd-&#39;+randomBytes(8).toString(&#39;hex&#39;); |
| items | const | 161 | no | const items = [...load().values()].filter(r =&gt; r.status === &#39;queued&#39; &amp;&amp; r.consumer === by).sort((a, b) =&gt; a.createdAt.localeCompare(b.createdAt)); |
| r | const | 162 | no | const r = id ? get(id) : items[0]; |
| t | const | 166 | no | const t = now(); |
| r | const | 170 | no | const r = get(id); |
| t | const | 174 | no | const t = now(); |
| registerBridgeRoutes | function | 180 | yes | export function registerBridgeRoutes({ add, paths }) { |
| store | const | 181 | no | const store = createBridgeStore({ root: paths.root }); |
| only | function | 182 | no | const only = (body, keys) =&gt; { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 6 | external |
| node:crypto | import | 7 | external |
| node:path | import | 8 | external |
| ./http.mjs | import | 9 | [studio/src/studio/http.mjs](./http.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/bootstrap/command-worker.mjs](../../../apps/vivim-host/bootstrap/command-worker.mjs.md) | ../../../studio/src/studio/bridge-commands.mjs |
| [apps/vivim-host/conversations/bridge-evidence.mjs](../../../apps/vivim-host/conversations/bridge-evidence.mjs.md) | ../../../studio/src/studio/bridge-commands.mjs |
| [apps/vivim-host/direct-phone.mjs](../../../apps/vivim-host/direct-phone.mjs.md) | ../../studio/src/studio/bridge-commands.mjs |
| [apps/vivim-host/grokbot/worker.mjs](../../../apps/vivim-host/grokbot/worker.mjs.md) | ../../../studio/src/studio/bridge-commands.mjs |
| [apps/vivim-host/test/bootstrap-command.test.mjs](../../../apps/vivim-host/test/bootstrap-command.test.mjs.md) | ../../../studio/src/studio/bridge-commands.mjs |
| [apps/vivim-host/test/bridge-evidence.test.mjs](../../../apps/vivim-host/test/bridge-evidence.test.mjs.md) | ../../../studio/src/studio/bridge-commands.mjs |
| [apps/vivim-host/test/conversation-native-knowledge.test.mjs](../../../apps/vivim-host/test/conversation-native-knowledge.test.mjs.md) | ../../../studio/src/studio/bridge-commands.mjs |
| [apps/vivim-host/test/direct-phone.test.mjs](../../../apps/vivim-host/test/direct-phone.test.mjs.md) | ../../../studio/src/studio/bridge-commands.mjs |
| [apps/vivim-host/test/grokbot-worker.test.mjs](../../../apps/vivim-host/test/grokbot-worker.test.mjs.md) | ../../../studio/src/studio/bridge-commands.mjs |
| [apps/vivim-host/test/phone-sessions.test.mjs](../../../apps/vivim-host/test/phone-sessions.test.mjs.md) | ../../../studio/src/studio/bridge-commands.mjs |
| [apps/vivim-host/test/studio-journal-evidence.test.mjs](../../../apps/vivim-host/test/studio-journal-evidence.test.mjs.md) | ../../../studio/src/studio/bridge-commands.mjs |
| [studio/bin/commands/bridge.mjs](../../bin/commands/bridge.mjs.md) | ../../src/studio/bridge-commands.mjs |
| [studio/bin/commands/relay.mjs](../../bin/commands/relay.mjs.md) | ../../src/studio/bridge-commands.mjs |
| [studio/bin/relay-chat-mvp.mjs](../../bin/relay-chat-mvp.mjs.md) | ../src/studio/bridge-commands.mjs |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./bridge-commands.mjs |
| [studio/src/studio/relay-journal-correlation.mjs](./relay-journal-correlation.mjs.md) | ./bridge-commands.mjs |
| [studio/src/studio/world-service.mjs](./world-service.mjs.md) | ./bridge-commands.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Bootstrap bridge: durable command queue from the phone (/mobile) to a consumer that executes it.
// Today the consumer is Grok Bot (via `studio bridge list|claim|reply`); later the harness/fleet
// ('harness'). No provider API is ever called here: this module only stores records.
// Storage: append-only JSONL of full record snapshots under <data>/bridge/commands.jsonl; the latest
// snapshot per id wins, so a crash mid-write loses at most the last line.
import { appendFileSync, mkdirSync, readFileSync, existsSync, openSync, closeSync, readSync, statSync, unlinkSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { problem } from './http.mjs';

export const CONSUMERS = ['grokbot', 'harness', 'bootstrap'];
export const KINDS = ['command', 'intent', 'stage'];
const ID = /^cmd-[a-f0-9]{16}$/;
const MAX_TEXT = 8000, MAX_RESULT = 64000;

// Parsed queue cache, keyed by the absolute JSONL path. The bridge file is append-only, so a
// request that sees a larger file parses only the appended tail; a rewritten, truncated or
// fingerprint-mismatched file falls back to a full read. The map is the same one the old
// per-call parse built, just retained between calls.
const queueCache = new Map();
const TAIL_BYTES = 64;
let cacheHits = 0, cacheMisses = 0, cacheIncremental = 0;

// Test/audit view only. Never used by product paths.
export function bridgeStoreCacheStats() {
  return { entries: queueCache.size, hits: cacheHits, misses: cacheMisses, incremental: cacheIncremental };
}

// Parse complete lines from a byte region; return the map plus how many bytes were consumed
// (a non-newline-terminated tail is left for the next append instead of being treated as a record).
function parseLines(map, bytes) {
  const lastNewline = bytes.lastIndexOf(0x0a);
  if (lastNewline < 0) return { consumed: 0 };
  const text = bytes.subarray(0, lastNewline + 1).toString('utf8');
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line); if (ID.test(r?.id)) map.set(r.id, r); } catch { /* torn tail line */ }
  }
  return { consumed: lastNewline + 1 };
}

function fingerprint(bytes, end, length = TAIL_BYTES) {
  const from = Math.max(0, end - length);
  return Buffer.from(bytes.subarray(from, end));
}

function readRegion(fd, start, length) {
  const buf = Buffer.allocUnsafe(length);
  let read = 0;
  while (read < length) {
    const n = readSync(fd, buf, read, length - read, start + read);
    if (n <= 0) break;
    read += n;
  }
  return read === length ? buf : buf.subarray(0, read);
}

export function createBridgeStore({ root }) {
  const dir = path.join(root, 'bridge'), file = path.join(dir, 'commands.jsonl');
  const load = () => {
    if (!existsSync(file)) { queueCache.delete(file); return new Map(); }
    const st = statSync(file);
    const cached = queueCache.get(file);
    if (cached && cached.size === st.size && cached.mtimeMs === st.mtimeMs) {
      cacheHits++;
      return cached.map;
    }
    // Append-only path: the file grew and the bytes before the old end still match the fingerprint.
    if (cached && st.size > cached.size && st.mtimeMs !== cached.mtimeMs) {
      const fd = openSync(file, 'r');
      let result = null;
      try {
        const before = fingerprint(readRegion(fd, 0, cached.size), cached.size);
        if (before.equals(cached.tail)) {
          const appended = readRegion(fd, cached.size, st.size - cached.size);
          const { consumed } = parseLines(cached.map, appended);
          if (consumed > 0) {
            const end = cached.size + consumed;
            const head = readRegion(fd, 0, end);
            result = { size: end, mtimeMs: st.mtimeMs, map: cached.map, tail: fingerprint(head, end) };
```

_First 80 of 200 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
