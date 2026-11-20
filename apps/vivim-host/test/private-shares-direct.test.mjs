import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createEnrollment } from '../apk/enrollment.mjs';
import { createHostServer } from '../server.mjs';

test('Direct PWA private share: grant, origin, upload, download limit and revoke', async t => {
  const dataRoot = mkdtempSync(path.join(os.tmpdir(), 'vivim-share-direct-'));
  const origin = 'https://shares.example.ts.net', user = 'owner@example.com';
  const runtime = createBootstrapRuntime({dataRoot});
  const server = createHostServer({
    dataRoot, bootstrap: runtime,
    onboarding:{ phoneSeen:()=>{},primary:()=>null },
    directPhone:{ origin, user }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    runtime.close(); rmSync(dataRoot,{recursive:true,force:true});
  });
  const trusted = { host:'shares.example.ts.net', 'x-forwarded-proto':'https',
    'tailscale-user-login':user };
  let approved = {};
  const call = (url, { method='GET', headers={}, body }={}) => new Promise((resolve,reject)=>{
    const request=http.request({
      host:'127.0.0.1',port:server.address().port,path:url,method,
      headers:{...trusted,...approved,...headers}
    },res=>{
      const chunks=[];
      res.on('data',chunk=>chunks.push(chunk));
      res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));
    });
    request.on('error',reject);
    request.end(body);
  });
  const parse = response => JSON.parse(response.body.toString());
  const createBody=JSON.stringify({name:'note.txt',mime:'text/plain',bytes:5,
    expiresInHours:1,maxDownloads:1,passcode:'secret44'});
  assert.equal((await call('/mobile/api/shares')).status,401);
  assert.equal((await call('/mobile/api/shares', {method:'POST',headers:{
    origin,'x-vivim-share':'1','content-type':'application/json'
  },body:createBody})).status,401);
  assert.equal((await call('/mobile/private-shares-ui.mjs')).status,200);
  const shell=await call('/mobile/');
  assert.equal(shell.status,200);
  assert.match(shell.headers['content-security-policy'], /img-src[^;]*blob:/);
  assert.match(shell.headers['content-security-policy'], /frame-src blob:/);
  const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const publicKeyPem=publicKey.export({type:'spki',format:'pem'});
  const challenge=parse(await call('/mobile/api/enrollment/start',{
    method:'POST',headers:{'content-type':'application/json'},body:'{}'
  }));
  const transcript=['vivim-enrollment-v1',challenge.challengeId,challenge.challenge,
    challenge.nonce,origin,user].join('\\n');
  const proof=sign('sha256',Buffer.from(transcript),privateKey).toString('base64');
  const requestedScopes=['control:read','control:execute'];
  const grant=parse(await call('/mobile/api/enrollment/prove',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({challengeId:challenge.challengeId,publicKeyPem,signature:proof,
      signedTranscript:transcript,requestedScopes})
  }));
  assert.equal(grant.status,'pending');
  const owner=createEnrollment({dataRoot,origin:null,user:null});
  owner.approveGrant({grantId:grant.grantId,approvedScopes:requestedScopes,approvedBy:'desktop-owner'});
  const nonce=randomBytes(16).toString('hex'),timestamp=Date.now();
  const signed=['vivim-session-v1',grant.grantId,nonce,String(timestamp),origin,user].join('\\n');
  const session=parse(await call('/mobile/api/enrollment/session',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({grantId:grant.grantId,nonce,timestamp,
      deviceKeyProof:sign('sha256',Buffer.from(signed),privateKey).toString('base64')})
  }));
  approved={'x-vivim-grant-id':grant.grantId,'x-vivim-device-session':session.sessionId};
  assert.equal((await call('/mobile/api/shares')).status,200);
  assert.equal((await call('/mobile/api/shares',{
    method:'POST',headers:{origin:'https://evil.example','x-vivim-share':'1',
      'content-type':'application/json'},body:createBody
  })).status,403);
  assert.equal((await call('/mobile/api/shares',{
    method:'POST',headers:{origin,'content-type':'application/json'},body:createBody
  })).status,403);
  const created=await call('/mobile/api/shares',{
    method:'POST',headers:{origin,'x-vivim-share':'1','content-type':'application/json'},
    body:createBody
  });
  assert.equal(created.status,201,created.body.toString());
  const row=parse(created);
  assert.match(row.id,/^[a-f0-9]{32}$/);
  assert.match(row.capability,/^[a-f0-9]{64}$/);
  const route='/mobile/api/shares/'+row.id;
  assert.equal((await call(route+'/content',{
    method:'PUT',headers:{origin:'https://evil.example','x-vivim-share':'1',
      'x-vivim-share-token':row.capability,'content-type':'application/octet-stream'},
    body:Buffer.from('hello')
  })).status,403);
  const completed=await call(route+'/content',{
    method:'PUT',headers:{origin,'x-vivim-share':'1','x-vivim-share-token':row.capability,
      'content-type':'application/octet-stream'},
    body:Buffer.from('hello')
  });
  assert.equal(completed.status,200,completed.body.toString());
  assert.equal(parse(completed).state,'ready');
  assert.equal((await call(route+'/meta',{headers:{
    'x-vivim-share-token':row.capability
  }})).status,401);
  assert.equal((await call(route+'/meta',{headers:{
    'x-vivim-share-token':row.capability,'x-vivim-passcode':'wrong'
  }})).status,403);
  assert.equal((await call(route+'/meta',{headers:{
    'x-vivim-share-token':row.capability,'x-vivim-passcode':'secret44'
  }})).status,200);
  const downloaded=await call(route+'/download',{headers:{
    'x-vivim-share-token':row.capability,'x-vivim-passcode':'secret44'
  }});
  assert.equal(downloaded.status,200,downloaded.body.toString());
  assert.equal(downloaded.body.toString(),'hello');
  assert.match(downloaded.headers['content-disposition'],'attachment');
  assert.equal((await call(route+'/download',{headers:{
    'x-vivim-share-token':row.capability,'x-vivim-passcode':'secret44'
  }})).status,410);
  assert.equal((await call(route,{method:'DELETE',headers:{origin,'x-vivim-share':'1'}})).status,200);
  assert.equal((await call(route+'/meta',{headers:{
    'x-vivim-share-token':row.capability,'x-vivim-passcode':'secret44'
  }})).status,404);
  owner.revokeGrant({grantId:grant.grantId,revokedBy:'desktop-owner'});
  assert.equal((await call('/mobile/api/shares')).status,403);
  assert.equal((await call(route+'/download',{headers:{
    'x-vivim-share-token':row.capability,'x-vivim-passcode':'secret44'
  }})).status,403);
});
