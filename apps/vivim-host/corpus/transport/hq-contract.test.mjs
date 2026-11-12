// Cross-repo conformance: consumes the EXACT HQ contract implementation and fixtures
// when the canonical sibling checkout is present. This is deliberately SKIPPED in
// an isolated checkout; a fake copy of the HQ validator would be misleading.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCorpusTransferProtocol } from './protocol.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const hq=process.env.VIVIM_REPOS_HQ_PATH || path.resolve(here,'../../../../../repos-hq');
const validatorPath=path.join(hq,'hq/lib/personal-corpus-contract.mjs');
const fixturePath=path.join(hq,'contracts/personal-corpus/fixtures.v1.json');
const present=existsSync(validatorPath) && existsSync(fixturePath);
test('all four exact canonical HQ fixtures are accepted as immutable, unapproved evidence',
  {skip:present?false:'repos-hq sibling checkout or VIVIM_REPOS_HQ_PATH not available'}, async t=>{
  const {validateCorpusCapture,canonicalCorpusJson}=await import(pathToFileURL(validatorPath));
  const raw=readFileSync(fixturePath,'utf8');
  const fixtures=JSON.parse(raw);
  assert.equal(fixtures.schema,'vivim.corpus-fixtures/1');
  assert.equal(fixtures.valid.length,4);
  const dir=mkdtempSync(path.join(tmpdir(),'vivim-corpus-canonical-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const p=createCorpusTransferProtocol({dataRoot:dir,validateCapture:validateCorpusCapture,
    canonicalCapture:canonicalCorpusJson,
    authorizeDevice:()=>({deviceId:'device-canonical',grantId:'grant-canonical',scopes:['corpus:upload']}),
    approveTransfer:async ({deviceId,grantId,expiresAt,events})=>({decision:'approved',approvalId:'approval-canonical',deviceId,grantId,expiresAt,events}),
    persistAccepted:async()=>{throw Error('No synthetic Host acceptance allowed');},
    lookupAccepted:async()=>null});
  for(const e of fixtures.valid)assert.equal(validateCorpusCapture(e).ok,true);
  const s=await p.issueScope({auth:{},events:fixtures.valid,ttlMs:60000});
  assert.equal(s.events.length,4);
  for(const e of fixtures.valid){
    const v=p.inspect({auth:{},scopeId:s.scopeId,eventId:e.eventId});
    assert.equal(v.state,'receiving');
    assert.equal(v.cursor,0);
  }
});
