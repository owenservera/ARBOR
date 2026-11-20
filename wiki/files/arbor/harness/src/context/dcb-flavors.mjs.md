# File: harness/src/context/dcb-flavors.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/context/dcb-flavors.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5965 B |
| Lines | 100 |
| Hash | 24ac97a54877 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FLAVOR_POLICY_SCHEMA | const | 4 | yes | export const FLAVOR_POLICY_SCHEMA = &#39;vivim.context-flavor-policy/1&#39;; |
| FLAVOR_COMPOSITION_SCHEMA | const | 5 | yes | export const FLAVOR_COMPOSITION_SCHEMA = &#39;vivim.context-flavor-composition/1&#39;; |
| ID | const | 6 | no | const ID = /^[a-z][a-z0-9-]{0,63}$/; |
| failure | function | 7 | no | const failure = (code,message) =&gt; Object.assign(new Error(message),{code}); |
| SENS | const | 8 | no | const SENS={public:0,internal:1,private:2,sensitive:3,secret:4}; |
| FIELDS | const | 9 | no | const FIELDS=[&#39;identity&#39;,&#39;claims&#39;,&#39;history&#39;,&#39;relations&#39;,&#39;recency&#39;,&#39;provenance&#39;,&#39;task&#39;]; |
| uniq | function | 10 | no | const uniq=a=&gt;[...new Set(a)].sort(); |
| DEFAULT_ROWS | const | 11 | no | const DEFAULT_ROWS=[ |
| INITIAL_FLAVOR_POLICIES | const | 19 | yes | export const INITIAL_FLAVOR_POLICIES=Object.freeze(DEFAULT_ROWS.map(([id,terms,sensitivity,maxAgeDays])=&gt; Object.freeze({ schema:FLAVOR_POLICY_SCHEMA,id,version:&#39;1&#39;,terms:Object.freeze(terms), sensit… |
| normalize | function | 26 | no | function normalize(policy) { |
| terms | const | 34 | no | const terms=uniq(policy.terms.map(t=&gt;{ if(typeof t!==&#39;string&#39;\|\| !/^[a-z][a-z0-9-]{1,63}$/.test(t)) throw failure(&#39;DCB_FLAVOR_POLICY&#39;,&#39;Invalid matching term&#39;); return t; })); |
| prepare | function | 45 | no | function prepare(policies) { |
| rows | const | 47 | no | const rows=policies.map(normalize); |
| ids | function | 51 | no | function ids(x) { |
| detectDcbFlavors | function | 56 | yes | export function detectDcbFlavors({requestText=&#39;&#39;,explicit=[],activity=[],excluded=[], policies=INITIAL_FLAVOR_POLICIES}={}) { |
| registry | const | 59 | no | const registry=prepare(policies), requested=ids(explicit), hints=ids(activity), omitted=ids(excluded); |
| words | const | 61 | no | const words=new Set(requestText.toLowerCase().match(/[a-z0-9-]+/g)??[]); |
| selections | const | 62 | no | const selections=[]; |
| matched | const | 65 | no | const matched=policy.terms.filter(term=&gt;words.has(term)); |
| isExplicit | const | 66 | no | const isExplicit=requested.includes(id), isActivity=hints.includes(id); |
| composeDcbFlavors | function | 77 | yes | export function composeDcbFlavors({selected,policies=INITIAL_FLAVOR_POLICIES}={}) { |
| registry | const | 78 | no | const registry=prepare(policies); |
| selectedIds | const | 79 | no | const selectedIds=ids(selected); |
| rows | const | 84 | no | const rows=selectedIds.map(id=&gt;{ const row=registry.get(id); if(!row) throw failure(&#39;DCB_FLAVOR_UNKNOWN&#39;,&#39;Unknown policy&#39;); return row; }); |
| row | const | 85 | no | const row=registry.get(id); |
| weight | const | 89 | no | const weight=rows.reduce((a,p)=&gt;a+p.weight,0); |
| relevance | const | 90 | no | const relevance=Object.fromEntries(FIELDS.map(k=&gt;[k, Math.round((rows.reduce((a,p)=&gt;a+p.relevance[k]*p.weight,0)/weight)*1e6)/1e6])); |
| ceiling | const | 92 | no | const ceiling=Math.min(...rows.map(x=&gt;SENS[x.sensitivity])); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/context/dcb-policy-eval.mjs](./dcb-policy-eval.mjs.md) | ./dcb-flavors.mjs |
| [harness/src/context/dcb-v2-planner.mjs](./dcb-v2-planner.mjs.md) | ./dcb-flavors.mjs |
| [harness/test/context/dcb-flavors.test.mjs](../../test/context/dcb-flavors.test.mjs.md) | ../../src/context/dcb-flavors.mjs |
| [harness/test/context/dcb-policy-eval.test.mjs](../../test/context/dcb-policy-eval.test.mjs.md) | ../../src/context/dcb-flavors.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// DCB v2 universal flavor policies: pure, deterministic ranking hints only.
// Does not read memories, infer grants, write a graph, authorize or send prompts.
// "Flavor" is domain relevance; legacy DCB "profile" remains a delivery shape.
export const FLAVOR_POLICY_SCHEMA = 'vivim.context-flavor-policy/1';
export const FLAVOR_COMPOSITION_SCHEMA = 'vivim.context-flavor-composition/1';
const ID = /^[a-z][a-z0-9-]{0,63}$/;
const failure = (code,message) => Object.assign(new Error(message),{code});
const SENS={public:0,internal:1,private:2,sensitive:3,secret:4};
const FIELDS=['identity','claims','history','relations','recency','provenance','task'];
const uniq=a=>[...new Set(a)].sort();
const DEFAULT_ROWS=[
  ['project',['project','sprint','implementation','code','release','build','task','architecture'],'internal',90],
  ['personal',['preference','routine','habit','personal','favorite','favourite'],'private',365],
  ['professional',['client','case','contract','deliverable','invoice','professional'],'private',180],
  ['learning',['learn','study','practice','mastery','lesson','course'],'internal',180],
  ['research',['research','evidence','hypothesis','experiment','source','compare'],'internal',365],
  ['life-planning',['plan','appointment','commitment','trip','schedule','event'],'private',120],
];
export const INITIAL_FLAVOR_POLICIES=Object.freeze(DEFAULT_ROWS.map(([id,terms,sensitivity,maxAgeDays])=>
  Object.freeze({
    schema:FLAVOR_POLICY_SCHEMA,id,version:'1',terms:Object.freeze(terms),
    sensitivity,maxAgeDays,weight:1,
    relevance:Object.freeze({identity:1,claims:1,history:1,relations:1,recency:1,provenance:1,task:1}),
  })
));
function normalize(policy) {
  if (!policy || policy.schema!==FLAVOR_POLICY_SCHEMA || typeof policy.id!=='string'||!ID.test(policy.id)
    || typeof policy.version!=='string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(policy.version)
    || !Number.isFinite(policy.weight) || policy.weight<=0 || policy.weight>100
    || !Object.hasOwn(SENS,policy.sensitivity)
    || !Number.isSafeInteger(policy.maxAgeDays) || policy.maxAgeDays<1 || policy.maxAgeDays>36500
    || !Array.isArray(policy.terms) || policy.terms.length>100)
    throw failure('DCB_FLAVOR_POLICY','Invalid flavor policy');
  const terms=uniq(policy.terms.map(t=>{
    if(typeof t!=='string'|| !/^[a-z][a-z0-9-]{1,63}$/.test(t)) throw failure('DCB_FLAVOR_POLICY','Invalid matching term');
    return t;
  }));
  if (!policy.relevance || Object.keys(policy.relevance).sort().join('|')!==[...FIELDS].sort().join('|')
    || FIELDS.some(k=>!Number.isFinite(policy.relevance[k])||policy.relevance[k]<0||policy.relevance[k]>10))
    throw failure('DCB_FLAVOR_POLICY','Invalid relevance policy');
  return {schema:FLAVOR_POLICY_SCHEMA,id:policy.id,version:policy.version,terms,
    sensitivity:policy.sensitivity,maxAgeDays:policy.maxAgeDays,weight:policy.weight,
    relevance:Object.fromEntries(FIELDS.map(k=>[k,policy.relevance[k]]))};
}
function prepare(policies) {
  if(!Array.isArray(policies)||policies.length>64) throw failure('DCB_FLAVOR_LIST','Invalid policy set');
  const rows=policies.map(normalize);
  if(uniq(rows.map(p=>p.id)).length!==rows.length) throw failure('DCB_FLAVOR_LIST','Duplicate flavor ID');
  return new Map(rows.map(row=>[row.id,row]));
}
function ids(x) {
  if(!Array.isArray(x)||x.length>64||x.some(v=>typeof v!=='string'||!ID.test(v)))
    throw failure('DCB_FLAVOR_IDS','Invalid selected flavor IDs');
  return uniq(x);
}
export function detectDcbFlavors({requestText='',explicit=[],activity=[],excluded=[],
  policies=INITIAL_FLAVOR_POLICIES}={}) {
  if(typeof requestText!=='string'||requestText.length>10000) throw failure('DCB_FLAVOR_TEXT','Request text limit');
  const registry=prepare(policies), requested=ids(explicit), hints=ids(activity), omitted=ids(excluded);
  for(const id of [...requested,...hints,...omitted]) if(!registry.has(id)) throw failure('DCB_FLAVOR_UNKNOWN','Unknown policy');
  const words=new Set(requestText.toLowerCase().match(/[a-z0-9-]+/g)??[]);
  const selections=[];
  for(const [id,policy] of registry) {
    if(omitted.includes(id)) continue;
    const matched=policy.terms.filter(term=>words.has(term));
    const isExplicit=requested.includes(id), isActivity=hints.includes(id);
    if(!isExplicit&&!isActivity&&!matched.length) continue;
    selections.push({id,version:policy.version,reason:isExplicit?'explicit':isActivity?'activity':'lexical',
      matchedTerms:matched,weight:policy.weight});
  }
  selections.sort((a,b)=>b.weight-a.weight||a.id.localeCompare(b.id));
  return Object.freeze({
    schema:'vivim.dcb-flavor-detection/1',selected:selections,
    authority:'selection_hint_only',isSendAuthorized:false,
  });
}
export function composeDcbFlavors({selected,policies=INITIAL_FLAVOR_POLICIES}={}) {
  const registry=prepare(policies);
  const selectedIds=ids(selected);
  if(!selectedIds.length) return Object.freeze({
```

_First 80 of 101 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
