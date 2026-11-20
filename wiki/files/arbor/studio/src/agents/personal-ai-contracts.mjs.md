# File: studio/src/agents/personal-ai-contracts.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/agents/personal-ai-contracts.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1994 B |
| Lines | 34 |
| Hash | de820c7fdf6b |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PERSONAL_AI_SCHEMA | const | 6 | yes | export const PERSONAL_AI_SCHEMA = &#39;vivim.personal-ai/1&#39;; |
| PERSONAL_AI_PHASES | const | 7 | yes | export const PERSONAL_AI_PHASES = Object.freeze([&#39;unprepared&#39;, &#39;preparing&#39;, &#39;ready&#39;, &#39;blocked&#39;, &#39;failed&#39;, &#39;uncertain&#39;]); |
| LIMITS | const | 9 | no | const LIMITS = &#39;Read-only local summary of this data directory only. Provider readiness, onboarding, &#39; |
| buildGlobalStatus | function | 13 | yes | export function buildGlobalStatus({ state = null, scopeFingerprint, now } = {}) { |
| initialized | const | 15 | no | const initialized = state !== null &amp;&amp; state !== undefined; |
| nextStage | const | 16 | no | const nextStage = initialized ? nextPersonalAgentBootstrapStage(state) : BOOTSTRAP_STAGES[0]; |
| phase | const | 17 | no | const phase = !initialized \|\| nextStage !== null ? &#39;unprepared&#39; : &#39;ready&#39;; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./personal-agent-bootstrap.mjs | import | 4 | [studio/src/agents/personal-agent-bootstrap.mjs](./personal-agent-bootstrap.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/agents/personal-agent-service.mjs](./personal-agent-service.mjs.md) | ./personal-ai-contracts.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
