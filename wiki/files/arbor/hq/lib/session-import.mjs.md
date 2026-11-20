# File: hq/lib/session-import.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/session-import.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13089 B |
| Lines | 365 |
| Hash | cfff0f4b3de0 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SESSION_IMPORT_SCHEMA | const | 16 | yes | export const SESSION_IMPORT_SCHEMA = &#39;hq.session-import/1&#39;; |
| EXPORT_SCHEMA | const | 19 | no | const EXPORT_SCHEMA = &#39;opencode.session/1&#39;; |
| MAX_IMPORT_BYTES | const | 21 | no | const MAX_IMPORT_BYTES = 64 * 1024 * 1024; |
| SESSION_FILE_PATTERN | const | 23 | no | const SESSION_FILE_PATTERN = /^ses_[A-Za-z0-9]+\\.json$/; |
| NON_CONTENT_TYPES | const | 25 | no | const NON_CONTENT_TYPES = new Set([&#39;synthetic&#39;, &#39;system&#39;, &#39;idle&#39;, &#39;model-switched&#39;]); |
| CONTENT_BLOCK_TYPES | const | 27 | no | const CONTENT_BLOCK_TYPES = new Set([&#39;text&#39;, &#39;reasoning&#39;, &#39;tool&#39;]); |
| MAX_REDACT_DEPTH | const | 29 | no | const MAX_REDACT_DEPTH = 8; |
| SECRET_PATTERNS | const | 36 | no | const SECRET_PATTERNS = Object.freeze([ [/\\bsk-[A-Za-z0-9_-]{16,}/g, &#39;sk-[REDACTED]&#39;], [/\\b(?:ghp\|gho\|ghs\|ghu\|github_pat)_[A-Za-z0-9_]{16,}/g, &#39;[REDACTED_GITHUB_TOKEN]&#39;], [/\\bxox[baprs]-[A-Za-z0-9-]{… |
| numOrNull | function | 48 | no | function numOrNull(value) { |
| n | const | 50 | no | const n = Number(value); |
| str | function | 54 | no | function str(value) { |
| trimmed | const | 56 | no | const trimmed = value.trim(); |
| isoFrom | function | 61 | no | function isoFrom(value) { |
| date | const | 64 | no | const date = new Date(value); |
| raw | const | 68 | no | const raw = value.trim(); |
| date | const | 71 | no | const date = new Date(raw); |
| modelOf | function | 78 | no | function modelOf(value) { |
| direct | const | 79 | no | const direct = str(value); |
| scrubSecrets | function | 87 | no | function scrubSecrets(value) { |
| out | variable | 89 | no | let out = value; |
| scrubDeep | function | 94 | no | function scrubDeep(value, depth = 0) { |
| out | const | 100 | no | const out = {}; |
| safeText | function | 109 | no | function safeText(value) { |
| adaptInfo | function | 118 | no | function adaptInfo(session) { |
| info | const | 119 | no | const info = { |
| time | const | 132 | no | const time = {}; |
| created | const | 133 | no | const created = isoFrom(session.time_created); |
| updated | const | 134 | no | const updated = isoFrom(session.time_updated); |
| adaptContentBlocks | function | 141 | no | function adaptContentBlocks(content) { |
| parts | const | 142 | no | const parts = []; |
| text | const | 148 | no | const text = safeText(block.text); |
| state | const | 153 | no | const state = block.state &amp;&amp; typeof block.state === &#39;object&#39; ? scrubDeep(block.state) : {}; |
| adaptMessage | function | 163 | no | function adaptMessage(entry, sessionInfo) { |
| id | const | 168 | no | const id = str(entry.id); |
| seq | const | 171 | no | const seq = numOrNull(entry.seq); |
| created | const | 172 | no | const created = isoFrom(entry.timeCreated) ?? isoFrom(entry.data?.time?.created); |
| role | const | 173 | no | const role = type === &#39;user&#39; ? &#39;user&#39; : &#39;assistant&#39;; |
| info | const | 174 | no | const info = { id, role }; |
| text | const | 179 | no | const text = safeText(entry.data?.text) ?? &#39;&#39;; |
| model | const | 189 | no | const model = modelOf(entry.data?.model) ?? sessionInfo.model; |
| agent | const | 190 | no | const agent = str(entry.data?.agent) ?? sessionInfo.agent; |
| adaptSessionExport | function | 201 | yes | export function adaptSessionExport(doc) { |
| session | const | 204 | no | const session = doc.session; |
| info | const | 206 | no | const info = adaptInfo(session); |
| messages | const | 208 | no | const messages = []; |
| adapted | const | 210 | no | const adapted = adaptMessage(entry, info); |
| withTokenTotals | function | 221 | no | function withTokenTotals(info) { |
| tokens | const | 222 | no | const tokens = { |
| emptyFileResult | function | 233 | no | function emptyFileResult(file) { |
| messageOf | function | 239 | no | function messageOf(error) { |
| importSessionFile | function | 252 | yes | export function importSessionFile(db, filePath, { project = null, source = &#39;session-export&#39; } = {}) { |
| file | const | 253 | no | const file = String(filePath ?? &#39;&#39;); |
| result | const | 254 | no | const result = emptyFileResult(file); |
| size | variable | 256 | no | let size = null; |
| stat | const | 258 | no | const stat = statSync(file); |
| raw | variable | 266 | no | let raw; |
| doc | variable | 273 | no | let doc; |
| adapted | const | 280 | no | const adapted = adaptSessionExport(doc); |
| ingested | variable | 283 | no | let ingested; |
| messages | const | 300 | no | const messages = Number(ingested?.messages) \|\| 0; |
| parts | const | 301 | no | const parts = Number(ingested?.parts) \|\| 0; |
| importSessionDirectory | function | 322 | yes | export function importSessionDirectory(db, dir, { project = null, source = &#39;session-export&#39;, limit = 0, } = {}) { |
| directory | const | 325 | no | const directory = String(dir ?? &#39;&#39;); |
| summary | const | 326 | no | const summary = { |
| names | variable | 337 | no | let names; |
| stat | const | 339 | no | const stat = statSync(directory); |
| candidates | const | 346 | no | const candidates = names.filter((name) =&gt; SESSION_FILE_PATTERN.test(name)).sort(); |
| max | const | 347 | no | const max = Number.isFinite(Number(limit)) &amp;&amp; Number(limit) &gt; 0 ? Math.floor(Number(limit)) : 0; |
| selected | const | 348 | no | const selected = max &gt; 0 ? candidates.slice(0, max) : candidates; |
| fileResult | const | 351 | no | const fileResult = importSessionFile(db, join(directory, name), { project, source }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 12 | external |
| node:path | import | 13 | external |
| ./sessions.mjs | import | 14 | [hq/lib/sessions.mjs](./sessions.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/session-import.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Import exported OpenCode session files (`opencode.session/1`) into HQ session tables. |
| 3 | owner | hq | — | hq |
| 4 | task | — | — | LAB-01 |
| 5 | invariant | — | — | Adapt only: persistence is delegated to ingestSession() in ./sessions.mjs. |
| 6 | invariant | — | — | Never throw for a bad file: unreadable/invalid/foreign/oversized input becomes an error string. |
| 7 | invariant | — | — | Deterministic: directory imports sort by file name; message seq order is preserved; no clock in outputs. |
| 8 | invariant | — | — | Never store raw credential-shaped values: local prefix scrub + ingestSession redaction both apply. |
| 9 | see | — | hq/lib/sessions.mjs | hq/lib/sessions.mjs |
| 10 | see | — | docs/SESSION-SEARCH-RECIPE.md | docs/SESSION-SEARCH-RECIPE.md |
| 32 | why | — | — | redactSecrets() (sessions.mjs) strips assignments, bearer values and |
| 106 | why | — | — | part text is stored by importPart() without redaction, so the same |
| 181 | why | — | — | importMessage() reads the message body from `info.text`, while the |
| 217 | why | — | — | sessionPatchFromInfo() reads token totals through `info.tokens`, so |

## Excerpt

```javascript
/**
 * @hq:context Import exported OpenCode session files (`opencode.session/1`) into HQ session tables.
 * @hq:owner hq
 * @hq:task LAB-01
 * @hq:invariant Adapt only: persistence is delegated to ingestSession() in ./sessions.mjs.
 * @hq:invariant Never throw for a bad file: unreadable/invalid/foreign/oversized input becomes an error string.
 * @hq:invariant Deterministic: directory imports sort by file name; message seq order is preserved; no clock in outputs.
 * @hq:invariant Never store raw credential-shaped values: local prefix scrub + ingestSession redaction both apply.
 * @hq:see hq/lib/sessions.mjs
 * @hq:see docs/SESSION-SEARCH-RECIPE.md
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ingestSession, redactSecrets } from './sessions.mjs';

export const SESSION_IMPORT_SCHEMA = 'hq.session-import/1';

/** Export schema this importer understands. */
const EXPORT_SCHEMA = 'opencode.session/1';
/** Hard cap for one export file (64 MiB). Larger files are refused before reading. */
const MAX_IMPORT_BYTES = 64 * 1024 * 1024;
/** Only real session exports are candidates; index.json and anything else is ignored. */
const SESSION_FILE_PATTERN = /^ses_[A-Za-z0-9]+\.json$/;
/** Export message types that carry no user/assistant content. */
const NON_CONTENT_TYPES = new Set(['synthetic', 'system', 'idle', 'model-switched']);
/** Content block types mapped to session parts. */
const CONTENT_BLOCK_TYPES = new Set(['text', 'reasoning', 'tool']);
/** Deep-redaction depth guard, mirroring the sessions module. */
const MAX_REDACT_DEPTH = 8;

/**
 * @hq:why redactSecrets() (sessions.mjs) strips assignments, bearer values and
 * secret paths, but a bare provider key such as `sk-…` inside prose is not an
 * assignment. These prefix patterns close that gap before anything is stored.
 */
const SECRET_PATTERNS = Object.freeze([
  [/\bsk-[A-Za-z0-9_-]{16,}/g, 'sk-[REDACTED]'],
  [/\b(?:ghp|gho|ghs|ghu|github_pat)_[A-Za-z0-9_]{16,}/g, '[REDACTED_GITHUB_TOKEN]'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/g, '[REDACTED_SLACK_TOKEN]'],
  [/\bAKIA[0-9A-Z]{16}\b/g, '[REDACTED_AWS_KEY]'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]'],
]);

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function numOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** Epoch ms (or a parseable date string) to ISO; anything unparseable is omitted. */
function isoFrom(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === 'string') {
    const raw = value.trim();
    if (raw === '') return null;
    if (/^\d+$/.test(raw)) return isoFrom(Number(raw));
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

/** `model` may be a plain id or the export's `{ id, providerID }` object. */
function modelOf(value) {
  const direct = str(value);
  if (direct) return direct;
```

_First 80 of 366 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
