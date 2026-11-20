# File: apps/mobile-relay/test/host-revision-guard.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/host-revision-guard.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3835 B |
| Lines | 68 |
| Hash | bf4d0c9cb8be |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| surface | function | 5 | no | const surface = (revision, name=&#39;my-space&#39;, label=&#39;Safe&#39;) =&gt; ({ schema:&#39;vivim.ui-surface/1&#39;, surfaceId:name, revision, catalogVersion:1, theme:{background:&#39;#111722&#39;}, tree:{id:&#39;root&#39;,type:&#39;stack&#39;,pro… |
| host | function | 9 | no | const host = (revision, name, label) =&gt; { |
| s | const | 10 | no | const s = surface(revision,name,label); |
| row | const | 15 | no | const row=host(4); |
| guard | const | 28 | no | const guard=createHostRevisionGuard(); |
| next | const | 30 | no | const next=guard.observe(host(8)); |
| guard | const | 35 | no | const guard=createHostRevisionGuard(); |
| result | const | 37 | no | const result=guard.observe(host(7)); |
| guard | const | 43 | no | const guard=createHostRevisionGuard();guard.observe(host(2)); |
| guard | const | 47 | no | const guard=createHostRevisionGuard();guard.observe(host(2)); |
| guard | const | 51 | no | const guard=createHostRevisionGuard();guard.observe(host(9)); |
| guard | const | 58 | no | const guard=createHostRevisionGuard(); |
| guard | const | 65 | no | const guard=createHostRevisionGuard();const value=guard.observe(host(2)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../generative-ui/host-revision-guard.mjs | import | 3 | [apps/mobile-relay/generative-ui/host-revision-guard.mjs](../generative-ui/host-revision-guard.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { committedHostSurface, createHostRevisionGuard } from '../generative-ui/host-revision-guard.mjs';

const surface = (revision, name='my-space', label='Safe') => ({
  schema:'vivim.ui-surface/1', surfaceId:name, revision, catalogVersion:1,
  theme:{background:'#111722'}, tree:{id:'root',type:'stack',props:{},children:[{id:'label',type:'text',props:{value:label},children:[]}]}
});
const host = (revision, name, label) => {
  const s = surface(revision,name,label);
  return {...s, surface:s, status:'applied', changeId:'ui-change',parentRevision:revision-1};
};

test('extracts only source-owned committed surface, not additive Host envelope', () => {
  const row=host(4);
  assert.deepEqual(committedHostSurface(row), surface(4));
  assert.equal('status' in committedHostSurface(row),false);
  assert.equal('surface' in committedHostSurface(row),false);
  assert.equal(committedHostSurface(surface(4)),null,'bare visual payload is not a Host commit');
});
test('requires an applied Host revision and matching metadata', () => {
  assert.equal(committedHostSurface({...host(4),status:'previewed'}),null);
  assert.equal(committedHostSurface({...host(4),revision:5}),null);
  assert.equal(committedHostSurface({...host(4),surfaceId:'foreign'}),null);
  assert.equal(committedHostSurface({...host(4),surface:null}),null);
});
test('same snapshot is duplicate, subsequent full snapshot advances without delta replay', () => {
  const guard=createHostRevisionGuard();
  assert.deepEqual([guard.observe(host(3)).state,guard.observe(host(3)).changed],[ 'ready', false ]);
  const next=guard.observe(host(8));
  assert.equal(next.state,'ready'); assert.equal(next.changed,true);
  assert.equal(guard.status().highRevision,8);
});
test('stale snapshot and unproved rollback clear UI, no inferred rollback activation', () => {
  const guard=createHostRevisionGuard();
  assert.equal(guard.observe(host(8)).state,'ready');
  const result=guard.observe(host(7));
  assert.equal(result.state,'blocked'); assert.equal(result.surface,null);
  assert.equal(result.reason,'ROLLBACK_PROOF_REQUIRED');
  assert.equal(guard.status().state,'blocked');
});
test('same revision with different bytes is conflict, not a silent repaint', () => {
  const guard=createHostRevisionGuard();guard.observe(host(2));
  assert.equal(guard.observe(host(2,undefined,'tamper')).reason,'SAME_REVISION_CONFLICT');
});
test('a foreign surface identity cannot silently inherit the same authorization', () => {
  const guard=createHostRevisionGuard();guard.observe(host(2));
  assert.equal(guard.observe(host(3,'foreign-world')).reason,'SCOPE_CHANGED');
});
test('offline and revoked connections do not retain renderable data; rejoin needs full Host read', () => {
  const guard=createHostRevisionGuard();guard.observe(host(9));
  assert.equal(guard.disconnect().surface,null);
  assert.equal(guard.status().state,'blocked');
  assert.equal(guard.observe(host(9)).changed,true);
  assert.equal(guard.observe(null).reason,'NO_COMMITTED_SURFACE');
});
test('untrusted revisions and prototype-shaped payloads fail closed', () => {
  const guard=createHostRevisionGuard();
  for(const bad of [[],{}, {surface: Object.create({schema:'vivim.ui-surface/1'}),status:'applied'},
    {...host(2),revision:NaN},{...host(2),status:'accepted'}]) {
    assert.equal(guard.observe(bad).state,'blocked');
  }
});
test('no executable command or effect capability escapes the surface guard', () => {
  const guard=createHostRevisionGuard();const value=guard.observe(host(2));
  assert.deepEqual(Object.keys(value).sort(), ['changed','reason','state','surface']);
  assert.equal('execute' in guard,false); assert.equal('grant' in guard,false);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
