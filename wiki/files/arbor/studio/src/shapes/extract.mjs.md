# File: studio/src/shapes/extract.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/shapes/extract.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4682 B |
| Lines | 86 |
| Hash | 8108061b5c6f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| selectorCache | const | 4 | no | const selectorCache = new Map(); |
| compileSelector | function | 8 | yes | export function compileSelector(path) { |
| tokens | const | 12 | no | const tokens = []; |
| re | const | 13 | no | const re = /\\.([A-Za-z_$][\\w$]*)\|\\[\\*\\]\|\\[(\\d+)\\]\|\\[&quot;((?:[^&quot;\\\\]\|\\\\.)*)&quot;\\]/y; |
| rest | const | 14 | no | const rest = path.replace(/^\\$/, &#39;&#39;); |
| offset | variable | 15 | no | let offset = 0; |
| selector | function | 22 | no | const selector = (value) =&gt; { |
| cur | variable | 23 | no | let cur = [value]; |
| next | const | 25 | no | const next = []; |
| ruleMatchesEvent | function | 45 | yes | export function ruleMatchesEvent(rule, ev, stream) { |
| disc | function | 48 | no | const disc = (d) =&gt; !d.discriminatorPath \|\| (d.discriminatorPath === &#39;event&#39; ? ev.event : select(ev.json, d.discriminatorPath)[0]) === d.discriminator; |
| extractRecords | function | 53 | yes | export function extractRecords(rule, ev, stream) { |
| items | const | 54 | no | const items = select(ev.json, rule.itemsPath ?? &#39;$&#39;); |
| rec | const | 56 | no | const rec = { _rule: rule.name, _sid: ev.sid, _seq: ev.seq, _t: ev.t }; |
| f | const | 58 | no | const f = typeof spec === &#39;string&#39; ? { path: spec } : spec; |
| v | const | 60 | no | const v = select(item, f.path); |
| extractFromAssembled | function | 69 | yes | export function extractFromAssembled(rule, doc, stream) { |
| coerce | function | 76 | yes | export function coerce(v, type) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./infer.mjs | import | 2 | [studio/src/shapes/infer.mjs](./infer.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/families/families.mjs](../families/families.mjs.md) | ../shapes/extract.mjs |
| [studio/src/replay/derive.mjs](../replay/derive.mjs.md) | ../shapes/extract.mjs |
| [studio/src/shapes/infer.mjs](./infer.mjs.md) | ./extract.mjs |
| [studio/src/studio/server.mjs](../studio/server.mjs.md) | ../shapes/extract.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Apply accepted profile rules to decoded events -> structured records (datasets).
import { templateUrl } from './infer.mjs';

const selectorCache = new Map();

// Fully consumed, cached JSONPath subset. Unsupported syntax cannot silently select the root
// or a shorter prefix, and inherited prototype properties are never payload observations.
export function compileSelector(path) {
  if (!path || path === '$') return (value) => [value];
  if (typeof path !== 'string') throw new TypeError('Selection path must be a string');
  if (selectorCache.has(path)) return selectorCache.get(path);
  const tokens = [];
  const re = /\.([A-Za-z_$][\w$]*)|\[\*\]|\[(\d+)\]|\["((?:[^"\\]|\\.)*)"\]/y;
  const rest = path.replace(/^\$/, '');
  let offset = 0;
  while (offset < rest.length) {
    re.lastIndex = offset; const match = re.exec(rest);
    if (!match) throw new Error(`Unsupported selection path at offset ${offset}: ${path}`);
    tokens.push(match[1] !== undefined ? { key: match[1] } : match[2] !== undefined ? { index: Number(match[2]) } : match[3] !== undefined ? { key: JSON.parse(`"${match[3]}"`) } : { star: true });
    offset = re.lastIndex;
  }
  const selector = (value) => {
    let cur = [value];
    for (const t of tokens) {
      const next = [];
      for (const v of cur) {
        if (v === null || v === undefined) continue;
        if (t.star) { if (typeof v === 'object') for (const x of Object.values(v)) next.push(x); }
        else if (t.index !== undefined) { if (Array.isArray(v) && Object.hasOwn(v, t.index)) next.push(v[t.index]); }
        else if (typeof v === 'object' && Object.hasOwn(v, t.key)) next.push(v[t.key]);
      }
      cur = next;
    }
    return cur;
  };
  if (selectorCache.size >= 256) selectorCache.delete(selectorCache.keys().next().value);
  selectorCache.set(path, selector); return selector;
}

// Invalid drafts return no selected values; compileSelector exposes diagnostics to editors.
export function select(value, path) {
  try { return compileSelector(path)(value); } catch { return []; }
}

export function ruleMatchesEvent(rule, ev, stream) {
  if (rule.source !== 'event' || ev.json === undefined) return false;
  if (rule.endpoint && !new RegExp(rule.endpoint).test(templateUrl(stream?.url ?? ''))) return false;
  const disc = (d) => !d.discriminatorPath || (d.discriminatorPath === 'event' ? ev.event : select(ev.json, d.discriminatorPath)[0]) === d.discriminator;
  if (rule.anyOf) return rule.anyOf.some(disc);
  return disc(rule);
}

export function extractRecords(rule, ev, stream) {
  const items = select(ev.json, rule.itemsPath ?? '$');
  return items.filter((x) => x && typeof x === 'object' && (!rule.itemFilter || select(x, rule.itemFilter.path)[0] === rule.itemFilter.equals)).map((item) => {
    const rec = { _rule: rule.name, _sid: ev.sid, _seq: ev.seq, _t: ev.t };
    for (const [name, spec] of Object.entries(rule.fields ?? {})) {
      const f = typeof spec === 'string' ? { path: spec } : spec;
      if (f.exclude) continue;
      const v = select(item, f.path);
      rec[f.as ?? name] = coerce(v.length <= 1 ? v[0] : v, f.type);
    }
    if (rule.key) rec._key = select(item, rule.key)[0];
    return rec;
  });
}

// For "assembled" rules: records from the final assembled document of a delta stream.
export function extractFromAssembled(rule, doc, stream) {
  if (rule.source !== 'assembled' || !doc) return [];
  if (rule.endpoint && !new RegExp(rule.endpoint).test(templateUrl(stream?.url ?? ''))) return [];
  return extractRecords({ ...rule, source: 'event' }, { json: doc, sid: stream.sid, seq: null, t: stream.endT }, stream);
}

// Field types chosen in the model editor are applied on output; the raw value stays on disk.
export function coerce(v, type) {
  if (v === undefined || v === null || !type || type === 'auto') return v;
  try {
    if (type === 'number') { if (typeof v !== 'number' && (typeof v !== 'string' || !v.trim())) return v; const n = Number(v); return Number.isFinite(n) ? n : v; }
    if (type === 'string' || type === 'text') return typeof v === 'string' ? v : JSON.stringify(v);
```

_First 80 of 87 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
