import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, openSync, closeSync, unlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createEnrollment } from '../apk/enrollment.mjs';

test('enrollment rejects forged proof and creates key-backed session only after PC approval', (t) => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-enrollment-'));
  t.after(() => rmSync(dataRoot, { recursive: true, force: true }));
  const origin = 'https://phone.example.ts.net', user = 'owner@example.com';
  const e = createEnrollment({dataRoot, origin, user});
  const {publicKey, privateKey} = generateKeyPairSync('ec', {namedCurve:'prime256v1'});
  const publicKeyPem = publicKey.export({type:'spki',format:'pem'});
  const first = e.startChallenge();
  const transcript = ['vivim-enrollment-v1',first.challengeId,first.challenge,first.nonce,origin,user].join('\\n');
  assert.throws(() => e.prove({challengeId:first.challengeId,publicKeyPem,signature:'AAAA',signedTranscript:transcript}), /INVALID_DEVICE_SIGNATURE/);
  assert.throws(() => e.prove({challengeId:first.challengeId,publicKeyPem,signature:'AAAA',signedTranscript:'attacker'}), /TRANSCRIPT_MISMATCH/);
  const signature = sign('sha256',Buffer.from(transcript),privateKey).toString('base64');
  const grant = e.prove({challengeId:first.challengeId,publicKeyPem,signature,signedTranscript:transcript,requestedScopes:['control:read']});
  assert.equal(grant.status,'pending');
  assert.throws(() => e.createSession({grantId:grant.grantId}), /GRANT_NOT_ACTIVE/);
  assert.ok(!('publicKeyPem' in e.listGrants()[0]));
  e.approveGrant({grantId:grant.grantId,approvedScopes:['control:read'],approvedBy:'pc-owner'});
  assert.throws(() => e.createSession({grantId:grant.grantId,nonce:'a'.repeat(32),timestamp:Date.now(),deviceKeyProof:'AAAA'}), /INVALID_DEVICE_SIGNATURE/);
  const nonce = randomBytes(16).toString('hex'), timestamp = Date.now();
  const sessionTranscript = ['vivim-session-v1',grant.grantId,nonce,String(timestamp),origin,user].join('\\n');
  const deviceKeyProof = sign('sha256',Buffer.from(sessionTranscript),privateKey).toString('base64');
  const active = e.createSession({grantId:grant.grantId,nonce,timestamp,deviceKeyProof});
  assert.equal(active.grantId,grant.grantId);
  assert.equal(e.validateGrant({grantId:grant.grantId,sessionId:active.sessionId}).grantId,grant.grantId);
  assert.throws(() => e.createSession({grantId:grant.grantId,nonce,timestamp,deviceKeyProof}), /SESSION_PROOF_REPLAY/);
  e.revokeGrant({grantId:grant.grantId,revokedBy:'pc-owner'});
  assert.throws(() => e.validateGrant({grantId:grant.grantId,sessionId:active.sessionId}), /GRANT_NOT_ACTIVE/);
});

test('a prior device signature cannot restore an earlier session; approval cannot escalate scope', (t) => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-enrollment-replay-'));
  t.after(() => rmSync(dataRoot, { recursive: true, force: true }));
  const origin = 'https://phone.example.ts.net', user = 'owner@example.com';
  const e = createEnrollment({ dataRoot, origin, user });
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
  const challenge = e.startChallenge();
  const transcript = ['vivim-enrollment-v1', challenge.challengeId, challenge.challenge, challenge.nonce, origin, user].join('\\n');
  const signature = sign('sha256', Buffer.from(transcript), privateKey).toString('base64');
  const { grantId } = e.prove({ challengeId: challenge.challengeId, publicKeyPem, signature, signedTranscript: transcript, requestedScopes: ['relay:read', 'relay:write'] });
  assert.throws(() => e.approveGrant({ grantId, approvedScopes: ['control:execute'], approvedBy: 'owner' }), /INVALID_APPROVED_SCOPES/);
  e.approveGrant({ grantId, approvedScopes: ['relay:read'], approvedBy: 'owner' });
  function session(nonce) {
    const timestamp = Date.now();
    const proof = sign('sha256', Buffer.from(['vivim-session-v1', grantId, nonce, String(timestamp), origin, user].join('\\n')), privateKey).toString('base64');
    return { grantId, nonce, timestamp, deviceKeyProof: proof };
  }
  const a = session(randomBytes(16).toString('hex'));
  const b = session(randomBytes(16).toString('hex'));
  const first = e.createSession(a);
  const second = e.createSession(b);
  assert.throws(() => e.validateGrant({ grantId, sessionId: first.sessionId }), /SESSION_MISMATCH/);
  assert.throws(() => e.createSession(a), /SESSION_PROOF_REPLAY/);
  assert.equal(e.validateGrant({ grantId, sessionId: second.sessionId }).grantId, grantId);
  assert.ok(!('usedSessionNonces' in e.listGrants()[0]));
});

test('invalid owner-approved scopes never activate a pending grant',t=>{
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-grant-atomic-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  const origin='https://phone.example.ts.net',user='owner@example.com';
  const enrollment=createEnrollment({dataRoot,origin,user});
  const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const first=enrollment.startChallenge();
  const signedTranscript=['vivim-enrollment-v1',first.challengeId,first.challenge,first.nonce,origin,user].join('\\n');
  const grant=enrollment.prove({challengeId:first.challengeId,
    publicKeyPem:publicKey.export({type:'spki',format:'pem'}),
    signature:sign('sha256',Buffer.from(signedTranscript),privateKey).toString('base64'),
    signedTranscript,requestedScopes:['relay:read']});
  assert.throws(()=>enrollment.approveGrant({grantId:grant.grantId,
    approvedScopes:['relay:read','control:execute'],approvedBy:'owner'}),/INVALID_APPROVED_SCOPES/);
  assert.equal(enrollment.grantStatus({grantId:grant.grantId}).status,'pending');
  assert.equal(enrollment.listGrants()[0].status,'pending');
});

test('corrupted grant file fails closed; reads and new enrollment do not overwrite grants',t=>{
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-grants-corrupt-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  const dir=path.join(dataRoot,'device-grants');mkdirSync(dir,{recursive:true});
  writeFileSync(path.join(dir,'grants.json'),'{invalid json', 'utf8');
  const authority=createEnrollment({dataRoot,origin:'https://phone.example.ts.net',user:'owner@example.com'});
  assert.throws(()=>authority.listGrants(),/GRANT_STORE_CORRUPT/);
  assert.throws(()=>authority.grantStatus({grantId:'a'.repeat(32)}),/GRANT_STORE_CORRUPT/);
  assert.throws(()=>authority.approveGrant({grantId:'a'.repeat(32),
    approvedScopes:['relay:read'],approvedBy:'owner'}),/GRANT_STORE_CORRUPT/);
});

test('device identity remains stable across independently signed enrollment challenges',t=>{
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-key-identity-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  const origin='https://phone.example.ts.net',user='owner@example.com';
  const authority=createEnrollment({dataRoot,origin,user});
  const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const publicKeyPem=publicKey.export({type:'spki',format:'pem'});
  const prove=()=>{
    const challenge=authority.startChallenge();
    const transcript=['vivim-enrollment-v1',challenge.challengeId,challenge.challenge,challenge.nonce,origin,user].join('\\n');
    return authority.prove({challengeId:challenge.challengeId,publicKeyPem,
      signature:sign('sha256',Buffer.from(transcript),privateKey).toString('base64'),
      signedTranscript:transcript,requestedScopes:['relay:read']});
  };
  const first=prove(),second=prove();
  assert.equal(first.deviceId,second.deviceId);
  assert.notEqual(first.grantId,second.grantId);
  assert.deepEqual(Object.keys(authority.grantStatus({grantId:first.grantId})).sort(),
    ['grantId','status']);
});

test('locked grant writer rejects enrollment without consuming the one-use challenge',t=>{
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-locked-grants-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  const origin='https://phone.example.ts.net',user='owner@example.com';
  const authority=createEnrollment({dataRoot,origin,user});
  const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const challenge=authority.startChallenge();
  const signedTranscript=['vivim-enrollment-v1',challenge.challengeId,challenge.challenge,
    challenge.nonce,origin,user].join('\\n');
  const proof={challengeId:challenge.challengeId,
    publicKeyPem:publicKey.export({type:'spki',format:'pem'}),
    signature:sign('sha256',Buffer.from(signedTranscript),privateKey).toString('base64'),
    signedTranscript,requestedScopes:['relay:read']};
  const lock=path.join(dataRoot,'device-grants','grants.writer.lock');
  const fd=openSync(lock,'wx',0o600);
  try{
    assert.throws(()=>authority.prove(proof),/GRANT_WRITER_BUSY/);
  }finally{closeSync(fd);unlinkSync(lock);}
  assert.equal(authority.prove(proof).status,'pending');
});

test('stale PC approval cannot overwrite concurrent owner revocation',t=>{
  const dataRoot=mkdtempSync(path.join(os.tmpdir(),'vivim-grants-cas-'));
  t.after(()=>rmSync(dataRoot,{recursive:true,force:true}));
  const origin='https://phone.example.ts.net',user='owner@example.com';
  const phone=createEnrollment({dataRoot,origin,user}),owner=createEnrollment({dataRoot,origin:null,user:null});
  const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const challenge=phone.startChallenge();
  const transcript=['vivim-enrollment-v1',challenge.challengeId,challenge.challenge,
    challenge.nonce,origin,user].join('\\n');
  const grant=phone.prove({challengeId:challenge.challengeId,
    publicKeyPem:publicKey.export({type:'spki',format:'pem'}),
    signature:sign('sha256',Buffer.from(transcript),privateKey).toString('base64'),
    signedTranscript:transcript,requestedScopes:['relay:read']});
  let revoked=false;
  const narrowed=new Proxy(['relay:read'],{get(target,key,receiver){
    if(key==='some' && !revoked){
      revoked=true;owner.revokeGrant({grantId:grant.grantId,revokedBy:'pc-owner'});
    }
    return Reflect.get(target,key,receiver);
  }});
  assert.throws(()=>phone.approveGrant({grantId:grant.grantId,
    approvedScopes:narrowed,approvedBy:'pc-owner'}),/GRANT_STORE_CHANGED/);
  assert.equal(phone.grantStatus({grantId:grant.grantId}).status,'revoked');
});
