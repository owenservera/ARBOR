# File: harness/src/context/dcb-sources.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/context/dcb-sources.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11631 B |
| Lines | 236 |
| Hash | 086b82accbd9 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sha | function | 16 | no | const sha = (t) =&gt; createHash(&#39;sha256&#39;).update(t, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| DCB_LAYERS | const | 18 | yes | export const DCB_LAYERS = Object.freeze([&#39;L0Identity&#39;,&#39;L1GlobalPrefs&#39;,&#39;L2Topic&#39;,&#39;L3Entity&#39;, &#39;LpProjectState&#39;,&#39;LdDecisions&#39;,&#39;L4Conversation&#39;,&#39;L5JitContext&#39;,&#39;L6RecentHistory&#39;]); |
| TRUST | const | 21 | yes | export const TRUST = { owner_confirmed:1, observed:0.82, sourced:0.72, provider_reported:0.42, untrusted:0.2 }; |
| SENS | const | 22 | yes | export const SENS = { public:0,internal:1,private:2,sensitive:3,secret:4 }; |
| MAX_SOURCE_BYTES | const | 24 | no | const MAX_SOURCE_BYTES = 1000000; |
| MEMORY_PREFIX | const | 25 | no | const MEMORY_PREFIX = &#39;personal-agent/memory/&#39;; |
| MEMORY_TIERS | const | 26 | no | const MEMORY_TIERS = Object.freeze([&#39;CANON&#39;, &#39;Immediate&#39;, &#39;Curated&#39;]); |
| REF_RE | const | 27 | no | const REF_RE = /^[A-Za-z0-9][A-Za-z0-9_.@:/#-]{0,511}$/; |
| DEFAULT_SOURCE_REGISTRY | const | 34 | yes | export const DEFAULT_SOURCE_REGISTRY = Object.freeze([ Object.freeze({ ref: &#39;docs/product/roadmap/roadmap.v1.json&#39;, layer: &#39;LpProjectState&#39;, classification: &#39;task_evidence&#39;, trust: &#39;observed&#39;, sensit… |
| fail | function | 43 | no | const fail = (code, message) =&gt; Object.assign(new Error(message), { code }); |
| defaultRepoRoot | function | 45 | no | function defaultRepoRoot() { |
| validRef | function | 50 | no | function validRef(ref) { |
| safeRepoRef | function | 55 | no | function safeRepoRef(repoRoot, ref) { |
| abs | const | 56 | no | const abs = path.resolve(repoRoot, ref); |
| root | const | 57 | no | const root = path.resolve(repoRoot); |
| gitHead | function | 67 | no | function gitHead(repoRoot) { |
| normaliseDescriptor | function | 75 | no | function normaliseDescriptor(desc) { |
| candidate | function | 85 | no | function candidate(ref, repoRoot, desc, head) { |
| abs | const | 87 | no | const abs = safeRepoRef(repoRoot, ref); |
| stat | variable | 89 | no | let stat; |
| text | variable | 92 | no | let text; |
| digest | const | 95 | no | const digest = sha(text); |
| consentAllows | function | 110 | no | function consentAllows(cand, consent) { |
| privateSource | const | 113 | no | const privateSource = [&#39;personal&#39;, &#39;conversation&#39;].includes(cand.classification) |
| createDcbSourceAdapters | function | 120 | yes | export function createDcbSourceAdapters({ repoRoot = defaultRepoRoot(), memoryStore, sources = DEFAULT_SOURCE_REGISTRY, } = {}) { |
| registry | const | 123 | no | const registry = Array.isArray(sources) ? sources : DEFAULT_SOURCE_REGISTRY; |
| resolveSources | function | 125 | no | async function resolveSources({ taskRef, purpose, profile, projectRef, principalRef, sourceHead, consent = null, revokedSourceRefs = [], } = {}) { |
| head | const | 129 | no | const head = gitHead(repoRoot); |
| candidates | const | 130 | no | const candidates = []; |
| seen | const | 131 | no | const seen = new Set(); |
| revoked | const | 132 | no | const revoked = new Set(Array.isArray(revokedSourceRefs) ? revokedSourceRefs : []); |
| add | function | 134 | no | const add = (cand) =&gt; { |
| d | const | 149 | no | const d = normaliseDescriptor(desc); |
| state | const | 159 | no | const state = memoryStore.load(&#39;primary&#39;); |
| version | const | 160 | no | const version = typeof state.version === &#39;number&#39; ? String(state.version) : String(head ?? &#39;unknown&#39;); |
| entries | const | 162 | no | const entries = Array.isArray(state.memory?.[tier]) ? state.memory[tier] : []; |
| ref | const | 165 | no | const ref = `${MEMORY_PREFIX}${tier}/${entry.key}`; |
| readSource | function | 183 | no | async function readSource({ ref, revision, ranges, head: reqHead }) { |
| rest | const | 188 | no | const rest = ref.slice(MEMORY_PREFIX.length); |
| slash | const | 189 | no | const slash = rest.indexOf(&#39;/&#39;); |
| tier | const | 191 | no | const tier = rest.slice(0, slash); |
| key | const | 192 | no | const key = rest.slice(slash + 1); |
| state | const | 196 | no | const state = memoryStore.load(&#39;primary&#39;); |
| entries | const | 197 | no | const entries = Array.isArray(state.memory?.[tier]) ? state.memory[tier] : []; |
| entry | const | 198 | no | const entry = entries.find(e =&gt; e &amp;&amp; e.key === key); |
| text | const | 200 | no | const text = entry.text; |
| digest | const | 201 | no | const digest = sha(text); |
| version | const | 202 | no | const version = typeof state.version === &#39;number&#39; ? String(state.version) : &#39;unknown&#39;; |
| abs | const | 209 | no | const abs = safeRepoRef(repoRoot, ref); |
| stat | variable | 211 | no | let stat; |
| text | const | 214 | no | const text = readFileSync(abs, &#39;utf8&#39;); |
| digest | const | 215 | no | const digest = sha(text); |
| result | variable | 219 | no | let result = text; |
| lines | const | 221 | no | const lines = text.split(&#39;\\n&#39;); |
| parts | const | 222 | no | const parts = []; |
| m | const | 224 | no | const m = /^L(\\d+)-L(\\d+)$/.exec(String(r)); |
| start | const | 226 | no | const start = Math.max(1, Number(m[1])); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 10 | external |
| node:crypto | import | 11 | external |
| node:child_process | import | 12 | external |
| node:path | import | 13 | external |
| node:url | import | 14 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/test/context/dcb-sources.test.mjs](../../test/context/dcb-sources.test.mjs.md) | ../../src/context/dcb-sources.mjs |
| [studio/src/agents/personal-agent-service.mjs](../../../studio/src/agents/personal-agent-service.mjs.md) | ../../../harness/src/context/dcb-sources.mjs |
| [studio/src/studio/conversation-api.mjs](../../../studio/src/studio/conversation-api.mjs.md) | ../../../harness/src/context/dcb-sources.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 236 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
