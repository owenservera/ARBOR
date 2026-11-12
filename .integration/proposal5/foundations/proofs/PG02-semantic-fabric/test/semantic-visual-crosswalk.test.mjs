import test from 'node:test';
import assert from 'node:assert/strict';
import {intersectTrace,twoTabReadProposal,checkedSpan,utf16Boundary} from '../semantic-visual-crosswalk.mjs';
const versions={source:'src-1',catalog:'6',policy:'policy-1',graph:'graph-1',world:'world-1'};
const snapshot={trustedIngress:true,sessionId:'synthetic-s',actorRef:'synthetic-owner',worldRef:'synthetic-world',
  inputRevision:3,text:'show status',caretUtf16:11,versions,screenRevision:4};
const current={...versions,worldRef:'synthetic-world',actorRef:'synthetic-owner'};
const action={semanticAction:'vivim.status.show@1',hostActionId:'vivim.status.show',catalogVersion:6,
  readiness:'source_wired',risk:'R0',sourceRefs:['synthetic-status:2:action']};
const semanticIR={schema:'vivim.semantic-wiki-ir/0.1',effectPerformed:false,actions:[action]};
const catalog={schema:'vivim.control-action-catalog/1',version:6,actions:[{id:'vivim.status.show',owner:'host',risk:'R0',readiness:'source_wired'}]};
const bindings=[{semanticAction:action.semanticAction,hostActionId:action.hostActionId,owner:'host'}];
const p={producerId:'synthetic-lexicon',sessionId:snapshot.sessionId,inputRevision:snapshot.inputRevision,
  versions,ownerRef:snapshot.actorRef,worldRef:snapshot.worldRef,status:'ran',meanings:[{semanticAction:action.semanticAction,kind:'status'}]};
const args={snapshot,current,semanticIR,catalog,bindings,producers:[p]};
const run=(delta={})=>intersectTrace({...args,...delta});

test('positive synthetic binding remains entirely inert',()=>{const r=run();assert.equal(r.accepted,true);assert.equal(r.candidates.length,1);assert.equal(r.candidates[0].permission,'not_assessed');assert.equal(r.candidates[0].authenticatedSource,false);assert.equal(r.executable,false);assert.equal(r.effectPerformed,false);assert.equal(r.hostReceipt,null)});
test('unknown semantic annotation omitted',()=>assert.equal(run({producers:[{...p,meanings:[{semanticAction:'unknown@1'}]}]}).candidates.length,0));
test('ambiguous source binding omitted',()=>assert.equal(run({bindings:[...bindings,...bindings]}).candidates.length,0));
test('wrong Host action owner omitted',()=>assert.equal(run({bindings:[{...bindings[0],owner:'pretend-admin'}]}).candidates.length,0));
test('catalog version drift refuses frame',()=>assert.equal(run({catalog:{...catalog,version:7}}).reason,'INVALID_SEMANTIC_OR_CATALOG'));
test('Host risk drift omitted',()=>assert.equal(run({catalog:{...catalog,actions:[{...catalog.actions[0],risk:'R2'}]}}).candidates.length,0));
test('stale text revision omits producer',()=>assert.equal(run({producers:[{...p,inputRevision:2}]}).omissions[0].reason,'STALE_PRODUCER'));
test('stale source graph policy or world refuses snapshot',()=>{for(const k of Object.keys(versions)){assert.equal(run({current:{...current,[k]:'stale'}}).reason,'STALE_OR_WRONG_SCOPE')}});
test('foreign actor cannot read current scope',()=>assert.equal(run({current:{...current,actorRef:'someone-else'}}).reason,'STALE_OR_WRONG_SCOPE'));
test('foreign producer owner never produces visible nodes',()=>assert.equal(run({producers:[{...p,ownerRef:'foreign'}]}).candidates.length,0));
test('denied producer does not leak meaning identifiers',()=>{const r=run({producers:[{...p,status:'denied',meanings:[{semanticAction:'private.secret@1'}]}]});assert.equal(r.candidates.length,0);assert.ok(!JSON.stringify(r).includes('private.secret'))});
test('skipped budget and failed producers make explicit coverage',()=>{const r=run({producers:[{...p,status:'skipped_budget'},{...p,producerId:'other',status:'failed'}]});assert.deepEqual(r.coverage.map(x=>x.status),['skipped_budget','failed']);assert.equal(r.candidates.length,0)});
test('negated do not send does not become provider-send candidate',()=>{const s={...snapshot,text:"don't send",caretUtf16:10};const a={...action,semanticAction:'provider.send@1',hostActionId:'provider.send',risk:'R2'};const r=run({snapshot:s,semanticIR:{...semanticIR,actions:[a]},catalog:{...catalog,actions:[{id:'provider.send',owner:'studio',risk:'R2',readiness:'source_wired'}]},bindings:[{semanticAction:'provider.send@1',hostActionId:'provider.send',owner:'studio'}],producers:[{...p,meanings:[{semanticAction:'provider.send@1',kind:'provider-send'}]}]});assert.equal(r.candidates.length,0);assert.equal(r.omissions[0].reason,'NEGATED_EFFECT')});
test('ScreenContext without trusted readScope yields no items',()=>{const screen={schema:'vivim.screen-context/0.1',revision:4,scope:{authority:'host-trusted-scope',ownerRef:snapshot.actorRef,worldRef:snapshot.worldRef,policyRevision:current.policy},coverage:{status:'complete'},items:[{secret:'private'}]};const r=run({screen,readScope:{authorized:false}});assert.equal(r.screen.status,'denied_or_stale');assert.equal(r.screen.items.length,0);assert.ok(!JSON.stringify(r).includes('private'))});
test('stale screen revision or revoked scope refuses exposure',()=>{const screen={schema:'vivim.screen-context/0.1',revision:3,scope:{authority:'host-trusted-scope',ownerRef:snapshot.actorRef,worldRef:snapshot.worldRef,policyRevision:current.policy},coverage:{status:'complete'}};const scope={authorized:true,revoked:false,ownerRef:snapshot.actorRef,worldRef:snapshot.worldRef,policyRevision:current.policy,purpose:'autowiki-read'};assert.equal(run({screen,readScope:scope}).screen.status,'denied_or_stale');assert.equal(run({screen:{...screen,revision:4},readScope:{...scope,revoked:true}}).screen.status,'denied_or_stale')});
test('wiki freshness independent of action match',()=>{const r=run({wiki:{status:'ready',sourceRevision:'old'}});assert.equal(r.wikiFreshness,'stale_or_partial');assert.equal(r.candidates.length,1);assert.equal(r.hostAdmission,'not_assessed')});
test('UTF-16 span rejects split emoji and preserves source',()=>{const s={...snapshot,text:'🔎 status',caretUtf16:2};const bad={startUtf16:1,endUtf16:3,text:'\udc0e '};assert.equal(utf16Boundary(s.text,1),false);assert.equal(checkedSpan(s.text,bad),null);const good={startUtf16:0,endUtf16:2,text:'🔎',sourceRef:'synthetic-status:2:action'};const r=run({snapshot:s,spans:[good]});assert.equal(r.wordLinks[0].endUtf8,4);assert.equal(r.text,s.text);assert.equal(r.caretUtf16,2)});
test('IME input refuses derived selection',()=>assert.equal(run({snapshot:{...snapshot,composing:true}}).reason,'INVALID_OR_UNTRUSTED_SNAPSHOT'));
test('two Tab prediction is read-only and never invents full update command',()=>{const row=(ref)=>({ref,label:ref,sourceStatus:'observed',readOnly:true,sourceRevision:'src-1'});const r=twoTabReadProposal({text:'full ARBOR status',projectOptions:[row('ARBOR')],focusOptions:[row('status')],sourceRevision:'src-1'});assert.equal(r.slots[0].choices.length,1);assert.equal(r.slots[1].choices.length,1);assert.equal(r.hostActionId,null);assert.equal(r.requestedCompleteness,'unsupported');assert.equal(r.executable,false)});
test('two Tab refuses unregistered source revision',()=>{const r=twoTabReadProposal({text:'full ARBOR status',projectOptions:[{ref:'private',sourceStatus:'observed',readOnly:true,sourceRevision:'old'}],sourceRevision:'src-1'});assert.equal(r.slots[0].choices.length,0)});
