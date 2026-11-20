# File: studio/src/shapes/profiler.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/shapes/profiler.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8406 B |
| Lines | 153 |
| Hash | 18ec9137a986 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| WINDOW_BUFFER_BUDGET | const | 9 | no | const WINDOW_BUFFER_BUDGET = 32 * 1024; |
| approxSize | function | 11 | no | function approxSize(source) { |
| ProfileEntry | class | 20 | no | class ProfileEntry { |
| constructor | method | 21 | yes | constructor(group) { |
| observeCurrent | method | 26 | yes | observeCurrent(value, source) { |
| _materializeCurrent | method | 33 | yes | _materializeCurrent() { |
| node | const | 35 | no | const node = new SchemaNode(); |
| rollWindow | method | 41 | yes | rollWindow() { |
| node | const | 52 | no | const node = new SchemaNode(); |
| OnlineSchemaProfiler | class | 64 | yes | export class OnlineSchemaProfiler { |
| constructor | method | 65 | yes | constructor({ windowSize = 100, minWindow = 10, maxGroups = 256 } = {}) { |
| observe | method | 70 | yes | observe(group, value, source = {}) { |
| entry | variable | 72 | no | let entry = this.groups.get(group); |
| describe | method | 83 | yes | describe(group) { |
| e | const | 84 | no | const e = this.groups.get(String(group)); if (!e) return null; |
| current | const | 85 | no | const current = e.current.describe(); |
| report | method | 91 | yes | report() { return { groups: [...this.groups.keys()].map((key) =&gt; this.describe(key)), evictedGroups: this.evictedGroups, |
| groupKeys | method | 93 | yes | groupKeys() { return [...this.groups.keys()]; } |
| toState | method | 95 | yes | toState() { |
| fromState | method | 101 | yes | static fromState(state, overrides = {}) { |
| p | const | 103 | no | const p = new OnlineSchemaProfiler({ windowSize: state.windowSize ?? 100, minWindow: state.minWindow ?? 10, maxGroups: Math.max(state.maxGroups ?? 256, overrides.maxGroups ?? 0) }); |
| group | const | 107 | no | const group = String(g.group); |
| entry | const | 108 | no | const entry = new ProfileEntry(group); |
| toJsonSchema | function | 119 | yes | export function toJsonSchema(description, { includeExamples = false } = {}) { |
| convert | function | 120 | no | const convert = (d) =&gt; { |
| out | const | 122 | no | const out = {}, type = d.type; |
| kinds | const | 124 | no | const kinds = d.union?.map((v) =&gt; v.kind).filter((k) =&gt; [&#39;string&#39;, &#39;number&#39;, &#39;integer&#39;, &#39;boolean&#39;, &#39;object&#39;, &#39;array&#39;, &#39;null&#39;].includes(k)) ?? []; |
| actual | const | 128 | no | const actual = type === &#39;map&#39; ? &#39;object&#39; : type; |
| fields | const | 131 | no | const fields = d.fields ?? d.object?.fields; |
| required | const | 134 | no | const required = Object.entries(fields).filter(([, child]) =&gt; child.required).map(([key]) =&gt; key); |
| formats | const | 143 | no | const formats = d.string.formats ?? {}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../intel/schema.mjs | import | 1 | [studio/src/intel/schema.mjs](../intel/schema.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/replay/derive-all.mjs](../replay/derive-all.mjs.md) | ../shapes/profiler.mjs |
| [studio/src/shapes/infer.mjs](./infer.mjs.md) | ./profiler.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { SchemaNode, schemaDiff } from '../intel/schema.mjs';

// Window nodes are lazy. A completed window is only ever read as `previous` (and each rollover
// overwrites the one before it), so observing every value into a second SchemaNode is wasted work
// for all but the last two windows. Values of a window are buffered and replayed into a real
// SchemaNode only when something reads `current`/`previous` (describe, toState) - same values,
// same order, so every statistic is identical. Buffering is bounded by an approximate byte budget;
// a window that exceeds it simply switches to an eager node (the previous behaviour).
const WINDOW_BUFFER_BUDGET = 32 * 1024;

function approxSize(source) {
  if (!source || typeof source !== 'object') return 1024;
  if (Array.isArray(source.span) && source.span.length === 2) return Math.max(1, source.span[1] - source.span[0]);
  if (typeof source.data === 'string') return source.data.length;
  if (typeof source.text === 'string') return source.text.length;
  if (Number.isFinite(source.size)) return source.size;
  return 1024;
}

class ProfileEntry {
  constructor(group) {
    this.group = group; this.total = new SchemaNode(); this.windows = 0; this.lastSource = null;
    this._curNode = null; this._curVals = []; this._curBytes = 0; this.curCount = 0;
    this._prev = null; this._prevVals = null;
  }
  observeCurrent(value, source) {
    this.curCount++;
    if (this._curNode) { this._curNode.observe(value); return; }
    this._curBytes += approxSize(source);
    if (this._curBytes > WINDOW_BUFFER_BUDGET) { this._materializeCurrent().observe(value); return; }
    this._curVals.push(value);
  }
  _materializeCurrent() {
    if (!this._curNode) {
      const node = new SchemaNode();
      for (const v of this._curVals) node.observe(v);
      this._curNode = node; this._curVals = [];
    }
    return this._curNode;
  }
  rollWindow() {
    // Equivalent to: previous = current.describe(); current = new SchemaNode(); windows++
    if (this._curNode) { this._prev = this._curNode.describe(); this._prevVals = null; }
    else { this._prevVals = this._curVals; this._prev = null; } // an older unread window is simply dropped
    this._curNode = null; this._curVals = []; this._curBytes = 0; this.curCount = 0;
    this.windows++;
  }
  get current() { return this._materializeCurrent(); }
  set current(node) { this._curNode = node; this._curVals = []; this._curBytes = 0; this.curCount = node.count; }
  get previous() {
    if (this._prevVals) {
      const node = new SchemaNode();
      for (const v of this._prevVals) node.observe(v);
      this._prev = node.describe(); this._prevVals = null;
    }
    return this._prev;
  }
  set previous(v) { this._prev = v ?? null; this._prevVals = null; }
  get hasPrevious() { return !!(this._prevVals || this._prev); }
}

// Cumulative sufficient statistics plus independent fixed-size windows for drift detection.
// Missing fields in a window mean observed schema drift, never deletion of entity state.
export class OnlineSchemaProfiler {
  constructor({ windowSize = 100, minWindow = 10, maxGroups = 256 } = {}) {
    if (!Number.isInteger(windowSize) || windowSize < 2 || !Number.isInteger(maxGroups) || maxGroups < 1) throw new RangeError('Invalid profiler bounds');
    this.windowSize = windowSize; this.minWindow = Math.max(2, Math.min(windowSize, minWindow));
    this.maxGroups = maxGroups; this.groups = new Map(); this.evictedGroups = 0;
  }
  observe(group, value, source = {}) {
    group = String(group);
    let entry = this.groups.get(group);
    if (!entry) {
      if (this.groups.size >= this.maxGroups) { this.groups.delete(this.groups.keys().next().value); this.evictedGroups++; }
      entry = new ProfileEntry(group);
    } else this.groups.delete(group);
    this.groups.set(group, entry);
    if (entry.curCount >= this.windowSize) entry.rollWindow();
    entry.total.observe(value); entry.observeCurrent(value, source);
    entry.lastSource = { session: source.session, sid: source.sid, seq: source.seq, t: source.t };
```

_First 80 of 154 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
