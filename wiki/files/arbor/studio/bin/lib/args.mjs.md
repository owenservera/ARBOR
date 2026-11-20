# File: studio/bin/lib/args.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/lib/args.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5797 B |
| Lines | 125 |
| Hash | 5a835ccbb9a7 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| levenshtein | function | 8 | yes | export function levenshtein(a, b) { |
| m | const | 9 | no | const m = a.length, n = b.length; |
| prev | variable | 11 | no | let prev = Array.from({ length: n + 1 }, (_, i) =&gt; i); |
| cur | const | 13 | no | const cur = [i]; |
| closest | function | 20 | yes | export function closest(word, candidates, max = 3) { |
| w | const | 21 | no | const w = String(word).toLowerCase(); |
| indexSpec | function | 28 | no | function indexSpec(spec) { |
| byLong | const | 29 | no | const byLong = new Map(Object.entries(spec)); |
| byShort | const | 30 | no | const byShort = new Map(); |
| usage | function | 35 | no | const usage = (message, hint) =&gt; new CliError(message, { exit: EXIT.USAGE, code: &#39;USAGE&#39;, hint }); |
| coerce | function | 37 | no | function coerce(name, def, raw) { |
| n | const | 39 | no | const n = Number(raw); |
| leadingWords | function | 51 | yes | export function leadingWords(argv, globalSpec, count = 2) { |
| words | const | 53 | no | const words = []; |
| a | const | 55 | no | const a = argv[i]; |
| name | const | 58 | no | const name = a.slice(2).split(&#39;=&#39;)[0].replace(/^no-/, &#39;&#39;); |
| parseArgv | function | 69 | yes | export function parseArgv(argv, spec, { command = &#39;&#39; } = {}) { |
| flags | const | 71 | no | const flags = {}, positional = []; |
| unknown | function | 72 | no | const unknown = (shown, names) =&gt; { |
| near | const | 73 | no | const near = closest(shown, names); |
| a | const | 78 | no | const a = argv[i]; |
| eq | const | 81 | no | const eq = a.indexOf(&#39;=&#39;); |
| name | variable | 82 | no | let name = (eq &lt; 0 ? a.slice(2) : a.slice(2, eq)); |
| inline | const | 83 | no | const inline = eq &lt; 0 ? undefined : a.slice(eq + 1); |
| negate | variable | 84 | no | let negate = false; |
| raw | variable | 96 | no | let raw = inline; |
| next | const | 98 | no | const next = argv[i + 1]; |
| chars | const | 107 | no | const chars = a.slice(1); |
| long | const | 109 | no | const long = byShort.get(chars[k]); |
| raw | variable | 113 | no | let raw = chars.slice(k + 1) \|\| argv[++i]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./ui.mjs | import | 5 | [studio/bin/lib/ui.mjs](./ui.mjs.md) |
| ../../src/config.mjs | import | 6 | [studio/src/config.mjs](../../src/config.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/lib/registry.mjs](./registry.mjs.md) | ./args.mjs |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./lib/args.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Small, strict argument parser (zero dependencies).
//   --flag  --flag=value  --flag value  --no-flag  -f  -f value  -abc (boolean cluster)  --  (end of flags)
// Flag spec: { type: 'boolean'|'string'|'number'|'list', alias, desc, choices, valueName, default }
// Unspecified flags stay undefined so callers can tell "not given" from "false".
import { CliError } from './ui.mjs';
import { EXIT } from '../../src/config.mjs';

export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

export function closest(word, candidates, max = 3) {
  const w = String(word).toLowerCase();
  return candidates
    .map((c) => ({ c, d: c.toLowerCase().startsWith(w) || w.startsWith(c.toLowerCase()) ? 0 : levenshtein(w, c.toLowerCase()) }))
    .filter((x) => x.d <= Math.max(2, Math.floor(w.length / 3)))
    .sort((a, b) => a.d - b.d).slice(0, max).map((x) => x.c);
}

function indexSpec(spec) {
  const byLong = new Map(Object.entries(spec));
  const byShort = new Map();
  for (const [name, def] of byLong) if (def.alias) byShort.set(def.alias, name);
  return { byLong, byShort };
}

const usage = (message, hint) => new CliError(message, { exit: EXIT.USAGE, code: 'USAGE', hint });

function coerce(name, def, raw) {
  if (def.type === 'number') {
    const n = Number(raw);
    if (raw === '' || !Number.isFinite(n)) throw usage(`--${name} expects a number, got "${raw}".`);
    return n;
  }
  if (def.choices && !def.choices.includes(String(raw))) {
    throw usage(`--${name} must be one of: ${def.choices.join(', ')} (got "${raw}").`);
  }
  return String(raw);
}

// Skim argv for the leading positional words (command + subcommand) without knowing the command's
// own flags yet. Global string flags consume their value; unknown flags are assumed boolean.
export function leadingWords(argv, globalSpec, count = 2) {
  const { byLong, byShort } = indexSpec(globalSpec);
  const words = [];
  for (let i = 0; i < argv.length && words.length < count; i++) {
    const a = argv[i];
    if (a === '--') { words.push(...argv.slice(i + 1, i + 1 + count - words.length)); break; }
    if (a.startsWith('--')) {
      const name = a.slice(2).split('=')[0].replace(/^no-/, '');
      const def = byLong.get(name);
      if (def && def.type !== 'boolean' && !a.includes('=')) i++;
    } else if (a.startsWith('-') && a.length > 1) {
      const def = byLong.get(byShort.get(a.slice(1, 2)));
      if (def && def.type !== 'boolean' && a.length === 2) i++;
    } else words.push(a);
  }
  return words;
}

export function parseArgv(argv, spec, { command = '' } = {}) {
  const { byLong, byShort } = indexSpec(spec);
  const flags = {}, positional = [];
  const unknown = (shown, names) => {
    const near = closest(shown, names);
    return usage(`Unknown option ${shown.length === 1 ? '-' : '--'}${shown}${command ? ` for "${command}"` : ''}.`,
      near.length ? `Did you mean ${near.map((n) => `--${n}`).join(' or ')}?` : `Run "studio help ${command}".`.trim());
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') { positional.push(...argv.slice(i + 1)); break; }
    if (a.startsWith('--')) {
```

_First 80 of 126 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
