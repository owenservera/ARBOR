import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, stat, writeFile, rm } from 'node:fs/promises';
import { createPrivateShares } from '../shares/private-shares.mjs';

const OWNER = 'a'.repeat(32);
const OTHER = 'b'.repeat(32);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'vivim-private-shares-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return { root, shares:createPrivateShares({ dataRoot:root }) };
}
const request = (bytes, headers = {}) => Object.assign(Readable.from([bytes]), {
  headers: { 'content-type':'application/octet-stream', 'content-length': String(bytes.length), ...headers }
});
const options = (overrides = {}) => ({
  name:'Quarterly report.pdf', mime:'application/pdf', bytes:5,
  expiresInHours:24, maxDownloads:2, ...overrides
});
async function ready(shares, input=options(), bytes=Buffer.from('hello')) {
  const row=await shares.reserve(input, OWNER);
  const written=await shares.finish(row.id,row.capability,OWNER,request(bytes));
  return { ...row, written };
}
async function expectCode(promise, status, code) {
  await assert.rejects(promise, e => e?.status === status && e?.code === code);
}

test('Host persists a private share; capability digest is stored but not plaintext', async t => {
  const { root, shares }=await fixture(t);
  const row=await ready(shares,options({passcode:'secret44'}));
  assert.equal(row.state,'uploading');
  assert.equal(row.written.state,'ready');
  assert.equal(row.written.sha256,sha256(Buffer.from('hello')));
  const file=path.join(root,'private-shares',row.id+'.json');
  const record=await readFile(file,'utf8');
  assert.equal(record.includes(row.capability),false);
  assert.equal(record.includes('secret44'),false);
  assert.equal(record.includes('"passHash"'),true);
  assert.equal((await stat(path.join(root,'private-shares',row.id+'.bin'))).size,5);
  const reopened=createPrivateShares({ dataRoot:root });
  const list=await reopened.list(OWNER);
  assert.equal(list.items.length,1);
  assert.equal(list.items[0].id,row.id);
  assert.equal(list.items[0].passcodeRequired,true);
  assert.deepEqual((await reopened.list(OTHER)).items,[]);
  await expectCode(reopened.inspect(row.id,row.capability,''),401,'SHARE_PASSCODE_REQUIRED');
  await expectCode(reopened.inspect(row.id,row.capability,'wrong'),403,'SHARE_PASSCODE_INVALID');
  await expectCode(reopened.inspect(row.id,'0'.repeat(64),'secret44'),404,'SHARE_NOT_FOUND');
  const described=await reopened.inspect(row.id,row.capability,'secret44');
  assert.equal(described.views,1);
  assert.equal((await reopened.download(row.id,row.capability,'secret44')).downloads,1);
});

test('Only the reserving device may upload or revoke a share',async t=>{
  const { shares }=await fixture(t);
  await expectCode(shares.reserve(options(), 'not-a-device-id'),403,'SHARE_OWNER_INVALID');
  const row=await shares.reserve(options(), OWNER);
  await expectCode(shares.finish(row.id,row.capability,OTHER,request(Buffer.from('hello'))),403,'SHARE_OWNER_DENIED');
  await expectCode(shares.finish(row.id,'0'.repeat(64),OWNER,request(Buffer.from('hello'))),403,'SHARE_OWNER_DENIED');
  await expectCode(shares.revoke(row.id,OTHER),403,'SHARE_OWNER_DENIED');
  await shares.finish(row.id,row.capability,OWNER,request(Buffer.from('hello')));
  const revoked=await shares.revoke(row.id,OWNER);
  assert.ok(revoked.revokedAt);
  await expectCode(shares.inspect(row.id,row.capability,''),404,'SHARE_NOT_FOUND');
  await expectCode(shares.download(row.id,row.capability,''),404,'SHARE_NOT_FOUND');
});

test('Upload rejects invalid input, unexpected bytes, duplicate upload, and unsafe names', async t=>{
  const { shares }=await fixture(t);
  await expectCode(shares.reserve(options({ bytes:0 }),OWNER),413,'SHARE_SIZE_INVALID');
  await expectCode(shares.reserve(options({ bytes:10*1024*1024+1 }),OWNER),413,'SHARE_SIZE_INVALID');
  await expectCode(shares.reserve(options({ name:'../..' }),OWNER),400,'SHARE_FILENAME_INVALID');
  await expectCode(shares.reserve(options({ expiresInHours:721 }),OWNER),400,'SHARE_EXPIRY_INVALID');
  await expectCode(shares.reserve(options({ maxDownloads:101 }),OWNER),400,'SHARE_DOWNLOAD_LIMIT_INVALID');
  await expectCode(shares.reserve(options({ passcode:'12345' }),OWNER),400,'SHARE_PASSCODE_INVALID');
  await expectCode(shares.reserve(options({ metadata:'unknown' }),OWNER),400,'SHARE_OPTIONS_INVALID');
  const row=await shares.reserve(options(),OWNER);
  await expectCode(shares.finish(row.id,row.capability,OWNER,request(Buffer.from('1234'))),400,'SHARE_LENGTH_MISMATCH');
  await expectCode(shares.finish(row.id,row.capability,OWNER,request(Buffer.from('123456'))),400,'SHARE_LENGTH_MISMATCH');
  const uploaded=await shares.finish(row.id,row.capability,OWNER,request(Buffer.from('hello'),{'content-length':undefined}));
  assert.equal(uploaded.sha256,sha256('hello'));
  await expectCode(shares.finish(row.id,row.capability,OWNER,request(Buffer.from('hello'))),409,'SHARE_ALREADY_FINALIZED');
});

test('Concurrent download admissions enforce the exact limit and count once each',async t=>{
  const { shares }=await fixture(t);
  const row=await ready(shares,options({ maxDownloads:1 }));
  const results=await Promise.allSettled([
    shares.download(row.id,row.capability,''),
    shares.download(row.id,row.capability,'')
  ]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const failure=results.find(r=>r.status==='rejected')?.reason;
  assert.equal(failure?.status,410);
  assert.equal(failure?.code,'SHARE_DOWNLOAD_LIMIT_REACHED');
  assert.equal((await shares.list(OWNER)).items[0].downloads,1);
});

test('Expiry reclaims bytes, an abandoned reservation is retired, and metadata remains inspectable',async t=>{
  const {root,shares}=await fixture(t);
  const uploaded=await ready(shares);
  const pending=await shares.reserve(options({name:'pending.txt'}),OWNER);
  const store=path.join(root,'private-shares');
  for(const [id,edit] of [
    [uploaded.id,{ expiresAt:new Date(Date.now()-1000).toISOString() }],
    [pending.id,{ createdAt:new Date(Date.now()-30*60_000).toISOString() }]
  ]) {
    const file=path.join(store,id+'.json');
    const record=JSON.parse(await readFile(file,'utf8'));
    Object.assign(record,edit);
    await writeFile(file,JSON.stringify(record));
  }
  const cleaned=await shares.prune();
  assert.equal(cleaned.abandoned,1);
  assert.ok(cleaned.bytesRemoved>=5);
  const all=await shares.list(OWNER);
  assert.equal(all.items.find(x=>x.id===uploaded.id)?.state,'expired');
  assert.equal(all.items.find(x=>x.id===pending.id)?.state,'abandoned');
  assert.equal((await readdir(store)).includes(uploaded.id+'.bin'),false);
  await expectCode(shares.inspect(uploaded.id,uploaded.capability,''),410,'SHARE_EXPIRED');
});

test('A share limits per-device live reservations without hiding other device records',async t=>{
  const { shares }=await fixture(t);
  for(let n=0;n<100;n++) await shares.reserve(options({ name:'file'+n+'.txt',bytes:10 }),OWNER);
  await expectCode(shares.reserve(options(),OWNER),507,'SHARE_STORAGE_QUOTA_REACHED');
  const independent=await shares.reserve(options(),OTHER);
  assert.equal((await shares.list(OTHER)).items.length,1);
  assert.equal((await shares.list(OWNER)).items.length,100);
  await shares.revoke(independent.id,OTHER);
});
