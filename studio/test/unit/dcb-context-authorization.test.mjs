// Unit gate for NEXT:D12-B-DCB-GRANT.
//
// Covers:
//   studio/src/agents/dcb-context-runtime.mjs :: createDcbHostContextRuntime
//     - native retrieval (previewContext) and invalidation (previewInvalidations)
//       connected behind the authorized Host facade; read-only, never send-authorized.
//   studio/src/studio/conversation-api.mjs :: createDcbConversationFacade
//     - authorizeSourceDisclosure @ L39 reuses native scoped context for DCB
//       composition: a source is authorized for disclosure only when it resolves
//       through the Host's own scoped source registry for the principal and the
//       destination is a known driveable site; revoked / out-of-scope /
//       mismatched-principal evidence is denied; the facade stays observation-only
//       and never promotes an uncertain delivery to success.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createDcbHostContextRuntime, DCB_HOST_FACADE_SCHEMA } from '../../src/agents/dcb-context-runtime.mjs';
import { createDcbConversationFacade } from '../../src/studio/conversation-api.mjs';

const now = '2026-11-20T00:00:00.000Z';

const fakeVerifyTarget = async () => ({ verified: true, principalRef: 'owner:studio-host', destinationProvider: 'chatgpt', threadRef: 't1' });
const fakeAuthorize = async () => ({ authorized: false, proofRef: null, principalRef: null, destinationProvider: null, sourceRefs: [], reason: 'test-stub' });

const fakeSourceAdapters = (resolveValue = []) => ({
  resolveSources: async () => resolveValue,
  readSource: async () => { throw new Error('readSource not used in these tests'); },
});

const fakeDefinitionStore = {
  resolve: () => Object.freeze({
    schema: 'vivim.dcb-resolution/1', bundleId: 'b1', sourceRefs: [], flavorRefs: [],
    dependencies: [], authority: 'read_only_projection', isSendAuthorized: false,
  }),
  list: () => ({ items: [
    { id: 'b1', sourceRefs: ['s1'], status: 'active', revision: 1, parentRefs: [] },
    { id: 'b2', sourceRefs: ['s2'], status: 'active', revision: 1, parentRefs: ['b1'] },
  ], truncated: false }),
  get: () => null,
};

test('dcb host facade exposes read-only native retrieval and invalidation, never send-authorized', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'd12-dcb-'));
  try {
    const facade = createDcbHostContextRuntime({
      paths: { root }, ownerRef: 'owner:studio-host',
      definitionStore: fakeDefinitionStore,
      sourceAdapters: fakeSourceAdapters(),
      verifyTarget: fakeVerifyTarget,
      authorizeSourceDisclosure: fakeAuthorize,
    });
    assert.equal(facade.schema, DCB_HOST_FACADE_SCHEMA);
    assert.equal(facade.isEffectOwner, false);
    assert.equal(typeof facade.previewContext, 'function');
    assert.equal(typeof facade.previewInvalidations, 'function');
    assert.equal(typeof facade.revalidateBeforeEffect, 'function');
    assert.equal(typeof facade.prepareJournalCandidate, 'function');

    // Native invalidation behind authorized Host context: changed sources dirty
    // their bundles and propagate to dependents; planning only, never a send.
    const plan = facade.previewInvalidations({ changedSourceRefs: ['s1'], at: now });
    assert.equal(plan.schema, 'vivim.dcb-invalidation-plan/1');
    assert.equal(plan.status, 'planning_only');
    assert.equal(plan.isSendAuthorized, false);
    const byId = new Map(plan.jobs.map((j) => [j.bundleId, j]));
    assert.equal(byId.get('b1').status, 'stale');      // s1 changed
    assert.equal(byId.get('b2').status, 'stale');      // dependent of b1
    assert.ok(byId.get('b2').reasons.includes('changed_parent'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('authorizeSourceDisclosure reuses native scoped context for disclosure', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'd12-dcb-'));
  try {
    const sources = [
      { ref: 's1', revision: 'r1', sha256: 'h1', layer: 'LpProjectState', classification: 'task_evidence', trust: 'owner_confirmed', sensitivity: 'internal', keywords: [], updatedAt: null, priority: 0, head: null, principalRef: 'owner:studio-host', projectRef: null, activityRef: null },
      { ref: 's2', revision: 'r2', sha256: 'h2', layer: 'LpProjectState', classification: 'decision', trust: 'observed', sensitivity: 'internal', keywords: [], updatedAt: null, priority: 0, head: null, principalRef: 'owner:studio-host', projectRef: null, activityRef: null },
      { ref: 's3', revision: 'r3', sha256: 'h3', layer: 'L1GlobalPrefs', classification: 'personal', trust: 'owner_confirmed', sensitivity: 'private', keywords: [], updatedAt: null, priority: 0, head: null, principalRef: 'other:principal', projectRef: null, activityRef: null },
    ];
    const revoked = new Set(['s2']);
    const scopedAdapters = {
      resolveSources: async ({ principalRef }) => sources.filter(
        (s) => (!s.principalRef || s.principalRef === principalRef) && !revoked.has(s.ref)),
      readSource: async () => { throw new Error('readSource not used'); },
    };
    const { facade, mode, verifyTarget, authorizeSourceDisclosure } =
      createDcbConversationFacade({ paths: { root }, sourceAdapters: scopedAdapters });

    assert.equal(mode, 'observation-only');
    assert.equal(facade.schema, DCB_HOST_FACADE_SCHEMA);
    assert.equal(facade.isEffectOwner, false);
    assert.equal(typeof verifyTarget, 'function');
    assert.equal(typeof authorizeSourceDisclosure, 'function');

    const base = (overrides = {}) => ({
      principalRef: 'owner:studio-host', destinationProvider: 'chatgpt', threadRef: 't1',
      sourceRefs: [], bundleId: 'b1', packetDigest: 'digest', ...overrides,
    });

    // In-scope, non-revoked source to a known destination is authorized.
    const granted = await authorizeSourceDisclosure(base({ sourceRefs: ['s1'] }));
    assert.equal(granted.authorized, true);
    assert.match(granted.proofRef, /^[a-f0-9]{64}$/);
    assert.equal(granted.principalRef, 'owner:studio-host');
    assert.equal(granted.destinationProvider, 'chatgpt');
    assert.deepEqual(granted.sourceRefs, ['s1']);
    assert.equal(granted.reason, 'NATIVE_SCOPED_DISCLOSURE_AUTHORIZED');

    // Proof is deterministic and binds to the exact request.
    const grantedAgain = await authorizeSourceDisclosure(base({ sourceRefs: ['s1'] }));
    assert.equal(grantedAgain.proofRef, granted.proofRef);
    const different = await authorizeSourceDisclosure(base({ sourceRefs: ['s1'], packetDigest: 'other' }));
    assert.notEqual(different.proofRef, granted.proofRef);

    // Revoked source is never authorized (revoked evidence never submitted).
    assert.equal((await authorizeSourceDisclosure(base({ sourceRefs: ['s2'] }))).authorized, false);

    // Mismatched principal source is not in scope for this principal.
    assert.equal((await authorizeSourceDisclosure(base({ sourceRefs: ['s3'] }))).authorized, false);

    // Same source IS authorized for the principal that owns it.
    const owned = await authorizeSourceDisclosure(base({ principalRef: 'other:principal', sourceRefs: ['s3'] }));
    assert.equal(owned.authorized, true);

    // Unknown destination is refused (target authorization).
    assert.equal((await authorizeSourceDisclosure(base({ destinationProvider: 'no-such-site.xyz', sourceRefs: ['s1'] }))).authorized, false);

    // No principal refuses.
    assert.equal((await authorizeSourceDisclosure(base({ principalRef: null, sourceRefs: ['s1'] }))).authorized, false);

    // Denials carry a reason and never mint a proof.
    const denied = await authorizeSourceDisclosure(base({ sourceRefs: ['s2'] }));
    assert.equal(denied.authorized, false);
    assert.equal(denied.proofRef, null);
    assert.ok(typeof denied.reason === 'string' && denied.reason.length > 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('authorizeSourceDisclosure composes native context through the facade without send authority', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'd12-dcb-'));
  try {
    const text = 'source text one';
    const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
    const candidate = {
      ref: 's1', revision: 'r1', sha256: sha(text), layer: 'LpProjectState',
      classification: 'task_evidence', trust: 'owner_confirmed', sensitivity: 'internal',
      keywords: [], updatedAt: null, priority: 0, head: null,
      principalRef: 'owner:studio-host', projectRef: null, activityRef: null,
    };
    const defStore = {
      resolve: () => Object.freeze({
        schema: 'vivim.dcb-resolution/1', bundleId: 'b1', sourceRefs: ['s1'], flavorRefs: [],
        dependencies: [{ ref: 's1', revision: 1 }],
        authority: 'read_only_projection', isSendAuthorized: false,
      }),
      list: () => ({ items: [], truncated: false }),
      get: () => null,
    };
    const srcAdapters = {
      resolveSources: async () => [candidate],
      readSource: async ({ ref, revision }) => {
        assert.equal(ref, 's1');
        assert.equal(revision, 'r1');
        return { revision, text, sha256: sha(text) };
      },
    };
    const facade = createDcbHostContextRuntime({
      paths: { root }, ownerRef: 'owner:studio-host',
      definitionStore: defStore, sourceAdapters: srcAdapters,
      verifyTarget: fakeVerifyTarget, authorizeSourceDisclosure: fakeAuthorize,
    });
    const packet = await facade.previewContext({
      bundleId: 'b1', taskRef: 't1', taskText: 'relevant candidate',
      audience: { principalRef: 'owner:studio-host', destinationProvider: 'chatgpt', activityRef: 'activity:t1', destinationModelVerified: true },
      scope: { allowedRefs: ['s1'], allowedPrefixes: [], maxSensitivity: 'internal' },
      now, purpose: 'personal_continuum',
    });
    assert.equal(packet.schema, 'vivim.dynamic-context-packet/2');
    assert.equal(packet.authority, 'read_only_projection');
    assert.equal(packet.isSendAuthorized, false);
    assert.equal(packet.complete, true);
    assert.equal(packet.transferable, true);
    assert.equal(packet.destinationProvider, 'chatgpt');
    assert.ok(packet.packetDigest.match(/^[a-f0-9]{64}$/));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
