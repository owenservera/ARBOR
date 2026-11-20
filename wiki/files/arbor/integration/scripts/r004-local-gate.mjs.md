# File: integration/scripts/r004-local-gate.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/scripts/r004-local-gate.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10511 B |
| Lines | 163 |
| Hash | 2a7fcbd39cda |
| Test | no |
| Generated | no |
| Component | integration |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 11 | yes | export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;../..&#39;); |
| SCHEMA | const | 12 | yes | export const SCHEMA = &#39;arbor.r004.local-gate/1&#39;; |
| MAX_EXCERPT | const | 13 | no | const MAX_EXCERPT = 8192; |
| BAD_SECRET | const | 14 | no | const BAD_SECRET = /\\b(Bearer\\s+)[A-Za-z0-9._~+/-]{8,}\|\\b((?:gh[pousr]_\|github_pat_\|sk-)[A-Za-z0-9_-]{8,})\|\\b((?:token\|api[_-]?key\|password\|secret)\\s*[:=]\\s*)[^\\s,;]+/gi; |
| KEEP_ENV | const | 15 | no | const KEEP_ENV = [&#39;PATH&#39;,&#39;Path&#39;,&#39;PATHEXT&#39;,&#39;SystemRoot&#39;,&#39;SYSTEMROOT&#39;,&#39;WINDIR&#39;,&#39;COMSPEC&#39;, |
| TASKS | const | 18 | yes | export const TASKS = Object.freeze([ { id:&#39;queue&#39;, profiles:[&#39;focused&#39;,&#39;full&#39;], cmd:&#39;node&#39;, args:[&#39;scripts/roadmap/acceleration-queue.mjs&#39;,&#39;--check&#39;], paths:[&#39;scripts/roadmap/acceleration-queue.mjs&#39;]… |
| redact | function | 30 | yes | export function redact(value) { |
| excerpt | function | 37 | yes | export function excerpt(value) { |
| s | const | 38 | no | const s = redact(value); |
| isolatedEnvironment | function | 41 | yes | export function isolatedEnvironment(base = process.env, dataRoot) { |
| env | const | 42 | no | const env = {}; |
| toCommand | function | 49 | yes | export function toCommand(task) { |
| binary | const | 50 | no | const binary = task.cmd === &#39;node&#39; ? process.execPath : task.cmd; |
| cmdResult | function | 53 | no | function cmdResult(binary, args, options) { |
| started | const | 54 | no | const started = Date.now(); |
| result | const | 55 | no | const result = spawnSync(binary, args, { cwd:options.cwd, env:options.env, timeout:options.timeout, encoding:&#39;utf8&#39;, maxBuffer:5*1024*1024, windowsHide:true, shell:false }); |
| timedOut | const | 58 | no | const timedOut = result.error?.code === &#39;ETIMEDOUT&#39;; |
| stamp | function | 64 | no | function stamp(status, detail) { return { status, ...(detail===undefined?{}:{detail}), exitCode:null }; } |
| parseVersion | function | 65 | no | function parseVersion(text) { |
| currentGit | function | 69 | no | function currentGit(root, env) { |
| sha | const | 70 | no | const sha = cmdResult(&#39;git&#39;,[&#39;rev-parse&#39;,&#39;--verify&#39;,&#39;HEAD&#39;],{cwd:root,env,timeout:15000}); |
| dirty | const | 71 | no | const dirty = cmdResult(&#39;git&#39;,[&#39;status&#39;,&#39;--porcelain&#39;,&#39;--untracked-files=all&#39;],{cwd:root,env,timeout:15000}); |
| valid | const | 72 | no | const valid = sha.status === &#39;PASS&#39; &amp;&amp; /^[0-9a-f]{40}\\s*$/.test(sha.stdout); |
| saveReceipt | function | 77 | no | function saveReceipt(dir, receipt) { |
| file | const | 79 | no | const file = join(dir,&#39;R004-LOCAL-GATE.json&#39;); |
| evaluate | function | 83 | yes | export function evaluate(taskResults, preflight) { |
| runR004 | function | 88 | yes | export function runR004({root=ROOT,profile=&#39;focused&#39;,minNodeMajor=24, outputParent=tmpdir(),environment=process.env,taskPlan=TASKS, permitDirty=false}={}) { |
| session | const | 93 | no | const session = mkdtempSync(join(outputParent,&#39;arbor-r004-&#39;)); |
| privateDataRoot | const | 94 | no | const privateDataRoot = join(session,&#39;isolated-host-data&#39;); |
| env | const | 96 | no | const env = isolatedEnvironment(environment, privateDataRoot); |
| git | const | 97 | no | const git = currentGit(root,env); |
| nodeVersion | const | 98 | no | const nodeVersion = parseVersion(process.version); |
| receipt | const | 99 | no | const receipt = {schema:SCHEMA, profile, execution:&#39;LOCAL_MACHINE_ONLY&#39;, |
| selected | const | 108 | no | const selected = taskPlan.filter(x=&gt;x.profiles.includes(profile)); |
| canonicalRoot | const | 109 | no | const canonicalRoot = realpathSync(root); |
| missing | const | 113 | no | const missing=task.paths.filter(p=&gt;!existsSync(join(root,p))); |
| unsafe | const | 114 | no | const unsafe = task.paths.filter(p=&gt;{ if (!existsSync(join(root,p))) return false; const target=realpathSync(join(root,p)); return !target.startsWith(canonicalRoot+sep); }); |
| target | const | 116 | no | const target=realpathSync(join(root,p)); |
| result | const | 128 | no | const result=cmdResult(binary,args,{cwd:root,env,timeout:task.ms}); |
| receiptPath | const | 135 | no | const receiptPath=saveReceipt(session,receipt); |
| usage | function | 138 | no | function usage() { |
| main | function | 144 | no | function main(args) { |
| permitDirty | const | 146 | no | const permitDirty = args.includes(&#39;--permit-dirty&#39;); |
| positional | const | 147 | no | const positional = args.filter((a) =&gt; a !== &#39;--permit-dirty&#39;); |
| profile | const | 151 | no | const profile=positional[0]===&#39;--full&#39;?&#39;full&#39;:&#39;focused&#39;; |
| r | const | 155 | no | const r=runR004({profile,permitDirty}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 4 | external |
| node:fs | import | 5 | external |
| node:os | import | 6 | external |
| node:path | import | 7 | external |
| node:url | import | 8 | external |
| node:crypto | import | 9 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [integration/scripts/r004-local-gate.test.mjs](./r004-local-gate.test.mjs.md) | ./r004-local-gate.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 164 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
