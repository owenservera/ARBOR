# File: packages/vec-ui-engines/test/manifest.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/vec-ui-engines/test/manifest.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3032 B |
| Lines | 63 |
| Hash | 0e035fd41130 |
| Test | yes |
| Generated | no |
| Component | vec-ui-engines |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 6 | no | const root=new URL(&#39;../../../.integration/proposal5/vec-ui-engines/&#39;,import.meta.url); |
| json | function | 7 | no | const json=file=&gt;JSON.parse(readFileSync(new URL(file,root),&#39;utf8&#39;)); |
| c | const | 9 | no | const c=json(&#39;machine/engine-catalog.v1.json&#39;); |
| fleet | const | 17 | no | const fleet=json(&#39;machine/100-agent-fleet.json&#39;); |
| docs | const | 22 | no | const docs=readdirSync(new URL(&#39;agents/&#39;,root)); |
| c | const | 33 | no | const c=ENGINE_CAPABILITIES.find(x=&gt;x.id===id); |
| spec | const | 41 | no | const spec=json(&#39;machine/engine-dependencies.v1.json&#39;); |
| ids | const | 42 | no | const ids=new Set(ENGINE_FAMILIES.map(x=&gt;x.domain)); |
| visiting | const | 48 | no | const visiting=new Set(),visited=new Set(); |
| walk | function | 49 | no | function walk(n){ |
| first | const | 60 | no | const first=Object.keys(ENGINE_ENUM_CHOICES)[0]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| ../src/index.mjs | import | 4 | [packages/vec-ui-engines/src/index.mjs](../src/index.mjs.md) |
| ../src/enum-choices.mjs | import | 5 | [packages/vec-ui-engines/src/enum-choices.mjs](../src/enum-choices.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {ENGINE_FAMILIES,ENGINE_CAPABILITIES} from '../src/index.mjs';
import {ENGINE_ENUM_CHOICES} from '../src/enum-choices.mjs';
const root=new URL('../../../.integration/proposal5/vec-ui-engines/',import.meta.url);
const json=file=>JSON.parse(readFileSync(new URL(file,root),'utf8'));
test('catalog machine snapshot matches source identically',()=>{
  const c=json('machine/engine-catalog.v1.json');
  assert.equal(c.schema,'vivim.ui-engine-catalog/1');
  assert.equal(c.counts.families,37);
  assert.equal(c.counts.capabilities,461);
  assert.deepEqual(c.engineFamilies,ENGINE_FAMILIES);
  assert.deepEqual(c.capabilities,ENGINE_CAPABILITIES);
});
test('100-agent fleet contains exactly 100 unique branches and source scopes',()=>{
  const fleet=json('machine/100-agent-fleet.json');
  assert.equal(fleet.total,100);
  assert.equal(new Set(fleet.tasks.map(t=>t.exclusivePath)).size,100);
  assert.equal(new Set(fleet.tasks.map(t=>t.branch)).size,100);
  assert.deepEqual(Object.values(fleet.waves),[16,37,16,16,12,3]);
  const docs=readdirSync(new URL('agents/',root));
  assert.equal(docs.length,100);
  for(const task of fleet.tasks) {
    assert.equal(task.status,'PREPARED_UNRUN');
    assert.equal(docs.filter(x=>x.startsWith(task.id+'-')).length,1);
    assert.ok(task.exclusivePath.startsWith('packages/vec-ui-engines/')||
      task.exclusivePath.startsWith('.integration/proposal5/vec-ui-engines/proofs/'));
  }
});
test('enum review choices are source-owned, unique, and tied to registered enum capabilities',()=>{
  for(const [id,choices] of Object.entries(ENGINE_ENUM_CHOICES)){
    const c=ENGINE_CAPABILITIES.find(x=>x.id===id);
    assert.ok(c,'unknown engine '+id);
    assert.equal(c.valueSchema.type,'enum');
    assert.ok(Array.isArray(choices)&&choices.length>0);
    assert.equal(new Set(choices).size,choices.length);
  }
});
test('engine family dependency matrix includes every family and is acyclic',()=>{
  const spec=json('machine/engine-dependencies.v1.json');
  const ids=new Set(ENGINE_FAMILIES.map(x=>x.domain));
  assert.deepEqual(new Set(Object.keys(spec.dependencies)),ids);
  for(const [key,ds] of Object.entries(spec.dependencies)) {
    assert.ok(ids.has(key));
    for(const dep of ds)assert.ok(ids.has(dep),dep);
  }
  const visiting=new Set(),visited=new Set();
  function walk(n){
    if(visiting.has(n))throw new Error('CYCLE:'+n);
    if(visited.has(n))return;
    visiting.add(n);for(const d of spec.dependencies[n])walk(d);
    visiting.delete(n);visited.add(n);
  }
  for(const id of ids)walk(id);
  assert.equal(visited.size,37);
});

test('closed enum option lists cannot be widened at runtime',()=>{
  const first=Object.keys(ENGINE_ENUM_CHOICES)[0];
  assert.equal(Object.isFrozen(ENGINE_ENUM_CHOICES[first]),true);
  assert.throws(()=>{ENGINE_ENUM_CHOICES[first].push('eval');},TypeError);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
