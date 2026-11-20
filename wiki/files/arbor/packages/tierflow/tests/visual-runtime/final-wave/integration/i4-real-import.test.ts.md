# File: packages/tierflow/tests/visual-runtime/final-wave/integration/i4-real-import.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/final-wave/integration/i4-real-import.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 1786 B |
| Lines | 33 |
| Hash | d77bdfdc7a12 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| result | const | 9 | no | const result=await observeRealIntegration4(input); |
| result | const | 18 | no | const result=await observeRealIntegration4({...input,phone:{...input.phone, pairing:{...input.phone.pairing,epoch:2}}}); |
| result | const | 24 | no | const result=await importPinnedLaneModules([]); |
| result | const | 29 | no | const result=await importPinnedLaneModules([{lane:&#39;A&#39;,path:&#39;../../../../src/server.ts&#39;, exportedFunction:&#39;start&#39;,sha256:&#39;a&#39;.repeat(64)}]); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../../integration-4/fixture.ts | import | 4 | [packages/tierflow/tests/visual-runtime/integration-4/fixture.ts](../../integration-4/fixture.ts.md) |
| ../../../../src/visual-runtime/final-wave/integration/runner.ts | import | 5 | [packages/tierflow/src/visual-runtime/final-wave/integration/runner.ts](../../../../src/visual-runtime/final-wave/integration/runner.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
/** Actual I4 integration fixture imports real Wave 3/4 A-H code; never a hardware claim. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from '../../integration-4/fixture.ts';
import { observeRealIntegration4,importPinnedLaneModules } from '../../../../src/visual-runtime/final-wave/integration/runner.ts';

test('H-I4-01: run the real I4 composer, preserve its measured result without promoting to GO',async()=>{
  const {input}=await setup();
  const result=await observeRealIntegration4(input);
  assert.ok(result.status==='BLOCKED'||result.status==='FIXTURE_ONLY');
  assert.equal(result.deviceAcceptance,'UNRUN');
  assert.equal(result.hostAcceptance,'UNRUN');
  if(result.status==='BLOCKED') assert.ok(result.issues.some(s=>s.startsWith('B:')));
  else assert.equal(result.effectInvoked,false);
});
test('H-I4-02: real integration rejects replayed pairing, no automatic workaround',async()=>{
  const {input}=await setup();
  const result=await observeRealIntegration4({...input,phone:{...input.phone,
    pairing:{...input.phone.pairing,epoch:2}}});
  assert.equal(result.status,'BLOCKED');
  assert.ok(result.issues.some(s=>s.startsWith('B:')));
});
test('H-I4-03: source-pinned A-H import manifest fails closed if absent',async()=>{
  const result=await importPinnedLaneModules([]);
  assert.equal(result.length,8);
  assert.ok(result.every(x=>x.status==='unrun'));
});
test('H-I4-04: arbitrary import path is refused before importing',async()=>{
  const result=await importPinnedLaneModules([{lane:'A',path:'../../../../src/server.ts',
    exportedFunction:'start',sha256:'a'.repeat(64)}]);
  assert.equal(result[0]?.status,'blocked');
  assert.equal(result[0]?.code,'UNSAFE_OR_UNPINNED_IMPORT');
});
```

---

[HQ wiki](../../../../../../../../index.md) · [Symbols](../../../../../../../../symbols.md) · [Dependency graph](../../../../../../../../graph.md) · [Documentation](../../../../../../../../docs.md) · [Changes](../../../../../../../../changes.md) · [Open tasks](../../../../../../../../todos.md) · [Deprecated](../../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../../protocol.md) · [Glossary](../../../../../../../../glossary.md) · [Using HQ](../../../../../../../../context.md) · [Capabilities](../../../../../../../../capabilities.md) · [Search index](../../../../../../../../search.json) · [Browser view](../../../../../../../../index.html)
