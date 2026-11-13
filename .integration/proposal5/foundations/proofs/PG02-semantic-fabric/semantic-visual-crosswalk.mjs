/**
 * FA-PG02 staging-only projection: intersections of S SemanticWikiIR, V revisioned
 * semantic projection, W ScreenContext and B Host catalog data. No imports,
 * persistence, I/O, approvals, dispatcher, wiki writer or UI publisher.
 * Caller assertions are NOT authenticated source/actor evidence.
 */
export const TRACE_SCHEMA = 'arbor.fa.pg02.inert-trace/1';
export const PRODUCER_STATES = Object.freeze(['ran','denied','skipped_budget','stale','unavailable','failed']);
const keys = Object.freeze(['source','catalog','policy','graph','world']);
const id = s => typeof s === 'string' && s.length > 0 && s.length <= 128;
const record = x => x !== null && typeof x === 'object' && !Array.isArray(x) &&
  (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
const fail = reason => ({schema:TRACE_SCHEMA,accepted:false,reason,effectPerformed:false,executable:false});
export function sameVersions(a,b) {
  return record(a) && record(b) && keys.every(k=>id(a[k]) && a[k] === b[k]);
}
export function utf16Boundary(s,p) {
  if (typeof s !== 'string' || !Number.isSafeInteger(p) || p < 0 || p > s.length) return false;
  return !(p > 0 && p < s.length && s.charCodeAt(p-1) >= 0xD800 &&
    s.charCodeAt(p-1) <= 0xDBFF && s.charCodeAt(p) >= 0xDC00 && s.charCodeAt(p) <= 0xDFFF);
}
export function checkedSpan(text, span) {
  if (!record(span) || !utf16Boundary(text,span.startUtf16) || !utf16Boundary(text,span.endUtf16) ||
      span.endUtf16 <= span.startUtf16 || text.slice(span.startUtf16,span.endUtf16) !== span.text) return null;
  return {startUtf16:span.startUtf16,endUtf16:span.endUtf16,text:span.text,
    startUtf8:new TextEncoder().encode(text.slice(0,span.startUtf16)).length,
    endUtf8:new TextEncoder().encode(text.slice(0,span.endUtf16)).length,
    sourceRef:id(span.sourceRef) ? span.sourceRef : null};
}
const negatedSend = text => /\b(?:don't|do not|never|without)\s+(?:\w+\s+){0,3}(?:send|share|publish)\b/i.test(text);
/** An intersection, not a new compiler. Only verified future owner ports may populate trusted fields. */
export function intersectTrace({snapshot,current,semanticIR,bindings=[],catalog,producers=[],screen=null,readScope=null,wiki=null,spans=[]}={}) {
  if (!record(snapshot) || !record(current) || snapshot.trustedIngress !== true ||
      !id(snapshot.sessionId) || !id(snapshot.actorRef) || !id(snapshot.worldRef) ||
      !Number.isSafeInteger(snapshot.inputRevision) || snapshot.inputRevision < 1 ||
      typeof snapshot.text !== 'string' || new TextEncoder().encode(snapshot.text).length > 4096 ||
      !utf16Boundary(snapshot.text,snapshot.caretUtf16) || snapshot.composing === true) return fail('INVALID_OR_UNTRUSTED_SNAPSHOT');
  if (!sameVersions(snapshot.versions,current) || snapshot.worldRef !== current.worldRef ||
      snapshot.actorRef !== current.actorRef) return fail('STALE_OR_WRONG_SCOPE');
  if (!record(semanticIR) || semanticIR.schema !== 'vivim.semantic-wiki-ir/0.1' ||
      semanticIR.effectPerformed !== false || !Array.isArray(semanticIR.actions) ||
      !record(catalog) || catalog.schema !== 'vivim.control-action-catalog/1' ||
      !Array.isArray(catalog.actions) || catalog.version !== Number(current.catalog)) return fail('INVALID_SEMANTIC_OR_CATALOG');
  if (!Array.isArray(bindings) || !Array.isArray(producers) || producers.length > 16 ||
      !Array.isArray(spans) || spans.length > 32) return fail('OVER_BUDGET');
  const links = [];
  for (const span of spans) {
    const clean = checkedSpan(snapshot.text,span);
    if (!clean) return fail('INVALID_UTF16_SOURCE_SPAN');
    links.push(clean);
  }
  const coverage=[], omissions=[], candidates=[];
  for (const p of producers) {
    if (!record(p) || !id(p.producerId) || !PRODUCER_STATES.includes(p.status)) return fail('BAD_PRODUCER');
    if (p.sessionId !== snapshot.sessionId || p.inputRevision !== snapshot.inputRevision ||
        !sameVersions(p.versions,current)) {omissions.push({producerId:p.producerId,reason:'STALE_PRODUCER'});continue;}
    if (p.ownerRef !== snapshot.actorRef || p.worldRef !== snapshot.worldRef) {
      omissions.push({producerId:p.producerId,reason:'WRONG_OWNER_OR_WORLD'});continue;
    }
    coverage.push({producerId:p.producerId,status:p.status});
    if (p.status !== 'ran') {
      omissions.push({producerId:p.producerId,reason:'NO_VISIBLE_NODES_'+p.status.toUpperCase()});continue;
    }
    if (!Array.isArray(p.meanings) || p.meanings.length > 16) return fail('BAD_MEANINGS');
    for (const m of p.meanings) {
      if (!record(m) || !id(m.semanticAction)) return fail('BAD_MEANING');
      const a = semanticIR.actions.filter(x=>x.semanticAction === m.semanticAction);
      const b = bindings.filter(x=>x.semanticAction === m.semanticAction);
      if (a.length !== 1 || b.length !== 1) {omissions.push({producerId:p.producerId,reason:'UNKNOWN_OR_AMBIGUOUS_SEMANTIC'});continue;}
      const link = b[0], action = catalog.actions.filter(x=>x.id === link.hostActionId);
      if (action.length !== 1 || link.owner !== action[0].owner ||
          a[0].hostActionId !== action[0].id || a[0].catalogVersion !== catalog.version ||
          a[0].risk !== action[0].risk || a[0].readiness !== action[0].readiness) {
        omissions.push({producerId:p.producerId,reason:'MISSING_STALE_OR_WRONG_HOST_OWNER'});continue;
      }
      if (negatedSend(snapshot.text) && /(?:send|share|publish|provider)/i.test(m.kind||action[0].id)) {
        omissions.push({producerId:p.producerId,reason:'NEGATED_EFFECT'});continue;
      }
      candidates.push({semanticAction:m.semanticAction,hostActionId:action[0].id,
        risk:action[0].risk,readiness:action[0].readiness,status:'source_crosswalk_only',
        sourceRefs:Array.isArray(a[0].sourceRefs)?a[0].sourceRefs.slice(0,16):[],
        permission:'not_assessed',hostOriginalTextReplanRequired:true,authenticatedSource:false,
        effectPerformed:false,executable:false});
    }
  }
  let screenStatus = 'not_requested', screenItems=[];
  if (screen !== null) {
    const scoped = record(readScope) && readScope.authorized === true && readScope.revoked !== true &&
      readScope.ownerRef === snapshot.actorRef && readScope.worldRef === snapshot.worldRef &&
      readScope.policyRevision === current.policy && readScope.purpose === 'autowiki-read';
    const matched = record(screen) && screen.schema === 'vivim.screen-context/0.1' &&
      screen.scope?.authority === 'host-trusted-scope' && screen.scope.ownerRef === snapshot.actorRef &&
      screen.scope.worldRef === snapshot.worldRef && screen.scope.policyRevision === current.policy &&
      screen.revision === snapshot.screenRevision && screen.coverage?.status !== 'denied';
    screenStatus = scoped && matched ? 'source_read_required' : 'denied_or_stale';
    // Never take caller-supplied ScreenContext as source content or a read grant.
    screenItems = [];
  }
  const wikiFreshness = !record(wiki) ? 'unavailable' :
    (wiki.sourceRevision === current.source && wiki.status === 'ready' ? 'current' : 'stale_or_partial');
  return {schema:TRACE_SCHEMA,accepted:true,inputRevision:snapshot.inputRevision,
    text:snapshot.text,caretUtf16:snapshot.caretUtf16,coverage,omissions,candidates,wordLinks:links,
    screen:{status:screenStatus,items:screenItems},wikiFreshness,
    suggestionState:'requires_two_explicit_tab_acceptances',hostAdmission:'not_assessed',
    hostReceipt:null,executable:false,effectPerformed:false};
}
/** Two TABs can choose only inert read-scope slots; no inferred full update action. */
export function twoTabReadProposal({text,projectOptions=[],focusOptions=[],sourceRevision=null}={}) {
  if (typeof text !== 'string' || !/^full(?:\s|$)/i.test(text) ||
      !Array.isArray(projectOptions) || !Array.isArray(focusOptions)) return fail('NO_PREDICTIVE_QUERY');
  const pick = items => items.filter(x=>record(x) && id(x.ref) && x.sourceStatus === 'observed' &&
      x.readOnly === true && x.sourceRevision === sourceRevision).slice(0,8).map(x=>({ref:x.ref,label:x.label,sourceRevision:x.sourceRevision}));
  return {schema:'arbor.fa.pg02.two-tab-read/1',slots:[{tab:1,kind:'project',choices:pick(projectOptions)},
    {tab:2,kind:'focus',choices:pick(focusOptions)}],sourceRevision,
    queryOwner:'hq.source.context',requestedCompleteness:'unsupported',
    needsExplicitProjectAndFocus:true,hostActionId:null,executable:false,effectPerformed:false};
}
