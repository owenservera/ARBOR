# File: apps/vivim-host/control/dispatcher.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/dispatcher.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 66587 B |
| Lines | 895 |
| Hash | dc126412c0fe |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DISPATCHER_SCHEMA | const | 24 | yes | export const DISPATCHER_SCHEMA = &#39;vivim.control-dispatcher/1&#39;; |
| RECEIPT_SCHEMA | const | 25 | yes | export const RECEIPT_SCHEMA = &#39;vivim.control-receipt/1&#39;; |
| APPROVAL_CHANNELS | const | 26 | yes | export const APPROVAL_CHANNELS = Object.freeze([&#39;desktop-owner-token&#39;, &#39;direct-phone&#39;]); |
| fail | function | 27 | no | const fail = (code, extra = {}) =&gt; Object.assign(new Error(code), { code, ...extra }); |
| stable | function | 28 | no | const stable = v =&gt; Array.isArray(v) ? v.map(stable) : v &amp;&amp; typeof v === &#39;object&#39; |
| digest | function | 30 | no | const digest = o =&gt; createHash(&#39;sha256&#39;).update(JSON.stringify(stable(o))).digest(&#39;hex&#39;); |
| short | function | 31 | no | const short = (s, n) =&gt; String(s ?? &#39;&#39;).slice(0, n); |
| RULE_ACTIONS | const | 32 | no | const RULE_ACTIONS = new Set([&#39;control.rule.remember&#39;,&#39;control.rule.revoke&#39;]); |
| rawDigest | function | 33 | no | const rawDigest = value =&gt; createHash(&#39;sha256&#39;).update(JSON.stringify(value)).digest(&#39;hex&#39;); |
| phraseKey | function | 34 | no | const phraseKey = value =&gt; value.normalize(&#39;NFKC&#39;).trim().replace(/\\s+/g,&#39; &#39;).toLowerCase(); |
| LEARNABLE | const | 37 | no | const LEARNABLE = new Set([&#39;wiki.pages.list&#39;,&#39;wiki.section.read&#39;,&#39;wiki.page.create&#39;, &#39;wiki.section.edit&#39;,&#39;wiki.page.move&#39;,&#39;wiki.pages.link&#39;,&#39;ui.theme.show&#39;,&#39;ui.theme.set_preset&#39;, &#39;vivim.status.show&#39;]… |
| WIKI_ACTION | const | 40 | no | const WIKI_ACTION = &#39;wiki.section.edit&#39;; |
| CAPTURE_ACTION | const | 41 | no | const CAPTURE_ACTION=&#39;wiki.capture.save&#39;; |
| NATIVE_PROGRAM_ACTION | const | 42 | no | const NATIVE_PROGRAM_ACTION=&#39;program.validate&#39;; |
| WIKI_READ_PROGRAM_ACTION | const | 43 | no | const WIKI_READ_PROGRAM_ACTION=&#39;program.read_wiki&#39;; |
| WIKI_WRITE_PROGRAM_ACTION | const | 44 | no | const WIKI_WRITE_PROGRAM_ACTION=&#39;program.write_wiki&#39;; |
| HVI_ACTION | const | 45 | no | const HVI_ACTION=&#39;versions.compare.pinned&#39;; |
| VISUAL_ACTION | const | 49 | no | const VISUAL_ACTION=&#39;ui.visual.apply&#39;; |
| VISUAL_CONTRACT | const | 50 | no | const VISUAL_CONTRACT=Object.freeze({id:VISUAL_ACTION,risk:&#39;R1&#39;,readiness:&#39;source_wired&#39;, schema:&#39;vivim.ui-proposal/1&#39;,revision:1}); |
| WIKI_STRUCTURE | const | 52 | no | const WIKI_STRUCTURE = new Set([&#39;wiki.page.create&#39;,&#39;wiki.page.move&#39;,&#39;wiki.pages.link&#39;]); |
| wikiMutation | function | 53 | no | const wikiMutation = id =&gt; id === WIKI_ACTION \|\| id===CAPTURE_ACTION \|\| id===WIKI_WRITE_PROGRAM_ACTION \|\| WIKI_STRUCTURE.has(id); |
| structureEdit | function | 54 | no | function structureEdit(id,args) { |
| relatedPages | function | 60 | no | function relatedPages(wiki,page) { |
| outgoing | const | 61 | no | const outgoing=(wiki.pages[page].links??[]).filter(p=&gt;Object.hasOwn(wiki.pages,p)); |
| incoming | const | 62 | no | const incoming=Object.keys(wiki.pages).filter(p=&gt;wiki.pages[p].links?.includes(page)); |
| WIKI_READS | const | 65 | no | const WIKI_READS = new Set([&#39;wiki.section.read&#39;, &#39;wiki.pages.list&#39;]); |
| MAX_WIKI_LIST_PAGES | const | 66 | no | const MAX_WIKI_LIST_PAGES = 24; |
| MAX_WIKI_LIST_SECTIONS | const | 67 | no | const MAX_WIKI_LIST_SECTIONS = 24; |
| MAX_WIKI_CONTENT_BYTES | const | 68 | no | const MAX_WIKI_CONTENT_BYTES = 3072; |
| resolveWikiTarget | function | 71 | no | function resolveWikiTarget(wiki, target) { |
| names | const | 72 | no | const names = typeof target === &#39;string&#39; ? target.split(&#39;/&#39;) : []; |
| pages | const | 74 | no | const pages = Object.keys(wiki?.pages ?? {}).filter(k =&gt; k.toLowerCase() === names[0].toLowerCase()); |
| page | const | 76 | no | const page = pages[0]; |
| sections | const | 77 | no | const sections = Object.keys(wiki.pages[page]?.sections ?? {}).filter(k =&gt; k.toLowerCase() === names[1].toLowerCase()); |
| section | const | 79 | no | const section = sections[0], before = wiki.pages[page].sections[section]; |
| VALIDATION_ERROR_CODES | const | 86 | no | const VALIDATION_ERROR_CODES = new Set([ &#39;GRANT_REQUIRED&#39;, &#39;GRANT_SCOPE&#39;, &#39;OWNER_PREFERENCE_INVALID&#39;, &#39;OWNER_PREFERENCE_NOT_OWNER&#39;, |
| readWikiPages | function | 106 | no | function readWikiPages(wiki) { |
| pages | const | 107 | no | const pages = Object.entries(wiki.pages); |
| sections | const | 111 | no | const sections = Object.keys(value.sections); |
| readWikiSection | function | 117 | no | function readWikiSection(wiki,{page,section}) { |
| found | const | 118 | no | const found = resolveWikiTarget(wiki, page + &#39;/&#39; + section); |
| createExecutors | function | 125 | no | function createExecutors({ runtime, planner, lexicon, devices, productJournal, personalSemantics, nativeProgram }) { |
| ownerExclusions | function | 126 | no | const ownerExclusions = () =&gt; (runtime.status().preferences ?? []) |
| commitStructure | function | 129 | no | const commitStructure = async (_args,ctx) =&gt; { |
| b | const | 131 | no | const b=ctx.wikiBinding; |
| entry | const | 132 | no | const entry=await productJournal.append({kind:&#39;wiki-structure&#39;,actor:&#39;owner-browser&#39;, schemaVersion:1,expectedRevision:b.expectedRevision,edit:b.edit}); |
| wiki | const | 134 | no | const wiki=await productJournal.readPhoneWiki(); |
| s | const | 153 | no | const s = runtime.status(); |
| current | const | 159 | no | const current=runtime.status(); |
| grants | const | 174 | no | const grants=devices.listGrants(); |
| grant | const | 184 | no | const grant=devices.listGrants().find(g=&gt;g.grantId===grantId); |
| selected | const | 189 | no | const selected=String(scopes).split(&#39;,&#39;).map(s=&gt;s.trim()); |
| result | const | 193 | no | const result=devices.approveGrant({ grantId,approvedScopes:selected,approvedBy:&#39;desktop-owner&#39; }); |
| grants | const | 202 | no | const grants=devices.listGrants(); |
| grant | const | 203 | no | const grant=grants.find(g=&gt;g.grantId===grantId); |
| p | const | 209 | no | const p = runtime.projection(); |
| status | const | 214 | no | const status=runtime.status(); |
| own | const | 218 | no | const own=(status.preferences??[]).filter(p=&gt; p.source===&#39;owner&#39; &amp;&amp; p.hard===false &amp;&amp; typeof p.id===&#39;string&#39; &amp;&amp; p.id.startsWith(&#39;prf-owner-pref-&#39;)); |
| result | const | 226 | no | const result=runtime.setOwnerPreference({value}); |
| result | const | 230 | no | const result=runtime.clearOwnerPreference({id}); |
| out | const | 235 | no | const out = runtime.choosePreset({ preset, requestId: ctx.requestId }); |
| out | const | 239 | no | const out = runtime.undoTheme({ requestId: ctx.requestId }); |
| bound | const | 255 | no | const bound=ctx.wikiBinding;if(!bound\|\|!productJournal?.appendWikiSequence)throw fail(&#39;CONTROL_WIKI_NOT_READY&#39;); |
| observed | const | 256 | no | const observed=await productJournal.appendWikiSequence(bound.steps.map(s=&gt;s.payload),bound.pagesDigest,{planId:ctx.planId,planDigest:ctx.planDigest}); |
| b | const | 263 | no | const b=ctx.wikiBinding;if(!productJournal\|\|!b?.edit)throw fail(&#39;CONTROL_WIKI_NOT_READY&#39;); |
| entry | const | 264 | no | const entry=await productJournal.append({kind:&#39;wiki-edit&#39;,actor:&#39;owner-browser&#39;,schemaVersion:1,expectedRevision:b.expectedRevision,edit:b.edit}); |
| wiki | const | 265 | no | const wiki=await productJournal.readPhoneWiki(); |
| entry | const | 273 | no | const entry = await productJournal.append({ kind: &#39;wiki-edit&#39;, actor: &#39;owner-browser&#39;, schemaVersion: 1, expectedRevision, edit: { action: &#39;set-section&#39;, page, section, content } }); |
| createControlDispatcher | function | 292 | yes | export function createControlDispatcher({ dataRoot, runtime, devices = null, productJournal = null, catalog = loadControlCatalog(), commandScope = () =&gt; ({}), nativeProgram=createNativeProgramValidat… |
| iso | function | 297 | no | const iso = () =&gt; new Date(now()).toISOString(); |
| lexicon | const | 298 | no | const lexicon = createLexiconStore({ dataRoot, catalog, now: iso }); |
| journal | const | 299 | no | const journal = createControlJournal({ dataRoot }); |
| activeRuleCommit | variable | 302 | no | let activeRuleCommit=null; |
| personalSemantics | const | 303 | no | const personalSemantics = createPersonalRuleStore({ dataRoot, catalog, now: iso, verifyOwnerApproval: (approval,subject) =&gt; { if(!activeRuleCommit\|\|approval?.receiptId!==activeRuleCommit)return false… |
| rec | const | 306 | no | const rec=journal.get(activeRuleCommit); |
| planner | const | 312 | no | const planner = createControlPlanner({ catalog, lexicon: () =&gt; lexicon.entries(), personalRules: () =&gt; personalSemantics.accepted(), commandScope }); |
| executors | const | 315 | no | const executors = createExecutors({ runtime, planner, lexicon, devices, productJournal, personalSemantics,nativeProgram }); |
| runnable | const | 318 | no | const runnable = [&#39;source_wired&#39;, &#39;verified&#39;].includes(a.readiness); |
| action | function | 321 | no | const action = id =&gt; id===VISUAL_ACTION?VISUAL_CONTRACT:catalog.actions.find(a =&gt; a.id === id); |
| visualBinding | function | 323 | no | function visualBinding(proposal,source,actor,grantId){ |
| current | const | 326 | no | const current=runtime.previewUiProposal(proposal); |
| manifest | const | 327 | no | const manifest={schema:&#39;vivim.approval-meaning/1&#39;,templateRevision:VISUAL_CONTRACT.revision, |
| planVisual | function | 337 | no | function planVisual(proposal,{source,actor,grantId}){ |
| createdAt | const | 342 | no | const createdAt=iso(),body={schema:&#39;vivim.control-plan-record/1&#39;,planId:newPlanId(), |
| previewWriteSequence | function | 356 | no | async function previewWriteSequence(commands,wiki,typedSteps=null){ |
| lines | const | 357 | no | const lines=String(commands).split(/\\r?\\n/).map(s=&gt;s.trim()); |
| projected | variable | 359 | no | let projected={revision:wiki.revision,pages:wiki.pages};const steps=[]; |
| p | const | 362 | no | const p=typedSteps?planner.planTyped({...typedSteps[index],source:&#39;desktop&#39;}):planner.planText(line,{source:&#39;desktop&#39;}); |
| binding | variable | 364 | no | let binding,payload; |
| pagesDigest | const | 370 | no | const pagesDigest=rawDigest(projected.pages),baseDigest=rawDigest(wiki.pages),programId=&#39;wiki-change-&#39;+digest({baseDigest,steps,pagesDigest}).slice(0,24); |
| nativeSteps | const | 372 | no | const nativeSteps=steps.map((_,i)=&gt;({id:&#39;change-&#39;+(i+1),kind:&#39;compile&#39;,dependencies:i?[&#39;change-&#39;+i]:[],inputs:[],output_data_class:&#39;private&#39;,risk:&#39;R0&#39;,destination:null})); |
| checked | const | 373 | no | const checked=await nativeProgram({program:JSON.stringify({id:programId,revision:1,steps:nativeSteps})}); |
| latest | const | 375 | no | const latest=await productJournal.readPhoneWiki();if(latest.revision!==wiki.revision\|\|rawDigest(latest.pages)!==baseDigest)throw fail(&#39;CONTROL_WIKI_STALE&#39;); |
| approvalBinding | function | 379 | no | function approvalBinding(actionId,args,source,wikiBinding){ |
| a | const | 380 | no | const a=action(actionId); |
| resolved | const | 382 | no | const resolved=actionId===CAPTURE_ACTION?{...args,page:wikiBinding.page,section:wikiBinding.section}: |
| normalize | function | 387 | no | const normalize=values=&gt;Object.fromEntries(Object.entries(values).map(([key,value])=&gt; [key,[&#39;target&#39;,&#39;from&#39;,&#39;to&#39;,&#39;page&#39;].includes(key)&amp;&amp;actionId!==&#39;wiki.page.create&#39;? value.toLowerCase():value])); |
| sentence | const | 390 | no | const sentence=wikiApprovalSentence(actionId,resolved); |
| worldRevision | const | 391 | no | const worldRevision=planner.world().v; |
| roundTrip | variable | 392 | no | let roundTrip=false,engineVersion=null; |
| parsed | const | 395 | no | const parsed=planner.planText(sentence,{source}); |
| manifest | const | 401 | no | const manifest={schema:&#39;vivim.approval-meaning/1&#39;,templateRevision:1, |
| checkApprovalBinding | function | 411 | no | function checkApprovalBinding(record,wikiBinding){ |
| bound | const | 418 | no | const bound=record.semanticRuleBinding,snapshot=personalSemantics.snapshot(); |
| rule | const | 424 | no | const rule=snapshot.entries.find(r=&gt;r.id===bound.ruleId); |
| templateReceiptCurrent | function | 434 | no | function templateReceiptCurrent(rule){ |
| rec | const | 436 | no | const rec=journal.get(rule.template.receiptId); |
| prepareRuleBinding | function | 447 | no | function prepareRuleBinding(actionId,args) { |
| snapshot | const | 448 | no | const snapshot=personalSemantics.snapshot(); |
| old | const | 450 | no | const old=snapshot.entries.find(r=&gt;r.id===args.rule_id&amp;&amp;[&#39;accepted&#39;,&#39;proposed&#39;,&#39;suspended&#39;].includes(r.state)); |
| share | const | 455 | no | const share=/^share with paired phones:[ \\t]*\\r?\\n([\\s\\S]+)$/.exec(args.command); |
| command | const | 456 | no | const command=share?share[1]:args.command; |
| scope | const | 457 | no | const scope={...commandScope(),surface:share?&#39;mobile&#39;:&#39;desktop&#39;}; |
| rule | variable | 462 | no | let rule,targetRisk; |
| id | const | 467 | no | const id=command.slice(8); |
| rec | const | 469 | no | const rec=journal.get(id),p=rec?.plan,r=rec?.receipt; |
| deps | const | 471 | no | const deps=templateDependencies(catalog); |
| parameter | const | 493 | no | const parameter=/^parameterize page ([a-z][a-z0-9-]{0,62}):[ \\t]*\\r?\\n([\\s\\S]+)$/.exec(command); |
| target | const | 494 | no | const target=planner.planText(parameter?parameter[2]:command,{source:&#39;desktop&#39;}); |
| recipe | const | 502 | no | const recipe=compileWikiWriteRecipe(target.args.commands,text=&gt;planner.planText(text,{source:&#39;desktop&#39;}),catalog,parameter?parameter[1]:null); |
| recipe | const | 507 | no | const recipe=compileWikiReadRecipe(target.args.commands,text=&gt;planner.planText(text,{source:&#39;desktop&#39;}),catalog); |
| matches | const | 515 | no | const matches=snapshot.entries.filter(r=&gt;r.state===&#39;accepted&#39;&amp;&amp;phraseKey(r.phrase)===phraseKey(rule.phrase)&amp;&amp; rawDigest(r.scope)===rawDigest(scope)); |
| old | const | 518 | no | const old=matches[0]??null; |
| undoFor | function | 524 | no | function undoFor(a, args, result) { |
| out | const | 526 | no | const out = {}; |
| runRead | function | 532 | no | function runRead(plan,{readHvi=null,recipe=null,stillCurrent=()=&gt;true}={}) { |
| complete | function | 533 | no | const complete = result =&gt; ({ ...plan, outcome: &#39;done&#39;, executionPerformed: true, effect: &#39;read&#39;, result }); |
| plan | function | 553 | no | function plan(input, { source = &#39;text&#39;, actor = &#39;owner&#39;, grantId = null, readHvi=null, authorizeProgram=null } = {}) { |
| keys | const | 555 | no | const keys = Object.keys(input); |
| p | variable | 557 | no | let p; |
| isProgram | const | 564 | no | const isProgram=[WIKI_READ_PROGRAM_ACTION,WIKI_WRITE_PROGRAM_ACTION].includes(p.actionId); |
| mobileProgram | const | 565 | no | const mobileProgram=isProgram&amp;&amp;source===&#39;mobile&#39;&amp;&amp;p.origin===&#39;personal_rule&#39;&amp;&amp;typeof grantId===&#39;string&#39;&amp;&amp;grantId.length&gt;0&amp;&amp;typeof authorizeProgram===&#39;function&#39;; |
| desktopProgram | const | 566 | no | const desktopProgram=source===&#39;desktop&#39;&amp;&amp;actor===&#39;desktop-owner&#39;&amp;&amp;[&#39;typed&#39;,&#39;deterministic&#39;,&#39;personal_rule&#39;].includes(p.origin); |
| programScope | const | 567 | no | const programScope=p.actionId===WIKI_WRITE_PROGRAM_ACTION?&#39;control:execute&#39;:&#39;control:read&#39;; |
| observed | const | 574 | no | const observed=p.language?.personalRule,snapshot=personalSemantics.snapshot(),scope={...commandScope(),surface:source}; |
| rule | const | 575 | no | const rule=snapshot.entries.find(r=&gt;r.id===observed?.ruleId&amp;&amp;r.revision===observed.ruleRevision&amp;&amp;r.state===&#39;accepted&#39;&amp;&amp;r.actionId===p.actionId); |
| stillCurrent | function | 576 | no | const stillCurrent=()=&gt;{if(mobileProgram){try{authorizeProgram(programScope);}catch{return false;}}const live=personalSemantics.snapshot();return live.version===snapshot.version&amp;&amp;live.digest===snapsh… |
| semanticRuleBinding | variable | 597 | no | let semanticRuleBinding = null,writeSteps=null; |
| observed | const | 599 | no | const observed = p.language?.personalRule; |
| snapshot | const | 600 | no | const snapshot = personalSemantics.snapshot(); |
| rule | const | 601 | no | const rule = snapshot.entries.find(r =&gt; r.id === observed?.ruleId &amp;&amp; r.state === &#39;accepted&#39; &amp;&amp; r.revision === observed.ruleRevision &amp;&amp; r.actionId === p.actionId &amp;&amp; digest(r.template\|\|r.writeProgram?b… |
| activeScope | const | 607 | no | const activeScope = { ...commandScope(), surface: source }; |
| ruleBinding | const | 614 | no | const ruleBinding=RULE_ACTIONS.has(p.actionId)?prepareRuleBinding(p.actionId,p.args):null; |
| savePlan | function | 615 | no | const savePlan = wikiBinding =&gt; { |
| live | const | 618 | no | const live=personalSemantics.snapshot(),rule=live.entries.find(r=&gt;r.id===semanticRuleBinding.ruleId&amp;&amp;r.state===&#39;accepted&#39;&amp;&amp;r.revision===semanticRuleBinding.ruleRevision); |
| steps | const | 619 | no | const steps=rule?bindPersonalWriteProgram(rule,semanticRuleBinding.invocation,catalog):null; |
| createdAt | const | 622 | no | const createdAt = iso(); |
| approvalMeaning | const | 623 | no | const approvalMeaning=wikiBinding?approvalBinding(p.actionId,p.args,source,wikiBinding):null; |
| body | const | 624 | no | const body = { schema: &#39;vivim.control-plan-record/1&#39;, planId: newPlanId(), actionId: p.actionId, args: p.args, |
| binding | const | 656 | no | const binding=resolveWikiTarget(wiki,p.args.target); |
| execute | function | 670 | no | function execute({ planId, planDigest, approval } = {},{authorizeProgram=null}={}) { |
| rec | const | 672 | no | const rec = journal.get(planId); |
| phoneProgram | const | 681 | no | const phoneProgram=rec.plan.actionId===WIKI_WRITE_PROGRAM_ACTION&amp;&amp;rec.plan.source===&#39;mobile&#39;; |
| a | const | 702 | no | const a = action(rec.plan.actionId); |
| bound | const | 707 | no | const bound = rec.plan.semanticRuleBinding; |
| snapshot | const | 709 | no | const snapshot = personalSemantics.snapshot(); |
| rule | const | 716 | no | const rule=snapshot.entries.find(r=&gt;r.id===bound.ruleId); |
| approvedVisual | variable | 730 | no | let approvedVisual=null; |
| fresh | const | 735 | no | const fresh=planner.planTyped({actionId:rec.plan.actionId,args:rec.plan.args,source:rec.plan.source,origin:rec.plan.origin}); |
| finishEffect | function | 760 | no | function finishEffect(result = null, cause = null) { |
| code | const | 763 | no | const code = cause?.status === 409 ? &#39;CONTROL_WIKI_STALE&#39; : |
| definitive | const | 765 | no | const definitive = cause?.status === 409 \|\| VALIDATION_ERROR_CODES.has(code) \|\| |
| status | const | 767 | no | const status = !cause ? &#39;applied&#39; : definitive ? &#39;failed&#39; : &#39;uncertain&#39;; |
| error | const | 768 | no | const error = cause ? { code: short(code, 64), message: short(cause.message ?? cause, 200) } : null; |
| receipt | const | 769 | no | const receipt = { schema: RECEIPT_SCHEMA, planId, planDigest: stored, actionId: rec.plan.actionId, args: rec.plan.args, |
| claimAndRun | function | 778 | no | function claimAndRun() { |
| output | variable | 784 | no | let output; |
| expected | const | 794 | no | const expected={...approvedVisual.current.preview.surface,revision:approvedVisual.meaning.targetRevision+1}; |
| bound | const | 808 | no | const bound=rec.plan.semanticRuleBinding; |
| rule | const | 809 | no | const rule=bound?personalSemantics.snapshot().entries.find(r=&gt;r.id===bound.ruleId):null; |
| steps | const | 810 | no | const steps=bound?bindPersonalWriteProgram(rule,bound.invocation,catalog):null; |
| bound | const | 820 | no | const bound=rec.plan.wikiBinding; |
| current | const | 822 | no | const current=previewWikiStructure(wiki,structureEdit(rec.plan.actionId,rec.plan.args)); |
| current | const | 832 | no | const current=previewWikiCapture(wiki,rec.plan.args); |
| current | const | 841 | no | const current = resolveWikiTarget(wiki, rec.plan.args.target); |
| bound | const | 842 | no | const bound = rec.plan.wikiBinding; |
| status | function | 853 | no | function status(planId,{source=&#39;desktop&#39;,actor=null,grantId=null}={}) { |
| rec | const | 854 | no | const rec = journal.get(planId); |
| inspectOwnerPlan | function | 866 | no | async function inspectOwnerPlan(planId){ |
| detail | const | 867 | no | const detail=status(planId),rec=journal.get(planId); |
| sharedPrograms | function | 875 | no | function sharedPrograms({canExecute=false}={}){ |
| scope | const | 876 | no | const scope={...commandScope(),surface:&#39;mobile&#39;},snapshot=personalSemantics.snapshot(); |
| entries | const | 877 | no | const entries=snapshot.entries.filter(r=&gt;r.state===&#39;accepted&#39;&amp;&amp;compatibleRuleCatalog(r,catalog)&amp;&amp;Object.entries(r.scope).every(([k,v])=&gt;scope[k]===v)&amp;&amp; (r.actionId===WIKI_READ_PROGRAM_ACTION&amp;&amp;r.readP… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 12 | external |
| ./intent-planner.mjs | import | 13 | [apps/vivim-host/control/intent-planner.mjs](./intent-planner.mjs.md) |
| ./journal.mjs | import | 14 | [apps/vivim-host/control/journal.mjs](./journal.mjs.md) |
| ./lexicon.mjs | import | 15 | [apps/vivim-host/control/lexicon.mjs](./lexicon.mjs.md) |
| ./personal-rule-store.mjs | import | 16 | [apps/vivim-host/control/personal-rule-store.mjs](./personal-rule-store.mjs.md) |
| ./personal-semantics.mjs | import | 17 | [apps/vivim-host/control/personal-semantics.mjs](./personal-semantics.mjs.md) |
| ../../mobile-relay/control-language.mjs | import | 18 | [apps/mobile-relay/control-language.mjs](../../mobile-relay/control-language.mjs.md) |
| ../chat/product-journal.mjs | import | 19 | [apps/vivim-host/chat/product-journal.mjs](../chat/product-journal.mjs.md) |
| ./command-intent.mjs | import | 20 | [apps/vivim-host/control/command-intent.mjs](./command-intent.mjs.md) |
| ./native-program.mjs | import | 21 | [apps/vivim-host/control/native-program.mjs](./native-program.mjs.md) |
| ./wiki-read-program.mjs | import | 22 | [apps/vivim-host/control/wiki-read-program.mjs](./wiki-read-program.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./control/dispatcher.mjs |
| [apps/vivim-host/test/control-desktop-surface.test.mjs](../test/control-desktop-surface.test.mjs.md) | ../control/dispatcher.mjs |
| [apps/vivim-host/test/control-devices.test.mjs](../test/control-devices.test.mjs.md) | ../control/dispatcher.mjs |
| [apps/vivim-host/test/control-dispatcher.test.mjs](../test/control-dispatcher.test.mjs.md) | ../control/dispatcher.mjs |
| [apps/vivim-host/test/control-wiki-execution.test.mjs](../test/control-wiki-execution.test.mjs.md) | ../control/dispatcher.mjs |
| [apps/vivim-host/test/host-authorized-mutation.test.mjs](../test/host-authorized-mutation.test.mjs.md) | ../control/dispatcher.mjs |
| [apps/vivim-host/test/kpi-utc.test.mjs](../test/kpi-utc.test.mjs.md) | ../control/dispatcher.mjs |
| [apps/vivim-host/test/personal-semantic-host.test.mjs](../test/personal-semantic-host.test.mjs.md) | ../control/dispatcher.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Universal Text Control — Host-only dispatcher (UTC03).
// Every surface (desktop text, phone text, GUI, AI candidate) reaches effects ONLY here:
//
//   plan(input)  → typed plan (planner) → R0 read: run now, no effect
//                                        → R1/R2: journal plan + digest, return for approval
//   execute({planId, planDigest, approval}) → verify digest, expiry, staleness, freshness
//                → exclusive approve → exclusive claim (effect fence) → executor → receipt
//
// Invariants: the model never authorizes; `!` grants nothing; an approval binds one exact
// plan digest; a claimed plan is never re-executed (crash ⇒ `uncertain`, surfaced to the
// owner); executors are fixed Host functions — no shell, SQL, URL or generated code.
import { createHash } from 'node:crypto';
import { createControlPlanner, loadControlCatalog } from './intent-planner.mjs';
import { createControlJournal, newPlanId } from './journal.mjs';
import { createLexiconStore } from './lexicon.mjs';
import { createPersonalRuleStore } from './personal-rule-store.mjs';
import { PERSONAL_RULE_SCHEMA, validatePersonalRule, TEMPLATE_SCHEMA, templateAlias, templateDependencies, bindPersonalRule, currentTemplate, bindPersonalWriteProgram, compatibleRuleCatalog } from './personal-semantics.mjs';
import { interpretControl, resolveLocalDestination, resolveDesktopDestination } from '../../mobile-relay/control-language.mjs';
import { previewWikiStructure, previewWikiCapture, validateProductEdit, previewWikiPayload } from '../chat/product-journal.mjs';
import { wikiApprovalSentence } from './command-intent.mjs';
import { createNativeProgramValidator } from './native-program.mjs';
import { runWikiReadProgram,compileWikiReadRecipe,validWikiRecipe,compileWikiWriteRecipe,validWikiWriteRecipe } from './wiki-read-program.mjs';

export const DISPATCHER_SCHEMA = 'vivim.control-dispatcher/1';
export const RECEIPT_SCHEMA = 'vivim.control-receipt/1';
export const APPROVAL_CHANNELS = Object.freeze(['desktop-owner-token', 'direct-phone']);
const fail = (code, extra = {}) => Object.assign(new Error(code), { code, ...extra });
const stable = v => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v;
const digest = o => createHash('sha256').update(JSON.stringify(stable(o))).digest('hex');
const short = (s, n) => String(s ?? '').slice(0, n);
const RULE_ACTIONS = new Set(['control.rule.remember','control.rule.revoke']);
const rawDigest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const phraseKey = value => value.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
// Only fixed, local, source-wired commands. No security, provider, lexicon,
// arbitrary code, nested learning, destructive or external-effect capability.
const LEARNABLE = new Set(['wiki.pages.list','wiki.section.read','wiki.page.create',
  'wiki.section.edit','wiki.page.move','wiki.pages.link','ui.theme.show','ui.theme.set_preset',
  'vivim.status.show']);
const WIKI_ACTION = 'wiki.section.edit';
const CAPTURE_ACTION='wiki.capture.save';
const NATIVE_PROGRAM_ACTION='program.validate';
const WIKI_READ_PROGRAM_ACTION='program.read_wiki';
const WIKI_WRITE_PROGRAM_ACTION='program.write_wiki';
const HVI_ACTION='versions.compare.pinned';
// A typed VEC document is not an NL action or a string argument. Keep the existing
// language catalog stable (including accepted learned rules); the visual contract
// has its own version and uses the very same control plan journal and claim.
const VISUAL_ACTION='ui.visual.apply';
const VISUAL_CONTRACT=Object.freeze({id:VISUAL_ACTION,risk:'R1',readiness:'source_wired',
  schema:'vivim.ui-proposal/1',revision:1});
const WIKI_STRUCTURE = new Set(['wiki.page.create','wiki.page.move','wiki.pages.link']);
const wikiMutation = id => id === WIKI_ACTION || id===CAPTURE_ACTION || id===WIKI_WRITE_PROGRAM_ACTION || WIKI_STRUCTURE.has(id);
function structureEdit(id,args) {
  if(id==='wiki.page.create')return {action:'create-page',page:args.page};
  if(id==='wiki.page.move')return {action:'move-page',page:args.page,position:args.position};
  if(id==='wiki.pages.link')return {action:'link-pages',from:args.from,to:args.to};
  throw fail('CONTROL_ACTION_UNKNOWN');
}
function relatedPages(wiki,page) {
  const outgoing=(wiki.pages[page].links??[]).filter(p=>Object.hasOwn(wiki.pages,p));
  const incoming=Object.keys(wiki.pages).filter(p=>wiki.pages[p].links?.includes(page));
  return [...new Set([...outgoing,...incoming])].slice(0,24);
}
const WIKI_READS = new Set(['wiki.section.read', 'wiki.pages.list']);
const MAX_WIKI_LIST_PAGES = 24;
const MAX_WIKI_LIST_SECTIONS = 24;
const MAX_WIKI_CONTENT_BYTES = 3072;

// Only existing sections, resolved to their canonical names. A model cannot invent a Wiki target.
function resolveWikiTarget(wiki, target) {
  const names = typeof target === 'string' ? target.split('/') : [];
  if (names.length !== 2 || names.some(x => !x)) throw fail('CONTROL_WIKI_TARGET_UNKNOWN');
  const pages = Object.keys(wiki?.pages ?? {}).filter(k => k.toLowerCase() === names[0].toLowerCase());
  if (pages.length !== 1) throw fail('CONTROL_WIKI_TARGET_UNKNOWN');
  const page = pages[0];
  const sections = Object.keys(wiki.pages[page]?.sections ?? {}).filter(k => k.toLowerCase() === names[1].toLowerCase());
  if (sections.length !== 1) throw fail('CONTROL_WIKI_TARGET_UNKNOWN');
  const section = sections[0], before = wiki.pages[page].sections[section];
  if (!Number.isSafeInteger(wiki.revision) || typeof before !== 'string') throw fail('CONTROL_WIKI_TARGET_UNKNOWN');
```

_First 80 of 896 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
