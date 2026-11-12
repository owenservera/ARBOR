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
