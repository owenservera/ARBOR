# File: studio/src/studio/agentic-files.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/agentic-files.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 27999 B |
| Lines | 664 |
| Hash | 71d39a9028cc |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| AGENTIC_FILE_KINDS | const | 14 | yes | export const AGENTIC_FILE_KINDS = Object.freeze([&#39;agents&#39;, &#39;claude&#39;, &#39;opencode-agent&#39;, &#39;skill&#39;, &#39;docs-agent&#39;]); |
| PRECEDENCE_KINDS | const | 15 | no | const PRECEDENCE_KINDS = Object.freeze([&#39;agents&#39;, &#39;claude&#39;]); |
| AGENTIC_FILE_LIMITS | const | 17 | yes | export const AGENTIC_FILE_LIMITS = Object.freeze({ maxFiles: 200, maxFileBytes: 262144, maxDepth: 8, maxEntries: 5000, |
| LIMIT_BOUNDS | const | 30 | no | const LIMIT_BOUNDS = Object.freeze({ maxFiles: [0, 10000], maxFileBytes: [0, 1048576], maxDepth: [0, 64], maxEntries: [0, 100000], |
| AGENTIC_PRECEDENCE_RULE | const | 43 | yes | export const AGENTIC_PRECEDENCE_RULE = Object.freeze({ rule: &#39;nearest-to-root-wins&#39;, applied: false, scope: &#39;per-root, and only for kinds agents and claude&#39;, statement: &#39;A shallower file of the same … |
| INERT_STATEMENT | const | 52 | no | const INERT_STATEMENT = &#39;files are inert data; this library grants no capability; trust is always untrusted-until-confirmed&#39;; |
| QUALIFICATION | const | 54 | no | const QUALIFICATION = `Scan covers regular files matching AGENTS.md, CLAUDE.md, SKILL.md, .opencode/agents/*.md, and docs/agents/*.md under the explicit roots. .git and node_modules are excluded by p… |
| NOT_FOUND | function | 56 | no | const NOT_FOUND = () =&gt; problem(404, &#39;Agentic file not found&#39;, &#39;AGENTIC_NOT_FOUND&#39;); |
| boundsWith | function | 58 | no | function boundsWith(overrides) { |
| out | const | 62 | no | const out = { ...AGENTIC_FILE_LIMITS }; |
| value | const | 66 | no | const value = overrides[key]; |
| samePath | function | 75 | no | function samePath(a, b) { |
| realInside | function | 81 | yes | export function realInside(realRoot, realPath) { |
| win32 | const | 83 | no | const win32 = process.platform === &#39;win32&#39;; |
| norm | function | 84 | no | const norm = (value) =&gt; (win32 ? value.toLowerCase().replaceAll(&#39;\\\\&#39;, &#39;/&#39;) : value); |
| root | const | 85 | no | const root = norm(realRoot); |
| target | const | 86 | no | const target = norm(realPath); |
| policyDirName | function | 93 | no | function policyDirName(name) { |
| key | const | 94 | no | const key = process.platform === &#39;win32&#39; ? name.toLowerCase() : name; |
| normalizeRoots | function | 100 | no | function normalizeRoots(roots) { |
| accepted | const | 103 | no | const accepted = [], acceptedIds = new Set(); |
| out | const | 104 | no | const out = []; |
| spec | const | 106 | no | const spec = typeof entry === &#39;string&#39; ? { path: entry } : entry; |
| resolved | const | 116 | no | const resolved = path.resolve(spec.path); |
| real | variable | 120 | no | let real = null; |
| canonical | const | 122 | no | const canonical = real ?? resolved; |
| id | const | 123 | no | const id = spec.id ?? (`r${createHash(&#39;sha256&#39;).update(canonical).digest(&#39;hex&#39;).slice(0, 16)}`); |
| untrusted | const | 135 | no | const untrusted = spec.untrusted !== false; |
| fileId | function | 141 | no | function fileId(rootId, relPosix) { |
| inside | function | 145 | no | function inside(root, full) { |
| rel | const | 146 | no | const rel = path.relative(root, full); |
| safeName | function | 152 | no | function safeName(name) { |
| REJECT | const | 157 | no | const REJECT = Symbol(&#39;reject&#39;); |
| parseScalar | function | 159 | no | function parseScalar(raw, limits) { |
| n | const | 165 | no | const n = Number(raw); |
| out | variable | 170 | no | let out = &#39;&#39;; |
| ch | const | 172 | no | const ch = raw[i]; |
| esc | const | 175 | no | const esc = raw[++i]; |
| body | const | 188 | no | const body = raw.slice(1, -1); |
| parseFrontmatter | function | 196 | no | function parseFrontmatter(text, limits) { |
| nl | const | 198 | no | const nl = text.startsWith(&#39;---\\r\\n&#39;) ? 5 : 4; |
| rest | const | 199 | no | const rest = text.slice(nl); |
| close | const | 200 | no | const close = /\\r?\\n---[ \\t]*(?:\\r?\\n\|$)/.exec(rest); |
| block | const | 202 | no | const block = rest.slice(0, close.index); |
| out | const | 204 | no | const out = {}; |
| count | variable | 205 | no | let count = 0; |
| value | const | 217 | no | const value = parseScalar(match[2], limits); |
| titleOf | function | 225 | no | function titleOf(relPosix, frontmatter, body, max) { |
| named | const | 226 | no | const named = frontmatter &amp;&amp; typeof frontmatter.title === &#39;string&#39; ? frontmatter.title.trim() : &#39;&#39;; |
| title | variable | 227 | no | let title = named; |
| heading | const | 229 | no | const heading = /^#{1,6}[ \\t]+([^\\r\\n]+)$/m.exec(body ?? &#39;&#39;); |
| classify | function | 239 | no | function classify(relPosix) { |
| base | const | 240 | no | const base = relPosix.split(&#39;/&#39;).pop(); |
| parts | const | 244 | no | const parts = relPosix.split(&#39;/&#39;); |
| sameMeta | function | 252 | no | function sameMeta(before, after) { |
| comparable | function | 253 | no | const comparable = (st) =&gt; Number.isSafeInteger(st?.dev) &amp;&amp; st.dev &gt; 0 &amp;&amp; Number.isSafeInteger(st?.ino) &amp;&amp; st.ino &gt; 0; |
| readRegular | function | 258 | no | function readRegular(full, realRoot, limits) { |
| fd | variable | 259 | no | let fd; |
| before | const | 261 | no | const before = lstatSync(full); |
| real | variable | 263 | no | let real; |
| flags | const | 270 | no | const flags = constants.O_RDONLY \| (constants.O_NOFOLLOW \|\| 0); |
| st | const | 272 | no | const st = fstatSync(fd); |
| after | const | 277 | no | const after = realpathSync(full); |
| buf | const | 280 | no | const buf = Buffer.alloc(st.size); |
| off | variable | 281 | no | let off = 0; |
| n | const | 283 | no | const n = readSync(fd, buf, off, st.size - off, off); |
| code | const | 289 | no | const code = error?.code; |
| isoTime | function | 299 | no | function isoTime(ms) { |
| date | const | 301 | no | const date = new Date(ms); |
| clipUtf8 | function | 305 | no | function clipUtf8(text, maxBytes) { |
| buf | const | 306 | no | const buf = Buffer.from(text, &#39;utf8&#39;); |
| utf8Text | function | 315 | no | function utf8Text(buf) { |
| text | variable | 316 | no | let text = null; |
| precedenceFor | function | 322 | no | function precedenceFor(items, truncated) { |
| conflicts | const | 323 | no | const conflicts = []; |
| byGroup | const | 324 | no | const byGroup = new Map(); |
| key | const | 327 | no | const key = `${item.root}\\0${item.kind}`; |
| candidates | const | 333 | no | const candidates = group |
| tie | const | 336 | no | const tie = candidates[0].depth === candidates[1].depth; |
| scan | function | 354 | no | function scan(roots, limits) { |
| items | const | 355 | no | const items = []; |
| skipped | const | 356 | no | const skipped = []; |
| reasons | const | 357 | no | const reasons = new Set(); |
| scanned | variable | 358 | no | let scanned = 0; |
| stop | variable | 359 | no | let stop = false; |
| skippedTruncated | variable | 360 | no | let skippedTruncated = false; |
| note | function | 362 | no | function note(rel, reason, rootId) { |
| considerFile | function | 372 | no | function considerFile(root, realRoot, full, rel) { |
| kind | const | 373 | no | const kind = classify(rel); |
| read | const | 380 | no | const read = readRegular(full, realRoot, limits); |
| depth | const | 385 | no | const depth = rel.split(&#39;/&#39;).length - 1; |
| base | const | 386 | no | const base = { |
| sha256 | const | 406 | no | const sha256 = createHash(&#39;sha256&#39;).update(read.buf).digest(&#39;hex&#39;); |
| text | const | 407 | no | const text = utf8Text(read.buf); |
| parsed | const | 412 | no | const parsed = parseFrontmatter(text, limits); |
| walk | function | 423 | no | function walk(root, realRoot, dir, relDir, depth, report) { |
| dirents | variable | 425 | no | let dirents; |
| full | const | 445 | no | const full = path.resolve(dir, dirent.name); |
| rel | const | 446 | no | const rel = inside(root.resolved, full); |
| policy | const | 451 | no | const policy = policyDirName(dirent.name); |
| st | variable | 456 | no | let st; |
| real | variable | 468 | no | let real; |
| rootReports | const | 494 | no | const rootReports = []; |
| st | variable | 501 | no | let st; |
| realRoot | variable | 518 | no | let realRoot; |
| report | const | 526 | no | const report = { id: root.id, untrusted: root.untrusted, status: &#39;scanned&#39;, skipReason: null }; |
| policy | const | 532 | no | const policy = new Set([&#39;git&#39;, &#39;node_modules&#39;]); |
| hiding | const | 533 | no | const hiding = [...reasons].filter((reason) =&gt; !policy.has(reason) &amp;&amp; reason !== &#39;frontmatter-rejected&#39;); |
| truncated | const | 534 | no | const truncated = hiding.length &gt; 0; |
| precedence | const | 535 | no | const precedence = precedenceFor(items, truncated); |
| coverage | const | 536 | no | const coverage = { |
| createAgenticFileLibrary | function | 552 | yes | export function createAgenticFileLibrary({ roots, limits, idCacheTtlMs } = {}) { |
| rootList | const | 553 | no | const rootList = normalizeRoots(roots); |
| bounds | const | 554 | no | const bounds = boundsWith(limits); |
| ttlMs | const | 555 | no | const ttlMs = idCacheTtlMs === undefined ? 1000 : integer(idCacheTtlMs, 1000, 60000, 0); |
| registry | variable | 558 | no | let registry = null; |
| registryAt | variable | 559 | no | let registryAt = 0; |
| ensureRegistry | function | 561 | no | function ensureRegistry(force = false) { |
| now | const | 562 | no | const now = Date.now(); |
| found | const | 564 | no | const found = scan(rootList, bounds); |
| map | const | 565 | no | const map = new Map(); |
| list | function | 572 | no | function list(q = {}) { |
| found | const | 574 | no | const found = scan(rootList, bounds); |
| map | const | 575 | no | const map = new Map(); |
| items | variable | 579 | no | let items = found.items.map((item) =&gt; { const { depth, ...rest } = item; void depth; return rest; }); |
| offset | const | 589 | no | const offset = integer(q.offset, 0, 100000); |
| limit | const | 590 | no | const limit = integer(q.limit, 100, 1000, 1); |
| get | function | 604 | no | function get(id) { |
| entry | variable | 606 | no | let entry = ensureRegistry().get(id); |
| root | const | 609 | no | const root = rootList.find((candidate) =&gt; candidate.id === entry.rootId); |
| full | const | 611 | no | const full = path.resolve(root.resolved, ...entry.rel.split(&#39;/&#39;)); |
| realRoot | variable | 613 | no | let realRoot; |
| read | const | 615 | no | const read = readRegular(full, realRoot, bounds); |
| text | const | 637 | no | const text = utf8Text(read.buf); |
| parsed | const | 641 | no | const parsed = parseFrontmatter(text, bounds); |
| clipped | const | 645 | no | const clipped = clipUtf8(text, bounds.maxContentBytes); |
| registerAgenticFileRoutes | function | 658 | yes | export function registerAgenticFileRoutes({ add, library, roots, limits } = {}) { |
| lib | const | 660 | no | const lib = library ?? (roots ? createAgenticFileLibrary({ roots, limits }) : null); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |
| node:fs | import | 8 | external |
| node:path | import | 11 | external |
| ./http.mjs | import | 12 | [studio/src/studio/http.mjs](./http.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/agents/personal-agent-service.mjs](../agents/personal-agent-service.mjs.md) | ../studio/agentic-files.mjs |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./agentic-files.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// C-11 agentic file library. Read-only inventory of instruction files under caller-supplied
// roots. The files are inert data; this library grants no capability; trust is always
// untrusted-until-confirmed. It never executes, evaluates, imports, or follows instructions
// found in those files, never follows links outside a verified real path, and never reads
// outside a root. get(id) resolves through a bounded id registry instead of rescanning the
// whole tree; its read stays live and recomputes integrity from the bytes actually returned.
import { createHash } from 'node:crypto';
import {
  closeSync, constants, fstatSync, lstatSync, openSync, readdirSync, realpathSync, readSync,
} from 'node:fs';
import path from 'node:path';
import { integer, problem } from './http.mjs';

export const AGENTIC_FILE_KINDS = Object.freeze(['agents', 'claude', 'opencode-agent', 'skill', 'docs-agent']);
const PRECEDENCE_KINDS = Object.freeze(['agents', 'claude']);

export const AGENTIC_FILE_LIMITS = Object.freeze({
  maxFiles: 200,
  maxFileBytes: 262144,
  maxDepth: 8,
  maxEntries: 5000,
  maxFrontmatterBytes: 4096,
  maxFrontmatterKeys: 32,
  maxFrontmatterValue: 500,
  maxTitle: 200,
  maxContentBytes: 65536,
  maxSkipped: 200,
});

const LIMIT_BOUNDS = Object.freeze({
  maxFiles: [0, 10000],
  maxFileBytes: [0, 1048576],
  maxDepth: [0, 64],
  maxEntries: [0, 100000],
  maxFrontmatterBytes: [0, 65536],
  maxFrontmatterKeys: [0, 256],
  maxFrontmatterValue: [1, 4000],
  maxTitle: [1, 500],
  maxContentBytes: [1, 1048576],
  maxSkipped: [0, 5000],
});

export const AGENTIC_PRECEDENCE_RULE = Object.freeze({
  rule: 'nearest-to-root-wins',
  applied: false,
  scope: 'per-root, and only for kinds agents and claude',
  statement: 'A shallower file of the same kind in the same root outranks a deeper one. Equal depth is a tie and has no winner. Ranking is disclosed only: conflicts are listed and not resolved, and no file is selected as policy.',
});

// Canonical inertness statement for records and coverage; there is deliberately no
// raised/ceiling capability field anywhere because there is no capability to raise.
const INERT_STATEMENT = 'files are inert data; this library grants no capability; trust is always untrusted-until-confirmed';

const QUALIFICATION = `Scan covers regular files matching AGENTS.md, CLAUDE.md, SKILL.md, .opencode/agents/*.md, and docs/agents/*.md under the explicit roots. .git and node_modules are excluded by policy. Symlinks and junctions are not followed; every entry's real path must stay inside the root's own real path. complete means every in-policy match was visited and hashed in full; it does not mean unread, excluded, or remote files do not exist. Precedence is not applied. ${INERT_STATEMENT.charAt(0).toUpperCase() + INERT_STATEMENT.slice(1)}.`;

const NOT_FOUND = () => problem(404, 'Agentic file not found', 'AGENTIC_NOT_FOUND');

function boundsWith(overrides) {
  if (overrides !== undefined && (!overrides || typeof overrides !== 'object' || Array.isArray(overrides))) {
    throw new TypeError('limits must be an object');
  }
  const out = { ...AGENTIC_FILE_LIMITS };
  if (overrides) {
    for (const key of Object.keys(overrides)) {
      if (!Object.hasOwn(LIMIT_BOUNDS, key)) throw new TypeError(`limits.${key} is not a known bound`);
      const value = overrides[key];
      const [min, max] = LIMIT_BOUNDS[key];
      if (!Number.isSafeInteger(value) || value < min || value > max) throw new TypeError(`limits.${key} must be an integer between ${min} and ${max}`);
      out[key] = value;
    }
  }
  return out;
}

function samePath(a, b) {
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
}

/** Containment on real (already realpath-resolved) paths: structural prefix, case-insensitive
 * on win32. Input segments must not contain navigation; callers pass realpath output only. */
```

_First 80 of 665 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
