# File: apps/vivim-host/control/personal-semantic-observer.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/personal-semantic-observer.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3744 B |
| Lines | 62 |
| Hash | 27ab89ec9162 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SEMANTIC_OBSERVATORY_SCHEMA | const | 5 | yes | export const SEMANTIC_OBSERVATORY_SCHEMA=&#39;vivim.semantic-observation/1&#39;; |
| own | function | 6 | no | const own=v=&gt;v!==null&amp;&amp;typeof v===&#39;object&#39;&amp;&amp;!Array.isArray(v)&amp;&amp; |
| canonical | function | 9 | no | const canonical=v=&gt;Array.isArray(v)?v.map(canonical):own(v)? |
| hash | function | 12 | no | const hash=v=&gt;createHash(&#39;sha256&#39;).update(JSON.stringify(canonical(v))).digest(&#39;hex&#39;); |
| normalize | function | 13 | no | const normalize=s=&gt;s.normalize(&#39;NFKC&#39;).trim().replace(/\\s+/g,&#39; &#39;).toLowerCase(); |
| observePersonalLanguage | function | 14 | yes | export function observePersonalLanguage({events,catalog,minConfirmations=3}={}) { |
| groups | const | 18 | no | const groups=new Map(), seenEvents=new Set(); |
| skipped | variable | 19 | no | let skipped=0; |
| draft | const | 31 | no | const draft={schema:PERSONAL_RULE_SCHEMA,id:&#39;rule:temporary&#39;,revision:1, |
| grouping | const | 35 | no | const grouping=[normalize(event.phrase),canonical(event.scope)]; |
| key | const | 36 | no | const key=hash(grouping); |
| meaningKey | const | 38 | no | const meaningKey=hash([event.actionId,event.args]); |
| item | const | 39 | no | const item=record.meanings.get(meaningKey)??{actionId:event.actionId,args:event.args,count:0}; |
| candidates | const | 44 | no | const candidates=[],conflicts=[]; |
| meanings | const | 46 | no | const meanings=[...group.meanings.values()]; |
| meaning | const | 50 | no | const meaning=meanings[0]; |
| rule | const | 52 | no | const rule={schema:PERSONAL_RULE_SCHEMA,id:&#39;rule:observed-&#39;+key.slice(0,24), |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 3 | external |
| ./personal-semantics.mjs | import | 4 | [apps/vivim-host/control/personal-semantics.mjs](./personal-semantics.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/test/personal-semantic-observer.test.mjs](../test/personal-semantic-observer.test.mjs.md) | ../control/personal-semantic-observer.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Passive event-derived semantic observations. Candidates are NEVER activated here.
// A Host-integrated caller must filter actual verified owner-feedback events first.
import { createHash } from 'node:crypto';
import { PERSONAL_RULE_SCHEMA, validatePersonalRule } from './personal-semantics.mjs';
export const SEMANTIC_OBSERVATORY_SCHEMA='vivim.semantic-observation/1';
const own=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
 (Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)&&
 Object.values(Object.getOwnPropertyDescriptors(v)).every(d=>'value' in d);
const canonical=v=>Array.isArray(v)?v.map(canonical):own(v)?
 Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))
  .map(([k,val])=>[k,canonical(val)])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
const normalize=s=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
export function observePersonalLanguage({events,catalog,minConfirmations=3}={}) {
  if(!Array.isArray(events)||events.length>2000||!Number.isSafeInteger(minConfirmations)||
    minConfirmations<2||minConfirmations>20||!catalog||!Array.isArray(catalog.actions))
    return {schema:SEMANTIC_OBSERVATORY_SCHEMA,status:'invalid',candidates:[],conflicts:[]};
  const groups=new Map(), seenEvents=new Set();
  let skipped=0;
  for(const event of events){
    // A receipt or model assertion alone is not semantic consent.
    if(!own(event)||event.kind!=='owner-confirmed-meaning'||
      event.source!=='trusted-host-feedback'||typeof event.phrase!=='string'||
      typeof event.eventId!=='string'||!/^[a-zA-Z0-9._:-]{8,128}$/.test(event.eventId)||
      !own(event.args)||!own(event.scope)||typeof event.actionId!=='string'){
      skipped++;continue;
    }
    // Replay or duplicate delivery must not fabricate repeated confirmations.
    if(seenEvents.has(event.eventId)){skipped++;continue;}
    seenEvents.add(event.eventId);
    const draft={schema:PERSONAL_RULE_SCHEMA,id:'rule:temporary',revision:1,
      phrase:event.phrase,actionId:event.actionId,args:event.args,scope:event.scope,
      source:'system-observed',state:'proposed',catalogVersion:catalog.version};
    if(!validatePersonalRule(draft,catalog).ok){skipped++;continue;}
    const grouping=[normalize(event.phrase),canonical(event.scope)];
    const key=hash(grouping);
    const record=groups.get(key)??{phrase:event.phrase,scope:event.scope,meanings:new Map()};
    const meaningKey=hash([event.actionId,event.args]);
    const item=record.meanings.get(meaningKey)??{actionId:event.actionId,args:event.args,count:0};
    item.count++;
    record.meanings.set(meaningKey,item);
    groups.set(key,record);
  }
  const candidates=[],conflicts=[];
  for(const [key,group] of [...groups].sort(([a],[b])=>a.localeCompare(b))){
    const meanings=[...group.meanings.values()];
    if(meanings.length>1){
      conflicts.push({phraseDigest:key,distinctMeanings:meanings.length});continue;
    }
    const meaning=meanings[0];
    if(meaning.count<minConfirmations)continue;
    const rule={schema:PERSONAL_RULE_SCHEMA,id:'rule:observed-'+key.slice(0,24),
      revision:1,phrase:group.phrase,actionId:meaning.actionId,args:{...meaning.args},
      scope:{...group.scope},state:'proposed',source:'system-observed',
      catalogVersion:catalog.version};
    candidates.push({rule,evidence:{confirmationCount:meaning.count,kind:'explicit-confirmation-only'},
      executionAuthorized:false});
  }
  return {schema:SEMANTIC_OBSERVATORY_SCHEMA,status:'inert-proposals',
    considered:events.length,skipped,groups:groups.size,candidates,conflicts,
    activationPermitted:false};
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
