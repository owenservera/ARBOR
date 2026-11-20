# File: studio/src/export/capabilities.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/export/capabilities.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 680 B |
| Lines | 11 |
| Hash | 68849cfe8a9a |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| exportCapability | function | 2 | yes | export async function exportCapability(relativePath, name, label) { |
| mod | variable | 3 | no | let mod; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/export/graph-ranked.mjs](./graph-ranked.mjs.md) | ./capabilities.mjs |
| [studio/src/export/schemas.mjs](./schemas.mjs.md) | ./capabilities.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Optional engines must not prevent existing export formats from loading.
export async function exportCapability(relativePath, name, label) {
  let mod;
  try { mod = await import(new URL(relativePath, import.meta.url)); }
  catch (error) {
    if (!['ERR_MODULE_NOT_FOUND', 'MODULE_NOT_FOUND', 'ENOENT'].includes(error.code)) throw error;
    throw Object.assign(new Error(`${label} is not available in this build: ${error.message}`), { code: 'CAPABILITY_UNAVAILABLE' });
  }
  if (typeof mod[name] !== 'function') throw Object.assign(new Error(`${label} is not available in this build (missing ${name}).`), { code: 'CAPABILITY_UNAVAILABLE' });
  return mod[name];
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
