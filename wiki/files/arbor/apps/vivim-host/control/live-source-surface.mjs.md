# File: apps/vivim-host/control/live-source-surface.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/live-source-surface.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1116 B |
| Lines | 20 |
| Hash | a7ca2bebdf2b |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| createLiveSourceSurface | function | 2 | yes | export async function createLiveSourceSurface({ approvedRoots, dataDir, actorId, sessionId, authorize }) { |
| hq | const | 6 | no | const hq = createDevIntelligence({ mode: &#39;host&#39;, approvedRoots, dataDir, actorId, sessionId, authorize }); |
| result | const | 15 | no | const result = hq.index({ useGit: false }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../../hq/lib/arbor-service.mjs | dynamic | 5 | [hq/lib/arbor-service.mjs](../../../hq/lib/arbor-service.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/development-read-port.mjs](./development-read-port.mjs.md) | ./live-source-surface.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./control/live-source-surface.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Live Host adapter for the existing HQ development index. No demo fallback.
export async function createLiveSourceSurface({ approvedRoots, dataDir, actorId, sessionId, authorize }) {
  if (!Array.isArray(approvedRoots) || !approvedRoots.length)
    throw new Error('HQ_SOURCE_ROOTS_NOT_CONFIGURED');
  const { createDevIntelligence } = await import('../../../hq/lib/arbor-service.mjs');
  const hq = createDevIntelligence({ mode: 'host', approvedRoots, dataDir, actorId, sessionId, authorize });
  return Object.freeze({
    status: () => hq.status(),
    register: params => hq.registerSource(params),
    read: params => hq.fileSurface(params),
    context: params => hq.fileSurfaceContext(params),
    compiledContext: params => hq.compiledContext(params),
    // Same existing incremental index, never a source edit. Git is optional.
    refresh: () => {
      const result = hq.index({ useGit: false });
      return { status: result.errors.length ? 'partial' : result.projects.length ? 'indexed' : 'empty',
        totals: result.totals, errorCount: result.errors.length };
    }
  });
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
