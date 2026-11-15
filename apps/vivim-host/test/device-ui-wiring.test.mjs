import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('desktop device management uses authenticated control session and owner confirmation', () => {
  const server = source('../server.mjs');
  const panel = source('../public/control-panel.js');
  const html = source('../public/index.html');
  assert.match(server, /devices\/approve/);
  assert.match(server, /devices\/revoke/);
  assert.match(server, /uiSessions\.authorized\(req, \{ mutate: isMutation \}\)/);
  assert.match(server, /CONTROL_ACTION_PLAN_REQUIRED/);
  assert.doesNotMatch(server, /enrollment\.approveGrant\(\{ grantId: body\.grantId/);
  assert.match(panel,/plan\(\{actionId:'devices\.approve',args:\{/);
  assert.doesNotMatch(panel,/api\('devices\/approve'/);
  // GUI revocation is routed through the typed owner-approval journal.
  assert.match(panel,/plan\(\{actionId:'devices\.revoke',args:\{grant_id:g\.grantId\}\}\)/);
  assert.doesNotMatch(panel,/api\('devices\/revoke'/);
  assert.match(panel,/Approve & apply on PC/);
  assert.match(html, /id="device-list"/);
  assert.match(html, /id="device-status"/);
});

test('phone QR and Direct transport do not unlock until device grant approval', () => {
  const direct = source('../direct-phone.mjs');
  const app = source('../../mobile-relay/app.js');
  const transport = source('../../mobile-relay/transport.mjs');
  assert.match(direct, /pairing\.consume\(token\)/);
  assert.doesNotMatch(direct, /pairing\.activate\(token/);
  assert.match(direct, /authorizeDevice\(req, req\.method/);
  // The phone must redeem the challenge and enroll before any device unlock. The
  // call takes an explicit signer now, so match on the challenge argument rather
  // than requiring it to be the only one.
  assert.match(app, /enrollWithChallenge\(challenge\b/);
  assert.match(app, /resumeDeviceSession\(transport\)/);
  assert.match(transport, /x-vivim-device-session/);
  assert.match(transport, /setDeviceSession/);
});
