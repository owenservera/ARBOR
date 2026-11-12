// PG00: read-only metadata negative acceptance, NOT a product/runtime security test.
// Run manually after checkout: node --test .integration/proposal5/foundations/proofs/PG00-source-truth/negative-contracts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const here = new URL('./', import.meta.url);
const load = name => JSON.parse(readFileSync(new URL(name, here),'utf8'));
const c=load('CAPABILITY-CROSSWALK.json'), owners=load('OWNER-CANONICALITY.json'), delta=load('SOURCE-DELTA.json'), ledger=load('RUN-LEDGER.json');
test('refuses false live execution from source-only catalogue',()=>{assert.equal(c.hostCatalog.version,6);assert.equal(c.hostCatalog.declaredCount,19);assert.equal(c.hostCatalog.physicallyExecutedCount,0);assert.ok(c.hostCatalog.actions.every(a=>a.runtimeVerified===false&&a.activePermission===false));});
test('R3 and enforcement-missing never become runnable',()=>{const r=c.hostCatalog.actions.find(a=>a.id==='machine.network.disable_all');assert.equal(r.risk,'R3');assert.equal(r.readiness,'unsupported');assert.equal(r.runtimeEffectKnown,false);assert.equal(c.hostCatalog.actions.find(a=>a.id==='vivim.network.pause_egress').readiness,'enforcement_missing');});
test('rejects unknown or duplicate Host action IDs',()=>{const ids=c.hostCatalog.actions.map(x=>x.id);assert.equal(ids.length,new Set(ids).size);const resolve=id=>c.hostCatalog.actions.filter(x=>x.id===id);assert.equal(resolve('hq.synthetic.action').length,0);});
test('source/comment/semantic meaning cannot mint Host effect',()=>{assert.ok(c.sourceSemanticWikiCrosswalk.length>8);assert.ok(c.sourceSemanticWikiCrosswalk.every(s=>s.runtimeEffectsAuthorized===false));});
test('TierFlow crosswalk never grants Host authority on its own',()=>{assert.equal(c.tierflow.verifiedMappings,0);assert.equal(c.tierflow.allHostActionsMapped,false);assert.equal(c.hostCatalog.actions.every(a=>a.typeId===null),true);});
test('a second sender, graph, UI store or wiki writer is never normalized as effect owner',()=>{const ks=new Set(owners.graph.map(x=>x.key));assert.equal(ks.size,owners.graph.length);for(const k of ['effect-authority','native-graph-and-engine','studio-provider-sender','tierflow-ui-publisher','dev-wiki-semantic-writer'])assert.ok(ks.has(k));assert.equal(owners.graph.find(g=>g.key==='effect-authority').owner,'B');});
test('source-blob pins are valid and scoped',()=>{assert.equal(delta.coverage.complete,false);assert.ok(delta.records.length>=43);assert.ok(delta.records.every(x=>/^[a-f0-9]{40}$/.test(x.blobSha)&&/^[a-f0-9]{40}$/.test(x.commit)));});
test('document corrected missing path and frozen G absence',()=>{assert.ok(delta.coverage.exceptions.some(x=>x.path==='apps/vivim-host/control/direct-phone.mjs'&&x.result==='NOT_FOUND'));assert.equal(delta.readClaims.gIntegrationBranch,'404_NOT_FOUND');});
test('false PASS/effect assertion prohibited',()=>{assert.equal(ledger.result,'PREPARED_NOT_PROMOTED');assert.equal(ledger.permissions.actionsExecuted,false);assert.ok(ledger.tests.every(t=>!['PASS','TEST_EXECUTED','SECURITY_ACCEPTED'].includes(t.status)));});
test('all authorized writes are under PG00 and no executor or grant added',()=>{assert.ok(ledger.changedPaths.every(p=>p.startsWith(ledger.writePrefix)));assert.equal(owners.graph.find(g=>g.key==='end-user-scheduled-effects').acceptance.startsWith('BLOCKED'),true);});
