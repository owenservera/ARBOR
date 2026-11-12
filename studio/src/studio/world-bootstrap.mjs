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
