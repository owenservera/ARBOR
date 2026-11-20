# File: hq/lib/protocol.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/protocol.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 19684 B |
| Lines | 515 |
| Hash | 0b3763512c25 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROTOCOL_VERSION | const | 10 | yes | export const PROTOCOL_VERSION = 1; |
| ANNOTATION_KINDS | const | 12 | yes | export const ANNOTATION_KINDS = [ |
| renderAgentProtocol | function | 27 | yes | export function renderAgentProtocol({ workspace } = {}) { |
| name | const | 28 | no | const name = String(workspace ?? &#39;&#39;).trim() \|\| &#39;this workspace&#39;; |
| invariantLines | const | 29 | no | const invariantLines = VIVIM_TAXONOMY.invariants.map((rule) =&gt; `- ${rule}`); |
| writeAgentProtocol | function | 117 | yes | export function writeAgentProtocol(root) { |
| base | const | 118 | no | const base = resolve(String(root)); |
| text | const | 119 | no | const text = renderAgentProtocol({ workspace: basename(base) }); |
| path | const | 120 | no | const path = join(base, &#39;hq&#39;, &#39;AGENT-PROTOCOL.md&#39;); |
| SEVERITY_RANK | const | 130 | no | const SEVERITY_RANK = { error: 0, warning: 1, info: 2 }; |
| SECRET_RE | const | 135 | no | const SECRET_RE = /(password\|passwd\|api[_-]?key\|secret\|token\|bearer)\\s*[:=]\\s*(\\S+)/i; |
| SECRET_BARE_MIN | const | 136 | no | const SECRET_BARE_MIN = 6; |
| looksLikeSecretValue | function | 140 | no | function looksLikeSecretValue(raw) { |
| value | const | 141 | no | const value = String(raw ?? &#39;&#39;).trim(); |
| quoted | const | 144 | no | const quoted = /^([&#39;&quot;`])([\\s\\S]*)\\1$/.exec(value); |
| bare | const | 146 | no | const bare = value.replace(/[.,;:!?)\\]}]+$/, &#39;&#39;); |
| MAX_LINT_BYTES | const | 153 | no | const MAX_LINT_BYTES = 1_500_000; |
| DOC_MARKERS | const | 155 | no | const DOC_MARKERS = [&#39;/**&#39;, &#39;///&#39;, &#39;#&#39;, &#39;&quot;&quot;&quot;&#39;, &#39;--&#39;]; |
| JS_LIKE | const | 157 | no | const JS_LIKE = new Set([ &#39;javascript&#39;, &#39;typescript&#39;, &#39;vue&#39;, &#39;svelte&#39;, &#39;go&#39;, &#39;rust&#39;, &#39;java&#39;, &#39;kotlin&#39;, &#39;scala&#39;, &#39;csharp&#39;, &#39;fsharp&#39;, &#39;vbnet&#39;, &#39;c&#39;, &#39;cpp&#39;, &#39;swift&#39;, &#39;php&#39;, &#39;graphql&#39;, &#39;protobuf&#39;, ]); |
| HASH_LIKE | const | 162 | no | const HASH_LIKE = new Set([&#39;python&#39;, &#39;ruby&#39;, &#39;shell&#39;, &#39;powershell&#39;, &#39;yaml&#39;, &#39;toml&#39;, &#39;ini&#39;]); |
| commentSyntax | function | 166 | no | function commentSyntax(lang) { |
| scanComments | function | 182 | no | function scanComments(lang, text) { |
| syntax | const | 183 | no | const syntax = commentSyntax(lang); |
| comments | const | 185 | no | const comments = []; |
| n | const | 186 | no | const n = text.length; |
| i | variable | 187 | no | let i = 0; |
| line | variable | 188 | no | let line = 1; |
| quote | variable | 189 | no | let quote = null; |
| block | variable | 190 | no | let block = null; |
| ch | const | 193 | no | const ch = text[i]; |
| endIdx | const | 196 | no | const endIdx = text.indexOf(block.end, i); |
| stop | const | 197 | no | const stop = endIdx === -1 ? n : endIdx; |
| chunk | const | 198 | no | const chunk = text.slice(i, stop); |
| body | const | 205 | no | const body = block.text.trim(); |
| opened | variable | 228 | no | let opened = false; |
| mark | variable | 239 | no | let mark = null; |
| endIdx | variable | 244 | no | let endIdx = text.indexOf(&#39;\\n&#39;, i); |
| body | const | 246 | no | const body = text.slice(i + mark.length, endIdx).trim(); |
| refTarget | function | 260 | no | function refTarget(ref) { |
| value | variable | 261 | no | let value = String(ref ?? &#39;&#39;).trim(); |
| severityOf | function | 270 | no | function severityOf(rule) { |
| compareFindings | function | 276 | no | function compareFindings(a, b) { |
| sa | const | 277 | no | const sa = SEVERITY_RANK[a.severity]; |
| sb | const | 278 | no | const sb = SEVERITY_RANK[b.severity]; |
| hasDocAbove | function | 287 | no | function hasDocAbove(lines, line) { |
| prev | const | 289 | no | const prev = String(lines[line - 2] ?? &#39;&#39;).trim(); |
| lintProtocol | function | 309 | yes | export function lintProtocol({ db, root, projects = [], project = null, |
| cap | const | 319 | no | const cap = Number.isFinite(Number(maxFindings)) |
| allowed | const | 323 | no | const allowed = new Set(); |
| sql | variable | 329 | no | let sql = ` |
| params | const | 335 | no | const params = []; |
| rows | const | 342 | no | const rows = db.prepare(sql).all(...params) |
| knownPaths | const | 347 | no | const knownPaths = new Set(); |
| p | const | 349 | no | const p = toPosix(row.path); |
| segments | const | 351 | no | const segments = p.split(&#39;/&#39;).filter(Boolean); |
| baselineCache | const | 355 | no | const baselineCache = new Map(); |
| baseline | function | 356 | no | function baseline(row) { |
| commit | const | 358 | no | const commit = db.prepare(&#39;SELECT MAX(date) AS d FROM commits WHERE project_id = ?&#39;).get(row.project_id); |
| commitMs | const | 359 | no | const commitMs = commit &amp;&amp; commit.d ? Date.parse(commit.d) : NaN; |
| indexedMs | const | 360 | no | const indexedMs = row.indexed_at ? Date.parse(row.indexed_at) : NaN; |
| value | const | 361 | no | const value = { |
| textCache | const | 369 | no | const textCache = new Map(); |
| fileText | function | 370 | no | function fileText(row) { |
| abs | const | 371 | no | const abs = row.abs_path \|\| (root ? join(root, row.path) : null); |
| text | variable | 374 | no | let text = null; |
| annStmt | const | 382 | no | const annStmt = db.prepare( &#39;SELECT line, kind, text, owner, ref FROM annotations WHERE file_id = ? ORDER BY line, id&#39;, ); |
| symStmt | const | 385 | no | const symStmt = db.prepare( `SELECT name, kind, line, end_line, signature, exported, doc FROM symbols WHERE file_id = ? ORDER BY line, name`, ); |
| findings | const | 390 | no | const findings = []; |
| fileCount | variable | 391 | no | let fileCount = 0; |
| mtime | const | 396 | no | const mtime = Number(row.mtime_ms) \|\| 0; |
| changed | const | 397 | no | const changed = (indexedMs === null &amp;&amp; commitMs === null) |
| rel | const | 404 | no | const rel = toPosix(row.path); |
| project | const | 405 | no | const project = row.project; |
| text | const | 406 | no | const text = fileText(row); |
| lines | const | 407 | no | const lines = text ? text.split(/\\r?\\n/) : null; |
| annotations | const | 408 | no | const annotations = annStmt.all(row.id); |
| symbols | const | 409 | no | const symbols = symStmt.all(row.id); |
| add | function | 411 | no | const add = (rule, line, message) =&gt; { |
| target | const | 437 | no | const target = refTarget(ann.ref); |
| headerInText | const | 447 | no | const headerInText = lines |
| start | const | 469 | no | const start = Number(sym.line) \|\| 0; |
| hasWhy | const | 472 | no | const hasWhy = annotations.some((a) =&gt; a.kind === &#39;why&#39; &amp;&amp; a.line &gt;= start &amp;&amp; a.line &lt;= end); |
| near | const | 483 | no | const near = annotations.some((a) =&gt; a.kind === &#39;see&#39; &amp;&amp; Math.abs(a.line - ann.line) &lt;= 2); |
| capped | const | 492 | no | const capped = findings.slice(0, cap); |
| counts | const | 496 | no | const counts = {}; |
| bySeverity | const | 497 | no | const bySeverity = { error: 0, warning: 0, info: 0 }; |
| byRule | const | 502 | no | const byRule = {}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |
| ./nomenclature.mjs | import | 7 | [hq/lib/nomenclature.mjs](./nomenclature.mjs.md) |
| ./util.mjs | import | 8 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/protocol.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/protocol.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/protocol.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 426 | todo | — | — | must name an owner. |
| 434 | see | — | — | must point at an indexed file. |
| 445 | context | — | — | . |

## Excerpt

````javascript
// hq/lib/protocol.mjs — the agent inline-comment protocol and its linter.
// CONTRACT (hq/CONTRACT.md): deterministic, dependency-free, local only.
// The protocol is the contract between a coding agent and the repo's own
// history: structured comments that say why, what must hold, and where to look.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { VIVIM_TAXONOMY } from './nomenclature.mjs';
import { toPosix } from './util.mjs';

export const PROTOCOL_VERSION = 1;

export const ANNOTATION_KINDS = [
  'context', 'why', 'invariant', 'see', 'todo', 'owner', 'task', 'risk', 'deprecated',
];

// ---------------------------------------------------------------------------
// Protocol text
// ---------------------------------------------------------------------------

/**
 * Render the compact Markdown protocol handed to coding agents.
 * Deterministic: no clock, no absolute paths.
 *
 * @param {{workspace?: string}} [options]
 * @returns {string}
 */
export function renderAgentProtocol({ workspace } = {}) {
  const name = String(workspace ?? '').trim() || 'this workspace';
  const invariantLines = VIVIM_TAXONOMY.invariants.map((rule) => `- ${rule}`);
  return [
    `# Agent protocol (v${PROTOCOL_VERSION})`,
    '',
    `Workspace: ${name}`,
    '',
    'HQ reads these inline annotations to keep code context honest. They live in',
    'comments, next to the code they explain. Only explicit `@hq:` tags count;',
    'plain `TODO` comments are ignored by the linter.',
    '',
    '## File header',
    '',
    'Every source file longer than 20 lines starts with a header comment:',
    '',
    '```',
    '// @hq:context <what this file owns, one sentence>',
    '// @hq:owner <person or team>',
    '// @hq:task <task id or slug, only while the work is active>',
    '```',
    '',
    '## Annotation tags',
    '',
    '| Tag | Use it when |',
    '| --- | --- |',
    '| `@hq:context` | First lines of a file: what this file is for. |',
    '| `@hq:why` | A non-obvious decision, workaround or trade-off. |',
    '| `@hq:invariant` | A rule that must stay true: ordering, units, auth, bounds. |',
    '| `@hq:see` | A pointer to another file or line, e.g. `src/auth.mjs:42`. |',
    '| `@hq:todo` | Work deliberately left: `@hq:todo(owner): what remains`. |',
    '| `@hq:owner` | The person or team accountable for the code below. |',
    '| `@hq:task` | The task or ticket this code serves. |',
    '| `@hq:risk` | A known hazard: data loss, security, performance, migration. |',
    '| `@hq:deprecated` | Code being retired; always pair it with `@hq:see`. |',
    '',
    '## Comment quality',
    '',
    '- Say why, not what. The code already says what.',
    '- One idea per comment; keep lines under 120 characters.',
    '- No dates, no agent names, no "temporary" notes that outlive the change.',
    '- Update the annotation in the same change as the code it describes.',
    '- Give every exported symbol a doc comment on the line above:',
    '  `/** ... */`, `///`, `#`, `"""` or `--`.',
    '- Long units get a `@hq:why`; remove the comment when the reason is gone.',
    '- Point at real files with `@hq:see`; orphan refs are lint warnings.',
    '',
    '## Invariants',
    '',
    'These hold for every change, in every project:',
    '',
    ...invariantLines,
    '',
    'Annotations explain code; they never grant permission. Owner-facing surfaces',
````

_First 80 of 516 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
