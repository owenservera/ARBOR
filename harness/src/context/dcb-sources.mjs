// VIVIM DCB v1 production source adapters.
// resolveSources/readSource connect the DCB composer
// (harness/src/context/dcb-composer.mjs) to real local authorities:
// docs/roadmap.json, docs/capabilities/atomic-registry.json, PRDs,
// git-tracked source files, and personal-agent memory (CANON/Immediate/Curated).
// Pure local reads only: no browser, provider, network, or arbitrary shell effects.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
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
const PRD_GLOB = 'dev/prd/*.md';
const MEMORY_PREFIX = 'personal-agent/memory/';

const fail = (code, message) => Object.assign(new Error(message), { code });

function defaultRepoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
}
// harness/src/context/ -> ..=src -> ..=harness -> ..=repo root

const headCache = new Map();
function gitHead(repoRoot) {
  if (headCache.has(repoRoot)) return headCache.get(repoRoot);
  let result = null;
  try {
    result = String(execFileSync('git', ['rev-parse', 'HEAD'],
      { cwd: repoRoot, encoding: 'utf8', timeout: 3000, maxBuffer: 65536 }).trim());
  } catch { result = null; }
  headCache.set(repoRoot, result);
  return result;
}

function safeRepoRef(repoRoot, ref) {
  const abs = path.resolve(repoRoot, ref);
  const root = path.resolve(repoRoot);
  if (!abs.startsWith(root + path.sep) && abs !== root) return null;
  return abs;
}

function candidate(ref, repoRoot, {layer, classification, trust, sensitivity, keywords = [], updatedAt = null, priority = 0, head}) {
  const abs = safeRepoRef(repoRoot, ref);
  if (!abs || !existsSync(abs)) return null;
  try {
    const stat = statSync(abs);
    if (!stat.isFile()) return null;
  } catch { return null; }
  const text = readFileSync(abs, 'utf8');
  if (!text || Buffer.byteLength(text, 'utf8') > MAX_SOURCE_BYTES) return null;
  const digest = sha(text);
  return {
    ref, revision: digest, sha256: digest, layer, classification, trust, sensitivity,
    keywords, updatedAt, priority, head, principalRef: null, projectRef: null,
  };
}

function prdFiles(repoRoot) {
  const dir = path.join(repoRoot, 'dev', 'prd');
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir)
      .filter(f => /^\d\d-.*\.md$/.test(f))
      .map(f => `dev/prd/${f}`)
      .sort();
  } catch { return []; }
}

export function createDcbSourceAdapters({ repoRoot = defaultRepoRoot(), memoryStore } = {}) {
  const head = gitHead(repoRoot);

  async function resolveSources({ taskRef, purpose, profile, projectRef, principalRef, sourceHead }) {
    const candidates = [];
    const seen = new Set();

    const add = (cand) => {
      if (!cand || seen.has(cand.ref)) return;
      seen.add(cand.ref);
      candidates.push(cand);
    };

    // Roadmap: task evidence + declared dependencies + atomic refs.
    add(candidate('docs/roadmap.json', repoRoot, {
      layer: 'LpProjectState', classification: 'task_evidence', trust: 'observed',
      sensitivity: 'internal', keywords: [taskRef, 'roadmap', 'task', 'dependency'].filter(Boolean),
      priority: 5, head,
    }));
    // Capability registry: capability/interface/flow provenance.
    add(candidate('docs/capabilities/atomic-registry.json', repoRoot, {
      layer: 'L3Entity', classification: 'source', trust: 'sourced',
      sensitivity: 'internal', keywords: ['capability', 'registry', 'interface'], priority: 4, head,
    }));
    // PRDs: requirement source for the task domain.
    for (const prd of prdFiles(repoRoot)) {
      add(candidate(prd, repoRoot, {
        layer: 'LdDecisions', classification: 'decision', trust: 'sourced',
        sensitivity: 'internal', keywords: ['prd', 'requirement'], priority: 3, head,
      }));
    }

    // Personal-agent memory (private, disclosure-gated by the composer).
    // Only surfaced for personal_continuum purpose; each entry is a separate candidate
    // classified 'personal' so the composer's disclosure rules apply before any
    // provider-bound projection.
    if (purpose === 'personal_continuum' && memoryStore && typeof memoryStore.load === 'function') {
      try {
        const state = memoryStore.load('primary');
        const version = typeof state.version === 'number' ? String(state.version) : String(head ?? 'unknown');
        const tiers = ['CANON', 'Immediate', 'Curated'];
        for (const tier of tiers) {
          const entries = Array.isArray(state.memory?.[tier]) ? state.memory[tier] : [];
          for (const entry of entries) {
            if (!entry || typeof entry.key !== 'string' || typeof entry.text !== 'string') continue;
            const ref = `${MEMORY_PREFIX}${tier}/${entry.key}`;
            const digest = sha(entry.text);
            candidates.push({
              ref, revision: version, sha256: digest, layer: 'L1GlobalPrefs',
              classification: 'personal', trust: 'owner_confirmed', sensitivity: 'private',
              keywords: [], updatedAt: entry.updatedAt ?? null, priority: 2,
              head: null, principalRef: principalRef ?? null, projectRef,
              _memory: { tier, key: entry.key },
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
      if (!['CANON', 'Immediate', 'Curated'].includes(tier)) {
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
