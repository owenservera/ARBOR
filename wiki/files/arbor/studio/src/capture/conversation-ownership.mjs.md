# File: studio/src/capture/conversation-ownership.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/conversation-ownership.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1510 B |
| Lines | 26 |
| Hash | d65b03306974 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ownedFreshTargetIds | function | 3 | yes | export function ownedFreshTargetIds(entries, discovered) { |
| owned | const | 4 | no | const owned = new Set(), conflicts = new Set(); |
| provenance | const | 6 | no | const provenance = entry.freshTargetProvenance; |
| snapshot | variable | 8 | no | let snapshot; |
| matches | const | 12 | no | const matches = discovered.filter((t) =&gt; t.id === provenance.targetId &amp;&amp; (!t.type \|\| t.type === &#39;page&#39;)); |
| origin | variable | 13 | no | let origin = null; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/conversation-runtime.mjs](./conversation-runtime.mjs.md) | ./conversation-ownership.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Read-only enumeration: current runtime provenance is required for an owned tab.
// Historical snapshots, same-origin URLs and recordings cannot grant ownership.
export function ownedFreshTargetIds(entries, discovered) {
  const owned = new Set(), conflicts = new Set();
  for (const entry of entries) {
    const provenance = entry.freshTargetProvenance;
    if (!provenance || entry.recovered || entry.readOnly || entry.pure || entry.finishing) continue;
    let snapshot;
    try { snapshot = entry.service.read(); } catch { continue; }
    if (snapshot.finish?.requested || snapshot.binding?.ownedByStudio !== true
      || snapshot.binding.targetId !== provenance.targetId || snapshot.binding.origin !== provenance.origin) continue;
    const matches = discovered.filter((t) => t.id === provenance.targetId && (!t.type || t.type === 'page'));
    let origin = null;
    try { if (matches.length === 1) origin = new URL(matches[0].url).origin; } catch {}
    if (origin !== provenance.origin) {
      // Revocation is only in-memory. A disappeared or foreign tab cannot regain
      // ownership if Chrome later reuses its target ID.
      entry.freshTargetProvenance = null;
      continue;
    }
    // A contested ID must never be claimed by either entry.
    if (owned.has(provenance.targetId)) { owned.delete(provenance.targetId); conflicts.add(provenance.targetId); }
    else if (!conflicts.has(provenance.targetId)) owned.add(provenance.targetId);
  }
  return owned;
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
