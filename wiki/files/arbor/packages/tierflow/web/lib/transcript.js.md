# File: packages/tierflow/web/lib/transcript.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/web/lib/transcript.js |
| Language | JavaScript |
| Kind | source |
| Size | 3093 B |
| Lines | 106 |
| Hash | 57a24d0c9c3f |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| createTranscript | function | 12 | yes | export function createTranscript(listEl, options) { |
| opts | const | 13 | no | const opts = options \|\| {}; |
| maxNodes | const | 14 | no | const maxNodes = typeof opts.max === &quot;number&quot; ? opts.max : 300; |
| fragment | const | 15 | no | const fragment = document.createDocumentFragment(); |
| pending | variable | 16 | no | let pending = 0; |
| pinned | variable | 17 | no | let pinned = true; |
| api | const | 19 | no | const api = { |
| onScroll | function | 30 | no | function onScroll() { |
| distance | const | 31 | no | const distance = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight; |
| next | const | 32 | no | const next = distance &lt; 32; |
| build | function | 40 | no | function build(entry) { |
| li | const | 41 | no | const li = el(&quot;li&quot;, &quot;tln tln--&quot; + (entry.kind \|\| &quot;sys&quot;)); |
| body | const | 45 | no | const body = el(&quot;span&quot;, &quot;tln__body&quot;); |
| add | function | 52 | no | function add(entry) { |
| rule | function | 58 | no | function rule(text) { |
| li | const | 59 | no | const li = el(&quot;li&quot;, &quot;tln tln--rule&quot;); |
| lowWater | const | 67 | no | const lowWater = Math.max(20, Math.floor(maxNodes * 0.8)); |
| prune | function | 69 | no | function prune() { |
| commit | function | 76 | no | function commit() { |
| clear | function | 84 | no | function clear() { |
| scrollToLive | function | 91 | no | function scrollToLive() { |
| isPinned | function | 97 | no | function isPinned() { |
| count | function | 101 | no | function count() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./dom.js | import | 9 | [packages/tierflow/web/lib/dom.js](./dom.js.md) |
| ./format.js | import | 10 | [packages/tierflow/web/lib/format.js](./format.js.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/web/app.js](../app.js.md) | ./lib/transcript.js |

## Annotations

_No annotations._

## Excerpt

```javascript
// Transcript console.
//
// Tier 1 conversation, Tier 2 narrated decisions and Tier 3 alerts are
// interleaved chronologically in one list. JSON payloads collapse to a single
// summary line. The list is capped: once it exceeds the node budget the
// oldest rows are pruned in batches so a synthetic 2000 ev/s load cannot grow
// the DOM without bound.

import { el } from "./dom.js";
import { fmtClock } from "./format.js";

export function createTranscript(listEl, options) {
  const opts = options || {};
  const maxNodes = typeof opts.max === "number" ? opts.max : 300;
  const fragment = document.createDocumentFragment();
  let pending = 0;
  let pinned = true;

  const api = {
    onPinChange: null,
    add: add,
    rule: rule,
    commit: commit,
    clear: clear,
    scrollToLive: scrollToLive,
    isPinned: isPinned,
    count: count,
  };

  function onScroll() {
    const distance = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight;
    const next = distance < 32;
    if (next !== pinned) {
      pinned = next;
      if (api.onPinChange) api.onPinChange(pinned);
    }
  }
  listEl.addEventListener("scroll", onScroll, { passive: true });

  function build(entry) {
    const li = el("li", "tln tln--" + (entry.kind || "sys"));
    li.appendChild(el("span", "tln__time", fmtClock(entry.ts)));
    li.appendChild(el("span", "tln__tag", entry.tag || "SYS"));
    li.appendChild(el("span", "tln__type", entry.type || ""));
    const body = el("span", "tln__body");
    if (entry.text) body.appendChild(el("span", "tln__text", entry.text));
    if (entry.summary) body.appendChild(el("span", "tln__sum", entry.summary));
    li.appendChild(body);
    return li;
  }

  function add(entry) {
    if (!entry) return;
    fragment.appendChild(build(entry));
    pending += 1;
  }

  function rule(text) {
    const li = el("li", "tln tln--rule");
    li.appendChild(el("span", "tln__rule", text || ""));
    fragment.appendChild(li);
    pending += 1;
  }

  // Prune to a low-water mark rather than one node at a time, so the list
  // never overshoots the budget and the removal cost is amortised.
  const lowWater = Math.max(20, Math.floor(maxNodes * 0.8));

  function prune() {
    if (listEl.children.length <= maxNodes) return;
    while (listEl.children.length > lowWater) {
      listEl.removeChild(listEl.firstChild);
    }
  }

  function commit() {
    if (!pending) return;
    pending = 0;
    listEl.appendChild(fragment);
    prune();
```

_First 80 of 107 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
