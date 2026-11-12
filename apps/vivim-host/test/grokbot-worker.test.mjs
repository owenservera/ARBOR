import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createGrokbotWorker } from '../grokbot/worker.mjs';
import { createBridgeStore } from '../../../studio/src/studio/bridge-commands.mjs';

const fixture = fn => async () => {
 const dir=mkdtempSync(path.join(tmpdir(),'vivim-grokbot-'));
 try { await fn(dir); } finally { rmSync(dir,{recursive:true,force:true}); }
};
test('unconfigured adapter leaves queued jobs unclaimed',fixture(async dir=>{
 const store=createBridgeStore({root:dir});
 const job=store.create({text:'inspect status',consumer:'grokbot',stage:'inspect'});
 const worker=createGrokbotWorker({dataRoot:dir});
 assert.equal(worker.status().available,false);
 assert.equal((await worker.runOnce()).state,'unavailable');
 assert.equal(store.get(job.id).status,'queued');
}));
test('confirmed native response is journaled exactly once',fixture(async dir=>{
 const store=createBridgeStore({root:dir});
 const job=store.create({text:'inspect status',consumer:'grokbot',stage:'inspect'});
 let count=0;
 const worker=createGrokbotWorker({dataRoot:dir,adapter:{protocol:'test',async execute({id}){count++;assert.equal(id,job.id);return {confirmed:true,text:'completed'};}}});
 assert.equal((await worker.runOnce()).state,'done');
 assert.equal((await worker.runOnce()).state,'idle');
 assert.equal(count,1);
 assert.equal(store.get(job.id).result,'completed');
}));
test('uncertain adapter never replays a claimed command',fixture(async dir=>{
 const store=createBridgeStore({root:dir});
 const job=store.create({text:'inspect status',consumer:'grokbot',stage:'inspect'});
 let count=0;
 const worker=createGrokbotWorker({dataRoot:dir,adapter:{async execute(){count++;throw new Error('link dropped');}}});
 assert.equal((await worker.runOnce()).state,'uncertain');
 assert.equal((await worker.runOnce()).state,'idle');
 assert.equal(store.get(job.id).status,'claimed');
 assert.equal(count,1);
}));
