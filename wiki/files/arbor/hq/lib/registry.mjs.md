# File: hq/lib/registry.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/registry.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13274 B |
| Lines | 315 |
| Hash | 871be3490753 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PROJECTS_FILE | const | 8 | yes | export const PROJECTS_FILE = &#39;projects.json&#39;; |
| HQ_DIR | const | 9 | yes | export const HQ_DIR = &#39;.hq&#39;; |
| CONFIG_FILE | const | 10 | yes | export const CONFIG_FILE = &#39;.hq/config.json&#39;; |
| defaultProjects | function | 12 | yes | export function defaultProjects() { |
| defaultConfig | function | 16 | yes | export function defaultConfig() { |
| loadProjects | function | 46 | yes | export function loadProjects(root) { |
| p | const | 47 | no | const p = join(root, PROJECTS_FILE); |
| parsed | const | 49 | no | const parsed = safeJsonParse(readFileSync(p, &#39;utf8&#39;), null); |
| saveProjects | function | 54 | yes | export function saveProjects(root, data) { |
| p | const | 55 | no | const p = join(root, PROJECTS_FILE); |
| deepMerge | function | 59 | yes | export function deepMerge(target, source) { |
| out | const | 60 | no | const out = { ...target }; |
| sv | const | 62 | no | const sv = source[k]; |
| tv | const | 63 | no | const tv = target[k]; |
| loadConfig | function | 73 | yes | export function loadConfig(root) { |
| p | const | 74 | no | const p = join(root, CONFIG_FILE); |
| parsed | const | 76 | no | const parsed = safeJsonParse(readFileSync(p, &#39;utf8&#39;), null); |
| saveConfig | function | 80 | yes | export function saveConfig(root, config) { |
| dbPath | function | 85 | yes | export function dbPath(root, config = null) { |
| cfg | const | 86 | no | const cfg = config \|\| loadConfig(root); |
| rel | const | 87 | no | const rel = cfg.db \|\| &#39;.hq/index.db&#39;; |
| storedPath | function | 92 | yes | export function storedPath(root, absPath) { |
| abs | const | 93 | no | const abs = resolve(absPath); |
| rootPosix | const | 94 | no | const rootPosix = toPosix(resolve(root)); |
| absPosix | const | 95 | no | const absPosix = toPosix(abs); |
| resolveProjectPath | function | 102 | yes | export function resolveProjectPath(root, stored) { |
| findProject | function | 106 | yes | export function findProject(projects, nameOrPath) { |
| needle | const | 107 | no | const needle = String(nameOrPath).toLowerCase(); |
| registerProject | function | 114 | yes | export function registerProject(root, { name, path, tags = [] }) { |
| data | const | 115 | no | const data = loadProjects(root); |
| abs | const | 116 | no | const abs = resolve(root, path); |
| existing | const | 118 | no | const existing = data.projects.find((p) =&gt; p.name === name \|\| resolveProjectPath(root, p.path) === abs); |
| entry | const | 126 | no | const entry = { name, path: storedPath(root, abs), tags: [...tags].sort(), addedAt: nowISO() }; |
| unregisterProject | function | 133 | yes | export function unregisterProject(root, name) { |
| data | const | 134 | no | const data = loadProjects(root); |
| before | const | 135 | no | const before = data.projects.length; |
| discoverHarvest | function | 142 | yes | export function discoverHarvest(root, harvestDir = &#39;harvest&#39;) { |
| dir | const | 143 | no | const dir = join(root, harvestDir); |
| markers | const | 145 | no | const markers = [&#39;.git&#39;, &#39;package.json&#39;, &#39;pyproject.toml&#39;, &#39;Cargo.toml&#39;, &#39;go.mod&#39;, &#39;pom.xml&#39;, &#39;build.gradle&#39;]; |
| found | const | 146 | no | const found = []; |
| abs | const | 149 | no | const abs = join(dir, entry.name); |
| projectSummary | function | 157 | yes | export function projectSummary(root, entry) { |
| abs | const | 158 | no | const abs = resolveProjectPath(root, entry.path); |
| projectsForIndex | function | 162 | yes | export function projectsForIndex(root) { |
| classifyProjects | function | 183 | yes | export function classifyProjects(root, { agiTable = null } = {}) { |
| data | const | 184 | no | const data = loadProjects(root); |
| agentsPath | const | 185 | no | const agentsPath = join(root, &#39;AGENTS.md&#39;); |
| agentsText | const | 186 | no | const agentsText = existsSync(agentsPath) ? readFileSync(agentsPath, &#39;utf8&#39;) : &#39;&#39;; |
| known | const | 188 | no | const known = agiTable ?? parseAgentsTable(agentsText); |
| productKeywords | const | 190 | no | const productKeywords = new Set([&#39;host&#39;, &#39;roadmap&#39;, &#39;product&#39;, &#39;android&#39;, &#39;windows&#39;]); |
| toolingKeywords | const | 191 | no | const toolingKeywords = new Set([&#39;harness&#39;, &#39;cli&#39;, &#39;tooling&#39;, &#39;orchestration&#39;, &#39;index&#39;]); |
| researchKeywords | const | 192 | no | const researchKeywords = new Set([&#39;research&#39;, &#39;evidence&#39;, &#39;campaign&#39;, &#39;experiment&#39;]); |
| archivesKeywords | const | 193 | no | const archivesKeywords = new Set([&#39;archive&#39;, &#39;historical&#39;, &#39;orphaned&#39;, &#39;legacy&#39;]); |
| AGENTS_FILE | const | 195 | no | const AGENTS_FILE = &#39;AGENTS.md&#39;; |
| classifyOne | function | 197 | no | const classifyOne = (entry) =&gt; { |
| tags | const | 198 | no | const tags = Array.isArray(entry.tags) ? entry.tags.map(String).map((t) =&gt; t.toLowerCase()) : []; |
| anchors | const | 199 | no | const anchors = []; |
| classification | variable | 200 | no | let classification = null; |
| rationale | variable | 201 | no | let rationale = &#39;&#39;; |
| identity | const | 203 | no | const identity = known.find((k) =&gt; { const local = k.local.toLowerCase(); const path = entry.path.toLowerCase(); return local === path \|\| (local === &#39;repos_hq&#39; &amp;&amp; path === &#39;.&#39; &amp;&amp; entry.name === &#39;repo… |
| local | const | 204 | no | const local = k.local.toLowerCase(); |
| path | const | 205 | no | const path = entry.path.toLowerCase(); |
| auth | const | 222 | no | const auth = String(identity.authority \|\| &#39;&#39;); |
| readme | const | 240 | no | const readme = readmeText(root, entry); |
| lower | const | 241 | no | const lower = readme.toLowerCase(); |
| someKeyword | function | 272 | no | function someKeyword(lower, set) { return [...set].some((k) =&gt; lower.includes(k)); } |
| parseAgentsTable | function | 274 | no | function parseAgentsTable(text) { |
| rows | const | 275 | no | const rows = []; |
| lines | const | 276 | no | const lines = String(text).split(/\\r?\\n/); |
| inTable | variable | 277 | no | let inTable = false; |
| line | const | 279 | no | const line = lines[i]; |
| cells | const | 283 | no | const cells = line.split(&#39;\|&#39;).map((c) =&gt; c.trim().replace(/`/g, &#39;&#39;)).filter(Boolean); |
| readmeText | function | 294 | no | function readmeText(root, entry) { |
| abs | const | 295 | no | const abs = resolveProjectPath(root, entry.path); |
| p | const | 297 | no | const p = join(abs, cand); |
| readmePath | function | 305 | no | function readmePath(root, entry) { |
| abs | const | 306 | no | const abs = resolveProjectPath(root, entry.path); |
| relativeRootPath | function | 310 | no | function relativeRootPath(root, abs) { |
| r | const | 311 | no | const r = toPosix(resolve(root)); |
| a | const | 312 | no | const a = toPosix(abs); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| ./util.mjs | import | 6 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/aii/fixtures/HQ-004-repository-classification.mjs](../aii/fixtures/HQ-004-repository-classification.mjs.md) | ../../lib/registry.mjs |
| [hq/aii/fixtures/HQ-009-indexing-coverage-gaps.mjs](../aii/fixtures/HQ-009-indexing-coverage-gaps.mjs.md) | ../../lib/registry.mjs |
| [hq/aii/fixtures/HQ-089-performance-regression-components.mjs](../aii/fixtures/HQ-089-performance-regression-components.mjs.md) | ../../lib/registry.mjs |
| [hq/aii/fixtures/HQ-090-redundant-computation.mjs](../aii/fixtures/HQ-090-redundant-computation.mjs.md) | ../../lib/registry.mjs |
| [hq/aii/fixtures/HQ-091-background-process-consumption.mjs](../aii/fixtures/HQ-091-background-process-consumption.mjs.md) | ../../lib/registry.mjs |
| [hq/aii/fixtures/HQ-093-retrieval-latency-staleness.mjs](../aii/fixtures/HQ-093-retrieval-latency-staleness.mjs.md) | ../../lib/registry.mjs |
| [hq/aii/fixtures/HQ-096-challenge-conclusions.mjs](../aii/fixtures/HQ-096-challenge-conclusions.mjs.md) | ../../lib/registry.mjs |
| [hq/aii/fixtures/HQ-098-stale-findings.mjs](../aii/fixtures/HQ-098-stale-findings.mjs.md) | ../../lib/registry.mjs |
| [hq/aii/fixtures/HQ-111-register-new-repo-class.mjs](../aii/fixtures/HQ-111-register-new-repo-class.mjs.md) | ../../lib/registry.mjs |
| [hq/aii/fixtures/HQ-112-multi-class-sources.mjs](../aii/fixtures/HQ-112-multi-class-sources.mjs.md) | ../../lib/registry.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/registry.mjs |
| [hq/lib/arbor-service.mjs](./arbor-service.mjs.md) | ./registry.mjs |
| [hq/lib/kb-intake.mjs](./kb-intake.mjs.md) | ./registry.mjs |
| [hq/lib/mcp.mjs](./mcp.mjs.md) | ./registry.mjs |
| [hq/test/foundation.test.mjs](../test/foundation.test.mjs.md) | ../lib/registry.mjs |
| [hq/test/registry.test.mjs](../test/registry.test.mjs.md) | ../lib/registry.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/registry.mjs — workspace project registry.
// projects.json is versioned and human-editable; paths may be relative to the
// workspace root (preferred) or absolute for external repositories.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, resolve, isAbsolute, basename } from 'node:path';
import { toPosix, canonicalJson, nowISO, safeJsonParse } from './util.mjs';

export const PROJECTS_FILE = 'projects.json';
export const HQ_DIR = '.hq';
export const CONFIG_FILE = '.hq/config.json';

export function defaultProjects() {
  return { version: 1, projects: [] };
}

export function defaultConfig() {
  return {
    version: 1,
    db: '.hq/index.db',
    maxFileBytes: 1_500_000,
    lakeCommits: 500,
    ignores: [],
    mcp: { enabled: true },
    performance: {
      profile: 'balanced',
      weights: { speed: 1, quality: 1, recency: 0.5, cost: 1 },
      priorities: {
        search: 5, find: 5, context: 5, brief: 3, index: 3,
        wiki: 2, lint: 1, mcp: 5, ask: 4, verify: 3,
      },
      budgets: {
        search: 250, find: 250, context: 600, brief: 300,
        index: 15000, wiki: 20000, lint: 1000, mcp: 600, ask: 800, verify: 2000,
      },
      candidates: {
        contextFiles: 40, contextSymbols: 40, contextPaths: 20, contextRecent: 10,
      },
      limits: {
        search: 20, find: 30, contextMaxFiles: 24, contextBudgetTokens: 6000,
        wikiMaxFilePages: 5000, briefMaxBytes: 6000, lintMaxFindings: 200,
      },
    },
  };
}

export function loadProjects(root) {
  const p = join(root, PROJECTS_FILE);
  if (!existsSync(p)) return defaultProjects();
  const parsed = safeJsonParse(readFileSync(p, 'utf8'), null);
  if (!parsed || !Array.isArray(parsed.projects)) return defaultProjects();
  return { version: 1, projects: parsed.projects };
}

export function saveProjects(root, data) {
  const p = join(root, PROJECTS_FILE);
  writeFileSync(p, canonicalJson({ version: 1, projects: data.projects || [] }), 'utf8');
}

export function deepMerge(target, source) {
  const out = { ...target };
  for (const k of Object.keys(source)) {
    const sv = source[k];
    const tv = target[k];
    if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      out[k] = deepMerge(tv, sv);
    } else {
      out[k] = sv;
    }
  }
  return out;
}

export function loadConfig(root) {
  const p = join(root, CONFIG_FILE);
  if (!existsSync(p)) return defaultConfig();
  const parsed = safeJsonParse(readFileSync(p, 'utf8'), null);
  return deepMerge(defaultConfig(), parsed || {});
}

export function saveConfig(root, config) {
```

_First 80 of 316 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
