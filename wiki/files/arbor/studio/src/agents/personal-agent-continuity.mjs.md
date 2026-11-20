# File: studio/src/agents/personal-agent-continuity.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/agents/personal-agent-continuity.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11921 B |
| Lines | 205 |
| Hash | d6543704af46 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONTINUITY_SCHEMA | const | 6 | yes | export const CONTINUITY_SCHEMA = &#39;vivim.personal-agent.continuity/1&#39;; |
| EXPORT_SCHEMA | const | 7 | yes | export const EXPORT_SCHEMA = &#39;vivim.personal-agent.export/1&#39;; |
| MAX_EXPORT_BYTES | const | 8 | no | const MAX_EXPORT_BYTES = 1024 * 1024; |
| tiers | const | 9 | no | const tiers = [&#39;CANON&#39;, &#39;Immediate&#39;, &#39;Curated&#39;]; |
| fail | function | 10 | no | const fail = (message, status = 400, code = &#39;PERSONAL_AGENT_CONTINUITY_INVALID&#39;) =&gt; |
| tierEntries | function | 13 | no | const tierEntries = (state, tier) =&gt; { |
| value | const | 14 | no | const value = state.memory?.[tier] ?? []; |
| list | function | 18 | no | const list = (value) =&gt; (Array.isArray(value) ? value : []); |
| createContinuityPacket | function | 20 | yes | export function createContinuityPacket(state, { now, scopeFingerprint = null } = {}) { |
| recent | function | 23 | no | const recent = (tier, limit) =&gt; tierEntries(state, tier).map(entry =&gt; ({ key: entry.key, text: entry.text, updatedAt: entry.updatedAt, source: entry.source, })).sort((a, b) =&gt; String(b.updatedAt ?? &#39;… |
| open | const | 26 | no | const open = list(state.work).filter(item =&gt; [&#39;queued&#39;, &#39;active&#39;, &#39;blocked&#39;].includes(item?.status)); |
| createPortableSnapshot | function | 62 | yes | export function createPortableSnapshot(state, { now, includeMemory = false, includeWorkDetails = false, scopeFingerprint = null } = {}) { |
| payload | const | 65 | no | const payload = { |
| serialized | const | 81 | no | const serialized = JSON.stringify(payload); |
| bytes | const | 82 | no | const bytes = Buffer.byteLength(serialized, &#39;utf8&#39;); |
| MAX_AGENT_EXPORT_DOCUMENT_BYTES | const | 96 | yes | export const MAX_AGENT_EXPORT_DOCUMENT_BYTES = MAX_EXPORT_BYTES + 64 * 1024; |
| inspectPortableSnapshot | function | 97 | yes | export function inspectPortableSnapshot(bundle) { |
| invalid | function | 98 | no | const invalid = (message, code = &#39;PERSONAL_AGENT_EXPORT_INVALID&#39;) =&gt; fail(message, 400, code); |
| documentJson | variable | 102 | no | let documentJson; |
| payload | const | 112 | no | const payload = bundle.payload; |
| serialized | const | 113 | no | const serialized = JSON.stringify(payload); |
| actualBytes | const | 114 | no | const actualBytes = Buffer.byteLength(serialized, &#39;utf8&#39;); |
| hash | const | 121 | no | const hash = createHash(&#39;sha256&#39;).update(serialized).digest(&#39;hex&#39;); |
| stage | const | 142 | no | const stage = payload.bootstrap[name]; |
| memoryCounts | variable | 150 | no | let memoryCounts; |
| entries | const | 156 | no | const entries = payload.memory[tier]; |
| count | const | 172 | no | const count = payload.memory.counts[tier]; |
| workCount | variable | 177 | no | let workCount; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| ./personal-agent-bootstrap.mjs | import | 3 | [studio/src/agents/personal-agent-bootstrap.mjs](./personal-agent-bootstrap.mjs.md) |
| ./personal-agent-work.mjs | import | 4 | [studio/src/agents/personal-agent-work.mjs](./personal-agent-work.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/personal-agent.mjs](../../bin/commands/personal-agent.mjs.md) | ../../src/agents/personal-agent-continuity.mjs |
| [studio/src/agents/personal-agent-service.mjs](./personal-agent-service.mjs.md) | ./personal-agent-continuity.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Explicit local continuity packet and portable JSON snapshot. No network, scheduler or tool dispatch.
import { createHash, timingSafeEqual } from 'node:crypto';
import { BOOTSTRAP_STAGES } from './personal-agent-bootstrap.mjs';
import { WORK_STATES, MAX_WORK_ITEMS } from './personal-agent-work.mjs';

export const CONTINUITY_SCHEMA = 'vivim.personal-agent.continuity/1';
export const EXPORT_SCHEMA = 'vivim.personal-agent.export/1';
const MAX_EXPORT_BYTES = 1024 * 1024;
const tiers = ['CANON', 'Immediate', 'Curated'];
const fail = (message, status = 400, code = 'PERSONAL_AGENT_CONTINUITY_INVALID') =>
  Object.assign(new Error(message), { status, code });
// A corrupt tier must fail with a stable machine code, never an uncaught TypeError through the HTTP boundary.
const tierEntries = (state, tier) => {
  const value = state.memory?.[tier] ?? [];
  if (!Array.isArray(value)) throw fail(`Stored memory tier is not an array: ${tier}`, 500, 'PERSONAL_AGENT_STATE_CORRUPT');
  return value;
};
const list = (value) => (Array.isArray(value) ? value : []);

export function createContinuityPacket(state, { now, scopeFingerprint = null } = {}) {
  if (!state || typeof state !== 'object' || !state.agentId || !state.stages) throw fail('Invalid agent state');
  // Most recently updated first: continuity must surface the freshest user-authored memory, not insertion order.
  const recent = (tier, limit) => tierEntries(state, tier).map(entry => ({
    key: entry.key, text: entry.text, updatedAt: entry.updatedAt, source: entry.source,
  })).sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''))).slice(0, limit);
  const open = list(state.work).filter(item => ['queued', 'active', 'blocked'].includes(item?.status));
  return {
    schema: CONTINUITY_SCHEMA, assembledAt: now,
    privacy: 'Private local continuity packet; not published as a tool or sent to an AI provider',
    identity: { agentId: state.agentId, role: state.identity?.role ?? 'personal-agent',
      scope: 'local-data-directory', scopeFingerprint,
      assurance: 'local-data-directory-only', providerAccountVerified: false },
    localRevision: state.version,
    bootstrap: Object.fromEntries(Object.entries(state.stages).map(([name, stage]) => [name, {
      status: stage.status, evidence: [...list(stage.evidence)], blocker: stage.blocker ?? null,
    }])),
    memory: {
      CANON: recent('CANON', 20),
      Immediate: recent('Immediate', 20),
      Curated: recent('Curated', 10),
      coverage: 'most recently updated first: up to 20 CANON, 20 Immediate, 10 Curated; explicit user-authored content only',
    },
    work: open.slice(-20).map(item => ({
      id: item.id, title: item.title, objective: item.objective,
      status: item.status, nextAction: item.nextAction,
      updatedAt: item.updatedAt, evidence: list(item.evidence).slice(-10),
    })),
    workCoverage: { openTotal: open.length, included: Math.min(open.length, 20), fullArchive: false,
      selection: 'open Work in creation order; the newest 20 are retained' },
    communications: {
      status: 'not-inspected', note: 'AION peer communications are not automatically imported into local Work',
    },
    execution: {
      permittedByThisPacket: false,
      effectsDuringPacketAssembly: 'none',
      providerActivityOutsideThisPacket: 'not-inspected',
      toolExecutionOutsideThisPacket: 'not-inspected',
    },
  };
}

export function createPortableSnapshot(state, { now, includeMemory = false, includeWorkDetails = false, scopeFingerprint = null } = {}) {
  if (!state || typeof state !== 'object' || !state.agentId || !state.stages) throw fail('Invalid agent state');
  if (typeof includeMemory !== 'boolean' || typeof includeWorkDetails !== 'boolean') throw fail('Export flags must be booleans');
  const payload = {
    schema: EXPORT_SCHEMA, createdAt: now, sourceVersion: state.version,
    identity: { agentId: state.agentId, scope: 'local-data-directory-only', scopeFingerprint,
      providerAccountVerified: false },
    bootstrap: Object.fromEntries(Object.entries(state.stages).map(([name, value]) => [name, {
      status: value.status, updatedAt: value.updatedAt, evidence: [...list(value.evidence)], blocker: value.blocker ?? null,
    }])),
    work: includeWorkDetails ? structuredClone(list(state.work)) : {
      count: list(state.work).length, detailsOmitted: true,
    },
    memory: includeMemory
      ? Object.fromEntries(tiers.map(tier => [tier, structuredClone(tierEntries(state, tier))]))
      : { counts: Object.fromEntries(tiers.map(tier => [tier, tierEntries(state, tier).length])),
        detailsOmitted: true },
    provenance: 'Exported user-owned local state; no remote conversation history or credentials were accessed',
  };
```

_First 80 of 206 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
