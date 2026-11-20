# File: studio/src/mcp/resources.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/mcp/resources.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10325 B |
| Lines | 250 |
| Hash | 40a0724c15f4 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PAGE | const | 7 | no | const PAGE = 100; |
| NAME | const | 8 | no | const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/; |
| MAX_TEXT | const | 9 | no | const MAX_TEXT = 1_000_000; |
| DEFAULT_LIMIT | const | 10 | no | const DEFAULT_LIMIT = 100; |
| MAX_LIMIT | const | 11 | no | const MAX_LIMIT = 500; |
| sessionPath | function | 13 | no | function sessionPath(sessionsDir, id) { |
| root | const | 15 | no | const root = path.resolve(sessionsDir); |
| dir | const | 16 | no | const dir = path.resolve(root, id); |
| prefix | const | 17 | no | const prefix = root.endsWith(path.sep) ? root : root + path.sep; |
| encodeId | function | 23 | no | function encodeId(id) { |
| resourceUri | function | 27 | yes | export function resourceUri(kind, id, dataset) { |
| base | const | 29 | no | const base = `capture-studio://sessions/${encodeId(id)}`; |
| datasetsOf | function | 37 | no | function datasetsOf(dir) { |
| folder | const | 38 | no | const folder = path.join(dir, &#39;datasets&#39;); |
| items | const | 40 | no | const items = []; |
| name | const | 43 | no | const name = file.slice(0, -6); |
| readJsonFile | function | 52 | no | function readJsonFile(file, maxBytes) { |
| size | variable | 54 | no | let size = 0; |
| kvFile | function | 62 | no | function kvFile(dir, key) { |
| boundText | function | 66 | no | function boundText(value) { |
| text | const | 67 | no | const text = JSON.stringify(value); |
| parseResourceUri | function | 77 | no | function parseResourceUri(uri) { |
| url | variable | 81 | no | let url; |
| parts | variable | 87 | no | let parts; |
| query | const | 90 | no | const query = Object.fromEntries(url.searchParams); |
| id | const | 92 | no | const id = parts[0]; |
| catalog | function | 100 | no | function catalog(sessionsDir) { |
| resources | const | 101 | no | const resources = [{ |
| id | const | 110 | no | const id = meta.id; |
| dir | const | 111 | no | const dir = sessionPath(sessionsDir, id); |
| when | const | 113 | no | const when = meta.createdAt ? ` recorded ${meta.createdAt}` : &#39;&#39;; |
| site | const | 114 | no | const site = meta.site ? `${meta.site} ` : &#39;&#39;; |
| datasets | const | 122 | no | const datasets = datasetsOf(dir); |
| listCaptureResources | function | 151 | yes | export function listCaptureResources(sessionsDir, cursor) { |
| all | const | 152 | no | const all = catalog(sessionsDir); |
| offset | variable | 153 | no | let offset = 0; |
| resources | const | 159 | no | const resources = all.slice(offset, offset + PAGE); |
| next | const | 160 | no | const next = offset + PAGE &lt; all.length ? String(offset + PAGE) : undefined; |
| integerQuery | function | 164 | no | function integerQuery(value, name, fallback, max, min) { |
| number | const | 167 | no | const number = Number(value); |
| requireSession | function | 174 | no | function requireSession(sessionsDir, id, uri) { |
| dir | const | 175 | no | const dir = sessionPath(sessionsDir, id); |
| readDataset | function | 180 | no | async function readDataset(dir, name, query, uri) { |
| file | const | 182 | no | const file = path.resolve(dir, &#39;datasets&#39;, `${name}.jsonl`); |
| root | const | 183 | no | const root = path.resolve(dir, &#39;datasets&#39;) + path.sep; |
| offset | const | 187 | no | const offset = integerQuery(query.offset, &#39;offset&#39;, 0, 1_000_000, 0); |
| limit | const | 188 | no | const limit = integerQuery(query.limit, &#39;limit&#39;, DEFAULT_LIMIT, MAX_LIMIT, 1); |
| items | const | 189 | no | const items = []; |
| bytes | variable | 190 | no | let bytes = 0; |
| truncated | variable | 191 | no | let truncated = false; |
| dataset | const | 192 | no | const dataset = new Dataset(file); |
| encoded | const | 194 | no | const encoded = JSON.stringify(row); |
| readKnowledge | function | 210 | no | function readKnowledge(dir) { |
| outcome | const | 211 | no | const outcome = readJsonFile(kvFile(dir, &#39;KNOWLEDGE_STATUS&#39;), 256 * 1024); |
| model | const | 212 | no | const model = readJsonFile(kvFile(dir, &#39;MODEL&#39;), MAX_TEXT); |
| hypotheses | const | 213 | no | const hypotheses = readJsonFile(kvFile(dir, &#39;HYPOTHESES&#39;), MAX_TEXT); |
| corpus | const | 214 | no | const corpus = readJsonFile(kvFile(dir, &#39;CORPUS_STATS&#39;), 256 * 1024); |
| graph | const | 215 | no | const graph = readJsonFile(kvFile(dir, &#39;GRAPH&#39;), 2 * 1024 * 1024); |
| modelValue | const | 216 | no | const modelValue = model &amp;&amp; model.truncated ? { truncated: true, bytes: model.bytes } : model; |
| available | const | 217 | no | const available = !!modelValue &amp;&amp; !modelValue.truncated &amp;&amp; !modelValue.unreadable &amp;&amp; !modelValue.error |
| readCaptureResource | function | 231 | yes | export async function readCaptureResource(sessionsDir, uri) { |
| parsed | const | 232 | no | const parsed = parseResourceUri(uri); |
| value | variable | 233 | no | let value; |
| dir | const | 237 | no | const dir = requireSession(sessionsDir, parsed.id, uri); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| ../store/session.mjs | import | 4 | [studio/src/store/session.mjs](../store/session.mjs.md) |
| ./jsonrpc.mjs | import | 5 | [studio/src/mcp/jsonrpc.mjs](./jsonrpc.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/mcp/server-stdio.mjs](./server-stdio.mjs.md) | ./resources.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// MCP resources for saved captures. Reads files in place; does not create session directories.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { Dataset, listSessions } from '../store/session.mjs';
import { ErrorCode, RpcError } from './jsonrpc.mjs';

const PAGE = 100;
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/;
const MAX_TEXT = 1_000_000;
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function sessionPath(sessionsDir, id) {
  if (typeof id !== 'string' || !NAME.test(id)) return null;
  const root = path.resolve(sessionsDir);
  const dir = path.resolve(root, id);
  const prefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (!dir.startsWith(prefix)) return null;
  if (!existsSync(path.join(dir, 'session.json'))) return null;
  return dir;
}

function encodeId(id) {
  return encodeURIComponent(id);
}

export function resourceUri(kind, id, dataset) {
  if (kind === 'sessions') return 'capture-studio://sessions';
  const base = `capture-studio://sessions/${encodeId(id)}`;
  if (kind === 'session') return base;
  if (kind === 'datasets') return `${base}/datasets`;
  if (kind === 'dataset') return `${base}/datasets/${encodeId(dataset)}`;
  if (kind === 'knowledge') return `${base}/knowledge`;
  return base;
}

function datasetsOf(dir) {
  const folder = path.join(dir, 'datasets');
  if (!existsSync(folder)) return [];
  const items = [];
  for (const file of readdirSync(folder)) {
    if (!file.endsWith('.jsonl')) continue;
    const name = file.slice(0, -6);
    if (!NAME.test(name)) continue;
    try { items.push({ name, bytes: statSync(path.join(folder, file)).size }); }
    catch { /* skip a raced delete */ }
  }
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

function readJsonFile(file, maxBytes) {
  if (!existsSync(file)) return null;
  let size = 0;
  try { size = statSync(file).size; }
  catch { return { unreadable: true }; }
  if (size > maxBytes) return { truncated: true, bytes: size };
  try { return JSON.parse(readFileSync(file, 'utf8')); }
  catch { return { unreadable: true }; }
}

function kvFile(dir, key) {
  return path.join(dir, 'kv', `${key}.json`);
}

function boundText(value) {
  const text = JSON.stringify(value);
  if (text.length <= MAX_TEXT) return text;
  return JSON.stringify({
    truncated: true,
    bytes: Buffer.byteLength(text),
    note: 'Resource exceeded the stdio size cap. Read a narrower dataset page or call the matching tool.',
    keys: value && typeof value === 'object' ? Object.keys(value) : [],
  });
}

function parseResourceUri(uri) {
  if (typeof uri !== 'string' || !uri || uri.length > 2048) {
    throw new RpcError(ErrorCode.InvalidParams, 'Resource uri is required');
  }
```

_First 80 of 251 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
