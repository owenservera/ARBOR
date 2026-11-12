// Personal AI global status contract. Pure: derives a fixed, read-only projection from existing
// Personal Agent state only. It never initializes, writes, calls providers, or reads memory/Work/observation
// content. Provider readiness and onboarding are deliberately NOT inferred here.
import { BOOTSTRAP_STAGES, nextPersonalAgentBootstrapStage } from './personal-agent-bootstrap.mjs';

export const PERSONAL_AI_SCHEMA = 'vivim.personal-ai/1';
export const PERSONAL_AI_PHASES = Object.freeze(['unprepared', 'preparing', 'ready', 'blocked', 'failed', 'uncertain']);

const LIMITS = 'Read-only local summary of this data directory only. Provider readiness, onboarding, '
  + 'live execution and capability verification are not inferred; no memory, Work or credential content is included.';

// `now` is accepted for call-site symmetry; the projection never emits a clock-derived claim.
export function buildGlobalStatus({ state = null, scopeFingerprint, now } = {}) {
  if (typeof scopeFingerprint !== 'string' || !scopeFingerprint) throw new TypeError('scopeFingerprint required');
  const initialized = state !== null && state !== undefined;
  const nextStage = initialized ? nextPersonalAgentBootstrapStage(state) : BOOTSTRAP_STAGES[0];
  const phase = !initialized || nextStage !== null ? 'unprepared' : 'ready';
  return {
    schema: PERSONAL_AI_SCHEMA,
    agentId: 'primary',
    protected: true,
    initialized,
    phase,
    scope: 'local-data-directory',
    scopeFingerprint,
    version: initialized ? state.version : null,
    updatedAt: initialized ? state.updatedAt ?? null : null,
    nextStage,
    capabilityRefs: { inventory: '/api/v1/personal-agent/capabilities', verification: 'registered-not-tested' },
    recovery: { path: '/personal-agent', kind: 'host-document-route', independentOfCustomApp: true, featureToggleable: false },
    customization: { presentationEditable: true, identityEditable: false },
    limits: LIMITS,
  };
}
