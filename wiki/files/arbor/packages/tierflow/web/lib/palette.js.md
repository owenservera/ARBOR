# File: packages/tierflow/web/lib/palette.js

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/web/lib/palette.js |
| Language | JavaScript |
| Kind | source |
| Size | 1355 B |
| Lines | 52 |
| Hash | a139cfbeef96 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| readTheme | function | 5 | yes | export function readTheme(root) { |
| target | const | 6 | no | const target = root \|\| document.documentElement; |
| cs | const | 7 | no | const cs = getComputedStyle(target); |
| pick | function | 8 | no | const pick = (name) =&gt; cs.getPropertyValue(name).trim(); |
| theme | const | 10 | no | const theme = { |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/web/app.js](../app.js.md) | ./lib/palette.js |

## Annotations

_No annotations._

## Excerpt

```javascript
// The stylesheet owns the palette; the canvas cannot read CSS custom
// properties cheaply, so they are resolved once at boot and handed to the
// renderers as plain strings.

export function readTheme(root) {
  const target = root || document.documentElement;
  const cs = getComputedStyle(target);
  const pick = (name) => cs.getPropertyValue(name).trim();

  const theme = {
    bg: pick("--bg"),
    panel: pick("--panel"),
    panel2: pick("--panel-2"),
    inset: pick("--inset"),
    line: pick("--line"),
    line2: pick("--line-2"),
    txt: pick("--txt"),
    txt2: pick("--txt-2"),
    txt3: pick("--txt-3"),
    live: pick("--live"),
    cool: pick("--cool"),
    ok: pick("--ok"),
    err: pick("--err"),
    warn: pick("--warn"),
    steel: pick("--steel"),
    t1: pick("--t1"),
    t2: pick("--t2"),
    t3: pick("--t3"),
    lvlDebug: pick("--lvl-debug"),
    lvlInfo: pick("--lvl-info"),
    lvlWarn: pick("--lvl-warn"),
    lvlError: pick("--lvl-error"),
  };

  theme.state = {
    queued: theme.steel,
    running: theme.live,
    succeeded: theme.ok,
    failed: theme.err,
    cancelled: theme.txt3,
    timed_out: theme.warn,
  };

  theme.level = {
    debug: theme.lvlDebug,
    info: theme.lvlInfo,
    warn: theme.lvlWarn,
    error: theme.lvlError,
  };

  return theme;
}
```

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
