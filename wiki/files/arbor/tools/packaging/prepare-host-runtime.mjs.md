# File: tools/packaging/prepare-host-runtime.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | tools/packaging/prepare-host-runtime.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18684 B |
| Lines | 308 |
| Hash | 582e7bf5087e |
| Test | no |
| Generated | no |
| Component | tools |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 16 | no | const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),&#39;../..&#39;); |
| resources | const | 17 | no | const resources=path.join(root,&#39;src-tauri&#39;,&#39;resources&#39;); |
| runtime | const | 18 | no | const runtime=path.join(resources,&#39;runtime&#39;); |
| stage | const | 19 | no | const stage=path.join(resources,&#39;.runtime-stage-&#39;+process.pid); |
| previous | const | 20 | no | const previous=path.join(resources,&#39;.runtime-previous-&#39;+process.pid); |
| STAGED_DIRS | const | 23 | yes | export const STAGED_DIRS=[&#39;apps/vivim-host&#39;,&#39;apps/mobile-relay&#39;,&#39;studio&#39;,&#39;harness&#39;,&#39;hq&#39;,&#39;packages/tierflow&#39;,&#39;packages/vec-ui-engines&#39;,&#39;contracts&#39;]; |
| STAGED_TOP_FILES | const | 24 | yes | export const STAGED_TOP_FILES=[&#39;package.json&#39;,&#39;bun.lock&#39;,&#39;integration/source-lock.json&#39;,&#39;docs/data-intelligence/ingress-registry.v1.json&#39;]; |
| LOCKFILES | const | 27 | yes | export const LOCKFILES=[&#39;bun.lock&#39;,&#39;Cargo.lock&#39;]; |
| PACKAGED_BINARIES | const | 33 | yes | export const PACKAGED_BINARIES=[&#39;hqkg-personal&#39;,&#39;hqkg-chat-context&#39;,&#39;hqkg-web-feed&#39;,&#39;hqkg-import&#39;,&#39;vivim-program-validate&#39;]; |
| CARGO_BUILDS | const | 37 | yes | export const CARGO_BUILDS=[ |
| cargoArgs | function | 41 | yes | export function cargoArgs(plan,targetDir){ |
| args | const | 42 | no | const args=[&#39;build&#39;,&#39;--release&#39;,&#39;-p&#39;,plan.package]; |
| HOST_ENTRY | const | 48 | yes | export const HOST_ENTRY=&#39;apps/vivim-host/server.mjs&#39;; |
| RUNTIME_MANIFEST_NAME | const | 49 | yes | export const RUNTIME_MANIFEST_NAME=&#39;runtime.manifest.json&#39;; |
| RUNTIME_MANIFEST_SCHEMA | const | 50 | yes | export const RUNTIME_MANIFEST_SCHEMA=&#39;arbor.host-runtime-manifest/1&#39;; |
| RUNTIME_PLACEHOLDER | const | 51 | yes | export const RUNTIME_PLACEHOLDER=&#39;ARBOR-RUNTIME-PLACEHOLDER.txt&#39;; |
| dirs | const | 52 | no | const dirs=STAGED_DIRS; |
| topFiles | const | 53 | no | const topFiles=STAGED_TOP_FILES; |
| refuse | function | 54 | no | const refuse=s=&gt;{throw new Error(&#39;PACKAGING_REFUSED: &#39;+s);}; |
| checkInputs | function | 55 | no | function checkInputs({requireLock=true}={}){ |
| c | const | 57 | no | const c=JSON.parse(readFileSync(path.join(root,&#39;src-tauri/tauri.conf.json&#39;),&#39;utf8&#39;)); |
| forbidden | function | 61 | no | const forbidden=name=&gt;/(^\\.env(?:\\.\|$)\|owner-token\|\\.sqlite(?:3)?(?:-\|$\|\\.)\|\\.db$\|\\.pem$\|\\.p12$\|\\.key$\|\\.log$\|\\.tap$\|\\.zip$\|\\.apk$\|\\.exe$)/i.test(name); |
| excluded | const | 62 | no | const excluded=new Set([&#39;.git&#39;,&#39;node_modules&#39;,&#39;target&#39;,&#39;coverage&#39;,&#39;test&#39;,&#39;tests&#39;,&#39;fixtures&#39;,&#39;.cache&#39;,&#39;dist&#39;]); |
| safeFilter | function | 63 | no | function safeFilter(p){ |
| name | const | 64 | no | const name=path.basename(p),s=lstatSync(p); |
| run | function | 69 | no | function run(exe,args,cwd){ |
| r | const | 70 | no | const r=spawnSync(exe,args,{cwd,encoding:&#39;utf8&#39;,timeout:600000,windowsHide:true}); |
| nodeBinary | function | 74 | no | function nodeBinary(){ |
| p | const | 76 | no | const p=process.env.ARBOR_NODE24_EXE,hash=process.env.ARBOR_NODE24_SHA256?.toLowerCase(); |
| actual | const | 79 | no | const actual=createHash(&#39;sha256&#39;).update(readFileSync(p)).digest(&#39;hex&#39;); |
| meta | const | 81 | no | const meta=JSON.parse(run(p,[&#39;-p&#39;,&#39;JSON.stringify({node:process.versions.node,platform:process.platform,arch:process.arch})&#39;],root)); |
| cmd | const | 83 | no | const cmd=&quot;$s=Get-AuthenticodeSignature -LiteralPath &#39;&quot;+p.replaceAll(&quot;&#39;&quot;,&quot;&#39;&#39;&quot;)+&quot;&#39;; if ($s.Status -ne &#39;Valid&#39;) { Write-Error $s.Status; exit 41 }&quot;; |
| sig | const | 84 | no | const sig=spawnSync(&#39;powershell.exe&#39;,[&#39;-NoProfile&#39;,&#39;-NonInteractive&#39;,&#39;-EncodedCommand&#39;,Buffer.from(cmd,&#39;utf16le&#39;).toString(&#39;base64&#39;)],{encoding:&#39;utf8&#39;,windowsHide:true}); |
| ensureRuntimeResourceDir | function | 103 | yes | export function ensureRuntimeResourceDir(base=root){ |
| dir | const | 104 | no | const dir=path.join(base,&#39;src-tauri&#39;,&#39;resources&#39;,&#39;runtime&#39;); |
| marker | const | 106 | no | const marker=path.join(dir,RUNTIME_PLACEHOLDER); |
| resolveRelative | function | 119 | no | function resolveRelative(fromFile,specifier,base){ |
| target | const | 120 | no | const target=path.resolve(path.dirname(fromFile),specifier); |
| probes | const | 122 | no | const probes=[target, |
| importClosure | function | 127 | yes | export function importClosure(entryFile,base){ |
| seen | const | 128 | no | const seen=new Set(),queue=[entryFile]; |
| file | const | 130 | no | const file=queue.pop(); |
| source | variable | 133 | no | let source=&#39;&#39;; |
| patterns | const | 135 | no | const patterns=[ |
| resolved | const | 141 | no | const resolved=resolveRelative(file,match[1],base); |
| runtimeImportClosure | function | 148 | yes | export function runtimeImportClosure(base=root,entry=HOST_ENTRY){ |
| entryFile | const | 149 | no | const entryFile=path.join(base,entry); |
| stagedCoverage | function | 156 | yes | export function stagedCoverage(rel){ |
| uncoveredClosure | function | 161 | yes | export function uncoveredClosure(rels){ |
| frozenManifest | function | 166 | yes | export function frozenManifest(base){ |
| entries | const | 167 | no | const entries=[]; |
| walk | function | 168 | no | const walk=(dir,prefix)=&gt;{ |
| abs | const | 171 | no | const abs=path.join(dir,name); |
| st | variable | 172 | no | let st;try{st=lstatSync(abs);}catch{continue;} |
| writeFrozenManifest | function | 181 | yes | export function writeFrozenManifest(base){ |
| manifest | const | 182 | no | const manifest=frozenManifest(base); |
| verifyStagedRuntime | function | 187 | yes | export function verifyStagedRuntime(base,{manifest=null}={}){ |
| problems | const | 188 | no | const problems=[]; |
| rel | function | 189 | no | const rel=p=&gt;path.relative(base,p).split(path.sep).join(&#39;/&#39;); |
| closure | const | 192 | no | const closure=runtimeImportClosure(base); |
| binDir | const | 195 | no | const binDir=path.join(base,&#39;native&#39;,&#39;bin&#39;); |
| file | const | 197 | no | const file=path.join(binDir,name+&#39;.exe&#39;); |
| stem | const | 202 | no | const stem=name.replace(/\\.exe$/i,&#39;&#39;); |
| toolPattern | const | 208 | no | const toolPattern=/^(cargo\|bun\|git)(\\.exe)?$/i; |
| scan | function | 209 | no | const scan=(dir,prefix)=&gt;{ |
| names | variable | 210 | no | let names;try{names=readdirSync(dir);}catch{return;} |
| abs | const | 213 | no | const abs=path.join(dir,name); |
| st | variable | 214 | no | let st;try{st=lstatSync(abs);}catch{continue;} |
| verifiedFiles | variable | 222 | no | let verifiedFiles=0; |
| abs | const | 226 | no | const abs=path.join(base,entry.path); |
| actual | const | 228 | no | const actual=createHash(&#39;sha256&#39;).update(readFileSync(abs)).digest(&#39;hex&#39;); |
| main | function | 239 | yes | export function main(argv){ |
| mode | const | 240 | no | const mode=argv[0]\|\|&#39;--check&#39;; |
| modeArg | const | 242 | no | const modeArg=argv[1]\|\|null; |
| base | const | 245 | no | const base=modeArg?path.resolve(process.cwd(),modeArg):runtime; |
| manifestPath | const | 247 | no | const manifestPath=path.join(base,RUNTIME_MANIFEST_NAME); |
| manifest | const | 248 | no | const manifest=existsSync(manifestPath)?JSON.parse(readFileSync(manifestPath,&#39;utf8&#39;)):null; |
| report | const | 249 | no | const report=verifyStagedRuntime(base,{manifest}); |
| dir | const | 255 | no | const dir=ensureRuntimeResourceDir(root); |
| dir | const | 267 | no | const dir=ensureRuntimeResourceDir(root); |
| missingLocks | const | 268 | no | const missingLocks=LOCKFILES.filter(p=&gt;!existsSync(path.join(root,p))); |
| binary | const | 275 | no | const binary=nodeBinary(); |
| nativeDir | const | 285 | no | const nativeDir=path.join(stage,&#39;native&#39;,&#39;bin&#39;); |
| report | const | 293 | no | const report=verifyStagedRuntime(stage,{manifest:JSON.parse(readFileSync(path.join(stage,RUNTIME_MANIFEST_NAME),&#39;utf8&#39;))}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 11 | external |
| node:path | import | 12 | external |
| node:url | import | 13 | external |
| node:child_process | import | 14 | external |
| node:crypto | import | 15 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [scripts/batch-evidence/D05-E02-host-process-health.test.mjs](../../scripts/batch-evidence/D05-E02-host-process-health.test.mjs.md) | ../../tools/packaging/prepare-host-runtime.mjs |
| [scripts/batch-evidence/D05-packaging.test.mjs](../../scripts/batch-evidence/D05-packaging.test.mjs.md) | ../../tools/packaging/prepare-host-runtime.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Explicit G Windows packaging gate, not an installer or publication mechanism.
//
// Frozen packaging contract (the only thing this gate is allowed to stage):
//   * the product payload is exactly STAGED_DIRS + STAGED_TOP_FILES + the
//     PACKAGED_BINARIES + the bundled node.exe;
//   * the staged runtime must launch every required binary from those files
//     alone - never Cargo, Bun or Git, and never a debug build;
//   * the staged tree is frozen into a sha256 manifest so an installed runtime
//     can be re-verified byte for byte after the fact.
import {existsSync,lstatSync,readFileSync,cpSync,copyFileSync,mkdirSync,renameSync,rmSync,writeFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const resources=path.join(root,'src-tauri','resources');
const runtime=path.join(resources,'runtime');
const stage=path.join(resources,'.runtime-stage-'+process.pid);
const previous=path.join(resources,'.runtime-previous-'+process.pid);
// Frozen staging contract. STAGED_DIRS are workspace trees copied verbatim;
// STAGED_TOP_FILES are single product files the Host reads at runtime.
export const STAGED_DIRS=['apps/vivim-host','apps/mobile-relay','studio','harness','hq','packages/tierflow','packages/vec-ui-engines','contracts'];
export const STAGED_TOP_FILES=['package.json','bun.lock','integration/source-lock.json','docs/data-intelligence/ingress-registry.v1.json'];
// A frozen package needs both lockfiles. They are generated by the W01-G gate
// and promoted by the owner; until then a clean checkout is NOT packageable.
export const LOCKFILES=['bun.lock','Cargo.lock'];
// Only these native binaries have a proven production port in the shipped
// product. `hqkg-import` is the native KG importer behind `hq kg sync`
// (hq/bin/hq.mjs:1075) and the refresh pipeline (hq/lib/refresh.mjs:313); it
// must be staged before those call sites can drop their Cargo spawn, or product
// KG sync regresses.
export const PACKAGED_BINARIES=['hqkg-personal','hqkg-chat-context','hqkg-web-feed','hqkg-import','vivim-program-validate'];
// Release build plan for the packaged binaries. A name in PACKAGED_BINARIES that
// is not built here could only come from a debug target tree, so the two lists
// are asserted against each other by scripts/batch-evidence/D05-packaging.test.mjs.
export const CARGO_BUILDS=[
 {package:'hq-knowledge-graph',features:['importer'],
  bins:['hqkg-personal','hqkg-chat-context','hqkg-web-feed','hqkg-import']},
 {package:'vivim-programmability-core',features:[],bins:['vivim-program-validate']}];
export function cargoArgs(plan,targetDir){
 const args=['build','--release','-p',plan.package];
 if(plan.features?.length)args.push('--features',plan.features.join(','));
 for(const bin of plan.bins)args.push('--bin',bin);
 return [...args,'--target-dir',targetDir];
}
// The Host entry point whose import closure the staged runtime must satisfy.
export const HOST_ENTRY='apps/vivim-host/server.mjs';
export const RUNTIME_MANIFEST_NAME='runtime.manifest.json';
export const RUNTIME_MANIFEST_SCHEMA='arbor.host-runtime-manifest/1';
export const RUNTIME_PLACEHOLDER='ARBOR-RUNTIME-PLACEHOLDER.txt';
const dirs=STAGED_DIRS;
const topFiles=STAGED_TOP_FILES;
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
```

_First 80 of 309 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
