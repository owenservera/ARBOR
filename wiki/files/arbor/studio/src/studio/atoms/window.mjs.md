# File: studio/src/studio/atoms/window.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | studio/src/studio/atoms/window.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 21155 B |
| Lines | 126 |
| Hash | a42155922e63 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| family | const | 8 | yes | export const family = &quot;window&quot;; |
| TITLE | const | 10 | no | const TITLE = { name: &quot;title&quot;, type: &quot;string&quot;, required: true }; |
| INDEX | const | 11 | no | const INDEX = { name: &quot;index&quot;, type: &quot;number&quot;, required: true }; |
| XY | const | 12 | no | const XY = [ |
| SIZE | const | 16 | no | const SIZE = [ |
| ON | const | 20 | no | const ON = { name: &quot;on&quot;, type: &quot;boolean&quot;, required: false }; |
| VIA | const | 21 | no | const VIA = &quot; via evaluate (window-level JS; no OS-window primitive).&quot;; |
| RAW | const | 23 | no | const RAW = [ |
| atoms | const | 126 | yes | export const atoms = RAW.map(makeAtom); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../atom-kit.mjs | import | 6 | [studio/src/studio/atom-kit.mjs](../atom-kit.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Atomic browser registry — family: window (100 atoms).
// OS window management for the browser window Studio owns: focus, blur, minimize, maximize,
// restore, snap, move, resize, center, always-on-top, fullscreen, raise, lower, list, count,
// geometry and isForeground across current / byTitle / byIndex / allWindows / otherWindows.
// The registry has no OS-window primitive, so every action maps to `evaluate` (window-level JS).
import { makeAtom } from '../atom-kit.mjs';

export const family = "window";

const TITLE = { name: "title", type: "string", required: true };
const INDEX = { name: "index", type: "number", required: true };
const XY = [
  { name: "x", type: "number", required: true },
  { name: "y", type: "number", required: true },
];
const SIZE = [
  { name: "width", type: "number", required: true },
  { name: "height", type: "number", required: true },
];
const ON = { name: "on", type: "boolean", required: false };
const VIA = " via evaluate (window-level JS; no OS-window primitive).";

const RAW = [
  { id: "window.focus.current", family, verb: "focus", target: "current", primitive: "evaluate", effect: "page-write", args: [], summary: `Focus the current window${VIA}` },
  { id: "window.focus.byTitle", family, verb: "focus", target: "byTitle", primitive: "evaluate", effect: "page-write", args: [TITLE], summary: `Focus the window with the given title${VIA}` },
  { id: "window.focus.byIndex", family, verb: "focus", target: "byIndex", primitive: "evaluate", effect: "page-write", args: [INDEX], summary: `Focus the window at the given index${VIA}` },
  { id: "window.focus.allWindows", family, verb: "focus", target: "allWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Focus every window${VIA}` },
  { id: "window.focus.otherWindows", family, verb: "focus", target: "otherWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Focus every window except the current one${VIA}` },
  { id: "window.blur.current", family, verb: "blur", target: "current", primitive: "evaluate", effect: "page-write", args: [], summary: `Blur the current window${VIA}` },
  { id: "window.blur.byTitle", family, verb: "blur", target: "byTitle", primitive: "evaluate", effect: "page-write", args: [TITLE], summary: `Blur the window with the given title${VIA}` },
  { id: "window.blur.byIndex", family, verb: "blur", target: "byIndex", primitive: "evaluate", effect: "page-write", args: [INDEX], summary: `Blur the window at the given index${VIA}` },
  { id: "window.blur.allWindows", family, verb: "blur", target: "allWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Blur every window${VIA}` },
  { id: "window.blur.otherWindows", family, verb: "blur", target: "otherWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Blur every window except the current one${VIA}` },
  { id: "window.minimize.current", family, verb: "minimize", target: "current", primitive: "evaluate", effect: "page-write", args: [], summary: `Minimize the current window${VIA}` },
  { id: "window.minimize.byTitle", family, verb: "minimize", target: "byTitle", primitive: "evaluate", effect: "page-write", args: [TITLE], summary: `Minimize the window with the given title${VIA}` },
  { id: "window.minimize.byIndex", family, verb: "minimize", target: "byIndex", primitive: "evaluate", effect: "page-write", args: [INDEX], summary: `Minimize the window at the given index${VIA}` },
  { id: "window.minimize.allWindows", family, verb: "minimize", target: "allWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Minimize every window${VIA}` },
  { id: "window.minimize.otherWindows", family, verb: "minimize", target: "otherWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Minimize every window except the current one${VIA}` },
  { id: "window.maximize.current", family, verb: "maximize", target: "current", primitive: "evaluate", effect: "page-write", args: [], summary: `Maximize the current window${VIA}` },
  { id: "window.maximize.byTitle", family, verb: "maximize", target: "byTitle", primitive: "evaluate", effect: "page-write", args: [TITLE], summary: `Maximize the window with the given title${VIA}` },
  { id: "window.maximize.byIndex", family, verb: "maximize", target: "byIndex", primitive: "evaluate", effect: "page-write", args: [INDEX], summary: `Maximize the window at the given index${VIA}` },
  { id: "window.maximize.allWindows", family, verb: "maximize", target: "allWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Maximize every window${VIA}` },
  { id: "window.maximize.otherWindows", family, verb: "maximize", target: "otherWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Maximize every window except the current one${VIA}` },
  { id: "window.restore.current", family, verb: "restore", target: "current", primitive: "evaluate", effect: "page-write", args: [], summary: `Restore the current window${VIA}` },
  { id: "window.restore.byTitle", family, verb: "restore", target: "byTitle", primitive: "evaluate", effect: "page-write", args: [TITLE], summary: `Restore the window with the given title${VIA}` },
  { id: "window.restore.byIndex", family, verb: "restore", target: "byIndex", primitive: "evaluate", effect: "page-write", args: [INDEX], summary: `Restore the window at the given index${VIA}` },
  { id: "window.restore.allWindows", family, verb: "restore", target: "allWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Restore every window${VIA}` },
  { id: "window.restore.otherWindows", family, verb: "restore", target: "otherWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Restore every window except the current one${VIA}` },
  { id: "window.snapLeft.current", family, verb: "snapLeft", target: "current", primitive: "evaluate", effect: "page-write", args: [], summary: `Snap the current window to the left edge${VIA}` },
  { id: "window.snapLeft.byTitle", family, verb: "snapLeft", target: "byTitle", primitive: "evaluate", effect: "page-write", args: [TITLE], summary: `Snap the window with the given title to the left edge${VIA}` },
  { id: "window.snapLeft.byIndex", family, verb: "snapLeft", target: "byIndex", primitive: "evaluate", effect: "page-write", args: [INDEX], summary: `Snap the window at the given index to the left edge${VIA}` },
  { id: "window.snapLeft.allWindows", family, verb: "snapLeft", target: "allWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Snap every window to the left edge${VIA}` },
  { id: "window.snapLeft.otherWindows", family, verb: "snapLeft", target: "otherWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Snap every window except the current one to the left edge${VIA}` },
  { id: "window.snapRight.current", family, verb: "snapRight", target: "current", primitive: "evaluate", effect: "page-write", args: [], summary: `Snap the current window to the right edge${VIA}` },
  { id: "window.snapRight.byTitle", family, verb: "snapRight", target: "byTitle", primitive: "evaluate", effect: "page-write", args: [TITLE], summary: `Snap the window with the given title to the right edge${VIA}` },
  { id: "window.snapRight.byIndex", family, verb: "snapRight", target: "byIndex", primitive: "evaluate", effect: "page-write", args: [INDEX], summary: `Snap the window at the given index to the right edge${VIA}` },
  { id: "window.snapRight.allWindows", family, verb: "snapRight", target: "allWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Snap every window to the right edge${VIA}` },
  { id: "window.snapRight.otherWindows", family, verb: "snapRight", target: "otherWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Snap every window except the current one to the right edge${VIA}` },
  { id: "window.snapTop.current", family, verb: "snapTop", target: "current", primitive: "evaluate", effect: "page-write", args: [], summary: `Snap the current window to the top edge${VIA}` },
  { id: "window.snapTop.byTitle", family, verb: "snapTop", target: "byTitle", primitive: "evaluate", effect: "page-write", args: [TITLE], summary: `Snap the window with the given title to the top edge${VIA}` },
  { id: "window.snapTop.byIndex", family, verb: "snapTop", target: "byIndex", primitive: "evaluate", effect: "page-write", args: [INDEX], summary: `Snap the window at the given index to the top edge${VIA}` },
  { id: "window.snapTop.allWindows", family, verb: "snapTop", target: "allWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Snap every window to the top edge${VIA}` },
  { id: "window.snapTop.otherWindows", family, verb: "snapTop", target: "otherWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Snap every window except the current one to the top edge${VIA}` },
  { id: "window.snapBottom.current", family, verb: "snapBottom", target: "current", primitive: "evaluate", effect: "page-write", args: [], summary: `Snap the current window to the bottom edge${VIA}` },
  { id: "window.snapBottom.byTitle", family, verb: "snapBottom", target: "byTitle", primitive: "evaluate", effect: "page-write", args: [TITLE], summary: `Snap the window with the given title to the bottom edge${VIA}` },
  { id: "window.snapBottom.byIndex", family, verb: "snapBottom", target: "byIndex", primitive: "evaluate", effect: "page-write", args: [INDEX], summary: `Snap the window at the given index to the bottom edge${VIA}` },
  { id: "window.snapBottom.allWindows", family, verb: "snapBottom", target: "allWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Snap every window to the bottom edge${VIA}` },
  { id: "window.snapBottom.otherWindows", family, verb: "snapBottom", target: "otherWindows", primitive: "evaluate", effect: "page-write", args: [], summary: `Snap every window except the current one to the bottom edge${VIA}` },
  { id: "window.moveTo.current", family, verb: "moveTo", target: "current", primitive: "evaluate", effect: "page-write", args: XY, summary: `Move the current window to the given coordinates${VIA}` },
  { id: "window.moveTo.byTitle", family, verb: "moveTo", target: "byTitle", primitive: "evaluate", effect: "page-write", args: [TITLE, ...XY], summary: `Move the window with the given title to the given coordinates${VIA}` },
  { id: "window.moveTo.byIndex", family, verb: "moveTo", target: "byIndex", primitive: "evaluate", effect: "page-write", args: [INDEX, ...XY], summary: `Move the window at the given index to the given coordinates${VIA}` },
  { id: "window.moveTo.allWindows", family, verb: "moveTo", target: "allWindows", primitive: "evaluate", effect: "page-write", args: XY, summary: `Move every window to the given coordinates${VIA}` },
  { id: "window.moveTo.otherWindows", family, verb: "moveTo", target: "otherWindows", primitive: "evaluate", effect: "page-write", args: XY, summary: `Move every window except the current one to the given coordinates${VIA}` },
  { id: "window.resizeTo.current", family, verb: "resizeTo", target: "current", primitive: "evaluate", effect: "page-write", args: SIZE, summary: `Resize the current window to the given size${VIA}` },
  { id: "window.resizeTo.byTitle", family, verb: "resizeTo", target: "byTitle", primitive: "evaluate", effect: "page-write", args: [TITLE, ...SIZE], summary: `Resize the window with the given title to the given size${VIA}` },
  { id: "window.resizeTo.byIndex", family, verb: "resizeTo", target: "byIndex", primitive: "evaluate", effect: "page-write", args: [INDEX, ...SIZE], summary: `Resize the window at the given index to the given size${VIA}` },
  { id: "window.resizeTo.allWindows", family, verb: "resizeTo", target: "allWindows", primitive: "evaluate", effect: "page-write", args: SIZE, summary: `Resize every window to the given size${VIA}` },
  { id: "window.resizeTo.otherWindows", family, verb: "resizeTo", target: "otherWindows", primitive: "evaluate", effect: "page-write", args: SIZE, summary: `Resize every window except the current one to the given size${VIA}` },
  { id: "window.center.current", family, verb: "center", target: "current", primitive: "evaluate", effect: "page-write", args: [], summary: `Center the current window${VIA}` },
  { id: "window.center.byTitle", family, verb: "center", target: "byTitle", primitive: "evaluate", effect: "page-write", args: [TITLE], summary: `Center the window with the given title${VIA}` },
```

_First 80 of 127 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
