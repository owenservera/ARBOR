# File: packages/tierflow/web/lib/dom.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/web/lib/dom.js |
| Language | JavaScript |
| Kind | source |
| Size | 852 B |
| Lines | 30 |
| Hash | 32a5b19f8ebc |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| el | function | 3 | yes | export function el(tag, cls, text) { |
| node | const | 4 | no | const node = document.createElement(tag); |
| svgEl | function | 10 | yes | export function svgEl(tag, attrs) { |
| node | const | 11 | no | const node = document.createElementNS(&quot;http://www.w3.org/2000/svg&quot;, tag); |
| clear | function | 21 | yes | export function clear(node) { |
| setText | function | 25 | yes | export function setText(node, value) { |
| next | const | 26 | no | const next = String(value); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/web/lib/runboard.js](./runboard.js.md) | ./dom.js |
| [packages/tierflow/web/lib/topology.js](./topology.js.md) | ./dom.js |
| [packages/tierflow/web/lib/transcript.js](./transcript.js.md) | ./dom.js |

## Annotations

_No annotations._

## Excerpt

```javascript
// Tiny DOM helpers. No framework, no dependencies.

export function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

export function svgEl(tag, attrs) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  if (attrs) {
    for (const key in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
      node.setAttribute(key, String(attrs[key]));
    }
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function setText(node, value) {
  const next = String(value);
  if (node.textContent === next) return false;
  node.textContent = next;
  return true;
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
