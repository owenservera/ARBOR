// VIVIM DCB v1 production source adapters.
// resolveSources/readSource connect the DCB composer
// (harness/src/context/dcb-composer.mjs) to Host/HQ-registered local authorities.
// Discovery is explicit — a registered source list, never a guess at historical
// paths. A source that is absent, unreadable, out of scope or revoked simply
// stays unavailable: no path is fabricated and no stale cache is served. Reads
// are pure, local and bounded: no browser, provider, network, arbitrary shell
// effect, grant creation or write. Durable ingestion stays on the native side;
// this module is bounded retrieval only.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sha = (t) => createHash('sha256').update(t, 'utf8').digest('hex');

export const DCB_LAYERS = Object.freeze(['L0Identity','L1GlobalPrefs','L2Topic','L3Entity',
  'LpProjectState','LdDecisions','L4Conversation','L5JitContext','L6RecentHistory']);
export const CLASS = new Set(['task_evidence','source','decision','test','receipt','personal','conversation','project']);
export const TRUST = { owner_confirmed:1, observed:0.82, sourced:0.72, provider_reported:0.42, untrusted:0.2 };
export const SENS = { public:0,internal:1,private:2,sensitive:3,secret:4 };

const MAX_SOURCE_BYTES = 1000000;
const MEMORY_PREFIX = 'personal-agent/memory/';
const MEMORY_TIERS = Object.freeze(['CANON', 'Immediate', 'Curated']);
const REF_RE = /^[A-Za-z0-9][A-Za-z0-9_.@:/#-]{0,511}$/;

// Registered local authorities that actually exist in the pinned tree. Callers
// (the Host) may replace this with their own registered source list; nothing
// here assumes a path that is absent or requires a customer Git install. Each
// descriptor is validated before use; a malformed one is ignored (unavailable),
// never widened into an allow.
export const DEFAULT_SOURCE_REGISTRY = Object.freeze([
  Object.freeze({ ref: 'docs/product/roadmap/roadmap.v1.json', layer: 'LpProjectState',
    classification: 'task_evidence', trust: 'observed', sensitivity: 'internal',
    keywords: ['roadmap', 'task', 'dependency', 'product', 'capability'], priority: 5 }),
  Object.freeze({ ref: 'docs/product/roadmap/ROADMAP.md', layer: 'LdDecisions',
    classification: 'decision', trust: 'sourced', sensitivity: 'internal',
    keywords: ['roadmap', 'decision', 'requirement', 'prd'], priority: 3 }),
]);

const fail = (code, message) => Object.assign(new Error(message), { code });

function defaultRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
}
// harness/src/context/ -> ..=src -> ..=harness -> ..=repo root

function validRef(ref) {
  return typeof ref === 'string' && ref.length <= 512 && REF_RE.test(ref)
    && !ref.includes('\\') && !ref.startsWith('/') && !/(^|\/)\.\.?($|\/)/.test(ref);
}

function safeRepoRef(repoRoot, ref) {
  const abs = path.resolve(repoRoot, ref);
  const root = path.resolve(repoRoot);
  if (!abs.startsWith(root + path.sep) && abs !== root) return null;
  return abs;
}

// Git HEAD is an OPTIONAL input to the composer's `stale_head` check. A missing
// git, a non-repository root or a git error yields null (no pin) — never a throw.
// It is deliberately NOT cached: a cached head would go stale after a commit and
// replay an old pin. The cheap .git/HEAD existence check only avoids spawning git
// outside a repository.
function gitHead(repoRoot) {
  try { statSync(path.join(repoRoot, '.git', 'HEAD')); } catch { return null; }
  try {
    return String(execFileSync('git', ['rev-parse', 'HEAD'],
      { cwd: repoRoot, encoding: 'utf8', timeout: 3000, maxBuffer: 65536 }).trim()) || null;
  } catch { return null; }
}

function normaliseDescriptor(desc) {
  if (!desc || typeof desc !== 'object' || !validRef(desc.ref)) return null;
  if (!DCB_LAYERS.includes(desc.layer) || !CLASS.has(desc.classification)
      || !Object.hasOwn(TRUST, desc.trust) || !Object.hasOwn(SENS, desc.sensitivity)) return null;
  if (desc.keywords !== undefined && (!Array.isArray(desc.keywords)
      || desc.keywords.length > 100
      || desc.keywords.some(k => typeof k !== 'string' || k.length > 160))) return null;
  return desc;
}

function candidate(ref, repoRoot, desc, head) {
  if (!validRef(ref)) return null;
  const abs = safeRepoRef(repoRoot, ref);
  if (!abs || !existsSync(abs)) return null;
  let stat;
  try { stat = statSync(abs); } catch { return null; }
  if (!stat.isFile()) return null;
  let text;
  try { text = readFileSync(abs, 'utf8'); } catch { return null; }
  if (!text || Buffer.byteLength(text, 'utf8') > MAX_SOURCE_BYTES) return null;
  const digest = sha(text);
  return {
    ref, revision: digest, sha256: digest,
    layer: desc.layer, classification: desc.classification, trust: desc.trust,
    sensitivity: desc.sensitivity, keywords: desc.keywords ?? [],
    updatedAt: desc.updatedAt ?? null, priority: desc.priority ?? 0, head,
    principalRef: desc.principalRef ?? null, projectRef: desc.projectRef ?? null,
    activityRef: desc.activityRef ?? null,
  };
}

// Consent is Host-issued and revocable. When a caller supplies it, private
// sources are default-deny: they require an explicit approval naming the exact
// source. When no consent object is supplied the composer's own disclosure gate
// remains the authority; this filter can only narrow, never widen, disclosure.
function consentAllows(cand, consent) {
  if (consent === undefined || consent === null) return true;
  if (typeof consent !== 'object' || Array.isArray(consent)) return false;
  const privateSource = ['personal', 'conversation'].includes(cand.classification)
    || SENS[cand.sensitivity] >= SENS.private;
  if (!privateSource) return true;
  if (consent.approved !== true) return false;
  return Array.isArray(consent.sourceRefs) && consent.sourceRefs.includes(cand.ref);
}

export function createDcbSourceAdapters({
  repoRoot = defaultRepoRoot(), memoryStore, sources = DEFAULT_SOURCE_REGISTRY,
} = {}) {
  const registry = Array.isArray(sources) ? sources : DEFAULT_SOURCE_REGISTRY;

  async function resolveSources({
    taskRef, purpose, profile, projectRef, principalRef, sourceHead,
    consent = null, revokedSourceRefs = [],
  } = {}) {
    const head = gitHead(repoRoot);
    const candidates = [];
    const seen = new Set();
    const revoked = new Set(Array.isArray(revokedSourceRefs) ? revokedSourceRefs : []);

    const add = (cand) => {
      if (!cand || seen.has(cand.ref)) return;
      // Scoped Host context: never surface a source owned by another principal
      // or project, and never surface a revoked source.
      if (principalRef && cand.principalRef && cand.principalRef !== principalRef) return;
      if (projectRef && cand.projectRef && cand.projectRef !== projectRef) return;
      if (revoked.has(cand.ref)) return;
      if (!consentAllows(cand, consent)) return;
      seen.add(cand.ref);
      candidates.push(cand);
    };

    // Registered authorities: resolve each by actually reading it. Absent,
    // unreadable, oversized or malformed descriptors stay unavailable.
    for (const desc of registry) {
      const d = normaliseDescriptor(desc);
      if (!d) continue;
      add(candidate(d.ref, repoRoot, d, head));
    }

    // Personal-agent memory (private, disclosure-gated by the composer and by
    // the Host-issued consent above). Only surfaced for personal_continuum;
    // each entry is a separate candidate classified 'personal'.
    if (purpose === 'personal_continuum' && memoryStore && typeof memoryStore.load === 'function') {
      try {
        const state = memoryStore.load('primary');
        const version = typeof state.version === 'number' ? String(state.version) : String(head ?? 'unknown');
        for (const tier of MEMORY_TIERS) {
          const entries = Array.isArray(state.memory?.[tier]) ? state.memory[tier] : [];
          for (const entry of entries) {
            if (!entry || typeof entry.key !== 'string' || typeof entry.text !== 'string') continue;
            const ref = `${MEMORY_PREFIX}${tier}/${entry.key}`;
            add({
              ref, revision: version, sha256: sha(entry.text), layer: 'L1GlobalPrefs',
              classification: 'personal', trust: 'owner_confirmed', sensitivity: 'private',
              keywords: [], updatedAt: entry.updatedAt ?? null, priority: 2,
              head: null, principalRef: principalRef ?? null, projectRef: projectRef ?? null,
              activityRef: null,
            });
          }
        }
      } catch {
        // Memory unavailable is not fatal; proceed with non-memory sources.
      }
    }

    return candidates;
  }

  async function readSource({ ref, revision, ranges, head: reqHead }) {
    if (ref.startsWith(MEMORY_PREFIX)) {
      if (!memoryStore || typeof memoryStore.load !== 'function') {
        throw fail('DCB_SOURCE_UNAVAILABLE', 'personal-agent memory store not configured');
      }
      const rest = ref.slice(MEMORY_PREFIX.length);
      const slash = rest.indexOf('/');
      if (slash < 0) throw fail('DCB_SOURCE_INVALID', 'invalid memory source ref');
      const tier = rest.slice(0, slash);
      const key = rest.slice(slash + 1);
      if (!MEMORY_TIERS.includes(tier)) {
        throw fail('DCB_SOURCE_INVALID', 'unknown memory tier');
      }
      const state = memoryStore.load('primary');
      const entries = Array.isArray(state.memory?.[tier]) ? state.memory[tier] : [];
      const entry = entries.find(e => e && e.key === key);
      if (!entry) throw fail('DCB_SOURCE_NOT_FOUND', `memory entry not found: ${ref}`);
      const text = entry.text;
      const digest = sha(text);
      const version = typeof state.version === 'number' ? String(state.version) : 'unknown';
      if (revision !== undefined && revision !== null && revision !== version) {
        throw fail('DCB_REVISION_MISMATCH', `memory revision ${version} != requested ${revision}`);
      }
      return { revision: version, text, sha256: digest };
    }

    const abs = safeRepoRef(repoRoot, ref);
    if (!abs || !existsSync(abs)) throw fail('DCB_SOURCE_NOT_FOUND', `source not found: ${ref}`);
    let stat;
    try { stat = statSync(abs); } catch { throw fail('DCB_SOURCE_NOT_FOUND', `source not found: ${ref}`); }
    if (!stat.isFile()) throw fail('DCB_SOURCE_INVALID', `ref is not a file: ${ref}`);
    const text = readFileSync(abs, 'utf8');
    const digest = sha(text);
    if (revision !== undefined && revision !== null && revision !== digest) {
      throw fail('DCB_REVISION_MISMATCH', `source revision ${digest} != requested ${revision}`);
    }
    let result = text;
    if (ranges && Array.isArray(ranges) && ranges.length) {
      const lines = text.split('\n');
      const parts = [];
      for (const r of ranges) {
        const m = /^L(\d+)-L(\d+)$/.exec(String(r));
        if (!m) continue;
        const start = Math.max(1, Number(m[1]));
        const end = Math.max(start, Number(m[2]));
        parts.push(lines.slice(start - 1, end).join('\n'));
      }
      if (parts.length) result = parts.join('\n');
    }
    return { revision: digest, text: result, sha256: sha(result) };
  }

  return { schema: 'vivim.dynamic-context-bundle-sources/1', resolveSources, readSource };
}