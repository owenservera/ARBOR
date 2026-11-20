# File: hq/lib/filetypes.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/filetypes.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 40725 B |
| Lines | 971 |
| Hash | a12e9b31856d |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REGISTRY_PATH | const | 13 | no | const REGISTRY_PATH = &#39;hq/registry/agentic-file-registry.v1.json&#39;; |
| FAMILY_CODES | const | 15 | no | const FAMILY_CODES = [ |
| FAMILY_FALLBACK | const | 22 | no | const FAMILY_FALLBACK = { |
| SECRET_BASENAMES | const | 47 | no | const SECRET_BASENAMES = new Set([ &#39;session.json&#39;, &#39;storage-state.json&#39;, &#39;release-profile.json&#39;, &#39;cookies&#39;, |
| cmpStr | function | 58 | no | const cmpStr = (a, b) =&gt; (a === b ? 0 : a &lt; b ? -1 : 1); |
| asArray | function | 60 | no | function asArray(value) { |
| typeName | function | 64 | no | function typeName(type) { |
| normFamily | function | 68 | no | function normFamily(value) { |
| raw | const | 69 | no | const raw = String(value ?? &#39;&#39;).trim(); |
| familyNameOf | function | 73 | no | function familyNameOf(registry, family) { |
| code | const | 74 | no | const code = normFamily(family); |
| byFamily | const | 78 | no | const byFamily = registry?.by_family?.[code]; |
| roleOf | function | 83 | no | function roleOf(registry, family) { |
| code | const | 84 | no | const code = normFamily(family); |
| normalizePath | function | 88 | no | function normalizePath(value) { |
| path | variable | 89 | no | let path = toPosix(String(value ?? &#39;&#39;)).trim(); |
| baseName | function | 97 | no | function baseName(value) { |
| path | const | 98 | no | const path = normalizePath(value); |
| at | const | 99 | no | const at = path.lastIndexOf(&#39;/&#39;); |
| hasGlob | function | 103 | no | function hasGlob(value) { |
| isSecretPath | function | 107 | no | function isSecretPath(value) { |
| name | const | 108 | no | const name = baseName(value); |
| sortedTypes | function | 115 | no | function sortedTypes(registry) { |
| cmpTypeName | function | 122 | no | function cmpTypeName(a, b) { |
| familyCodes | function | 126 | no | function familyCodes(registry) { |
| codes | const | 127 | no | const codes = new Set(); |
| familyRows | function | 139 | no | function familyRows(registry) { |
| types | const | 143 | no | const types = asArray(registry?.types).filter((t) =&gt; normFamily(t?.family) === code); |
| observed | const | 144 | no | const observed = Number(registry?.by_family?.[code]?.count) \|\| 0; |
| derivedCounts | function | 155 | no | function derivedCounts(registry) { |
| types | const | 156 | no | const types = asArray(registry?.types); |
| records | const | 157 | no | const records = asArray(registry?.records); |
| repos | const | 158 | no | const repos = Object.keys(registry?.by_repo \|\| {}); |
| mappedTypes | const | 159 | no | const mappedTypes = types.filter((t) =&gt; t?.mapped === true); |
| rows | const | 160 | no | const rows = familyRows(registry); |
| emptyCounts | function | 175 | no | function emptyCounts() { |
| loadRegistry | function | 196 | yes | export function loadRegistry(root = process.cwd()) { |
| file | const | 197 | no | const file = join(root, REGISTRY_PATH); |
| validateRegistry | function | 203 | yes | export function validateRegistry(registry) { |
| errors | const | 204 | no | const errors = []; |
| types | const | 210 | no | const types = asArray(registry.types); |
| records | const | 211 | no | const records = asArray(registry.records); |
| actual | const | 212 | no | const actual = derivedCounts(registry); |
| declared | const | 213 | no | const declared = registry.counts &amp;&amp; typeof registry.counts === &#39;object&#39; ? registry.counts : {}; |
| counts | const | 214 | no | const counts = { |
| expect | function | 234 | no | const expect = (key, actualValue) =&gt; { |
| wanted | const | 235 | no | const wanted = Number(declared[key]); |
| repoEntries | const | 265 | no | const repoEntries = Object.entries(registry.by_repo \|\| {}); |
| repoSum | const | 266 | no | const repoSum = repoEntries.reduce((sum, [, n]) =&gt; sum + (Number(n) \|\| 0), 0); |
| kindSum | const | 270 | no | const kindSum = Object.values(registry.by_kind \|\| {}).reduce((sum, n) =&gt; sum + (Number(n) \|\| 0), 0); |
| byFamilySum | const | 273 | no | const byFamilySum = Object.values(registry.by_family \|\| {}) |
| ids | const | 281 | no | const ids = new Set(); |
| names | const | 282 | no | const names = new Set(); |
| patterns | const | 283 | no | const patterns = new Set(); |
| id | const | 285 | no | const id = String(type?.id ?? &#39;&#39;); |
| name | const | 290 | no | const name = String(type?.name ?? &#39;&#39;); |
| nameKey | const | 291 | no | const nameKey = name.toLowerCase(); |
| pattern | const | 296 | no | const pattern = String(type?.pattern ?? &#39;&#39;); |
| patternKey | const | 297 | no | const patternKey = pattern.toLowerCase(); |
| family | const | 302 | no | const family = normFamily(type?.family); |
| seenRecords | const | 314 | no | const seenRecords = new Set(); |
| key | const | 316 | no | const key = `${record?.repo ?? &#39;&#39;}:${record?.path ?? &#39;&#39;}`; |
| family | const | 321 | no | const family = normFamily(record?.family); |
| present | const | 328 | no | const present = new Set(familyRows(registry).map((row) =&gt; row.code)); |
| extra | const | 332 | no | const extra = [...present].filter((code) =&gt; !FAMILY_CODES.includes(code)); |
| rows | const | 340 | no | const rows = types.filter((t) =&gt; normFamily(t?.family) === normFamily(code)); |
| exactCandidates | function | 356 | no | function exactCandidates(types, path) { |
| out | const | 357 | no | const out = []; |
| raw | const | 359 | no | const raw = String(type?.pattern ?? &#39;&#39;); |
| pattern | const | 361 | no | const pattern = normalizePath(raw); |
| matched | const | 362 | no | const matched = pattern.includes(&#39;/&#39;) |
| rank | const | 367 | no | const rank = (pattern.includes(&#39;/&#39;) ? 1 : 2) * 10000 + pattern.length; |
| globCandidates | function | 373 | no | function globCandidates(types, path) { |
| out | const | 374 | no | const out = []; |
| raw | const | 376 | no | const raw = String(type?.pattern ?? &#39;&#39;); |
| pattern | const | 378 | no | const pattern = normalizePath(raw); |
| re | variable | 379 | no | let re; |
| parts | const | 385 | no | const parts = path.split(&#39;/&#39;); |
| matched | variable | 386 | no | let matched = re.test(path); |
| literal | const | 393 | no | const literal = pattern.replace(/[*?{}]/g, &#39;&#39;).length; |
| classificationOf | function | 399 | no | function classificationOf(type, confidence) { |
| unclassified | function | 414 | no | function unclassified() { |
| classifyPath | function | 429 | yes | export function classifyPath(registry, path) { |
| normalized | const | 430 | no | const normalized = normalizePath(path); |
| types | const | 433 | no | const types = sortedTypes(registry); |
| mapped | const | 434 | no | const mapped = types.filter((t) =&gt; t?.mapped === true); |
| observedOnly | const | 435 | no | const observedOnly = types.filter((t) =&gt; t?.mapped !== true); |
| exact | const | 438 | no | const exact = exactCandidates(mapped, normalized); |
| globbed | const | 442 | no | const globbed = globCandidates(mapped, normalized); |
| observed | const | 446 | no | const observed = exactCandidates(observedOnly, normalized); |
| typesForFamily | function | 455 | yes | export function typesForFamily(registry, family) { |
| code | const | 456 | no | const code = normFamily(family); |
| typesForRole | function | 462 | yes | export function typesForRole(registry, role) { |
| wanted | const | 463 | no | const wanted = String(role ?? &#39;&#39;).trim().toLowerCase(); |
| fieldText | function | 469 | no | function fieldText(type, field) { |
| TASK_FIELDS | const | 486 | no | const TASK_FIELDS = [ |
| tokenQuality | function | 494 | no | function tokenQuality(token, text) { |
| lower | const | 496 | no | const lower = text.toLowerCase(); |
| fieldTokens | const | 497 | no | const fieldTokens = new Set(tokenize(lower)); |
| best | variable | 499 | no | let best = 0; |
| typesForTask | function | 511 | yes | export function typesForTask(registry, task, options = {}) { |
| requested | const | 512 | no | const requested = Number(options?.limit ?? 12); |
| limit | const | 513 | no | const limit = Number.isFinite(requested) ? Math.max(0, Math.min(200, Math.trunc(requested))) : 12; |
| tokens | const | 516 | no | const tokens = tokenize(task); |
| scored | const | 517 | no | const scored = []; |
| base | variable | 519 | no | let base = 0; |
| observed | const | 529 | no | const observed = Number(type?.observed_count) \|\| 0; |
| boost | const | 530 | no | const boost = observed &gt; 0 ? 1 + Math.min(1, Math.log10(1 + observed)) : 0; |
| score | const | 531 | no | const score = Math.round((base + boost) * 1000) / 1000; |
| normaliseDocRow | function | 542 | no | function normaliseDocRow(row) { |
| autoExpose | function | 552 | yes | export function autoExpose(db, { registry, task, project = null, limit = 12 } = {}) { |
| requested | const | 553 | no | const requested = Number(limit); |
| cap | const | 554 | no | const cap = Number.isFinite(requested) ? Math.max(0, Math.min(200, Math.trunc(requested))) : 12; |
| types | const | 555 | no | const types = typesForTask(registry, task, { limit: cap }); |
| typeIds | const | 558 | no | const typeIds = new Set(types.map((t) =&gt; String(t.id))); |
| families | const | 559 | no | const families = new Set(types.map((t) =&gt; normFamily(t.family))); |
| roles | const | 560 | no | const roles = new Set(types.map((t) =&gt; String(t.role ?? &#39;&#39;).toLowerCase()).filter(Boolean)); |
| authorities | const | 561 | no | const authorities = new Set(types.map((t) =&gt; t.authority).filter(Boolean)); |
| rows | variable | 563 | no | let rows; |
| wantedProject | const | 575 | no | const wantedProject = project == null ? null : String(project).toLowerCase(); |
| candidates | const | 576 | no | const candidates = []; |
| row | const | 578 | no | const row = normaliseDocRow(raw); |
| cls | const | 582 | no | const cls = classifyPath(registry, row.path); |
| docFamily | const | 583 | no | const docFamily = row.family \|\| normFamily(cls.family); |
| docRole | const | 584 | no | const docRole = row.role \|\| String(cls.role ?? &#39;&#39;).toLowerCase(); |
| docAuthority | const | 585 | no | const docAuthority = row.authority ?? cls.authority ?? null; |
| taskMatch | const | 587 | no | const taskMatch = cls.typeId != null &amp;&amp; typeIds.has(String(cls.typeId)); |
| familyMatch | const | 588 | no | const familyMatch = families.has(docFamily); |
| roleMatch | const | 589 | no | const roleMatch = roles.has(docRole); |
| authorityMatch | const | 590 | no | const authorityMatch = Boolean(docAuthority &amp;&amp; authorities.has(docAuthority)); |
| strongAuthority | const | 594 | no | const strongAuthority = authorityMatch &amp;&amp; [&#39;owner&#39;, &#39;architecture&#39;, &#39;team&#39;].includes(String(docAuthority)); |
| reasons | const | 597 | no | const reasons = []; |
| best | variable | 604 | no | let best = null; |
| networkGraph | function | 635 | yes | export function networkGraph(registry) { |
| nodes | const | 636 | no | const nodes = sortedTypes(registry); |
| byFamily | const | 637 | no | const byFamily = new Map(); |
| family | const | 639 | no | const family = normFamily(node.family); |
| edges | const | 644 | no | const edges = []; |
| seen | const | 645 | no | const seen = new Set(); |
| addEdge | function | 646 | no | const addEdge = (from, to, kind) =&gt; { |
| key | const | 648 | no | const key = `${from}\\u0000${to}\\u0000${kind}`; |
| group | const | 655 | no | const group = byFamily.get(family).slice().sort((a, b) =&gt; cmpStr(String(a.id), String(b.id))); |
| flows | const | 663 | no | const flows = asArray(registry?.network?.family_flow) |
| fromGroup | const | 667 | no | const fromGroup = (byFamily.get(flow.from) \|\| []).slice().sort((a, b) =&gt; cmpStr(String(a.id), String(b.id))); |
| toGroup | const | 668 | no | const toGroup = (byFamily.get(flow.to) \|\| []).slice().sort((a, b) =&gt; cmpStr(String(a.id), String(b.id))); |
| findType | function | 681 | no | function findType(registry, typeNameValue) { |
| wanted | const | 682 | no | const wanted = String(typeNameValue ?? &#39;&#39;).trim().toLowerCase(); |
| inlineTagsFor | function | 691 | yes | export function inlineTagsFor(registry, typeNameValue) { |
| role | const | 695 | no | const role = type ? String(type.role ?? &#39;&#39;).toLowerCase() : String(typeNameValue ?? &#39;&#39;).toLowerCase(); |
| tags | const | 697 | no | const tags = new Set(); |
| mdCell | function | 708 | no | function mdCell(value) { |
| countOf | function | 714 | no | function countOf(registry, key, fallback) { |
| value | const | 715 | no | const value = Number(registry?.counts?.[key]); |
| renderRuleBook | function | 719 | yes | export function renderRuleBook(registry) { |
| counts | const | 720 | no | const counts = derivedCounts(registry); |
| rows | const | 721 | no | const rows = familyRows(registry); |
| nRecords | const | 722 | no | const nRecords = countOf(registry, &#39;records&#39;, counts.records); |
| nRepos | const | 723 | no | const nRepos = countOf(registry, &#39;repositories&#39;, counts.repositories); |
| nCatalog | const | 724 | no | const nCatalog = countOf(registry, &#39;catalog_patterns&#39;, counts.catalog_patterns); |
| nMapped | const | 725 | no | const nMapped = countOf(registry, &#39;mapped_records&#39;, counts.mapped_records); |
| nUnmapped | const | 726 | no | const nUnmapped = countOf(registry, &#39;unmapped_records&#39;, counts.unmapped_records); |
| nUnobserved | const | 727 | no | const nUnobserved = countOf(registry, &#39;catalog_patterns_unobserved&#39;, counts.catalog_patterns_unobserved); |
| nObservedPatterns | const | 728 | no | const nObservedPatterns = countOf(registry, &#39;catalog_patterns_observed&#39;, counts.catalog_patterns_observed); |
| nTracked | const | 729 | no | const nTracked = countOf(registry, &#39;tracked_files&#39;, 0); |
| nSource | const | 730 | no | const nSource = countOf(registry, &#39;source_records&#39;, 0); |
| nDonor | const | 731 | no | const nDonor = countOf(registry, &#39;donor_snapshots&#39;, 0); |
| nTypes | const | 732 | no | const nTypes = counts.types; |
| builtAt | const | 733 | no | const builtAt = String(registry?.built_at ?? &#39;unknown&#39;); |
| inventoryDate | const | 734 | no | const inventoryDate = String(registry?.sources?.inventory_date ?? &#39;unknown&#39;); |
| catalogDate | const | 735 | no | const catalogDate = String(registry?.sources?.catalog_date ?? &#39;unknown&#39;); |
| familyTable | const | 737 | no | const familyTable = [ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 7 | external |
| node:path | import | 8 | external |
| ./util.mjs | import | 9 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/filetypes.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/filetypes.mjs |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/filetypes.mjs |
| [hq/lib/canon.mjs](./canon.mjs.md) | ./filetypes.mjs |
| [hq/lib/kb-intake.mjs](./kb-intake.mjs.md) | ./filetypes.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/filetypes.mjs — lane K: the AION 21-family agentic file registry.
//
// Read-only and deterministic. This module only reads
// hq/registry/agentic-file-registry.v1.json; it never writes, fetches or
// promotes anything. "Mapped" means a record matched a catalog pattern. It
// does not mean implemented, accepted or required.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { globToRegExp, toPosix, tokenize } from './util.mjs';

// Kept internal so the module's public function surface stays exact. The
// path is also attached to loadRegistry for callers that want to display it.
const REGISTRY_PATH = 'hq/registry/agentic-file-registry.v1.json';

const FAMILY_CODES = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11',
  '12', '13', '14', '15', '16', '17', '18', '19', '20', '21',
];

// Used only when a registry row has no family_name. The live registry carries
// a name on every type; this keeps rendering total for malformed snapshots.
const FAMILY_FALLBACK = {
  '00': 'Unclassified',
  '01': 'Agent entry & bootstrap',
  '02': 'Provider-native instruction rules',
  '03': 'Agent roles & identity',
  '04': 'Context & retrieval',
  '05': 'Law, policy & guardrails',
  '06': 'Goals & product intent',
  '07': 'Architecture & interfaces',
  '08': 'Capabilities & discovery',
  '09': 'Skills & reusable methods',
  '10': 'Tool configuration & hooks',
  '11': 'Memory & durable learning',
  '12': 'State, status & telemetry',
  '13': 'Session boundaries & recovery',
  '14': 'Work inventory & scheduling',
  '15': 'Planning & decomposition',
  '16': 'Execution & operations',
  '17': 'Testing & validation',
  '18': 'Proof, lineage & audit',
  '19': 'Collaboration & handoffs',
  '20': 'Decision & governance record',
  '21': 'Closeout, release & retirement',
};

const SECRET_BASENAMES = new Set([
  'session.json',
  'storage-state.json',
  'release-profile.json',
  'cookies',
  'login data',
]);

// ---------------------------------------------------------------------------
// small deterministic helpers

const cmpStr = (a, b) => (a === b ? 0 : a < b ? -1 : 1);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function typeName(type) {
  return String(type?.name || type?.pattern || '');
}

function normFamily(value) {
  const raw = String(value ?? '').trim();
  return /^\d$/.test(raw) ? `0${raw}` : raw;
}

function familyNameOf(registry, family) {
  const code = normFamily(family);
  for (const type of asArray(registry?.types)) {
    if (normFamily(type?.family) === code && type?.family_name) return String(type.family_name);
  }
  const byFamily = registry?.by_family?.[code];
  if (byFamily?.family_name) return String(byFamily.family_name);
  return FAMILY_FALLBACK[code] || 'Unclassified';
```

_First 80 of 972 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
