# File: packages/tierflow/web/lib/runboard.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/web/lib/runboard.js |
| Language | JavaScript |
| Kind | source |
| Size | 7031 B |
| Lines | 215 |
| Hash | cd306787b308 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_CARDS | const | 11 | no | const MAX_CARDS = 40; |
| createRunBoard | function | 13 | yes | export function createRunBoard(listEl, options) { |
| opts | const | 14 | no | const opts = options \|\| {}; |
| onStop | const | 15 | no | const onStop = opts.onStop \|\| null; |
| cards | const | 16 | no | const cards = new Map(); |
| formatArgv | function | 18 | no | function formatArgv(argv) { |
| build | function | 27 | no | function build(run) { |
| root | const | 28 | no | const root = el(&quot;article&quot;, &quot;run&quot;); |
| top | const | 32 | no | const top = el(&quot;div&quot;, &quot;run__top&quot;); |
| kind | const | 33 | no | const kind = el(&quot;span&quot;, &quot;run__kind&quot;, String(run.kind \|\| &quot;exec&quot;).toUpperCase()); |
| label | const | 34 | no | const label = el(&quot;span&quot;, &quot;run__label&quot;, run.label \|\| run.runId); |
| chip | const | 35 | no | const chip = el(&quot;span&quot;, &quot;chip&quot;, &quot;QUEUED&quot;); |
| argvText | const | 40 | no | const argvText = formatArgv(run.argv); |
| argv | const | 41 | no | const argv = el(&quot;code&quot;, &quot;run__argv&quot;, argvText \|\| &quot;argv pending&quot;); |
| grid | const | 44 | no | const grid = el(&quot;div&quot;, &quot;run__grid&quot;); |
| cells | const | 45 | no | const cells = {}; |
| defs | const | 46 | no | const defs = [ |
| cell | const | 53 | no | const cell = el(&quot;span&quot;, &quot;run__cell&quot;); |
| value | const | 55 | no | const value = el(&quot;i&quot;, null, &quot;--&quot;); |
| stop | const | 61 | no | const stop = el(&quot;button&quot;, &quot;run__stop&quot;, &quot;Stop&quot;); |
| foot | const | 69 | no | const foot = el(&quot;div&quot;, &quot;run__foot&quot;); |
| applyState | function | 94 | no | function applyState(card, state) { |
| applyMeta | function | 103 | no | function applyMeta(card, run) { |
| text | const | 111 | no | const text = formatArgv(run.argv); |
| trim | function | 126 | no | function trim() { |
| oldestId | variable | 128 | no | let oldestId = null; |
| oldest | variable | 129 | no | let oldest = null; |
| upsert | function | 143 | no | function upsert(run) { |
| card | variable | 145 | no | let card = cards.get(run.runId); |
| setState | function | 156 | no | function setState(runId, state, event) { |
| card | variable | 157 | no | let card = cards.get(runId); |
| data | const | 163 | no | const data = (event &amp;&amp; event.data) \|\| {}; |
| replaceAll | function | 175 | no | function replaceAll(runs) { |
| list | const | 178 | no | const list = runs \|\| []; |
| tick | function | 182 | no | function tick(now) { |
| activeCount | function | 191 | no | function activeCount() { |
| n | variable | 192 | no | let n = 0; |
| total | function | 199 | no | function total() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./dom.js | import | 8 | [packages/tierflow/web/lib/dom.js](./dom.js.md) |
| ./format.js | import | 9 | [packages/tierflow/web/lib/format.js](./format.js.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/web/app.js](../app.js.md) | ./lib/runboard.js |

## Annotations

_No annotations._

## Excerpt

```javascript
// Run board.
//
// One card per RunMeta. Cards are created newest-first and updated in place,
// never re-rendered, so the board stays cheap while a synthetic load pushes
// thousands of events through it. The card count is capped and the panel
// scrolls internally.

import { el, clear } from "./dom.js";
import { fmtNum, fmtDur, truncate } from "./format.js";

const MAX_CARDS = 40;

export function createRunBoard(listEl, options) {
  const opts = options || {};
  const onStop = opts.onStop || null;
  const cards = new Map();

  function formatArgv(argv) {
    if (!argv || !argv.length) return "";
    return argv
      .map(function (part) {
        return /\s/.test(part) ? '"' + part + '"' : part;
      })
      .join(" ");
  }

  function build(run) {
    const root = el("article", "run");
    root.dataset.run = run.runId;
    root.dataset.state = run.state || "queued";

    const top = el("div", "run__top");
    const kind = el("span", "run__kind", String(run.kind || "exec").toUpperCase());
    const label = el("span", "run__label", run.label || run.runId);
    const chip = el("span", "chip", "QUEUED");
    top.appendChild(kind);
    top.appendChild(label);
    top.appendChild(chip);

    const argvText = formatArgv(run.argv);
    const argv = el("code", "run__argv", argvText || "argv pending");
    if (argvText) argv.title = argvText;

    const grid = el("div", "run__grid");
    const cells = {};
    const defs = [
      ["OUT", "OUT"],
      ["ERR", "ERR"],
      ["TIME", "TIME"],
      ["EXIT", "EXIT"],
    ];
    for (let i = 0; i < defs.length; i += 1) {
      const cell = el("span", "run__cell");
      cell.appendChild(el("b", null, defs[i][0]));
      const value = el("i", null, "--");
      cell.appendChild(value);
      grid.appendChild(cell);
      cells[defs[i][1]] = value;
    }

    const stop = el("button", "run__stop", "Stop");
    stop.type = "button";
    stop.setAttribute("aria-label", "Stop run " + (run.label || run.runId));
    stop.addEventListener("click", function (event) {
      event.stopPropagation();
      if (onStop) onStop(run.runId);
    });

    const foot = el("div", "run__foot");
    foot.appendChild(el("span", "run__id", truncate(run.runId || "", 22)));
    foot.appendChild(stop);

    root.appendChild(top);
    root.appendChild(argv);
    root.appendChild(grid);
    root.appendChild(foot);

    return {
      root: root,
      chip: chip,
```

_First 80 of 216 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
