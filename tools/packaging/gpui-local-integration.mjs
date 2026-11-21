#!/usr/bin/env node
// GPUI-first, local-only integration verification. No Actions, fake products,
// remote effects, merges, branch writes or automatic lockfile generation.
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const GPUI='native/gpui-desktop/Cargo.toml';
const TARGET=path.join(ROOT,'native','gpui-desktop','target');
const BIN=path.join(TARGET,'release','vivim-gpui-desktop.exe');
const FROZEN=path.join(ROOT,'native','gpui-desktop','resources','runtime');
const SCHEMA='arbor.gpui-local-integration/1';
export const LOCAL_STEPS=Object.freeze([
  {id:'owner-proof-host',exe:'node',args:['--test','apps/vivim-host/test/native-owner-proof.test.mjs'],ms:120000},
  {id:'native-packaging-contracts',exe:'node',args:['--test','tools/packaging/test/bundle-gpui-desktop.test.mjs','tools/packaging/test/stage-gpui-runtime.test.mjs'],ms:120000},
  {id:'supervisor-native-rust',exe:'cargo',args:['test','-p','vivim-host-supervisor','--locked'],requiresRootLock:true,ms:600000},
  {id:'legacy-tauri-native-rust',exe:'cargo',args:['test','-p','vivim-host','--bin','vivim-host','--locked'],requiresRootLock:true,ms:600000},
  {id:'gpui-adapters-native-rust',exe:'cargo',args:['test','--manifest-path',GPUI,'--lib','--locked'],requiresGpuiLock:true,ms:600000},
  {id:'gpui-desktop-compile',exe:'cargo',args:['check','--manifest-path',GPUI,'--features','desktop','--locked'],requiresGpuiLock:true,ms:600000},
  {id:'host-source-integration',exe:'node',args:['--test','apps/vivim-host/test/control-http.test.mjs','apps/vivim-host/test/native-ui-view.test.mjs'],ms:180000},
  {id:'pwa-local-integration',exe:'node',args:['integration/scripts/pwa-run-now.mjs'],ms:180000},
]);
const sanitized=s=>String(s??'').replace(/\bBearer\s+[^\s,;]{8,}/gi,'Bearer [REDACTED]')
  .replace(/\b(gh[pousr]_|github_pat_|sk-)[A-Za-z0-9_-]{10,}/g,'[REDACTED]')
  .replace(/(token|api[_-]?key|password|secret)\s*[:=]\s*[^\s,;]+/gi,'$1=[REDACTED]');
function run(exe,args,ms,cwd=ROOT) {
  const binary=exe==='node'?process.execPath:exe;
  const res=spawnSync(binary,args,{cwd,encoding:'utf8',shell:false,windowsHide:true,timeout:ms,maxBuffer:1024*1024*2});
  const timedOut=res.error?.code==='ETIMEDOUT';
  return {status:timedOut?'FAIL':res.error?'FAIL':res.status===0?'PASS':'FAIL',
    exitCode:typeof res.status==='number'?res.status:null,
    command:[exe,...args].join(' '),
    tail:sanitized((res.stderr||'')+'\n'+(res.stdout||'')).slice(-3200),
    error:res.error?sanitized(res.error.message):null};
}
export function gateStep(step,{rootLock,gpuiLock,windows}) {
  if(step.requiresRootLock&&!rootLock)return 'MISSING_ROOT_CARGO_LOCK';
  if(step.requiresGpuiLock&&!gpuiLock)return 'MISSING_GPUI_CARGO_LOCK';
  if(step.id==='gpui-desktop-compile'&&!windows)return 'WINDOWS_GPUI_CHECK_REQUIRED';
  return null;
}
export function plan({rootLock,gpuiLock,windows}) {
  return LOCAL_STEPS.map(step=>({id:step.id,blocker:gateStep(step,{rootLock,gpuiLock,windows})}));
}
function runAll(mode='--validate') {
  if(!['--validate','--portable'].includes(mode))throw Error('Use --validate or --portable');
  const dir=mkdtempSync(path.join(tmpdir(),'arbor-gpui-local-'));
  const receipt=path.join(dir,'receipt.json');
  const git=run('git',['rev-parse','HEAD'],15000);
  const branch=run('git',['branch','--show-current'],15000);
  const requiredNode=Number(process.versions.node.split('.')[0])>=24;
  const rootLock=existsSync(path.join(ROOT,'Cargo.lock'));
  const gpuiLock=existsSync(path.join(ROOT,'native','gpui-desktop','Cargo.lock'));
  const bunLock=existsSync(path.join(ROOT,'bun.lock'));
  const windows=process.platform==='win32'&&process.arch==='x64';
  const state={schema:SCHEMA,mode,sourceSha:git.status==='PASS'?git.tail.trim():null,
    branch:branch.status==='PASS'?branch.tail.trim():null,
    node:process.version,platform:process.platform,arch:process.arch,startedAt:new Date().toISOString(),
    locks:{rootCargo:rootLock,gpuiCargo:gpuiLock,bun:bunLock},
    noGithubActions:true,deviceAcceptance:'UNRUN',installerAcceptance:'UNRUN',receiptPath:receipt,checks:[]};
  const push=(id,r)=>{state.checks.push({id,...r});console.log(id+': '+r.status+(r.reason?' ('+r.reason+')':''));};
  if(!requiredNode)push('node24',{status:'UNRUN',reason:'NODE_24_REQUIRED'});
  if(state.branch!=='main')push('main',{status:'UNRUN',reason:'NOT_MAIN_BRANCH'});
  if(!git.status||git.status!=='PASS')push('git',{status:'UNRUN',reason:'SOURCE_HEAD_UNAVAILABLE'});
  // Read-only evidence: no lockfile generation, git reset, stash, branch or source mutation.
  for(const step of LOCAL_STEPS){
    const reason=gateStep(step,{rootLock,gpuiLock,windows});
    if(reason){push(step.id,{status:'UNRUN',reason});continue;}
    if(!requiredNode){push(step.id,{status:'UNRUN',reason:'NODE_24_REQUIRED'});continue;}
    push(step.id,run(step.exe,step.args,step.ms));
  }
  if(mode==='--portable'){
    for(const file of ['Cargo.lock','bun.lock','native/gpui-desktop/Cargo.lock']) {
      if(!existsSync(path.join(ROOT,file)))push('portable-lock:'+file,{status:'UNRUN',reason:'FROZEN_LOCK_MISSING'});
    }
    if(windows&&rootLock&&gpuiLock&&bunLock&&requiredNode){
      const build=run('cargo',['build','--manifest-path',GPUI,'--features','desktop','--release','--locked','--target-dir',TARGET],600000);
      push('gpui-release-build',build);
      if(build.status==='PASS'){
        const staged=run('node',['tools/packaging/prepare-host-runtime.mjs','--stage-gpui'],600000);
        push('frozen-host-stage',staged);
        if(staged.status==='PASS'){
          const output=path.join(ROOT,'native','gpui-desktop','dist','VIVIM-GPUI-'+Date.now());
          const packed=run('node',['tools/packaging/bundle-gpui-desktop.mjs','--bundle','--runtime',FROZEN,'--binary',BIN,'--out',output],600000);
          push('portable-bundle',packed);
          if(packed.status==='PASS')push('portable-verify',run('node',['tools/packaging/bundle-gpui-desktop.mjs','--verify','--out',output],180000));
        }
      }
    } else push('portable-build',{status:'UNRUN',reason:!windows?'WINDOWS_X64_REQUIRED':'FROZEN_LOCKS_OR_NODE24_MISSING'});
  }
  const totals={PASS:0,FAIL:0,UNRUN:0};
  for(const row of state.checks)totals[row.status]++;
  state.totals=totals;state.finishedAt=new Date().toISOString();
  state.decision=totals.FAIL?'FAIL':totals.UNRUN?'UNRUN_REMAINS':'LOCAL_COMMANDS_PASS_NOT_DEVICE_ACCEPTED';
  writeFileSync(receipt,JSON.stringify(state,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify({decision:state.decision,totals,receipt,sourceSha:state.sourceSha,branch:state.branch}));
  if(state.decision!=='LOCAL_COMMANDS_PASS_NOT_DEVICE_ACCEPTED')process.exitCode=1;
  return state;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  try{runAll(process.argv[2]||'--validate');}
  catch(error){console.error('GPUI_LOCAL_RUN_FAILED: '+sanitized(error.message));process.exitCode=2;}
}
