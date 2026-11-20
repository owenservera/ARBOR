# File: tests/hq-version-intelligence/git-edge-negative-gates.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tests/hq-version-intelligence/git-edge-negative-gates.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1711 B |
| Lines | 27 |
| Hash | c47debd2aba2 |
| Test | yes |
| Generated | no |
| Component | tests |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| commit | const | 4 | no | const commit=&#39;f9823a5131e73e7562db5a4ec14e1ec481557d69&#39;; |
| inputs | const | 6 | no | const inputs=[ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ./reference-oracle.mjs | import | 3 | [tests/hq-version-intelligence/reference-oracle.mjs](./reference-oracle.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyGitObject,safeGitRef,storageBound} from './reference-oracle.mjs';
const commit='f9823a5131e73e7562db5a4ec14e1ec481557d69';
test('T07 expanded | symlink, submodule, LFS pointer, binary, sparse and detached/unpinned',()=>{
 const inputs=[
  [{mode:'120000',pinnedCommit:commit},'symlink'],
  [{mode:'160000',pinnedCommit:commit},'submodule'],
  [{content:'version https://git-lfs.github.com/spec/v1\n',pinnedCommit:commit},'lfs_pointer'],
  [{content:'a\0b',pinnedCommit:commit},'binary'],
  [{bytes:1500001,pinnedCommit:commit},'oversized_blob'],
  [{sparse:true,pinnedCommit:commit},'sparse_clone'],
  [{readable:false,pinnedCommit:commit},'unreadable'],
  [{pinnedCommit:null},'unpinned_or_detached_head_without_sha']
 ];
 for(const [input,reason] of inputs){const value=classifyGitObject(input);assert.equal(value.reason,reason);assert.equal(value.complete,false);}
 assert.equal(classifyGitObject({pinnedCommit:commit}).complete,true);
});
test('T17 expanded | attacker supplied git refs denied before object lookup',()=>{
 for(const ref of ['--upload-pack','../../etc/passwd','main;echo x','refs/heads/../../x','main@{1}','a\\b','a//b','.git/config'])
  assert.equal(safeGitRef(ref),false,ref);
 assert.equal(safeGitRef('research/semantic-wiki-compiler-20261112'),true);
 assert.equal(safeGitRef(commit),true);
});
test('T19 expanded | ENOSPC and SQLite-full retain prior snapshot without deletion',()=>{
 for(const error of ['ENOSPC','SQLITE_FULL'])assert.deepEqual(storageBound({error,previousSnapshot:{digest:'old'}}),{status:'blocked',previousSnapshotKept:true,deletePrevious:false});
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
