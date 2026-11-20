# File: apps/mobile-relay/test/shell-inspection.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/shell-inspection.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1504 B |
| Lines | 27 |
| Hash | 651c5dea1263 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| mounted | function | 4 | no | function mounted(hidden=false){ |
| nodes | const | 10 | no | const nodes={top:mounted(),text:mounted(),send:mounted(true),other:mounted()}; |
| doc | const | 11 | no | const doc={getElementById:id=&gt;nodes[id],querySelectorAll:()=&gt;Object.values(nodes)}; |
| rows | const | 12 | no | const rows=inspectShell(doc,&#39;talk&#39;); |
| doc | const | 23 | no | const doc={getElementById:id=&gt;id===&#39;text&#39;?mounted():null}; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../ux/shell-inspection.mjs | import | 3 | [apps/mobile-relay/ux/shell-inspection.mjs](../ux/shell-inspection.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectShell,selectShell} from '../ux/shell-inspection.mjs';
function mounted(hidden=false){
  return {isConnected:true,hidden,attrs:new Map(),value:'private',textContent:'private',
    closest(){return this.hidden?this:null},getClientRects(){return this.hidden?[]:[{}]},
    setAttribute(k,v){this.attrs.set(k,v)},removeAttribute(k){this.attrs.delete(k)}};
}
test('inspection enumerates only real visible known shell mounts without content',()=>{
  const nodes={top:mounted(),text:mounted(),send:mounted(true),other:mounted()};
  const doc={getElementById:id=>nodes[id],querySelectorAll:()=>Object.values(nodes)};
  const rows=inspectShell(doc,'talk');
  assert.deepEqual(rows.map(r=>r.instanceId),['shell:top','shell:text']);
  assert.equal(JSON.stringify(rows).includes('private'),false);
  assert.equal(selectShell(doc,'talk',rows[1]),true);
  assert.equal(nodes.text.attrs.get('data-vivim-shell-inspected'),'true');
  assert.equal(selectShell(doc,'wiki',rows[1]),false);
  nodes.text.hidden=true;
  assert.equal(selectShell(doc,'talk',rows[1]),false);
});

test('native shell reports canonical identities without granting mutation authority',()=>{
  const doc={getElementById:id=>id==='text'?mounted():null};
  const [row]=inspectShell(doc,'talk');
  assert.equal(row.componentId,'vivim.ui.input.text-entry.textarea@1');
  assert.equal(row.settings.authority,'protected inspection only');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
