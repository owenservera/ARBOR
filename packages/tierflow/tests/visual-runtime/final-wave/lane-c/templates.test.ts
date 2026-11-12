import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {TEMPLATE_CATALOG,TEMPLATE_CATALOG_DIGEST,findTemplate,planTemplateCandidate} from '../../../../src/visual-runtime/final-wave/lane-c/templates.ts';
import type {UiDocument} from '../../../../src/visual-runtime/document/schema.ts';

const trust={ownerRef:'owner1',worldRef:'world1',workspaceRef:'workspace1',deviceRef:'device1',sessionRef:'session1',policyRevision:'policy1',catalogDigest:TEMPLATE_CATALOG_DIGEST};
function base():UiDocument {return {schema:'vivim.ui-document/1',documentId:'founder1',scope:{ownerRef:'owner1',workspaceRef:'workspace1'},revision:17,rootId:'root1',nodes:[{id:'root1',type:'stack',props:{direction:'vertical',gap:'md'},children:[],a11y:{role:'main',name:'Founder workspace'}}],bindings:[],views:[{id:'viewpc',version:1,kind:'2d',viewport:'desktop'},{id:'viewphone',version:1,kind:'2d',viewport:'phone'}]};}
function candidate(override:Record<string,unknown>={}):unknown{return {schema:'vivim.ui-template-candidate/1',templateId:'FW.BLOCKERS.PRIORITY',templateVersion:'1.0.0',documentId:'founder1',instanceId:'blocker1',targetNodeId:'root1',...trust,baseRevision:17,proposedBy:'oracle',authority:'candidate-only',...override};}

test('12 bounded declarative recipes with no execution or private values',()=>{
 assert.equal(TEMPLATE_CATALOG.length,12);
 assert.equal(new Set(TEMPLATE_CATALOG.map(x=>x.templateId)).size,12);
 for(const x of TEMPLATE_CATALOG){assert.equal(x.executable,false);assert.equal(x.privacy,'deny-until-scoped');assert.equal(x.version,'1.0.0');assert.deepEqual(x.nodeKeys,['region','heading','body']);assert.ok(!/https?:|<script|actionRefs|secret|token=/i.test(JSON.stringify(x)));assert.ok(findTemplate(x.templateId));}
 assert.equal(TEMPLATE_CATALOG_DIGEST,'sha256:'+createHash('sha256').update(JSON.stringify(TEMPLATE_CATALOG)).digest('hex'));
});
for (const spec of TEMPLATE_CATALOG) test(`canonical-shaped declarative expansion: ${spec.templateId}`,()=>{
 const plan=planTemplateCandidate(candidate({templateId:spec.templateId,instanceId:'inst1'}),base(),trust);
 assert.equal(plan.ok,true);if(!plan.ok)return;
 assert.equal(plan.effectInvoked,false);assert.equal(plan.publish,'owner-review-required');
 assert.equal(plan.draft.revision,17);assert.equal(plan.draft.nodes.length,4);
  const n0=plan.draft.nodes[0];assert.ok(n0);
  const n1=plan.draft.nodes[1];assert.ok(n1);
  assert.deepEqual(n0.children,['inst1.region']);
  assert.deepEqual(n1.children,['inst1.heading','inst1.body']);
  assert.equal(n1.type,'grid');assert.equal(n1.layout?.phone?.columns,1);assert.equal(n1.layout?.desktop?.columns,2);
});
for (const [label,override,code] of [
 ['catalog downgrade',{catalogDigest:'sha256:fake'},'STALE_PIN'],['wrong template version',{templateVersion:'2.0.0'},'UNKNOWN_TEMPLATE'],
 ['wrong base',{baseRevision:18},'STALE_PIN'],['wrong document',{documentId:'other'},'STALE_PIN'],
 ['wrong owner',{ownerRef:'other'},'FOREIGN_SCOPE'],['wrong world',{worldRef:'other'},'FOREIGN_SCOPE'],
 ['wrong workspace',{workspaceRef:'other'},'FOREIGN_SCOPE'],['wrong device',{deviceRef:'other'},'FOREIGN_SCOPE'],
 ['wrong session',{sessionRef:'other'},'FOREIGN_SCOPE'],['stale policy',{policyRevision:'old'},'FOREIGN_SCOPE'],
 ['foreign target',{targetNodeId:'other'},'INVALID_PARENT'],['script target',{targetNodeId:'<script>'},'BAD_CANDIDATE'],
 ['unsafe URL',{templateId:'https://attacker'},'BAD_CANDIDATE'],['executable field',{onclick:'send()'},'BAD_CANDIDATE'],
 ['hidden grant',{grant:'approved'},'BAD_CANDIDATE'],['unknown template',{templateId:'FW.PRIVATE'},'UNKNOWN_TEMPLATE'],
 ['missing version',{templateVersion:undefined},'BAD_CANDIDATE'],['undefined action',{actionRefs:[]},'BAD_CANDIDATE'],
 ['user claimed approval',{authority:'approved'},'BAD_CANDIDATE'],['invalid actor',{proposedBy:'host'},'BAD_CANDIDATE'],
 ['negative revision',{baseRevision:-1},'BAD_CANDIDATE'],['float revision',{baseRevision:17.5},'BAD_CANDIDATE'],
 ['prototype key',{['__proto__']:'x',extra:'x'},'BAD_CANDIDATE'],
] as const)test('deny '+label,()=>{
 const result=planTemplateCandidate(candidate(override as Record<string,unknown>),base(),trust);assert.equal(result.ok,false);
 if(!result.ok){assert.equal(result.code,code);assert.equal(result.draft,null);assert.equal(result.effectInvoked,false);}
});

test('reject exact JSON prototype pollution key',()=>{const c=JSON.parse(JSON.stringify(candidate()));Object.defineProperty(c,'__proto__',{value:'attacker',enumerable:true});assert.equal(planTemplateCandidate(c,base(),trust).ok,false);});
test('reject ID collision with existing node',()=>{const b=base();const modified={...b,nodes:[...b.nodes,{id:'blocker1.region',type:'text',props:{value:'a'},children:[],a11y:{role:'text',name:'a'}}] as UiDocument['nodes']};const r=planTemplateCandidate(candidate(),modified,trust);assert.equal(r.ok,false);if(!r.ok)assert.equal(r.code,'COLLISION');});
test('reject oversize node budget without partial save',()=>{const b=base();const children=Array.from({length:63},(_,i)=>`n${i}`);const extra=children.map(id=>({id,type:'text' as const,props:{value:id},children:[],a11y:{role:'text' as const,name:id}}));const altered={...b,nodes:[...b.nodes,...extra] as UiDocument['nodes']};const result=planTemplateCandidate(candidate(),altered,trust);assert.equal(result.ok,false);if(!result.ok)assert.equal(result.code,'BUDGET');});
test('refuse root child overflow',()=>{const b=base();const b0=b.nodes[0];assert.ok(b0);const root={...b0,children:Array.from({length:24},(_,i)=>`x${i}`)};const r=planTemplateCandidate(candidate(),{...b,nodes:[root]},trust);assert.equal(r.ok,false);if(!r.ok)assert.equal(r.code,'INVALID_PARENT');});
test('no mutation of existing canonical document',()=>{const b=base();const snapshot=JSON.stringify(b);planTemplateCandidate(candidate(),b,trust);assert.equal(JSON.stringify(b),snapshot);});
