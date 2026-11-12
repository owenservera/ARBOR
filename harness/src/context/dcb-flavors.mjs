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
    schema:FLAVOR_COMPOSITION_SCHEMA,selected:[],versions:{},relevance:{},
    maxAgeDays:null,sensitivityCeiling:null,authority:'ranking_hints_only',isSendAuthorized:false,
  });
  const rows=selectedIds.map(id=>{
    const row=registry.get(id);
    if(!row) throw failure('DCB_FLAVOR_UNKNOWN','Unknown policy');
    return row;
  });
  const weight=rows.reduce((a,p)=>a+p.weight,0);
  const relevance=Object.fromEntries(FIELDS.map(k=>[k,
    Math.round((rows.reduce((a,p)=>a+p.relevance[k]*p.weight,0)/weight)*1e6)/1e6]));
  const ceiling=Math.min(...rows.map(x=>SENS[x.sensitivity]));
  return Object.freeze({
    schema:FLAVOR_COMPOSITION_SCHEMA,selected:selectedIds,
    versions:Object.fromEntries(rows.map(p=>[p.id,p.version])),
    relevance,maxAgeDays:Math.min(...rows.map(x=>x.maxAgeDays)),
    sensitivityCeiling:Object.keys(SENS).find(k=>SENS[k]===ceiling),
    authority:'ranking_hints_only',isSendAuthorized:false,
  });
}
