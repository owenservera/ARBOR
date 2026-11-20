# File: studio/src/studio/provider-performance.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/provider-performance.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9102 B |
| Lines | 154 |
| Hash | 5dd72f9a4a62 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_JOBS | const | 9 | no | const MAX_JOBS = 200; // latest N files per job directory, by last-modified time |
| LABELS | const | 10 | no | const LABELS = { chatgpt: &#39;ChatGPT&#39;, claude: &#39;Claude&#39;, zai: &#39;Z.ai&#39;, qwen: &#39;Qwen&#39;, deepseek: &#39;DeepSeek&#39;, gemini: &#39;Gemini&#39; }; |
| labelOf | function | 11 | no | const labelOf = (site) =&gt; LABELS[site] ?? (typeof site === &#39;string&#39; &amp;&amp; site ? site[0].toUpperCase() + site.slice(1) : &#39;Unknown&#39;); |
| UNCERTAIN_CODES | const | 13 | no | const UNCERTAIN_CODES = new Set([&#39;DELIVERY_UNCONFIRMED&#39;, &#39;TURN_NOT_FOUND&#39;, &#39;CREATION_UNPINNED&#39;, &#39;RESUMED_UNFINISHED&#39;, &#39;REPLY_INTERRUPTED&#39;, &#39;REPLY_TIMEOUT&#39;, &#39;INTERRUPTED&#39;]); |
| latestJsonNames | function | 15 | no | async function latestJsonNames(directory) { |
| names | variable | 16 | no | let names; |
| candidates | const | 18 | no | const candidates = names.filter((name) =&gt; name.endsWith(&#39;.json&#39;) &amp;&amp; !name.includes(&#39;.tmp&#39;)); |
| withTimes | const | 19 | no | const withTimes = await Promise.all(candidates.map(async (name) =&gt; { try { const s = await stat(path.join(directory, name)); return { name, mtime: s.mtimeMs }; } catch { return null; } // Deleted bet… |
| readJsonSafe | function | 25 | no | async function readJsonSafe(file) { |
| bucket | function | 28 | no | function bucket(map, site) { |
| noteError | function | 34 | no | function noteError(entry, code, message, at) { |
| text | const | 36 | no | const text = typeof message === &#39;string&#39; ? message.trim() : &#39;&#39;; |
| plain | const | 37 | no | const plain = text &amp;&amp; !/^[A-Z][A-Z0-9_]{2,79}$/.test(text) ? text : null; |
| msBetween | function | 40 | no | function msBetween(startIso, endIso) { |
| start | const | 41 | no | const start = Date.parse(startIso ?? &#39;&#39;), end = Date.parse(endIso ?? &#39;&#39;); |
| percentile | function | 47 | no | function percentile(sortedAsc, p) { |
| pos | const | 49 | no | const pos = (sortedAsc.length - 1) * (p / 100); |
| lo | const | 50 | no | const lo = Math.floor(pos), hi = Math.ceil(pos); |
| value | const | 51 | no | const value = lo === hi ? sortedAsc[lo] : sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (pos - lo); |
| foldCompareJob | function | 58 | no | function foldCompareJob(job, map) { |
| site | const | 61 | no | const site = result?.site; |
| entry | const | 63 | no | const entry = bucket(map, site); |
| ms | const | 69 | no | const ms = msBetween(result.startedAt ?? result.submittedAt, result.answeredAt); |
| foldAiDesignJob | function | 83 | no | function foldAiDesignJob(job, map) { |
| entry | const | 85 | no | const entry = bucket(map, job.site); |
| ms | const | 89 | no | const ms = msBetween(job.createdAt, job.updatedAt); |
| code | const | 93 | no | const code = job.error?.code; |
| foldOrchestratePlan | function | 103 | no | function foldOrchestratePlan(plan, map) { |
| entry | const | 108 | no | const entry = bucket(map, step.site); entry.jobs++; entry.completed++; |
| ms | const | 109 | no | const ms = msBetween(step.submittedAt, step.answeredAt); |
| entry | const | 112 | no | const entry = bucket(map, step.site); entry.jobs++; entry.skipped++; |
| entry | const | 115 | no | const entry = bucket(map, step.site); entry.jobs++; entry.failed++; |
| mapBounded | function | 124 | no | async function mapBounded(items, limit, fn) { |
| next | variable | 125 | no | let next = 0; |
| workers | const | 126 | no | const workers = Array.from({ length: Math.min(limit, items.length) }, async () =&gt; { while (next &lt; items.length) { const index = next++; await fn(items[index], index); } }); |
| readProviderPerformance | function | 133 | yes | export async function readProviderPerformance({ paths } = {}) { |
| compareDir | const | 135 | no | const compareDir = path.join(paths.root, &#39;compare-jobs&#39;); |
| aiDesignDir | const | 136 | no | const aiDesignDir = path.join(paths.root, &#39;personal-app-ai-jobs&#39;); |
| orchestrateDir | const | 137 | no | const orchestrateDir = path.join(paths.root, &#39;orchestrate-plans&#39;); |
| map | const | 139 | no | const map = new Map(); |
| tasks | const | 140 | no | const tasks = [ |
| providers | const | 147 | no | const providers = [...map.values()].map(({ times, ...entry }) =&gt; { const sorted = [...times].sort((a, b) =&gt; a - b); return { ...entry, medianMs: percentile(sorted, 50), p90Ms: percentile(sorted, 90) … |
| sorted | const | 148 | no | const sorted = [...times].sort((a, b) =&gt; a - b); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 6 | external |
| node:fs/promises | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/ai-router.mjs](./ai-router.mjs.md) | ./provider-performance.mjs |
| [studio/src/studio/provider-performance-routes.mjs](./provider-performance-routes.mjs.md) | ./provider-performance.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Read-only performance view over ALREADY-SAVED provider job files. Never opens a browser, never
// calls a provider, never writes. Bounded to the latest MAX_JOBS files per job kind (by mtime) so a
// large job history can never turn one request into a slow full-directory scan. Every number here
// comes from the SAME plain-language messages compare-service.mjs / personal-app-ai-design.mjs
// already saved for the user, so no second "friendly error" table is maintained here.
import path from 'node:path';
import { readdir, readFile, stat } from 'node:fs/promises';

const MAX_JOBS = 200; // latest N files per job directory, by last-modified time
const LABELS = { chatgpt: 'ChatGPT', claude: 'Claude', zai: 'Z.ai', qwen: 'Qwen', deepseek: 'DeepSeek', gemini: 'Gemini' };
const labelOf = (site) => LABELS[site] ?? (typeof site === 'string' && site ? site[0].toUpperCase() + site.slice(1) : 'Unknown');
// Codes that mean "we could not prove what happened", as distinct from a plain failure.
const UNCERTAIN_CODES = new Set(['DELIVERY_UNCONFIRMED', 'TURN_NOT_FOUND', 'CREATION_UNPINNED', 'RESUMED_UNFINISHED', 'REPLY_INTERRUPTED', 'REPLY_TIMEOUT', 'INTERRUPTED']);

async function latestJsonNames(directory) {
  let names;
  try { names = await readdir(directory); } catch { return []; }
  const candidates = names.filter((name) => name.endsWith('.json') && !name.includes('.tmp'));
  const withTimes = await Promise.all(candidates.map(async (name) => {
    try { const s = await stat(path.join(directory, name)); return { name, mtime: s.mtimeMs }; }
    catch { return null; } // Deleted between readdir and stat: not our failure, just skip it.
  }));
  return withTimes.filter(Boolean).sort((a, b) => b.mtime - a.mtime).slice(0, MAX_JOBS).map((f) => f.name);
}
async function readJsonSafe(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return null; } // Unreadable/corrupt: skip, never throw.
}
function bucket(map, site) {
  if (!map.has(site)) map.set(site, { site, label: labelOf(site), jobs: 0, completed: 0, failed: 0, skipped: 0, uncertain: 0, times: [], lastError: null });
  return map.get(site);
}
// Keep the most RECENT error only (by the job's own updatedAt), so an old failure never hides a fix.
// A message that is itself a bare CODE is not plain language: store null and let the caller de-code it.
function noteError(entry, code, message, at) {
  if (typeof at !== 'string') return;
  const text = typeof message === 'string' ? message.trim() : '';
  const plain = text && !/^[A-Z][A-Z0-9_]{2,79}$/.test(text) ? text : null;
  if (!entry.lastError || !(entry.lastError.at > at)) entry.lastError = { code: code ?? null, message: plain, at };
}
function msBetween(startIso, endIso) {
  const start = Date.parse(startIso ?? ''), end = Date.parse(endIso ?? '');
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return end - start;
}
// Linear-interpolated percentile over an ascending array: p50 of two samples is their mean, and p90
// of a handful of samples sits between the slowest two instead of snapping to the slowest one.
function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return null;
  const pos = (sortedAsc.length - 1) * (p / 100);
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  const value = lo === hi ? sortedAsc[lo] : sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (pos - lo);
  return Math.round(value);
}

// compare-jobs/*.json — src/studio/compare-service.mjs. One entry per provider PER result, since one
// job can ask several providers. result.message/.reason are already the plain-language text shown
// to the user; this module never re-derives its own copy of that wording.
function foldCompareJob(job, map) {
  if (!job || job.schema !== 'vivim.compare/1' || !Array.isArray(job.results)) return;
  for (const result of job.results) {
    const site = result?.site;
    if (typeof site !== 'string' || !site) continue;
    const entry = bucket(map, site);
    entry.jobs++;
    if (result.state === 'ready') {
      entry.completed++;
      // Asked-at → answered-at only. Never the job's createdAt/updatedAt: after the fan-out those
      // include time spent queueing behind other sites, which is not this provider's answer time.
      const ms = msBetween(result.startedAt ?? result.submittedAt, result.answeredAt);
      if (ms !== null) entry.times.push(ms);
    } else if (result.state === 'skipped') {
      entry.skipped++;
      noteError(entry, result.reason ?? 'SIGNED_OUT', result.message, job.updatedAt);
    } else if (result.state === 'failed') {
      entry.failed++;
      if (UNCERTAIN_CODES.has(result.reason)) entry.uncertain++;
      noteError(entry, result.reason, result.message, job.updatedAt);
    }
    // queued/waiting/cancelled: still in flight or stopped early, not a finished observation either way.
  }
```

_First 80 of 155 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
