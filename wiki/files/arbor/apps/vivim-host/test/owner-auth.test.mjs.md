# File: apps/vivim-host/test/owner-auth.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/owner-auth.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1703 B |
| Lines | 33 |
| Hash | f04dc2d40ee5 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dir | const | 9 | no | const dir=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-owner-&#39;)); |
| opts | const | 11 | no | const opts={dataRoot:dir,env:{},platform:process.platform,run:()=&gt;{}}; // Windows ACL subprocess stub; native ACL remains a live acceptance gate. |
| first | const | 12 | no | const first=loadOwnerToken(opts); |
| second | const | 17 | no | const second=loadOwnerToken(opts); |
| dir | const | 28 | no | const dir=mkdtempSync(path.join(os.tmpdir(),&#39;vivim-owner-empty-&#39;)); |
| result | const | 30 | no | const result=loadOwnerToken({dataRoot:dir,env:{},create:false,platform:process.platform,run:()=&gt;{}}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| node:os | import | 5 | external |
| ../bootstrap/owner-auth.mjs | import | 6 | [apps/vivim-host/bootstrap/owner-auth.mjs](../bootstrap/owner-auth.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,chmodSync,symlinkSync,unlinkSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {loadOwnerToken,ownerTokenPath,verifyOwnerToken} from '../bootstrap/owner-auth.mjs';

test('owner capability is exclusive, stable, private and fail closed',t=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'vivim-owner-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const opts={dataRoot:dir,env:{},platform:process.platform,run:()=>{}}; // Windows ACL subprocess stub; native ACL remains a live acceptance gate.
  const first=loadOwnerToken(opts);
  assert.equal(first.source,'created');
  assert.equal(first.token.length>=32,true);
  assert.equal(verifyOwnerToken('Bearer '+first.token,first.token),true);
  assert.equal(verifyOwnerToken('Bearer wrong',first.token),false);
  const second=loadOwnerToken(opts);
  assert.equal(second.token,first.token);
  assert.equal(readFileSync(ownerTokenPath(dir),'utf8').trim(),first.token);
  if(process.platform!=='win32'){
    chmodSync(ownerTokenPath(dir),0o644);
    assert.throws(()=>loadOwnerToken(opts),/mode 0600/);
    assert.equal(readFileSync(ownerTokenPath(dir),'utf8').trim(),first.token);
  }
});

test('missing credential does not appear on read-only access',t=>{
  const dir=mkdtempSync(path.join(os.tmpdir(),'vivim-owner-empty-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const result=loadOwnerToken({dataRoot:dir,env:{},create:false,platform:process.platform,run:()=>{}});
  assert.equal(result.token,null);
  assert.equal(result.source,'missing');
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
