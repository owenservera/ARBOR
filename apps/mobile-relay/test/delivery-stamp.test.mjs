import test from 'node:test';
import assert from 'node:assert/strict';
import { todayModel } from '../ux/model.mjs';

const sha = 'a'.repeat(40);
const hostSha = 'b'.repeat(40);
const moduleSha256 = 'c'.repeat(64);
const valid = { schema: 'vivim.delivery-stamp/1',
  sourceSha: sha, hostSourceSha: hostSha, module: 'provider-handoff.mjs',
  moduleSha256, observedAt: '2026-11-22T21:30:00.000Z', verified: true };

test('Today displays only a properly shaped PWA-only build observation', () => {
  const model = todayModel({snapshot:{}}, [], {delivery:valid});
  assert.equal(model.delivery.sourceSha, sha.slice(0,12));
  assert.equal(model.delivery.hostSourceSha, hostSha.slice(0,12));
  assert.equal(model.delivery.observedAt, valid.observedAt);
  assert.equal(model.delivery.verified, true);
  assert.match(model.delivery.scope, /not Host\/Studio deployment/);
});

test('a stamp without independently verified bytes cannot claim module verification', () => {
  const model = todayModel(null, [], {delivery:{...valid,verified:false}});
  assert.equal(model.delivery.verified, false);
});

test('untrusted or incomplete build stamps are excluded from Today', () => {
  for (const delivery of [null,{}, {...valid,sourceSha:'fake'},
    {...valid,module:'../private'}, {...valid,moduleSha256:'bad'},
    {...valid,schema:'wrong'}]) {
    assert.equal(todayModel(null, [], {delivery}).delivery, null);
  }
});
