# File: packages/vec-ui-engines/test/tokens.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/vec-ui-engines/test/tokens.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2645 B |
| Lines | 39 |
| Hash | 0c602bb23f88 |
| Test | yes |
| Generated | no |
| Component | vec-ui-engines |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| pkg | function | 4 | no | const pkg=tokens=&gt;({schema:TOKEN_PACKAGE_SCHEMA,tokens}); |
| input | const | 6 | no | const input=pkg({colors:{base:{$type:&#39;color&#39;,$value:&#39;#AB12CD&#39;}, accent:{$type:&#39;color&#39;,$value:&#39;{colors.base}&#39;}}}); |
| x | const | 8 | no | const x=resolveUiTokenPackage(input); |
| cycle | const | 15 | no | const cycle=pkg({a:{$type:&#39;color&#39;,$value:&#39;{b}&#39;},b:{$type:&#39;color&#39;,$value:&#39;{a}&#39;}}); |
| mismatch | const | 17 | no | const mismatch=pkg({a:{$type:&#39;color&#39;,$value:&#39;#000000&#39;},b:{$type:&#39;dimension&#39;,$value:&#39;{a}&#39;}}); |
| evil | const | 28 | no | const evil=Object.defineProperty({},&#39;token&#39;,{get(){throw new Error(&#39;getter&#39;);}}); |
| cyclic | const | 30 | no | const cyclic={};cyclic.foo=cyclic; |
| x | const | 35 | no | const x=resolveUiTokenPackage(pkg({a:{$type:&#39;color&#39;,$value:&#39;#112233&#39;}})); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../src/index.mjs | import | 3 | [packages/vec-ui-engines/src/index.mjs](../src/index.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveUiTokenPackage,resolveUiTokenReference,TOKEN_PACKAGE_SCHEMA} from '../src/index.mjs';
const pkg=tokens=>({schema:TOKEN_PACKAGE_SCHEMA,tokens});
test('valid DTCG-style type and alias resolves to identical value',()=>{
  const input=pkg({colors:{base:{$type:'color',$value:'#AB12CD'},
    accent:{$type:'color',$value:'{colors.base}'}}});
  const x=resolveUiTokenPackage(input);
  assert.equal(x.outcome,'resolved');
  assert.equal(x.tokens['colors.base'].value,'#ab12cd');
  assert.equal(x.tokens['colors.accent'].value,'#ab12cd');
  assert.deepEqual(resolveUiTokenReference(x,'colors.base','color').outcome,'resolved');
});
test('aliases with cycles, wrong type and unknown ref fail closed',()=>{
  const cycle=pkg({a:{$type:'color',$value:'{b}'},b:{$type:'color',$value:'{a}'}});
  assert.equal(resolveUiTokenPackage(cycle).code,'ALIAS_CYCLE');
  const mismatch=pkg({a:{$type:'color',$value:'#000000'},b:{$type:'dimension',$value:'{a}'}});
  assert.equal(resolveUiTokenPackage(mismatch).code,'ALIAS_TYPE_MISMATCH');
  assert.equal(resolveUiTokenPackage(pkg({a:{$type:'color',$value:'{missing}'}})).code,'UNKNOWN_TOKEN_REFERENCE');
});
test('unsupported DTCG token types never infer type by inspection',()=>{
  assert.equal(resolveUiTokenPackage(pkg({size:{$value:{value:10,unit:'px'}}})).code,'UNKNOWN_TOKEN_TYPE');
  assert.equal(resolveUiTokenPackage(pkg({color:{$type:'string',$value:'#AABBCC'}})).code,'UNKNOWN_TOKEN_TYPE');
  assert.equal(resolveUiTokenPackage(pkg({foo:{$type:'color',$value:'url(https://bad)' }})).code,'INVALID_TOKEN_VALUE');
});
test('unknown root fields, getters, cycles and invalid token paths refuse',()=>{
  assert.equal(resolveUiTokenPackage({...pkg({}),code:'run()'}).code,'INVALID_TOKEN_PACKAGE');
  const evil=Object.defineProperty({},'token',{get(){throw new Error('getter');}});
  assert.equal(resolveUiTokenPackage(pkg(evil)).code,'INVALID_TOKEN_PACKAGE');
  const cyclic={};cyclic.foo=cyclic;
  assert.equal(resolveUiTokenPackage(pkg(cyclic)).code,'INVALID_TOKEN_PACKAGE');
  assert.equal(resolveUiTokenPackage(pkg({'__proto__':{$type:'color',$value:'#123456'}})).code,'INVALID_TOKEN_PACKAGE'); // polluted prototype fails closed
});
test('resolved token refs do not install runtime values',()=>{
  const x=resolveUiTokenPackage(pkg({a:{$type:'color',$value:'#112233'}}));
  assert.equal(x.installed,false);
  assert.equal(resolveUiTokenReference(x,'a','dimension').code,'TOKEN_TYPE_MISMATCH');
  assert.equal(resolveUiTokenReference(x,'unknown','color').code,'TOKEN_UNKNOWN');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
