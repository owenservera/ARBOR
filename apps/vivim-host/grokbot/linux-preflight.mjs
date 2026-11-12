#!/usr/bin/env node
// Read-only Linux eligibility probe. No agent starts, Tailscale mutations or browser effects.
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { accessSync, constants, statSync } from 'node:fs';
import path from 'node:path';
const probe = (cmd,args) => {
  try {const r=spawnSync(cmd,args,{encoding:'utf8',timeout:5000,maxBuffer:65536,shell:false});
    return {available:!r.error && r.status===0,exitCode:r.status,detail:r.error?.code || null};
  }catch(e){return {available:false,detail:e.code||e.name};}
};
const root=process.env.VIVIM_HOST_DATA_DIR || path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(),'.local/share'),'vivim');
let writable=false,exists=false;
try{const s=statSync(root);exists=s.isDirectory();accessSync(root,constants.W_OK);writable=exists;}catch{}
const report={schema:'vivim.linux-grokbot-preflight/1',observedAt:new Date().toISOString(),
  platform:process.platform,arch:process.arch,node:process.version,hostData:{configured:!!process.env.VIVIM_HOST_DATA_DIR,exists,writable},
  tailscale:probe('tailscale',['status','--json']),tailscaleServe:probe('tailscale',['serve','status','--json']),
  grokbotNative:{available:false,reason:'No verified native Grokbot CLI/IPC contract has been discovered. Telemetry daemon is not a task dispatcher.'},
  ready:false,blockers:[]};
if(process.platform!=='linux')report.blockers.push('NOT_LINUX');
if(!writable)report.blockers.push('DATA_ROOT_NOT_WRITABLE');
if(!report.tailscale.available)report.blockers.push('TAILSCALE_NOT_READY');
report.blockers.push('GROKBOT_NATIVE_ADAPTER_UNVERIFIED');
console.log(JSON.stringify(report,null,2));
