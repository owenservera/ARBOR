# File: packages/vec-ui-engines/src/validators.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | packages/vec-ui-engines/src/validators.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7381 B |
| Lines | 132 |
| Hash | c84f05d74c96 |
| Test | no |
| Generated | no |
| Component | vec-ui-engines |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VALUE_SCHEMA | const | 3 | yes | export const VALUE_SCHEMA = &#39;vivim.ui-engine-value/1&#39;; |
| TYPE_SET | const | 4 | no | const TYPE_SET = new Set([&#39;color&#39;,&#39;color-alpha&#39;,&#39;gradient&#39;,&#39;shadow&#39;,&#39;length&#39;,&#39;number&#39;, &#39;integer&#39;,&#39;duration&#39;,&#39;vector2&#39;,&#39;vector3&#39;,&#39;transform&#39;,&#39;range&#39;,&#39;boolean&#39;,&#39;enum&#39;,&#39;token&#39;,&#39;ref&#39;,&#39;map&#39;]); |
| ID | const | 6 | no | const ID = /^[a-z][a-z0-9_-]*(?:\\.[a-z][a-z0-9_-]*){0,15}$/; // no URI scheme / arbitrary URL |
| REF | const | 7 | no | const REF = /^[a-z][a-z0-9_-]*(?:\\.[a-z][a-z0-9_-]*){0,15}$/; |
| BAD_KEYS | const | 8 | no | const BAD_KEYS=new Set([&#39;__proto__&#39;,&#39;prototype&#39;,&#39;constructor&#39;]); |
| plain | function | 9 | yes | export const plain = v =&gt; v!==null &amp;&amp; typeof v===&#39;object&#39; &amp;&amp; !Array.isArray(v) &amp;&amp; |
| fail | function | 11 | yes | export function fail(code){return {ok:false,code};} |
| valueObject | function | 12 | no | function valueObject(v,keys) { |
| inertData | function | 16 | yes | export function inertData(value,maxNodes=512) { |
| seen | const | 17 | no | const seen=new Set();let visited=0; |
| walk | function | 18 | no | function walk(v,depth) { |
| keys | const | 25 | no | const keys=Reflect.ownKeys(v);if(keys.length&gt;256)return false; |
| d | const | 32 | no | const d=Object.getOwnPropertyDescriptor(v,k); |
| bounded | function | 39 | no | const bounded=(v,a,b)=&gt;typeof v===&#39;number&#39;&amp;&amp;Number.isFinite(v)&amp;&amp;v&gt;=a&amp;&amp;v&lt;=b; |
| normColor | function | 40 | no | function normColor(v){ |
| normLength | function | 52 | no | function normLength(v){ |
| normVector | function | 57 | no | function normVector(v,n) { |
| keys | const | 58 | no | const keys=n===2?[&#39;x&#39;,&#39;y&#39;]:[&#39;x&#39;,&#39;y&#39;,&#39;z&#39;]; |
| validateUiValue | function | 62 | yes | export function validateUiValue(type,value,{choices}={}) { |
| c | const | 68 | no | const c=normColor(value.color);return c===null?fail(&#39;INVALID_COLOR_ALPHA&#39;):{ok:true,value:{color:c,alpha:value.alpha}}; |
| valid | const | 72 | no | const valid=type===&#39;number&#39;?bounded(value,-1e9,1e9): |
| prev | variable | 101 | no | let prev=-1;const stops=[]; |
| c | const | 104 | no | const c=normColor(s.color);if(c===null)return fail(&#39;INVALID_GRADIENT&#39;); |
| c | const | 112 | no | const c=normColor(value.color);const x=normLength(value.offsetX), |
| tr | const | 119 | no | const tr=value.translate===undefined?{x:0,y:0,z:0}:normVector(value.translate,3); |
| rot | const | 120 | no | const rot=value.rotate===undefined?{x:0,y:0,z:0}:normVector(value.rotate,3); |
| sc | const | 121 | no | const sc=value.scale===undefined?{x:1,y:1,z:1}:normVector(value.scale,3); |
| copy | const | 127 | no | const copy=JSON.stringify(value); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/vec-ui-engines/src/compiler.mjs](./compiler.mjs.md) | ./validators.mjs |
| [packages/vec-ui-engines/src/index.mjs](./index.mjs.md) | ./validators.mjs |
| [packages/vec-ui-engines/src/registry.mjs](./registry.mjs.md) | ./validators.mjs |
| [packages/vec-ui-engines/src/tokens.mjs](./tokens.mjs.md) | ./validators.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Pure typed value validation shared by all VEC UI engines.
// No DOM, CSS eval, network, filesystem, dynamic code, or access to Host grants.
export const VALUE_SCHEMA = 'vivim.ui-engine-value/1';
const TYPE_SET = new Set(['color','color-alpha','gradient','shadow','length','number',
  'integer','duration','vector2','vector3','transform','range','boolean','enum','token','ref','map']);
const ID = /^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*){0,15}$/; // no URI scheme / arbitrary URL
const REF = /^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*){0,15}$/;
const BAD_KEYS=new Set(['__proto__','prototype','constructor']);
export const plain = v => v!==null && typeof v==='object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v)===Object.prototype || Object.getPrototypeOf(v)===null);
export function fail(code){return {ok:false,code};}
function valueObject(v,keys) {
  if(!plain(v)||Object.keys(v).some(k=>!keys.includes(k)))return false;
  return true;
}
export function inertData(value,maxNodes=512) {
  const seen=new Set();let visited=0;
  function walk(v,depth) {
    if(++visited>maxNodes||depth>12)return false;
    if(v===null||typeof v==='boolean')return true;
    if(typeof v==='string')return v.length<=1024 && !/[\u0000-\u001f\u007f]/.test(v);
    if(typeof v==='number')return Number.isFinite(v);
    if(typeof v!=='object'||seen.has(v)||(!plain(v)&&!Array.isArray(v)))return false;
    seen.add(v);
    const keys=Reflect.ownKeys(v);if(keys.length>256)return false;
    if(Array.isArray(v)){
      if(v.length>128)return false;
      for(let i=0;i<v.length;i++)if(!Object.hasOwn(v,i))return false;
    }
    for(const k of keys){
      if(typeof k!=='string'||BAD_KEYS.has(k))return false;
      const d=Object.getOwnPropertyDescriptor(v,k);
      if(!d||!Object.hasOwn(d,'value')||!walk(d.value,depth+1))return false;
    }
    seen.delete(v);return true;
  }
  return walk(value,0);
}
const bounded=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
function normColor(v){
  if(typeof v==='string'&&/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/.test(v))return v.toLowerCase();
  // Explicit structured color spaces; renderer must separately declare support.
  if(valueObject(v,['colorSpace','components','alpha']) &&
    ['srgb','display-p3','oklch'].includes(v.colorSpace) &&
    Array.isArray(v.components)&&v.components.length===3 &&
    v.components.every((x,i)=>v.colorSpace==='oklch'?
      (i===0?bounded(x,0,1):i===1?bounded(x,0,.4):bounded(x,0,360)):bounded(x,0,1)) &&
    (v.alpha===undefined||bounded(v.alpha,0,1)))
    return {colorSpace:v.colorSpace,components:[...v.components],...(v.alpha===undefined?{}:{alpha:v.alpha})};
  return null;
}
function normLength(v){
  if(!valueObject(v,['value','unit'])||!bounded(v.value,-4096,4096)||
    !['px','rem','em','%','vw','vh'].includes(v.unit))return null;
  return {value:v.value,unit:v.unit};
}
function normVector(v,n) {
  const keys=n===2?['x','y']:['x','y','z'];
  if(!valueObject(v,keys)||keys.some(k=>!bounded(v[k],-1e6,1e6)))return null;
  return Object.fromEntries(keys.map(k=>[k,v[k]]));
}
export function validateUiValue(type,value,{choices}={}) {
  if(!TYPE_SET.has(type))return fail('UNKNOWN_VALUE_TYPE');
  if(!inertData(value))return fail('NON_INERT_VALUE');
  if(type==='color'){const v=normColor(value);return v===null?fail('INVALID_COLOR'):{ok:true,value:v};}
  if(type==='color-alpha'){
    if(!valueObject(value,['color','alpha'])||!bounded(value.alpha,0,1))return fail('INVALID_COLOR_ALPHA');
    const c=normColor(value.color);return c===null?fail('INVALID_COLOR_ALPHA'):{ok:true,value:{color:c,alpha:value.alpha}};
  }
  if(type==='boolean')return typeof value==='boolean'?{ok:true,value}:fail('INVALID_BOOLEAN');
  if(type==='number'||type==='integer'||type==='duration'){
    const valid=type==='number'?bounded(value,-1e9,1e9):
      type==='integer'?Number.isSafeInteger(value)&&bounded(value,-1e6,1e6):
      Number.isSafeInteger(value)&&bounded(value,0,600000);
    return valid?{ok:true,value}:fail('INVALID_NUMBER');
  }
  if(type==='length'){const v=normLength(value);return v?{ok:true,value:v}:fail('INVALID_LENGTH');}
  if(type==='vector2'||type==='vector3'){const v=normVector(value,type==='vector2'?2:3);return v?{ok:true,value:v}:fail('INVALID_VECTOR');}
  if(type==='range'){
    if(!valueObject(value,['min','max','value','step'])||
```

_First 80 of 133 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
