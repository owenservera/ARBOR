#!/usr/bin/env node
// R004 local acceptance runner. Executes only fixed, in-repository test commands.
// This is not an owner-acceptance or release gate, and never performs provider effects.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const SCHEMA = 'arbor.r004.local-gate/1';
const MAX_EXCERPT = 8192;
const BAD_SECRET = /\b(Bearer\s+)[A-Za-z0-9._~+/-]{8,}|\b((?:gh[pousr]_|github_pat_|sk-)[A-Za-z0-9_-]{8,})|\b((?:token|api[_-]?key|password|secret)\s*[:=]\s*)[^\s,;]+/gi;
const KEEP_ENV = ['PATH','Path','PATHEXT','SystemRoot','SYSTEMROOT','WINDIR','COMSPEC',
  'TEMP','TMP','TMPDIR','HOME','USERPROFILE','LOCALAPPDATA','APPDATA','LANG','LC_ALL'];

export const TASKS = Object.freeze([
  { id:'queue', profiles:['focused','full'], cmd:'node', args:['scripts/roadmap/acceleration-queue.mjs','--check'], paths:['scripts/roadmap/acceleration-queue.mjs'], ms:60000 },
  { id:'release-truth', profiles:['focused','full'], cmd:'node', args:['scripts/roadmap/evidence-truth.mjs','--check'], paths:['scripts/roadmap/evidence-truth.mjs'], ms:60000 },
  { id:'host-unit', profiles:['focused','full'], cmd:'node', args:['--test','apps/vivim-host/test/product-journal.test.mjs','apps/vivim-host/test/product-routes.test.mjs','apps/vivim-host/test/chat-box-baseline.test.mjs'], paths:['apps/vivim-host/test/product-journal.test.mjs','apps/vivim-host/test/product-routes.test.mjs','apps/vivim-host/test/chat-box-baseline.test.mjs'], ms:180000 },
  { id:'wiki-feedback', profiles:['focused','full'], cmd:'node', args:['--test','apps/vivim-host/test/wiki-visual-contract.test.mjs','scripts/batch-evidence/wiki-evidence-regression.test.mjs','scripts/roadmap/evidence-truth.test.mjs','scripts/feedback-loop/compiler.test.mjs','scripts/acceleration/w1-integration-contract.test.mjs'], paths:['apps/vivim-host/test/wiki-visual-contract.test.mjs','scripts/batch-evidence/wiki-evidence-regression.test.mjs','scripts/roadmap/evidence-truth.test.mjs','scripts/feedback-loop/compiler.test.mjs','scripts/acceleration/w1-integration-contract.test.mjs'], ms:180000 },
  { id:'host-http', profiles:['focused','full'], cmd:'node', args:['scripts/acceleration/live-host-check.mjs'], paths:['scripts/acceleration/live-host-check.mjs'], ms:180000 },
  { id:'host-http-tests', profiles:['focused','full'], cmd:'node', args:['--test','scripts/acceleration/live-host-check.test.mjs'], paths:['scripts/acceleration/live-host-check.test.mjs'], ms:180000 },
  { id:'pwa-entry', profiles:['full'], cmd:'node', args:['--test','apps/vivim-host/test/mobile-first-entry.test.mjs'], paths:['apps/vivim-host/test/mobile-first-entry.test.mjs'], ms:180000 },
  { id:'bun-gate', profiles:['full'], cmd:'bun', args:['scripts/test-gate.mjs','--all','--no-cache'], paths:['scripts/test-gate.mjs','scripts/test-manifest.json','bun.lock'], ms:900000 },
  { id:'rust-locked', profiles:['full'], cmd:'cargo', args:['check','--workspace','--locked'], paths:['Cargo.toml','Cargo.lock'], ms:600000 }
]);

export function redact(value) {
  return String(value ?? '').replace(BAD_SECRET, (_, prefix, token, credential) => {
    if (prefix) return prefix + '[REDACTED]';
    if (token) return '[REDACTED]';
    return credential + '[REDACTED]';
  });
}
export function excerpt(value) {
  const s = redact(value);
  return s.length <= MAX_EXCERPT ? s : s.slice(0, MAX_EXCERPT) + `\n...[TRUNCATED ${s.length-MAX_EXCERPT} chars]`;
}
export function isolatedEnvironment(base = process.env, dataRoot) {
  const env = {};
  for (const k of KEEP_ENV) if (typeof base[k] === 'string') env[k] = base[k];
  env.VIVIM_HOST_DATA_DIR = dataRoot;
  env.ARBOR_R004_ISOLATED = '1';
  env.NO_COLOR = '1';
  return env;
}
export function toCommand(task) {
  const binary = task.cmd === 'node' ? process.execPath : task.cmd;
  return {binary, args:task.args};
}
function cmdResult(binary, args, options) {
  const started = Date.now();
  const result = spawnSync(binary, args, { cwd:options.cwd, env:options.env,
    timeout:options.timeout, encoding:'utf8', maxBuffer:5*1024*1024,
    windowsHide:true, shell:false });
  const timedOut = result.error?.code === 'ETIMEDOUT';
  return { status: timedOut ? 'TIMED_OUT' : result.error ? 'SPAWN_ERROR' : result.status === 0 ? 'PASS' : 'FAIL',
    exitCode:typeof result.status === 'number' ? result.status : null,
    signal:result.signal ?? null, errorCode:result.error?.code ?? null,
    durationMs:Date.now()-started, stdout:excerpt(result.stdout), stderr:excerpt(result.stderr) };
}
function stamp(status, detail) { return { status, ...(detail===undefined?{}:{detail}), exitCode:null }; }
function parseVersion(text) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(text||'').trim());
  return match ? { major:Number(match[1]), minor:Number(match[2]), patch:Number(match[3]) } : null;
}
function currentGit(root, env) {
  const sha = cmdResult('git',['rev-parse','--verify','HEAD'],{cwd:root,env,timeout:15000});
  const dirty = cmdResult('git',['status','--porcelain','--untracked-files=all'],{cwd:root,env,timeout:15000});
  const valid = sha.status === 'PASS' && /^[0-9a-f]{40}\s*$/.test(sha.stdout);
  return { sha:valid ? sha.stdout.trim() : null, status:valid && dirty.status === 'PASS' ? 'PINNED':'GIT_UNAVAILABLE',
    workingTreeDirty:dirty.status === 'PASS' && dirty.stdout.trim().length > 0,
    commands:{revParse:{status:sha.status,exitCode:sha.exitCode},status:{status:dirty.status,exitCode:dirty.exitCode}} };
}
function saveReceipt(dir, receipt) {
  mkdirSync(dir,{recursive:true, mode:0o700});
  const file = join(dir,'R004-LOCAL-GATE.json');
  writeFileSync(file, JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
  return file;
}
export function evaluate(taskResults, preflight) {
  if (preflight.length) return {status:'BLOCKED_PREFLIGHT',exitCode:2};
  if (taskResults.some(x=>x.status!=='PASS')) return {status:'BLOCKED_TESTS',exitCode:1};
  return {status:'LOCAL_TESTS_PASS_ACCEPTANCE_PENDING',exitCode:0};
}
export function runR004({root=ROOT,profile='focused',minNodeMajor=24,
  outputParent=tmpdir(),environment=process.env,taskPlan=TASKS,
  permitDirty=false}={}) {
  if (!['focused','full'].includes(profile)) throw new TypeError('Invalid profile');
  if (!existsSync(root)) throw new Error('Missing repository root');
  const session = mkdtempSync(join(outputParent,'arbor-r004-'));
  const privateDataRoot = join(session,'isolated-host-data');
  mkdirSync(privateDataRoot,{mode:0o700});
  const env = isolatedEnvironment(environment, privateDataRoot);
  const git = currentGit(root,env);
  const nodeVersion = parseVersion(process.version);
  const receipt = {schema:SCHEMA, profile, execution:'LOCAL_MACHINE_ONLY',
    sourceSha:git.sha, sourceStatus:git.status,
    startedAt:new Date().toISOString(), runtime:{node:process.version,platform:process.platform,arch:process.arch},
    privateDataRoot:'ISOLATED_IN_SYSTEM_TEMP', ownerDataTouched:false,
    browserDom:'UNRUN',physicalAndroid:'UNRUN',independentAcceptance:'UNRUN',releaseAcceptance:'UNRUN',
    preflight:[], tasks:[]};
  if (git.status!=='PINNED') receipt.preflight.push('GIT_SHA_NOT_PINNED');
  if (git.workingTreeDirty && !permitDirty) receipt.preflight.push('DIRTY_CHECKOUT');
  if (!nodeVersion || nodeVersion.major<minNodeMajor) receipt.preflight.push('NODE_24_REQUIRED');
  const selected = taskPlan.filter(x=>x.profiles.includes(profile));
  const canonicalRoot = realpathSync(root);
  if (!selected.length) receipt.preflight.push('NO_SELECTED_TESTS');
  if (!receipt.preflight.length) {
    for (const task of selected) {
      const missing=task.paths.filter(p=>!existsSync(join(root,p)));
      const unsafe = task.paths.filter(p=>{
        if (!existsSync(join(root,p))) return false;
        const target=realpathSync(join(root,p));
        return !target.startsWith(canonicalRoot+sep);
      });
      if (unsafe.length) {
        receipt.tasks.push({id:task.id,command:[task.cmd,...task.args],...stamp('UNSAFE_SOURCE_PATH',unsafe)});
        continue;
      }
      if (missing.length) {
        receipt.tasks.push({id:task.id,command:[task.cmd,...task.args],...stamp('SKIPPED_MISSING_SOURCE',missing)});
        continue;
      }
      const {binary,args}=toCommand(task);
      const result=cmdResult(binary,args,{cwd:root,env,timeout:task.ms});
      receipt.tasks.push({id:task.id,command:[task.cmd,...task.args],...result});
    }
  }
  receipt.endedAt=new Date().toISOString();
  receipt.result=evaluate(receipt.tasks,receipt.preflight);
  // Receipts are always outside the repository and cannot be mistaken for committed acceptance.
  const receiptPath=saveReceipt(session,receipt);
  return {receipt,receiptPath,...receipt.result};
}
function usage() {
  return 'R004 local gate (read-only, isolated test data)\n'+
    'Usage: node integration/scripts/r004-local-gate.mjs [--focused|--full]\n'+
    'Node >=24 required; all results and exits written to a private system-temp JSON receipt.\n'+
    'Not a CI/browser/device/owner/release acceptance receipt.\n';
}
function main(args) {
  if (args.length===1 && ['--help','-h'].includes(args[0])) { console.log(usage());return 0; }
  if (args.length>1 || (args.length===1 && !['--focused','--full'].includes(args[0]))) {
    console.error(usage());return 2;
  }
  const profile=args[0]==='--full'?'full':'focused';
  try {
    const r=runR004({profile});
    console.log(JSON.stringify({schema:SCHEMA,sourceSha:r.receipt.sourceSha,
      profile,decision:r.status,exitCode:r.exitCode,receiptPath:r.receiptPath,
      tasks:r.receipt.tasks.map(x=>({id:x.id,status:x.status,exitCode:x.exitCode}))},null,2));
    return r.exitCode;
  } catch (err) { console.error('R004 runner failed closed: '+excerpt(err?.message));return 2; }
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))
  process.exitCode=main(process.argv.slice(2));
