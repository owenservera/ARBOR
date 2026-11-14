import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeWorldPort, WORLD_PORT_SCHEMA } from './index.mjs';

const context={worldId:'world-alex',principalRef:'synthetic://principal/alex',providerId:'messenger',
  accountRef:'synthetic://account/alex',accountEpoch:3,origin:'https://www.facebook.com',grantRef:'synthetic://grant/alex'};
const next={...context,accountRef:'synthetic://account/bob',accountEpoch:5,grantRef:'synthetic://grant/bob'};
const evidence={sourceRef:'synthetic://message/one',sourceRevision:'r1',digest:'a'.repeat(64),
  observedAt:'2026-11-14T00:00:00.000Z',coverage:'COMPLETE',gapCodes:[]};
const grant=c=>({schema:WORLD_PORT_SCHEMA,...c,scopes:['stream.read','evidence.commit'],expiresAt:'2026-11-15T00:00:00.000Z'});
const commit=(port,c,expectedRevision)=>port.commitEvidence({context:c,evidence,expectedRevision,idempotencyKey:'synthetic://intent/one'});

test('two seeded accounts never share evidence or receipts after active account switch', () => {
  const {port,scenario}=createFakeWorldPort({grants:[grant(next),grant(context)],clock:()=> '2026-11-14T00:00:00.000Z'});
  assert.equal(commit(port,context,0).status,'MOCK_APPLIED');
  scenario.switchAccount({worldId:context.worldId,principalRef:context.principalRef,providerId:context.providerId,
    accountRef:next.accountRef,accountEpoch:next.accountEpoch});
  assert.equal(port.checkGrant({context:next,capability:'stream.read'}).decision,'ALLOWED');
  assert.equal(port.readEvidence({context:next}).items.length,0);
  assert.equal(port.readReceipt({context:next,idempotencyKey:'synthetic://intent/one'}).status,'NOT_FOUND');
  assert.equal(commit(port,next,1).status,'MOCK_APPLIED');
  assert.equal(port.readEvidence({context:next}).items.length,1);
  assert.equal(port.readEvidence({context}).status,'DENIED');
});
