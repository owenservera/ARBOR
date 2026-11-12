// Pure, read-only adapter from an existing harness journal receipt.
// It never reads a browser/profile, stores the reply, changes the send journal,
// or treats a selected/requested model as evidence of successful delivery.
import { createHash } from 'node:crypto';

const ID = /^[A-Za-z0-9_-]{1,128}$/;
const VERIFIED_RECEIPT_STATES = new Set(['observed', 'complete']);

function invalid() { return Object.assign(new TypeError('Invalid harness journal receipt'), { code: 'JOURNAL_RECEIPT_INVALID' }); }
function bounded(value, max = 128) { return typeof value === 'string' && value.length <= max ? value : null; }
function time(value) { return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null; }

// Returns metadata only. Preserve unknowns: e.g. the current journal does not
// persist verified thinking effort, citations or human acceptance outcome.
// The descriptor does not grant capture or any future downstream disclosure.
export function journalReceiptToAsset(receipt, { worldId = 'world-local', capturedAt = new Date().toISOString() } = {}) {
  if (!receipt || typeof receipt !== 'object' || !ID.test(worldId) ||
      !ID.test(receipt.requestId) || !ID.test(receipt.provider) ||
      !['no', 'yes', 'unknown'].includes(receipt.submitted) ||
      typeof receipt.state !== 'string' || receipt.state.length > 64) throw invalid();

  const observed = receipt.submitted === 'yes' && VERIFIED_RECEIPT_STATES.has(receipt.state);
  const uncertain = receipt.submitted === 'unknown' || receipt.state === 'uncertain';
  const assetId = 'ai03_' + createHash('sha256').update(JSON.stringify([worldId, receipt.provider, receipt.requestId])).digest('hex').slice(0, 32);
  const observedModel = observed ? bounded(receipt.model) : null;
  return {
    schema: 'vivim.data-asset/1',
    assetId, worldId, ingressId: 'AI03', kind: 'ai.model_configuration',
    source: { authority: 'harness-journal', provider: receipt.provider,
      captureMethod: 'read-only-journal-adapter', adapterVersion: '1' },
    eventAt: time(receipt.updatedAt), capturedAt: time(capturedAt) ?? new Date().toISOString(),
    identity: { requestRef: receipt.requestId },
    content: {
      authorityRef: 'harness-journal:request/' + receipt.requestId,
      digestRef: null, availability: 'referenced'
    },
    model: {
      requested: bounded(receipt.requestedModel), observed: observedModel,
      observedState: observedModel ? 'verified' : 'unverified',
      thinkingRequested: null, thinkingObserved: null
    },
    lineage: { derivation: 'direct-observation', parents: [], evidenceRefs: [] },
    policy: {
      purpose: 'private-personal-ai', grantRef: null, sensitivity: 'unknown',
      thirdParty: 'unknown', rights: 'review_required', retention: 'owner-configured'
    },
    integrity: {
      captureState: uncertain ? 'uncertain' : observed ? 'observed' : 'unverified',
      evidenceQuality: observed ? 'source-correlated' : 'unverified'
    }
  };
}
