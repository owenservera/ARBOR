#!/usr/bin/env node
// Explicit G Windows packaging gate, not an installer or publication mechanism.
import {existsSync,lstatSync,readFileSync,cpSync,copyFileSync,mkdirSync,renameSync,rmSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const resources=path.join(root,'src-tauri','resources');
const runtime=path.join(resources,'runtime');
const stage=path.join(resources,'.runtime-stage-'+process.pid);
const previous=path.join(resources,'.runtime-previous-'+process.pid);
const dirs=['apps/vivim-host','apps/mobile-relay','studio','harness','hq','packages/tierflow','packages/vec-ui-engines','contracts'];
const topFiles=['package.json','bun.lock','integration/source-lock.json','docs/data-intelligence/ingress-registry.v1.json'];
const refuse=s=>{throw new Error('PACKAGING_REFUSED: '+s);};
function checkInputs({requireLock=true}={}){
 for(const p of [...topFiles.filter(p=>requireLock||p!=='bun.lock'),'src-tauri/tauri.conf.json',...dirs])if(!existsSync(path.join(root,p)))refuse('missing '+p);
 const c=JSON.parse(readFileSync(path.join(root,'src-tauri/tauri.conf.json'),'utf8'));
 for(const p of Object.keys(c.bundle?.resources||{}))if(/\.apk$/i.test(p))refuse('PWA-first still mandates APK: '+p);
 if(!Object.keys(c.bundle?.resources||{}).includes('resources/runtime/'))refuse('Missing required resources/runtime/ in Tauri config');
}
const forbidden=name=>/(^\.env(?:\.|$)|owner-token|\.sqlite(?:3)?(?:-|$|\.)|\.db$|\.pem$|\.p12$|\.key$|\.log$|\.tap$|\.zip$|\.apk$|\.exe$)/i.test(name);
const excluded=new Set(['.git','node_modules','target','coverage','test','tests','fixtures','.cache','dist']);
function safeFilter(p){
 const name=path.basename(p),s=lstatSync(p);
 if(s.isSymbolicLink())refuse('Symlink in runtime input: '+p);
 if(forbidden(name))refuse('Potential private/binary artifact: '+p);
 return !s.isDirectory()||!excluded.has(name);
}
function run(exe,args,cwd){
 const r=spawnSync(exe,args,{cwd,encoding:'utf8',timeout:600000,windowsHide:true});
 if(r.error||r.status!==0)refuse(exe+' '+args.join(' ')+' exit='+String(r.status??'N/A')+': '+(r.error?.message||r.stderr?.slice(-2000)||''));
 return r.stdout.trim();
}
function nodeBinary(){
 if(process.platform!=='win32')refuse('Actual Windows runner required');
 const p=process.env.ARBOR_NODE24_EXE,hash=process.env.ARBOR_NODE24_SHA256?.toLowerCase();
 if(!p||!path.isAbsolute(p)||!existsSync(p)||path.basename(p).toLowerCase()!=='node.exe')refuse('Set ARBOR_NODE24_EXE to absolute Windows node.exe');
 if(!hash||!/^[0-9a-f]{64}$/.test(hash))refuse('Set verified 64-hex ARBOR_NODE24_SHA256');
 const actual=createHash('sha256').update(readFileSync(p)).digest('hex');
 if(actual!==hash)refuse('Node SHA256 mismatch expected='+hash+' actual='+actual);
 const meta=JSON.parse(run(p,['-p','JSON.stringify({node:process.versions.node,platform:process.platform,arch:process.arch})'],root));
 if(meta.platform!=='win32'||meta.arch!=='x64'||Number(meta.node.split('.')[0])<24)refuse('Expected signed Node 24+ Windows x64: '+JSON.stringify(meta));
 const cmd="$s=Get-AuthenticodeSignature -LiteralPath '"+p.replaceAll("'","''")+"'; if ($s.Status -ne 'Valid') { Write-Error $s.Status; exit 41 }";
 const sig=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(cmd,'utf16le').toString('base64')],{encoding:'utf8',windowsHide:true});
 if(sig.error||sig.status!==0)refuse('Node Authenticode invalid exit='+String(sig.status??'N/A')+': '+(sig.stderr||sig.error?.message||''));
 return p;
}
const mode=process.argv[2]||'--check';
if(!['--check','--stage','--lock'].includes(mode))refuse('Usage: node tools/packaging/prepare-host-runtime.mjs --check|--stage|--lock');
checkInputs({requireLock:mode!=='--lock'});
if(mode==='--lock'){
 // Explicit developer step, never replace the frozen distribution install with a floating install.
 run('bun',['install','--lockfile-only','--ignore-scripts'],root);
 checkInputs();
 console.log(JSON.stringify({status:'LOCK_GENERATED',note:'Review and commit bun.lock before staging'}));
}else if(mode==='--check'){
 console.log(JSON.stringify({status:'SOURCE_PREFLIGHT_ONLY',runtime:'NOT_STAGED',pwaFirst:true,apk:'DEFERRED',note:'No build or binary trust acceptance implied'}));
}else{
 const binary=nodeBinary();
 if(existsSync(stage)||existsSync(previous))refuse('Existing staging/rollback directory requires manual inspection');
 mkdirSync(stage,{recursive:true});
 try{
  for(const p of dirs){const to=path.join(stage,p);mkdirSync(path.dirname(to),{recursive:true});cpSync(path.join(root,p),to,{recursive:true,filter:safeFilter});}
  for(const p of topFiles){const to=path.join(stage,p);mkdirSync(path.dirname(to),{recursive:true});copyFileSync(path.join(root,p),to);}
  copyFileSync(binary,path.join(stage,'node.exe'));
  // Build and stage the existing Rust CLIs once at packaging time. The Host
  // discovers these exact bundled executables without Cargo or environment at runtime.
  run('cargo',['build','--release','-p','hq-knowledge-graph','--features','importer',
    '--bin','hqkg-personal','--bin','hqkg-chat-context','--bin','hqkg-web-feed','--target-dir',path.join(root,'target')],root);
  const nativeDir=path.join(stage,'native','bin');
  mkdirSync(nativeDir,{recursive:true});
  for(const name of ['hqkg-personal.exe','hqkg-chat-context.exe','hqkg-web-feed.exe'])
    copyFileSync(path.join(root,'target','release',name),path.join(nativeDir,name));
  run('bun',['install','--production','--frozen-lockfile','--ignore-scripts'],stage);
  run(path.join(stage,'node.exe'),['--check',path.join(stage,'apps/vivim-host/server.mjs')],stage);
  if(existsSync(runtime))renameSync(runtime,previous);
  try{renameSync(stage,runtime);}catch(e){if(existsSync(previous))renameSync(previous,runtime);throw e;}
  if(existsSync(previous))rmSync(previous,{recursive:true,force:true});
  console.log(JSON.stringify({status:'STAGED_NOT_ACCEPTED',runtime,nodeSha256:process.env.ARBOR_NODE24_SHA256,apk:'DEFERRED',note:'Cargo/Bun/security/device acceptance still required'}));
 }catch(e){if(existsSync(stage))rmSync(stage,{recursive:true,force:true});throw e;}
}
