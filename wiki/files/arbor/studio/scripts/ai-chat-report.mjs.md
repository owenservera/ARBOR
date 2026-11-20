# File: studio/scripts/ai-chat-report.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/ai-chat-report.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 24705 B |
| Lines | 608 |
| Hash | 64b2b8f7821b |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CHAT_ENDPOINT_RE | const | 25 | no | const CHAT_ENDPOINT_RE = /conversation\|completion\|chat\|message\|generate\|stream\|reply\|timeline\|response/i; |
| DELTA_SEGMENTS | const | 28 | no | const DELTA_SEGMENTS = new Set([ &#39;delta&#39;, &#39;deltas&#39;, &#39;content&#39;, &#39;contents&#39;, &#39;contenttype&#39;, &#39;text&#39;, &#39;texts&#39;, &#39;message&#39;, &#39;messages&#39;, &#39;msg&#39;, &#39;msgs&#39;, |
| STREAM_END_SEGMENTS | const | 40 | no | const STREAM_END_SEGMENTS = new Set([ &#39;done&#39;, &#39;finish&#39;, &#39;finished&#39;, &#39;finishdetails&#39;, &#39;end&#39;, &#39;ends&#39;, &#39;ending&#39;, &#39;endturn&#39;, &#39;stop&#39;, &#39;stopped&#39;, &#39;stopreason&#39;, &#39;stoptokens&#39;, &#39;close&#39;, &#39;closed&#39;, &#39;closereason… |
| pathSegments | function | 48 | no | function pathSegments(fieldPath) { |
| hasAnySegment | function | 57 | no | function hasAnySegment(fieldPath, set) { |
| REPORT_NAME | const | 61 | no | const REPORT_NAME = &#39;AI-CHAT-SHAPES.md&#39;; |
| fail | function | 66 | no | function fail(message) { |
| parseArgs | function | 71 | no | function parseArgs(argv) { |
| args | const | 72 | no | const args = { dataDir: null, out: null, json: false, families: null, help: false }; |
| token | const | 74 | no | const token = argv[i]; |
| eq | const | 75 | no | const eq = token.indexOf(&#39;=&#39;); |
| key | const | 76 | no | const key = eq &gt; 0 ? token.slice(0, eq) : token; |
| inline | const | 77 | no | const inline = eq &gt; 0 ? token.slice(eq + 1) : null; |
| take | function | 78 | no | const take = () =&gt; { |
| next | const | 80 | no | const next = argv[++i]; |
| raw | const | 89 | no | const raw = take(); |
| bareHost | function | 100 | no | function bareHost(value) { |
| v | variable | 101 | no | let v = String(value ?? &#39;&#39;).trim().toLowerCase(); |
| uniq | function | 110 | no | const uniq = (list) =&gt; [...new Set(list)]; |
| missing | const | 111 | no | const missing = &#39;not observed&#39;; |
| asArray | function | 113 | no | function asArray(value) { |
| asCount | function | 117 | no | function asCount(value) { |
| show | function | 121 | no | function show(value) { |
| latestFamilyFile | function | 125 | no | function latestFamilyFile(dir) { |
| names | variable | 126 | no | let names; |
| versioned | const | 132 | no | const versioned = names |
| m | const | 134 | no | const m = /^v(\\d+)\\.json$/.exec(name); |
| plain | const | 140 | no | const plain = names.filter((n) =&gt; /^family\\.json$/i.test(n)).sort()[0]; |
| loadFamily | function | 147 | no | function loadFamily(familiesDir, familyId) { |
| dir | const | 148 | no | const dir = path.join(familiesDir, familyId); |
| file | const | 149 | no | const file = latestFamilyFile(dir); |
| error | variable | 151 | no | let error = null; |
| coverageRaw | const | 185 | no | const coverageRaw = record.coverage &amp;&amp; typeof record.coverage === &#39;object&#39; ? record.coverage : {}; |
| memberIds | const | 186 | no | const memberIds = asArray(record.members).filter((m) =&gt; typeof m === &#39;string&#39;); |
| endpoints | const | 188 | no | const endpoints = asArray(record.shapes) |
| fields | const | 191 | no | const fields = asArray(s.fields).filter((f) =&gt; f &amp;&amp; typeof f.path === &#39;string&#39;); |
| allPaths | const | 192 | no | const allPaths = uniq(fields.map((f) =&gt; f.path)).sort(); |
| deltaPaths | const | 193 | no | const deltaPaths = allPaths.filter((p) =&gt; hasAnySegment(p, DELTA_SEGMENTS)); |
| transportsRaw | const | 207 | no | const transportsRaw = Array.isArray(coverageRaw.transports) |
| family | const | 211 | no | const family = { |
| chatHostIndex | function | 238 | no | async function chatHostIndex() { |
| index | const | 239 | no | const index = new Map(); // bareHost -&gt; { id, label } |
| adapters | variable | 240 | no | let adapters = []; |
| entry | const | 247 | no | const entry = { id: a.id, label: a.label ?? a.id, hosts: asArray(a.hosts) }; |
| host | const | 249 | no | const host = bareHost(candidate); |
| adapterForFamily | function | 256 | no | function adapterForFamily(family, hostIndex) { |
| candidates | const | 257 | no | const candidates = [family.id, ...family.hosts].map(bareHost).filter(Boolean); |
| qualifiesAsChat | function | 264 | no | function qualifiesAsChat(family, hostIndex) { |
| adapter | const | 266 | no | const adapter = adapterForFamily(family, hostIndex); |
| renderTable | function | 277 | no | function renderTable(rows) { |
| headers | const | 278 | no | const headers = [&#39;family&#39;, &#39;sessions&#39;, &#39;derived&#39;, &#39;streams&#39;, &#39;transports&#39;, &#39;chat endpoints&#39;, &#39;signature&#39;]; |
| body | const | 279 | no | const body = rows.map((r) =&gt; [ r.id, String(show(r.coverage.sessions)), String(show(r.coverage.withDerived)), String(show(r.coverage.streams)), |
| widths | const | 288 | no | const widths = headers.map((h, i) =&gt; Math.max(h.length, ...body.map((row) =&gt; row[i].length))); |
| line | function | 289 | no | const line = (cells) =&gt; cells.map((c, i) =&gt; (i === cells.length - 1 ? c : c.padEnd(widths[i]))).join(&#39; &#39;).trimEnd(); |
| divider | const | 290 | no | const divider = widths.map((w) =&gt; &#39;-&#39;.repeat(w)).join(&#39; &#39;); |
| cell | function | 297 | no | function cell(value) { |
| code | function | 301 | no | function code(value) { |
| summarisePaths | function | 305 | no | function summarisePaths(paths, limit = 4) { |
| shown | const | 307 | no | const shown = paths.slice(0, limit).map(code).join(&#39;, &#39;); |
| streamEndPaths | function | 312 | no | function streamEndPaths(family) { |
| found | const | 313 | no | const found = new Set(); |
| renderMarkdown | function | 320 | no | function renderMarkdown({ families, gaps, unreadable, excluded, meta }) { |
| out | const | 321 | no | const out = []; |
| truncated | const | 379 | no | const truncated = f.chatEndpoints.filter((e) =&gt; e.deltaPaths.length &gt; 4); |
| chatTransports | const | 405 | no | const chatTransports = uniq(f.chatEndpoints.map((e) =&gt; e.transport).filter(Boolean)).sort(); |
| endPaths | const | 406 | no | const endPaths = streamEndPaths(f); |
| carriers | const | 407 | no | const carriers = uniq(f.chatEndpoints.flatMap((e) =&gt; e.deltaPaths)).sort(); |
| parts | const | 416 | no | const parts = []; |
| chatTransports | const | 417 | no | const chatTransports = uniq(f.chatEndpoints.map((e) =&gt; e.transport).filter(Boolean)).sort(); |
| endPaths | const | 425 | no | const endPaths = streamEndPaths(f); |
| carriers | const | 431 | no | const carriers = uniq(f.chatEndpoints.flatMap((e) =&gt; e.deltaPaths)).sort(); |
| missingSites | const | 452 | no | const missingSites = gaps.filter((g) =&gt; !g.familyId).map((g) =&gt; g.id); |
| main | function | 480 | no | async function main() { |
| args | const | 481 | no | const args = parseArgs(process.argv.slice(2)); |
| dataDir | const | 489 | no | const dataDir = args.dataDir ? path.resolve(args.dataDir) : defaultDataDir(); |
| paths | const | 490 | no | const paths = dataPaths(dataDir); |
| outFile | const | 491 | no | const outFile = args.out |
| familyDirs | variable | 495 | no | let familyDirs = []; |
| allFamilies | const | 505 | no | const allFamilies = familyDirs.map((id) =&gt; loadFamily(paths.families, id)); |
| unreadable | const | 508 | no | const unreadable = allFamilies.filter((f) =&gt; f.error); |
| excluded | const | 509 | no | const excluded = []; |
| selected | variable | 510 | no | let selected = []; |
| verdict | const | 513 | no | const verdict = qualifiesAsChat(family, hostIndex); |
| want | const | 521 | no | const want = new Set(args.families.map((s) =&gt; s.toLowerCase())); |
| gaps | const | 529 | no | const gaps = adapters |
| hosts | const | 531 | no | const hosts = asArray(a.hosts).map(bareHost).filter(Boolean); |
| family | const | 532 | no | const family = allFamilies.find((f) =&gt; { if (f.error) return false; if (bareHost(f.id) === bareHost(a.id)) return true; return f.hosts.map(bareHost).some((h) =&gt; hosts.includes(h)); }); |
| generatedAt | const | 547 | no | const generatedAt = `${new Date().toISOString().replace(/\\.\\d{3}Z$/, &#39;Z&#39;)}`; |
| command | const | 548 | no | const command = [&#39;node scripts/ai-chat-report.mjs&#39;, args.dataDir ? `--data-dir ${args.dataDir}` : null, args.out ? `--out ${args.out}` : null, args.families ? `--families ${args.families.join(&#39;,&#39;)}` … |
| meta | const | 552 | no | const meta = { command, dataDir, generatedAt, familyCount: familyDirs.length }; |
| payload | const | 554 | no | const payload = { |
| markdown | const | 585 | no | const markdown = renderMarkdown({ families: selected, gaps, unreadable, excluded, meta }); |
| rows | const | 592 | no | const rows = selected.map((f) =&gt; ({ id: f.id, coverage: f.coverage, chatEndpoints: f.chatEndpoints, signature: f.signature, |
| missingSites | const | 600 | no | const missingSites = gaps.filter((g) =&gt; !g.familyId).map((g) =&gt; g.id); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 19 | external |
| node:fs | import | 20 | external |
| node:url | import | 21 | external |
| ../src/config.mjs | import | 22 | [studio/src/config.mjs](../src/config.mjs.md) |
| ../src/profiles/sites/index.mjs | import | 23 | [studio/src/profiles/sites/index.mjs](../src/profiles/sites/index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// AI-chat shape report.
//
// Renders the captured shape library (families/<familyId>/vNNNN.json) as a human-readable
// matrix: which AI-chat sites have a family, which chat endpoints they expose, which transport
// each one uses and which field path appears to carry the streamed delta.
//
// Read-only on the data directory. Only writes the Markdown report (--out).
// Every value printed comes from a file on disk; missing values render as "not observed".
//
// Usage:
//   node scripts/ai-chat-report.mjs [--data-dir DIR] [--out FILE] [--json] [--families a,b,c]
//
// Qualification rule (documented in the report header as well):
//   A family is treated as an AI-chat family when its id/hosts match a site adapter host from
//   src/profiles/sites/index.mjs (chatgpt, claude, gemini, deepseek, zai, qwen, lmarena,
//   minimax, kimi), or when it exposes at least two endpoints matching the chat path filter
//   (an incidental single /api/chat route is not treated as a chat surface).
import path from 'node:path';
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defaultDataDir, dataPaths, TOOL_ROOT } from '../src/config.mjs';
import { ADAPTER_IDS, listAdapters } from '../src/profiles/sites/index.mjs';

const CHAT_ENDPOINT_RE = /conversation|completion|chat|message|generate|stream|reply|timeline|response/i;

// Field-path matching is segment based, so "$.context_scopes" does not count as "text".
const DELTA_SEGMENTS = new Set([
  'delta', 'deltas',
  'content', 'contents', 'contenttype',
  'text', 'texts',
  'message', 'messages', 'msg', 'msgs',
  'choice', 'choices',
  'token', 'tokens',
  'payload', 'payloads',
  'response', 'responses',
  'output', 'outputs',
  'chunk', 'chunks',
]);
const STREAM_END_SEGMENTS = new Set([
  'done', 'finish', 'finished', 'finishdetails',
  'end', 'ends', 'ending', 'endturn',
  'stop', 'stopped', 'stopreason', 'stoptokens',
  'close', 'closed', 'closereason',
  'final', 'isfinal', 'terminated', 'eos', 'complete', 'completed', 'completereason',
]);

function pathSegments(fieldPath) {
  return String(fieldPath)
    .replaceAll('$', '.')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function hasAnySegment(fieldPath, set) {
  return pathSegments(fieldPath).some((seg) => set.has(seg));
}

const REPORT_NAME = 'AI-CHAT-SHAPES.md';

// ---------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------
function fail(message) {
  process.stderr.write(`ai-chat-report: ${message}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const args = { dataDir: null, out: null, json: false, families: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    const eq = token.indexOf('=');
    const key = eq > 0 ? token.slice(0, eq) : token;
    const inline = eq > 0 ? token.slice(eq + 1) : null;
    const take = () => {
      if (inline !== null) return inline;
      const next = argv[++i];
```

_First 80 of 609 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
