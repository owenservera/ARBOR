# File: hq/test/extract.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/extract.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16157 B |
| Lines | 447 |
| Hash | 4da8e60c0454 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONTROL_NAMES | const | 12 | no | const CONTROL_NAMES = new Set([ &#39;if&#39;, &#39;for&#39;, &#39;while&#39;, &#39;switch&#39;, &#39;catch&#39;, &#39;return&#39;, &#39;function&#39;, &#39;class&#39;, &#39;const&#39;, &#39;let&#39;, &#39;var&#39;, &#39;import&#39;, &#39;from&#39;, &#39;use&#39;, ]); |
| names | function | 17 | no | function names(symbols) { |
| assertSymbolShape | function | 21 | no | function assertSymbolShape(symbols, lineCount) { |
| JS_SOURCE | const | 37 | no | const JS_SOURCE = `// function commentedOut() {} |
| greet | function | 38 | yes | export function greet(name) { |
| stream | function | 41 | no | async function* stream() { yield 1; } |
| User | class | 42 | no | class User extends Base { |
| constructor | method | 43 | yes | constructor(id) { this.id = id; } |
| load | method | 44 | yes | async load(id) { |
| create | method | 47 | yes | static create() { return new User(1); } |
| add | function | 49 | yes | export const add = (a, b) =&gt; { |
| MAX | const | 52 | no | const MAX = 10; |
| Point | interface | 53 | yes | export interface Point { x: number; } |
| Id | type | 54 | no | type Id = string \| number; |
| Color | enum | 55 | yes | export enum Color { Red, Green } |
| LIMIT | export | 56 | yes | export { MAX as LIMIT } |
| legacy | export | 57 | yes | module.exports.legacy = function () {}; |
| router | const | 58 | no | const router = express.Router(); |
| /api/users | route | 59 | no | GET /api/users |
| /api/users | route | 60 | no | POST /api/users |
| main | function | 61 | yes | export default function main() {} |
| JS_LINE_COUNT | const | 64 | no | const JS_LINE_COUNT = JS_SOURCE.split(&#39;\\n&#39;).length; |
| syms | const | 67 | no | const syms = extractSymbols(&#39;javascript&#39;, JS_SOURCE); |
| greet | const | 70 | no | const greet = syms.find((s) =&gt; s.name === &#39;greet&#39;); |
| stream | const | 76 | no | const stream = syms.find((s) =&gt; s.name === &#39;stream&#39;); |
| user | const | 79 | no | const user = syms.find((s) =&gt; s.name === &#39;User&#39;); |
| methods | const | 83 | no | const methods = syms.filter((s) =&gt; s.kind === &#39;method&#39;).map((s) =&gt; s.name).sort(); |
| add | const | 86 | no | const add = syms.find((s) =&gt; s.name === &#39;add&#39;); |
| max | const | 90 | no | const max = syms.find((s) =&gt; s.name === &#39;MAX&#39;); |
| syms | const | 100 | no | const syms = extractSymbols(&#39;typescript&#39;, JS_SOURCE); |
| routes | const | 109 | no | const routes = extractSymbols(&#39;javascript&#39;, JS_SOURCE).filter((s) =&gt; s.kind === &#39;route&#39;); |
| src | const | 116 | no | const src = [ |
| syms | const | 122 | no | const syms = extractSymbols(&#39;javascript&#39;, src); |
| js | const | 128 | no | const js = [ |
| syms | const | 137 | no | const syms = extractSymbols(&#39;javascript&#39;, js); |
| PY_SOURCE | const | 142 | no | const PY_SOURCE = `# def commented_out(): pass |
| Service | class | 154 | no | class Service: |
| syms | const | 165 | no | const syms = extractSymbols(&#39;python&#39;, PY_SOURCE); |
| top | const | 168 | no | const top = syms.find((s) =&gt; s.name === &#39;top&#39;); |
| imports | const | 182 | no | const imports = extractImports(&#39;python&#39;, PY_SOURCE); |
| GO_SOURCE | const | 188 | no | const GO_SOURCE = `package main |
| MaxSize | const | 213 | no | const MaxSize = 10 |
| counter | variable | 214 | no | var counter int |
| syms | const | 218 | no | const syms = extractSymbols(&#39;go&#39;, GO_SOURCE); |
| imports | const | 232 | no | const imports = extractImports(&#39;go&#39;, GO_SOURCE); |
| RUST_SOURCE | const | 237 | no | const RUST_SOURCE = `use std::collections::HashMap; |
| Mode | enum | 240 | no | enum Mode { Fast, Slow } |
| syms | const | 249 | no | const syms = extractSymbols(&#39;rust&#39;, RUST_SOURCE); |
| imports | const | 262 | no | const imports = extractImports(&#39;rust&#39;, RUST_SOURCE); |
| CS_SOURCE | const | 267 | no | const CS_SOURCE = `using System; |
| Demo | module | 270 | no | namespace Demo { |
| syms | const | 284 | no | const syms = extractSymbols(&#39;csharp&#39;, CS_SOURCE); |
| service | const | 287 | no | const service = syms.find((s) =&gt; s.name === &#39;Service&#39; &amp;&amp; s.kind === &#39;class&#39;); |
| imports | const | 298 | no | const imports = extractImports(&#39;csharp&#39;, CS_SOURCE); |
| ANN_SOURCE | const | 303 | no | const ANN_SOURCE = `// @hq:context payment flow |
| quoted | const | 315 | no | const quoted = &#39;@hq:why not a comment&#39;; |
| anns | const | 319 | no | const anns = extractAnnotations(&#39;javascript&#39;, ANN_SOURCE); |
| kinds | const | 320 | no | const kinds = [...new Set(anns.map((a) =&gt; a.kind))].sort(); |
| anns | const | 330 | no | const anns = extractAnnotations(&#39;javascript&#39;, ANN_SOURCE); |
| todo | const | 331 | no | const todo = anns.find((a) =&gt; a.kind === &#39;todo&#39;); |
| owner | const | 335 | no | const owner = anns.find((a) =&gt; a.kind === &#39;owner&#39;); |
| see | const | 339 | no | const see = anns.find((a) =&gt; a.kind === &#39;see&#39;); |
| anns | const | 347 | no | const anns = extractAnnotations(&#39;javascript&#39;, ANN_SOURCE); |
| block | const | 350 | no | const block = anns.find((a) =&gt; a.kind === &#39;why&#39; &amp;&amp; a.text === &#39;block reason&#39;); |
| py | const | 356 | no | const py = extractAnnotations(&#39;python&#39;, &#39;# @hq:why python reason\\nx = 1\\n# TODO plain\\n&#39;); |
| sql | const | 361 | no | const sql = extractAnnotations(&#39;sql&#39;, &#39;-- @hq:risk drop table\\nSELECT 1;\\n&#39;); |
| src | const | 367 | no | const src = [ |
| imports | const | 375 | no | const imports = extractImports(&#39;javascript&#39;, src); |
| imports | const | 386 | no | const imports = extractImports(&#39;c&#39;, &#39;#include &lt;stdio.h&gt;\\n#include &quot;local.h&quot;\\n&#39;); |
| first | const | 392 | no | const first = extractSymbols(&#39;javascript&#39;, JS_SOURCE); |
| second | const | 393 | no | const second = extractSymbols(&#39;javascript&#39;, JS_SOURCE); |
| lines | const | 398 | no | const lines = first.map((s) =&gt; s.line); |
| sorted | const | 399 | no | const sorted = [...lines].sort((a, b) =&gt; a - b); |
| fixtures | const | 404 | no | const fixtures = [ |
| count | const | 412 | no | const count = src.split(&#39;\\n&#39;).length; |
| syms | const | 413 | no | const syms = extractSymbols(lang, src); |
| src | const | 423 | no | const src = `&lt;template&gt; |
| count | const | 428 | yes | export const count = ref(0) |
| bump | function | 429 | no | function bump() { count.value++ } |
| syms | const | 432 | no | const syms = extractSymbols(&#39;vue&#39;, src); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| ../lib/extract.mjs | import | 6 | [hq/lib/extract.mjs](../lib/extract.mjs.md) |
| strings | import | 195 | external |
| ./lazy.js | dynamic | 371 | external |
| fs | require | 372 | external |
| vue | import | 427 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 304 | why | — | — | idempotency matters |
| 305 | invariant | — | — | amount &gt; 0 |
| 306 | see | — | src/pay.ts:42 | src/pay.ts:42 |
| 307 | todo | amir | — | wire retries |
| 308 | owner | amir | — | amir |
| 309 | task | — | — | T-17 |
| 310 | risk | — | — | double charge |
| 311 | deprecated | — | — | use v2 |
| 313 | why | — | — | block reason |

## Excerpt

```javascript
// hq/test/extract.test.mjs — lane A: symbol, import and annotation extraction.
// Inline fixtures only; every assertion uses the public contract shape.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractSymbols,
  extractImports,
  extractAnnotations,
} from '../lib/extract.mjs';

const CONTROL_NAMES = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'class',
  'const', 'let', 'var', 'import', 'from', 'use',
]);

function names(symbols) {
  return symbols.map((s) => s.name);
}

function assertSymbolShape(symbols, lineCount) {
  for (const s of symbols) {
    assert.equal(typeof s.name, 'string');
    assert.ok(s.name.length > 0);
    assert.equal(typeof s.kind, 'string');
    assert.ok(Number.isInteger(s.line) && s.line >= 1 && s.line <= lineCount, `line out of range: ${s.name}`);
    assert.ok(Number.isInteger(s.end_line) && s.end_line >= s.line, `end_line before line: ${s.name}`);
    assert.ok(s.end_line <= lineCount, `end_line out of range: ${s.name}`);
    assert.equal(typeof s.signature, 'string');
    assert.ok(s.signature.length <= 240, `signature too long: ${s.name}`);
    assert.ok(!s.signature.includes('\n'), `signature not single-line: ${s.name}`);
    assert.equal(typeof s.exported, 'boolean');
    assert.ok(!CONTROL_NAMES.has(s.name), `control keyword emitted: ${s.name}`);
  }
}

const JS_SOURCE = `// function commentedOut() {}
export function greet(name) {
  return 'hi ' + name;
}
async function* stream() { yield 1; }
class User extends Base {
  constructor(id) { this.id = id; }
  async load(id) {
    return fetch(id);
  }
  static create() { return new User(1); }
}
export const add = (a, b) => {
  return a + b;
};
const MAX = 10;
export interface Point { x: number; }
type Id = string | number;
export enum Color { Red, Green }
export { MAX as LIMIT };
module.exports.legacy = function () {};
const router = express.Router();
router.get('/api/users', handler);
app.post('/api/users', handler);
export default function main() {}
`;

const JS_LINE_COUNT = JS_SOURCE.split('\n').length;

test('javascript: functions, class methods, const/arrow, exports and routes', () => {
  const syms = extractSymbols('javascript', JS_SOURCE);
  assertSymbolShape(syms, JS_LINE_COUNT);

  const greet = syms.find((s) => s.name === 'greet');
  assert.ok(greet, 'greet missing');
  assert.equal(greet.kind, 'function');
  assert.equal(greet.exported, true);
  assert.equal(greet.line, 2);

  const stream = syms.find((s) => s.name === 'stream');
  assert.equal(stream?.kind, 'function');

  const user = syms.find((s) => s.name === 'User');
  assert.equal(user?.kind, 'class');
```

_First 80 of 448 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
