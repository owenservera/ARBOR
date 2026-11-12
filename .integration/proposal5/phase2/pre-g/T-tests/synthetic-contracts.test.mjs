// Staged policy/fixture conformance only. Does not import ARBOR runtime.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {schema,synthetic,records}=JSON.parse(readFileSync(new URL('./fixtures.json',import.meta.url),'utf8'));
function project(row){
 if(row.kind==='source')return !row.sourcePresent||!row.receipt?'UNVERIFIED':'EVIDENCE_ONLY';
 if(row.kind==='command')return row.negated||row.quoted||!row.actionId||!row.grant?'DENY':'REQUIRES_HOST_CONFIRMATION';
 if(row.kind==='wiki')return !row.grant?'DENY':row.revision!==row.sourceRevision?'STALE':'READ_ONLY';
 if(row.kind==='chronos')return 'NO_EFFECT';
 if(row.kind==='voice')return row.text.slice(...row.span)!==row.evidence?'REJECT':!row.reviewed?'DRAFT_ONLY':'HOST_AUTHORIZATION_REQUIRED';
 throw Error('UNKNOWN_KIND');
}
test('synthetic-only fixture and unique IDs',()=>{assert.equal(schema,'arbor.p5.p2-t-synthetic/1');assert.equal(synthetic,true);assert.equal(new Set(records.map(r=>r.id)).size,records.length)});
for(const r of records)test('proposed deny/read contract: '+r.id,()=>assert.equal(project(r),r.expected));
test('source delta is staging only and every record has an owner',()=>{const d=JSON.parse(readFileSync(new URL('./source-delta.json',import.meta.url),'utf8'));assert.equal(d.disposition,'PREPARED_NOT_PROMOTED');for(const x of d.entries){assert.ok(x.owner);assert.ok(['ALREADY_IMPORTED','TEST_ONLY','ADAPTER_REQUIRED','DESIGN_ONLY','DEFERRED','BLOCKED'].includes(x.status))}});
