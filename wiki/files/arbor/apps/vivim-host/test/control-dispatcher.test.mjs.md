# File: apps/vivim-host/test/control-dispatcher.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/control-dispatcher.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 28107 B |
| Lines | 364 |
| Hash | c8e3a44ed01d |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DESKTOP | const | 13 | no | const DESKTOP = { channel: &#39;desktop-owner-token&#39;, actor: &#39;owner&#39; }; |
| PHONE | const | 14 | no | const PHONE = { channel: &#39;direct-phone&#39;, actor: &#39;owner@example.com&#39; }; |
| fixture | function | 16 | no | function fixture(t, { grant = &#39;full-bootstrap&#39;, clock = { t: Date.parse(&#39;2026-11-01T10:00:00Z&#39;) } } = {}) { |
| dataRoot | const | 17 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-control-dispatch-&#39;)); |
| runtime | const | 18 | no | const runtime = createBootstrapRuntime({ dataRoot, file: &#39;:memory:&#39;, now: () =&gt; new Date(clock.t).toISOString() }); |
| control | const | 20 | no | const control = createControlDispatcher({ dataRoot, runtime, now: () =&gt; clock.t }); |
| before | const | 27 | no | const before = runtime.projection().preset; |
| plan | const | 28 | no | const plan = control.plan({ text: &#39;set my theme to ember&#39; }, { source: &#39;mobile&#39; }); |
| receipt | const | 33 | no | const receipt = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: PHONE }); |
| undo | const | 41 | no | const undo = control.plan({ actionId: receipt.undo.actionId, args: receipt.undo.args }, { source: &#39;mobile&#39; }); |
| r | const | 48 | no | const r = control.plan({ text: &#39;show my theme&#39; }); |
| plan | const | 57 | no | const plan = control.plan({ text: &#39;set theme to dusk&#39; }); |
| first | const | 60 | no | const first = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP }); |
| revision | const | 61 | no | const revision = runtime.projection().revision; |
| again | const | 62 | no | const again = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP }); |
| before | const | 70 | no | const before = runtime.projection().preset; |
| plan | const | 71 | no | const plan = control.plan({ text: &#39;set theme to dusk&#39; }); |
| file | const | 72 | no | const file = path.join(dataRoot, &#39;control&#39;, &#39;plans&#39;, plan.planId + &#39;.plan.json&#39;); |
| stored | const | 73 | no | const stored = JSON.parse(readFileSync(file, &#39;utf8&#39;)); |
| before | const | 81 | no | const before = runtime.projection().preset; |
| plan | const | 82 | no | const plan = control.plan({ text: &#39;set theme to grove&#39; }); |
| clock | const | 90 | no | const clock = { t: Date.parse(&#39;2026-11-01T10:00:00Z&#39;) }; |
| theme | const | 92 | no | const theme = control.plan({ text: &#39;set theme to ink&#39; }); |
| privacy | const | 93 | no | const privacy = control.plan({ text: &#39;never mention my former employer&#39; }); |
| add | const | 105 | no | const add = control.plan({ text: &#39;Never mention my former employer&#39; }); |
| receipt | const | 106 | no | const receipt = control.execute({ planId: add.planId, planDigest: add.planDigest, approval: DESKTOP }); |
| listed | const | 109 | no | const listed = control.plan({ text: &#39;show my exclusions&#39; }).result.exclusions; |
| clear | const | 111 | no | const clear = control.plan({ text: `withdraw exclusion ${receipt.result.id}` }); |
| plan | const | 118 | no | const plan = control.plan({ text: &#39;set theme to dawn&#39; }); |
| r | const | 119 | no | const r = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP }); |
| before | const | 127 | no | const before = runtime.projection().preset; |
| teach | const | 128 | no | const teach = control.plan({ text: &#39;teach glow means theme&#39; }); |
| used | const | 132 | no | const used = control.plan({ text: &#39;glow dawn&#39; }); |
| reserved | const | 136 | no | const reserved = control.plan({ text: &#39;teach stop means theme&#39; }); |
| r | const | 137 | no | const r = control.execute({ planId: reserved.planId, planDigest: reserved.planDigest, approval: DESKTOP }); |
| forget | const | 140 | no | const forget = control.plan({ text: &#39;forget glow&#39; }); |
| dataRoot | const | 154 | no | const dataRoot = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-control-mismatch-&#39;)); |
| catalog | const | 156 | no | const catalog = loadControlCatalog(); |
| result | const | 165 | no | const result=control.plan({actionId:&#39;personalization.context.summary&#39;,args:{}},{source}); |
| plan | const | 177 | no | const plan=control.plan({actionId:&#39;personalization.preference.add&#39;, args:{value:&#39;Compact layouts with fewer animations&#39;}},{source:&#39;mobile&#39;}); |
| receipt | const | 181 | no | const receipt=control.execute({planId:plan.planId,planDigest:plan.planDigest,approval:PHONE}); |
| stored | const | 186 | no | const stored=runtime.status().preferences.find(p=&gt;p.id===receipt.result.id); |
| replay | const | 191 | no | const replay=control.execute({planId:plan.planId,planDigest:plan.planDigest,approval:PHONE}); |
| undo | const | 194 | no | const undo=control.plan({actionId:receipt.undo.actionId,args:receipt.undo.args}, {source:&#39;mobile&#39;}); |
| removed | const | 197 | no | const removed=control.execute({planId:undo.planId,planDigest:undo.planDigest,approval:PHONE}); |
| boundary | const | 210 | no | const boundary=runtime.setHardNo({trait:&#39;Never share secrets&#39;}); |
| saved | const | 217 | no | const saved=runtime.setOwnerPreference({value:&#39;No animations in technical views&#39;}); |
| read | const | 223 | no | const read=control.plan({actionId:&#39;personalization.preference.list&#39;,args:{}}, {source:&#39;mobile&#39;}); |
| plan | const | 238 | no | const plan = control.plan({ text: &#39;teach blitz means theme&#39; }); |
| receipt | const | 243 | no | const receipt = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP }); |
| visualInput | const | 249 | no | const visualInput=(surface=createSurface())=&gt;({visualProposal:{schema:&#39;vivim.ui-proposal/1&#39;,surfaceId:surface.surfaceId,baseRevision:surface.revision, operations:[{opId:&#39;change.color&#39;,type:&#39;set-theme… |
| visualDevice | const | 251 | no | const visualDevice={source:&#39;mobile&#39;,actor:&#39;phone-A&#39;,grantId:&#39;grant-A&#39;}; |
| visualApproval | const | 252 | no | const visualApproval={channel:&#39;direct-phone&#39;,actor:&#39;phone-A&#39;,grantId:&#39;grant-A&#39;}; |
| plan | const | 255 | no | const plan=control.plan(visualInput(),visualDevice); |
| execute | function | 258 | no | const execute=(approval=visualApproval,planDigest=plan.planDigest)=&gt;control.execute({planId:plan.planId,planDigest,approval}); |
| receipt | const | 263 | no | const receipt=execute();assert.equal(receipt.status,&#39;applied&#39;); |
| one | const | 272 | no | const one=control.plan(visualInput(),visualDevice),two=control.plan(visualInput(),visualDevice); |
| exec | function | 273 | no | const exec=plan=&gt;control.execute({planId:plan.planId,planDigest:plan.planDigest,approval:visualApproval}); |
| three | const | 276 | no | const three=control.plan(visualInput(runtime.uiRevision()),visualDevice); |
| plan | const | 284 | no | const plan=control.plan(visualInput(),visualDevice); |
| receipt | const | 285 | no | const receipt=control.execute({planId:plan.planId,planDigest:plan.planDigest,approval:visualApproval}); |
| effects | const | 287 | no | const effects=projectAppliedControlEffects(control); |
| item | const | 288 | no | const item=effects.items.find(x=&gt;x.planId===plan.planId); |
| rows | const | 293 | no | const rows=buildNativeKnowledge({changes:{items:[]},context:{}},effects); |
| invalid | const | 297 | no | const invalid=structuredClone(effects);invalid.items[0].visualLink.revision=9; |
| productJournal | const | 303 | no | const productJournal=createProductJournal({dataRoot,seedState:{chat:[]},seedWiki:{revision:0,pages:{main:{sections:{about:&#39;Test section&#39;}}}}}); |
| control | const | 304 | no | const control=createControlDispatcher({dataRoot,runtime,productJournal,nativeProgram:async({program})=&gt;{const p=JSON.parse(program);return {outcome:&#39;compiled&#39;,programId:p.id,programRevision:p.revisio… |
| owner | const | 305 | no | const owner={source:&#39;desktop&#39;,actor:&#39;desktop-owner&#39;},approval={channel:&#39;desktop-owner-token&#39;,actor:&#39;desktop-owner&#39;}; |
| command | const | 306 | no | const command=&#39;run wiki read sequence:\\nlist wiki pages\\nread wiki page main in section about&#39;; |
| draft | const | 307 | no | const draft=await control.plan({actionId:&#39;control.rule.remember&#39;,args:{phrase:&#39;morningbrief&#39;,command}},owner);assert.equal(draft.outcome,&#39;approval_required&#39;);assert.equal(control.ownerRules().entries… |
| saved | const | 308 | no | const saved=await control.execute({planId:draft.planId,planDigest:draft.planDigest,approval});assert.equal(saved.status,&#39;applied&#39;);const rule=control.ownerRules().entries[0];assert.equal(rule.readPro… |
| read | const | 309 | no | const read=await control.plan({text:&#39;morningbrief&#39;},owner);assert.equal(read.outcome,&#39;done&#39;);assert.equal(read.result.reusedRecipe,true);assert.equal(read.result.steps[1].result.content,&#39;Test section… |
| revoke | const | 311 | no | const revoke=await control.plan({actionId:&#39;control.rule.revoke&#39;,args:{rule_id:rule.id}},owner);assert.equal((await control.execute({planId:revoke.planId,planDigest:revoke.planDigest,approval})).statu… |
| productJournal | const | 316 | no | const productJournal=createProductJournal({dataRoot,seedState:{chat:[]},seedWiki:{revision:0,pages:{main:{sections:{About:&#39;Original&#39;}}}}}); |
| control | const | 317 | no | const control=createControlDispatcher({dataRoot,runtime,productJournal,nativeProgram:async({program})=&gt;{const p=JSON.parse(program);return {outcome:&#39;compiled&#39;,programId:p.id,programRevision:p.revisio… |
| owner | const | 318 | no | const owner={source:&#39;desktop&#39;,actor:&#39;desktop-owner&#39;},approval={channel:&#39;desktop-owner-token&#39;,actor:&#39;desktop-owner&#39;}; |
| commands | const | 319 | no | const commands=&#39;create wiki page research\\nedit wiki section research/About saying Project notes&#39;; |
| draft | const | 320 | no | const draft=await control.plan({text:&#39;run wiki change sequence:\\n&#39;+commands},owner);assert.equal(draft.outcome,&#39;approval_required&#39;);assert.equal((await productJournal.readPhoneWiki()).revision,0); |
| receipt | const | 322 | no | const receipt=await control.execute({planId:draft.planId,planDigest:draft.planDigest,approval});assert.equal(receipt.status,&#39;applied&#39;);assert.equal(receipt.result.entries.length,2); |
| inspection | const | 323 | no | const inspection=await control.inspectOwnerPlan(draft.planId);assert.equal(inspection.recovery.state,&#39;all-records-observed&#39;);assert.equal(inspection.recovery.retryAuthorized,false); |
| wiki | const | 324 | no | const wiki=await productJournal.readPhoneWiki();assert.equal(wiki.revision,2);assert.equal(wiki.pages.research.sections.About,&#39;Project notes&#39;);assert.equal((await productJournal.readRecords()).length… |
| stale | const | 326 | no | const stale=await control.plan({actionId:&#39;program.write_wiki&#39;,args:{commands:&#39;create wiki page second\\nedit wiki section second/About saying Again&#39;}},owner); |
| productJournal | const | 333 | no | const productJournal=createProductJournal({dataRoot,seedState:{chat:[]},seedWiki:{revision:0,pages:{main:{sections:{About:&#39;Original&#39;}}}}}); |
| control | const | 334 | no | const control=createControlDispatcher({dataRoot,runtime,productJournal,nativeProgram:async({program})=&gt;{const p=JSON.parse(program);return {outcome:&#39;compiled&#39;,programId:p.id,programRevision:p.revisio… |
| owner | const | 335 | no | const owner={source:&#39;desktop&#39;,actor:&#39;desktop-owner&#39;},approval={channel:&#39;desktop-owner-token&#39;,actor:&#39;desktop-owner&#39;}; |
| command | const | 336 | no | const command=&#39;parameterize page research:\\nrun wiki change sequence:\\ncreate wiki page research\\nedit wiki section research/About saying Project notes&#39;; |
| teach | const | 337 | no | const teach=await control.plan({actionId:&#39;control.rule.remember&#39;,args:{phrase:&#39;projectsetup&#39;,command}},owner);assert.equal(teach.outcome,&#39;approval_required&#39;); |
| draft | const | 340 | no | const draft=await control.plan({text:&#39;projectsetup alpha&#39;},owner);assert.equal(draft.outcome,&#39;approval_required&#39;);assert.equal((await productJournal.readPhoneWiki()).revision,0); |
| receipt | const | 341 | no | const receipt=await control.execute({planId:draft.planId,planDigest:draft.planDigest,approval});assert.equal(receipt.status,&#39;applied&#39;);assert.equal((await productJournal.readPhoneWiki()).pages.alpha.… |
| second | const | 342 | no | const second=await control.plan({text:&#39;projectsetup beta&#39;},owner);assert.equal(second.outcome,&#39;approval_required&#39;); |
| rule | const | 343 | no | const rule=control.ownerRules().entries[0];const revoke=await control.plan({actionId:&#39;control.rule.revoke&#39;,args:{rule_id:rule.id}},owner);await control.execute({planId:revoke.planId,planDigest:revoke… |
| productJournal | const | 349 | no | const productJournal=createProductJournal({dataRoot,seedState:{chat:[]},seedWiki:{revision:0,pages:{main:{sections:{About:&#39;Original&#39;}}}}}); |
| control | const | 350 | no | const control=createControlDispatcher({dataRoot,runtime,productJournal,nativeProgram:async({program})=&gt;{const p=JSON.parse(program);return {outcome:&#39;compiled&#39;,programId:p.id,programRevision:p.revisio… |
| owner | const | 351 | no | const owner={source:&#39;desktop&#39;,actor:&#39;desktop-owner&#39;},approval={channel:&#39;desktop-owner-token&#39;,actor:&#39;desktop-owner&#39;}; |
| command | const | 352 | no | const command=&#39;parameterize page research:\\nrun wiki change sequence:\\ncreate wiki page research\\nedit wiki section research/About saying Project notes&#39;; |
| list | const | 354 | no | const list=control.sharedPrograms({canExecute:true});assert.deepEqual(list.entries.map(e=&gt;e.phrase),[&#39;phoneproject&#39;]);assert.equal(Object.hasOwn(list.entries[0],&#39;commands&#39;),false);assert.equal(contro… |
| live | variable | 355 | no | let live=true;const authorizeProgram=()=&gt;{if(!live)throw Error(&#39;revoked grant&#39;);};const mobile={source:&#39;mobile&#39;,actor:&#39;phone-a&#39;,grantId:&#39;grant-a&#39;,authorizeProgram}; |
| draft | const | 356 | no | const draft=await control.plan({text:&#39;phoneproject alpha&#39;},mobile);assert.equal(draft.outcome,&#39;approval_required&#39;);assert.equal((await productJournal.readPhoneWiki()).revision,0); |
| body | const | 357 | no | const body={planId:draft.planId,planDigest:draft.planDigest,approval:{channel:&#39;direct-phone&#39;,actor:&#39;phone-a&#39;,grantId:&#39;grant-a&#39;}}; |
| receipt | const | 360 | no | const receipt=await control.execute(body,{authorizeProgram});assert.equal(receipt.status,&#39;applied&#39;);assert.equal((await productJournal.readPhoneWiki()).pages.alpha.sections.About,&#39;Project notes&#39;); |

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
| ../../mobile-relay/generative-ui/catalog.mjs | import | 9 | [apps/mobile-relay/generative-ui/catalog.mjs](../../mobile-relay/generative-ui/catalog.mjs.md) |
| ../chat/product-journal.mjs | import | 10 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |
| ../chat/rust-context.mjs | import | 11 | [apps/vivim-host/chat/rust-context.mjs](../chat/rust-context.mjs.md) |
| ../chat/product-journal.mjs | dynamic | 302 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |
| ../chat/product-journal.mjs | dynamic | 315 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |
| ../chat/product-journal.mjs | dynamic | 332 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |
| ../chat/product-journal.mjs | dynamic | 348 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, unlinkSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createControlDispatcher } from '../control/dispatcher.mjs';
import { loadControlCatalog } from '../control/intent-planner.mjs';
import {createSurface} from '../../mobile-relay/generative-ui/catalog.mjs';
import {projectAppliedControlEffects} from '../chat/product-journal.mjs';
import {buildNativeKnowledge} from '../chat/rust-context.mjs';

const DESKTOP = { channel: 'desktop-owner-token', actor: 'owner' };
const PHONE = { channel: 'direct-phone', actor: 'owner@example.com' };

function fixture(t, { grant = 'full-bootstrap', clock = { t: Date.parse('2026-11-01T10:00:00Z') } } = {}) {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-control-dispatch-'));
  const runtime = createBootstrapRuntime({ dataRoot, file: ':memory:', now: () => new Date(clock.t).toISOString() });
  if (grant) runtime.grantBootstrap({ scope: grant });
  const control = createControlDispatcher({ dataRoot, runtime, now: () => clock.t });
  t.after(() => { runtime.close(); rmSync(dataRoot, { recursive: true, force: true }); });
  return { dataRoot, runtime, control, clock };
}

test('text → plan → owner approval → Host executor → receipt, end to end for the theme', t => {
  const { control, runtime } = fixture(t);
  const before = runtime.projection().preset;
  const plan = control.plan({ text: 'set my theme to ember' }, { source: 'mobile' });
  assert.equal(plan.outcome, 'approval_required');
  assert.match(plan.planId, /^ctl-[a-f0-9]{16}$/);
  assert.equal(runtime.projection().preset, before, 'planning changes nothing');
  assert.equal(control.status(plan.planId).state, 'planned');
  const receipt = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: PHONE });
  assert.equal(receipt.status, 'applied');
  assert.equal(receipt.result.preset, 'ember');
  assert.equal(runtime.projection().preset, 'ember');
  assert.deepEqual(receipt.undo, { actionId: 'ui.theme.undo', args: {} });
  assert.equal(receipt.liveAcceptance, 'pending');
  assert.equal(control.status(plan.planId).state, 'applied');
  // Undo is its own approved plan through the same path.
  const undo = control.plan({ actionId: receipt.undo.actionId, args: receipt.undo.args }, { source: 'mobile' });
  assert.equal(control.execute({ planId: undo.planId, planDigest: undo.planDigest, approval: PHONE }).status, 'applied');
  assert.equal(runtime.projection().preset, before);
});

test('reads run immediately with no journal entry and no approval', t => {
  const { control } = fixture(t);
  const r = control.plan({ text: 'show my theme' });
  assert.equal(r.outcome, 'done');
  assert.equal(r.effect, 'read');
  assert.equal(control.recent().length, 0);
  assert.ok(control.plan({ text: 'help' }).result.actions.length >= 12);
});

test('an approval binds one exact digest; replay returns the receipt and never re-applies', t => {
  const { control, runtime } = fixture(t);
  const plan = control.plan({ text: 'set theme to dusk' });
  assert.throws(() => control.execute({ planId: plan.planId, planDigest: 'f'.repeat(64), approval: DESKTOP }), /CONTROL_PLAN_MISMATCH/);
  assert.throws(() => control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: { channel: 'model' } }), /CONTROL_APPROVAL_CHANNEL/);
  const first = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP });
  const revision = runtime.projection().revision;
  const again = control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP });
  assert.equal(again.replayed, true);
  assert.equal(again.planId, first.planId);
  assert.equal(runtime.projection().revision, revision, 'no second effect');
});

test('tampering with the stored plan is detected before any effect', t => {
  const { control, dataRoot, runtime } = fixture(t);
  const before = runtime.projection().preset;
  const plan = control.plan({ text: 'set theme to dusk' });
  const file = path.join(dataRoot, 'control', 'plans', plan.planId + '.plan.json');
  const stored = JSON.parse(readFileSync(file, 'utf8'));
  writeFileSync(file, JSON.stringify({ ...stored, args: { preset: 'ink' } }));
  assert.throws(() => control.execute({ planId: plan.planId, planDigest: plan.planDigest, approval: DESKTOP }), /CONTROL_PLAN_TAMPERED/);
  assert.equal(runtime.projection().preset, before);
});

test('a claimed plan without a receipt is uncertain and is never retried', t => {
  const { control, dataRoot, runtime } = fixture(t);
```

_First 80 of 365 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
