# File: studio/src/studio/personal-agent-routes.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/personal-agent-routes.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11070 B |
| Lines | 139 |
| Hash | d54d4a409150 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| versionSchema | const | 7 | no | const versionSchema = { type: [&#39;integer&#39;, &#39;null&#39;], description: &#39;CAS version: null only for first initialization&#39; }; |
| stringSchema | const | 8 | no | const stringSchema = { type: &#39;string&#39; }; |
| registerPersonalAgentRoutes | function | 9 | yes | export function registerPersonalAgentRoutes({ add, paths, getTools, readStoredConversation } = {}) { |
| agent | const | 11 | no | const agent = createPersonalAgentService({ paths, getTools }); |
| providerReply | const | 12 | no | const providerReply = createProviderReplyWork({ agent, readStoredConversation }); |
| ensureBody | function | 13 | no | const ensureBody = (body, allowed) =&gt; { |
| flag | function | 36 | no | const flag = (value, name) =&gt; { |
| replyBody | function | 59 | no | const replyBody = (extra = {}, required = []) =&gt; ({ type: &#39;object&#39;, properties: { conversation: { type: &#39;string&#39;, minLength: 1, maxLength: 128, pattern: &#39;^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$&#39; }, turnId:… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../agents/personal-agent-service.mjs | import | 2 | [studio/src/agents/personal-agent-service.mjs](../agents/personal-agent-service.mjs.md) |
| ../agents/personal-agent-provider-reply.mjs | import | 3 | [studio/src/agents/personal-agent-provider-reply.mjs](../agents/personal-agent-provider-reply.mjs.md) |
| ./http.mjs | import | 4 | [studio/src/studio/http.mjs](./http.mjs.md) |
| ../../../apps/mobile-relay/ux/mission-experience.mjs | import | 5 | [apps/mobile-relay/ux/mission-experience.mjs](../../../apps/mobile-relay/ux/mission-experience.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./personal-agent-routes.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Same-owner Studio v1 routes for the local Personal Agent. No new server or effect owner.
import { createPersonalAgentService } from '../agents/personal-agent-service.mjs';
import { createProviderReplyWork } from '../agents/personal-agent-provider-reply.mjs';
import { problem } from './http.mjs';
import { projectWorkMission } from '../../../apps/mobile-relay/ux/mission-experience.mjs';

const versionSchema = { type: ['integer', 'null'], description: 'CAS version: null only for first initialization' };
const stringSchema = { type: 'string' };
export function registerPersonalAgentRoutes({ add, paths, getTools, readStoredConversation } = {}) {
  if (typeof add !== 'function') throw new TypeError('Studio add() required');
  const agent = createPersonalAgentService({ paths, getTools });
  const providerReply = createProviderReplyWork({ agent, readStoredConversation });
  const ensureBody = (body, allowed) => {
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some(k => !allowed.includes(k))) {
      throw problem(400, 'Unexpected Personal Agent request fields', 'PERSONAL_AGENT_INVALID');
    }
    return body;
  };
  add('GET', '/personal-agent/status', 'Read local Personal Agent bootstrap progress without initialization',
    () => agent.status(), { tool: 'personal_agent_status',
      annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true } });
  // Protected global Personal AI status: read-only, no body, never initializes; GET only (no write sibling).
  add('GET', '/personal-agent/global', 'Protected read-only global Personal AI status; no initialization, no private content',
    () => agent.globalStatus(), { tool: 'personal_agent_global',
      annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true } });
  add('GET', '/personal-agent/self-knowledge', 'Grounded self-knowledge: local claim, basis, freshness and qualification',
    ({ q }) => agent.selfKnowledge(q?.topic ?? 'all'),
    { tool: 'personal_agent_self_knowledge', query: { topic: { type: 'string',
      enum: ['all', 'identity', 'bootstrap', 'memory', 'work', 'world', 'capabilities', 'privacy'] } },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false } });
  add('GET', '/personal-agent/sitrep', 'Read private local Agent continuity and pending Work; not an agent tool',
    () => agent.continuity());
  add('GET', '/personal-agent/export', 'Explicit JSON export; sensitive contents included only by opt-in',
    ({ q }) => {
      const flag = (value, name) => {
        if (value === undefined || value === 'false') return false;
        if (value === 'true') return true;
        throw problem(400, `${name} must be true or false`, 'PERSONAL_AGENT_INVALID');
      };
      return agent.exportSnapshot({
        includeMemory: flag(q?.includeMemory, 'includeMemory'),
        includeWorkDetails: flag(q?.includeWorkDetails, 'includeWorkDetails'),
      });
    }, { query: { includeMemory: { type: 'boolean', default: false }, includeWorkDetails: { type: 'boolean', default: false } } });
  // Lane M is a read-only projection of the existing durable Work store, never an executor.
  add('GET', '/personal-agent/outcomes', 'Read understandable saved Work cards without dispatch',
    () => ({ schema: 'vivim.mission-experience/1', items: agent.workList().items.map(projectWorkMission).filter(Boolean) }),
    { annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false } });
  add('GET', '/personal-agent/work', 'Read private local Personal Agent Work records (not in tool manifest)',
    () => agent.workList());
  add('POST', '/personal-agent/work', 'Create user-directed local Work; no provider dispatch',
    ({ body }) => agent.createWorkItem(ensureBody(body, ['expectedVersion', 'title', 'objective', 'idempotencyKey'])),
    { body: { type: 'object', properties: {
      expectedVersion: { type: 'integer', minimum: 1 }, title: { type: 'string', maxLength: 160 },
      objective: { type: 'string', maxLength: 4000 }, idempotencyKey: { type: 'string', minLength: 8, maxLength: 128 },
    }, required: ['expectedVersion', 'title', 'objective', 'idempotencyKey'], additionalProperties: false } });
  // Opt-in: propose Work from an already-stored settled provider reply (stored snapshot only; never sends/reads live).
  const replyBody = (extra = {}, required = []) => ({ type: 'object', properties: {
    conversation: { type: 'string', minLength: 1, maxLength: 128, pattern: '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$' },
    turnId: { type: 'string', minLength: 1, maxLength: 200 }, ...extra,
  }, required: ['conversation', 'turnId', ...required], additionalProperties: false });
  add('POST', '/personal-agent/work/preview-provider-reply',
    'Preview a Work item proposed from an already-stored provider reply; read-only, nothing saved, no provider call',
    ({ body }) => providerReply.preview(ensureBody(body, ['conversation', 'turnId'])),
    { body: replyBody() });
  add('POST', '/personal-agent/work/apply-provider-reply',
    'Save a previewed provider-reply Work item after explicit user approval with CAS; no provider call',
    ({ body }) => providerReply.apply(ensureBody(body, ['conversation', 'turnId', 'replyDigest', 'expectedVersion', 'approval'])),
    { body: replyBody({
      replyDigest: { type: 'string', pattern: '^[a-f0-9]{64}$' },
      expectedVersion: { type: 'integer', minimum: 1 },
      approval: { type: 'string', enum: ['user-confirmed'] },
    }, ['replyDigest', 'expectedVersion', 'approval']) });
  add('POST', '/personal-agent/work/{id}/transition', 'Explicit local Work status update; completion references are user-attested',
    ({ p, body }) => agent.transitionWorkItem({ ...ensureBody(body, ['expectedVersion', 'to', 'note', 'evidence', 'idempotencyKey']), id: p.id }),
    { body: { type: 'object', properties: {
      expectedVersion: { type: 'integer', minimum: 1 },
      to: { type: 'string', enum: ['queued', 'active', 'blocked', 'completed', 'cancelled'] },
      idempotencyKey: { type: 'string', minLength: 8, maxLength: 128 },
```

_First 80 of 140 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
