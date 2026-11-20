# File: integration/scripts/r004-local-gate.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/scripts/r004-local-gate.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8370 B |
| Lines | 165 |
| Hash | 4ecc021143fb |
| Test | yes |
| Generated | no |
| Component | integration |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| script | const | 10 | no | const script = fileURLToPath(new URL(&#39;./r004-local-gate.mjs&#39;, import.meta.url)); |
| git | function | 11 | no | function git(root,args) { |
| r | const | 12 | no | const r=spawnSync(&#39;git&#39;,args,{cwd:root,encoding:&#39;utf8&#39;}); |
| fixture | function | 15 | no | function fixture(t) { |
| root | const | 16 | no | const root=mkdtempSync(join(tmpdir(),&#39;arbor-r004-fixture-&#39;)); |
| outputParent | const | 17 | no | const outputParent=mkdtempSync(join(tmpdir(),&#39;arbor-r004-receipts-&#39;)); |
| task | function | 26 | no | const task=(id,file,ms=5000)=&gt;({id,profiles:[&#39;focused&#39;],cmd:&#39;node&#39;,args:[file],paths:[file],ms}); |
| common | const | 27 | no | const common={root,outputParent,minNodeMajor:22}; |
| env | const | 39 | no | const env=isolatedEnvironment({PATH:&#39;/usr/bin&#39;,GITHUB_TOKEN:&#39;secret&#39;,OPENAI_API_KEY:&#39;secret&#39;, VIVIM_OWNER_TOKEN:&#39;secret&#39;,HOME:&#39;/tmp/safe&#39;},&#39;/tmp/fresh-r004&#39;); |
| f | const | 56 | no | const f=fixture(t); |
| r | const | 57 | no | const r=runR004({...f.common,taskPlan:[f.task(&#39;ok&#39;,&#39;checks/ok.mjs&#39;)]}); |
| f | const | 73 | no | const f=fixture(t); |
| r | const | 74 | no | const r=runR004({...f.common,taskPlan:[f.task(&#39;fail&#39;,&#39;checks/fail.mjs&#39;)]}); |
| f | const | 81 | no | const f=fixture(t); |
| r | const | 82 | no | const r=runR004({...f.common,taskPlan:[f.task(&#39;absent&#39;,&#39;checks/never-committed.mjs&#39;)]}); |
| f | const | 89 | no | const f=fixture(t); |
| r | const | 90 | no | const r=runR004({...f.common,taskPlan:[f.task(&#39;hang&#39;,&#39;checks/hang.mjs&#39;,80)]}); |
| f | const | 97 | no | const f=fixture(t); |
| r | const | 99 | no | const r=runR004({...f.common,taskPlan:[f.task(&#39;ok&#39;,&#39;checks/ok.mjs&#39;)]}); |
| f | const | 106 | no | const f=fixture(t); |
| r | const | 108 | no | const r=runR004({...f.common,taskPlan:[f.task(&#39;ok&#39;,&#39;checks/ok.mjs&#39;)]}); |
| f | const | 115 | no | const f=fixture(t); |
| external | const | 116 | no | const external=join(f.outputParent,&#39;outside.mjs&#39;); |
| r | const | 129 | no | const r=runR004({...f.common,taskPlan:[f.task(&#39;link&#39;,&#39;checks/link.mjs&#39;)]}); |
| f | const | 135 | no | const f=fixture(t); |
| r | const | 136 | no | const r=runR004({...f.common,minNodeMajor:999,taskPlan:[f.task(&#39;ok&#39;,&#39;checks/ok.mjs&#39;)]}); |
| f | const | 143 | no | const f=fixture(t); |
| r | const | 144 | no | const r=runR004({...f.common,taskPlan:[f.task(&#39;secret&#39;,&#39;checks/secret.mjs&#39;)]}); |
| text | const | 146 | no | const text=readFileSync(r.receiptPath,&#39;utf8&#39;); |
| help | const | 152 | no | const help=spawnSync(process.execPath,[script,&#39;--help&#39;],{encoding:&#39;utf8&#39;}); |
| unsafe | const | 155 | no | const unsafe=spawnSync(process.execPath,[script,&#39;--command&#39;,&#39;rm&#39;],{encoding:&#39;utf8&#39;}); |
| full | const | 161 | no | const full=TASKS.filter(x=&gt;x.profiles.includes(&#39;full&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:child_process | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| node:url | import | 7 | external |
| ./r004-local-gate.mjs | import | 8 | [integration/scripts/r004-local-gate.mjs](./r004-local-gate.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runR004, redact, excerpt, isolatedEnvironment, evaluate, SCHEMA, TASKS } from './r004-local-gate.mjs';

const script = fileURLToPath(new URL('./r004-local-gate.mjs', import.meta.url));
function git(root,args) {
  const r=spawnSync('git',args,{cwd:root,encoding:'utf8'});
  assert.equal(r.status,0,`${args.join(' ')}: ${r.stderr}`);
}
function fixture(t) {
  const root=mkdtempSync(join(tmpdir(),'arbor-r004-fixture-'));
  const outputParent=mkdtempSync(join(tmpdir(),'arbor-r004-receipts-'));
  t.after(()=>{rmSync(root,{recursive:true,force:true});rmSync(outputParent,{recursive:true,force:true});});
  mkdirSync(join(root,'checks'));
  writeFileSync(join(root,'checks','ok.mjs'),`console.log('synthetic pass');`);
  writeFileSync(join(root,'checks','fail.mjs'),`console.error('synthetic failure');process.exitCode=17;`);
  writeFileSync(join(root,'checks','secret.mjs'),`console.log('Bearer ABCDEF1234567890'); console.error('token=the-real-value');`);
  writeFileSync(join(root,'checks','hang.mjs'),`setTimeout(()=>{},30000);`);
  git(root,['init','-q']);git(root,['config','user.name','Fixture Test']);git(root,['config','user.email','fixture@example.invalid']);
  git(root,['add','.']);git(root,['commit','-qm','Synthetic local-only baseline']);
  const task=(id,file,ms=5000)=>({id,profiles:['focused'],cmd:'node',args:[file],paths:[file],ms});
  const common={root,outputParent,minNodeMajor:22};
  return {root,outputParent,task,common};
}

test('pure policy: nonpasses and missing preflight can never be labeled accepted',()=>{
  assert.deepEqual(evaluate([{status:'PASS'}],[]),{status:'LOCAL_TESTS_PASS_ACCEPTANCE_PENDING',exitCode:0});
  for (const status of ['FAIL','SPAWN_ERROR','TIMED_OUT','SKIPPED_MISSING_SOURCE','UNRUN'])
    assert.deepEqual(evaluate([{status}],[]),{status:'BLOCKED_TESTS',exitCode:1});
  assert.deepEqual(evaluate([],['NODE_24_REQUIRED']),{status:'BLOCKED_PREFLIGHT',exitCode:2});
});

test('isolated environment strips inherited provider, GitHub and owner tokens',()=>{
  const env=isolatedEnvironment({PATH:'/usr/bin',GITHUB_TOKEN:'secret',OPENAI_API_KEY:'secret',
    VIVIM_OWNER_TOKEN:'secret',HOME:'/tmp/safe'},'/tmp/fresh-r004');
  assert.equal(env.VIVIM_HOST_DATA_DIR,'/tmp/fresh-r004');
  assert.equal(env.ARBOR_R004_ISOLATED,'1');
  assert.equal(env.GITHUB_TOKEN,undefined);
  assert.equal(env.OPENAI_API_KEY,undefined);
  assert.equal(env.VIVIM_OWNER_TOKEN,undefined);
});

test('sensitive stdout/stderr excerpts redact credentials and bound output',()=>{
  assert.equal(redact('Authorization: Bearer ABCDEF1234567890'), 'Authorization: Bearer [REDACTED]');
  assert.equal(redact('token=not-for-logs'), 'token=[REDACTED]');
  assert.equal(redact('ghp_12345678909876543210'), '[REDACTED]');
  assert.match(excerpt('x'.repeat(10000)),/TRUNCATED/);
});

test('real process invocation: source pin, actual zero exit, private receipt, no owner claim',t=>{
  const f=fixture(t);
  const r=runR004({...f.common,taskPlan:[f.task('ok','checks/ok.mjs')]});
  assert.equal(r.exitCode,0);
  assert.equal(r.receipt.schema,SCHEMA);
  assert.match(r.receipt.sourceSha,/^[0-9a-f]{40}$/);
  assert.equal(r.receipt.tasks[0].exitCode,0);
  assert.equal(r.receipt.tasks[0].status,'PASS');
  assert.match(r.receipt.tasks[0].stdout,/synthetic pass/);
  assert.equal(r.receipt.independentAcceptance,'UNRUN');
  assert.equal(r.receipt.releaseAcceptance,'UNRUN');
  assert.equal(r.receipt.browserDom,'UNRUN');
  assert.equal(r.receipt.ownerDataTouched,false);
  assert.equal(existsSync(r.receiptPath),true);
  assert.deepEqual(JSON.parse(readFileSync(r.receiptPath,'utf8')).result,r.receipt.result);
});

test('real failing child exit is propagated, not collapsed to success',t=>{
  const f=fixture(t);
  const r=runR004({...f.common,taskPlan:[f.task('fail','checks/fail.mjs')]});
  assert.equal(r.exitCode,1);
  assert.equal(r.receipt.tasks[0].exitCode,17);
  assert.equal(r.receipt.tasks[0].status,'FAIL');
});

test('missing test path is explicitly skipped and causes blocked result',t=>{
```

_First 80 of 166 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
