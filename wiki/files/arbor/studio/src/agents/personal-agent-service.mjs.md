# File: studio/src/agents/personal-agent-service.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/agents/personal-agent-service.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 25554 B |
| Lines | 393 |
| Hash | a11ae5b80a89 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KEY | const | 22 | no | const KEY = &#39;primary&#39;; |
| token | function | 23 | no | const token = (s) =&gt; typeof s === &#39;string&#39; &amp;&amp; /^[a-z][a-z0-9_-]{0,63}$/.test(s); |
| sha | function | 24 | no | const sha = (s) =&gt; createHash(&#39;sha256&#39;).update(s).digest(&#39;hex&#39;).slice(0, 20); |
| repoRoot | const | 25 | no | const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;..&#39;, &#39;..&#39;, &#39;..&#39;); |
| memoryBlank | function | 26 | no | const memoryBlank = () =&gt; Object.fromEntries(MEMORY_TIERS.map(tier =&gt; [tier, []])); |
| workIdPattern | const | 27 | no | const workIdPattern = /^work-[a-f0-9]{32}$/; |
| RELEVANCE_STOPWORDS | const | 30 | no | const RELEVANCE_STOPWORDS = new Set([&#39;the&#39;, &#39;a&#39;, &#39;an&#39;, &#39;and&#39;, &#39;or&#39;, &#39;to&#39;, &#39;of&#39;, &#39;in&#39;, &#39;on&#39;, &#39;at&#39;, &#39;for&#39;, &#39;with&#39;, &#39;about&#39;, &#39;into&#39;, &#39;from&#39;, &#39;by&#39;, &#39;as&#39;, &#39;is&#39;, &#39;are&#39;, &#39;was&#39;, &#39;were&#39;, &#39;be&#39;, &#39;been&#39;, &#39;this&#39;,… |
| workRelevanceTerms | function | 35 | no | function workRelevanceTerms(title, objective) { |
| words | const | 36 | no | const words = `${title ?? &#39;&#39;} ${objective ?? &#39;&#39;}`.toLocaleLowerCase(&#39;en-US&#39;).match(/[a-z0-9][a-z0-9&#39;-]*/g) ?? []; |
| seen | const | 37 | no | const seen = new Set(); |
| terms | const | 38 | no | const terms = []; |
| term | const | 40 | no | const term = raw.replace(/^[-&#39;]+\|[-&#39;]+$/g, &#39;&#39;); |
| dirScope | function | 52 | no | const dirScope = (root) =&gt; &#39;local-dir-sha256:&#39; + sha(path.resolve(root).split(path.sep).join(&#39;/&#39;)); |
| createPersonalAgentService | function | 54 | yes | export function createPersonalAgentService({ paths, skillsRoot = TOOL_ROOT, getTools = () =&gt; [], clock = () =&gt; new Date().toISOString() } = {}) { |
| store | const | 56 | no | const store = new VersionedStore(path.join(paths.root, &#39;personal-agent&#39;), { kind: &#39;personal agent&#39; }); |
| library | const | 57 | no | const library = createAgenticFileLibrary({ roots: [{ path: skillsRoot, id: &#39;vivim-harness&#39;, untrusted: true }] }); |
| scopeFingerprint | const | 58 | no | const scopeFingerprint = dirScope(paths.root); |
| read | function | 59 | no | const read = () =&gt; { |
| exists | variable | 60 | no | let exists; |
| state | variable | 63 | no | let state; |
| bad | function | 69 | no | const bad = (message, code = &#39;PERSONAL_AGENT_INVALID&#39;) =&gt; problem(400, message, code); |
| versioned | function | 70 | no | const versioned = (state, expectedVersion, note) =&gt; { |
| status | function | 74 | no | function status() { |
| state | const | 75 | no | const state = read(); |
| globalStatus | function | 88 | no | function globalStatus() { |
| initialize | function | 91 | no | function initialize({ expectedVersion } = {}) { |
| state | const | 93 | no | const state = createPersonalAgentBootstrap({ agentId: KEY, ownerId: &#39;local-instance&#39;, now: clock() }); |
| capabilities | function | 103 | no | function capabilities() { |
| scan | const | 104 | no | const scan = library.list(); |
| tools | const | 105 | no | const tools = getTools(); |
| worldInventory | function | 122 | no | function worldInventory() { |
| dir | const | 123 | no | const dir = path.join(paths.root, &#39;world&#39;); |
| world | const | 125 | no | const world = new VersionedStore(dir, { kind: &#39;world item&#39; }); |
| names | const | 126 | no | const names = world.names(); |
| selfKnowledge | function | 133 | no | function selfKnowledge(topic = &#39;all&#39;) { |
| agent | const | 135 | no | const agent = status(); |
| skills | variable | 136 | no | let skills = null; |
| view | const | 138 | no | const view = capabilities(); |
| evidenceFor | function | 152 | no | function evidenceFor(stage, state) { |
| dir | const | 160 | no | const dir = path.join(paths.root, &#39;world&#39;); |
| world | const | 164 | no | const world = new VersionedStore(dir, { kind: &#39;world item&#39; }); |
| names | const | 165 | no | const names = world.names(); |
| counts | const | 166 | no | const counts = { projects: names.filter(x =&gt; x.startsWith(&#39;p-&#39;)).length, notes: names.filter(x =&gt; x.startsWith(&#39;n-&#39;)).length }; |
| memory | const | 172 | no | const memory = state.memory ?? memoryBlank(); |
| discovered | const | 179 | no | const discovered = capabilities(); |
| bootstrap | function | 195 | no | function bootstrap({ expectedVersion } = {}) { |
| state | variable | 199 | no | let state = read(); |
| report | variable | 209 | no | let report; |
| now | const | 219 | no | const now = clock(); |
| next | const | 220 | no | const next = updatePersonalAgentBootstrap(state, { stage, status: report.blocked ? &#39;blocked&#39; : &#39;completed&#39;, evidence: report.refs ?? [], blocker: report.blocked ?? null, now }); |
| corrupt | function | 229 | no | const corrupt = () =&gt; problem(500, &#39;Stored Personal Agent memory tier is not an array&#39;, &#39;PERSONAL_AGENT_STATE_CORRUPT&#39;); |
| tierOf | function | 230 | no | const tierOf = (memory, tier) =&gt; { |
| entries | const | 231 | no | const entries = memory?.[tier] ?? []; |
| memories | function | 235 | no | function memories(tier) { |
| state | const | 237 | no | const state = read(); |
| searchMemory | function | 242 | no | function searchMemory(options = {}) { |
| state | const | 243 | no | const state = read(); |
| remember | function | 247 | no | function remember({ tier, key, text, expectedVersion } = {}) { |
| state | const | 252 | no | const state = read(); |
| memory | const | 255 | no | const memory = structuredClone(state.memory ?? memoryBlank()); |
| entries | const | 256 | no | const entries = tierOf(memory, tier); |
| stamp | const | 258 | no | const stamp = clock(); |
| i | const | 260 | no | const i = entries.findIndex(x =&gt; x.key === key); |
| forget | function | 267 | no | function forget({ tier, key, expectedVersion } = {}) { |
| state | const | 271 | no | const state = read(); |
| memory | const | 274 | no | const memory = structuredClone(state.memory ?? memoryBlank()); |
| old | const | 275 | no | const old = tierOf(memory, tier); |
| relevantMemoryForWork | function | 285 | no | function relevantMemoryForWork({ id, tier = &#39;all&#39;, limit = 20 } = {}) { |
| state | const | 289 | no | const state = read(); |
| work | const | 291 | no | const work = Array.isArray(state.work) ? state.work : []; |
| item | const | 292 | no | const item = work.find(entry =&gt; entry?.id === id); |
| terms | const | 294 | no | const terms = workRelevanceTerms(item.title, item.objective); |
| merged | const | 295 | no | const merged = new Map(); |
| result | variable | 297 | no | let result; |
| mapKey | const | 301 | no | const mapKey = hit.tier + &#39;/&#39; + hit.key; |
| prior | const | 302 | no | const prior = merged.get(mapKey); |
| ranked | const | 307 | no | const ranked = [...merged.values()].sort((a, b) =&gt; b.matchedTerms.size - a.matchedTerms.size \|\| String(b.updatedAt ?? &#39;&#39;).localeCompare(String(a.updatedAt ?? &#39;&#39;))); |
| shown | const | 309 | no | const shown = ranked.slice(0, limit).map(({ matchedTerms, ...hit }) =&gt; ({ ...hit, matchedTerms: [...matchedTerms] })); |
| continuity | function | 318 | no | function continuity() { |
| state | const | 319 | no | const state = read(); |
| contextBundle | function | 327 | no | async function contextBundle({ taskRef, taskText = &#39;&#39;, purpose = &#39;personal_continuum&#39;, profile = &#39;continuum&#39;, audience, scope, disclosure, maxInputTokens = 1800, reservedForUserPrompt = 400, reserved… |
| state | const | 330 | no | const state = read(); |
| au | const | 333 | no | const au = audience \|\| { principalRef: &#39;owner&#39;, projectRef: scopeFingerprint, |
| mem | const | 335 | no | const mem = { |
| resolveSources | function | 339 | no | const resolveSources = (params) =&gt; baseResolveSources({ ...params, principalRef: au.principalRef }); |
| composer | const | 340 | no | const composer = createDCBComposer({ resolveSources, readSource }); |
| exportSnapshot | function | 349 | no | function exportSnapshot({ includeMemory = false, includeWorkDetails = false } = {}) { |
| state | const | 350 | no | const state = read(); |
| workList | function | 355 | no | function workList() { |
| state | const | 356 | no | const state = read(); |
| createWorkItem | function | 361 | no | function createWorkItem({ expectedVersion, title, objective, idempotencyKey } = {}) { |
| state | const | 364 | no | const state = read(); |
| result | const | 367 | no | const result = createWork(state, { title, objective, idempotencyKey, now: clock() }); |
| transitionWorkItem | function | 372 | no | function transitionWorkItem({ expectedVersion, id, to, note, evidence, idempotencyKey } = {}) { |
| state | const | 374 | no | const state = read(); |
| result | const | 376 | no | const result = transitionWork(state, { id, to, note, evidence, idempotencyKey, now: clock() }); |
| updateWorkNextAction | function | 381 | no | function updateWorkNextAction({ expectedVersion, id, nextAction } = {}) { |
| state | const | 383 | no | const state = read(); |
| result | const | 385 | no | const result = setWorkNextAction(state, { id, nextAction, now: clock() }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 2 | external |
| node:url | import | 3 | external |
| node:fs | import | 4 | external |
| node:crypto | import | 5 | external |
| ../config.mjs | import | 6 | [studio/src/config.mjs](../config.mjs.md) |
| ./personal-agent-work.mjs | import | 7 | [studio/src/agents/personal-agent-work.mjs](./personal-agent-work.mjs.md) |
| ./personal-agent-memory-search.mjs | import | 8 | [studio/src/agents/personal-agent-memory-search.mjs](./personal-agent-memory-search.mjs.md) |
| ./personal-agent-self-knowledge.mjs | import | 9 | [studio/src/agents/personal-agent-self-knowledge.mjs](./personal-agent-self-knowledge.mjs.md) |
| ./personal-agent-continuity.mjs | import | 10 | [studio/src/agents/personal-agent-continuity.mjs](./personal-agent-continuity.mjs.md) |
| ./personal-ai-contracts.mjs | import | 11 | [studio/src/agents/personal-ai-contracts.mjs](./personal-ai-contracts.mjs.md) |
| ../store/versioned.mjs | import | 12 | [studio/src/store/versioned.mjs](../store/versioned.mjs.md) |
| ../studio/agentic-files.mjs | import | 13 | [studio/src/studio/agentic-files.mjs](../studio/agentic-files.mjs.md) |
| ../studio/http.mjs | import | 14 | [studio/src/studio/http.mjs](../studio/http.mjs.md) |
| ../../../harness/src/context/dcb-composer.mjs | import | 15 | [harness/src/context/dcb-composer.mjs](../../../harness/src/context/dcb-composer.mjs.md) |
| ../../../harness/src/context/dcb-sources.mjs | import | 16 | [harness/src/context/dcb-sources.mjs](../../../harness/src/context/dcb-sources.mjs.md) |
| ./personal-agent-bootstrap.mjs | import | 17 | [studio/src/agents/personal-agent-bootstrap.mjs](./personal-agent-bootstrap.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/wh-mcp.mjs](../../../harness/bin/wh-mcp.mjs.md) | ../../studio/src/agents/personal-agent-service.mjs |
| [harness/bin/wh.mjs](../../../harness/bin/wh.mjs.md) | ../../studio/src/agents/personal-agent-service.mjs |
| [harness/src/dev/cli.mjs](../../../harness/src/dev/cli.mjs.md) | ../../../studio/src/agents/personal-agent-service.mjs |
| [studio/bin/commands/personal-agent.mjs](../../bin/commands/personal-agent.mjs.md) | ../../src/agents/personal-agent-service.mjs |
| [studio/src/studio/personal-agent-routes.mjs](../studio/personal-agent-routes.mjs.md) | ../agents/personal-agent-service.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Local-first Personal Agent scaffold. No independent browser owner, daemon, model or permission grant.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { TOOL_ROOT } from '../config.mjs';
import { createWork, transitionWork, setWorkNextAction, workSummary } from './personal-agent-work.mjs';
import { searchPersonalAgentMemory } from './personal-agent-memory-search.mjs';
import { buildSelfKnowledge, SELF_KNOWLEDGE_TOPICS } from './personal-agent-self-knowledge.mjs';
import { createContinuityPacket, createPortableSnapshot } from './personal-agent-continuity.mjs';
import { buildGlobalStatus } from './personal-ai-contracts.mjs';
import { VersionedStore } from '../store/versioned.mjs';
import { createAgenticFileLibrary } from '../studio/agentic-files.mjs';
import { problem, storeProblem } from '../studio/http.mjs';
import { createDCBComposer } from '../../../harness/src/context/dcb-composer.mjs';
import { createDcbSourceAdapters } from '../../../harness/src/context/dcb-sources.mjs';
import {
  BOOTSTRAP_STAGES, MEMORY_TIERS, createPersonalAgentBootstrap,
  nextPersonalAgentBootstrapStage, updatePersonalAgentBootstrap, validatePersonalAgentBootstrap,
} from './personal-agent-bootstrap.mjs';

const KEY = 'primary';
const token = (s) => typeof s === 'string' && /^[a-z][a-z0-9_-]{0,63}$/.test(s);
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 20);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const memoryBlank = () => Object.fromEntries(MEMORY_TIERS.map(tier => [tier, []]));
const workIdPattern = /^work-[a-f0-9]{32}$/;
// A single literal full-title query almost never matches saved memory text. These are generic
// low-signal connector words only; they never discard a meaningful domain term from the title/objective.
const RELEVANCE_STOPWORDS = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'at', 'for', 'with',
  'about', 'into', 'from', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'this', 'that', 'it', 'its',
  'your', 'my', 'our', 'their', 'i', 'you', 'he', 'she', 'they', 'we']);
// Derive bounded, deduplicated keyword terms from user-authored Work title/objective text.
// Pure and local: no provider call, no generative expansion, just tokenization.
function workRelevanceTerms(title, objective) {
  const words = `${title ?? ''} ${objective ?? ''}`.toLocaleLowerCase('en-US').match(/[a-z0-9][a-z0-9'-]*/g) ?? [];
  const seen = new Set();
  const terms = [];
  for (const raw of words) {
    const term = raw.replace(/^[-']+|[-']+$/g, '');
    if (term.length < 3 || RELEVANCE_STOPWORDS.has(term) || seen.has(term)) continue;
    seen.add(term);
    terms.push(term);
    if (terms.length >= 8) break; // bounded cost: at most 8 local searches per lookup
  }
  return terms;
}
// Stable fingerprint of THIS local data directory. It distinguishes two local instances without exposing the
// path, and it is deliberately not a device, account or cross-device identity. Separators are normalised with
// path.sep (host data, never a platform branch) so the same root hashes the same on every host; letter case is
// left alone because folding it would collapse two genuinely distinct case-sensitive directories into one scope.
const dirScope = (root) => 'local-dir-sha256:' + sha(path.resolve(root).split(path.sep).join('/'));

export function createPersonalAgentService({ paths, skillsRoot = TOOL_ROOT, getTools = () => [], clock = () => new Date().toISOString() } = {}) {
  if (!paths?.root || !path.isAbsolute(paths.root)) throw new TypeError('Absolute paths.root required');
  const store = new VersionedStore(path.join(paths.root, 'personal-agent'), { kind: 'personal agent' });
  const library = createAgenticFileLibrary({ roots: [{ path: skillsRoot, id: 'vivim-harness', untrusted: true }] });
  const scopeFingerprint = dirScope(paths.root);
  const read = () => {
    let exists;
    try { exists = store.has(KEY); } catch (e) { throw storeProblem(e); }
    if (!exists) return null;
    let state;
    try { state = store.load(KEY); } catch (e) { throw storeProblem(e); }
    try { validatePersonalAgentBootstrap(state); }
    catch { throw problem(500, 'Stored Personal Agent state failed schema validation', 'PERSONAL_AGENT_STATE_CORRUPT'); }
    return state;
  };
  const bad = (message, code = 'PERSONAL_AGENT_INVALID') => problem(400, message, code);
  const versioned = (state, expectedVersion, note) => {
    try { return store.compareAndSave(KEY, state, { expectedVersion, changeNote: note }); }
    catch (e) { throw storeProblem(e); }
  };
  function status() {
    const state = read();
    if (!state) return { initialized: false, schemaVersion: 1, agentId: KEY, scope: 'local-data-directory',
      scopeFingerprint, nextStage: BOOTSTRAP_STAGES[0], stages: null };
    return { initialized: true, schemaVersion: state.schemaVersion, agentId: state.agentId,
      scope: 'local-data-directory', scopeFingerprint,
      identityAssurance: 'local-instance-only; no remote account claim',
```

_First 80 of 394 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
