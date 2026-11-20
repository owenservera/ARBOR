# File: apps/mobile-relay/test/shell-presentation.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/shell-presentation.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1878 B |
| Lines | 22 |
| Hash | 2aea73f94a1f |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| body | function | 5 | no | const body=()=&gt;{const vars=new Map(),attrs=new Map();return {vars,attrs,style:{setProperty:(k,v)=&gt;vars.set(k,v),removeProperty:k=&gt;vars.delete(k)},setAttribute:(k,v)=&gt;attrs.set(k,v),removeAttribute:k=… |
| head | function | 6 | no | const head=(revision,shell,status=&#39;applied&#39;)=&gt;{const s=createSurface();if(shell)s.theme.shell=shell;s.revision=revision;return {status,surfaceId:s.surfaceId,revision,surface:s};}; |
| css | const | 8 | no | const css=shellCss({radiusPx:20,fontSizePx:17,accent:&#39;#123456&#39;}); |
| b | const | 16 | no | const b=body(),mount=createShellPresentation(b); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../generative-ui/catalog.mjs | import | 3 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../ux/shell-presentation.mjs | import | 4 | [apps/mobile-relay/ux/shell-presentation.mjs](../ux/shell-presentation.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurface,validateTheme} from '../generative-ui/catalog.mjs';
import {shellCss,createShellPresentation} from '../ux/shell-presentation.mjs';
const body=()=>{const vars=new Map(),attrs=new Map();return {vars,attrs,style:{setProperty:(k,v)=>vars.set(k,v),removeProperty:k=>vars.delete(k)},setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k)};};
const head=(revision,shell,status='applied')=>{const s=createSurface();if(shell)s.theme.shell=shell;s.revision=revision;return {status,surfaceId:s.surfaceId,revision,surface:s};};
test('shell styles are allowlisted and independently validated',()=>{
  const css=shellCss({radiusPx:20,fontSizePx:17,accent:'#123456'});
  assert.equal(css['--r-lg'],'20px');assert.equal(css['--vivim-base-font-size'],'17px');assert.equal(css['--ac'],'#123456');
  assert.equal(css['--bg'],undefined);
  assert.throws(()=>shellCss({arbitraryCss:'display:none'}),/unexpected/);
  assert.throws(()=>shellCss({background:'url(fake)'}),/color/);
  assert.equal(validateTheme(createSurface().theme).shell,undefined);
});
test('only applied Host revisions paint shell overrides; stale or disconnected clears them',()=>{
  const b=body(),mount=createShellPresentation(b);
  assert.equal(mount.observe(head(1,{background:'#123456'},'previewed')).state,'blocked');assert.equal(b.vars.size,0);
  assert.equal(mount.observe(head(2,{background:'#123456'})).state,'ready');assert.equal(b.vars.get('--bg'),'#123456');
  assert.equal(mount.observe(head(1,{background:'#654321'})).state,'blocked');assert.equal(b.vars.size,0);
  mount.observe(head(3,{radiusPx:22}));assert.equal(b.vars.get('--r-lg'),'22px');mount.clear();assert.equal(b.vars.size,0);
  mount.observe(head(4,{fontSizePx:19}));mount.observe(head(5));assert.equal(b.vars.size,0);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
