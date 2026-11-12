// PG03 fixture-only assertions. These DO NOT import Host, PWA, Tauri or donor Rock implementation.
// Run with node --test this-file.mjs. A green fixture is NOT a security or device PASS.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url),'utf8'));
const neg=read('NEGATIVE-CASES.json'),store=read('STORAGE-CLASSIFICATION.json'),src=read('SOURCE-DELTA.json');
test('negative matrix owns distinct synthetic IDs, non-accepted status and outcomes',()=>{
 assert.equal(neg.schema,'arbor.proposal5.pg03-negative-cases/1');
 assert.ok(neg.cases.length>=20);
 assert.equal(new Set(neg.cases.map(c=>c.id)).size,neg.cases.length);
 for(const c of neg.cases){assert.ok(c.scenario&&c.owner&&c.expected);assert.equal(c.status,'SPECIFIED_UNRUN');assert.equal(c.runtimeAsserted,false);}
});
test('originals, receipts, DCB, browser key and kernel are protected from auto delete',()=>{
 const by=Object.fromEntries(store.items.map(x=>[x.id,x]));
 for(const id of ['originals','grants','control-journal','host-ledger','studio-dcb','memory','tierflow-world','hq-kernel','browser-device-key']){
   assert.equal(by[id].class,'PROTECTED_UNIQUE');
   assert.equal(by[id].compaction==='NEVER_AUTO'||by[id].compaction==='NO_AUTO'||by[id].compaction==='WRITER_TRANSACTION_AND_BACKUP_ONLY'||by[id].compaction==='ONLY_OWNER_CONTROLLED_BACKUP_RESTORE',true);
 }
 assert.equal(store.policy.autoDeleteOriginals,false);assert.equal(store.policy.autoDeleteReceipts,false);
});
test('source-delta refs are immutable SHA-shaped and not G claims',()=>{
 assert.ok(src.entries.length>=20);
 for(const e of src.entries){assert.match(e.blobSha,/^[a-f0-9]{40}$/);assert.match(e.commit,/^[a-f0-9]{40}$/);assert.equal(e.gMerged,false);assert.equal(e.verifiedRuntime,false);}
 assert.equal(src.notIntegratedIntoG,true);
});
test('physical bytes are explicitly unmeasured; reserve and Full cannot bypass physical floor',()=>{
 assert.equal(store.measuredOnDevice,false);
 assert.equal(store.volumeInventory.physicalBytesObserved,false);
 assert.equal(store.rockResearch.enforcePhysicalReserveInAllModes,true);
 for(const x of store.items)assert.equal(x.bytes,null);
 assert.equal(store.policy.autoVacuum,false);
});
test('all three security blockers and no-APK policy have adversarial cases',()=>{
 for(const id of ['AUTH-01','AUTH-02','AUTH-03','AUTH-05','AUTH-07','PWA-01','PACKAGE-01','STORAGE-01','STORAGE-04','STORAGE-07']){
   assert.ok(neg.cases.some(x=>x.id===id));
 }
});
