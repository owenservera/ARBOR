# File: studio/src/capture/campaign.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/campaign.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 21374 B |
| Lines | 450 |
| Hash | 67a17d8c4ad5 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| defaultPrompt | const | 27 | yes | export const defaultPrompt = &#39;Reply with exactly these 12 words separated by single spaces and nothing else: alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima&#39;; |
| expectedWords | const | 32 | yes | export const expectedWords = Object.freeze(&#39;alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima&#39;.split(&#39; &#39;)); |
| moreToDoSoon | function | 35 | no | function moreToDoSoon(wanted, index, cap, totals, resume, state) { |
| d | const | 38 | no | const d = state.sites?.[rest]; |
| expectedAnswer | function | 44 | yes | export function expectedAnswer(prompt = defaultPrompt) { |
| p | const | 45 | no | const p = String(prompt ?? &#39;&#39;); |
| replyMatchesExpectation | function | 51 | yes | export function replyMatchesExpectation(reply, expected) { |
| want | const | 52 | no | const want = String(expected ?? &#39;&#39;).toLowerCase().replace(/[^a-z0-9\\s]/g, &#39; &#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| got | const | 54 | no | const got = String(reply ?? &#39;&#39;).toLowerCase().replace(/[^a-z0-9\\s]/g, &#39; &#39;).replace(/\\s+/g, &#39; &#39;).trim(); |
| words | const | 55 | no | const words = want.split(&#39; &#39;); |
| at | variable | 56 | no | let at = 0; |
| missing | const | 57 | no | const missing = []; |
| idx | const | 59 | no | const idx = got.indexOf(w, at); |
| siteOrder | const | 69 | yes | export const siteOrder = Object.freeze([&#39;chatgpt&#39;, &#39;claude&#39;, &#39;gemini&#39;, &#39;deepseek&#39;, &#39;zai&#39;, &#39;qwen&#39;, &#39;lmarena&#39;, &#39;minimax&#39;, &#39;kimi&#39;]); |
| STATE_FILE | const | 71 | no | const STATE_FILE = &#39;campaign-state.json&#39;; |
| DEFAULT_COOLDOWN_MIN_MS | const | 72 | no | const DEFAULT_COOLDOWN_MIN_MS = 45000; |
| DEFAULT_COOLDOWN_MAX_MS | const | 73 | no | const DEFAULT_COOLDOWN_MAX_MS = 90000; |
| msg | function | 75 | no | const msg = (e) =&gt; String(e?.message ?? e ?? &#39;unknown error&#39;); |
| nowIso | function | 76 | no | const nowIso = () =&gt; new Date().toISOString(); |
| sleep | function | 77 | no | const sleep = (ms) =&gt; new Promise((r) =&gt; setTimeout(r, Math.max(0, ms))); |
| statePath | function | 83 | yes | export function statePath(dataDir) { |
| readState | function | 87 | no | function readState(dataDir) { |
| raw | const | 89 | no | const raw = JSON.parse(fs.readFileSync(statePath(dataDir), &#39;utf8&#39;)); |
| sites | const | 90 | no | const sites = raw &amp;&amp; typeof raw === &#39;object&#39; &amp;&amp; raw.sites &amp;&amp; typeof raw.sites === &#39;object&#39; ? raw.sites : {}; |
| writeState | function | 97 | no | function writeState(dataDir, state) { |
| file | const | 100 | no | const file = statePath(dataDir); |
| tmp | const | 101 | no | const tmp = `${file}.${process.pid}.tmp`; |
| normalizeSites | function | 113 | no | function normalizeSites(sites) { |
| list | const | 114 | no | const list = Array.isArray(sites) &amp;&amp; sites.length ? sites : siteOrder; |
| seen | const | 115 | no | const seen = new Set(); |
| out | const | 116 | no | const out = []; |
| id | const | 118 | no | const id = String(raw ?? &#39;&#39;).trim().toLowerCase(); |
| targetUrlOf | function | 126 | no | function targetUrlOf(adapter) { |
| host | const | 128 | no | const host = Array.isArray(adapter?.hosts) ? adapter.hosts.find(Boolean) : null; |
| hostnameOf | function | 132 | no | function hostnameOf(url) { |
| cooldownFor | function | 138 | no | function cooldownFor(cooldownMs, override) { |
| familyModule | variable | 145 | no | let familyModule; |
| familyBuilder | function | 146 | no | async function familyBuilder() { |
| mod | const | 149 | no | const mod = await import(&#39;../families/build.mjs&#39;); |
| resultFor | function | 157 | no | function resultFor(id, patch = {}) { |
| deriveAndConsolidate | function | 165 | no | async function deriveAndConsolidate({ sessionId, adapter, targetUrl, paths, conversation = null }) { |
| out | const | 166 | no | const out = { derived: false, family: null, signature: null, |
| notes | const | 168 | no | const notes = []; |
| session | const | 172 | no | const session = Session.open(paths.sessions, sessionId); |
| profiles | const | 173 | no | const profiles = new ProfileStore(paths.profiles); |
| profile | variable | 174 | no | let profile; |
| session | const | 192 | no | const session = Session.open(paths.sessions, sessionId); |
| doc | const | 194 | no | const doc = await evaluateAcceptance({ session, conversation }); |
| stored | const | 197 | no | const stored = readAcceptance(session); // Verifies raw digest and G1–G7. |
| builder | const | 210 | no | const builder = await familyBuilder(); |
| host | const | 218 | no | const host = hostnameOf(targetUrl) \|\| (adapter?.hosts?.[0] ?? &#39;&#39;); |
| built | const | 219 | no | const built = builder.buildFamily({ sessionsDir: paths.sessions, host: host \|\| null, site: adapter?.id ?? null, profilesDir: paths.profiles, minSessions: 1, }); |
| written | const | 229 | no | const written = builder.writeFamily({ familiesDir: paths.families, built }); |
| runCampaign | function | 246 | yes | export async function runCampaign({ sites = [...siteOrder], prompt = defaultPrompt, port = 9222, dataDir, execute = false, cooldownMs, perSiteTimeoutMs, limit, onEvent, resume = true, drive = driveSi… |
| startedAt | const | 251 | no | const startedAt = nowIso(); |
| root | const | 252 | no | const root = path.resolve(dataDir ? String(dataDir) : defaultDataDir()); |
| paths | const | 253 | no | const paths = dataPaths(root); |
| emit | function | 254 | no | const emit = (ev) =&gt; { try { onEvent?.({ at: nowIso(), ...ev }); } catch { /* a listener must never break the campaign */ } }; |
| wanted | const | 256 | no | const wanted = normalizeSites(sites); |
| cap | const | 257 | no | const cap = Number.isFinite(Number(limit)) &amp;&amp; Number(limit) &gt; 0 ? Math.floor(Number(limit)) : null; |
| timeoutMs | const | 258 | no | const timeoutMs = Number.isFinite(Number(perSiteTimeoutMs)) &amp;&amp; Number(perSiteTimeoutMs) &gt; 0 ? Math.floor(Number(perSiteTimeoutMs)) : undefined; |
| state | const | 260 | no | const state = resume ? readState(root) : { version: 1, updatedAt: null, sites: {} }; |
| results | const | 261 | no | const results = []; |
| totals | const | 262 | no | const totals = { requested: wanted.length, processed: 0, ok: 0, unverified: 0, planned: 0, blocked: 0, failed: 0, skipped: 0, envFailure: false }; |
| id | const | 267 | no | const id = wanted[index]; |
| siteStarted | const | 270 | no | const siteStarted = Date.now(); |
| done | const | 273 | no | const done = state.sites?.[id]; |
| adapter | variable | 288 | no | let adapter = null; |
| targetUrl | const | 302 | no | const targetUrl = targetUrlOf(adapter); |
| driven | variable | 317 | no | let driven; |
| siteResult | const | 330 | no | const siteResult = resultFor(id, { url: targetUrl, sessionId: driven?.sessionId ?? null, reply: String(driven?.reply ?? &#39;&#39;), ms: Date.now() - siteStarted, }); |
| why | const | 356 | no | const why = String(driven?.reason ?? &#39;drive failed&#39;); |
| first | const | 357 | no | const first = driven?.errors?.find?.((e) =&gt; String(e) !== why); |
| expect | const | 363 | no | const expect = expectedAnswer(prompt); |
| conversation | const | 366 | no | const conversation = match?.ok &amp;&amp; driven.done === true |
| built | const | 373 | no | const built = await deriveAndConsolidate({ sessionId: siteResult.sessionId, adapter, targetUrl: driven?.target?.url ?? targetUrl, paths, conversation, }); |
| notes | const | 381 | no | const notes = [`reply settled (${String(siteResult.reply ?? &#39;&#39;).trim().length} chars)`]; |
| waitMs | const | 398 | no | const waitMs = cooldownFor(cooldownMs); |
| moreToDo | const | 430 | no | const moreToDo = results.length &amp;&amp; wanted.slice(index + 1).some((rest) =&gt; { const d = state.sites?.[rest]; return !(resume &amp;&amp; d?.status === &#39;ok&#39; &amp;&amp; d?.sessionId); }); |
| d | const | 431 | no | const d = state.sites?.[rest]; |
| waitMs | const | 435 | no | const waitMs = cooldownFor(cooldownMs); |
| finishedAt | const | 443 | no | const finishedAt = nowIso(); |
| ok | const | 446 | no | const ok = !totals.envFailure &amp;&amp; totals.blocked === 0 &amp;&amp; totals.failed === 0; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 13 | external |
| node:path | import | 14 | external |
| ../config.mjs | import | 15 | [studio/src/config.mjs](../config.mjs.md) |
| ../profiles/sites/index.mjs | import | 16 | [studio/src/profiles/sites/index.mjs](../profiles/sites/index.mjs.md) |
| ../store/session.mjs | import | 17 | [studio/src/store/session.mjs](../store/session.mjs.md) |
| ../profiles/profiles.mjs | import | 18 | [studio/src/profiles/profiles.mjs](../profiles/profiles.mjs.md) |
| ../families/families.mjs | import | 19 | [studio/src/families/families.mjs](../families/families.mjs.md) |
| ../intel/learn.mjs | import | 20 | [studio/src/intel/learn.mjs](../intel/learn.mjs.md) |
| ../replay/derive.mjs | import | 21 | [studio/src/replay/derive.mjs](../replay/derive.mjs.md) |
| ./acceptance.mjs | import | 22 | [studio/src/capture/acceptance.mjs](./acceptance.mjs.md) |
| ./actions.mjs | import | 23 | [studio/src/capture/actions.mjs](./actions.mjs.md) |
| ../families/build.mjs | dynamic | 149 | [studio/src/families/build.mjs](../families/build.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/campaign.mjs](../../bin/commands/campaign.mjs.md) | ../../src/capture/campaign.mjs |
| [studio/bin/commands/drive.mjs](../../bin/commands/drive.mjs.md) | ../../src/capture/campaign.mjs |
| [studio/src/studio/drive-api.mjs](../studio/drive-api.mjs.md) | ../capture/campaign.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Sequential multi-site campaign: walk the known AI chat sites in order, interact with each like a
// person, record the exchange, derive knowledge and consolidate the site family.
//
// Design:
//   - ONE browser, ONE site at a time. There is no concurrency anywhere in this file.
//   - Every interaction is delegated: driveSite (src/capture/actions.mjs) owns typing, sending,
//     waiting and the login-wall check; derive (src/replay/derive.mjs) owns reconstruction;
//     src/families/build.mjs owns consolidation. Nothing is reimplemented here.
//   - A bad site never aborts the campaign: problems are returned as `status` + `reason`.
//   - Default is plan-only (`execute === false`): adapters and target URLs are resolved, nothing
//     is opened, typed into or sent.
//   - Progress survives between runs through `<dataDir>/campaign-state.json` (resume).
import fs from 'node:fs';
import path from 'node:path';
import { defaultDataDir, dataPaths } from '../config.mjs';
import { ADAPTER_IDS, getAdapter } from '../profiles/sites/index.mjs';
import { Session } from '../store/session.mjs';
import { ProfileStore } from '../profiles/profiles.mjs';
import { FamilyStore } from '../families/families.mjs';
import { ScopedLearner } from '../intel/learn.mjs';
import { derive } from '../replay/derive.mjs';
import { evaluateAcceptance, writeAcceptance, readAcceptance } from './acceptance.mjs';
import { driveSite } from './actions.mjs';

// The fixed calibration prompt: 12 words, deterministic, so a captured reply can be checked
// word for word (same wording as `studio drive`).
export const defaultPrompt = 'Reply with exactly these 12 words separated by single spaces and nothing else: alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima';

// The answer the calibration prompt asks for. A reply is only accepted when it contains these
// words in order: without that check a static greeting, a sidebar menu or a redirect notice
// counts as a successful capture.
export const expectedWords = Object.freeze('alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima'.split(' '));

// Is there another site left to drive after the current one?
function moreToDoSoon(wanted, index, cap, totals, resume, state) {
  if (cap !== null && totals.processed >= cap) return false;
  return wanted.slice(index + 1).some((rest) => {
    const d = state.sites?.[rest];
    return !(resume && d?.status === 'ok' && d?.sessionId);
  });
}

// What a reply must contain to count as the calibration answer.
export function expectedAnswer(prompt = defaultPrompt) {
  const p = String(prompt ?? '');
  if (!p.includes('alpha bravo charlie')) return null;
  return expectedWords.join(' ');
}

// Does a reply contain the expected words, in order, ignoring punctuation and case?
export function replyMatchesExpectation(reply, expected) {
  const want = String(expected ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!want) return { ok: false, reason: 'no expectation given' };
  const got = String(reply ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = want.split(' ');
  let at = 0;
  const missing = [];
  for (const w of words) {
    const idx = got.indexOf(w, at);
    if (idx < 0) { missing.push(w); continue; }
    at = idx + w.length;
  }
  return missing.length === 0
    ? { ok: true, reason: `the reply contains all ${words.length} expected words in order` }
    : { ok: false, reason: `the reply is missing ${missing.length} of ${words.length} expected words (${missing.slice(0, 6).join(', ')})`, missing };
}

// Sites in campaign order. ADAPTER_IDS is the registry truth; keep the order explicit here.
export const siteOrder = Object.freeze(['chatgpt', 'claude', 'gemini', 'deepseek', 'zai', 'qwen', 'lmarena', 'minimax', 'kimi']);

const STATE_FILE = 'campaign-state.json';
const DEFAULT_COOLDOWN_MIN_MS = 45000;
const DEFAULT_COOLDOWN_MAX_MS = 90000;

const msg = (e) => String(e?.message ?? e ?? 'unknown error');
const nowIso = () => new Date().toISOString();
const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

// ---------------------------------------------------------------------------------------------
// Resume state: which sites already completed, and with which recording.
```

_First 80 of 451 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
