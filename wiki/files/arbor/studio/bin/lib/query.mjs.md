# File: studio/bin/lib/query.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/lib/query.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3867 B |
| Lines | 75 |
| Hash | 97150443c5cf |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TERM | const | 13 | no | const TERM = /^([A-Za-z_][A-Za-z0-9_.\\[\\]-]*)(!=\|&gt;=\|&lt;=\|=\|~\|&gt;\|&lt;\|\\?)(.*)$/; |
| TOP | const | 14 | no | const TOP = new Set([&#39;type&#39;, &#39;typeName&#39;, &#39;eid&#39;, &#39;key&#39;, &#39;scope&#39;, &#39;method&#39;, &#39;observations&#39;, &#39;revisions&#39;, &#39;confidence&#39;, &#39;first&#39;, &#39;last&#39;, &#39;session&#39;, &#39;confidenceBasis&#39;, &#39;idBasis&#39;]); |
| parseQuery | function | 16 | yes | export function parseQuery(tokens) { |
| terms | const | 17 | no | const terms = []; |
| m | const | 19 | no | const m = TERM.exec(raw); |
| fieldValue | function | 29 | yes | export function fieldValue(entity, field) { |
| path | const | 33 | no | const path = field.replace(/^attrs\\./, &#39;&#39;).replace(/\\[(\\d+)\\]/g, &#39;.$1&#39;).split(&#39;.&#39;); |
| cur | variable | 34 | no | let cur = entity.attrs; |
| asText | function | 39 | no | const asText = (v) =&gt; (v === undefined \|\| v === null ? &#39;&#39; : typeof v === &#39;object&#39; ? JSON.stringify(v) : String(v)); |
| matches | function | 41 | yes | export function matches(entity, terms) { |
| values | const | 47 | no | const values = fieldValue(entity, t.field); |
| defined | const | 48 | no | const defined = values.filter((v) =&gt; v !== undefined &amp;&amp; v !== null); |
| ok | variable | 49 | no | let ok; |
| rhs | const | 56 | no | const rhs = Number(t.rhs); |
| attrSummary | function | 66 | yes | export function attrSummary(attrs, max = 100) { |
| parts | const | 67 | no | const parts = []; |
| s | const | 73 | no | const s = parts.join(&#39; &#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./ui.mjs | import | 11 | [studio/bin/lib/ui.mjs](./ui.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/knowledge.mjs](../commands/knowledge.mjs.md) | ../lib/query.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// A tiny entity query language for "studio knowledge query".
//   type=Message            exact (case-insensitive); a|b means either
//   attrs.role=assistant    nested field (the "attrs." prefix is optional: role=assistant)
//   text~hello              contains (case-insensitive)
//   observations>3          numeric comparison (>, >=, <, <=)
//   title!=Untitled         not equal
//   email?                  field exists
//   hello                   bare word: appears anywhere in the entity
// All terms must match (AND). Fields: type|typeName, eid, key, scope, method, observations,
// revisions (count), confidence, first, last, or any attribute.
import { usageError } from './ui.mjs';

const TERM = /^([A-Za-z_][A-Za-z0-9_.\[\]-]*)(!=|>=|<=|=|~|>|<|\?)(.*)$/;
const TOP = new Set(['type', 'typeName', 'eid', 'key', 'scope', 'method', 'observations', 'revisions', 'confidence', 'first', 'last', 'session', 'confidenceBasis', 'idBasis']);

export function parseQuery(tokens) {
  const terms = [];
  for (const raw of tokens) {
    const m = TERM.exec(raw);
    if (!m) { terms.push({ kind: 'text', needle: raw.toLowerCase() }); continue; }
    const [, field, op, rhs] = m;
    if (op === '?' && rhs !== '') { terms.push({ kind: 'text', needle: raw.toLowerCase() }); continue; }
    terms.push({ kind: 'field', field, op, rhs, alternatives: rhs.split('|').map((x) => x.toLowerCase()) });
  }
  if (!terms.length) throw usageError('Empty query.', 'Example: studio knowledge query type=Message role=assistant text~hello');
  return terms;
}

export function fieldValue(entity, field) {
  if (field === 'type' || field === 'typeName') return field === 'type' ? [entity.typeName, entity.type] : [entity.typeName];
  if (field === 'revisions') return [Array.isArray(entity.revisions) ? entity.revisions.length : 0];
  if (TOP.has(field)) return [entity[field]];
  const path = field.replace(/^attrs\./, '').replace(/\[(\d+)\]/g, '.$1').split('.');
  let cur = entity.attrs;
  for (const p of path) { if (cur === null || cur === undefined) return [undefined]; cur = cur[p]; }
  return [cur];
}

const asText = (v) => (v === undefined || v === null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));

export function matches(entity, terms) {
  for (const t of terms) {
    if (t.kind === 'text') {
      if (!JSON.stringify([entity.eid, entity.typeName, entity.key, entity.attrs]).toLowerCase().includes(t.needle)) return false;
      continue;
    }
    const values = fieldValue(entity, t.field);
    const defined = values.filter((v) => v !== undefined && v !== null);
    let ok;
    switch (t.op) {
      case '?': ok = defined.length > 0; break;
      case '=': ok = defined.some((v) => t.alternatives.includes(asText(v).toLowerCase())); break;
      case '!=': ok = !defined.some((v) => t.alternatives.includes(asText(v).toLowerCase())); break;
      case '~': ok = defined.some((v) => t.alternatives.some((a) => asText(v).toLowerCase().includes(a))); break;
      default: {
        const rhs = Number(t.rhs);
        ok = Number.isFinite(rhs) && defined.some((v) => { const n = Number(v); return Number.isFinite(n) && (t.op === '>' ? n > rhs : t.op === '>=' ? n >= rhs : t.op === '<' ? n < rhs : n <= rhs); });
      }
    }
    if (!ok) return false;
  }
  return true;
}

// Short human summary of an entity's attributes for table cells.
export function attrSummary(attrs, max = 100) {
  const parts = [];
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === null || v === undefined) continue;
    parts.push(`${k}=${typeof v === 'string' ? v.replace(/\s+/g, ' ').slice(0, 40) : JSON.stringify(v).slice(0, 40)}`);
    if (parts.join(' ').length > max) break;
  }
  const s = parts.join(' ');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
