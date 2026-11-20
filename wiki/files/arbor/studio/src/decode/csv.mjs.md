# File: studio/src/decode/csv.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/decode/csv.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12340 B |
| Lines | 383 |
| Hash | 25b1f551bcbe |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DELIMS | const | 5 | no | const DELIMS = [&#39;,&#39;, &#39;;&#39;, &#39;\\t&#39;, &#39;\|&#39;]; |
| stripBom | function | 7 | no | function stripBom(text) { |
| s | const | 8 | no | const s = String(text ?? &#39;&#39;); |
| round4 | function | 12 | no | function round4(n) { |
| isNumericString | function | 16 | no | function isNumericString(s) { |
| isIsoDate | function | 20 | no | function isIsoDate(s) { |
| logicalLines | function | 25 | no | function logicalLines(text, max = 50) { |
| s | const | 26 | no | const s = stripBom(text); |
| lines | const | 27 | no | const lines = []; |
| cur | variable | 28 | no | let cur = &#39;&#39;; |
| inQ | variable | 29 | no | let inQ = false; |
| c | const | 31 | no | const c = s[i]; |
| countFields | function | 50 | no | function countFields(line, delimiter) { |
| n | variable | 51 | no | let n = 1; |
| inQ | variable | 52 | no | let inQ = false; |
| c | const | 54 | no | const c = line[i]; |
| parseCsv | function | 65 | yes | export function parseCsv(text, { delimiter = &#39;,&#39; } = {}) { |
| s | const | 66 | no | const s = stripBom(text); |
| rows | const | 67 | no | const rows = []; |
| row | variable | 68 | no | let row = []; |
| field | variable | 69 | no | let field = &#39;&#39;; |
| inQ | variable | 70 | no | let inQ = false; |
| started | variable | 71 | no | let started = false; |
| pushRow | function | 72 | no | const pushRow = () =&gt; { row.push(field); rows.push(row); row = []; field = &#39;&#39;; started = false; }; |
| c | const | 74 | no | const c = s[i]; |
| sniffDelimiter | function | 100 | yes | export function sniffDelimiter(text) { |
| lines | const | 101 | no | const lines = logicalLines(text, 50).filter((l) =&gt; l.length &gt; 0); |
| best | variable | 102 | no | let best = { delimiter: &#39;,&#39;, confidence: 0 }; |
| counts | const | 105 | no | const counts = lines.map((line) =&gt; countFields(line, delimiter)); |
| freq | const | 106 | no | const freq = new Map(); |
| multi | variable | 107 | no | let multi = 0; |
| mode | variable | 112 | no | let mode = 0; |
| modeN | variable | 113 | no | let modeN = 0; |
| confidence | variable | 117 | no | let confidence = (modeN / counts.length) * (modeN / multi); |
| headerLikelihood | function | 125 | yes | export function headerLikelihood(rows) { |
| cells | const | 127 | no | const cells = rows[0].map((c) =&gt; String(c ?? &#39;&#39;).trim()); |
| nonNum | const | 128 | no | const nonNum = cells.filter((c) =&gt; c !== &#39;&#39; &amp;&amp; !isNumericString(c)).length / cells.length; |
| unique | const | 129 | no | const unique = new Set(cells).size / cells.length; |
| considered | variable | 130 | no | let considered = 0; |
| typedCols | variable | 131 | no | let typedCols = 0; |
| vals | const | 133 | no | const vals = []; |
| cell | const | 135 | no | const cell = rows[r]?.[col]; |
| t | const | 137 | no | const t = String(cell).trim(); |
| hits | const | 143 | no | const hits = vals.filter((v) =&gt; isNumericString(v) \|\| isIsoDate(v)).length; |
| typed | const | 146 | no | const typed = considered ? typedCols / considered : 0; |
| score | variable | 147 | no | let score = 0.15 * nonNum + 0.15 * unique + 0.7 * typed; |
| coerceCell | function | 153 | yes | export function coerceCell(str) { |
| s | const | 155 | no | const s = String(str); |
| n | const | 161 | no | const n = Number(s); |
| n | const | 165 | no | const n = Number(s); |
| columnNames | function | 171 | no | function columnNames(cells) { |
| seen | const | 172 | no | const seen = new Map(); |
| base | const | 174 | no | const base = String(c ?? &#39;&#39;).trim() \|\| `col${i}`; |
| n | const | 175 | no | const n = seen.get(base) ?? 0; |
| splitRecord | function | 181 | no | function splitRecord(text, delimiter) { |
| rows | const | 183 | no | const rows = parseCsv(text, { delimiter }); |
| csvToObjects | function | 193 | yes | export function csvToObjects(text, opts = {}) { |
| delimiter | const | 194 | no | const delimiter = opts.delimiter ?? sniffDelimiter(text).delimiter; |
| matrix | const | 195 | no | const matrix = parseCsv(text, { delimiter }); |
| likelihood | const | 196 | no | const likelihood = headerLikelihood(matrix); |
| hasHeader | const | 197 | no | const hasHeader = typeof opts.hasHeader === &#39;boolean&#39; ? opts.hasHeader : likelihood &gt;= 0.5; |
| columns | variable | 198 | no | let columns; |
| data | variable | 199 | no | let data; |
| width | const | 204 | no | const width = matrix.reduce((m, r) =&gt; Math.max(m, r.length), 0); |
| rows | const | 208 | no | const rows = data.map((r) =&gt; { const obj = {}; const n = Math.max(columns.length, r.length); for (let i = 0; i &lt; n; i++) { const key = columns[i] ?? `col${i}`; |
| obj | const | 209 | no | const obj = {}; |
| n | const | 210 | no | const n = Math.max(columns.length, r.length); |
| key | const | 212 | no | const key = columns[i] ?? `col${i}`; |
| toBuf | function | 220 | no | function toBuf(chunk) { |
| CsvDecoder | class | 227 | yes | export class CsvDecoder { |
| constructor | method | 228 | yes | constructor(opts = {}) { |
| push | method | 243 | yes | push(chunk) { |
| part | const | 244 | no | const part = toBuf(chunk); |
| flush | method | 253 | yes | flush() { |
| _stripBom | method | 262 | yes | _stripBom(final) { |
| _extract | method | 272 | yes | _extract(final) { |
| buf | const | 273 | no | const buf = this.buf; |
| recs | const | 274 | no | const recs = []; |
| inQ | variable | 275 | no | let inQ = false; |
| start | variable | 276 | no | let start = 0; |
| i | variable | 277 | no | let i = 0; |
| uncertain | function | 278 | no | const uncertain = () =&gt; { |
| b | const | 283 | no | const b = buf[i]; |
| _keep | method | 321 | yes | _keep(buf, start) { |
| _queue | method | 327 | yes | _queue(recs) { |
| _drain | method | 338 | yes | _drain(final) { |
| like | const | 344 | no | const like = headerLikelihood(this.pending.map((r) =&gt; r.cells)); |
| width | const | 350 | no | const width = this.pending.reduce((m, r) =&gt; Math.max(m, r.cells.length), 0); |
| out | const | 355 | no | const out = []; |
| _event | method | 360 | yes | _event(r) { |
| values | const | 362 | no | const values = r.cells.map((c) =&gt; coerceCell(c)); |
| row | const | 363 | no | const row = {}; |
| n | const | 364 | no | const n = Math.max(this.columns?.length ?? 0, r.cells.length); |
| ev | const | 366 | no | const ev = { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/decode/decoders.mjs](./decoders.mjs.md) | ./csv.mjs |
| [studio/src/intel/platform.mjs](../intel/platform.mjs.md) | ../decode/csv.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// RFC 4180 CSV helpers + incremental CsvDecoder.
// Event shape matches NdjsonDecoder: { type, text, span:[start,end], index }.
// push(chunk) / flush() — end() is the decoder-interface alias of flush().

const DELIMS = [',', ';', '\t', '|'];

function stripBom(text) {
  const s = String(text ?? '');
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function isNumericString(s) {
  return /^-?(?:\d+\.\d+|\d+\.|\.\d+|\d+)(?:[eE][+-]?\d+)?$/.test(s);
}

function isIsoDate(s) {
  return /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(s);
}

/** Quote-aware logical records (newlines inside quotes stay inside the record). */
function logicalLines(text, max = 50) {
  const s = stripBom(text);
  const lines = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < s.length && lines.length < max; i++) {
    const c = s[i];
    if (c === '"') {
      if (inQ && s[i + 1] === '"') { cur += '""'; i++; continue; }
      inQ = !inQ;
      cur += c;
      continue;
    }
    if (!inQ && (c === '\n' || c === '\r')) {
      if (c === '\r' && s[i + 1] === '\n') i++;
      lines.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  if (cur && lines.length < max) lines.push(cur);
  return lines;
}

function countFields(line, delimiter) {
  let n = 1;
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { i++; continue; }
      inQ = !inQ;
      continue;
    }
    if (!inQ && c === delimiter) n++;
  }
  return n;
}

export function parseCsv(text, { delimiter = ',' } = {}) {
  const s = stripBom(text);
  const rows = [];
  let row = [];
  let field = '';
  let inQ = false;
  let started = false;
  const pushRow = () => { row.push(field); rows.push(row); row = []; field = ''; started = false; };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; started = true; continue; }
        inQ = false;
        started = true;
        continue;
```

_First 80 of 384 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
