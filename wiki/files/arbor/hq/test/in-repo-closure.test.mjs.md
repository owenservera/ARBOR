# File: hq/test/in-repo-closure.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/in-repo-closure.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 943 B |
| Lines | 16 |
| Hash | a5a4d353f87d |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 8 | no | const root = join(dirname(fileURLToPath(import.meta.url)), &#39;..&#39;); |
| text | const | 11 | no | const text = readFileSync(join(root, path), &#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 3 | external |
| node:assert/strict | import | 4 | external |
| node:fs | import | 5 | external |
| node:url | import | 6 | external |
| node:path | import | 7 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Mechanical contract for the ARBOR-specific HQ bridge. No donor checkout or
// external HQ process is permitted; selected local code projects are data sources.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
test('ARBOR package entrypoints contain no donor-process or checkout import', () => {
  for (const path of ['lib/arbor-service.mjs', 'bin/arbor-hq.mjs', 'package.json']) {
    const text = readFileSync(join(root, path), 'utf8');
    assert.doesNotMatch(text, /(?:\.\.[\\\/])+(?:repos-hq|tierflow|vivim-web-harness|vivim-labs)/i);
    assert.doesNotMatch(text, /(?:spawn|exec)\s*\([\s\S]{0,100}repos-hq/i);
    assert.doesNotMatch(text, /https?:\/\/(?:localhost|127\.0\.0\.1)[^\s]*\/hq\b/i);
  }
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
