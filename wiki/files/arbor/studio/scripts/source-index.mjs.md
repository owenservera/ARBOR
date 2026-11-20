# File: studio/scripts/source-index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/source-index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11073 B |
| Lines | 200 |
| Hash | 6a8ec8d5d348 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 6 | no | const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;..&#39;); |
| output | const | 7 | no | const output = &#39;docs/agents/CHATGPT-100-SOURCE-INDEX.json&#39;; |
| posix | function | 8 | no | const posix = (value) =&gt; value.split(path.sep).join(&#39;/&#39;); |
| sorted | function | 9 | no | const sorted = (object) =&gt; Object.fromEntries(Object.entries(object).sort(([a], [b]) =&gt; a &lt; b ? -1 : a &gt; b ? 1 : 0)); |
| existsFile | function | 10 | no | const existsFile = (file) =&gt; { try { return fs.statSync(file).isFile(); } catch { return false; } }; |
| walk | function | 12 | no | function walk(dir, result) { |
| entries | variable | 13 | no | let entries; |
| name | const | 17 | no | const name = posix(path.join(dir, entry.name)); |
| lex | function | 24 | no | function lex(text) { |
| code | const | 25 | no | const code = text.split(&#39;&#39;); |
| comments | const | 26 | no | const comments = []; |
| hide | function | 27 | no | const hide = (start, end) =&gt; { for (let j = start; j &lt; end; j++) if (code[j] !== &#39;\\n&#39; &amp;&amp; code[j] !== &#39;\\r&#39;) code[j] = &#39; &#39;; }; |
| i | variable | 28 | no | let i = 0; |
| start | const | 30 | no | const start = i; |
| quote | const | 39 | no | const quote = text[i++]; |
| indexFile | function | 47 | no | function indexFile(name, text) { |
| lineAt | function | 49 | no | const lineAt = (offset) =&gt; 1 + (text.slice(0, offset).match(/\\n/g) \|\| []).length; |
| declarations | const | 50 | no | const declarations = []; |
| add | function | 51 | no | const add = (symbol, kind, exported, offset) =&gt; declarations.push({ symbol, kind, exported, offset, line: lineAt(offset) }); |
| decl | const | 53 | no | const decl = /^(?:export\\s+)?(?:default\\s+)?(?:async\\s+)?(function\|const\|let\|var\|class)\\s+([A-Za-z_$][\\w$]*)(?=\\s*(?:\\(\|=\|\\{\|extends\\b))/gm; while ((match = decl.exec(code))) add(match[2], match[1], … |
| named | const | 55 | no | const named = /\\bexport\\s*\\{([^}]*)\\}/g; |
| part | const | 58 | no | const part = item.trim().match(/^([\\w$]+)(?:\\s+as\\s+([\\w$]+))?$/); |
| defaults | const | 62 | no | const defaults = /\\bexport\\s+default\\s+(?:async\\s+)?(?:function\\s+)?([A-Za-z_$][\\w$]*)/g; |
| common | const | 64 | no | const common = /\\bmodule\\s*\\.\\s*exports\\s*(?:\\.\\s*([\\w$]+)\\s*=\|=\\s*\\{([^}]*)\\})/g; |
| names | const | 66 | no | const names = match[1] ? [match[1]] : match[2].split(&#39;,&#39;).map((part) =&gt; part.trim().match(/^([\\w$]+)/)?.[1]).filter(Boolean); |
| docs | function | 70 | no | const docs = (offset) =&gt; { |
| cursor | variable | 71 | no | let cursor = offset; |
| index | variable | 72 | no | let index = comments.length - 1; |
| parts | const | 74 | no | const parts = []; |
| comment | const | 76 | no | const comment = comments[index]; |
| symbols | const | 85 | no | const symbols = {}; |
| key | const | 87 | no | const key = `${name}#${declaration.symbol}`; |
| previous | const | 88 | no | const previous = symbols[key]; |
| annotations | const | 92 | no | const annotations = []; |
| tagCount | variable | 93 | no | let tagCount = 0; |
| tags | const | 95 | no | const tags = /@serves\\s+(\\d{3}(?:\\s*(?:,\|-)\\s*\\d{3})*)/g; |
| ids | const | 98 | no | const ids = new Set(); |
| first | const | 102 | no | const first = Number(range[1]), last = Number(range[2] \|\| range[1]); |
| target | const | 105 | no | const target = declarations.find((declaration) =&gt; declaration.offset &gt;= comment.end); |
| key | const | 106 | no | const key = target ? `${name}#${target.symbol}` : name; |
| imports | const | 114 | no | const imports = new Set(); |
| importPattern | const | 116 | no | const importPattern = /\\b(?:import\\s*(?:\\([^)]*?\\)\|(?:[^;&#39;&quot;\\n]*?\\s+from\\s*)?[&#39;&quot;][^&#39;&quot;]+[&#39;&quot;])\|export\\s+(?:\\*\|\\{[^}]*\\})\\s+from\\s*[&#39;&quot;][^&#39;&quot;]+[&#39;&quot;]\|require\\s*\\(\\s*[&#39;&quot;][^&#39;&quot;]+[&#39;&quot;]\\s*\\))/g; |
| spec | const | 119 | no | const spec = match[0].match(/[&#39;&quot;]([^&#39;&quot;]+)[&#39;&quot;]/)?.[1]; |
| base | const | 121 | no | const base = spec.startsWith(&#39;/&#39;) ? path.resolve(root, `.${spec}`) : path.resolve(root, path.dirname(name), spec); |
| resolved | const | 122 | no | const resolved = [base, ...[&#39;.mjs&#39;, &#39;.js&#39;, &#39;.json&#39;].map((ext) =&gt; base + ext), ...[&#39;index.mjs&#39;, &#39;index.js&#39;, &#39;index.json&#39;].map((file) =&gt; path.join(base, file))].find(existsFile); |
| stars | const | 125 | no | const stars = []; |
| starPattern | const | 126 | no | const starPattern = /\\bexport\\s+\\*\\s+from\\s*[&#39;&quot;]([^&#39;&quot;]+)[&#39;&quot;]/g; |
| build | function | 131 | no | function build() { |
| paths | const | 132 | no | const paths = []; |
| files | const | 134 | no | const files = {}, keys = {}, serves = {}; |
| servesTags | variable | 135 | no | let servesTags = 0; |
| text | const | 138 | no | const text = fs.readFileSync(path.join(root, name), &#39;utf8&#39;); |
| indexed | const | 139 | no | const indexed = indexFile(name, text); |
| commit | variable | 145 | no | let commit = null; |
| dirty | variable | 147 | no | let dirty = null; |
| validate | function | 154 | no | function validate(index, filename) { |
| lines | const | 155 | no | const lines = fs.readFileSync(path.resolve(filename), &#39;utf8&#39;).split(/\\r\\n\|\\r\|\\n/); |
| misses | const | 156 | no | const misses = []; |
| cited | variable | 157 | no | let cited = 0, keys = 0, files = 0; |
| token | const | 160 | no | const token = match[1]; |
| file | const | 166 | no | const file = token.replace(/:\\d+$/, &#39;&#39;); |
| index | const | 179 | no | const index = build(); |
| mapPath | const | 184 | no | const mapPath = process.argv[3] \|\| path.join(root, &#39;docs&#39;, &#39;agents&#39;, &#39;CHATGPT-100-SOURCE-MAP.md&#39;); |
| mapLines | const | 185 | no | const mapLines = fs.readFileSync(mapPath, &#39;utf8&#39;).split(/\\r?\\n/); |
| present | const | 186 | no | const present = new Set(); |
| missing | const | 191 | no | const missing = Array.from({ length: 100 }, (_, n) =&gt; String(n + 1).padStart(3, &#39;0&#39;)).filter((id) =&gt; !present.has(id)); |
| c | const | 198 | no | const c = index.counts; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 1 | external |
| node:path | import | 2 | external |
| node:child_process | import | 3 | external |
| node:url | import | 4 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = 'docs/agents/CHATGPT-100-SOURCE-INDEX.json';
const posix = (value) => value.split(path.sep).join('/');
const sorted = (object) => Object.fromEntries(Object.entries(object).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
const existsFile = (file) => { try { return fs.statSync(file).isFile(); } catch { return false; } };

function walk(dir, result) {
  let entries;
  try { entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true }); } catch { return; }
  for (const entry of entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;
    const name = posix(path.join(dir, entry.name));
    if (entry.isDirectory()) walk(name, result);
    else if (entry.isFile() && /\.(?:mjs|js|json)$/.test(name)) result.push(name);
  }
}

// Preserve offsets and newlines while hiding strings and comments from declaration scans.
function lex(text) {
  const code = text.split('');
  const comments = [];
  const hide = (start, end) => { for (let j = start; j < end; j++) if (code[j] !== '\n' && code[j] !== '\r') code[j] = ' '; };
  let i = 0;
  while (i < text.length) {
    const start = i;
    if (text[i] === '/' && text[i + 1] === '/') {
      i += 2; while (i < text.length && text[i] !== '\n') i++;
      comments.push({ start, end: i, text: text.slice(start, i), type: 'line' }); hide(start, i);
    } else if (text[i] === '/' && text[i + 1] === '*') {
      i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i = Math.min(text.length, i + 2);
      comments.push({ start, end: i, text: text.slice(start, i), type: text[start + 2] === '*' ? 'doc' : 'block' }); hide(start, i);
    } else if (text[i] === '"' || text[i] === "'" || text[i] === '`') {
      const quote = text[i++];
      while (i < text.length) { if (text[i] === '\\') i += 2; else if (text[i++] === quote) break; }
      hide(start, Math.min(i, text.length));
    } else i++;
  }
  return { code: code.join(''), comments };
}

function indexFile(name, text) {
  const { code, comments } = lex(text);
  const lineAt = (offset) => 1 + (text.slice(0, offset).match(/\n/g) || []).length;
  const declarations = [];
  const add = (symbol, kind, exported, offset) => declarations.push({ symbol, kind, exported, offset, line: lineAt(offset) });
  let match;
  const decl = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(function|const|let|var|class)\s+([A-Za-z_$][\w$]*)(?=\s*(?:\(|=|\{|extends\b))/gm;
  while ((match = decl.exec(code))) add(match[2], match[1], /^export\b/.test(match[0]), match.index);
  const named = /\bexport\s*\{([^}]*)\}/g;
  while ((match = named.exec(code))) {
    for (const item of match[1].split(',')) {
      const part = item.trim().match(/^([\w$]+)(?:\s+as\s+([\w$]+))?$/);
      if (part) add(part[2] || part[1], 'export', true, match.index);
    }
  }
  const defaults = /\bexport\s+default\s+(?:async\s+)?(?:function\s+)?([A-Za-z_$][\w$]*)/g;
  while ((match = defaults.exec(code))) if (match[1] !== 'function' && match[1] !== 'class') add(match[1], 'default', true, match.index);
  const common = /\bmodule\s*\.\s*exports\s*(?:\.\s*([\w$]+)\s*=|=\s*\{([^}]*)\})/g;
  while ((match = common.exec(code))) {
    const names = match[1] ? [match[1]] : match[2].split(',').map((part) => part.trim().match(/^([\w$]+)/)?.[1]).filter(Boolean);
    for (const symbol of names) add(symbol, 'export', true, match.index);
  }
  declarations.sort((a, b) => a.offset - b.offset);
  const docs = (offset) => {
    let cursor = offset;
    let index = comments.length - 1;
    while (index >= 0 && comments[index].end > cursor) index--;
    const parts = [];
    while (index >= 0) {
      const comment = comments[index];
      if (!/^\s*$/.test(text.slice(comment.end, cursor)) || !['line', 'doc'].includes(comment.type)) break;
      parts.unshift(comment.text.replace(/^\/\/\s?/, '').replace(/^\/\*\*?/, '').replace(/\*\/$/, '').replace(/^\s*\*\s?/gm, ''));
      cursor = comment.start;
      if (comment.type === 'doc') break;
```

_First 80 of 201 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
