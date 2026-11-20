# File: studio/src/studio/adapter-capture-to-signals.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/adapter-capture-to-signals.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3390 B |
| Lines | 50 |
| Hash | c17f820079db |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| plain | function | 3 | no | const plain=x=&gt;x&amp;&amp;typeof x===&#39;object&#39;&amp;&amp;!Array.isArray(x); |
| safe | function | 4 | no | const safe=s=&gt;typeof s===&#39;string&#39;&amp;&amp;s.length&gt;0&amp;&amp;s.length&lt;=180&amp;&amp;!/[\\x00-\\x1f\\x7f]/.test(s); |
| allowed | const | 5 | no | const allowed=[&#39;data-testid&#39;,&#39;data-message-author-role&#39;,&#39;data-actor&#39;,&#39;data-role&#39;]; |
| nodeAttrs | function | 6 | no | const nodeAttrs=x=&gt;Object.fromEntries(allowed.filter(k=&gt;safe(x?.[k])).map(k=&gt;[k,x[k]])); |
| signal | function | 7 | no | function signal(node,source,carrier){ |
| attrs | const | 8 | no | const attrs=nodeAttrs(node.attributes); |
| kind | const | 12 | no | const kind=attrs[&#39;data-message-author-role&#39;]??attrs[&#39;data-actor&#39;]??attrs[&#39;data-role&#39;]; |
| feature | const | 13 | no | const feature=(kind??node.role)===&#39;assistant&#39;?&#39;assistant-turn&#39;:(kind??node.role)===&#39;user&#39;?&#39;user-turn&#39;: |
| bind | const | 16 | no | const bind=node.identity; |
| identityVerified | const | 17 | no | const identityVerified=plain(bind)&amp;&amp;bind.verified===true&amp;&amp;bind.evidenceRef===source.evidenceRef&amp;&amp;safe(bind.ref) |
| captureToAdapterEvents | function | 24 | yes | export function captureToAdapterEvents(captures){ |
| obs | const | 28 | no | const obs=[]; |
| nodes | const | 32 | no | const nodes=c[field]??[]; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/adapter-accepted-session.mjs](./adapter-accepted-session.mjs.md) | ./adapter-capture-to-signals.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Generic observation bridge for Capture Studio's accepted DOM/a11y/shape/route events.
// It only derives *candidates*, never verified semantics or browser authority.
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const safe=s=>typeof s==='string'&&s.length>0&&s.length<=180&&!/[\x00-\x1f\x7f]/.test(s);
const allowed=['data-testid','data-message-author-role','data-actor','data-role'];
const nodeAttrs=x=>Object.fromEntries(allowed.filter(k=>safe(x?.[k])).map(k=>[k,x[k]]));
function signal(node,source,carrier){
 const attrs=nodeAttrs(node.attributes);
 // Read the observer's declared role-attribute contract; never copy its text or handle.
 if(/^data-[a-zA-Z0-9-]{1,94}$/.test(node.roleAttribute??'') && ['user','assistant'].includes(node.role))
   attrs[node.roleAttribute]=node.role;
 const kind=attrs['data-message-author-role']??attrs['data-actor']??attrs['data-role'];
 const feature=(kind??node.role)==='assistant'?'assistant-turn':(kind??node.role)==='user'?'user-turn':
   node.a11yRole==='textbox'?'composer':null;
 if(!feature || !Object.keys(attrs).length)return null;
 const bind=node.identity;
 const identityVerified=plain(bind)&&bind.verified===true&&bind.evidenceRef===source.evidenceRef&&safe(bind.ref)
   && ((feature==='assistant-turn'&&bind.role==='assistant')||(feature==='user-turn'&&bind.role==='user'));
 return {feature,attributes:attrs,outcome:node.outcome==='absent'?'absent':node.outcome==='present'?'present':'unknown',
   identityRole:feature==='assistant-turn'?'assistant':feature==='user-turn'?'user':null,
   identityVerdict:identityVerified?'verified':'inferred',identityRef:identityVerified?bind.ref:null,
   evidenceRef:source.evidenceRef,carrier,roleAttribute:node.roleAttribute??null,roleMatch:node.roleMatch??null};
}
export function captureToAdapterEvents(captures){
 if(!Array.isArray(captures)||captures.length>2000)throw new Error('INVALID_CAPTURE_BATCH');
 return captures.map(c=>{
  if(!plain(c)||!plain(c.scope)||!plain(c.source))throw new Error('INVALID_CAPTURE_ENVELOPE');
  const obs=[];
  for(const [field,carrier] of [['dom','dom'],['a11y','a11y']]){
   // Source carrier is independently established by Core; do not relabel DOM as a11y.
   if(c.source.carrier!==carrier)continue;
   const nodes=c[field]??[];
   if(!Array.isArray(nodes)||nodes.length>1000)throw new Error('OBSERVATION_BUDGET');
   for(const n of nodes){const o=signal(n,c.source,carrier);if(o)obs.push(o);}
  }
  // Decode/schema induction may identify typed component paths, NOT message roles.
  for(const x of c.intelligence?.streamComponents??[]){
   if(!['network','correlated'].includes(c.source.carrier))continue;
   if(x?.evidenceRef!==c.source.evidenceRef||x?.sourceKind!=='CORE_DECODED' ||
     !safe(x.path)||x.outcome!=='present')continue;
   obs.push({feature:'stream-component',streamPath:x.path,outcome:'present',evidenceRef:c.source.evidenceRef});
  }
  for(const x of c.intelligence?.routes??[]){
   if(x?.evidenceRef!==c.source.evidenceRef||x?.verifiedNativeRef!==true||!safe(x.routePattern))continue;
   obs.push({feature:'thread-route',routePattern:x.routePattern,outcome:x.outcome==='present'?'present':'unknown',
      identityVerdict:'verified',identityRef:x.bindingRef??null,evidenceRef:c.source.evidenceRef});
  }
  return {scope:c.scope,source:c.source,observations:obs};
 });
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
