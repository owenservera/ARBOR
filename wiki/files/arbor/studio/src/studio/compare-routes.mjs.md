# File: studio/src/studio/compare-routes.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/compare-routes.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 942 B |
| Lines | 12 |
| Hash | 9126052df2c4 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| registerCompareRoutes | function | 3 | yes | export function registerCompareRoutes({ add, paths, conversationRuntime }) { |
| jobs | const | 5 | no | const jobs = createCompareJobs({ paths, conversations: conversationRuntime }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./compare-service.mjs | import | 1 | [studio/src/studio/compare-service.mjs](./compare-service.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./compare-routes.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { createCompareJobs, COMPARE_SITES } from './compare-service.mjs';

export function registerCompareRoutes({ add, paths, conversationRuntime }) {
  if (!conversationRuntime) return;
  const jobs = createCompareJobs({ paths, conversations: conversationRuntime });
  add('POST', '/compare', 'Ask selected providers using your own web accounts', ({ body }) => jobs.start(body), {
    body: { type: 'object', properties: { question: { type: 'string', minLength: 1, maxLength: 10000 },
      sites: { type: 'array', minItems: 1, maxItems: COMPARE_SITES.length, uniqueItems: true, items: { enum: COMPARE_SITES } } }, required: ['question'] }, successStatus: 202,
  });
  add('GET', '/compare/{jobId}', 'Read a saved comparison', ({ p }) => jobs.get(p.jobId));
  add('POST', '/compare/{jobId}/cancel', 'Stop waiting without repeating any question', ({ p }) => jobs.cancel(p.jobId), { body: { type: 'object', properties: {} } });
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
