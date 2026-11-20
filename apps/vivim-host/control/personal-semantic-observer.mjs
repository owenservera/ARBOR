// Passive event-derived semantic observations. Candidates are NEVER activated here.
// A Host-integrated caller must filter actual verified owner-feedback events first.
import { createHash } from 'node:crypto';
import { PERSONAL_RULE_SCHEMA, validatePersonalRule } from './personal-semantics.mjs';
import { runNativeProductPureSync } from './native-product-pure-sync.mjs';

export const SEMANTIC_OBSERVATORY_SCHEMA='vivim.semantic-observation/1';
const own=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
 (Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)&&
 Object.values(Object.getOwnPropertyDescriptors(v)).every(d=>'value' in d);
const canonical=v=>Array.isArray(v)?v.map(canonical):own(v)?
 Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))
  .map(([k,val])=>[k,canonical(val)])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
const normalize=s=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const invalid=()=>({schema:SEMANTIC_OBSERVATORY_SCHEMA,status:'invalid',candidates:[],conflicts:[]});

export function observePersonalLanguage({events,catalog,minConfirmations=3}={}) {
  if(!Array.isArray(events)||events.length>2000||!Number.isSafeInteger(minConfirmations)||
    minConfirmations<2||minConfirmations>20||!catalog||!Array.isArray(catalog.actions))
    return invalid();

  const seenEvents=new Set(),validated=[];
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
    validated.push({phrase:event.phrase,scope:event.scope,
      actionId:event.actionId,args:event.args,
      groupKey:hash([normalize(event.phrase),canonical(event.scope)]),
      meaningKey:hash([event.actionId,event.args])});
  }

  // The native reducer owns only aggregation and contradictory-meaning
  // detection. Host above owns eligibility, replay filtering and identity;
  // proposals below remain inert and cannot become accepted personal rules.
  const native=runNativeProductPureSync('semantic-observation',{
    schema:'vivim.semantic-observation-aggregation-input/1',
    validatedEvents:validated,considered:events.length,skipped,
    catalogVersion:catalog.version,minConfirmations
  });
  if(native){
    const sound=native.schema===SEMANTIC_OBSERVATORY_SCHEMA&&
      native.status==='inert-proposals'&&native.authority==='none'&&
      native.activationPermitted===false&&native.executionAuthorized===false&&
      native.effectPerformed===false&&native.considered===events.length&&
      native.skipped===skipped&&Number.isSafeInteger(native.groups)&&
      native.groups>=0&&native.groups<=validated.length&&
      Array.isArray(native.candidates)&&Array.isArray(native.conflicts)&&
      native.candidates.every(({rule,evidence,executionAuthorized})=>
        executionAuthorized===false&&rule?.schema===PERSONAL_RULE_SCHEMA&&
        rule.state==='proposed'&&rule.source==='system-observed'&&
        rule.revision===1&&rule.catalogVersion===catalog.version&&
        validatePersonalRule(rule,catalog).ok&&
        evidence?.kind==='explicit-confirmation-only'&&
        Number.isSafeInteger(evidence.confirmationCount)&&
        evidence.confirmationCount>=minConfirmations)&&
      native.conflicts.every(row=>/^[a-f0-9]{64}$/.test(row?.phraseDigest??'')&&
        Number.isSafeInteger(row.distinctMeanings)&&row.distinctMeanings>=2);
    return sound?native:invalid();
  }

  // Unpackaged/older native kernels retain the original deterministic path.
  const groups=new Map();
  for(const event of validated){
    const key=event.groupKey,meaningKey=event.meaningKey;
    const record=groups.get(key)??{phrase:event.phrase,scope:event.scope,meanings:new Map()};
    const item=record.meanings.get(meaningKey)??
      {actionId:event.actionId,args:event.args,count:0};
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
