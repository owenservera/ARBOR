# File: apps/mobile-relay/test/visual-bootstrap-startup.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/visual-bootstrap-startup.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1204 B |
| Lines | 23 |
| Hash | 12a1bf0aeea7 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| source | const | 7 | no | const source = readFileSync(new URL(&#39;../visual-bootstrap.mjs&#39;, import.meta.url), &#39;utf8&#39;) |
| element | function | 9 | no | const element = () =&gt; ({ hidden: true, disabled: true, dataset: {}, style: { setProperty() {} }, setAttribute() {}, addEventListener() {}, querySelectorAll: () =&gt; [], append() {} }); |
| elements | const | 11 | no | const elements = new Map(); |
| requests | variable | 12 | no | let requests = 0; |
| context | const | 13 | no | const context = vm.createContext({ document: { documentElement: element(), addEventListener() {}, getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); } }… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:vm | import | 4 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('visual bootstrap initializes its relay client before restoring the paired phone session', async () => {
  const source = readFileSync(new URL('../visual-bootstrap.mjs', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '');
  const element = () => ({ hidden: true, disabled: true, dataset: {}, style: { setProperty() {} },
    setAttribute() {}, addEventListener() {}, querySelectorAll: () => [], append() {} });
  const elements = new Map();
  let requests = 0;
  const context = vm.createContext({
    document: { documentElement: element(), addEventListener() {},
      getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); } },
    window: { addEventListener() {} },
    THEME_PRESETS: {},
    transport: { request: async () => { requests++; return { paired: false }; } },
  });
  assert.doesNotThrow(() => new vm.Script(source).runInContext(context));
  await Promise.resolve();
  assert.equal(requests, 1, 'restore the existing pairing without requesting a new QR code');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
