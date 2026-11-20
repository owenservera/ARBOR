# File: apps/vivim-host/control/command-context-grounding.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/command-context-grounding.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3941 B |
| Lines | 70 |
| Hash | 306e9afe4c7b |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| COMMAND_CONTEXT_SCHEMA | const | 3 | yes | export const COMMAND_CONTEXT_SCHEMA = &#39;vivim.command-context-projection/1&#39;; |
| GROUNDED_REFERENCE_SCHEMA | const | 4 | yes | export const GROUNDED_REFERENCE_SCHEMA = &#39;vivim.command-grounding/1&#39;; |
| HEX | const | 5 | no | const HEX = /^[a-f0-9]{64}$/; |
| ID | const | 6 | no | const ID = /^[a-z][a-z0-9._:-]{0,127}$/; |
| ARG | const | 7 | no | const ARG = /^[a-z][a-z0-9_]{0,39}$/; |
| own | function | 8 | no | const own = v =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v) &amp;&amp; |
| keys | function | 11 | no | const keys = (v,allowed)=&gt;own(v)&amp;&amp;Object.keys(v).every(k=&gt;allowed.includes(k)); |
| refused | function | 12 | no | const refused = (code,extra={})=&gt;({ schema:GROUNDED_REFERENCE_SCHEMA,outcome:&#39;clarification_required&#39;, reason:code,executionAuthorized:false,...extra, }); |
| groundCommandReferences | function | 20 | yes | export function groundCommandReferences({bundle,requests}={}) { |
| ids | const | 29 | no | const ids=new Set(); |
| values | const | 42 | no | const values={},pins=[],usedArgs=new Set(); |
| selected | variable | 52 | no | let selected=[]; |
| e | const | 59 | no | const e=bundle.entries.find(x=&gt;x.id===selected[0]); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/test/command-context-grounding.test.mjs](../test/command-context-grounding.test.mjs.md) | ../control/command-context-grounding.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Pure, source-pinned reference grounding for Lane A Dynamic Context Bundles.
// No graph writes, provider access, timing inference or authority delegation.
export const COMMAND_CONTEXT_SCHEMA = 'vivim.command-context-projection/1';
export const GROUNDED_REFERENCE_SCHEMA = 'vivim.command-grounding/1';
const HEX = /^[a-f0-9]{64}$/;
const ID = /^[a-z][a-z0-9._:-]{0,127}$/;
const ARG = /^[a-z][a-z0-9_]{0,39}$/;
const own = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v)===Object.prototype || Object.getPrototypeOf(v)===null) &&
  Object.values(Object.getOwnPropertyDescriptors(v)).every(d=>'value' in d);
const keys = (v,allowed)=>own(v)&&Object.keys(v).every(k=>allowed.includes(k));
const refused = (code,extra={})=>({
  schema:GROUNDED_REFERENCE_SCHEMA,outcome:'clarification_required',
  reason:code,executionAuthorized:false,...extra,
});
/**
 * Source-owned adapter supplies an already-built, bounded projection. This module
 * cannot create a "latest" fact; the owner of each source must attest it.
 */
export function groundCommandReferences({bundle,requests}={}) {
  if(!keys(bundle,['schema','revision','digest','entries','selectors']) ||
    bundle.schema!==COMMAND_CONTEXT_SCHEMA ||
    typeof bundle.revision!=='string'||!ID.test(bundle.revision)||
    typeof bundle.digest!=='string'||!HEX.test(bundle.digest)||
    !Array.isArray(bundle.entries)||bundle.entries.length>256||
    !keys(bundle.selectors,['focused','latestApproved']) ||
    !Array.isArray(requests)||requests.length<1||requests.length>16)
    return refused('INVALID_CONTEXT_PROJECTION');
  const ids=new Set();
  for(const e of bundle.entries){
    if(!keys(e,['id','type','value','revision','sourceDigest','status','authority']) ||
      typeof e.id!=='string'||!ID.test(e.id)||
      typeof e.type!=='string'||!ID.test(e.type)||
      typeof e.value!=='string'||e.value.length<1||e.value.length>512||
      typeof e.revision!=='string'||!ID.test(e.revision)||
      typeof e.sourceDigest!=='string'||!HEX.test(e.sourceDigest)||
      !['current','stale'].includes(e.status) ||
      !['host-source','source-adapter'].includes(e.authority) ||
      ids.has(e.id)) return refused('INVALID_CONTEXT_ENTRY');
    ids.add(e.id);
  }
  const values={},pins=[],usedArgs=new Set();
  for(const r of requests) {
    if(!keys(r,['arg','kind','refId','expectedType'])||
      typeof r.arg!=='string'||!ARG.test(r.arg)||usedArgs.has(r.arg)||
      !['focused','explicit','latestApproved'].includes(r.kind)||
      typeof r.expectedType!=='string'||!ID.test(r.expectedType)||
      (r.kind==='explicit' && (typeof r.refId!=='string'||!ID.test(r.refId)))||
      (r.kind!=='explicit' && r.refId!==undefined))
      return refused('INVALID_REFERENCE_REQUEST');
    usedArgs.add(r.arg);
    let selected=[];
    if(r.kind==='explicit') selected=[r.refId];
    else if(r.kind==='focused') selected=bundle.selectors.focused ? [bundle.selectors.focused] : [];
    else selected=bundle.selectors.latestApproved ?? [];
    if(!Array.isArray(selected)||selected.length!==1||typeof selected[0]!=='string')
      return refused('AMBIGUOUS_REFERENCE',{arg:r.arg,candidates:
        Array.isArray(selected)?selected.length:0});
    const e=bundle.entries.find(x=>x.id===selected[0]);
    if(!e) return refused('UNKNOWN_REFERENCE',{arg:r.arg});
    if(e.type!==r.expectedType) return refused('WRONG_REFERENCE_TYPE',{arg:r.arg});
    if(e.status!=='current') return refused('STALE_REFERENCE',{arg:r.arg});
    values[r.arg]=e.value;
    pins.push({arg:r.arg,entityId:e.id,revision:e.revision,sourceDigest:e.sourceDigest});
  }
  return {schema:GROUNDED_REFERENCE_SCHEMA,outcome:'resolved',
    args:values,pins:{bundleRevision:bundle.revision,bundleDigest:bundle.digest,
      references:pins.sort((a,b)=>a.arg.localeCompare(b.arg))},
    executionAuthorized:false};
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
