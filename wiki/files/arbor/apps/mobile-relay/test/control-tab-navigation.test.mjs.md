# File: apps/mobile-relay/test/control-tab-navigation.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/control-tab-navigation.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1135 B |
| Lines | 24 |
| Hash | a70aac1f808f |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| app | const | 4 | no | const app=readFileSync(new URL(&#39;../app.js&#39;,import.meta.url),&#39;utf8&#39;); |
| html | const | 5 | no | const html=readFileSync(new URL(&#39;../index.html&#39;,import.meta.url),&#39;utf8&#39;); |
| control | const | 18 | no | const control=readFileSync(new URL(&#39;../control-phone.mjs&#39;,import.meta.url),&#39;utf8&#39;); |

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
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('phone Control is an actual reachable tab with a panel',()=>{
 assert.match(html,/data-tab="control"/);
 assert.match(html,/id="v-control"/);
 assert.match(html,/id="control-text"/);
 assert.match(html,/src="control-phone\.mjs"/);
 assert.match(app,/\$\('v-control'\)\.hidden\s*=\s*S\.tab\s*!==\s*'control'/);
 assert.match(app,/\$\('v-soon'\)\.hidden\s*=\s*\[[^\]]*'control'[^\]]*\]\.includes\(S\.tab\)/);
});


test('Control shows the existing Host command catalog and private read-only receipts',()=>{
  const control=readFileSync(new URL('../control-phone.mjs',import.meta.url),'utf8');
  assert.match(html,/id="control-activity"/);
  assert.match(control,/void loadPack\(\)/);
  assert.match(control,/call\('recent'\)/);
  assert.match(control,/ownerPreview/);
  assert.doesNotMatch(control,/refreshControlActivity\(\)[\s\S]{0,250}execute\(/);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
