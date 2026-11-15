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
  const f=fixture(t);
  const r=runR004({...f.common,taskPlan:[f.task('absent','checks/never-committed.mjs')]});
  assert.equal(r.exitCode,1);
  assert.equal(r.receipt.tasks[0].status,'SKIPPED_MISSING_SOURCE');
  assert.deepEqual(r.receipt.tasks[0].detail,['checks/never-committed.mjs']);
});

test('timeout is reported as timed out with nonzero global outcome',t=>{
  const f=fixture(t);
  const r=runR004({...f.common,taskPlan:[f.task('hang','checks/hang.mjs',80)]});
  assert.equal(r.exitCode,1);
  assert.equal(r.receipt.tasks[0].status,'TIMED_OUT');
  assert.equal(r.receipt.tasks[0].errorCode,'ETIMEDOUT');
});

test('dirty tracked checkout prevents any test command running',t=>{
  const f=fixture(t);
  writeFileSync(join(f.root,'checks','ok.mjs'),'throw new Error("should not execute")');
  const r=runR004({...f.common,taskPlan:[f.task('ok','checks/ok.mjs')]});
  assert.equal(r.exitCode,2);
  assert.ok(r.receipt.preflight.includes('DIRTY_CHECKOUT'));
  assert.equal(r.receipt.tasks.length,0);
});

test('untracked source does not inherit the pinned HEAD as a false source lock',t=>{
  const f=fixture(t);
  writeFileSync(join(f.root,'checks','untracked.mjs'),'console.log("untracked")');
  const r=runR004({...f.common,taskPlan:[f.task('ok','checks/ok.mjs')]});
  assert.equal(r.exitCode,2);
  assert.ok(r.receipt.preflight.includes('DIRTY_CHECKOUT'));
  assert.equal(r.receipt.tasks.length,0);
});

test('a symlinked test source outside the repository is blocked before execution',t=>{
  const f=fixture(t);
  const external=join(f.outputParent,'outside.mjs');
  writeFileSync(external,'console.log("outside");');
  try { symlinkSync(external,join(f.root,'checks','link.mjs')); }
  catch (err) {
    if (['EPERM','EACCES','ENOTSUP'].includes(err.code)) {
      t.skip('Symlink privilege unavailable on this OS; requires separate review');
      return;
    }
    throw err;
  }
  // Only the new symlink is untracked; the synthetic fixture needs a local commit to test source fencing.
  git(f.root,['add','checks/link.mjs']);
  git(f.root,['commit','-qm','Fixture symlink source']);
  const r=runR004({...f.common,taskPlan:[f.task('link','checks/link.mjs')]});
  assert.equal(r.exitCode,1);
  assert.equal(r.receipt.tasks[0].status,'UNSAFE_SOURCE_PATH');
});

test('Node version below requirement prevents running any product tests',t=>{
  const f=fixture(t);
  const r=runR004({...f.common,minNodeMajor:999,taskPlan:[f.task('ok','checks/ok.mjs')]});
  assert.equal(r.exitCode,2);
  assert.ok(r.receipt.preflight.includes('NODE_24_REQUIRED'));
  assert.equal(r.receipt.tasks.length,0);
});

test('scrub credentials in real child output, including failure output',t=>{
  const f=fixture(t);
  const r=runR004({...f.common,taskPlan:[f.task('secret','checks/secret.mjs')]});
  assert.equal(r.exitCode,0);
  const text=readFileSync(r.receiptPath,'utf8');
  assert.doesNotMatch(text,/ABCDEF1234567890|the-real-value/);
  assert.match(text,/\[REDACTED\]/);
});

test('CLI has an actual help exit and rejects arbitrary execution arguments',()=>{
  const help=spawnSync(process.execPath,[script,'--help'],{encoding:'utf8'});
  assert.equal(help.status,0,help.stderr);
  assert.match(help.stdout,/Not a CI\/browser\/device/);
  const unsafe=spawnSync(process.execPath,[script,'--command','rm'],{encoding:'utf8'});
  assert.equal(unsafe.status,2);
  assert.match(unsafe.stderr,/Usage/);
});

test('full profile includes packaging and runtime checks but never installs dependencies',()=>{
  const full=TASKS.filter(x=>x.profiles.includes('full'));
  assert.deepEqual(full.filter(x=>x.id.startsWith('host')).map(x=>x.id),['host-unit','host-http','host-http-tests']);
  assert.deepEqual(full.find(x=>x.id==='rust-locked').args,['check','--workspace','--locked']);
  assert.ok(full.every(x=>x.cmd==='node'||x.cmd==='bun'||x.cmd==='cargo'));
});
