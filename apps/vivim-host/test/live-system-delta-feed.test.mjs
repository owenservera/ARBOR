import test from 'node:test';
import assert from 'node:assert/strict';
import {createLiveSystemDeltaFeed} from '../control/live-system-delta-feed.mjs';
const digest=n=>String(n).padStart(64,'0');
const frame=(revision,sourceRevision=revision,extra={})=>({
  schema:'vivim.host-live-system/1',state:'source-backed',epoch:'host.test',revision,
  authority:'read-only-projection',executionAuthorized:false,effectPerformed:false,
  coverage:{complete:false},regions:[{id:'phone.composer',kind:'input',
    sourceId:'host.first-contact-composer',viewRevision:revision,sourceRevision,
    freshness:'current',exposure:'owner',digest:digest(revision),data:{draft:'A'+revision},writable:[]}],
  ...extra
});
test('new observers get owner snapshot and later only changed source-backed regions',async()=>{
  const feed=createLiveSystemDeltaFeed();
  assert.equal(feed.publish(frame(1)),true);
  const first=await feed.changes();
  assert.equal(first.state,'snapshot');assert.equal(first.sequence,1);
  assert.equal(first.regions[0].data.draft,'A1');
  assert.equal(feed.publish(frame(1)),false);
  assert.equal((await feed.changes({epoch:'host.test',after:1})).state,'idle');
  assert.equal(feed.publish(frame(2)),true);
  const delta=await feed.changes({epoch:'host.test',after:1});
  assert.equal(delta.state,'delta');assert.equal(delta.events.length,1);
  assert.equal(delta.events[0].region.data.draft,'A2');
  feed.dispose();
});
test('waiting owner subscriber wakes on an actual Rust revision, not a fabricated poll',async()=>{
  const feed=createLiveSystemDeltaFeed();feed.publish(frame(1));
  const waiting=feed.changes({epoch:'host.test',after:1,waitMs:1000});
  feed.publish(frame(2));
  const next=await waiting;
  assert.equal(next.state,'delta');assert.equal(next.events[0].sourceRevision,2);
  feed.dispose();
});
test('stale, tampered or same-revision source rejects without advancing cursor',async()=>{
  const feed=createLiveSystemDeltaFeed();feed.publish(frame(1));
  assert.throws(()=>feed.publish(frame(1,99)),{code:'LIVE_FEED_SAME_REVISION_CONFLICT'});
  feed.publish(frame(2));
  assert.throws(()=>feed.publish(frame(1)),{code:'LIVE_FEED_STALE_SOURCE'});
  assert.throws(()=>feed.publish(frame(3,3,{regions:[{id:'private',exposure:'owner',digest:digest(3),viewRevision:3,sourceRevision:3}]})),
    {code:'LIVE_FEED_UNTRUSTED_PROJECTION'});
  assert.equal((await feed.changes({epoch:'host.test',after:2})).state,'idle');
  feed.dispose();
});
test('epoch changes reset cursors and invalid waits fail closed',async()=>{
  const feed=createLiveSystemDeltaFeed();feed.publish(frame(1));
  feed.publish(frame(1,1,{epoch:'host.second'}));
  assert.equal((await feed.changes({epoch:'host.test',after:1})).state,'reset');
  await assert.rejects(feed.changes({epoch:'host.second',after:1,waitMs:15001}),
    {code:'LIVE_FEED_WAIT_INVALID'});
  feed.dispose();
});
test('bounded ring reports gaps instead of silently omitting old region updates',async()=>{
  const feed=createLiveSystemDeltaFeed();
  for(let seq=1;seq<=145;seq++)feed.publish(frame(seq));
  const gap=await feed.changes({epoch:'host.test',after:1});
  assert.equal(gap.state,'gap');assert.equal(gap.sequence,145);
  const delta=await feed.changes({epoch:'host.test',after:140});
  assert.equal(delta.state,'delta');assert.equal(delta.events.length,5);
  feed.dispose();
});
