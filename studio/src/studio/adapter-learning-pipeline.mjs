// Four-lane integration glue (Z.ai): binds the I1 adapter-improvement pipeline to the
// EXISTING Studio owners — real acceptance producer, real session store, real VersionedStore.
// No second registry, no second browser actor, no new effect authority:
//   - verifyCapture          -> independently re-reads acceptance (G1-G7) + recomputes raw/DOM
//                               digests from the saved session; a client boolean is never trusted.
//   - getTrustedManifests    -> mints server-side session manifests; `lineage` derives ONLY from
//                               immutable capture provenance (rawDigest|domDigest|seqRange), so
//                               re-exports/remounts with new session ids cannot forge independence.
//   - store                  -> expected-version CAS wrapper over the existing VersionedStore
//                               (thin adapter: the SHARED VersionedStore owns the per-name lock,
//                               validation and strict compare-and-save; stale locks fail closed).
// Promotion runs only from SERVER-MINTED proposals (in-memory ledger); an HTTP client can
// submit a digest, never the proposal object. Synthetic evidence can only ever yield
// `test-only-preview` — the pipeline refuses synthetic production promotion by construction.
import { createHash } from 'node:crypto';
import { lstatSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { Session } from '../store/session.mjs';
import { readAcceptance, rawDigest, domDigest, EVALUATOR_VERSION } from '../capture/acceptance.mjs';
import { createGuardedStudioLearner } from './four-lane-gates.mjs';
import { createStudioAdapterLearner } from './adapter-studio-bridge.mjs';
import { acceptedSessionToAdapterEvents, domEvidenceRef, ACCEPTED_SESSION_PRODUCER } from './adapter-accepted-session.mjs';

import chatgptSeed from '../profiles/sites/chatgpt.mjs';
import claudeSeed from '../profiles/sites/claude.mjs';
import geminiSeed from '../profiles/sites/gemini.mjs';
const KNOWN_SEEDS=Object.freeze({chatgpt:chatgptSeed,claude:claudeSeed,gemini:geminiSeed});
// Canonical existing profiles only: never let a client supply a weak baseline for promotion.
export function trustedReadSeed(scope) {
  const seed=KNOWN_SEEDS[scope?.siteId];
  if(!seed)return null;
  let host;try{host=new URL(scope.origin).hostname;}catch{return null;}
  return seed.hosts.includes(host)?seed:null;
}

const sha256hex = (x) => createHash('sha256').update(x).digest('hex');
const coded = (code, extra = {}) => Object.assign(new Error(code), { code, ...extra });

/** Thin I1 adapter over the SHARED persistence owner (VersionedStore, issue #81 P0).
 * All locking, name/version validation, atomic writes and expected-version compare-and-save
 * live in src/store/versioned.mjs; this wrapper only maps an I1 scope key onto a store name
 * (`i1-` + sha256(scopeKey)[0..40]) and enforces the read-only payload rule. It has no lock,
 * no file descriptor and no second CAS implementation, so the factory and I1 cannot diverge.
 *  - promote(name, payload, expectedVersion): null = first write (must not exist), integer =
 *    must equal CURRENT; undefined/0/strings/NaN are rejected (CAS_EXPECTED_VERSION_INVALID).
 *  - rollback(name, targetVersion, expectedVersion): integer expectedVersion only; APPENDS a
 *    new version restoring the target (CURRENT only moves forward, so stale bases stay stale).
 * Locks are never auto-cleared (CAS_LOCKED until an operator uses inspectLock/releaseStaleLock). */
export function createCasVersionedStore({ store, lockDir } = {}) { // lockDir is accepted for compatibility and ignored
  void lockDir;
  if (!store || typeof store.compareAndSave !== 'function' || typeof store.compareAndRollback !== 'function' || typeof store.load !== 'function' ||
      typeof store.current !== 'function' || typeof store.versions !== 'function')
    throw new TypeError('VERSIONED_STORE_REQUIRED');
  // Scope keys are JSON strings (pipeline contract); store names must be filesystem-safe.
  // The mapping is deterministic and injective in practice: sha256(scopeKey).
  const storeName = (name) => 'i1-' + sha256hex(String(name)).slice(0, 40);
  return {
    async current(name) {
      // Read view only: any unreadable/corrupt/unselectable head is "not selectable" (never guessed).
      // Mutations do NOT use this: the store compares the raw CURRENT integer, so such a head can never look absent.
      try {
        const sn = storeName(name);
        if (store.current(sn) === null) return null;
        const rec = store.load(sn);
        if (rec?.sendPermission !== false || !rec?.adapter) return null; // only read-only records are selectable
        return { version: rec.version, adapter: rec.adapter, status: 'active',
          sendPermission: false, readFeatures: Array.isArray(rec.readFeatures) ? rec.readFeatures : [] };
      } catch { return null; }
    },
    async promote(name, payload, expectedVersion) {
      if (!payload || payload.sendPermission !== false) throw coded('CAS_PAYLOAD_MUST_BE_READ_ONLY');
      const rec = store.compareAndSave(storeName(name), payload, { expectedVersion, changeNote: payload.changeNote || 'I1 read-only adapter promotion' });
      return { version: rec.version, name: rec.name, schema: payload.schema, sendPermission: false };
    },
    async rollback(name, targetVersion, expectedVersion) {
      if (!Number.isSafeInteger(targetVersion) || targetVersion < 1) throw coded('INVALID_ROLLBACK_VERSION');
      const rec = store.compareAndRollback(storeName(name), targetVersion, { expectedVersion });
      return { name: rec.name, version: rec.version, restoredFrom: rec.restoredFrom, fromVersion: expectedVersion, rolledBack: true };
    },
  };
}
/** Server-side evidence verifier + trusted manifest provider over the REAL session store. */
export function createTrustedManifestProvider({ sessionsDir } = {}) {
  if (typeof sessionsDir !== 'string' || !sessionsDir) throw new TypeError('SESSIONS_DIR_REQUIRED');
  const exactId = id => typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(id) && id !== 'latest';
  const regularFile = p => lstatSync(p).isFile();
  const directory = p => lstatSync(p).isDirectory();
  const verifySession = (sessionId) => {
    if (!exactId(sessionId)) return null;
    try {
      // Resolve only the exact local capture directory. Session.open normally accepts
      // prefixes/aliases; those are useful for operators but not provenance identity.
      const dir = path.join(sessionsDir,sessionId);
      const raw = path.join(dir,'raw'), kv = path.join(dir,'kv');
      if (!directory(dir) || !directory(raw) || !directory(kv) ||
          !['session.json','acceptance.json'].every(f=>regularFile(path.join(dir,f))) ||
          !regularFile(path.join(kv,'DOM_TURNS.json')) || !regularFile(path.join(raw,'manifest.json'))) return null;
      const files = readdirSync(raw).filter(f=>/^\d{6}\.jsonl$/.test(f)).sort();
      if (!files.length || !files.every(f=>regularFile(path.join(raw,f)))) return null;
      const session = Session.open(sessionsDir,sessionId);
      if (session.id !== sessionId || path.basename(session.dir) !== sessionId || session.meta?.status !== 'complete') return null;
      const doc = readAcceptance(session);
      if (!doc || doc.verdict !== 'capture_accepted' || doc.evaluator?.version !== EVALUATOR_VERSION ||
          !/^[a-f0-9]{64}$/.test(doc.binding?.rawDigest??'') || !/^[a-f0-9]{64}$/.test(doc.binding?.domDigest??'')) return null;
      for (const g of ['G1','G2','G3','G4','G5','G6','G7']) if (doc.gates?.[g]?.value !== 'passed') return null;
      // The raw digest already covers manifest bytes; check the asserted sequence
      // endpoints against that bound manifest, not a caller-editable acceptance label.
      const seq = doc.binding.seqRange, manifest = session.manifest();
      const segments = manifest?.segments;
      if (!Array.isArray(seq) || seq.length!==2 || !seq.every(Number.isSafeInteger) || seq[0]<1 || seq[0]>seq[1] ||
          !Array.isArray(segments) || JSON.stringify(segments.map(x=>x.file))!==JSON.stringify(files) ||
          segments.some(x=>!Number.isSafeInteger(x.records)||x.records<0)) return null;
      const nonempty = segments.filter(x=>x.records>0);
      if (!nonempty.length || nonempty.some(x=>!Number.isSafeInteger(x.firstSeq)||!Number.isSafeInteger(x.lastSeq)||x.firstSeq<1||x.lastSeq<x.firstSeq) ||
          nonempty[0].firstSeq!==seq[0] || nonempty.at(-1).lastSeq!==seq[1]) return null;
      const rd = rawDigest(session);
      if (!rd || rd.digest !== doc.binding.rawDigest || rd.files !== files.length+1) return null;
      const dd = domDigest(session);
      if (!dd || dd !== doc.binding.domDigest) return null;
      return { session, acceptance:doc, rawDigest:rd.digest, domDigest:dd, seqRange:[...seq] };
    } catch { return null; }
  };
  function matchesScope(v,scope) {
    try {
      return !!scope && v.session.meta?.site===scope.siteId &&
        new URL(v.session.meta?.target?.url).origin===scope.origin;
    } catch { return false; }
  }
  async function verifyCapture({ scope, source } = {}) {
    // Saved capture qualification is not account authentication. Only the incumbent
    // accepted-session producer is supported; arbitrary provenance labels are refused.
    if (!source || source.producer!==ACCEPTED_SESSION_PRODUCER ||
        source.accountBinding!=='caller-scoped-unverified' ||
        source.origin!==scope?.origin || source.accountRef!==scope?.accountRef ||
        source.carrier!=='dom' || source.coverage!=='complete' ||
        source.evidenceClass!=='SAVED_REAL_CAPTURE') return false;
    const v = verifySession(source.sessionId);
    if (!v || !matchesScope(v,scope)) return false;
    return v.rawDigest===source.rawDigest && source.captureId===v.session.id &&
      source.domDigest===v.domDigest && source.sequence===v.seqRange[1] &&
      source.evidenceRef===domEvidenceRef(v.session.id,v.domDigest);
  }
  async function getTrustedManifests({ scope, training, heldout } = {}) {
    const idOf = (e) => (typeof e === 'string' ? e : e?.source?.sessionId ?? null);
    const mint = (sessionId) => {
      const v = verifySession(sessionId);
      if (!v || !matchesScope(v,scope)) throw coded('MANIFEST_SESSION_NOT_VERIFIED', { sessionId });
      const seq = v.seqRange;
      // Lineage from immutable content provenance only (digests + sequence range), never
      // filenames, client ids or timestamps: same bytes => same lineage => reuse detected.
      const lineage = sha256hex(JSON.stringify([v.rawDigest, v.domDigest, Array.isArray(seq) ? seq : null]));
      return { id: sessionId, lineage,
        scope: { siteId: scope?.siteId ?? null, origin: scope?.origin ?? null,
          account: scope?.accountRef ?? null, surface: scope?.surface ?? null },
        sourceDigest: v.rawDigest, coverage: 'complete', coreAccepted: true, sourceQualified: true,
        accountBinding:'caller-scoped-unverified' };
    };
    if (!Array.isArray(training) || !Array.isArray(heldout)) throw coded('MANIFEST_SETS_REQUIRED');
    // One manifest per distinct session (events of the same session share one source).
    return { training: [...new Set(training.map(idOf))].map(mint), heldout: [...new Set(heldout.map(idOf))].map(mint) };
  }
  return { verifyCapture, getTrustedManifests, verifySession };
}

/** Full integrated learner. `propose` runs the guarded pipeline (manifest qualification ->
 * intake verification -> Round 8 synthesis -> Round 9 holdout independence -> shadow evaluation);
 * successful proposals are minted server-side into a digest ledger, which is the ONLY path to
 * `promote`. The ledger is intentionally in-memory: a restarted process re-proposes from
 * evidence instead of resurrecting authority. */
export function createStudioLearningPipeline({ sessionsDir, store, lockDir } = {}) {
  const provider = createTrustedManifestProvider({ sessionsDir });
  const casStore = createCasVersionedStore({ store, lockDir });
  // Two proposals doors into the SAME Round 8/9 machinery and the SAME CAS store:
  //  - guarded: manifest qualification + drift gate FIRST (the only production door);
  //  - raw: used ONLY for all-synthetic testOnly previews, which by design cannot pass
  //    core-acceptance manifests and can never be promoted (PROMOTION_NOT_ELIGIBLE).
  const rawLearner = createStudioAdapterLearner({ verifyCapture: provider.verifyCapture, store: casStore });
  const pipeline = createGuardedStudioLearner({
    verifyCapture: provider.verifyCapture, store: casStore, getTrustedManifests: provider.getTrustedManifests,
  });
  const ledger = new Map(); // proposalDigest -> { proposal, promoted }
  const allSynthetic = (events) => Array.isArray(events) && events.length > 0 &&
    events.every((e) => e?.source?.evidenceClass === 'SYNTHETIC_TEST');
  const proposeCore = async (args = {}) => {
      // Caller-provided seeds cannot manipulate production promotion thresholds.
      const qualifiedArgs={...args,seed:trustedReadSeed(args.scope)};
      const proposal = (args?.testOnly === true && allSynthetic(args.training) && allSynthetic(args.heldout))
        ? await rawLearner.propose(qualifiedArgs)
        : await pipeline.propose(qualifiedArgs);
      if (proposal?.proposalDigest) ledger.set(proposal.proposalDigest, { proposal, promoted: false });
      return proposal;
  };
  const api = {
    // Production observation bodies must come from the saved-session hydrator.
    // The event entry point is retained for all-synthetic, explicitly test-only previews.
    async propose(args = {}) {
      if (args.testOnly !== true || !allSynthetic(args.training) || !allSynthetic(args.heldout))
        throw coded('PRODUCTION_SESSION_IDS_REQUIRED');
      return proposeCore(args);
    },
    async proposeFromSessions(args = {}) {
      // HTTP accepts session IDs only. Neither observation bodies nor claimed
      // source hashes may be supplied by the client through this entry point.
      const hydrate = (ids) => {
        if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200 ||
            ids.some(id => typeof id !== 'string' || id.length === 0 || id.length > 128))
          throw coded('SESSION_IDS_REQUIRED');
        return ids.flatMap(id => {
          const verified = provider.verifySession(id);
          if (!verified) throw coded('MANIFEST_SESSION_NOT_VERIFIED', { sessionId: id });
          return acceptedSessionToAdapterEvents({ scope: args.scope, verified });
        });
      };
      return proposeCore({ ...args, training: hydrate(args.training), heldout: hydrate(args.heldout) });
    },
    async promote(proposalDigest) {
      const entry = typeof proposalDigest === 'string' ? ledger.get(proposalDigest) : null;
      if (!entry) throw coded('PROPOSAL_NOT_SERVER_MINTED');
      if (entry.promoted) throw coded('PROPOSAL_ALREADY_PROMOTED');
      const proposal = entry.proposal;
      if (proposal.status !== 'ready-for-read-only-promotion' || proposal.evidenceClass !== 'SAVED_REAL_CAPTURE')
        throw coded('PROMOTION_NOT_ELIGIBLE');
      // The proposal ledger is immutable, but saved capture files are not. Reopen
      // every accepted training/holdout source immediately before the existing CAS.
      const training = proposal.evidence?.trainingSources, heldout = proposal.evidence?.heldoutSources;
      if (!Array.isArray(training) || !training.length || !Array.isArray(heldout) || !heldout.length)
        throw coded('PROMOTION_SOURCE_EVIDENCE_MISSING');
      for (const receipt of [...training,...heldout]) {
        if (!await provider.verifyCapture({scope:proposal.scope,source:{
          // Coverage is derived from the current acceptance verifier, not a caller field.
          ...receipt,producer:receipt.sourceProducer,origin:proposal.scope.origin,accountRef:proposal.scope.accountRef,coverage:'complete',
        }})) throw coded('PROMOTION_SOURCE_STALE');
      }
      let out;
      try { out = await pipeline.promote(proposal); }
      catch (e) {
        // A durable commit whose lock release was unverified MUST NOT be retried as a new promotion.
        if (e?.committed === true) { entry.promoted = true; entry.result = { committed: true, committedVersion: e.committedVersion ?? null }; }
        throw e;
      }
      entry.promoted = true;
      entry.result = out;
      return out;
    },
    // Event-driven only: never starts polling, recapture, or a second browser actor.
    // Safe unattended promotion additionally requires Core-verified account binding.
    async evolve(args={}) {
      if(args.testOnly===true)throw coded('AUTONOMOUS_PRODUCTION_ONLY');
      // Never qualify caller-provided observation bodies. The saved-session path
      // is the sole production producer until another trusted owner is wired.
      return api.evolveFromSessions(args);
    },
    async evolveFromSessions(args={}) {
      if(args.testOnly===true)throw coded('AUTONOMOUS_PRODUCTION_ONLY');
      const proposal=await api.proposeFromSessions({...args,testOnly:false});
      if(proposal.status!=='ready-for-read-only-promotion')
        return {status:'abstained',reason:proposal.status,proposalDigest:proposal.proposalDigest,
          metrics:proposal.metrics,sendPermission:false};
      return api.promoteQualified(proposal);
    },
    async promoteQualified(proposal) {
      const entry = typeof proposal?.proposalDigest === 'string' ? ledger.get(proposal.proposalDigest) : null;
      if (!entry) throw coded('PROPOSAL_NOT_SERVER_MINTED');
      const canonical = entry.proposal;
      // Qualify only the immutable server-minted proposal, never a caller's copy.
      // The current accepted-session producer cannot establish account identity.
      // Do not infer authority from a matching digest or from caller metadata.
      return {status:'abstained',reason:'ACCOUNT_BINDING_NOT_CORE_VERIFIED',
        proposalDigest:canonical.proposalDigest,metrics:canonical.metrics,sendPermission:false};
    },
    rollback: (scope, targetVersion, expectedVersion) => pipeline.rollback(scope, targetVersion, expectedVersion),
    resolveRead: (scope, seed, opts) => pipeline.resolveRead(scope, seed, opts),
    selectReadRule: (scope, feature, seedRule, opts) => pipeline.selectReadRule(scope, feature, seedRule, opts),
    listProposals: () => [...ledger.entries()].map(([digest, e]) => ({
      proposalDigest: digest, status: e.proposal.status, scopeKey: e.proposal.scopeKey,
      evidenceClass: e.proposal.evidenceClass, baseVersion: e.proposal.baseVersion, promoted: e.promoted,
    })),
    getProposal: (digest) => (typeof digest === 'string' ? ledger.get(digest)?.proposal ?? null : null),
  };
  return api;
}
