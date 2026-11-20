# File: hq/lib/skills.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/skills.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 17810 B |
| Lines | 522 |
| Hash | de1f60910fe4 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KIND_WEIGHT | const | 12 | no | const KIND_WEIGHT = { agents: 1.0, context: 0.9, skill: 0.85, rules: 0.8, config: 0.7 }; |
| BODY_CAP | const | 14 | no | const BODY_CAP = 20_000; |
| MAX_OPTIONAL | const | 15 | no | const MAX_OPTIONAL = 12; |
| ROOT_FILES | const | 17 | no | const ROOT_FILES = [ |
| SKILL_DIRS | const | 28 | no | const SKILL_DIRS = [ |
| RULE_DIRS | const | 35 | no | const RULE_DIRS = [&#39;.cursor/rules&#39;]; |
| BOUNDARY_RE | const | 37 | no | const BOUNDARY_RE = /\\b(MUST\|NEVER\|Only\|must not\|do not\|forbidden\|required)\\b/i; |
| isDirectory | function | 42 | no | function isDirectory(path) { |
| resolveProjectDir | function | 46 | no | function resolveProjectDir(root, project) { |
| explicitProjectDir | function | 51 | no | function explicitProjectDir(project, root) { |
| base | const | 53 | no | const base = root ? resolve(String(root)) : process.cwd(); |
| direct | const | 55 | no | const direct = isAbsolute(project) ? project : resolve(base, project); |
| candidates | const | 58 | no | const candidates = [project.abs, project.absPath, project.absolute, project.path]; |
| abs | const | 61 | no | const abs = isAbsolute(String(candidate)) ? String(candidate) : resolve(project.root \|\| base, String(candidate)); |
| named | const | 65 | no | const named = resolve(base, String(project.name)); |
| projectName | function | 71 | no | function projectName(project, dir) { |
| findProjectId | function | 79 | no | function findProjectId(db, project) { |
| row | const | 82 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(project); |
| row | const | 90 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(String(project.name)); |
| ensureProjectRow | function | 96 | no | function ensureProjectRow(db, project, dir) { |
| existing | const | 97 | no | const existing = findProjectId(db, project); |
| name | const | 99 | no | const name = projectName(project, dir); |
| path | const | 100 | no | const path = project &amp;&amp; typeof project === &#39;object&#39; &amp;&amp; (project.abs \|\| project.path) |
| row | const | 103 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE name = ? OR path = ?&#39;).get(name, path); |
| info | const | 105 | no | const info = db.prepare( &#39;INSERT INTO projects(name, path, kind, added_at) VALUES (?, ?, ?, ?)&#39;, ).run(name, path, &#39;dir&#39;, nowISO()); |
| stripQuotes | function | 114 | no | function stripQuotes(value) { |
| s | const | 115 | no | const s = String(value).trim(); |
| parseListValue | function | 122 | no | function parseListValue(value) { |
| raw | const | 123 | no | const raw = String(value).trim(); |
| parseFrontmatter | function | 131 | no | function parseFrontmatter(text) { |
| meta | const | 132 | no | const meta = {}; |
| lines | const | 133 | no | const lines = String(text).split(/\\r?\\n/); |
| line | const | 141 | no | const line = lines[i]; |
| key | const | 145 | no | const key = match[1].toLowerCase(); |
| value | variable | 146 | no | let value = match[2]; |
| items | const | 148 | no | const items = []; |
| j | variable | 149 | no | let j = i + 1; |
| item | const | 151 | no | const item = /^\\s*-\\s+(.*)$/.exec(lines[j]); |
| frontmatterStrings | function | 164 | no | function frontmatterStrings(meta, key) { |
| value | const | 165 | no | const value = meta[key]; |
| firstHeading | function | 171 | no | function firstHeading(text, fromLine) { |
| lines | const | 172 | no | const lines = String(text).split(/\\r?\\n/); |
| firstParagraph | function | 180 | no | function firstParagraph(text, fromLine) { |
| lines | const | 181 | no | const lines = String(text).split(/\\r?\\n/); |
| line | const | 183 | no | const line = lines[i].trim(); |
| buildInstruction | function | 194 | no | function buildInstruction(absPath, relPath, kind, defaultName, extra = {}) { |
| text | variable | 195 | no | let text; |
| stat | variable | 196 | no | let stat; |
| startLine | const | 204 | no | const startLine = endLine &gt;= 0 ? endLine + 1 : 0; |
| triggers | const | 205 | no | const triggers = extra.triggers |
| title | const | 208 | no | const title = (meta.title ? String(meta.title).trim() : &#39;&#39;) |
| description | const | 211 | no | const description = (meta.description ? String(meta.description).trim() : &#39;&#39;) |
| name | const | 214 | no | const name = (meta.name ? String(meta.name).trim() : &#39;&#39;) \|\| defaultName; |
| listChildDirs | function | 228 | no | function listChildDirs(dir) { |
| listRuleFiles | function | 239 | no | function listRuleFiles(dir) { |
| configInstruction | function | 250 | no | function configInstruction(absPath, relPath) { |
| entry | const | 251 | no | const entry = buildInstruction(absPath, relPath, &#39;config&#39;, basename(relPath)); |
| parsed | const | 253 | no | const parsed = safeJsonParse(entry.body, null); |
| instructions | const | 254 | no | const instructions = parsed &amp;&amp; parsed.instructions; |
| paths | const | 255 | no | const paths = Array.isArray(instructions) |
| scanInstructions | function | 265 | yes | export function scanInstructions(root, project = null) { |
| scanInstructionsAt | function | 269 | no | function scanInstructionsAt(dir) { |
| found | const | 270 | no | const found = new Map(); |
| abs | const | 273 | no | const abs = join(dir, entry.path); |
| instruction | const | 275 | no | const instruction = entry.kind === &#39;config&#39; |
| absDir | const | 282 | no | const absDir = join(dir, rulesDir); |
| rel | const | 284 | no | const rel = toPosix(join(rulesDir, file)); |
| instruction | const | 285 | no | const instruction = buildInstruction(join(absDir, file), rel, &#39;rules&#39;, basename(file, &#39;.mdc&#39;)); |
| absDir | const | 291 | no | const absDir = join(dir, skillsDir); |
| rel | const | 293 | no | const rel = toPosix(join(skillsDir, child, &#39;SKILL.md&#39;)); |
| abs | const | 294 | no | const abs = join(absDir, child, &#39;SKILL.md&#39;); |
| instruction | const | 296 | no | const instruction = buildInstruction(abs, rel, &#39;skill&#39;, child); |
| UPSERT_SQL | const | 307 | no | const UPSERT_SQL = ` |
| indexInstructions | function | 321 | yes | export function indexInstructions(db, project) { |
| explicit | const | 322 | no | const explicit = explicitProjectDir(project, project &amp;&amp; project.root); |
| existingId | const | 323 | no | const existingId = findProjectId(db, project); |
| row | const | 324 | no | const row = existingId != null |
| rowDir | const | 327 | no | const rowDir = row &amp;&amp; row.path |
| dir | const | 330 | no | const dir = explicit \|\| (rowDir &amp;&amp; isDirectory(rowDir) ? rowDir : null) |
| projectId | const | 332 | no | const projectId = existingId != null ? existingId : ensureProjectRow(db, project, dir); |
| instructions | const | 333 | no | const instructions = scanInstructionsAt(dir); |
| existingRows | const | 336 | no | const existingRows = db.prepare( &#39;SELECT path, hash FROM instructions WHERE project_id = ?&#39;, ).all(projectId); |
| existing | const | 339 | no | const existing = new Map(existingRows.map((r) =&gt; [r.path, r.hash])); |
| seen | const | 340 | no | const seen = new Set(); |
| added | variable | 341 | no | let added = 0; |
| changed | variable | 342 | no | let changed = 0; |
| upsert | const | 344 | no | const upsert = db.prepare(UPSERT_SQL); |
| prior | const | 347 | no | const prior = existing.get(instruction.path); |
| removed | variable | 364 | no | let removed = 0; |
| del | const | 365 | no | const del = db.prepare(&#39;DELETE FROM instructions WHERE project_id = ? AND path = ?&#39;); |
| rowToInstruction | function | 379 | no | function rowToInstruction(row) { |
| coverageOf | function | 393 | no | function coverageOf(tokens, haystackTokens) { |
| hits | variable | 395 | no | let hits = 0; |
| reasonFor | function | 400 | no | function reasonFor(instruction, coverage, mandatory) { |
| sortHits | function | 409 | no | function sortHits(hits) { |
| routeTask | function | 417 | yes | export function routeTask(db, { task = &#39;&#39;, project = null, limit = MAX_OPTIONAL } = {}) { |
| taskTokens | const | 418 | no | const taskTokens = tokenize(task); |
| maxOptional | const | 419 | no | const maxOptional = Number.isFinite(limit) ? clamp(Math.trunc(limit), 0, 500) : MAX_OPTIONAL; |
| projectId | variable | 421 | no | let projectId = null; |
| row | const | 425 | no | const row = db.prepare(&#39;SELECT id FROM projects WHERE name = ?&#39;).get(project); |
| rows | const | 433 | no | const rows = projectId == null |
| mandatory | const | 437 | no | const mandatory = []; |
| optional | const | 438 | no | const optional = []; |
| skills | const | 439 | no | const skills = []; |
| boundaries | const | 440 | no | const boundaries = []; |
| boundarySeen | const | 441 | no | const boundarySeen = new Set(); |
| instruction | const | 444 | no | const instruction = rowToInstruction(row); |
| haystack | const | 445 | no | const haystack = [ |
| haystackTokens | const | 452 | no | const haystackTokens = new Set(tokenize(haystack)); |
| coverage | const | 453 | no | const coverage = coverageOf(taskTokens, haystackTokens); |
| weight | const | 454 | no | const weight = KIND_WEIGHT[instruction.kind] ?? 0.5; |
| score | const | 455 | no | const score = Math.round(100 * (0.5 + 3.6 * coverage + weight)); |
| isRoot | const | 456 | no | const isRoot = instruction.path === &#39;AGENTS.md&#39; \|\| instruction.path === &#39;context.md&#39;; |
| isMandatory | const | 457 | no | const isMandatory = isRoot |
| hit | const | 459 | no | const hit = { |
| trimmed | const | 470 | no | const trimmed = line.trim(); |
| routeAlignment | function | 509 | no | function routeAlignment(db, task) { |
| alignment | const | 511 | no | const alignment = alignmentForTask(db, String(task ?? &#39;&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| ./schema.mjs | import | 6 | [hq/lib/schema.mjs](./schema.mjs.md) |
| ./vivim.mjs | import | 7 | [hq/lib/vivim.mjs](./vivim.mjs.md) |
| ./util.mjs | import | 8 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/skills.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/skills.mjs |
| [hq/lib/automation.mjs](./automation.mjs.md) | ./skills.mjs |
| [hq/lib/mcp.mjs](./mcp.mjs.md) | ./skills.mjs |
| [hq/lib/refresh.mjs](./refresh.mjs.md) | ./skills.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/skills.mjs — instruction + skill discovery, indexing and task routing.
// Turns a repository's own AGENTS.md / context.md / SKILL.md / rules files into
// a routable index so an agent sees the hard rules without reading everything.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, isAbsolute, join, resolve } from 'node:path';
import { transaction } from './schema.mjs';
import { alignmentForTask } from './vivim.mjs';
import {
  clamp, nowISO, safeJsonParse, sha256, toPosix, tokenize,
} from './util.mjs';

const KIND_WEIGHT = { agents: 1.0, context: 0.9, skill: 0.85, rules: 0.8, config: 0.7 };

const BODY_CAP = 20_000;
const MAX_OPTIONAL = 12;

const ROOT_FILES = [
  { path: 'AGENTS.md', kind: 'agents' },
  { path: 'CLAUDE.md', kind: 'agents' },
  { path: 'GEMINI.md', kind: 'agents' },
  { path: 'context.md', kind: 'context' },
  { path: '.cursorrules', kind: 'rules' },
  { path: '.github/copilot-instructions.md', kind: 'rules' },
  { path: 'docs/agents/TASK-CONTEXT-ROUTING.md', kind: 'context' },
  { path: 'opencode.json', kind: 'config' },
];

const SKILL_DIRS = [
  '.agents/skills',
  'skills',
  '.opencode/skills',
  '.opencode/skill',
];

const RULE_DIRS = ['.cursor/rules'];

const BOUNDARY_RE = /\b(MUST|NEVER|Only|must not|do not|forbidden|required)\b/i;

// ---------------------------------------------------------------------------
// project resolution helpers

function isDirectory(path) {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

function resolveProjectDir(root, project) {
  return explicitProjectDir(project, root)
    || (root ? resolve(String(root)) : process.cwd());
}

function explicitProjectDir(project, root) {
  if (!project) return null;
  const base = root ? resolve(String(root)) : process.cwd();
  if (typeof project === 'string') {
    const direct = isAbsolute(project) ? project : resolve(base, project);
    return isDirectory(direct) ? direct : null;
  }
  const candidates = [project.abs, project.absPath, project.absolute, project.path];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const abs = isAbsolute(String(candidate)) ? String(candidate) : resolve(project.root || base, String(candidate));
    if (isDirectory(abs)) return abs;
  }
  if (project.name) {
    const named = resolve(base, String(project.name));
    if (isDirectory(named)) return named;
  }
  return null;
}

function projectName(project, dir) {
  if (project && typeof project === 'object' && project.name) return String(project.name);
  if (typeof project === 'string' && project) {
    return isAbsolute(project) ? basename(project) : project;
  }
  return basename(dir);
}

function findProjectId(db, project) {
  if (!project || typeof project !== 'object') {
```

_First 80 of 523 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
