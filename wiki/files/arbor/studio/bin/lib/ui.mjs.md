# File: studio/bin/lib/ui.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/lib/ui.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9057 B |
| Lines | 139 |
| Hash | f44985127871 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CliError | class | 6 | yes | export class CliError extends Error { |
| constructor | method | 7 | yes | constructor(message, { exit = EXIT.ERROR, code = &#39;ERROR&#39;, hint = null, details = null } = {}) { |
| notFound | function | 13 | yes | export const notFound = (message, hint) =&gt; new CliError(message, { exit: EXIT.NOT_FOUND, code: &#39;NOT_FOUND&#39;, hint }); |
| usageError | function | 14 | yes | export const usageError = (message, hint) =&gt; new CliError(message, { exit: EXIT.USAGE, code: &#39;USAGE&#39;, hint }); |
| integrityError | function | 15 | yes | export const integrityError = (message, hint) =&gt; new CliError(message, { exit: EXIT.INTEGRITY, code: &#39;INTEGRITY&#39;, hint }); |
| envError | function | 16 | yes | export const envError = (message, hint) =&gt; new CliError(message, { exit: EXIT.ENVIRONMENT, code: &#39;ENVIRONMENT&#39;, hint }); |
| fmtBytes | function | 21 | yes | export const fmtBytes = (n) =&gt; { |
| fmtMs | function | 25 | yes | export const fmtMs = (ms) =&gt; { |
| fmtPct | function | 29 | yes | export const fmtPct = (x, digits = 0) =&gt; (Number.isFinite(x) ? `${(x * 100).toFixed(digits)}%` : &#39;-&#39;); |
| fmtAgo | function | 30 | yes | export function fmtAgo(iso, now = Date.now()) { |
| t | const | 31 | no | const t = Date.parse(iso); |
| s | const | 33 | no | const s = Math.max(0, Math.round((now - t) / 1000)); |
| truncate | function | 36 | yes | export const truncate = (s, n) =&gt; { s = String(s ?? &#39;&#39;); return s.length &gt; n ? `${s.slice(0, Math.max(0, n - 1))}…` : s; }; |
| oneLine | function | 37 | yes | export const oneLine = (s) =&gt; String(s ?? &#39;&#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| parseSince | function | 40 | yes | export function parseSince(text, now = Date.now()) { |
| m | const | 41 | no | const m = /^(\\d+(?:\\.\\d+)?)\\s*([smhdw])$/i.exec(String(text).trim()); |
| t | const | 43 | no | const t = Date.parse(text); |
| ANSI | const | 51 | no | const ANSI = { bold: 1, dim: 2, red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, cyan: 36, gray: 90 }; |
| createOutput | function | 53 | yes | export function createOutput({ json = false, quiet = false, color = &#39;auto&#39;, verbose = false, stdout = process.stdout, stderr = process.stderr } = {}) { |
| useColor | const | 54 | no | const useColor = !json &amp;&amp; color !== &#39;never&#39; &amp;&amp; !process.env.NO_COLOR &amp;&amp; (color === &#39;always&#39; \|\| (stdout.isTTY &amp;&amp; process.env.TERM !== &#39;dumb&#39;)); |
| paint | function | 55 | no | const paint = (name) =&gt; (s) =&gt; (useColor ? `\\x1b[${ANSI[name]}m${s}\\x1b[0m` : String(s)); |
| c | const | 56 | no | const c = Object.fromEntries(Object.keys(ANSI).map((k) =&gt; [k, paint(k)])); |
| width | function | 57 | no | const width = () =&gt; Math.max(60, Math.min(stdout.columns \|\| 120, 200)); |
| out | const | 58 | no | const out = { |
| entries | const | 77 | no | const entries = pairs.filter(([, v]) =&gt; v !== undefined &amp;&amp; v !== null &amp;&amp; v !== &#39;&#39;); |
| w | const | 78 | no | const w = Math.max(0, ...entries.map(([k]) =&gt; k.length)); |
| cols | const | 84 | no | const cols = columns.map((col) =&gt; ({ max: 60, ...col })); |
| cell | function | 85 | no | const cell = (row, col) =&gt; oneLine(col.get ? col.get(row) : row[col.key]); |
| cells | const | 86 | no | const cells = rows.map((r) =&gt; cols.map((col) =&gt; cell(r, col))); |
| widths | const | 87 | no | const widths = cols.map((col, i) =&gt; Math.min(col.max, Math.max(col.title.length, ...cells.map((r) =&gt; r[i].length)))); |
| budget | const | 88 | no | const budget = width() - indent - 2 * (cols.length - 1); |
| i | const | 90 | no | const i = widths.indexOf(Math.max(...widths)); |
| fmt | function | 94 | no | const fmt = (vals, bold) =&gt; &#39; &#39;.repeat(indent) + vals.map((v, i) =&gt; { const t = truncate(v, widths[i]); return cols[i].align === &#39;right&#39; ? t.padStart(widths[i]) : (i === vals.length - 1 ? t : t.padEn… |
| t | const | 95 | no | const t = truncate(v, widths[i]); |
| reportError | function | 108 | yes | export function reportError(err, out) { |
| e | const | 109 | no | const e = err instanceof CliError ? err : toCliError(err); |
| red | const | 113 | no | const red = out ? out.c.red : (s) =&gt; s; |
| toCliError | function | 122 | yes | export function toCliError(err) { |
| msg | const | 123 | no | const msg = String(err?.message ?? err); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../src/config.mjs | import | 4 | [studio/src/config.mjs](../../src/config.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/ask.mjs](../commands/ask.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/atoms.mjs](../commands/atoms.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/bridge.mjs](../commands/bridge.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/campaign.mjs](../commands/campaign.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/capture.mjs](../commands/capture.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/chat.mjs](../commands/chat.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/companion.mjs](../commands/companion.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/drive.mjs](../commands/drive.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/export.mjs](../commands/export.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/knowledge.mjs](../commands/knowledge.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/learn.mjs](../commands/learn.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/library.mjs](../commands/library.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/mirror.mjs](../commands/mirror.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/personal-agent.mjs](../commands/personal-agent.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/platform.mjs](../commands/platform.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/profiles.mjs](../commands/profiles.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/providers.mjs](../commands/providers.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/recipes.mjs](../commands/recipes.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/relay.mjs](../commands/relay.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/replay.mjs](../commands/replay.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/run.mjs](../commands/run.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/sessions.mjs](../commands/sessions.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/setup.mjs](../commands/setup.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/state.mjs](../commands/state.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/system.mjs](../commands/system.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/tools.mjs](../commands/tools.mjs.md) | ../lib/ui.mjs |
| [studio/bin/commands/wrap.mjs](../commands/wrap.mjs.md) | ../lib/ui.mjs |
| [studio/bin/lib/args.mjs](./args.mjs.md) | ./ui.mjs |
| [studio/bin/lib/capabilities.mjs](./capabilities.mjs.md) | ./ui.mjs |
| [studio/bin/lib/context.mjs](./context.mjs.md) | ./ui.mjs |
| [studio/bin/lib/query.mjs](./query.mjs.md) | ./ui.mjs |
| [studio/bin/lib/registry.mjs](./registry.mjs.md) | ./ui.mjs |
| [studio/bin/lib/util.mjs](./util.mjs.md) | ./ui.mjs |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./lib/ui.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Terminal output helpers: consistent human/JSON output, tables, colors, errors.
// Contract: with --json, stdout carries exactly the command's JSON result (or NDJSON where a
// command streams rows); progress, warnings and errors always go to stderr.
import { EXIT } from '../../src/config.mjs';

export class CliError extends Error {
  constructor(message, { exit = EXIT.ERROR, code = 'ERROR', hint = null, details = null } = {}) {
    super(message);
    this.name = 'CliError';
    this.exit = exit; this.code = code; this.hint = hint; this.details = details;
  }
}
export const notFound = (message, hint) => new CliError(message, { exit: EXIT.NOT_FOUND, code: 'NOT_FOUND', hint });
export const usageError = (message, hint) => new CliError(message, { exit: EXIT.USAGE, code: 'USAGE', hint });
export const integrityError = (message, hint) => new CliError(message, { exit: EXIT.INTEGRITY, code: 'INTEGRITY', hint });
export const envError = (message, hint) => new CliError(message, { exit: EXIT.ENVIRONMENT, code: 'ENVIRONMENT', hint });

// ---------------------------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------------------------
export const fmtBytes = (n) => {
  n = Number(n) || 0;
  return n >= 1073741824 ? `${(n / 1073741824).toFixed(2)} GB` : n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n >= 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`;
};
export const fmtMs = (ms) => {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return '-';
  return ms >= 60000 ? `${Math.floor(ms / 60000)}m${String(Math.round((ms % 60000) / 1000)).padStart(2, '0')}s` : ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
};
export const fmtPct = (x, digits = 0) => (Number.isFinite(x) ? `${(x * 100).toFixed(digits)}%` : '-');
export function fmtAgo(iso, now = Date.now()) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '-';
  const s = Math.max(0, Math.round((now - t) / 1000));
  return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`;
}
export const truncate = (s, n) => { s = String(s ?? ''); return s.length > n ? `${s.slice(0, Math.max(0, n - 1))}…` : s; };
export const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

// "30d", "12h", "90m", "45s", "2w" or an ISO date -> epoch ms cutoff (now - duration).
export function parseSince(text, now = Date.now()) {
  const m = /^(\d+(?:\.\d+)?)\s*([smhdw])$/i.exec(String(text).trim());
  if (m) return now - Number(m[1]) * { s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5 }[m[2].toLowerCase()];
  const t = Date.parse(text);
  if (!Number.isFinite(t)) throw usageError(`"${text}" is not a duration (30d, 12h, 90m) or ISO date.`);
  return t;
}

// ---------------------------------------------------------------------------------------------
// Output object
// ---------------------------------------------------------------------------------------------
const ANSI = { bold: 1, dim: 2, red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, cyan: 36, gray: 90 };

export function createOutput({ json = false, quiet = false, color = 'auto', verbose = false, stdout = process.stdout, stderr = process.stderr } = {}) {
  const useColor = !json && color !== 'never' && !process.env.NO_COLOR && (color === 'always' || (stdout.isTTY && process.env.TERM !== 'dumb'));
  const paint = (name) => (s) => (useColor ? `\x1b[${ANSI[name]}m${s}\x1b[0m` : String(s));
  const c = Object.fromEntries(Object.keys(ANSI).map((k) => [k, paint(k)]));
  const width = () => Math.max(60, Math.min(stdout.columns || 120, 200));
  const out = {
    json, quiet, verbose, c, width,
    // Human line on stdout (suppressed under --json and --quiet).
    line(s = '') { if (!json && !quiet) stdout.write(`${s}\n`); },
    // Always printed in human mode even with --quiet (the command's primary answer).
    result(s = '') { if (!json) stdout.write(`${s}\n`); },
    // Raw bytes on stdout (export to '-', replay): never decorated.
    raw(s) { stdout.write(s); },
    info(s) { if (!quiet) stderr.write(`${s}\n`); },
    warn(s) { stderr.write(`${c.yellow('warning:')} ${s}\n`); },
    progress(s) { if (!quiet && stderr.isTTY) stderr.write(`\r${s}`); },
    progressDone() { if (!quiet && stderr.isTTY) stderr.write('\n'); },
    // Emit one result: JSON document under --json, otherwise the human renderer.
    emit(data, human) {
      if (json) stdout.write(`${JSON.stringify(data, null, 2)}\n`);
      else if (human) human(out);
    },
    ndjson(rows) { for (const r of rows) stdout.write(`${JSON.stringify(r)}\n`); },
    kv(pairs, indent = 2) {
      const entries = pairs.filter(([, v]) => v !== undefined && v !== null && v !== '');
      const w = Math.max(0, ...entries.map(([k]) => k.length));
      for (const [k, v] of entries) out.line(`${' '.repeat(indent)}${c.dim(k.padEnd(w))}  ${v}`);
    },
```

_First 80 of 140 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
