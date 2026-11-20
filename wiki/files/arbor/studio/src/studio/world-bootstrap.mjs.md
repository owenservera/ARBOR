# File: studio/src/studio/world-bootstrap.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/world-bootstrap.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3187 B |
| Lines | 56 |
| Hash | f94bc56494db |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WORLD | const | 8 | no | const WORLD=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/; |
| MAX | const | 9 | no | const MAX=100; |
| PERSONALIZATION_SCHEMA | const | 10 | yes | export const PERSONALIZATION_SCHEMA=&#39;vivim.world-personalization/1&#39;; |
| readWorldPersonalization | function | 12 | yes | export function readWorldPersonalization({dataRoot,worldId=&#39;world-local&#39;,limit=50}={}) { |
| file | const | 16 | no | const file=path.join(dataRoot,&#39;bootstrap&#39;,&#39;ledger.db&#39;); |
| empty | const | 17 | no | const empty={schema:PERSONALIZATION_SCHEMA,worldId,state:&#39;no-ledger&#39;, |
| db | variable | 20 | no | let db; |
| preferences | const | 24 | no | const preferences=db.prepare( &#39;SELECT id,key,value,polarity,hard,basis,source,scope,confidence,updated_at FROM preferences WHERE world_id = ? ORDER BY updated_at DESC,id LIMIT ?&#39; ).all(worldId,limit); |
| claims | const | 27 | no | const claims=db.prepare( &#39;SELECT id,pass,section,label,kind,freshness,basis,status,confidence,scope,statement,provenance_id,updated_at FROM claims WHERE world_id = ? ORDER BY updated_at DESC,id LIMIT… |
| passes | const | 30 | no | const passes=db.prepare( &#39;SELECT pass,status,updated_at FROM passes WHERE world_id = ? ORDER BY updated_at DESC,pass LIMIT 15&#39; ).all(worldId); |
| count | function | 33 | no | const count=(table)=&gt;Number(db.prepare(&#39;SELECT COUNT(*) AS total FROM &#39;+table+&#39; WHERE world_id = ?&#39;).get(worldId).total); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 4 | external |
| node:fs | import | 5 | external |
| node:module | import | 6 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/world-service.mjs](./world-service.mjs.md) | ./world-bootstrap.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Source-backed Personal World read model of the Host's durable bootstrap ledger.
// Never writes, migrates, activates inferred data, or copies private facts into a
// second authority. Reads are local Studio-owner-only through World routes.
import path from 'node:path';
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';

const WORLD=/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const MAX=100;
export const PERSONALIZATION_SCHEMA='vivim.world-personalization/1';

export function readWorldPersonalization({dataRoot,worldId='world-local',limit=50}={}) {
  if(typeof dataRoot!=='string'||!path.isAbsolute(dataRoot)||
     !WORLD.test(worldId)||!Number.isInteger(limit)||limit<1||limit>MAX)
    throw new TypeError('Invalid Personal World read scope');
  const file=path.join(dataRoot,'bootstrap','ledger.db');
  const empty={schema:PERSONALIZATION_SCHEMA,worldId,state:'no-ledger',
    source:'host-bootstrap-ledger',preferences:[],claims:[],passes:[],counts:{preferences:0,claims:0}};
  if(!existsSync(file))return empty;
  let db;
  try {
    const {DatabaseSync}=createRequire(import.meta.url)('node:sqlite');
    db=new DatabaseSync(file,{readOnly:true});
    const preferences=db.prepare(
      'SELECT id,key,value,polarity,hard,basis,source,scope,confidence,updated_at FROM preferences WHERE world_id = ? ORDER BY updated_at DESC,id LIMIT ?'
    ).all(worldId,limit);
    const claims=db.prepare(
      'SELECT id,pass,section,label,kind,freshness,basis,status,confidence,scope,statement,provenance_id,updated_at FROM claims WHERE world_id = ? ORDER BY updated_at DESC,id LIMIT ?'
    ).all(worldId,limit);
    const passes=db.prepare(
      'SELECT pass,status,updated_at FROM passes WHERE world_id = ? ORDER BY updated_at DESC,pass LIMIT 15'
    ).all(worldId);
    const count=(table)=>Number(db.prepare('SELECT COUNT(*) AS total FROM '+table+' WHERE world_id = ?').get(worldId).total);
    return {schema:PERSONALIZATION_SCHEMA,worldId,state:'source-backed',
      source:'host-bootstrap-ledger',readOnly:true,
      preferences:preferences.map(p=>({
        id:p.id,key:p.key,value:p.value,polarity:p.polarity,
        hard:p.hard===1,basis:p.basis,source:p.source,scope:p.scope,
        confidence:p.confidence,updatedAt:p.updated_at,
        ownerEditable:p.source==='owner'||p.source==='owner-choice'
      })),
      // Inferred claims remain unactivated observations with explicit provenance.
      claims:claims.map(c=>({
        id:c.id,pass:c.pass,section:c.section,label:c.label,kind:c.kind,
        freshness:c.freshness,basis:c.basis,status:c.status,
        confidence:c.confidence,scope:c.scope,statement:c.statement,
        provenanceId:c.provenance_id,updatedAt:c.updated_at,
        activated:false
      })),
      passes:passes.map(p=>({pass:p.pass,status:p.status,updatedAt:p.updated_at})),
      counts:{preferences:count('preferences'),claims:count('claims')}};
  } catch(e) {
    // Missing/broken/unavailable ledger is not an empty personal profile.
    return {...empty,state:'unavailable',code:e.code||'LEDGER_READ_UNAVAILABLE'};
  } finally {try{db?.close();}catch{}}
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
