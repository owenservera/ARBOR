# File: studio/src/agents/personal-agent-bootstrap.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/agents/personal-agent-bootstrap.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3805 B |
| Lines | 81 |
| Hash | d1a790053f65 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BOOTSTRAP_STAGES | const | 3 | yes | export const BOOTSTRAP_STAGES = Object.freeze([ &quot;identity-and-sitrep&quot;, &quot;shared-intelligence&quot;, &quot;personal-memory&quot;, &quot;skills-and-capabilities&quot;, |
| MEMORY_TIERS | const | 9 | yes | export const MEMORY_TIERS = Object.freeze([&quot;CANON&quot;, &quot;Immediate&quot;, &quot;Curated&quot;]); |
| STATES | const | 10 | no | const STATES = new Set([&quot;pending&quot;, &quot;completed&quot;, &quot;blocked&quot;]); |
| STAGE_SET | const | 11 | no | const STAGE_SET = new Set(BOOTSTRAP_STAGES); |
| createPersonalAgentBootstrap | function | 13 | yes | export function createPersonalAgentBootstrap({ agentId, ownerId, now = new Date().toISOString() }) { |
| validatePersonalAgentBootstrap | function | 28 | yes | export function validatePersonalAgentBootstrap(snapshot) { |
| entry | const | 36 | no | const entry = snapshot.stages[stage]; |
| nextPersonalAgentBootstrapStage | function | 48 | yes | export function nextPersonalAgentBootstrapStage(snapshot) { |
| updatePersonalAgentBootstrap | function | 53 | yes | export function updatePersonalAgentBootstrap(snapshot, { stage, status, evidence = [], blocker = null, now = new Date().toISOString() }) { |
| firstIncomplete | const | 69 | no | const firstIncomplete = nextPersonalAgentBootstrapStage(snapshot); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/agents/personal-agent-continuity.mjs](./personal-agent-continuity.mjs.md) | ./personal-agent-bootstrap.mjs |
| [studio/src/agents/personal-agent-service.mjs](./personal-agent-service.mjs.md) | ./personal-agent-bootstrap.mjs |
| [studio/src/agents/personal-ai-contracts.mjs](./personal-ai-contracts.mjs.md) | ./personal-agent-bootstrap.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Personal Agent bootstrap state contracts. Pure and dependency-free by design.
// This module does not operate a browser, invoke providers, or create background work.
export const BOOTSTRAP_STAGES = Object.freeze([
  "identity-and-sitrep",
  "shared-intelligence",
  "personal-memory",
  "skills-and-capabilities",
]);
export const MEMORY_TIERS = Object.freeze(["CANON", "Immediate", "Curated"]);
const STATES = new Set(["pending", "completed", "blocked"]);
const STAGE_SET = new Set(BOOTSTRAP_STAGES);

export function createPersonalAgentBootstrap({ agentId, ownerId, now = new Date().toISOString() }) {
  if (typeof agentId !== "string" || !agentId.trim()) throw new TypeError("agentId required");
  if (typeof ownerId !== "string" || !ownerId.trim()) throw new TypeError("ownerId required");
  return {
    schemaVersion: 1,
    agentId,
    ownerId,
    createdAt: now,
    updatedAt: now,
    stages: Object.fromEntries(BOOTSTRAP_STAGES.map(stage => [stage, {
      status: "pending", updatedAt: now, evidence: [], blocker: null,
    }])),
  };
}

export function validatePersonalAgentBootstrap(snapshot) {
  if (!snapshot || snapshot.schemaVersion !== 1 ||
      typeof snapshot.agentId !== "string" || !snapshot.agentId ||
      typeof snapshot.ownerId !== "string" || !snapshot.ownerId ||
      !snapshot.stages || typeof snapshot.stages !== "object") {
    throw new TypeError("Invalid Personal Agent bootstrap snapshot");
  }
  for (const stage of BOOTSTRAP_STAGES) {
    const entry = snapshot.stages[stage];
    if (!entry || !STATES.has(entry.status) || !Array.isArray(entry.evidence) ||
        entry.evidence.some(ref => typeof ref !== "string" || !ref.trim())) {
      throw new TypeError(`Invalid bootstrap stage: ${stage}`);
    }
    if (entry.status === "completed" && entry.evidence.length === 0) {
      throw new TypeError(`Completed stage requires evidence: ${stage}`);
    }
  }
  return snapshot;
}

export function nextPersonalAgentBootstrapStage(snapshot) {
  validatePersonalAgentBootstrap(snapshot);
  return BOOTSTRAP_STAGES.find(stage => snapshot.stages[stage].status !== "completed") ?? null;
}

export function updatePersonalAgentBootstrap(snapshot, { stage, status, evidence = [], blocker = null, now = new Date().toISOString() }) {
  validatePersonalAgentBootstrap(snapshot);
  if (!STAGE_SET.has(stage)) throw new TypeError("Unknown bootstrap stage");
  if (!STATES.has(status)) throw new TypeError("Unknown bootstrap status");
  if (!Array.isArray(evidence) || evidence.some(ref => typeof ref !== "string" || !ref.trim())) {
    throw new TypeError("Evidence must be nonempty reference strings");
  }
  if (status === "completed" && evidence.length === 0) throw new TypeError("Completion requires evidence");
  if (status === "blocked" && (typeof blocker !== "string" || !blocker.trim())) {
    throw new TypeError("Blocked stage requires an explicit blocker");
  }
  // Completion is monotonic: a stage that already carries local observation receipts is terminal, so a
  // later call cannot regress bootstrap progress or silently erase the evidence behind a completed stage.
  if (snapshot.stages[stage].status === "completed") {
    throw new Error("Completed bootstrap stages cannot be reopened or rewritten");
  }
  const firstIncomplete = nextPersonalAgentBootstrapStage(snapshot);
  if (status === "completed" && stage !== firstIncomplete && snapshot.stages[stage].status !== "completed") {
    throw new Error("Bootstrap stages must complete in order");
  }
  return {
    ...snapshot,
    updatedAt: now,
    stages: {
      ...snapshot.stages,
      [stage]: { status, updatedAt: now, evidence: [...evidence], blocker: status === "blocked" ? blocker : null },
    },
  };
```

_First 80 of 82 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
