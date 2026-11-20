# File: apps/vivim-host/test/legacy-device-authority.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/legacy-device-authority.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 639 B |
| Lines | 13 |
| Hash | e998a880381a |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| source | const | 4 | no | const source=readFileSync(new URL(&#39;../server.mjs&#39;,import.meta.url),&#39;utf8&#39;); |
| a | const | 6 | no | const a=source.indexOf(&#39;const deviceMatch = pathname.match(&#39;); const b=source.indexOf(&#39;// APK07 PC-side debug&#39;,a); assert.ok(a&gt;=0&amp;&amp;b&gt;a); const route=source.slice(a,b); assert.match(route,/CONTROL_ACT… |
| b | const | 7 | no | const b=source.indexOf(&#39;// APK07 PC-side debug&#39;,a); |
| route | const | 9 | no | const route=source.slice(a,b); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../server.mjs',import.meta.url),'utf8');
test('legacy PC device mutation endpoint is fail closed, not a competing grant authority',()=>{
 const a=source.indexOf('const deviceMatch = pathname.match(');
 const b=source.indexOf('// APK07 PC-side debug',a);
 assert.ok(a>=0&&b>a);
 const route=source.slice(a,b);
 assert.match(route,/CONTROL_ACTION_PLAN_REQUIRED/);
 assert.doesNotMatch(route,/enrollment\.(approveGrant|revokeGrant)\s*\(/);
 assert.match(route,/verifyOwnerToken/);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
