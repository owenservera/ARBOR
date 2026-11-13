import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createMediaStreamGrantGuard } from '../media/stream-guard.mjs';

function sink(onChunk = () => {}) {
  return new Writable({write(chunk,encoding,callback) {
    try { onChunk(chunk); callback(); } catch(error) { callback(error); }
  }});
}
test('stream guard permits only live Host control:read grants and checks final chunk', async()=>{
  let checks=0,bytes=0;
  const gate=createMediaStreamGrantGuard({
    grantId:'grant',sessionId:'session',now:()=>1000,
    validateGrant({grantId,sessionId}) {
      assert.equal(grantId,'grant');assert.equal(sessionId,'session');
      checks++;return {scopes:['control:read']};
    }
  });
  await pipeline(Readable.from(Array.from({length:8},()=>Buffer.alloc(64*1024))),
    gate,sink(chunk=>{bytes+=chunk.length;}));
  assert.equal(bytes,8*64*1024);
  assert.ok(checks>=3,'periodic checks and final check must run');
});
test('revoking during a stream terminates it before all bytes are delivered',async()=>{
  let revoked=false,delivered=0;
  const gate=createMediaStreamGrantGuard({
    grantId:'grant',sessionId:'session',now:()=>1000,
    validateGrant() {
      if(revoked)throw Object.assign(new Error('GRANT_REVOKED'),{status:403});
      return {scopes:['control:read']};
    }
  });
  await assert.rejects(pipeline(Readable.from(Array.from({length:12},()=>Buffer.alloc(64*1024))),
    gate,sink(chunk=>{
      delivered+=chunk.length;
      if(delivered>=3*64*1024)revoked=true;
    })),/GRANT_REVOKED/);
  assert.ok(delivered<12*64*1024,'a revoked grant cannot stream the remaining file');
});
test('a valid device without media read scope is always refused',async()=>{
  await assert.rejects(pipeline(Readable.from([Buffer.alloc(2)]),
    createMediaStreamGrantGuard({
      grantId:'g',sessionId:'s',validateGrant:()=>({scopes:['relay:write']})
    }),sink()),/MEDIA_STREAM_SCOPE_DENIED/);
});
