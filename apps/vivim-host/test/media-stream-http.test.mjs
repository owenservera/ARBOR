import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { generateKeyPairSync, sign, randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { createHostServer } from '../server.mjs';
import { createEnrollment } from '../apk/enrollment.mjs';
import { createMediaPlaybackService } from '../media/playback.mjs';

test('stream uses a paired owner ticket, exact file and 200/206/416 semantics', async t => {
  const dir=await mkdtemp(path.join(os.tmpdir(),'vivim-media-http-'));
  const dataRoot=path.join(dir,'host'),storeDir=path.join(dir,'store'),filesRoot=path.join(dir,'files');
  await Promise.all([mkdir(dataRoot),mkdir(storeDir),mkdir(filesRoot)]);
  const bytes=Buffer.from('0123456789abcdefghij');
  await writeFile(path.join(filesRoot,'sample.mp4'),bytes);
  await writeFile(path.join(storeDir,'library.json'),JSON.stringify({version:1,entries:[
    {id:'movie-one',kind:'movie',title:'Sample',state:'complete',sourceUrl:'https://secret.invalid'}
  ]}));
  await writeFile(path.join(storeDir,'playback.json'),JSON.stringify({version:1,entries:[
    {libraryId:'movie-one',relativePath:'sample.mp4'}
  ]}));
  const origin='https://player.example.ts.net', user='owner@example.com';
  const server=createHostServer({dataRoot,directPhone:{origin,user,
    mediaPlayback:createMediaPlaybackService({storeDir,filesRoot})}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{
    await new Promise(resolve=>server.close(resolve));
    await rm(dir,{recursive:true,force:true,maxRetries:10,retryDelay:250});
  });
  const authority={host:'player.example.ts.net','x-forwarded-proto':'https',
    'tailscale-user-login':user};
  let device={};
  const call=(url,{method='GET',headers={},body}={})=>new Promise((resolve,reject)=>{
    const req=http.request({host:'127.0.0.1',port:server.address().port,
      path:url,method,headers:{...authority,...device,...headers}},res=>{
      const chunks=[];
      res.on('data',chunk=>chunks.push(chunk));
      res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));
    });
    req.on('error',reject);req.end(body);
  });
  const json=result=>JSON.parse(result.body.toString('utf8'));
  assert.equal((await call('/mobile/api/media/library')).status,401);
  assert.equal((await call('/mobile/api/media/open',{method:'POST',headers:{
    origin,'x-vivim-media':'1','content-type':'application/json'},body:'{}'})).status,401);
  const pair=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const begin=json(await call('/mobile/api/enrollment/start',{method:'POST',
    headers:{'content-type':'application/json'},body:'{}'}));
  const signed=['vivim-enrollment-v1',begin.challengeId,begin.challenge,begin.nonce,origin,user].join('\\n');
  const grant=json(await call('/mobile/api/enrollment/prove',{method:'POST',
    headers:{'content-type':'application/json'},body:JSON.stringify({
      challengeId:begin.challengeId,
      publicKeyPem:pair.publicKey.export({type:'spki',format:'pem'}),
      signature:sign('sha256',Buffer.from(signed),pair.privateKey).toString('base64'),
      signedTranscript:signed,requestedScopes:['control:read']
    })}));
  assert.equal(grant.status,'pending');
  const owner=createEnrollment({dataRoot,origin:null,user:null});
  owner.approveGrant({grantId:grant.grantId,approvedScopes:['control:read'],
    approvedBy:'desktop-owner'});
  const nonce=randomBytes(16).toString('hex'),timestamp=Date.now();
  const text=['vivim-session-v1',grant.grantId,nonce,String(timestamp),origin,user].join('\\n');
  const session=json(await call('/mobile/api/enrollment/session',{method:'POST',
    headers:{'content-type':'application/json'},body:JSON.stringify({
      grantId:grant.grantId,nonce,timestamp,
      deviceKeyProof:sign('sha256',Buffer.from(text),pair.privateKey).toString('base64')
    })}));
  device={'x-vivim-grant-id':grant.grantId,'x-vivim-device-session':session.sessionId};
  const listing=json(await call('/mobile/api/media/library'));
  assert.equal(listing.state,'ready');
  assert.equal(listing.offset,0);
  const emptyPage=json(await call('/mobile/api/media/library?offset=25'));
  assert.equal(emptyPage.offset,25);
  assert.equal(emptyPage.shown,0);
  assert.equal((await call('/mobile/api/media/library?offset=-1')).status,400);
  assert.equal((await call('/mobile/api/media/library?offset=0&offset=25')).status,400);
  assert.equal((await call('/mobile/api/media/library?foreign=1')).status,400);
  assert.equal(listing.playback,'available');
  assert.equal(listing.items[0].playable,true);
  assert.doesNotMatch(JSON.stringify(listing),/sample\.mp4|secret\.invalid|sourceUrl/);
  const id=listing.items[0].mediaId;
  const body=JSON.stringify({mediaId:id});
  assert.equal((await call('/mobile/api/media/open',{method:'POST',
    headers:{origin:'https://evil.invalid','x-vivim-media':'1',
      'content-type':'application/json'},body})).status,403);
  const approved=await call('/mobile/api/media/open',{method:'POST',
    headers:{origin,'x-vivim-media':'1','content-type':'application/json'},body});
  assert.equal(approved.status,200);
  const route=json(approved).url;
  assert.equal(route,'/mobile/api/media/stream/'+id);
  assert.equal(json(approved).bytes,20);
  const cookie=approved.headers['set-cookie'][0].split(';')[0];
  assert.match(approved.headers['set-cookie'][0],/Secure; HttpOnly; SameSite=Strict/);
  assert.equal((await call(route)).status,401);
  const full=await call(route,{headers:{cookie}});
  assert.equal(full.status,200);assert.deepEqual(full.body,bytes);
  assert.equal(full.headers['cache-control'],'private, no-store');
  const range=await call(route,{headers:{cookie,range:'bytes=4-9'}});
  assert.equal(range.status,206);
  assert.equal(range.body.toString(),'456789');
  assert.equal(range.headers['content-range'],'bytes 4-9/20');
  const suffix=await call(route,{headers:{cookie,range:'bytes=-3'}});
  assert.equal(suffix.status,206);assert.equal(suffix.body.toString(),'hij');
  const invalid=await call(route,{headers:{cookie,range:'bytes=100-200'}});
  assert.equal(invalid.status,416);
  assert.equal(invalid.headers['content-range'],'bytes */20');
  const head=await call(route,{method:'HEAD',headers:{cookie,range:'bytes=0-2'}});
  assert.equal(head.status,206);
  assert.equal(head.headers['content-length'],'3');
  assert.equal(head.body.length,0);
  assert.equal((await call('/mobile/api/media/stream/'+'f'.repeat(32),
    {headers:{cookie}})).status,401);
  const renewed=await call('/mobile/api/media/open',{method:'POST',
    headers:{origin,'x-vivim-media':'1','content-type':'application/json'},body});
  assert.equal(renewed.status,200);
  const currentCookie=renewed.headers['set-cookie'][0].split(';')[0];
  assert.notEqual(currentCookie,cookie);
  assert.equal((await call(route,{headers:{cookie}})).status,401);
  assert.equal((await call(route,{headers:{cookie:currentCookie}})).status,200);
  assert.equal((await call('/mobile/api/media/close',{method:'POST',headers:{
    origin:'https://evil.invalid','x-vivim-media':'1'}})).status,403);
  const closed=await call('/mobile/api/media/close',{method:'POST',headers:{
    origin,'x-vivim-media':'1'}});
  assert.equal(closed.status,200);
  assert.match(closed.headers['set-cookie'][0],/Max-Age=0/);
  assert.equal((await call(route,{headers:{cookie:currentCookie}})).status,401);
  const last=await call('/mobile/api/media/open',{method:'POST',headers:{
    origin,'x-vivim-media':'1','content-type':'application/json'},body});
  assert.equal(last.status,200);
  const lastCookie=last.headers['set-cookie'][0].split(';')[0];
  owner.revokeGrant({grantId:grant.grantId,revokedBy:'desktop-owner'});
  assert.ok([401,403].includes((await call(route,{headers:{cookie:lastCookie}})).status));
});
