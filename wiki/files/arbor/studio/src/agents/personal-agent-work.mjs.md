# File: studio/src/agents/personal-agent-work.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/agents/personal-agent-work.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8023 B |
| Lines | 130 |
| Hash | 989cb5e619c2 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WORK_STATES | const | 4 | yes | export const WORK_STATES = Object.freeze([&#39;queued&#39;, &#39;active&#39;, &#39;blocked&#39;, &#39;completed&#39;, &#39;cancelled&#39;]); |
| WORK_TRANSITIONS | const | 5 | no | const WORK_TRANSITIONS = Object.freeze({ queued: [&#39;active&#39;, &#39;blocked&#39;, &#39;cancelled&#39;], active: [&#39;blocked&#39;, &#39;completed&#39;, &#39;cancelled&#39;], blocked: [&#39;active&#39;, &#39;cancelled&#39;], completed: [], |
| MAX_WORK_ITEMS | const | 12 | yes | export const MAX_WORK_ITEMS = 200; |
| keyPattern | const | 13 | no | const keyPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,127}$/; |
| workId | function | 14 | no | const workId = key =&gt; &#39;work-&#39; + createHash(&#39;sha256&#39;).update(key).digest(&#39;hex&#39;).slice(0, 32); |
| err | function | 15 | no | const err = (code, message, status = 400) =&gt; Object.assign(new Error(message), { code, status }); |
| text | function | 16 | no | const text = (value, name, max) =&gt; { |
| existing | function | 20 | no | const existing = state =&gt; { |
| work | const | 21 | no | const work = state.work ?? []; |
| workSummary | function | 26 | yes | export function workSummary(state) { |
| work | const | 27 | no | const work = existing(state); |
| createWork | function | 35 | yes | export function createWork(state, { title, objective, idempotencyKey, now }) { |
| name | const | 36 | no | const name = text(title, &#39;title&#39;, 160), goal = text(objective, &#39;objective&#39;, 4000); |
| id | const | 38 | no | const id = workId(idempotencyKey); |
| work | const | 39 | no | const work = existing(state); |
| previous | const | 40 | no | const previous = work.find(x =&gt; x.id === id); |
| item | const | 46 | no | const item = { |
| setWorkNextAction | function | 56 | yes | export function setWorkNextAction(state, { id, nextAction, now }) { |
| work | const | 60 | no | const work = existing(state); |
| old | const | 61 | no | const old = work.find(item =&gt; item.id === id); |
| action | const | 70 | no | const action = nextAction === null ? null : nextAction.trim(); |
| event | const | 78 | no | const event = { type: &#39;next-action&#39;, at: now, nextAction: action, basis: &#39;user-authored-local-plan&#39; }; |
| item | const | 79 | no | const item = { ...old, nextAction: action, updatedAt: now, events: [...old.events, event] }; |
| blockerStepReleased | function | 86 | no | const blockerStepReleased = old =&gt; old.status === &#39;blocked&#39; |
| transitionWork | function | 91 | yes | export function transitionWork(state, { id, to, note, evidence = [], idempotencyKey, now }) { |
| work | const | 98 | no | const work = existing(state); |
| old | const | 99 | no | const old = work.find(item =&gt; item.id === id); |
| previous | const | 103 | no | const previous = old.events.find(event =&gt; event.idempotencyKey === idempotencyKey); |
| event | const | 115 | no | const event = { |
| item | const | 121 | no | const item = { ...old, status: to, updatedAt: now, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/agents/personal-agent-continuity.mjs](./personal-agent-continuity.mjs.md) | ./personal-agent-work.mjs |
| [studio/src/agents/personal-agent-service.mjs](./personal-agent-service.mjs.md) | ./personal-agent-work.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Durable, local-only Work model. Never dispatches a tool or claims a live provider PASS.
import { createHash } from 'node:crypto';

export const WORK_STATES = Object.freeze(['queued', 'active', 'blocked', 'completed', 'cancelled']);
const WORK_TRANSITIONS = Object.freeze({
  queued: ['active', 'blocked', 'cancelled'],
  active: ['blocked', 'completed', 'cancelled'],
  blocked: ['active', 'cancelled'],
  completed: [],
  cancelled: [],
});
export const MAX_WORK_ITEMS = 200;
const keyPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,127}$/;
const workId = key => 'work-' + createHash('sha256').update(key).digest('hex').slice(0, 32);
const err = (code, message, status = 400) => Object.assign(new Error(message), { code, status });
const text = (value, name, max) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw err('PERSONAL_AGENT_WORK_INVALID', `${name} must be 1..${max} characters`);
  return value.trim();
};
const existing = state => {
  const work = state.work ?? [];
  if (!Array.isArray(work) || work.length > MAX_WORK_ITEMS) throw err('PERSONAL_AGENT_WORK_CORRUPT', 'Stored Work index is invalid', 500);
  return work;
};

export function workSummary(state) {
  const work = existing(state);
  return {
    total: work.length,
    byStatus: Object.fromEntries(WORK_STATES.map(status => [status, work.filter(item => item.status === status).length])),
    authority: 'local-user-directed-work; not provider execution',
  };
}

export function createWork(state, { title, objective, idempotencyKey, now }) {
  const name = text(title, 'title', 160), goal = text(objective, 'objective', 4000);
  if (typeof idempotencyKey !== 'string' || !keyPattern.test(idempotencyKey)) throw err('PERSONAL_AGENT_WORK_INVALID', 'idempotencyKey must be 8..128 safe characters');
  const id = workId(idempotencyKey);
  const work = existing(state);
  const previous = work.find(x => x.id === id);
  if (previous) {
    if (previous.title !== name || previous.objective !== goal) throw err('PERSONAL_AGENT_WORK_IDEMPOTENCY_CONFLICT', 'Same key has different Work inputs', 409);
    return { state, item: previous, changed: false };
  }
  if (work.length >= MAX_WORK_ITEMS) throw err('PERSONAL_AGENT_WORK_LIMIT', 'Work index reached capacity', 409);
  const item = {
    id, title: name, objective: goal, status: 'queued', nextAction: null,
    createdAt: now, updatedAt: now, source: 'user-authored',
    evidence: [], events: [{ type: 'created', at: now, basis: 'explicit-user-request' }],
  };
  return { state: { ...state, updatedAt: now, work: [...work, item] }, item, changed: true };
}

// The user's next step is a LOCAL planning field, not permission to execute it.
// CAS is owned by PersonalAgentService, so this pure reducer only validates the state.
export function setWorkNextAction(state, { id, nextAction, now }) {
  if (typeof id !== 'string' || !/^work-[a-f0-9]{32}$/.test(id)) {
    throw err('PERSONAL_AGENT_WORK_INVALID', 'Invalid Work ID');
  }
  const work = existing(state);
  const old = work.find(item => item.id === id);
  if (!old) throw err('PERSONAL_AGENT_WORK_NOT_FOUND', 'Work item not found', 404);
  if (old.status === 'completed' || old.status === 'cancelled') {
    throw err('PERSONAL_AGENT_WORK_TRANSITION', 'Closed Work cannot be edited', 409);
  }
  if (nextAction !== null && (typeof nextAction !== 'string' || nextAction.trim().length === 0 ||
      nextAction.trim().length > 1000)) {
    throw err('PERSONAL_AGENT_WORK_INVALID', 'nextAction must be null or 1..1000 characters');
  }
  const action = nextAction === null ? null : nextAction.trim();
  if (old.status === 'blocked' && action === null) {
    throw err('PERSONAL_AGENT_WORK_INVALID', 'Blocked Work needs a next action or reason');
  }
  if ((old.nextAction ?? null) === action) return { state, item: old, changed: false };
  if (!Array.isArray(old.events) || old.events.length >= 100) {
    throw err('PERSONAL_AGENT_WORK_LIMIT', 'Work event history reached capacity', 409);
  }
  const event = { type: 'next-action', at: now, nextAction: action, basis: 'user-authored-local-plan' };
  const item = { ...old, nextAction: action, updatedAt: now, events: [...old.events, event] };
  return { state: { ...state, updatedAt: now, work: work.map(row => row.id === id ? item : row) },
```

_First 80 of 131 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
