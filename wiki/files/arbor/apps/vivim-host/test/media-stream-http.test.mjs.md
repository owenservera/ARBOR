# File: apps/vivim-host/test/media-stream-http.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/media-stream-http.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8075 B |
| Lines | 135 |
| Hash | 2b568ba827f3 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dir | const | 13 | no | const dir=await mkdtemp(path.join(os.tmpdir(),&#39;vivim-media-http-&#39;)); |
| dataRoot | const | 14 | no | const dataRoot=path.join(dir,&#39;host&#39;),storeDir=path.join(dir,&#39;store&#39;),filesRoot=path.join(dir,&#39;files&#39;); |
| bytes | const | 16 | no | const bytes=Buffer.from(&#39;0123456789abcdefghij&#39;); |
| origin | const | 24 | no | const origin=&#39;https://player.example.ts.net&#39;, user=&#39;owner@example.com&#39;; |
| server | const | 25 | no | const server=createHostServer({dataRoot,directPhone:{origin,user, mediaPlayback:createMediaPlaybackService({storeDir,filesRoot})}}); |
| authority | const | 32 | no | const authority={host:&#39;player.example.ts.net&#39;,&#39;x-forwarded-proto&#39;:&#39;https&#39;, |
| device | variable | 34 | no | let device={}; |
| call | function | 35 | no | const call=(url,{method=&#39;GET&#39;,headers={},body}={})=&gt;new Promise((resolve,reject)=&gt;{ const req=http.request({host:&#39;127.0.0.1&#39;,port:server.address().port, path:url,method,headers:{...authority,...devic… |
| req | const | 36 | no | const req=http.request({host:&#39;127.0.0.1&#39;,port:server.address().port, path:url,method,headers:{...authority,...device,...headers}},res=&gt;{ const chunks=[]; res.on(&#39;data&#39;,chunk=&gt;chunks.push(chunk)); res… |
| chunks | const | 38 | no | const chunks=[]; |
| json | function | 44 | no | const json=result=&gt;JSON.parse(result.body.toString(&#39;utf8&#39;)); |
| pair | const | 48 | no | const pair=generateKeyPairSync(&#39;ec&#39;,{namedCurve:&#39;prime256v1&#39;}); |
| signed | const | 51 | no | const signed=[&#39;vivim-enrollment-v1&#39;,begin.challengeId,begin.challenge,begin.nonce,origin,user].join(&#39;\\\\n&#39;); |
| grant | const | 52 | no | const grant=json(await call(&#39;/mobile/api/enrollment/prove&#39;,{method:&#39;POST&#39;, headers:{&#39;content-type&#39;:&#39;application/json&#39;},body:JSON.stringify({ challengeId:begin.challengeId, publicKeyPem:pair.publicKey… |
| owner | const | 60 | no | const owner=createEnrollment({dataRoot,origin:null,user:null}); |
| nonce | const | 63 | no | const nonce=randomBytes(16).toString(&#39;hex&#39;),timestamp=Date.now(); |
| text | const | 64 | no | const text=[&#39;vivim-session-v1&#39;,grant.grantId,nonce,String(timestamp),origin,user].join(&#39;\\\\n&#39;); |
| session | const | 65 | no | const session=json(await call(&#39;/mobile/api/enrollment/session&#39;,{method:&#39;POST&#39;, headers:{&#39;content-type&#39;:&#39;application/json&#39;},body:JSON.stringify({ grantId:grant.grantId,nonce,timestamp, deviceKeyProof:… |
| listing | const | 71 | no | const listing=json(await call(&#39;/mobile/api/media/library&#39;)); |
| emptyPage | const | 74 | no | const emptyPage=json(await call(&#39;/mobile/api/media/library?offset=25&#39;)); |
| id | const | 83 | no | const id=listing.items[0].mediaId; |
| body | const | 84 | no | const body=JSON.stringify({mediaId:id}); |
| approved | const | 88 | no | const approved=await call(&#39;/mobile/api/media/open&#39;,{method:&#39;POST&#39;, headers:{origin,&#39;x-vivim-media&#39;:&#39;1&#39;,&#39;content-type&#39;:&#39;application/json&#39;},body}); |
| route | const | 91 | no | const route=json(approved).url; |
| cookie | const | 94 | no | const cookie=approved.headers[&#39;set-cookie&#39;][0].split(&#39;;&#39;)[0]; |
| full | const | 97 | no | const full=await call(route,{headers:{cookie}}); |
| suffix | const | 104 | no | const suffix=await call(route,{headers:{cookie,range:&#39;bytes=-3&#39;}}); |
| invalid | const | 106 | no | const invalid=await call(route,{headers:{cookie,range:&#39;bytes=100-200&#39;}}); |
| head | const | 109 | no | const head=await call(route,{method:&#39;HEAD&#39;,headers:{cookie,range:&#39;bytes=0-2&#39;}}); |
| renewed | const | 115 | no | const renewed=await call(&#39;/mobile/api/media/open&#39;,{method:&#39;POST&#39;, headers:{origin,&#39;x-vivim-media&#39;:&#39;1&#39;,&#39;content-type&#39;:&#39;application/json&#39;},body}); |
| currentCookie | const | 118 | no | const currentCookie=renewed.headers[&#39;set-cookie&#39;][0].split(&#39;;&#39;)[0]; |
| closed | const | 124 | no | const closed=await call(&#39;/mobile/api/media/close&#39;,{method:&#39;POST&#39;,headers:{ origin,&#39;x-vivim-media&#39;:&#39;1&#39;}}); |
| last | const | 129 | no | const last=await call(&#39;/mobile/api/media/open&#39;,{method:&#39;POST&#39;,headers:{ origin,&#39;x-vivim-media&#39;:&#39;1&#39;,&#39;content-type&#39;:&#39;application/json&#39;},body}); |
| lastCookie | const | 132 | no | const lastCookie=last.headers[&#39;set-cookie&#39;][0].split(&#39;;&#39;)[0]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:http | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| node:crypto | import | 6 | external |
| node:fs/promises | import | 7 | external |
| ../server.mjs | import | 8 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| ../apk/enrollment.mjs | import | 9 | [apps/vivim-host/apk/enrollment.mjs](../apk/enrollment.mjs.md) |
| ../media/playback.mjs | import | 10 | [apps/vivim-host/media/playback.mjs](../media/playback.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 136 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
