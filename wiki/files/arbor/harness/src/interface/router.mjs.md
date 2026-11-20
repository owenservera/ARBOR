# File: harness/src/interface/router.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/interface/router.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18901 B |
| Lines | 287 |
| Hash | 6d5c96164346 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TASK_CLASS_MAP | const | 16 | no | const TASK_CLASS_MAP = Object.freeze({ quick: &#39;general&#39;, implementation: &#39;coding&#39;, &#39;app-design&#39;: &#39;visual&#39;, writing: &#39;documents&#39;, |
| runtime | const | 26 | no | const runtime = fileURLToPath(new URL(&#39;../../../runtime/&#39;, import.meta.url)); |
| composerTextExpression | function | 28 | no | const composerTextExpression = selectors =&gt; `(() =&gt; { for (const s of ${JSON.stringify(selectors)}) { const e = document.querySelector(s); if (!e) continue; return String((e.tagName === &#39;TEXTAREA&#39; \|\|… |
| TYPED_STATES | const | 29 | no | const TYPED_STATES = new Set([&#39;sent&#39;, &#39;observed&#39;, &#39;uncertain&#39;]); |
| createRouter | function | 30 | yes | export async function createRouter({ dir = runtime, deps: injected = {}, approvals, pollMs = 200, standing, target = resolveTarget(), verifyTarget = verifyAttachTarget, observeTimeoutMs = 8000, draft… |
| deps | const | 31 | no | const deps = await dependencies(injected); |
| journal | const | 32 | no | const journal = await deps.createJournal({ dir: resolve(dir, &#39;journal&#39;) }); |
| jobs | const | 35 | no | const jobs = new Map(); |
| registry | const | 36 | no | const registry = createModelRegistry({ file: resolve(dir, &#39;models.json&#39;) }); |
| prepareModel | const | 37 | no | const prepareModel = injected.prepareModel \|\| defaultPrepareModel; |
| prefs | const | 38 | no | const prefs = await createPrefs({ dir: resolve(dir, &#39;prefs&#39;) }); |
| decide | function | 39 | no | async function decide({ task, constraints = {}, selectModel = false } = {}) { |
| profiles | const | 40 | no | const profiles = await deps.listProviders(); const reg = await registry.load(); |
| records | const | 41 | no | const records = await journal.list(); |
| providers | const | 42 | no | const providers = await brain.learnInput({ records, registry: reg, profiles }); |
| taskClass | const | 43 | no | const taskClass = brain.classifyTask({ task, role: null, constraints }); |
| intelligentTaskClass | const | 44 | no | const intelligentTaskClass = TASK_CLASS_MAP[taskClass] ?? &#39;general&#39;; |
| intent | const | 45 | no | const intent = classifyIntent({ task, role: null, constraints }); |
| d | const | 49 | no | const d = brain.route({ task, constraints: { ...constraints, maxSends: 1 }, providers, profiles, registry: reg }); |
| manifest | const | 65 | no | const manifest = { |
| st | const | 69 | no | const st = records.find(r =&gt; r.provider === p.site); |
| regEntry | const | 70 | no | const regEntry = reg[p.site] \|\| {}; |
| signedIn | const | 71 | no | const signedIn = p.signedIn !== false; |
| intelligentRouter | const | 91 | no | const intelligentRouter = createIntelligentModelRouter({ ownerRules, learned, now: Date.now, maxAgeMs: 60000 }); |
| intelligent | const | 92 | no | const intelligent = intelligentRouter.route({ taskClass: intelligentTaskClass, manifest, constraints: { ...constraints, maxSends: 1 } }); |
| siteModel | const | 100 | no | const siteModel = { id: model, label: model }; |
| d | const | 125 | no | const d = brain.route({ task, constraints: { ...constraints, maxSends: 1 }, providers, profiles, registry: reg }); |
| openOwned | function | 139 | no | async function openOwned(browser, provider) { |
| page | const | 140 | no | const page = await browser.openPage(provider.url); |
| clearStaleHarnessDraft | function | 146 | no | async function clearStaleHarnessDraft(page, provider) { |
| selectors | const | 147 | no | const selectors = provider.composer?.selectors; |
| draft | variable | 150 | no | let draft = &#39;&#39;; |
| advance | function | 161 | no | async function advance(job) { |
| receipt | const | 165 | no | const receipt = await journal.read(job.requestId); |
| approval | const | 167 | no | const approval = await approvals.consume(job); |
| browser | const | 171 | no | const browser = await deps.connect({ host: target.host, port: target.port }); |
| page | variable | 172 | no | let page; |
| targets | const | 175 | no | const targets = await browser.targets(); |
| matches | const | 176 | no | const matches = targets.filter(t =&gt; t.type === &#39;page&#39; &amp;&amp; t.url === job.threadUrl); |
| mp | const | 182 | no | const mp = await prepareModel({ page, profile: job.provider, wanted: job.model, ...(job.effort ? { effort: job.effort } : {}) }); |
| claimed | variable | 188 | no | let claimed = false; |
| sendJournal | const | 189 | no | const sendJournal = { ...journal, async create(rec) { |
| existing | const | 190 | no | const existing = await journal.read(rec.requestId); |
| sendApproval | const | 194 | no | const sendApproval = { ...approval, threadUrl: job.threadUrl === &#39;new&#39; ? null : job.threadUrl }; |
| result | const | 195 | no | const result = await deps.sendOnce({ page, provider: job.provider, journal: sendJournal, requestId: job.requestId, threadUrl: job.threadUrl, prompt: job.prompt, approval: sendApproval, observeTimeout… |
| reply | const | 200 | no | const reply = await deps.readReply({ page, provider: job.provider, journal, requestId: job.requestId, timeoutMs: job.replyTimeoutMs ?? 90000 }); |
| receipt | const | 204 | no | const receipt = await journal.read(job.requestId).catch(() =&gt; null); |
| result | function | 208 | no | async function result(id) { |
| job | const | 209 | no | const job = jobs.get(id); |
| rec | const | 211 | no | const rec = await journal.read(id); return rec ? { requestId: id, provider: rec.provider, model: rec.model ?? null, status: rec.submitted === &#39;unknown&#39; ? &#39;uncertain&#39; : rec.state === &#39;accepted&#39; ? &#39;pen… |
| browserFor | function | 213 | no | async function browserFor() { verifyTarget(target); return deps.connect({ host: target.host, port: target.port }); } |
| routing | variable | 218 | no | let routing = null; |
| executionInfo | variable | 219 | no | let executionInfo = null; |
| d | const | 222 | no | const d = await decide({ task: prompt, constraints, selectModel: constraints.selectModel }); |
| provider | const | 232 | no | const provider = await deps.getProvider(providerId); if (!provider) throw new Error(&#39;Unknown provider&#39;); |
| payloadDigest | const | 233 | no | const payloadDigest = await deps.digestPayload(prompt); |
| threadKey | const | 234 | no | const threadKey = await deps.threadKeyFor(provider, threadUrl); |
| created | const | 235 | no | const created = await journal.create({ requestId, provider: provider.id, threadKey, payloadDigest, requestedModel: model, routing }); |
| s | const | 238 | no | const s = target.mode === &#39;attach&#39; ? { ok: false, reason: &#39;ATTACH_REQUIRES_PER_REQUEST_APPROVAL&#39; } : await standing.check({ provider: provider.id, threadUrl, prompt }); |
| job | const | 243 | no | const job = { requestId, provider, threadUrl, payloadDigest, prompt, model, ...(effort ? { effort } : {}), routing, status: &#39;pending_approval&#39;, ...(replyTimeoutMs ? { replyTimeoutMs } : {}) }; |
| profiles | const | 252 | no | const profiles = (await deps.listProviders()).filter(p =&gt; !only \|\| p.id === only); |
| browser | const | 254 | no | const browser = await browserFor(); |
| targets | const | 255 | no | const targets = await browser.targets(); |
| tab | const | 259 | no | const tab = targets.find(t =&gt; t.type === &#39;page&#39; &amp;&amp; p.hosts.includes(new URL(t.url).hostname)); |
| page | const | 260 | no | const page = tab ? await browser.attach(tab.id) : await openOwned(browser, p); |
| mp | const | 261 | no | const mp = await prepareModel({ page, profile: p }); |
| reg | const | 266 | no | const reg = await registry.load(); |
| browser | const | 271 | no | const browser = await browserFor(); |
| live | const | 272 | no | const live = await browser.targets(); |
| ids | const | 273 | no | const ids = new Set(live.map(t =&gt; t?.id)); |
| all | const | 274 | no | const all = await tabRegistry.owned(); |
| stale | const | 275 | no | const stale = all.filter(t =&gt; !ids.has(t.id)); |
| browser | const | 282 | no | const browser = await browserFor(); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 1 | external |
| node:path | import | 2 | external |
| node:url | import | 3 | external |
| ./deps.mjs | import | 4 | [harness/src/interface/deps.mjs](./deps.mjs.md) |
| ./approval.mjs | import | 5 | [harness/src/interface/approval.mjs](./approval.mjs.md) |
| ./standing.mjs | import | 6 | [harness/src/interface/standing.mjs](./standing.mjs.md) |
| ./dev-auto-approve.mjs | import | 7 | [harness/src/interface/dev-auto-approve.mjs](./dev-auto-approve.mjs.md) |
| ./target.mjs | import | 8 | [harness/src/interface/target.mjs](./target.mjs.md) |
| ../core/models.mjs | import | 9 | [harness/src/core/models.mjs](../core/models.mjs.md) |
| ../core/tabs.mjs | import | 10 | [harness/src/core/tabs.mjs](../core/tabs.mjs.md) |
| ../core/reply.mjs | import | 11 | [harness/src/core/reply.mjs](../core/reply.mjs.md) |
| ./brain.mjs | import | 12 | [harness/src/interface/brain.mjs](./brain.mjs.md) |
| ./intelligent-model-router.mjs | import | 13 | [harness/src/interface/intelligent-model-router.mjs](./intelligent-model-router.mjs.md) |
| ./prefs.mjs | import | 14 | [harness/src/interface/prefs.mjs](./prefs.mjs.md) |
| ./intent.mjs | import | 15 | [harness/src/interface/intent.mjs](./intent.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/wh-mcp.mjs](../../bin/wh-mcp.mjs.md) | ../src/interface/router.mjs |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/interface/router.mjs |
| [harness/scripts/live-smoke.mjs](../../scripts/live-smoke.mjs.md) | ../src/interface/router.mjs |
| [harness/test/interface/attach-target.test.mjs](../../test/interface/attach-target.test.mjs.md) | ../../src/interface/router.mjs |
| [harness/test/interface/dev-auto-approve.test.mjs](../../test/interface/dev-auto-approve.test.mjs.md) | ../../src/interface/router.mjs |
| [harness/test/interface/interface.test.mjs](../../test/interface/interface.test.mjs.md) | ../../src/interface/router.mjs |
| [harness/test/interface/models-router.test.mjs](../../test/interface/models-router.test.mjs.md) | ../../src/interface/router.mjs |
| [harness/test/interface/standing.test.mjs](../../test/interface/standing.test.mjs.md) | ../../src/interface/router.mjs |
| [harness/test/interface/tabs-router.test.mjs](../../test/interface/tabs-router.test.mjs.md) | ../../src/interface/router.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dependencies } from './deps.mjs';
import { createApprovals } from './approval.mjs';
import { createStanding } from './standing.mjs';
import { devAutoApprove } from './dev-auto-approve.mjs';
import { resolveTarget, verifyAttachTarget } from './target.mjs';
import { parseModelSpec, prepareModel as defaultPrepareModel, createModelRegistry } from '../core/models.mjs';
import { createTabRegistry, clearComposerExpression, typedKeyFor } from '../core/tabs.mjs';
import { hasReplyText } from '../core/reply.mjs';
import * as brain from './brain.mjs';
import { createIntelligentModelRouter } from './intelligent-model-router.mjs';
import { createPrefs } from './prefs.mjs';
import { classifyIntent } from './intent.mjs';
const TASK_CLASS_MAP = Object.freeze({
  quick: 'general',
  implementation: 'coding',
  'app-design': 'visual',
  writing: 'documents',
  review: 'reasoning',
  decision: 'reasoning',
  research: 'research'
});

const runtime = fileURLToPath(new URL('../../../runtime/', import.meta.url));
// Read-only snapshot of the first matching composer's text (same matching order as clearComposerExpression).
const composerTextExpression = selectors => `(() => { for (const s of ${JSON.stringify(selectors)}) { const e = document.querySelector(s); if (!e) continue; return String((e.tagName === 'TEXTAREA' || e.tagName === 'INPUT') ? (e.value || '') : (e.innerText || e.textContent || '')); } return ''; })()`;
const TYPED_STATES = new Set(['sent', 'observed', 'uncertain']);
export async function createRouter({ dir = runtime, deps: injected = {}, approvals, pollMs = 200, standing, target = resolveTarget(), verifyTarget = verifyAttachTarget, observeTimeoutMs = 8000, draftPolls = 16, draftPollMs = 250, tabs: tabRegistry = createTabRegistry({ file: resolve(dir, 'tabs.json') }), env = process.env } = {}) {
  const deps = await dependencies(injected);
  const journal = await deps.createJournal({ dir: resolve(dir, 'journal') });
  approvals ||= createApprovals({ dir: resolve(dir, 'approvals') });
  standing ||= createStanding({ dir: resolve(dir, 'approvals') });
  const jobs = new Map();
  const registry = createModelRegistry({ file: resolve(dir, 'models.json') });
  const prepareModel = injected.prepareModel || defaultPrepareModel;
  const prefs = await createPrefs({ dir: resolve(dir, 'prefs') });
  async function decide({ task, constraints = {}, selectModel = false } = {}) {
    const profiles = await deps.listProviders(); const reg = await registry.load();
    const records = await journal.list();
    const providers = await brain.learnInput({ records, registry: reg, profiles });
    const taskClass = brain.classifyTask({ task, role: null, constraints });
    const intelligentTaskClass = TASK_CLASS_MAP[taskClass] ?? 'general';
    const intent = classifyIntent({ task, role: null, constraints });

    // Explicit tier-based model selection: use the studio policy router directly.
    if (selectModel) {
      const d = brain.route({ task, constraints: { ...constraints, maxSends: 1 }, providers, profiles, registry: reg });
      return {
        ...d,
        site: d.site,
        taskClass,
        model: d.model ? { id: d.model.id, label: d.model.id } : null,
        effort: d.model?.effort ?? null,
        routing: d.routing ? { ...d.routing, source: 'studio-policy' } : { pattern: d.pattern, site: d.site, taskClass, source: 'studio-policy' },
        executionTarget: intent.executionTarget,
        intentType: intent.intentType,
        domain: intent.domain,
        intentConfidence: intent.confidence
      };
    }

    // Readiness manifest for the intelligent router: verified providers + discovered models.
    const manifest = {
      schema: 'vivim.provider-readiness/1',
      observedAt: new Date().toISOString(),
      providers: providers.map(p => {
        const st = records.find(r => r.provider === p.site);
        const regEntry = reg[p.site] || {};
        const signedIn = p.signedIn !== false;
        return {
          provider: p.site,
          verified: signedIn,
          state: signedIn ? 'signed_in' : 'signed_out',
          observedAt: (st && st.updatedAt) || new Date().toISOString(),
          models: (regEntry.models || []).map(m => ({
            id: m.id,
            selectionVerified: true,
            efforts: (m.efforts || []).map(e => e.id),
```

_First 80 of 288 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
