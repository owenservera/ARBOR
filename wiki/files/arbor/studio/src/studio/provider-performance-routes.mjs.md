# File: studio/src/studio/provider-performance-routes.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/provider-performance-routes.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 405 B |
| Lines | 7 |
| Hash | 91874680ab4d |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| registerProviderPerformanceRoutes | function | 3 | yes | export function registerProviderPerformanceRoutes({ add, paths }) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./provider-performance.mjs | import | 1 | [studio/src/studio/provider-performance.mjs](./provider-performance.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/integration-hub.mjs](./integration-hub.mjs.md) | ./provider-performance-routes.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { readProviderPerformance } from './provider-performance.mjs';

export function registerProviderPerformanceRoutes({ add, paths }) {
  add('GET', '/providers/performance',
    'Read-only per-provider performance summary from saved comparison and AI-design job files (latest 200 per kind; no browser action)',
    () => readProviderPerformance({ paths }), { tool: 'provider_performance' });
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
