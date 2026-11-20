# File: studio/src/studio/drive-api.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/drive-api.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12389 B |
| Lines | 181 |
| Hash | eb050e6719f9 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| now | function | 11 | no | const now = () =&gt; new Date().toISOString(); |
| terminal | function | 12 | no | const terminal = (j) =&gt; ![&#39;queued&#39;, &#39;running&#39;].includes(j.state); |
| read | function | 13 | no | function read(file, fallback) { try { return JSON.parse(readFileSync(file, &#39;utf8&#39;)); } catch { return fallback; } } |
| driveVerdict | function | 15 | yes | export function driveVerdict(result = {}, prompt = result.prompt) { |
| expected | const | 21 | no | const expected = expectedAnswer(prompt); |
| createDriveApi | function | 27 | yes | export function createDriveApi({ dataDir, port = 9222, drive = driveSite, campaign = runCampaign } = {}) { |
| file | const | 28 | no | const file = path.join(dataDir, &#39;drive-jobs.json&#39;); |
| jobs | variable | 29 | no | let jobs = read(file, []); |
| active | variable | 36 | no | let active = null, closed = false; |
| save | function | 37 | no | const save = () =&gt; { |
| tmp | const | 39 | no | const tmp = `${file}.${process.pid}.tmp`; |
| snapshot | function | 43 | no | const snapshot = (j) =&gt; structuredClone(j); |
| find | function | 44 | no | const find = (id) =&gt; { const j = jobs.find((j) =&gt; j.id === id); if (!j) throw problem(404, &#39;Drive job not found&#39;); return j; }; |
| safeReason | function | 45 | no | const safeReason = (value, prompt, reply) =&gt; { |
| s | variable | 46 | no | let s = String(value ?? &#39;&#39;).replaceAll(prompt, &#39;[prompt omitted]&#39;); |
| sites | function | 51 | no | async function sites() { |
| state | const | 52 | no | const state = read(path.join(dataDir, &#39;campaign-state.json&#39;), {}).sites ?? {}; |
| adapter | const | 54 | no | const adapter = await getAdapter(id), last = state[id]; |
| legacyMatch | const | 57 | no | const legacyMatch = last?.status === &#39;failed&#39; &amp;&amp; /\\ball \\d+ expected words in order\\b/i.test(last.reason ?? &#39;&#39;); |
| validate | function | 62 | no | async function validate(body) { |
| dryRun | const | 68 | no | const dryRun = body.dryRun ?? true; |
| targets | const | 72 | no | const targets = []; |
| url | variable | 75 | no | let url; |
| adapter | const | 82 | no | const adapter = await getAdapter(url.href); |
| run | function | 87 | no | async function run(job, options, controller) { |
| result | variable | 95 | no | let result; |
| out | const | 100 | no | const out = await campaign({ sites: [site], prompt: options.prompt, port, dataDir, execute: !job.dryRun, cooldownMs: 0, perSiteTimeoutMs: options.timeoutMs, drive: (args) =&gt; { controller.signal.throw… |
| verdict | const | 111 | no | const verdict = driveVerdict(result, options.prompt); |
| ms | const | 119 | no | const ms = options.cooldownMs === undefined ? 45000 + Math.random() * 45000 : options.cooldownMs * (0.6 + Math.random() * 0.4); |
| parts | const | 143 | no | const parts = url.pathname.slice(&#39;/api/v1/drive/&#39;.length).split(&#39;/&#39;); |
| allowed | const | 145 | no | const allowed = resource === &#39;sites&#39; &amp;&amp; parts.length === 1 ? [&#39;GET&#39;] |
| job | const | 153 | no | const job = find(id); |
| options | const | 164 | no | const options = await validate(body); |
| job | const | 166 | no | const job = { id: randomUUID(), mode: body.mode, sites: options.targets.map((t) =&gt; t.site), dryRun: options.dryRun, |
| controller | const | 169 | no | const controller = new AbortController(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 2 | external |
| node:path | import | 3 | external |
| node:crypto | import | 4 | external |
| node:timers/promises | import | 5 | external |
| ../capture/actions.mjs | import | 6 | [studio/src/capture/actions.mjs](../capture/actions.mjs.md) |
| ../capture/campaign.mjs | import | 7 | [studio/src/capture/campaign.mjs](../capture/campaign.mjs.md) |
| ../profiles/sites/index.mjs | import | 8 | [studio/src/profiles/sites/index.mjs](../profiles/sites/index.mjs.md) |
| ./http.mjs | import | 9 | [studio/src/studio/http.mjs](./http.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/server.mjs](./server.mjs.md) | ./drive-api.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Job metadata only: prompts, replies and raw driver events never enter this API's history.
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { driveSite } from '../capture/actions.mjs';
import { runCampaign, siteOrder, defaultPrompt, expectedAnswer, replyMatchesExpectation } from '../capture/campaign.mjs';
import { getAdapter } from '../profiles/sites/index.mjs';
import { json, problem, object } from './http.mjs';

const now = () => new Date().toISOString();
const terminal = (j) => !['queued', 'running'].includes(j.state);
function read(file, fallback) { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return fallback; } }

export function driveVerdict(result = {}, prompt = result.prompt) {
  if (result.blocked || result.status === 'blocked') return 'blocked';
  if (result.status === 'unverified') return 'unverified';
  if (result.status === 'verified' || result.verified === true) return 'verified';
  if (result.status === 'planned' || result.status === 'not-run') return 'not-run';
  if (result.ok || result.status === 'ok') {
    const expected = expectedAnswer(prompt);
    return expected && replyMatchesExpectation(result.reply, expected).ok ? 'verified' : 'unverified';
  }
  return 'failed';
}

export function createDriveApi({ dataDir, port = 9222, drive = driveSite, campaign = runCampaign } = {}) {
  const file = path.join(dataDir, 'drive-jobs.json');
  let jobs = read(file, []);
  if (!Array.isArray(jobs)) jobs = [];
  jobs = jobs.slice(0, 50);
  for (const job of jobs) if (!terminal(job)) {
    job.state = 'cancelled'; job.finishedAt = now(); job.error = 'Studio restarted; interrupted jobs are never retried';
    for (const p of job.progress ?? []) if (['pending', 'running'].includes(p.state)) p.state = 'skipped';
  }
  let active = null, closed = false;
  const save = () => {
    mkdirSync(dataDir, { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(jobs.slice(0, 50), null, 2)}\n`);
    renameSync(tmp, file);
  };
  const snapshot = (j) => structuredClone(j);
  const find = (id) => { const j = jobs.find((j) => j.id === id); if (!j) throw problem(404, 'Drive job not found'); return j; };
  const safeReason = (value, prompt, reply) => {
    let s = String(value ?? '').replaceAll(prompt, '[prompt omitted]');
    if (typeof reply === 'string' && reply) s = s.replaceAll(reply, '[reply omitted]');
    s = s.replace(/https?:\/\/\S+/gi, '[URL omitted]').replace(/\b(?:bearer\s+\S+|(?:token|secret|password|api[_-]?key)\s*[:=]\s*\S+)/gi, '[credential omitted]');
    return s.slice(0, 500);
  };
  async function sites() {
    const state = read(path.join(dataDir, 'campaign-state.json'), {}).sites ?? {};
    return { defaultPrompt, verdictMeaning: 'Verified means calibration reply matched; capture acceptance is not checked', cancellationMode: 'after-current-site', sites: await Promise.all(siteOrder.map(async (id) => {
      const adapter = await getAdapter(id), last = state[id];
      // Display-only compatibility with old persisted campaign status. Never use a
      // reason string as evidence to upgrade a newly returned live failure.
      const legacyMatch = last?.status === 'failed' && /\ball \d+ expected words in order\b/i.test(last.reason ?? '');
      return { id, adapter: adapter?.id ?? null, url: adapter?.url ?? null,
        last: last ? { status: legacyMatch ? 'verified' : driveVerdict(last), reason: legacyMatch ? 'Reply matched, capture not checked' : safeReason(last.reason, last.prompt || defaultPrompt, last.reply), at: last.at ?? null, sessionId: last.sessionId ?? null } : null };
    })) };
  }
  async function validate(body) {
    object(body);
    if (!['drive', 'campaign'].includes(body.mode)) throw problem(400, 'mode must be drive or campaign');
    if (!Array.isArray(body.sites) || !body.sites.length || body.sites.length > siteOrder.length || body.sites.some((s) => typeof s !== 'string')) throw problem(400, 'sites must be a nonempty array');
    if (body.mode === 'drive' && body.sites.length !== 1) throw problem(400, 'drive requires exactly one site');
    for (const key of ['dryRun', 'confirm']) if (body[key] !== undefined && typeof body[key] !== 'boolean') throw problem(400, `${key} must be boolean`);
    const dryRun = body.dryRun ?? true;
    if (!dryRun && body.confirm !== true) throw problem(400, 'confirm=true is required for a live send');
    if (body.prompt !== undefined && (typeof body.prompt !== 'string' || !body.prompt.trim() || body.prompt.length > 250000)) throw problem(400, 'prompt must contain 1–250000 characters');
    for (const key of ['timeout', 'cooldown']) if (body[key] !== undefined && (!Number.isSafeInteger(body[key]) || body[key] < (key === 'timeout' ? 1 : 0) || body[key] > 86400)) throw problem(400, `${key} must be an integer in seconds (maximum 86400)`);
    const targets = [];
    for (const site of [...new Set(body.sites)]) {
      if (siteOrder.includes(site)) { targets.push({ site, adapter: await getAdapter(site) }); continue; }
      let url;
      try { url = new URL(site); } catch { throw problem(400, 'Unknown site'); }
      if (body.mode !== 'drive' ||
          !(['https:', 'http:'].includes(url.protocol)) ||
          (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) ||
          url.username || url.password)
```

_First 80 of 182 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
