import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate} from './schema-validator.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'../../contracts/hq-version-intelligence');
const load=(k,name)=>JSON.parse(readFileSync(join(root,k,name+'.json'),'utf8'));
const ex=k=>load('examples',k+'.example');
const sch=k=>load('schemas/v1',k+'.schema');
test('conditional: similarity cannot become equivalence without owner receipt',()=>{
 const v=ex('identity-crosswalk');v.candidates[0].disposition='CONFIRMED_EQUIVALENT';
 assert.ok(validate(sch('identity-crosswalk'),v).length>0);
 v.candidates[0].ownerConfirmed=true;v.candidates[0].ownerReceiptRef='owner-ledger:ack';
 assert.deepEqual(validate(sch('identity-crosswalk'),v),[]);
});
test('conditional: source blob can never self-declare RUNTIME_VERIFIED',()=>{
 const v=ex('evidence-receipt');v.status='RUNTIME_VERIFIED';
 assert.ok(validate(sch('evidence-receipt'),v).length>0);
});
test('conditional: executed_test requires observed command, exit and environment',()=>{
 const v=ex('evidence-receipt');v.kind='executed_test';v.status='TEST_EXECUTED';
 assert.ok(validate(sch('evidence-receipt'),v).length>0);
 v.command='node --test';v.exitCode=0;v.environment='Node 24 Linux actual receipt';
 assert.deepEqual(validate(sch('evidence-receipt'),v),[]);
});
test('conditional: Host ok requires result digest and receipts',()=>{
 const v=ex('host-read-result');v.status='ok';delete v.errorCode;
 assert.ok(validate(sch('host-read-result'),v).length>0);
 v.resultDigest='e'.repeat(64);v.receipts=['real-host-grant-receipt:example'];
 assert.deepEqual(validate(sch('host-read-result'),v),[]);
});
test('conditional: symlink manifest may only be blocked/unsupported',()=>{
 const v=ex('manifest');v.entries[0].kind='symlink';
 assert.ok(validate(sch('manifest'),v).length>0);
 v.entries[0].symlinkTarget='../private';v.entries[0].parseStatus='blocked';
 assert.deepEqual(validate(sch('manifest'),v),[]);
});
