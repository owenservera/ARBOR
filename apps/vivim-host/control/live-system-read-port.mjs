// Host-owned, source-backed read port over the existing Rust product kernel.
// Pure observational data only: no journal, grant, private content or effect engine.
// Browser-facing route must separately enforce the existing owner capability.
import { randomBytes } from 'node:crypto';
import { runNativeProductPure } from './native-product-pure.mjs';

const INPUT_SCHEMA = 'vivim.live-system-request/1';
const RESPONSE_SCHEMA = 'vivim.live-system-computation/1';
const PUBLIC_SCHEMA = 'vivim.host-live-system/1';
const MAX_REV = Number.MAX_SAFE_INTEGER;
const saneRevision = v => Number.isSafeInteger(v) && v >= 0 && v < MAX_REV;
const stateOf = data => typeof data === 'object' && data !== null && !Array.isArray(data);
const statusOnly = obj => {
  const state = typeof obj?.state === 'string' && /^[a-z][a-z0-9_-]{0,39}$/.test(obj.state)
    ? obj.state : 'unknown';
  return {state};
};
const fail = code => Object.assign(Error(code), {code});
const verifyRust = (reply, op) => {
  if(reply?.schema !== 'vivim.product-pure-response/1' ||
     reply?.operation !== 'live-system' || reply?.state !== 'computed' ||
     reply?.authority !== 'none' || reply?.executionAuthorized !== false ||
     reply?.effectPerformed !== false || reply?.result?.schema !== RESPONSE_SCHEMA ||
     reply.result.state !== 'computed' ||
     reply.result.authority !== 'none' || reply.result.executionAuthorized !== false ||
     reply.result.effectPerformed !== false) throw fail('LIVE_SYSTEM_NATIVE_UNAVAILABLE');
  return reply.result.result;
};
export function createLiveSystemReadPort({
  compute = runNativeProductPure,
  readWiki,
  readStatus,
  readPhoneObservations = async () => [],
  readComposerObservations = async () => [],
  clock = () => Date.now(),
  epoch = 'host.' + randomBytes(12).toString('hex')
} = {}) {
  if(typeof compute !== 'function' || typeof readWiki !== 'function' ||
     typeof readStatus !== 'function' || typeof readPhoneObservations !== 'function' ||
     typeof readComposerObservations !== 'function' ||
     typeof epoch !== 'string' || !/^[a-zA-Z0-9._:-]{1,128}$/.test(epoch))
    throw fail('LIVE_SYSTEM_DEPENDENCY');
  let state = null;
  let chain = Promise.resolve();
  let lastHealth = null;
  let healthRevision = 0;
  const computeRust = async (operation, values) => verifyRust(
    await compute('live-system', {schema: INPUT_SCHEMA, operation, ...values}), operation
  );
  // Source snapshot never includes Wiki content, filenames, private messages,
  // provider tokens or the Host's local filesystem paths.
  const healthSummary = source => ({
    host: statusOnly(source?.host),
    relay: statusOnly(source?.services?.relay),
    chatWorker: statusOnly(source?.services?.chatWorker),
    bridge: statusOnly(source?.bridge)
  });
  async function next() {
    const observedAtMs = clock();
    if(!Number.isSafeInteger(observedAtMs) || observedAtMs <= 0)
      throw fail('LIVE_SYSTEM_CLOCK');
    let current = state ?? await computeRust('new', {epoch});
    if(current?.schema !== 'vivim.live-system-state/1' || current.epoch !== epoch)
      throw fail('LIVE_SYSTEM_STATE_INVALID');
    // Wiki readProjection() replays the one durable Host product journal. Its
    // Wiki revision is not inferred from the time of this HTTP request.
    const projection = await readWiki();
    const wiki = projection?.wiki;
    if(!stateOf(wiki) || !saneRevision(wiki.revision) ||
       !stateOf(wiki.pages)) throw fail('LIVE_SYSTEM_WIKI_UNAVAILABLE');
    const data = {revision: wiki.revision, pageCount: Object.keys(wiki.pages).length};
    const wikiInput = {id: 'wiki.summary', kind: 'knowledge',
      sourceId: 'host.product-journal.wiki', sourceRevision: wiki.revision,
      observedAtMs, freshness: 'current', exposure: 'owner', data, writable: []};
    const wikiReply = await computeRust('integrate',
      {state: current, observation: wikiInput, correlationId: 'read.wiki'});
    current = wikiReply?.state;
    if(current?.schema !== 'vivim.live-system-state/1') throw fail('LIVE_SYSTEM_STATE_INVALID');
    const health = healthSummary(await readStatus());
    const fingerprint = JSON.stringify(health);
    if(lastHealth !== fingerprint) {
      if(healthRevision >= MAX_REV) throw fail('LIVE_SYSTEM_REVISION_EXHAUSTED');
      // This is a Host-process observation revision, not a durable service
      // generation or a guarantee of cross-region atomicity.
      healthRevision += 1;
    }
    const statusInput = {id: 'host.health', kind: 'diagnostics',
      sourceId: 'host.observer', sourceRevision: healthRevision || 1,
      observedAtMs, freshness: 'current', exposure: 'owner',
      data: health, writable: []};
    const healthReply = await computeRust('integrate',
      {state: current, observation: statusInput, correlationId: 'read.host'});
    current = healthReply?.state;
    if(current?.schema !== 'vivim.live-system-state/1')
      throw fail('LIVE_SYSTEM_STATE_INVALID');
    const phoneObservations=await readPhoneObservations();
    if(!Array.isArray(phoneObservations) || phoneObservations.length>2 ||
       phoneObservations.some(o=>!['pwa.input','pwa.view'].includes(o?.id) ||
         o?.sourceId!=='host.first-contact-observer' ||
         (o.id==='pwa.input'&&o.kind!=='input') ||
         (o.id==='pwa.view'&&o.kind!=='visual') ||
         o?.exposure!=='owner' || !Array.isArray(o?.writable) || o.writable.length!==0))
      throw fail('LIVE_SYSTEM_PHONE_OBSERVATION_INVALID');
    for(const observation of phoneObservations){
      const reply=await computeRust('integrate',{state:current,observation,
        correlationId:'read.phone'});
      current=reply?.state;
      if(current?.schema!=='vivim.live-system-state/1') throw fail('LIVE_SYSTEM_STATE_INVALID');
    }
    // Real #text composer observations originate inside the authenticated
    // Direct phone handler, not from the first-contact diagnostic log. The
    // owner-only projection may carry draft text; diagnostics never may.
    const composerObservations=await readComposerObservations();
    if(!Array.isArray(composerObservations)||composerObservations.length>1||
       composerObservations.some(o=>o?.id!=='phone.composer'||o.kind!=='input'||
         o.sourceId!=='host.first-contact-composer'||o.exposure!=='owner'||
         !Array.isArray(o.writable)||o.writable.some(f=>
           f.pointer!=='/draft'||f.primitive!=='text'||
           f.actionId!=='pwa.composer.draft.set')))
      throw fail('LIVE_COMPOSER_OBSERVATION_INVALID');
    for(const observation of composerObservations){
      const response=await computeRust('integrate',{state:current,
        observation,correlationId:'read.composer'});
      current=response?.state;
      if(current?.schema!=='vivim.live-system-state/1')
        throw fail('LIVE_SYSTEM_STATE_INVALID');
    }
    // Enforce the same source-side owner allowlist even if a future region is
    // added to the Rust state. The route rechecks owner authorization.
    const safe = await computeRust('project', {state: current,
      maxExposure: 'owner', allowedIds: ['host.health', 'wiki.summary','pwa.input','pwa.view','phone.composer']});
    if(safe?.schema !== 'vivim.live-system-state/1' || safe.epoch !== epoch ||
       !Array.isArray(safe.regions) ||
       safe.regions.some(r => !['host.health', 'wiki.summary','pwa.input','pwa.view','phone.composer'].includes(r.id)))
      throw fail('LIVE_SYSTEM_STATE_INVALID');
    state = current;
    lastHealth = fingerprint;
    // A partial source projection must never masquerade as a complete active
    // system mirror; full DOM, effects, graph and capture wiring remain open.
    const observedRegions=safe.regions.map(r=>r.id);
    return {schema: PUBLIC_SCHEMA, state: 'source-backed', revision: safe.sequence,
      epoch: safe.epoch, regions: safe.regions,
      coverage:{complete:false, observedRegions, missingCapabilities:[
        'pwa.full-surface','pwa.command-dispatch','screen-capture',
        'execution.state','authority.state','hqkg.full-graph','studio.state']},
      authority: 'read-only-projection',
      executionAuthorized: false, effectPerformed: false};
  }
  // In-memory serialization protects revision fences without introducing a
  // second state writer or any persistent storage.
  function snapshot() {
    const result = chain.then(next);
    chain = result.then(() => {}, () => {});
    return result;
  }
  return Object.freeze({snapshot});
}