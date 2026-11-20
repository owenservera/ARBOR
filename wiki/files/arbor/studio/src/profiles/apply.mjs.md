# File: studio/src/profiles/apply.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/profiles/apply.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2336 B |
| Lines | 38 |
| Hash | ee28cae50c33 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| applySuggestion | function | 2 | yes | export function applySuggestion(profile, suggestion, { action = &#39;accept&#39;, edits = {} } = {}) { |
| p | const | 3 | no | const p = structuredClone(profile); |
| stamp | const | 6 | no | const stamp = { id: suggestion.id, kind: suggestion.kind, title: suggestion.title, at: new Date().toISOString() }; |
| prop | const | 12 | no | const prop = { ...(suggestion.proposal ?? {}), ...edits }; |
| rule | const | 18 | no | const rule = { ...prop.rule, ...(edits.rule ?? {}) }; |
| i | const | 19 | no | const i = p.records.findIndex((r) =&gt; r.name === rule.name); |
| chosen | const | 26 | no | const chosen = (edits.mappings ?? prop.mappings ?? []).filter((m) =&gt; !m.skip); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/profiles.mjs](../../bin/commands/profiles.mjs.md) | ../../src/profiles/apply.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../profiles/apply.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Turn an accepted (optionally edited) suggestion into a new profile version.
export function applySuggestion(profile, suggestion, { action = 'accept', edits = {} } = {}) {
  const p = structuredClone(profile);
  p.capture ??= {}; p.shapes ??= {}; p.records ??= [];
  p.shapes.renames ??= {}; p.shapes.excluded ??= []; p.shapes.accepted ??= []; p.shapes.retention ??= {};
  const stamp = { id: suggestion.id, kind: suggestion.kind, title: suggestion.title, at: new Date().toISOString() };

  if (action === 'reject') {
    if (!p.shapes.excluded.some((x) => x.id === suggestion.id)) p.shapes.excluded.push(stamp);
    return { profile: p, note: `rejected: ${suggestion.title}` };
  }
  const prop = { ...(suggestion.proposal ?? {}), ...edits };
  switch (prop.op) {
    case 'include_url': if (!p.capture.include?.includes(prop.pattern)) (p.capture.include ??= []).push(prop.pattern); break;
    case 'exclude_url': if (!p.capture.exclude?.includes(prop.pattern)) (p.capture.exclude ??= []).push(prop.pattern); break;
    case 'rename_shape': p.shapes.renames[prop.group] = prop.name; break;
    case 'record_rule': {
      const rule = { ...prop.rule, ...(edits.rule ?? {}) };
      const i = p.records.findIndex((r) => r.name === rule.name);
      if (i >= 0) p.records[i] = rule; else p.records.push(rule);
      break;
    }
    case 'retain_revisions': p.shapes.retention[prop.endpoint] = prop.choice ?? 'all'; break;
    case 'link_family': {
      p.family = prop.family;
      const chosen = (edits.mappings ?? prop.mappings ?? []).filter((m) => !m.skip);
      p.familyMappings = chosen.map((m) => ({ entity: m.entity, source: m.source, fields: m.fields, confidence: m.confidence }));
      break;
    }
    case 'add_family_mapping': (p.familyMappings ??= []).push(prop.mapping); break;
    case 'remap_family': if (prop.mapping) p.familyMappings[prop.index] = prop.mapping; break;
    default: break; // observation-only suggestion: confirmation is recorded below
  }
  p.shapes.accepted = p.shapes.accepted.filter((x) => x.id !== suggestion.id);
  p.shapes.accepted.push({ ...stamp, edits: Object.keys(edits).length ? edits : undefined });
  p.shapes.excluded = p.shapes.excluded.filter((x) => x.id !== suggestion.id);
  return { profile: p, note: `accepted: ${suggestion.title}` };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
