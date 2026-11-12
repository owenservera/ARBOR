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
