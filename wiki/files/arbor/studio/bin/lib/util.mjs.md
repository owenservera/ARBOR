# File: studio/bin/lib/util.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/lib/util.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3273 B |
| Lines | 77 |
| Hash | 84712397ad10 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| needArg | function | 7 | yes | export function needArg(ctx, index, what, example) { |
| v | const | 8 | no | const v = ctx.args[index]; |
| knowledgeState | function | 14 | yes | export function knowledgeState(session) { |
| st | const | 15 | no | const st = session.kv.get(&#39;KNOWLEDGE_STATUS&#39;, null); |
| model | const | 17 | no | const model = session.kv.get(&#39;MODEL&#39;, null); |
| isDerived | function | 22 | yes | export const isDerived = (session) =&gt; !!session.kv.get(&#39;RECEIPT&#39;, null); |
| siteLabel | function | 24 | yes | export function siteLabel(meta) { |
| looksActive | function | 29 | yes | export function looksActive(session) { |
| parseAt | function | 35 | yes | export function parseAt(text, t0) { |
| s | const | 36 | no | const s = String(text).trim(); |
| t | const | 42 | no | const t = Date.parse(s); |
| sessionStartT | function | 48 | yes | export async function sessionStartT(session) { |
| created | const | 52 | no | const created = Date.parse(session.meta.createdAt); |
| readRows | function | 56 | yes | export async function readRows(session, name, { limit = Infinity, filter } = {}) { |
| ds | const | 57 | no | const ds = session.dataset(name); |
| out | const | 59 | no | const out = []; |
| intFlag | function | 68 | yes | export const intFlag = (v, fallback) =&gt; (v === undefined \|\| v === null ? fallback : Math.max(0, Math.floor(Number(v)))); |
| eventText | function | 71 | yes | export function eventText(ev) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| ../../src/intel/continuity.mjs | import | 4 | [studio/src/intel/continuity.mjs](../../src/intel/continuity.mjs.md) |
| ./ui.mjs | import | 5 | [studio/bin/lib/ui.mjs](./ui.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/export.mjs](../commands/export.mjs.md) | ../lib/util.mjs |
| [studio/bin/commands/knowledge.mjs](../commands/knowledge.mjs.md) | ../lib/util.mjs |
| [studio/bin/commands/learn.mjs](../commands/learn.mjs.md) | ../lib/util.mjs |
| [studio/bin/commands/profiles.mjs](../commands/profiles.mjs.md) | ../lib/util.mjs |
| [studio/bin/commands/replay.mjs](../commands/replay.mjs.md) | ../lib/util.mjs |
| [studio/bin/commands/sessions.mjs](../commands/sessions.mjs.md) | ../lib/util.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Shared helpers for command modules.
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { siteFromSession } from '../../src/intel/continuity.mjs';
import { usageError, notFound } from './ui.mjs';

export function needArg(ctx, index, what, example) {
  const v = ctx.args[index];
  if (v === undefined) throw usageError(`Missing ${what}.`, example ? `Example: ${example}` : `Run "studio help ${ctx.def.name}".`);
  return v;
}

// Derivation / knowledge state of a session from marker files only (cheap).
export function knowledgeState(session) {
  const st = session.kv.get('KNOWLEDGE_STATUS', null);
  if (st?.status) return st.status;
  const model = session.kv.get('MODEL', null);
  if (model?.error) return 'failed';
  return model ? 'legacy-unverified' : 'none';
}

export const isDerived = (session) => !!session.kv.get('RECEIPT', null);

export function siteLabel(meta) {
  return siteFromSession(meta) || meta.site || '';
}

// Is another process probably still writing this session? (session.json is persisted every ~5 s.)
export function looksActive(session) {
  if (session.meta.status !== 'recording') return false;
  try { return Date.now() - statSync(path.join(session.dir, 'session.json')).mtimeMs < 30000; } catch { return false; }
}

// Parse "--at" values: ISO date, epoch milliseconds, or "+12.5" seconds after the first record.
export function parseAt(text, t0) {
  const s = String(text).trim();
  if (/^\+\d+(\.\d+)?$/.test(s)) {
    if (!Number.isFinite(t0)) throw usageError('Cannot resolve a relative time: the session has no timeline. Run "studio derive" first.');
    return t0 + Number(s.slice(1)) * 1000;
  }
  if (/^\d{10,13}$/.test(s)) { const n = Number(s); return s.length === 10 ? n * 1000 : n; }
  const t = Date.parse(s);
  if (!Number.isFinite(t)) throw usageError(`"${text}" is not a time (use an ISO date, epoch ms, or +SECONDS from the start).`);
  return t;
}

// First timestamp of a session (run.start), from the derived timeline when available.
export async function sessionStartT(session) {
  if (existsSync(session.dataset('timeline').file)) {
    for await (const row of session.dataset('timeline').iterate()) return row.t;
  }
  const created = Date.parse(session.meta.createdAt);
  return Number.isFinite(created) ? created : null;
}

export async function readRows(session, name, { limit = Infinity, filter } = {}) {
  const ds = session.dataset(name);
  if (!existsSync(ds.file)) throw notFound(`Dataset "${name}" not found for ${session.id}.`, `Run "studio derive ${session.id}" first.`);
  const out = [];
  for await (const row of ds.iterate()) {
    if (filter && !filter(row)) continue;
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

export const intFlag = (v, fallback) => (v === undefined || v === null ? fallback : Math.max(0, Math.floor(Number(v))));

// Simple text snippet of a decoded event for terminal display.
export function eventText(ev) {
  if (typeof ev.text === 'string') return ev.text;
  if (typeof ev.data === 'string') return ev.data;
  if (ev.json !== undefined) return JSON.stringify(ev.json);
  if (ev.jsonPreview) return ev.jsonPreview;
  return '';
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
