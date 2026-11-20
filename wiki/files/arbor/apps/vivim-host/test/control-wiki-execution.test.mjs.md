# File: apps/vivim-host/test/control-wiki-execution.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/control-wiki-execution.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 21138 B |
| Lines | 346 |
| Hash | 8a92fb4f70cd |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DESKTOP | const | 13 | no | const DESKTOP = { channel: &#39;desktop-owner-token&#39;, actor: &#39;owner&#39; }; |
| PHONE | const | 14 | no | const PHONE = { channel: &#39;direct-phone&#39;, actor: &#39;phone&#39; }; |
| seedState | const | 15 | no | const seedState = { chat: [], wikiRevision: 1, at: &#39;2026-11-14T00:00:00Z&#39; }; |
| seedWiki | const | 16 | no | const seedWiki = { revision: 1, pages: { Main: { sections: { HowTo: &#39;Seed description&#39; } } } }; |
| fixture | function | 18 | no | function fixture(t) { |
| dataRoot | const | 19 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;arbor-control-wiki-&#39;)); |
| runtime | const | 20 | no | const runtime = createBootstrapRuntime({ dataRoot, file: &#39;:memory:&#39; }); |
| productJournal | const | 22 | no | const productJournal = createProductJournal({ dataRoot, seedState, seedWiki }); |
| control | const | 23 | no | const control = createControlDispatcher({ dataRoot, runtime, productJournal }); |
| edit | function | 27 | no | const edit = content =&gt; ({ actionId: &#39;wiki.section.edit&#39;, args: { target: &#39;main/howto&#39;, content } }); |
| apply | function | 28 | no | const apply = (control, plan, approval = DESKTOP) =&gt; control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval }); |
| plan | const | 34 | no | const plan = await control.plan(edit(&#39;Updated instructions&#39;), { source: &#39;desktop&#39; }); |
| first | const | 40 | no | const first = await apply(control, plan); |
| reopened | const | 48 | no | const reopened = createProductJournal({ dataRoot, seedState, seedWiki }); |
| plan | const | 54 | no | const plan = await control.plan({ text: &#39;edit wiki section main/howto saying Updated from VIVIM&#39; }, { source: &#39;desktop&#39;, actor: &#39;desktop-owner&#39; }); |
| receipt | const | 63 | no | const receipt = await apply(control, plan); |
| reads | variable | 71 | no | let reads = 0; |
| observed | const | 72 | no | const observed = { |
| snapshot | const | 75 | no | const snapshot = await productJournal.readProjection(); |
| control | const | 84 | no | const control = createControlDispatcher({ dataRoot, runtime, productJournal: observed }); |
| plan | const | 85 | no | const plan = await control.plan(edit(&#39;Committed once&#39;), { source: &#39;desktop&#39; }); |
| receipt | const | 86 | no | const receipt = await apply(control, plan); |
| plan | const | 97 | no | const plan = await control.plan(edit(&#39;Stale proposed&#39;), { source: &#39;desktop&#39; }); |
| phoneActor | const | 108 | no | const phoneActor = &#39;approved-device-a&#39;; |
| plan | const | 109 | no | const plan = await control.plan(edit(&#39;Updated by approved phone&#39;), { source: &#39;mobile&#39;, actor: phoneActor }); |
| applied | const | 117 | no | const applied = await apply(control, plan, { channel: &#39;direct-phone&#39;, actor: phoneActor }); |
| desktop | const | 123 | no | const desktop = await control.plan(edit(&#39;Good&#39;), { source: &#39;desktop&#39; }); |
| plan | const | 140 | no | const plan = await control.plan(edit(&#39;Once&#39;), { source: &#39;desktop&#39; }); |
| dataRoot | const | 147 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;arbor-control-wiki-http-&#39;)); |
| secret | const | 148 | no | const secret = &#39;wiki-http-owner-secret-test-value&#39;; |
| server | const | 149 | no | const server = createHostServer({ dataRoot, ownerToken: secret }); |
| port | const | 155 | no | const port = server.address().port; |
| origin | const | 156 | no | const origin = &#39;http://127.0.0.1:&#39; + port; |
| authorized | const | 157 | no | const authorized = { authorization: &#39;Bearer &#39; + secret, origin, &#39;x-vivim-control&#39;: &#39;1&#39;, |
| call | function | 159 | no | const call = (route, { method = &#39;GET&#39;, body, headers = {} } = {}) =&gt; |
| req | const | 161 | no | const req = httpRequest({ hostname: &#39;127.0.0.1&#39;, port, path: route, method, headers }, res =&gt; { let data = &#39;&#39;; res.on(&#39;data&#39;, chunk =&gt; { data += chunk; }); res.on(&#39;end&#39;, () =&gt; { |
| data | variable | 163 | no | let data = &#39;&#39;; |
| before | const | 173 | no | const before = await call(&#39;/api/wiki&#39;); |
| planned | const | 184 | no | const planned = await call(&#39;/api/host/control/plan&#39;, { method: &#39;POST&#39;, headers: authorized, body: { text: &#39;edit wiki section main/about saying Updated from VIVIM&#39; } }); |
| executed | const | 196 | no | const executed = await call(&#39;/api/host/control/execute&#39;, { method: &#39;POST&#39;, headers: authorized, body: { planId: planned.data.planId, planDigest: planned.data.planDigest } }); |
| after | const | 204 | no | const after = await call(&#39;/api/wiki&#39;); |
| repeat | const | 207 | no | const repeat = await call(&#39;/api/host/control/execute&#39;, { method: &#39;POST&#39;, headers: authorized, body: { planId: planned.data.planId, planDigest: planned.data.planDigest } }); |
| reopened | const | 214 | no | const reopened = createProductJournal({ dataRoot }); |
| persisted | const | 215 | no | const persisted = await reopened.readProjection(); |
| plan | const | 222 | no | const plan=await control.plan(edit(content),{source:&#39;desktop&#39;}); |
| b | const | 223 | no | const b=plan.approvalMeaning; |
| round | const | 230 | no | const round=await control.plan({text:b.sentence},{source:&#39;desktop&#39;}); |
| secret | const | 234 | no | const secret=await control.plan(edit(&#39;password=example-test-only&#39;),{source:&#39;desktop&#39;}); |
| a | const | 237 | no | const a=await control.plan(edit(&#39;One&#39;),{source:&#39;desktop&#39;}); |
| b | const | 238 | no | const b=await control.plan(edit(&#39;Two&#39;),{source:&#39;desktop&#39;}); |
| file | const | 241 | no | const file=path.join(dataRoot,&#39;control&#39;,&#39;plans&#39;,a.planId+&#39;.plan.json&#39;); |
| receipt | const | 247 | no | const receipt=await apply(control,b); |
| create | const | 250 | no | const create=await control.plan({text:&#39;create wiki page project-notes&#39;},{source:&#39;desktop&#39;}); |
| link | const | 253 | no | const link=await control.plan({text:&#39;link wiki pages from main to project-notes&#39;},{source:&#39;desktop&#39;}); |
| plan | const | 262 | no | const plan=await control.plan(edit(&#39;Do not overwrite&#39;),{source:&#39;desktop&#39;}); |
| catalog | const | 263 | no | const catalog=loadControlCatalog(); |
| restarted | const | 265 | no | const restarted=createControlDispatcher({dataRoot,runtime,productJournal,catalog}); |
| clock | variable | 273 | no | let clock=Date.parse(&#39;2026-11-18T00:00:00Z&#39;),reads=0; |
| delayed | const | 274 | no | const delayed={readProjection:async()=&gt;{ |
| result | const | 275 | no | const result=await productJournal.readProjection(); |
| control | const | 279 | no | const control=createControlDispatcher({dataRoot,runtime,productJournal:delayed,now:()=&gt;clock,ttlMs:10000}); |
| expired | const | 280 | no | const expired=await control.plan(edit(&#39;Expired&#39;),{source:&#39;desktop&#39;}); |
| phone | const | 284 | no | const phone=await control.plan(edit(&#39;Applied by A&#39;),{source:&#39;mobile&#39;,actor:&#39;device-a&#39;}); |
| receipt | const | 285 | no | const receipt=await apply(control,phone,{channel:&#39;direct-phone&#39;,actor:&#39;device-a&#39;}); |
| owner | const | 294 | no | const owner={source:&#39;desktop&#39;,actor:&#39;desktop-owner&#39;}; |
| approval | const | 295 | no | const approval={channel:&#39;desktop-owner-token&#39;,actor:&#39;desktop-owner&#39;}; |
| alias | const | 296 | no | const alias=&#39;quazzlememo&#39;; |
| create | const | 297 | no | const create=await control.plan({text:&#39;create wiki page first-note&#39;},owner); |
| learn | function | 298 | no | const learn=()=&gt;control.plan({actionId:&#39;control.rule.remember&#39;,args:{phrase:alias,command:&#39;receipt:&#39;+create.planId}},owner); |
| receipt | const | 300 | no | const receipt=await apply(control,create,approval); |
| teaching | const | 303 | no | const teaching=learn(); |
| saved | const | 310 | no | const saved=await apply(control,teaching,approval); |
| reopened | const | 314 | no | const reopened=createControlDispatcher({dataRoot,runtime,productJournal}); |
| plan | const | 315 | no | const plan=await reopened.plan({text:alias+&#39; second-note&#39;},owner); |
| pending | const | 328 | no | const pending=await reopened.plan({text:alias+&#39; third-note&#39;},owner); |
| changedCatalog | const | 329 | no | const changedCatalog=loadControlCatalog(); |
| changed | const | 331 | no | const changed=createControlDispatcher({dataRoot,runtime,productJournal,catalog:changedCatalog}); |
| receiptPath | const | 334 | no | const receiptPath=path.join(dataRoot,&#39;control&#39;,&#39;plans&#39;,create.planId+&#39;.receipt.json&#39;); |
| raw | const | 335 | no | const raw=readFileSync(receiptPath,&#39;utf8&#39;); |
| tampered | const | 336 | no | const tampered=JSON.parse(raw);tampered.result.entryId=&#39;00000000-0000-4000-8000-000000000007&#39;; |
| revoke | const | 341 | no | const revoke=reopened.plan({actionId:&#39;control.rule.revoke&#39;,args:{rule_id:saved.result.ruleId}},owner); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../bootstrap/runtime.mjs | import | 6 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../control/dispatcher.mjs | import | 7 | [apps/vivim-host/control/dispatcher.mjs](../control/dispatcher.mjs.md) |
| ../control/intent-planner.mjs | import | 8 | [apps/vivim-host/control/intent-planner.mjs](../control/intent-planner.mjs.md) |
| ../chat/product-journal.mjs | import | 9 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |
| ../server.mjs | import | 10 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| node:http | import | 11 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createControlDispatcher } from '../control/dispatcher.mjs';
import { loadControlCatalog } from '../control/intent-planner.mjs';
import { createProductJournal } from '../chat/product-journal.mjs';
import { createHostServer } from '../server.mjs';
import { request as httpRequest } from 'node:http';

const DESKTOP = { channel: 'desktop-owner-token', actor: 'owner' };
const PHONE = { channel: 'direct-phone', actor: 'phone' };
const seedState = { chat: [], wikiRevision: 1, at: '2026-11-14T00:00:00Z' };
const seedWiki = { revision: 1, pages: { Main: { sections: { HowTo: 'Seed description' } } } };

function fixture(t) {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'arbor-control-wiki-'));
  const runtime = createBootstrapRuntime({ dataRoot, file: ':memory:' });
  runtime.grantBootstrap({ scope: 'full-bootstrap' });
  const productJournal = createProductJournal({ dataRoot, seedState, seedWiki });
  const control = createControlDispatcher({ dataRoot, runtime, productJournal });
  t.after(() => { runtime.close(); rmSync(dataRoot, { recursive: true, force: true }); });
  return { dataRoot, control, productJournal, runtime };
}
const edit = content => ({ actionId: 'wiki.section.edit', args: { target: 'main/howto', content } });
const apply = (control, plan, approval = DESKTOP) => control.execute({
  planId: plan.planId, planDigest: plan.planDigest, approval
});

test('Wiki previews exact persisted section then appends once and survives reopened projection', async t => {
  const { dataRoot, control, productJournal } = fixture(t);
  const plan = await control.plan(edit('Updated instructions'), { source: 'desktop' });
  assert.equal(plan.outcome, 'approval_required');
  assert.deepEqual(plan.approval.channels, ['desktop-owner-token']);
  assert.deepEqual(plan.preview, { target: 'Main/HowTo', before: 'Seed description',
    after: 'Updated instructions', expectedRevision: 1 });
  assert.equal((await productJournal.readProjection()).wiki.pages.Main.sections.HowTo, 'Seed description');
  const first = await apply(control, plan);
  assert.equal(first.status, 'applied');
  assert.equal(first.result.wikiRevision, 2);
  assert.match(first.result.entryId, /^[0-9a-f-]{36}$/);
  assert.equal((await productJournal.readProjection()).wiki.pages.Main.sections.HowTo, 'Updated instructions');
  assert.equal((await apply(control, plan)).replayed, true);
  assert.equal((await productJournal.readRecords()).length, 1);
  assert.match(readFileSync(path.join(dataRoot, 'product-state', 'journal.jsonl'), 'utf8'), /Updated instructions/);
  const reopened = createProductJournal({ dataRoot, seedState, seedWiki });
  assert.equal((await reopened.readProjection()).wiki.pages.Main.sections.HowTo, 'Updated instructions');
});

test('natural-language Wiki edit is resolved to a typed, revision-bound Host plan', async t => {
  const { control, productJournal } = fixture(t);
  const plan = await control.plan({ text: 'edit wiki section main/howto saying Updated from VIVIM' },
    { source: 'desktop', actor: 'desktop-owner' });
  assert.equal(plan.outcome, 'approval_required');
  assert.equal(plan.actionId, 'wiki.section.edit');
  assert.equal(plan.args.target.toLowerCase(), 'main/howto');
  assert.equal(plan.args.content, 'Updated from VIVIM');
  assert.deepEqual(plan.preview, { target: 'Main/HowTo', before: 'Seed description',
    after: 'Updated from VIVIM', expectedRevision: 1 });
  assert.equal((await productJournal.readRecords()).length, 0);
  const receipt = await apply(control, plan);
  assert.equal(receipt.status, 'applied');
  assert.equal(receipt.result.content, 'Updated from VIVIM');
  assert.equal((await productJournal.readProjection()).wiki.pages.Main.sections.HowTo, 'Updated from VIVIM');
});

test('post-append Wiki readback mismatch is uncertain and never re-appends', async t => {
  const { dataRoot, runtime, productJournal } = fixture(t);
  let reads = 0;
  const observed = {
    append: entry => productJournal.append(entry),
    readProjection: async () => {
      const snapshot = await productJournal.readProjection();
      // The first read binds the plan, the second checks its preconditions.
      // Simulate an inconsistent third read, AFTER the durable Host append.
      if (++reads >= 3) return {
        ...snapshot, wiki: { ...snapshot.wiki, revision: snapshot.wiki.revision + 1 }
      };
```

_First 80 of 347 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
