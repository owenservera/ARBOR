# File: studio/src/studio/tool-result.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/tool-result.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 896 B |
| Lines | 16 |
| Hash | 555f4bf3dfe5 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PRIVATE_FIELDS | const | 4 | no | const PRIVATE_FIELDS = new Set([&#39;text&#39;, &#39;prompt&#39;, &#39;title&#39;, &#39;content&#39;, &#39;body&#39;, &#39;html&#39;, &#39;markdown&#39;, &#39;raw&#39;]); |
| metadataOnly | function | 6 | yes | export function metadataOnly(value, depth = 0) { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/tools.mjs](../../bin/commands/tools.mjs.md) | ../../src/studio/tool-result.mjs |
| [studio/src/recipes/service.mjs](../recipes/service.mjs.md) | ../studio/tool-result.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Canonical privacy-safe result projection for CLI, agent recipes and tool clients.
// Preserve identifiers, states, revisions, coverage and source links; never echo prompt/reply
// bodies or natural-language titles unless the caller explicitly opts in to full content.
const PRIVATE_FIELDS = new Set(['text', 'prompt', 'title', 'content', 'body', 'html', 'markdown', 'raw']);

export function metadataOnly(value, depth = 0) {
  // Bounded depth avoids accidentally serializing untrusted cyclic or enormous provider shapes.
  if (depth > 32) return null;
  if (Array.isArray(value)) return value.map((item) => metadataOnly(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !PRIVATE_FIELDS.has(key))
      .map(([key, item]) => [key, metadataOnly(item, depth + 1)]));
  }
  return value;
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
