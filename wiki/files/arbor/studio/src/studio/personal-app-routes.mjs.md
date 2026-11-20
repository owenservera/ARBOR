# File: studio/src/studio/personal-app-routes.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/personal-app-routes.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10520 B |
| Lines | 135 |
| Hash | 970ee20f66e6 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| idPattern | const | 9 | no | const idPattern = &#39;^app-[a-f0-9]{32}$&#39;; |
| strict | function | 10 | no | const strict = (body, allowed) =&gt; { |
| registerPersonalAppRoutes | function | 17 | yes | export function registerPersonalAppRoutes({ add, paths, readStoredConversation, conversationRuntime } = {}) { |
| apps | const | 19 | no | const apps = createPersonalAppService({ paths }); |
| providerReply | const | 20 | no | const providerReply = createProviderReplyBuilder({ apps, readStoredConversation }); |
| aiDesign | const | 22 | no | const aiDesign = conversationRuntime &amp;&amp; typeof conversationRuntime.get === &#39;function&#39; &amp;&amp; typeof conversationRuntime.submit === &#39;function&#39; |
| designJobs | function | 24 | no | const designJobs = () =&gt; aiDesign ?? (() =&gt; { throw problem(501, &#39;Design with my AI needs the conversation runtime&#39;, &#39;AI_DESIGN_UNAVAILABLE&#39;); })(); |
| content | const | 25 | no | const content = createPersonalAppContentService({ paths, apps }); |
| replyBody | function | 87 | no | const replyBody = (extra = {}, required = []) =&gt; ({ type: &#39;object&#39;, properties: { conversation: { type: &#39;string&#39;, minLength: 1, maxLength: 128, pattern: &#39;^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$&#39; }, turnId:… |
| jobParam | const | 107 | no | const jobParam = { jobId: { type: &#39;string&#39;, pattern: &#39;^aid-[a-f0-9]{24}$&#39; } }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./personal-app-service.mjs | import | 3 | [studio/src/studio/personal-app-service.mjs](./personal-app-service.mjs.md) |
| ./personal-app-content.mjs | import | 4 | [studio/src/studio/personal-app-content.mjs](./personal-app-content.mjs.md) |
| ./personal-app-provider-reply.mjs | import | 5 | [studio/src/studio/personal-app-provider-reply.mjs](./personal-app-provider-reply.mjs.md) |
| ./personal-app-ai-design.mjs | import | 6 | [studio/src/studio/personal-app-ai-design.mjs](./personal-app-ai-design.mjs.md) |
| ./http.mjs | import | 7 | [studio/src/studio/http.mjs](./http.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./personal-app-routes.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Local product factory API over the existing Studio server, not another service.
// These endpoints are intentionally absent from model-tool discovery.
import { createPersonalAppService } from './personal-app-service.mjs';
import { createPersonalAppContentService } from './personal-app-content.mjs';
import { createProviderReplyBuilder } from './personal-app-provider-reply.mjs';
import { createAiDesignJobs, AI_DESIGN_SITES } from './personal-app-ai-design.mjs';
import { problem } from './http.mjs';

const idPattern = '^app-[a-f0-9]{32}$';
const strict = (body, allowed) => {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !allowed.includes(key))) {
    throw problem(400, 'Unexpected personal app request fields', 'PERSONAL_APP_INVALID');
  }
  return body;
};
export function registerPersonalAppRoutes({ add, paths, readStoredConversation, conversationRuntime } = {}) {
  if (typeof add !== 'function') throw new TypeError('Studio add() required');
  const apps = createPersonalAppService({ paths });
  const providerReply = createProviderReplyBuilder({ apps, readStoredConversation });
  // Background "Design with my AI" jobs over the SAME in-process conversation runtime (no second driver).
  const aiDesign = conversationRuntime && typeof conversationRuntime.get === 'function' && typeof conversationRuntime.submit === 'function'
    ? createAiDesignJobs({ apps, conversations: conversationRuntime, providerReply, paths }) : null;
  const designJobs = () => aiDesign ?? (() => { throw problem(501, 'Design with my AI needs the conversation runtime', 'AI_DESIGN_UNAVAILABLE'); })();
  const content = createPersonalAppContentService({ paths, apps });
  add('GET', '/personal-apps', 'List local user-owned personal mobile app blueprints',
    () => apps.list());
  add('GET', '/personal-apps/templates', 'Choose a safe local app starter', () => apps.templates());
  add('POST', '/personal-apps/from-template', 'Create an app and its starter screens in one local save',
    ({ body }) => apps.fromTemplate(strict(body, ['template', 'title', 'idempotencyKey'])),
    { body: { type: 'object', properties: {
      template: { type: 'string', enum: apps.templates().items.map(item => item.id) },
      title: { type: 'string', minLength: 1, maxLength: 80 },
      idempotencyKey: { type: 'string', minLength: 8, maxLength: 128 },
    }, required: ['template', 'idempotencyKey'], additionalProperties: false } });
  add('POST', '/personal-apps', 'Create a minimal local app blueprint from explicit intent; no provider execution',
    ({ body }) => apps.create(strict(body, ['title', 'intent', 'idempotencyKey'])),
    { body: { type: 'object', properties: {
      title: { type: 'string', minLength: 1, maxLength: 80 },
      intent: { type: 'string', minLength: 1, maxLength: 2000 },
      idempotencyKey: { type: 'string', minLength: 8, maxLength: 128 },
    }, required: ['title', 'intent', 'idempotencyKey'], additionalProperties: false } });
  add('GET', '/personal-apps/{id}', 'Read one locally-owned app blueprint',
    ({ p }) => apps.get(p.id), { pathParameters: { id: { type: 'string', pattern: idPattern } } });
  add('GET', '/personal-apps/{id}/scaffold', 'Read a data-only mobile screen manifest; not installed code',
    ({ p }) => apps.scaffold(p.id), { pathParameters: { id: { type: 'string', pattern: idPattern } } });
  // User-operated local notes/tasks, separate from the AI-readable blueprint.
  // Not published as model tools. GET never creates or changes content.
  add('GET', '/personal-apps/{id}/content', 'Read locally saved notes and tasks for one personal app',
    ({ p }) => content.get(p.id), { pathParameters: { id: { type: 'string', pattern: idPattern } } });
  add('POST', '/personal-apps/{id}/content/items', 'Create a user-authored note or task with idempotent local CAS',
    ({ p, body }) => content.createItem({ id: p.id, ...strict(body, ['expectedVersion', 'idempotencyKey', 'kind', 'title', 'body']) }),
    { body: { type: 'object', properties: {
      expectedVersion: { type: 'integer', minimum: 0 },
      idempotencyKey: { type: 'string', minLength: 8, maxLength: 128 },
      kind: { type: 'string', enum: ['note', 'task'] },
      title: { type: 'string', minLength: 1, maxLength: 160 },
      body: { type: 'string', maxLength: 4000 },
    }, required: ['expectedVersion', 'idempotencyKey', 'kind', 'title'], additionalProperties: false },
    pathParameters: { id: { type: 'string', pattern: idPattern } } });
  add('POST', '/personal-apps/{id}/content/items/{itemId}/completion',
    'Change a local task completion flag with strict content revision matching',
    ({ p, body }) => content.setTaskComplete({
      id: p.id, itemId: p.itemId, ...strict(body, ['expectedVersion', 'completed']),
    }), { body: { type: 'object', properties: {
      expectedVersion: { type: 'integer', minimum: 1 },
      completed: { type: 'boolean' },
    }, required: ['expectedVersion', 'completed'], additionalProperties: false },
    pathParameters: {
      id: { type: 'string', pattern: idPattern },
      itemId: { type: 'string', pattern: '^item-[a-f0-9]{32}$' },
    } });
  // This is a nonexecuting compiler boundary, not a model API and not a browser effect.
  add('POST', '/personal-apps/{id}/preview-change', 'Validate and preview an untrusted declarative app proposal',
    ({ p, body }) => apps.previewChange({ id: p.id, ...strict(body, ['proposal']) }),
    { body: { type: 'object', properties: {
      proposal: { type: ['string', 'object'], description: 'Strict JSON screen-change proposal' },
    }, required: ['proposal'], additionalProperties: false } });
  add('POST', '/personal-apps/{id}/apply-change', 'Apply an explicit user-approved declarative change with CAS',
    ({ p, body }) => apps.applyChange({ id: p.id, ...strict(body, ['expectedVersion', 'proposal', 'approval']) }),
```

_First 80 of 136 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
