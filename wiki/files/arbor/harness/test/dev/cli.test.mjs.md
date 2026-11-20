# File: harness/test/dev/cli.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/dev/cli.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3511 B |
| Lines | 56 |
| Hash | c9ce8d9e6ce6 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 11 | no | const root=await mkdtemp(join(tmpdir(),&#39;vwh-cli-&#39;)); |
| out | const | 15 | no | const out=[]; |
| root | const | 32 | no | const root=await mkdtemp(join(tmpdir(),&#39;vwh-wt-&#39;)); |
| missing | const | 34 | no | const missing=join(root,&#39;does-not-exist&#39;); |
| root | const | 39 | no | const root=await mkdtemp(join(tmpdir(),&#39;vwh-wt-&#39;)); |
| workTreePath | const | 47 | no | const workTreePath=join(root,&#39;wt-task-1&#39;); |
| head | const | 51 | no | const head=spawnSync(&#39;git&#39;,[&#39;-C&#39;,workTreePath,&#39;rev-parse&#39;,&#39;--show-toplevel&#39;],{encoding:&#39;utf8&#39;}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs/promises | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| node:child_process | import | 7 | external |
| ../../src/dev/cli.mjs | import | 8 | [harness/src/dev/cli.mjs](../../src/dev/cli.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { workspaceCommand, devCommand } from '../../src/dev/cli.mjs';

test('wh workspace exposes read-only source without starting browser', async () => {
  const root=await mkdtemp(join(tmpdir(),'vwh-cli-'));
  try {
    await mkdir(join(root,'harness/src'),{recursive:true});
    await writeFile(join(root,'harness/src/x.mjs'),'export const x = 42;\n');
    const out=[];
    await workspaceCommand(['read','harness/src/x.mjs'],{root,out:s=>out.push(JSON.parse(s))});
    assert.match(out[0].lines[0].text,/42/);
    await assert.rejects(workspaceCommand(['read','runtime/secret.mjs'],{root,out:()=>{}}),/Unsafe|outside/);
  } finally {await rm(root,{recursive:true,force:true});}
});
test('wh dev --apply refuses the main command checkout and requires isolation', async () => {
  await assert.rejects(devCommand(['try','--apply'],{root:process.cwd(),router:{},out:()=>{}}),/explicitly selected isolated/);
  await assert.rejects(devCommand(['try','--apply','--workspace',process.cwd()],{root:process.cwd(),router:{},out:()=>{}}),/Cannot apply/);
});
test('wh dev rejects unrecognized flags', async () => {
  await assert.rejects(devCommand(['try','--shell','x'],{root:process.cwd(),router:{},out:()=>{}}),/Unsupported option/);
});
test('wh dev --apply without --workspace refuses before touching git', async () => {
  await assert.rejects(devCommand(['try','--apply'],{root:process.cwd(),router:{},out:()=>{}}),/explicitly selected isolated/);
});
test('wh dev --apply --workspace missing without --create-workspace refuses', async () => {
  const root=await mkdtemp(join(tmpdir(),'vwh-wt-'));
  try {
    const missing=join(root,'does-not-exist');
    await assert.rejects(devCommand(['try','--apply','--workspace',missing],{root,router:{},out:()=>{}}),/does not exist; pass --create-workspace/);
  } finally {await rm(root,{recursive:true,force:true});}
});
test('wh dev --apply --workspace missing --create-workspace provisions a git worktree', async () => {
  const root=await mkdtemp(join(tmpdir(),'vwh-wt-'));
  try {
    spawnSync('git',['init'],{cwd:root,encoding:'utf8'});
    spawnSync('git',['config','user.email','t@t'],{cwd:root,encoding:'utf8'});
    spawnSync('git',['config','user.name','t'],{cwd:root,encoding:'utf8'});
    await writeFile(join(root,'README.md'),'# t\n');
    spawnSync('git',['add','README.md'],{cwd:root,encoding:'utf8'});
    spawnSync('git',['commit','-m','init'],{cwd:root,encoding:'utf8'});
    const workTreePath=join(root,'wt-task-1');
    // Router lacks ask, so runDev fails after worktree is provisioned.
    await assert.rejects(devCommand(['try','--apply','--workspace',workTreePath,'--create-workspace'],{root,router:{},out:()=>{}}),/Router and workspace/);
    assert.ok(existsSync(workTreePath),'worktree should exist after --create-workspace');
    const head=spawnSync('git',['-C',workTreePath,'rev-parse','--show-toplevel'],{encoding:'utf8'});
    assert.equal(head.status,0);
    assert.equal(resolve(head.stdout.trim()),workTreePath);
    spawnSync('git',['worktree','remove','--force',workTreePath],{cwd:root,encoding:'utf8'});
  } finally {await rm(root,{recursive:true,force:true});}
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
