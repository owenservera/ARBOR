# File: tests/hq-version-intelligence/schema-negative-gates.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/hq-version-intelligence/schema-negative-gates.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2151 B |
| Lines | 38 |
| Hash | 0e0a427ce94b |
| Test | yes |
| Generated | no |
| Component | tests |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 7 | no | const root=join(dirname(fileURLToPath(import.meta.url)),&#39;../../contracts/hq-version-intelligence&#39;); |
| load | function | 8 | no | const load=(k,name)=&gt;JSON.parse(readFileSync(join(root,k,name+&#39;.json&#39;),&#39;utf8&#39;)); |
| ex | function | 9 | no | const ex=k=&gt;load(&#39;examples&#39;,k+&#39;.example&#39;); |
| sch | function | 10 | no | const sch=k=&gt;load(&#39;schemas/v1&#39;,k+&#39;.schema&#39;); |
| v | const | 12 | no | const v=ex(&#39;identity-crosswalk&#39;);v.candidates[0].disposition=&#39;CONFIRMED_EQUIVALENT&#39;; |
| v | const | 18 | no | const v=ex(&#39;evidence-receipt&#39;);v.status=&#39;RUNTIME_VERIFIED&#39;; |
| v | const | 22 | no | const v=ex(&#39;evidence-receipt&#39;);v.kind=&#39;executed_test&#39;;v.status=&#39;TEST_EXECUTED&#39;; |
| v | const | 28 | no | const v=ex(&#39;host-read-result&#39;);v.status=&#39;ok&#39;;delete v.errorCode; |
| v | const | 34 | no | const v=ex(&#39;manifest&#39;);v.entries[0].kind=&#39;symlink&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| node:url | import | 5 | external |
| ./schema-validator.mjs | import | 6 | [tests/hq-version-intelligence/schema-validator.mjs](./schema-validator.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate} from './schema-validator.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'../../contracts/hq-version-intelligence');
const load=(k,name)=>JSON.parse(readFileSync(join(root,k,name+'.json'),'utf8'));
const ex=k=>load('examples',k+'.example');
const sch=k=>load('schemas/v1',k+'.schema');
test('conditional: similarity cannot become equivalence without owner receipt',()=>{
 const v=ex('identity-crosswalk');v.candidates[0].disposition='CONFIRMED_EQUIVALENT';
 assert.ok(validate(sch('identity-crosswalk'),v).length>0);
 v.candidates[0].ownerConfirmed=true;v.candidates[0].ownerReceiptRef='owner-ledger:ack';
 assert.deepEqual(validate(sch('identity-crosswalk'),v),[]);
});
test('conditional: source blob can never self-declare RUNTIME_VERIFIED',()=>{
 const v=ex('evidence-receipt');v.status='RUNTIME_VERIFIED';
 assert.ok(validate(sch('evidence-receipt'),v).length>0);
});
test('conditional: executed_test requires observed command, exit and environment',()=>{
 const v=ex('evidence-receipt');v.kind='executed_test';v.status='TEST_EXECUTED';
 assert.ok(validate(sch('evidence-receipt'),v).length>0);
 v.command='node --test';v.exitCode=0;v.environment='Node 24 Linux actual receipt';
 assert.deepEqual(validate(sch('evidence-receipt'),v),[]);
});
test('conditional: Host ok requires result digest and receipts',()=>{
 const v=ex('host-read-result');v.status='ok';delete v.errorCode;
 assert.ok(validate(sch('host-read-result'),v).length>0);
 v.resultDigest='e'.repeat(64);v.receipts=['real-host-grant-receipt:example'];
 assert.deepEqual(validate(sch('host-read-result'),v),[]);
});
test('conditional: symlink manifest may only be blocked/unsupported',()=>{
 const v=ex('manifest');v.entries[0].kind='symlink';
 assert.ok(validate(sch('manifest'),v).length>0);
 v.entries[0].symlinkTarget='../private';v.entries[0].parseStatus='blocked';
 assert.deepEqual(validate(sch('manifest'),v),[]);
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
