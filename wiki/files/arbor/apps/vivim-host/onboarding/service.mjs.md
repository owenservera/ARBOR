# File: apps/vivim-host/onboarding/service.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/onboarding/service.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15127 B |
| Lines | 262 |
| Hash | 173a2704f100 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ONBOARDING_SCHEMA | const | 15 | yes | export const ONBOARDING_SCHEMA = &#39;vivim.onboarding/1&#39;; |
| PROVIDERS | const | 16 | yes | export const PROVIDERS = Object.freeze([ { id: &#39;chatgpt&#39;, label: &#39;ChatGPT&#39;, url: &#39;https://chatgpt.com/&#39;, personalizes: true }, { id: &#39;claude&#39;, label: &#39;Claude&#39;, url: &#39;https://claude.ai/&#39;, personalizes… |
| PASSES | const | 24 | no | const PASSES = Object.freeze([&#39;F02&#39;, &#39;F01&#39;]); |
| APPROVAL_TTL_MS | const | 25 | no | const APPROVAL_TTL_MS = 30 * 60 * 1000; |
| READY_TTL_MS | const | 26 | no | const READY_TTL_MS = 45 * 1000; |
| IN_FLIGHT | const | 27 | no | const IN_FLIGHT = new Set([&#39;dispatching&#39;, &#39;awaiting&#39;, &#39;uncertain&#39;, &#39;ingesting&#39;]); |
| sha | function | 28 | no | const sha = text =&gt; createHash(&#39;sha256&#39;).update(text, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| coded | function | 29 | no | const coded = (code, message) =&gt; Object.assign(new Error(message), { code }); |
| REASONS | const | 32 | no | const REASONS = Object.freeze({ SCHEDULER_PROVIDER_NOT_READY: &quot;ChatGPT isn&#39;t signed in in the VIVIM browser yet.&quot;, SCHEDULER_APPROVAL_REQUIRED: &#39;Your approval expired. Review and approve again.&#39;, SCH… |
| reasonText | function | 45 | no | const reasonText = code =&gt; (code ? (REASONS[code] ?? `Stopped (${code}).`) : null); |
| createOnboardingService | function | 47 | yes | export function createOnboardingService({ dataRoot, getRuntime, studio = null, directOrigin = null, apk = null, pairing = null, now = Date.now } = {}) { |
| dir | const | 50 | no | const dir = path.join(dataRoot, &#39;onboarding&#39;); |
| file | const | 51 | no | const file = path.join(dir, &#39;state.json&#39;); |
| iso | function | 52 | no | const iso = ms =&gt; new Date(ms).toISOString(); |
| probes | const | 53 | no | const probes = new Map(); |
| scheduler | variable | 54 | no | let scheduler = null, timer = null, pumping = false, lastPumpError = null; |
| load | function | 57 | no | function load() { |
| value | const | 59 | no | const value = JSON.parse(readFileSync(file, &#39;utf8&#39;)); |
| save | function | 64 | no | function save(state) { |
| temp | const | 66 | no | const temp = `${file}.${process.pid}.${randomBytes(4).toString(&#39;hex&#39;)}.tmp`; |
| reachable | function | 72 | no | const reachable = async () =&gt; (studio ? studio.reachable() : false); |
| remember | function | 73 | no | function remember(provider, result) { |
| providerOf | function | 78 | no | function providerOf(id) { |
| found | const | 79 | no | const found = PROVIDERS.find(p =&gt; p.id === id); |
| openSignIn | function | 83 | no | async function openSignIn(id) { |
| snapshot | const | 86 | no | const snapshot = await studio.create({ site: id }); |
| check | function | 89 | no | async function check(id) { |
| snapshot | variable | 92 | no | let snapshot; |
| result | variable | 95 | no | let result; |
| reason | const | 98 | no | const reason = String(snapshot?.readiness?.reason ?? &#39;UNKNOWN&#39;).replace(/[^A-Z0-9_]/gi, &#39;_&#39;).slice(0, 60); |
| state | const | 99 | no | const state = /AUTH\|SIGN\|LOGIN/i.test(reason) ? &#39;signed_out&#39; : /DRAFT\|GATE\|CAPTCHA\|LIMIT/i.test(reason) ? &#39;needs_attention&#39; : &#39;unknown&#39;; |
| readiness | function | 106 | no | async function readiness() { |
| cached | const | 107 | no | const cached = probes.get(&#39;chatgpt&#39;); |
| fresh | const | 108 | no | const fresh = cached &amp;&amp; cached.verified &amp;&amp; now() - Date.parse(cached.observedAt) &lt;= READY_TTL_MS; |
| approvalFor | function | 114 | no | function approvalFor({ requestId, generationId, pass, promptDigest }) { |
| generation | const | 115 | no | const generation = load().generation; |
| approval | const | 116 | no | const approval = generation?.approvals?.[requestId]; |
| ensureScheduler | function | 124 | no | function ensureScheduler() { |
| runtime | const | 126 | no | const runtime = getRuntime(); |
| tolerant | function | 129 | no | const tolerant = ingest =&gt; args =&gt; ingest({ ...args, response: extractJson(args.response) ?? args.response }); |
| adapter | const | 130 | no | const adapter = createStudioBootstrapOwnerAdapter({ conversation: { create: () =&gt; studio.create({ site: &#39;chatgpt&#39; }), submit: (id, body) =&gt; studio.submit(id, body), get: id =&gt; studio.get(id) }, store… |
| setPrimary | function | 147 | no | function setPrimary(id) { |
| state | const | 149 | no | const state = load(); |
| review | function | 154 | no | function review() { |
| generationId | const | 155 | no | const generationId = `onb-${now().toString(36)}-${randomBytes(4).toString(&#39;hex&#39;)}`; |
| state | const | 156 | no | const state = load(); |
| approveAndStart | function | 164 | no | function approveAndStart({ generationId } = {}) { |
| state | const | 165 | no | const state = load(); |
| runtime | const | 168 | no | const runtime = getRuntime(); |
| session | const | 170 | no | const session = ensureScheduler().startGeneration({ generationId, passes: [...PASSES] }); |
| expiresAt | const | 171 | no | const expiresAt = iso(now() + APPROVAL_TTL_MS); |
| pump | function | 182 | no | async function pump() { |
| snapshot | const | 187 | no | const snapshot = ensureScheduler().snapshot(); |
| start | function | 196 | no | function start({ intervalMs = 4000 } = {}) { |
| stop | function | 201 | no | const stop = () =&gt; { if (timer) clearInterval(timer); timer = null; }; |
| phoneSeen | function | 203 | no | function phoneSeen() { |
| state | const | 204 | no | const state = load(); |
| personalization | function | 211 | no | function personalization(state, projection) { |
| generation | const | 212 | no | const generation = state.generation; |
| session | variable | 213 | no | let session = null; |
| passes | const | 215 | no | const passes = (session?.passes ?? []).map(p =&gt; ({ pass: p.pass, title: PASS_TITLES[p.pass], status: p.status, reason: reasonText(p.reason), code: p.reason ?? null })); |
| phase | variable | 216 | no | let phase = &#39;idle&#39;; |
| cards | const | 226 | no | const cards = (projection?.cards ?? []).slice(0, 3).map(c =&gt; ({ id: c.id, title: c.title })); |
| status | function | 229 | no | async function status() { |
| state | const | 230 | no | const state = load(); |
| up | const | 231 | no | const up = await reachable(); |
| sites | variable | 232 | no | let sites = null; |
| projection | variable | 234 | no | let projection = null; |
| lastSeen | const | 236 | no | const lastSeen = state.phone.lastSeenAt; |
| current | const | 237 | no | const current = apk?.getCurrent?.() ?? null; |
| grants | const | 238 | no | const grants = createEnrollment({ dataRoot, origin: directOrigin, user: null }).listGrants(); |
| approved | const | 239 | no | const approved = grants.find(g =&gt; g.status === &#39;active&#39; &amp;&amp; !g.revokedAt); |
| enrolled | const | 240 | no | const enrolled = { paired: Boolean(approved), deviceId: approved?.deviceId ?? null }; |
| providerSnapshot | function | 257 | no | const providerSnapshot = () =&gt; PROVIDERS.map(p =&gt; ({ id:p.id,label:p.label,check:probes.get(p.id) ?? null })); |
| primary | function | 260 | no | const primary = () =&gt; load().primary; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 7 | external |
| node:fs | import | 8 | external |
| node:path | import | 9 | external |
| ../bootstrap/scheduler.mjs | import | 10 | [apps/vivim-host/bootstrap/scheduler.mjs](../bootstrap/scheduler.mjs.md) |
| ../apk/enrollment.mjs | import | 11 | [apps/vivim-host/apk/enrollment.mjs](../apk/enrollment.mjs.md) |
| ../../../studio/src/studio/bootstrap-owner-adapter.mjs | import | 12 | [studio/src/studio/bootstrap-owner-adapter.mjs](../../../studio/src/studio/bootstrap-owner-adapter.mjs.md) |
| ../../mobile-relay/bootstrap-prompts.mjs | import | 13 | [apps/mobile-relay/bootstrap-prompts.mjs](../../mobile-relay/bootstrap-prompts.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./onboarding/service.mjs |
| [apps/vivim-host/test/onboarding.test.mjs](../test/onboarding.test.mjs.md) | ../onboarding/service.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM guided onboarding: the one place that connects the existing, separately tested parts.
//   Studio (browser + send-once journal owner)  <-HTTP-  studio port
//   studio owner adapter (exact-once dispatch)  <-  this service  ->  Host bootstrap scheduler
//   Host bootstrap runtime (trusted ledger writer)  <-  scheduler ingestion
// Nothing here drives a browser, bypasses an approval, retries a send or writes personalization
// except through those parts. The owner's tap on "Approve and start" is the only authorization.
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createBootstrapScheduler } from '../bootstrap/scheduler.mjs';
import { createEnrollment } from '../apk/enrollment.mjs';
import { createBootstrapBindingStore, createStudioBootstrapOwnerAdapter } from '../../../studio/src/studio/bootstrap-owner-adapter.mjs';
import { promptForPass, extractJson, PASS_TITLES } from '../../mobile-relay/bootstrap-prompts.mjs';

export const ONBOARDING_SCHEMA = 'vivim.onboarding/1';
export const PROVIDERS = Object.freeze([
  { id: 'chatgpt', label: 'ChatGPT', url: 'https://chatgpt.com/', personalizes: true },
  { id: 'claude', label: 'Claude', url: 'https://claude.ai/', personalizes: false },
  { id: 'gemini', label: 'Gemini', url: 'https://gemini.google.com/', personalizes: false },
  { id: 'qwen', label: 'Qwen', url: 'https://chat.qwen.ai/', personalizes: false },
  { id: 'zai', label: 'Z.ai', url: 'https://chat.z.ai/', personalizes: false },
  { id: 'deepseek', label: 'DeepSeek', url: 'https://chat.deepseek.com/', personalizes: false }
]);
const PASSES = Object.freeze(['F02', 'F01']);
const APPROVAL_TTL_MS = 30 * 60 * 1000;
const READY_TTL_MS = 45 * 1000;
const IN_FLIGHT = new Set(['dispatching', 'awaiting', 'uncertain', 'ingesting']);
const sha = text => createHash('sha256').update(text, 'utf8').digest('hex');
const coded = (code, message) => Object.assign(new Error(message), { code });

// Plain-language reasons. The code stays available for support, never shown as the explanation.
const REASONS = Object.freeze({
  SCHEDULER_PROVIDER_NOT_READY: "ChatGPT isn't signed in in the VIVIM browser yet.",
  SCHEDULER_APPROVAL_REQUIRED: 'Your approval expired. Review and approve again.',
  SCHEDULER_GRANT_REQUIRED: 'Personalization has not been approved on this PC.',
  BOOTSTRAP_OWNER_UNVERIFIED: "VIVIM Studio isn't running, so nothing was sent.",
  DRAFT_PRESENT: 'ChatGPT has an unsent draft in its chat box. Clear it in the VIVIM browser, then try again.',
  AUTH_WALL: "ChatGPT asked for a sign-in. Sign in in the VIVIM browser, then try again.",
  HOST_INGEST_REVIEW_REQUIRED: "ChatGPT answered, but not in the expected format. Nothing was applied.",
  JOURNAL_RECONCILIATION_REQUIRED: "VIVIM can't tell whether this was sent, so it will not send it again. Check the ChatGPT tab.",
  DISPATCH_OUTCOME_UNKNOWN: "VIVIM can't tell whether this was sent, so it will not send it again. Check the ChatGPT tab.",
  JOURNAL_VERIFICATION_REQUIRED: "VIVIM can't tell whether this was sent, so it will not send it again. Check the ChatGPT tab.",
  INSPECTION_UNAVAILABLE: 'Studio could not be reached to confirm the result. VIVIM will keep checking and will not resend.'
});
const reasonText = code => (code ? (REASONS[code] ?? `Stopped (${code}).`) : null);

export function createOnboardingService({ dataRoot, getRuntime, studio = null, directOrigin = null, apk = null, pairing = null, now = Date.now } = {}) {
  if (typeof dataRoot !== 'string' || !path.isAbsolute(dataRoot)) throw new TypeError('Onboarding: absolute dataRoot required');
  if (typeof getRuntime !== 'function') throw new TypeError('Onboarding: getRuntime required');
  const dir = path.join(dataRoot, 'onboarding');
  const file = path.join(dir, 'state.json');
  const iso = ms => new Date(ms).toISOString();
  const probes = new Map();
  let scheduler = null, timer = null, pumping = false, lastPumpError = null;

  // ---- durable owner choices (never prompts, replies or credentials) ----
  function load() {
    try {
      const value = JSON.parse(readFileSync(file, 'utf8'));
      if (value?.schema === ONBOARDING_SCHEMA) return value;
    } catch { /* first run or unreadable: start clean */ }
    return { schema: ONBOARDING_SCHEMA, primary: null, pending: null, generation: null, phone: { lastSeenAt: null } };
  }
  function save(state) {
    mkdirSync(dir, { recursive: true });
    const temp = `${file}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
    writeFileSync(temp, JSON.stringify(state, null, 2));
    renameSync(temp, file);
  }

  // ---- Studio-backed sign-in checks (a fresh owned tab; never a send) ----
  const reachable = async () => (studio ? studio.reachable() : false);
  function remember(provider, result) {
    const record = { provider, observedAt: iso(now()), ...result };
    probes.set(provider, record);
    return record;
  }
  function providerOf(id) {
    const found = PROVIDERS.find(p => p.id === id);
    if (!found) throw coded('ONBOARDING_PROVIDER', 'Unknown AI service');
```

_First 80 of 263 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
