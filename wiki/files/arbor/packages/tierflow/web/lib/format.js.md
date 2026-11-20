# File: packages/tierflow/web/lib/format.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/web/lib/format.js |
| Language | JavaScript |
| Kind | source |
| Size | 3179 B |
| Lines | 87 |
| Hash | b3a143c3d413 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FONT_MONO | const | 4 | yes | export const FONT_MONO = &#39;ui-monospace, &quot;Cascadia Mono&quot;, &quot;SF Mono&quot;, Menlo, Consolas, monospace&#39;; |
| NUM | const | 6 | no | const NUM = new Intl.NumberFormat(&quot;en-US&quot;); |
| fmtNum | function | 8 | yes | export function fmtNum(value) { |
| fmtCompact | function | 13 | yes | export function fmtCompact(value) { |
| abs | const | 15 | no | const abs = Math.abs(value); |
| fmtClock | function | 21 | yes | export function fmtClock(ts) { |
| d | const | 23 | no | const d = new Date(ts); |
| p | function | 24 | no | const p = (n, w) =&gt; String(n).padStart(w, &quot;0&quot;); |
| fmtDur | function | 30 | yes | export function fmtDur(ms) { |
| secs | const | 34 | no | const secs = Math.floor(ms / 1000); |
| mins | const | 35 | no | const mins = Math.floor(secs / 60); |
| hrs | const | 37 | no | const hrs = Math.floor(mins / 60); |
| fmtUs | function | 41 | yes | export function fmtUs(us) { |
| truncate | function | 47 | yes | export function truncate(text, max) { |
| limit | const | 49 | no | const limit = typeof max === &quot;number&quot; &amp;&amp; max &gt; 4 ? max : 120; |
| summarize | function | 55 | yes | export function summarize(data, max) { |
| limit | const | 57 | no | const limit = typeof max === &quot;number&quot; ? max : 170; |
| parts | const | 58 | no | const parts = []; |
| value | const | 61 | no | const value = data[key]; |
| line | const | 70 | no | const line = parts.join(&quot; · &quot;); |
| summarizeText | function | 75 | yes | export function summarizeText(text) { |
| trimmed | const | 77 | no | const trimmed = text.trim(); |
| first | const | 79 | no | const first = trimmed.charAt(0); |
| parsed | const | 82 | no | const parsed = JSON.parse(trimmed); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/web/app.js](../app.js.md) | ./lib/format.js |
| [packages/tierflow/web/lib/runboard.js](./runboard.js.md) | ./format.js |
| [packages/tierflow/web/lib/timeline.js](./timeline.js.md) | ./format.js |
| [packages/tierflow/web/lib/topology.js](./topology.js.md) | ./format.js |
| [packages/tierflow/web/lib/transcript.js](./transcript.js.md) | ./format.js |

## Annotations

_No annotations._

## Excerpt

```javascript
// Formatting helpers shared by every view. All numbers are rendered with
// tabular figures where possible so readouts do not jitter while ticking.

export const FONT_MONO = 'ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, monospace';

const NUM = new Intl.NumberFormat("en-US");

export function fmtNum(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0";
  return NUM.format(value);
}

export function fmtCompact(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs < 1000) return String(Math.round(value));
  if (abs < 1000000) return (value / 1000).toFixed(abs < 10000 ? 1 : 0) + "k";
  return (value / 1000000).toFixed(2) + "M";
}

export function fmtClock(ts) {
  if (typeof ts !== "number" || !Number.isFinite(ts)) return "--:--:--.---";
  const d = new Date(ts);
  const p = (n, w) => String(n).padStart(w, "0");
  return (
    p(d.getHours(), 2) + ":" + p(d.getMinutes(), 2) + ":" + p(d.getSeconds(), 2) + "." + p(d.getMilliseconds(), 3)
  );
}

export function fmtDur(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "--";
  if (ms < 1000) return Math.round(ms) + "ms";
  if (ms < 60000) return (ms / 1000).toFixed(1) + "s";
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins + "m" + String(secs % 60).padStart(2, "0") + "s";
  const hrs = Math.floor(mins / 60);
  return hrs + "h" + String(mins % 60).padStart(2, "0") + "m";
}

export function fmtUs(us) {
  if (typeof us !== "number" || !Number.isFinite(us)) return "--";
  if (us < 1000) return Math.round(us) + "µs";
  return (us / 1000).toFixed(2) + "ms";
}

export function truncate(text, max) {
  if (typeof text !== "string") return "";
  const limit = typeof max === "number" && max > 4 ? max : 120;
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1) + "…";
}

// Collapses a scalar-only payload into a single readable line.
export function summarize(data, max) {
  if (!data || typeof data !== "object") return "";
  const limit = typeof max === "number" ? max : 170;
  const parts = [];
  try {
    for (const key of Object.keys(data)) {
      const value = data[key];
      if (value === null) parts.push(key + "=null");
      else if (typeof value === "object") parts.push(key + "=" + truncate(JSON.stringify(value), 48));
      else if (typeof value === "string") parts.push(key + "=" + truncate(value, 48));
      else parts.push(key + "=" + String(value));
    }
  } catch (err) {
    return "";
  }
  const line = parts.join(" · ");
  return truncate(line, limit);
}

// If an event text happens to carry JSON, fold it down to one line too.
export function summarizeText(text) {
  if (typeof text !== "string") return "";
  const trimmed = text.trim();
  if (trimmed.length < 2) return "";
  const first = trimmed.charAt(0);
  if (first !== "{" && first !== "[") return "";
```

_First 80 of 88 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
