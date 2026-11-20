# File: scripts/feedback-loop/compile.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/feedback-loop/compile.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4325 B |
| Lines | 54 |
| Hash | 6798d6028052 |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 8 | no | const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;../..&#39;); |
| USAGE | const | 9 | no | const USAGE = `Usage: node scripts/feedback-loop/compile.mjs --receipt &lt;repo-relative-path&gt; [--receipt &lt;path&gt;] [--journal &lt;path&gt;] --source-sha &lt;40-hex&gt; --current-sha &lt;40-hex&gt; --revision R002 --curren… |
| fail | function | 11 | no | function fail(msg, code = 2) { process.stderr.write(msg + &#39;\\n&#39;); process.exitCode = code; } |
| readBounded | function | 12 | no | function readBounded(rel, kind) { |
| valid | const | 14 | no | const valid = kind === &#39;receipt&#39; |
| resolved | const | 18 | no | const resolved = realpathSync(path.resolve(ROOT, rel)); |
| parseJsonl | function | 23 | no | function parseJsonl(text, pathName) { |
| rows | const | 24 | no | const rows = text.split(/\\r?\\n/).filter(Boolean); |
| main | function | 28 | no | function main(args) { |
| values | const | 30 | no | const values = { receipt: [], journal: [] }; |
| opts | const | 31 | no | const opts = new Set([&#39;--receipt&#39;,&#39;--journal&#39;,&#39;--source-sha&#39;,&#39;--current-sha&#39;,&#39;--revision&#39;,&#39;--current-revision&#39;,&#39;--condition&#39;,&#39;--summary&#39;]); |
| opt | const | 33 | no | const opt = args[i]; |
| v | const | 36 | no | const v = args[++i]; |
| k | const | 38 | no | const k = opt.slice(2).replace(/-([a-z])/g, (_, c) =&gt; c.toUpperCase()); |
| roadmap | const | 44 | no | const roadmap = JSON.parse(readFileSync(path.join(ROOT, &#39;docs/product/roadmap/roadmap.v1.json&#39;), &#39;utf8&#39;)); |
| receipts | const | 45 | no | const receipts = values.receipt.map(p =&gt; ({ path: p, data: JSON.parse(readBounded(p, &#39;receipt&#39;)) })); |
| journals | const | 46 | no | const journals = values.journal.map(p =&gt; ({ path: p, entries: parseJsonl(readBounded(p, &#39;journal&#39;), p) })); |
| result | const | 47 | no | const result = compileFeedback({ roadmap, pins: { sourceSha: values.sourceSha, currentSha: values.currentSha, revision: values.revision, currentRevision: values.currentRevision }, receipts, journals,… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| node:url | import | 5 | external |
| ./compiler.mjs | import | 6 | [scripts/feedback-loop/compiler.mjs](./compiler.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Output-only CLI: reads bounded, allowlisted, read-only files and prints result.
import { readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileFeedback, MAX_INPUT_BYTES, summary } from './compiler.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const USAGE = `Usage: node scripts/feedback-loop/compile.mjs --receipt <repo-relative-path> [--receipt <path>] [--journal <path>] --source-sha <40-hex> --current-sha <40-hex> --revision R002 --current-revision R002 [--condition <verifier-check>] [--summary]\n\nDRY-RUN ONLY. The --current-sha pin must be independently supplied by the keeper from the checked-out Git HEAD; this CLI compares claims but does not verify git itself.\nAllowed receipt paths: .coordination/pdr/evidence/*.verify.*.json or scripts/feedback-loop/fixtures/*.json\nAllowed journal paths: demo/host-legacy/journal.jsonl or scripts/feedback-loop/fixtures/*.jsonl\nDefault output is machine-readable JSON. --summary prints plain text instead.\n`;

function fail(msg, code = 2) { process.stderr.write(msg + '\n'); process.exitCode = code; }
function readBounded(rel, kind) {
  if (typeof rel !== 'string' || rel.startsWith('/') || rel.includes('\\') || rel.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Invalid relative path');
  const valid = kind === 'receipt'
    ? (/^\.coordination\/pdr\/evidence\/[A-Z0-9-]+\.verify\.[a-z0-9-]+\.json$/.test(rel) || /^scripts\/feedback-loop\/fixtures\/[a-z0-9.-]+\.json$/.test(rel))
    : (rel === 'demo/host-legacy/journal.jsonl' || /^scripts\/feedback-loop\/fixtures\/[a-z0-9.-]+\.jsonl$/.test(rel));
  if (!valid) throw new Error('Path outside permitted ' + kind + ' inputs');
  const resolved = realpathSync(path.resolve(ROOT, rel));
  if (!resolved.startsWith(realpathSync(ROOT) + path.sep)) throw new Error('Refusing symlink escape');
  if (statSync(resolved).size > MAX_INPUT_BYTES) throw new Error('Input oversized: ' + rel);
  return readFileSync(resolved, 'utf8');
}
function parseJsonl(text, pathName) {
  const rows = text.split(/\r?\n/).filter(Boolean);
  if (rows.length > 2000 || rows.some(r => Buffer.byteLength(r) > 16 * 1024)) throw new Error('Invalid/oversized journal: ' + pathName);
  return rows.map((r, i) => { try { return JSON.parse(r); } catch { throw new Error('Malformed JSONL at line ' + (i+1)); } });
}
function main(args) {
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) { process.stdout.write(USAGE); return; }
  const values = { receipt: [], journal: [] };
  const opts = new Set(['--receipt','--journal','--source-sha','--current-sha','--revision','--current-revision','--condition','--summary']);
  for (let i = 0; i < args.length; i++) {
    const opt = args[i];
    if (!opts.has(opt)) throw new Error('Unknown option ' + opt);
    if (opt === '--summary') { values.summary = true; continue; }
    const v = args[++i];
    if (!v || v.startsWith('--')) throw new Error('Missing value for ' + opt);
    const k = opt.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (k === 'receipt' || k === 'journal') values[k].push(v);
    else if (values[k] !== undefined) throw new Error('Repeated option ' + opt);
    else values[k] = v;
  }
  if (!values.receipt.length && !values.journal.length) throw new Error('Provide receipt or journal');
  const roadmap = JSON.parse(readFileSync(path.join(ROOT, 'docs/product/roadmap/roadmap.v1.json'), 'utf8'));
  const receipts = values.receipt.map(p => ({ path: p, data: JSON.parse(readBounded(p, 'receipt')) }));
  const journals = values.journal.map(p => ({ path: p, entries: parseJsonl(readBounded(p, 'journal'), p) }));
  const result = compileFeedback({ roadmap, pins: {
    sourceSha: values.sourceSha, currentSha: values.currentSha,
    revision: values.revision, currentRevision: values.currentRevision
  }, receipts, journals, condition: values.condition || null });
  process.stdout.write(values.summary ? summary(result) : JSON.stringify(result, null, 2) + '\n');
}
try { main(process.argv.slice(2)); }
catch (error) { fail('Feedback compiler refused input [' + (error.code || 'INPUT_ERROR') + ']: ' + error.message); }
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
