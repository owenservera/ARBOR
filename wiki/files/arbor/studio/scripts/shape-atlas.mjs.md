# File: studio/scripts/shape-atlas.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/shape-atlas.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11142 B |
| Lines | 181 |
| Hash | fe2bf0b32fdd |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 22 | no | const HERE = path.dirname(fileURLToPath(import.meta.url)); |
| ROOT | const | 23 | no | const ROOT = path.resolve(HERE, &#39;..&#39;); |
| SCHEMA | const | 24 | no | const SCHEMA = &#39;aion.shape-atlas/1&#39;; |
| ATLAS_VERSION | const | 25 | no | const ATLAS_VERSION = 1; |
| CHAT_ENDPOINT_RE | const | 26 | no | const CHAT_ENDPOINT_RE = /conversation\|completion\|chat\|message\|generate\|stream\|reply\|timeline\|response/i; |
| arg | function | 28 | no | const arg = (name, fallback = null) =&gt; { |
| i | const | 29 | no | const i = process.argv.indexOf(&#39;--&#39; + name); |
| outDir | const | 32 | no | const outDir = path.resolve(arg(&#39;out&#39;, path.join(ROOT, &#39;docs&#39;, &#39;shape-atlas&#39;))); |
| sessionsDir | const | 33 | no | const sessionsDir = arg(&#39;sessions&#39;); |
| FIXTURES | const | 36 | no | const FIXTURES = [&#39;chatgpt-pathops.json&#39;, &#39;claude-typedevents.json&#39;, &#39;openai-responses.json&#39;]; |
| sessionEntry | function | 38 | no | async function sessionEntry(dir, id) { |
| s | variable | 39 | no | let s; |
| meta | const | 41 | no | const meta = s.meta ?? {}; |
| shapes | const | 42 | no | const shapes = s.kv.get(&#39;SHAPES&#39;, null); |
| endpoints | const | 43 | no | const endpoints = Array.isArray(shapes?.endpoints) ? shapes.endpoints : []; |
| chatEndpoints | const | 44 | no | const chatEndpoints = endpoints.filter((e) =&gt; CHAT_ENDPOINT_RE.test(e.endpoint ?? &#39;&#39;)); |
| components | const | 45 | no | const components = s.kv.get(&#39;STREAM_COMPONENTS&#39;, null); |
| domTurns | const | 46 | no | const domTurns = s.kv.get(&#39;DOM_TURNS&#39;, null); |
| join | const | 47 | no | const join = s.kv.get(&#39;STREAM_DOM_JOIN&#39;, null); |
| knowledge | const | 48 | no | const knowledge = s.kv.get(&#39;KNOWLEDGE_STATUS&#39;, null); |
| acceptance | variable | 49 | no | let acceptance = null; |
| replyChars | variable | 51 | no | let replyChars = null; |
| assembled | const | 53 | no | const assembled = s.kv.get(&#39;ASSEMBLED&#39;, null); |
| sids | const | 54 | no | const sids = assembled &amp;&amp; typeof assembled === &#39;object&#39; ? Object.keys(assembled) : []; |
| best | variable | 55 | no | let best = 0; |
| sessionsFromDir | function | 80 | no | async function sessionsFromDir(dir) { |
| out | const | 82 | no | const out = []; |
| entry | const | 84 | no | const entry = await sessionEntry(dir, id); |
| fixtureEntries | function | 90 | no | function fixtureEntries() { |
| out | const | 91 | no | const out = []; |
| p | const | 93 | no | const p = path.join(ROOT, &#39;test&#39;, &#39;fixtures&#39;, &#39;ai-chat-dialects&#39;, f); |
| fx | const | 96 | no | const fx = JSON.parse(readFileSync(p, &#39;utf8&#39;)); |
| SANDBOX_RECEIPTS | const | 106 | no | const SANDBOX_RECEIPTS = [ |
| main | function | 124 | no | async function main() { |
| sessions | const | 125 | no | const sessions = await sessionsFromDir(sessionsDir); |
| byProvider | const | 126 | no | const byProvider = {}; |
| key | const | 128 | no | const key = s.site ?? &#39;unknown&#39;; |
| b | const | 130 | no | const b = byProvider[key]; |
| atlas | const | 138 | no | const atlas = { |
| out | const | 176 | no | const out = path.join(outDir, &#39;atlas.json&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 15 | external |
| node:path | import | 16 | external |
| node:url | import | 17 | external |
| ../src/store/session.mjs | import | 18 | [studio/src/store/session.mjs](../src/store/session.mjs.md) |
| ../src/capture/acceptance.mjs | import | 19 | [studio/src/capture/acceptance.mjs](../src/capture/acceptance.mjs.md) |
| ../src/replay/derive.mjs | import | 20 | [studio/src/replay/derive.mjs](../src/replay/derive.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Native webapp response-shape atlas generator (aion.shape-atlas/1).
//
// Produces a machine-readable, versioned atlas of OBSERVED provider shape evidence from saved
// Capture Studio sessions — the same evidence class docs/AI-CHAT-SHAPES.md is generated from —
// plus the synthetic dialect fixtures the offline suite encodes. Every entry carries an evidence
// label from roles/14-webapp-native-harness/CAPABILITY-LEDGER.md vocabulary:
//   SOURCE (repo/recorded data) | SYNTHETIC (fixtures/tests) | REAL (live page receipt) |
//   PRODUCT (official docs only) | UNKNOWN.
// The atlas describes shapes and counts only; it never embeds transcript text or private ids.
//
// Usage:
//   node scripts/shape-atlas.mjs --sessions <capture-home>/sessions --out docs/shape-atlas
//   node scripts/shape-atlas.mjs --out docs/shape-atlas            (fixtures only)
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Session } from '../src/store/session.mjs';
import { readAcceptance } from '../src/capture/acceptance.mjs';
import { streamText } from '../src/replay/derive.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SCHEMA = 'aion.shape-atlas/1';
const ATLAS_VERSION = 1;
const CHAT_ENDPOINT_RE = /conversation|completion|chat|message|generate|stream|reply|timeline|response/i;

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const outDir = path.resolve(arg('out', path.join(ROOT, 'docs', 'shape-atlas')));
const sessionsDir = arg('sessions');

// Dialect fixtures encoded in the offline suite: SYNTHETIC evidence of stream shapes.
const FIXTURES = ['chatgpt-pathops.json', 'claude-typedevents.json', 'openai-responses.json'];

async function sessionEntry(dir, id) {
  let s;
  try { s = Session.open(dir, id); } catch { return null; }
  const meta = s.meta ?? {};
  const shapes = s.kv.get('SHAPES', null);
  const endpoints = Array.isArray(shapes?.endpoints) ? shapes.endpoints : [];
  const chatEndpoints = endpoints.filter((e) => CHAT_ENDPOINT_RE.test(e.endpoint ?? ''));
  const components = s.kv.get('STREAM_COMPONENTS', null);
  const domTurns = s.kv.get('DOM_TURNS', null);
  const join = s.kv.get('STREAM_DOM_JOIN', null);
  const knowledge = s.kv.get('KNOWLEDGE_STATUS', null);
  let acceptance = null;
  try { acceptance = readAcceptance(s); } catch { acceptance = null; }
  let replyChars = null;
  try {
    const assembled = s.kv.get('ASSEMBLED', null);
    const sids = assembled && typeof assembled === 'object' ? Object.keys(assembled) : [];
    let best = 0;
    for (const sid of sids) {
      try { const t = await streamText(s, sid, { useLocator: false }); best = Math.max(best, (t.assembledText ?? '').length); } catch { /* stream unreadable */ }
    }
    replyChars = best;
  } catch { replyChars = null; }
  return {
    session: id,
    site: meta.site ?? null,
    origin: meta.target?.origin ?? (meta.target?.url ? new URL(meta.target.url).origin : null),
    recordedAt: id.slice(0, 15).replace(/-/g, '').replace(/^(\d{8})T(\d{6})$/, '$1T$2') || null,
    transports: [...new Set(endpoints.flatMap((e) => Object.keys(e.transports ?? {})))],
    endpoints: { total: endpoints.length, chat: chatEndpoints.length,
      chatList: chatEndpoints.map((e) => e.endpoint).slice(0, 8) },
    streamMaps: [...new Set((components?.streams ?? []).map((x) => x.mapId).filter(Boolean))],
    streamComponentCount: (components?.streams ?? []).reduce((a, x) => a + (x.components?.length ?? 0), 0),
    unmappedEventCount: (components?.streams ?? []).reduce((a, x) => a + (x.unmappedCount ?? 0), 0),
    domTurns: Array.isArray(domTurns) ? domTurns.length : 0,
    joinStatus: join && !join.error ? join.status ?? 'unknown' : join?.error ? 'join-error' : 'not-derived',
    derived: knowledge?.status ?? 'unknown',
    acceptance: acceptance?.verdict ?? 'unassessed',
    assembledReplyChars: replyChars,
  };
}

async function sessionsFromDir(dir) {
```

_First 80 of 182 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
