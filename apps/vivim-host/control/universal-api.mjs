// VIVIM universal API: a derived, owner-scoped description of existing Host
// operations. Never registers actions, grants permission or performs effects.
// @hq:context Machine-readable API surface derived from the canonical Host catalog.
// @hq:invariant Discovery is not authorization or live acceptance.
import { readFileSync } from 'node:fs';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
const BASE = '/api/host/control';
// Research candidates are not executable capabilities. The original snapshot
// remains independent of current Host capability readiness or account grants.
export function readIntegrationTargets() {
  const inventory = JSON.parse(readFileSync(new URL('./integration-targets.v1.json', import.meta.url), 'utf8'));
  if (inventory.schema !== 'vivim.integration-target-inventory/1' ||
      inventory.authority !== 'research-only' || !Array.isArray(inventory.entries) ||
      inventory.entries.length !== inventory.total ||
      new Set(inventory.entries.map(e => e.id)).size !== inventory.total)
    throw new TypeError('Invalid integration research inventory');
  return inventory;
}
// Cursors are integrity-protected, bound to the authenticated owner credential
// or short-lived UI session, exact filters and current projection. No new store.
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const searchError = (code, status = 400) => Object.assign(new Error(code), { code, status });
const READINESS = ['adapter_pending', 'enforcement_missing', 'unsupported', 'source_wired', 'verified'];
const TIERS = ['P0','P1','P2','P3'];
const RISKS = ['R0','R1','R2','R3'];
function queryShape(params, kind) {
  const allowed = new Set(['q','category','limit','cursor', ...(kind === 'actions' ? ['readiness','risk'] : ['tier'])]);
  for (const key of params.keys()) {
    if (!allowed.has(key) || params.getAll(key).length !== 1) throw searchError('API_QUERY_INVALID');
  }
  const get = key => params.get(key) ?? '';
  if (['q','category'].some(key => get(key).length > 160) ||
      (params.has('readiness') && !READINESS.includes(get('readiness'))) ||
      (params.has('risk') && !RISKS.includes(get('risk'))) ||
      (params.has('tier') && !TIERS.includes(get('tier')))) throw searchError('API_QUERY_INVALID');
  const n = params.has('limit') ? get('limit') : '25';
  if (!/^[1-9][0-9]{0,2}$/.test(n) || Number(n)>100) throw searchError('API_QUERY_INVALID');
  if (params.has('cursor') && (!get('cursor') || get('cursor').length > 1024)) throw searchError('API_CURSOR_INVALID');
  return { filters: { q:get('q').trim().toLowerCase(), category:get('category').trim().toLowerCase(),
    ...(kind === 'actions' ? { readiness:get('readiness'), risk:get('risk') } : { tier:get('tier') }) },
    limit:Number(n), cursor:get('cursor') };
}
function cursorSigner(secret) {
  if (typeof secret !== 'string' || secret.length < 32) throw searchError('OWNER_AUTH', 401);
  const key = createHmac('sha256', secret).update('vivim.discovery.cursor/1').digest();
  const sign = body => createHmac('sha256', key).update(body).digest();
  return {
    encode(data) {
      const body = Buffer.from(JSON.stringify(data)).toString('base64url');
      return body + '.' + sign(body).toString('base64url');
    },
    decode(token) {
      const parts = token.split('.');
      if (parts.length !== 2 || !parts.every(p=>/^[A-Za-z0-9_-]+$/.test(p))) throw searchError('API_CURSOR_INVALID');
      const [body, signature] = parts, actual = Buffer.from(signature,'base64url'), expected = sign(body);
      if (actual.length !== expected.length || actual.toString('base64url') !== signature ||
          !timingSafeEqual(actual,expected)) throw searchError('API_CURSOR_INVALID');
      try { return JSON.parse(Buffer.from(body,'base64url').toString('utf8')); }
      catch { throw searchError('API_CURSOR_INVALID'); }
    }
  };
}
export function searchUniversalApi({kind, discovery, inventory, params, secret}) {
  if (!['actions','targets'].includes(kind)) throw searchError('API_QUERY_INVALID');
  const {filters,limit,cursor} = queryShape(params,kind), signer = cursorSigner(secret);
  if (kind === 'actions' && (discovery?.schema !== 'vivim.control-discovery/1' || !Array.isArray(discovery.actions)))
    throw searchError('API_DISCOVERY_UNAVAILABLE',503);
  const source = kind === 'actions' ? discovery.actions.map(capabilitySummary) : (inventory ?? readIntegrationTargets()).entries;
  const id = entry => entry.id;
  const revision = hash([kind,kind === 'actions' ? discovery.version : '2026-11-06',source]);
  const binding = hash([kind,filters,limit]);
  const matches = source.filter(entry => {
    const searchable = [id(entry),entry.title,entry.category,entry.entityArchetype,...(entry.examples ?? [])]
      .filter(v=>typeof v==='string').join(' ').toLowerCase();
    return (!filters.q || filters.q.split(/\s+/).every(word=>searchable.includes(word))) &&
      (!filters.category || String(entry.category).toLowerCase() === filters.category) &&
      (!filters.readiness || entry.readiness === filters.readiness) &&
      (!filters.risk || entry.risk === filters.risk) && (!filters.tier || entry.tier === filters.tier);
  }).sort((a,b)=>id(a)<id(b)?-1:id(a)>id(b)?1:0);
  let start = 0;
  if (cursor) {
    const state = signer.decode(cursor);
    if (!state || state.binding !== binding || typeof state.last !== 'string') throw searchError('API_CURSOR_INVALID');
    if (state.revision !== revision) throw searchError('API_CURSOR_STALE',409);
    const index = matches.findIndex(entry=>id(entry)===state.last);
    if (index < 0) throw searchError('API_CURSOR_INVALID');
    start = index+1;
  }
  const entries = matches.slice(start,start+limit);
  return { schema:'vivim.discovery-page/1', kind, authority:kind==='actions'?'catalog-description-only':'research-only',
    revision, total:matches.length, limit, entries,
    nextCursor:start+entries.length<matches.length?signer.encode({binding,revision,last:id(entries.at(-1))}):null };
}
function capabilitySummary(a) {
  return {id:a.actionId,title:a.title,category:a.category,risk:a.risk,readiness:a.readiness,
    executable:a.executable,available:a.available,liveAcceptance:a.liveAcceptance,reversible:a.reversible,
    args:typedSchema(a).properties.args,examples:a.examples,surfaces:a.surfaces,
    ...(a.precondition?{precondition:a.precondition}:{})};
}
// Exact detail and source coverage are projections, never capability promotion.
export function describeUniversalCapability(discovery, actionId) {
  if (discovery?.schema !== 'vivim.control-discovery/1' || !Array.isArray(discovery.actions))
    throw searchError('API_DISCOVERY_UNAVAILABLE',503);
  const action = discovery.actions.find(a=>a.actionId===actionId);
  if (!action) throw searchError('API_CAPABILITY_UNKNOWN',404);
  const capability = capabilitySummary(action);
  return {schema:'vivim.capability-description/1',authority:'catalog-description-only',
    source:{schema:discovery.schema,catalogVersion:discovery.version,actionId,revision:hash([discovery.version,capability])},
    capability, invocation:{method:'POST',path:BASE+'/plan',inputSchema:typedSchema(action)},
    resultContract:{status:'not-described-by-catalog'},
    semanticMapping:{status:'not-attested',semanticId:null},
    authorization:'not-evaluated'};
}
async function loadStudioDescriptors() {
  const mod=await import('../../../studio/src/studio/browser-atoms.mjs');
  return {registry:await mod.loadRegistry(),targetCount:mod.TARGET_COUNT};
}
export async function describeCapabilitySources(discovery,{loadStudio=loadStudioDescriptors}={}) {
  if (discovery?.schema !== 'vivim.control-discovery/1' || !Array.isArray(discovery.actions))
    throw searchError('API_DISCOVERY_UNAVAILABLE',503);
  const inventory=readIntegrationTargets();
  const actions=discovery.actions.map(capabilitySummary);
  const readiness=Object.fromEntries(READINESS.map(state=>[state,actions.filter(a=>a.readiness===state).length]));
  const host={schema:discovery.schema,version:discovery.version,revision:hash([discovery.version,actions]),
    count:actions.length,readiness,authority:'catalog-description-only'};
  const targets={schema:inventory.schema,snapshot:inventory.snapshot,revision:hash(inventory),
    count:inventory.total,authority:'research-only'};
  let studio={status:'unavailable',authority:'internal-descriptors-only',publicInvocation:false};
  try {
    const {registry,targetCount}=await loadStudio();
    if (registry && Array.isArray(registry.atoms) && Array.isArray(registry.problems) &&
        Array.isArray(registry.missing) && Number.isSafeInteger(targetCount) && targetCount>=0) {
      const familyCounts=Object.entries(registry.families??{}).filter(([k,v])=>/^[a-z0-9-]{1,40}$/.test(k)&&Number.isSafeInteger(v)&&v>=0)
        .sort(([a],[b])=>a<b?-1:a>b?1:0).map(([family,count])=>({family,count}));
      const unique=new Set(registry.atoms.map(a=>a.id)).size;
      studio={status:registry.complete===true&&unique===registry.atoms.length&&registry.atoms.length===targetCount&&registry.missing.length===0&&registry.problems.length===0?'descriptor-complete':'descriptor-partial',
        authority:'internal-descriptors-only',publicInvocation:false,count:registry.atoms.length,unique,targetCount,
        families:familyCounts,missingFamilyCount:registry.missing.length,problemCount:registry.problems.length};
    }
  } catch { /* Missing optional Studio source closure is reported, never fabricated. */ }
  return {schema:'vivim.capability-sources/1',authority:'discovery-only',
    host,researchTargets:targets,studio,
    semantic:{status:'not-attested',mappedCount:null,reason:'No approved per-action HQ identity mapping is supplied by Host discovery.'},
    countsAreNotAdditive:true,liveAcceptance:'not-established-by-source-coverage'};
}
const queryParameter = (name,schema,description) => ({name,in:'query',required:false,schema,description});
function discoveryParameters(kind) {
  return [
    queryParameter('q',{type:'string',maxLength:160},'Case-insensitive token search'),
    queryParameter('category',{type:'string',maxLength:160},'Exact category, case-insensitive'),
    queryParameter('limit',{type:'integer',minimum:1,maximum:100,default:25},'Maximum entries per page'),
    queryParameter('cursor',{type:'string',maxLength:1024},'Opaque cursor; repeat identical filters and page size'),
    ...(kind==='actions'?[queryParameter('readiness',{type:'string',enum:READINESS},'Source readiness'),queryParameter('risk',{type:'string',enum:RISKS},'Canonical risk')]:
      [queryParameter('tier',{type:'string',enum:TIERS},'Research priority tier')])
  ];
}

const json = schema => ({ 'application/json': { schema } });
const response = (description, schema = { type: 'object' }) => ({ description, content: json(schema) });
const closed = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const planId = { type: 'string', pattern: '^ctl-[a-f0-9]{16}$' };
const planDigest = { type: 'string', pattern: '^[a-f0-9]{64}$' };
const mutationHeaders = [
  { name: 'Origin', in: 'header', required: true, schema: { type: 'string' }, description: 'Exact local Host origin.' },
  { name: 'x-vivim-control', in: 'header', required: true, schema: { type: 'string', const: '1' } }
];
function responses(description) {
  return { '200': response(description), '401': response('Owner authorization required'),
    '403': response('Origin, authorization or policy refused'), default: response('Host-defined error or conflict') };
}
function read(operationId, description, parameters) {
  return { operationId, description, ...(parameters ? { parameters } : {}), responses: responses(description) };
}
function post(operationId, description, schema) {
  return { ...read(operationId, description, mutationHeaders),
    requestBody: { required: true, content: json(schema) } };
}
function argumentSchema(spec) {
  if (spec.type === 'enum') return { type: 'string', enum: [...spec.values] };
  if (spec.type === 'string') return { type: 'string', minLength: spec.min, maxLength: spec.max,
    pattern: '^\\S(?:[\\s\\S]*\\S)?$' };
  throw new TypeError('Unsupported Host argument descriptor');
}
function typedSchema(a) {
  const args = closed(Object.fromEntries(Object.entries(a.args).map(([key, spec]) => [key, argumentSchema(spec)])));
  return closed({ actionId: { type: 'string', const: a.actionId }, args },
    Object.keys(a.args).length ? ['actionId', 'args'] : ['actionId']);
}
export function buildUniversalApi(discovery) {
  if (discovery?.schema !== 'vivim.control-discovery/1' || !Array.isArray(discovery.actions))
    throw new TypeError('Expected canonical Host discovery');
  const actions = discovery.actions;
  const typed = actions.map(typedSchema);
  const input = { oneOf: [closed({ text: { type: 'string', minLength: 1, maxLength: 1000 } }), ...typed] };
  return {
    openapi: '3.1.1',
    info: { title: 'VIVIM / ARBOR Universal API', version: '0.2.0',
      description: 'Local owner API derived from the existing Host action catalog. Readiness does not grant access. R0 plans may read; changes require exact owner-approved plans. This contract describes the text and typed subset; other specialized Host surfaces retain their existing contracts.' },
    servers: [{ url: '/' }],
    security: [{ ownerToken: [] }],
    components: { securitySchemes: { ownerToken: { type: 'http', scheme: 'bearer',
      description: 'Existing local Host owner capability, not a provider token.' } } },
    paths: {
      [BASE + '/openapi.json']: { get: read('vivimDescribeApi', 'Discover this owner-scoped API contract') },
      [BASE + '/catalog']: { get: read('vivimDiscoverCapabilities', 'Discover canonical Host capability readiness') },
      [BASE + '/capability-sources']: { get: read('vivimDescribeCapabilitySources', 'Separate Host, research and internal Studio descriptor coverage') },
      [BASE + '/capabilities/{actionId}']: { get: read('vivimDescribeCapability', 'Describe an exact canonical Host action without evaluating authority', [{name:'actionId',in:'path',required:true,schema:{type:'string'}}]) },
      [BASE + '/capabilities']: { get: read('vivimSearchCapabilities', 'Search the Host action catalog without granting access', discoveryParameters('actions')) },
      [BASE + '/integration-targets/search']: { get: read('vivimSearchIntegrationTargets', 'Browse research-only targets in bounded pages', discoveryParameters('targets')) },
      [BASE + '/integration-targets']: { get: read('vivimDiscoverIntegrationTargets', 'Read the original research-only integration inventory; entries are not callable actions') },
      [BASE + '/interpret']: { post: post('vivimInterpret', 'Resolve text without performing a requested effect',
        closed({ text: { type: 'string', maxLength: 1000 } })) },
      [BASE + '/plan']: { post: post('vivimPlan', 'Plan typed or natural-language actions; authorized R0 reads may return results. Mutation previews are not execution.', input) },
      [BASE + '/execute']: { post: post('vivimApproveAndExecute', 'Owner approval of an exact plan; inspect existing receipt if outcome is uncertain. Never automatically retry.', closed({ planId, planDigest })) },
      [BASE + '/plans/{planId}']: { get: read('vivimInspectPlan', 'Inspect original plan and receipt without executing', [{ name: 'planId', in: 'path', required: true, schema: planId }]) }
    },
    'x-vivim': { authority: 'existing-host-dispatcher', catalogVersion: discovery.version,
      scope: 'typed-action-catalog-only', coverage: discovery.coverage,
      capabilities: actions.map(a => ({ id: a.actionId, title: a.title, category: a.category,
        risk: a.risk, readiness: a.readiness, executable: a.executable, available: a.available,
        liveAcceptance: a.liveAcceptance, reversible: a.reversible, args: typedSchema(a).properties.args,
        ...(a.precondition ? { precondition: a.precondition } : {}) })) }
  };
}
