# File: hq/lib/git-context.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/git-context.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16140 B |
| Lines | 424 |
| Hash | 51cb7893f480 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| GIT_CONTEXT_SCHEMA | const | 25 | yes | export const GIT_CONTEXT_SCHEMA = &#39;hq.git-context/1&#39;; |
| DEFAULT_GIT_CONFIG | const | 27 | yes | export const DEFAULT_GIT_CONFIG = Object.freeze({ // &#39;git&#39; local only: branch, divergence, status, log. No network. // &#39;github&#39; opt-in: adds PRs, issues, checks via the `gh` CLI. // &#39;none&#39; disabled e… |
| isPlainObject | function | 43 | no | function isPlainObject(value) { |
| mergeLayer | function | 51 | no | function mergeLayer(into, layer) { |
| resolveGitConfig | function | 63 | yes | export function resolveGitConfig(...layers) { |
| merged | const | 64 | no | const merged = { ...DEFAULT_GIT_CONFIG, github: { ...DEFAULT_GIT_CONFIG.github } }; |
| allowed | const | 69 | no | const allowed = new Set([&#39;git&#39;, &#39;github&#39;, &#39;none&#39;]); |
| gitConfigFromWorkspace | function | 81 | yes | export function gitConfigFromWorkspace(root) { |
| p | const | 82 | no | const p = join(root, &#39;.hq&#39;, &#39;config.json&#39;); |
| cfg | const | 85 | no | const cfg = JSON.parse(readFileSync(p, &#39;utf8&#39;)); |
| clampInt | function | 92 | no | function clampInt(value, min, max, fallback) { |
| n | const | 93 | no | const n = Number(value); |
| defaultRun | function | 98 | no | function defaultRun(cwd, args) { |
| res | const | 99 | no | const res = Bun.spawnSync({ cmd: args, cwd, stdout: &#39;pipe&#39;, stderr: &#39;pipe&#39; }); |
| gitState | function | 105 | yes | export function gitState({ cwd = process.cwd(), config, run = defaultRun } = {}) { |
| cfg | const | 106 | no | const cfg = config \|\| DEFAULT_GIT_CONFIG; |
| g | function | 107 | no | const g = (...args) =&gt; { |
| r | const | 108 | no | const r = run(cwd, [&#39;git&#39;, ...args]); |
| root | const | 111 | no | const root = g(&#39;rev-parse&#39;, &#39;--show-toplevel&#39;); |
| repo | const | 113 | no | const repo = root; |
| branch | const | 114 | no | const branch = g(&#39;rev-parse&#39;, &#39;--abbrev-ref&#39;, &#39;HEAD&#39;) \|\| &#39;HEAD&#39;; |
| head | const | 115 | no | const head = g(&#39;rev-parse&#39;, &#39;HEAD&#39;); |
| remote | const | 116 | no | const remote = g(&#39;remote&#39;, &#39;get-url&#39;, cfg.remote); |
| upstream | const | 117 | no | const upstream = `origin/${branch}`; |
| counts | const | 118 | no | const counts = g(&#39;rev-list&#39;, &#39;--left-right&#39;, &#39;--count&#39;, `${upstream}...HEAD`); |
| porcelain | const | 121 | no | const porcelain = g(&#39;status&#39;, &#39;--porcelain&#39;) \|\| &#39;&#39;; |
| dirty | const | 122 | no | const dirty = porcelain |
| log | const | 126 | no | const log = cfg.includeCommits &gt; 0 |
| branches | const | 135 | no | const branches = cfg.includeBranches |
| githubState | function | 148 | yes | export function githubState({ cwd = process.cwd(), config, run = defaultRun } = {}) { |
| cfg | const | 149 | no | const cfg = config \|\| DEFAULT_GIT_CONFIG; |
| cli | const | 151 | no | const cli = cfg.github.cli \|\| &#39;gh&#39;; |
| call | function | 152 | no | const call = (args) =&gt; { |
| r | const | 153 | no | const r = run(cwd, [cli, ...args]); |
| repoArg | const | 156 | no | const repoArg = cfg.github.repo ? [&#39;--repo&#39;, cfg.github.repo] : []; |
| prRaw | const | 158 | no | const prRaw = cfg.includePrs &gt; 0 ? call([&#39;pr&#39;, &#39;list&#39;, ...repoArg, &#39;--limit&#39;, String(cfg.includePrs), &#39;--json&#39;, &#39;number,title,state,isDraft,author,updatedAt&#39;]) : null; |
| issueRaw | const | 159 | no | const issueRaw = cfg.includeIssues &gt; 0 ? call([&#39;issue&#39;, &#39;list&#39;, ...repoArg, &#39;--limit&#39;, String(cfg.includeIssues), &#39;--json&#39;, &#39;number,title,state,author,updatedAt&#39;]) : null; |
| checkRaw | const | 160 | no | const checkRaw = cfg.includeChecks ? call([&#39;pr&#39;, &#39;checks&#39;, ...repoArg, &#39;--json&#39;, &#39;name,state&#39;]) : null; |
| parse | function | 162 | no | const parse = (raw) =&gt; { |
| sha256 | function | 178 | no | function sha256(text) { |
| estimateTokens | function | 182 | no | function estimateTokens(text) { |
| source | function | 186 | no | function source({ ref, kind, title, text, reason }) { |
| composeGitContext | function | 190 | yes | export function composeGitContext({ cwd = process.cwd(), task = &#39;&#39;, config, state, github, budgetTokens } = {}) { |
| cfg | const | 191 | no | const cfg = resolveGitConfig(config); |
| git | const | 199 | no | const git = state \|\| gitState({ cwd, config: cfg }); |
| sources | const | 204 | no | const sources = []; |
| gh | const | 248 | no | const gh = github \|\| (cfg.protocol === &#39;github&#39; ? githubState({ cwd, config: cfg }) : null); |
| max | const | 271 | no | const max = clampInt(budgetTokens ?? cfg.maxTokens, 128, 24000, cfg.maxTokens); |
| selected | const | 272 | no | const selected = []; |
| omitted | const | 273 | no | const omitted = []; |
| used | variable | 274 | no | let used = 0; |
| text | const | 284 | no | const text = selected.map((s) =&gt; `SOURCE { ref: ${s.ref}, kind: ${s.kind} }\\n${s.text}`).join(&#39;\\n\\n&#39;); |
| digest | const | 285 | no | const digest = sha256(JSON.stringify({ schema: GIT_CONTEXT_SCHEMA, protocol: cfg.protocol, task, sources: selected.map((s) =&gt; ({ ref: s.ref, sha256: s.sha256 })), |
| normalizeRemoteUrl | function | 319 | yes | export function normalizeRemoteUrl(url) { |
| u | variable | 321 | no | let u = String(url).trim(); |
| parsed | const | 338 | no | const parsed = new URL(u); |
| resolveRepoRoot | function | 354 | yes | export function resolveRepoRoot({ cwd = process.cwd(), run = defaultRun } = {}) { |
| r | const | 355 | no | const r = run(cwd, [&#39;git&#39;, &#39;rev-parse&#39;, &#39;--show-toplevel&#39;]); |
| detectRepositoryDuplicates | function | 369 | yes | export function detectRepositoryDuplicates(identities = [], { run = defaultRun } = {}) { |
| norm | function | 370 | no | const norm = (u) =&gt; normalizeRemoteUrl(u); |
| byRemote | const | 373 | no | const byRemote = new Map(); |
| byCheckout | const | 375 | no | const byCheckout = new Map(); |
| resolved | const | 377 | no | const resolved = identities.map((id) =&gt; { const entry = { ...id }; try { const root = resolveRepoRoot({ cwd: id.path, run }); entry.resolvedRoot = root; |
| entry | const | 378 | no | const entry = { ...id }; |
| root | const | 380 | no | const root = resolveRepoRoot({ cwd: id.path, run }); |
| remoteKey | const | 387 | no | const remoteKey = id.remote != null ? norm(id.remote) : null; |
| checkoutKey | const | 393 | no | const checkoutKey = id.resolvedRoot.toLowerCase(); |
| pairs | const | 399 | no | const pairs = []; |
| seen | const | 400 | no | const seen = new Set(); |
| addPair | function | 401 | no | const addPair = (a, b, kind, key) =&gt; { |
| sig | const | 402 | no | const sig = `${String(a.name)}\\u0000${String(b.name)}\\u0000${kind}\\u0000${key}`; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 21 | external |
| node:fs | import | 22 | external |
| node:path | import | 23 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-003-same-repo-not-duplicated.mjs](../aii/fixtures/HQ-003-same-repo-not-duplicated.mjs.md) | ../../lib/git-context.mjs |
| [hq/aii/fixtures/HQ-006-local-vs-github.mjs](../aii/fixtures/HQ-006-local-vs-github.mjs.md) | ../../lib/git-context.mjs |
| [hq/aii/fixtures/HQ-007-unintegrated-branches.mjs](../aii/fixtures/HQ-007-unintegrated-branches.mjs.md) | ../../lib/git-context.mjs |
| [hq/aii/fixtures/HQ-008-uncommitted-changes.mjs](../aii/fixtures/HQ-008-uncommitted-changes.mjs.md) | ../../lib/git-context.mjs |
| [hq/aii/fixtures/HQ-010-removal-blast-radius.mjs](../aii/fixtures/HQ-010-removal-blast-radius.mjs.md) | ../../lib/git-context.mjs |
| [hq/test/git-context.test.mjs](../test/git-context.test.mjs.md) | ../lib/git-context.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Git and GitHub repository context bundle with default config and |
| 4 | owner | owner | — | owner |
| 5 | invariant | — | — | Local-first: the `git` protocol never touches the network. |
| 7 | invariant | — | — | Same repo state + same task =&gt; same digest. No timestamps in |
| 9 | see | — | docs/DCB-PROTOCOL.md | docs/DCB-PROTOCOL.md |
| 10 | see | — | hq/CONTRACT.md | hq/CONTRACT.md |

## Excerpt

```javascript
/**
 * @hq:context Git and GitHub repository context bundle with default config and
 *   switchable protocols (git local-only | github opt-in | none).
 * @hq:owner owner
 * @hq:invariant Local-first: the `git` protocol never touches the network.
 *   `github` is opt-in because it shells out to a tool that does.
 * @hq:invariant Same repo state + same task => same digest. No timestamps in
 *   the digestible payload.
 * @hq:see docs/DCB-PROTOCOL.md
 * @hq:see hq/CONTRACT.md
 */

// hq/lib/git-context.mjs — the repository-aware slice of a context bundle.
//
// A normal DCB answers "what code and docs matter for this task". This module
// answers the other half: where the repo *is* — branch, divergence, working
// tree, recent history, and (when explicitly enabled) the GitHub surface:
// pull requests, issues and checks.
//
// Config precedence: DEFAULT_GIT_CONFIG < .hq/config.json `git` block < call args.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';

export const GIT_CONTEXT_SCHEMA = 'hq.git-context/1';

export const DEFAULT_GIT_CONFIG = Object.freeze({
  // 'git'     local only: branch, divergence, status, log. No network.
  // 'github'  opt-in: adds PRs, issues, checks via the `gh` CLI.
  // 'none'    disabled entirely.
  protocol: 'git',
  remote: 'origin',
  includeCommits: 10,
  includeDirty: true,
  includeBranches: true,
  includePrs: 5,
  includeIssues: 5,
  includeChecks: true,
  maxTokens: 1200,
  github: { cli: 'gh', repo: null },
});

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Merge one config layer into `merged`, key by key. Nested objects merge
 *  recursively instead of replacing the whole object, so a later layer that
 *  sets one nested key never deletes its siblings (e.g. `context.dirty` survives
 *  a later layer that only sets `context.commits`). */
function mergeLayer(into, layer) {
  for (const [key, value] of Object.entries(layer)) {
    if (value === undefined) continue;
    if (isPlainObject(into[key]) && isPlainObject(value)) {
      into[key] = mergeLayer({ ...into[key] }, value);
    } else {
      into[key] = value;
    }
  }
  return into;
}

export function resolveGitConfig(...layers) {
  const merged = { ...DEFAULT_GIT_CONFIG, github: { ...DEFAULT_GIT_CONFIG.github } };
  for (const layer of layers) {
    if (!layer || typeof layer !== 'object') continue;
    mergeLayer(merged, layer);
  }
  const allowed = new Set(['git', 'github', 'none']);
  if (!allowed.has(merged.protocol)) {
    throw new Error(`hq: unknown git protocol "${merged.protocol}" (expected ${[...allowed].join(' | ')})`);
  }
  merged.includeCommits = clampInt(merged.includeCommits, 0, 100, 10);
  merged.includePrs = clampInt(merged.includePrs, 0, 50, 5);
  merged.includeIssues = clampInt(merged.includeIssues, 0, 50, 5);
  merged.maxTokens = clampInt(merged.maxTokens, 128, 24000, 1200);
  return merged;
}

// Read the `git` block from <root>/.hq/config.json without importing the registry.
```

_First 80 of 425 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
