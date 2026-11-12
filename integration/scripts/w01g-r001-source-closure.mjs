#!/usr/bin/env node
// Full local checkout source-closure audit. Does not execute product effects or access owner data.
import {existsSync,lstatSync,readFileSync,readdirSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const scopes=['src-tauri','native/hqkg','core/programmability','apps/vivim-host','apps/mobile-relay','studio','harness','hq','packages/tierflow','contracts'];
const ignored=new Set(['.git','node_modules','target','.next','dist','coverage','.cache','.venv']);
const codeExt=new Set(['.mjs','.js','.cjs','.ts','.tsx','.jsx']);
const findings=[],files=[],counts={};
const rel=p=>path.relative(root,p).replaceAll('\\','/');
const inside=p=>{const r=path.relative(root,path.resolve(p));return r!=='..'&&!r.startsWith('..'+path.sep)&&!path.isAbsolute(r);};
const note=(severity,code,file,detail)=>findings.push({severity,code,file,detail});
function walk(dir,scope){
 for(const e of readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name),s=lstatSync(p);
  if(s.isSymbolicLink()){note('BLOCKER','SYMLINK_SOURCE',rel(p),'Review external path/realpath before accepting');continue;}
  if(s.isDirectory()){if(!ignored.has(e.name))walk(p,scope);continue;}
  if(s.isFile()){files.push(p);counts[scope]=(counts[scope]||0)+1;}
 }
}
for(const scope of scopes){const p=path.join(root,scope);if(existsSync(p))walk(p,scope);else note('BLOCKER','SOURCE_DIRECTORY_MISSING',scope,'Required imported subtree absent');}
for(const p of ['Cargo.toml','Cargo.lock','package.json','bun.lock','rust-toolchain.toml','src-tauri/Cargo.toml','src-tauri/build.rs','src-tauri/tauri.conf.json','src-tauri/icons/icon.ico','tools/packaging/prepare-host-runtime.mjs']){
 if(!existsSync(path.join(root,p)))note('BLOCKER','BUILD_INPUT_MISSING',p,'Do not infer reproducible build');
}
for(const p of ['apps/vivim-host','apps/mobile-relay','studio','harness','hq','packages/tierflow']){
 if(!existsSync(path.join(root,p,'package.json')))note('BLOCKER','BUN_MEMBER_MISSING',p,'Root workspace package absent');
}
for(const p of ['native/hqkg','core/programmability','src-tauri']){
 if(!existsSync(path.join(root,p,'Cargo.toml')))note('BLOCKER','CARGO_MEMBER_MISSING',p,'Root Cargo member absent');
}
function resolveImport(from,spec){
 if(!spec.startsWith('.'))return;
 const base=path.resolve(path.dirname(from),spec);
 if(!inside(base)){note('BLOCKER','OUTSIDE_IMPORT',rel(from),spec);return;}
 const opts=[base,...['.mjs','.js','.cjs','.ts','.tsx','.jsx','.json','.node'].map(e=>base+e),...['index.mjs','index.js','index.ts','index.tsx','package.json'].map(e=>path.join(base,e))];
 const found=opts.find(p=>existsSync(p)&&lstatSync(p).isFile());
 if(!found)note('BLOCKER','IMPORT_UNRESOLVED',rel(from),spec);
 else if(!inside(realpathSync(found)))note('BLOCKER','IMPORT_REALPATH_ESCAPE',rel(from),spec);
}
for(const file of files){
 const ext=path.extname(file),name=rel(file);
 if(!['.js','.mjs','.cjs','.ts','.tsx','.jsx','.rs','.toml','.json'].includes(ext))continue;
 const src=readFileSync(file,'utf8');
 if(codeExt.has(ext)){
  const patterns=[/(?:^|[;\n])\s*(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/gm,/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,/\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,/\bnew\s+URL\s*\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g];
  for(const regex of patterns)for(const m of src.matchAll(regex))resolveImport(file,m[1]);
  if(/\b(?:import|require)\s*\(\s*`/.test(src))note('ADVISORY','COMPUTED_IMPORT',name,'Review computed runtime resolution');
 }
 if(ext==='.toml')for(const m of src.matchAll(/\bpath\s*=\s*"([^"]+)"/g)){
  const p=path.resolve(path.dirname(file),m[1]);if(!inside(p))note('BLOCKER','CARGO_EXTERNAL_PATH',name,m[1]);else if(!existsSync(p))note('BLOCKER','CARGO_PATH_MISSING',name,m[1]);
 }
 if(ext==='.rs')for(const m of src.matchAll(/\binclude(?:_bytes|_str)?!\s*\(\s*"([^"]+)"\s*\)/g)){
  const p=path.resolve(path.dirname(file),m[1]);if(!inside(p)||!existsSync(p))note('BLOCKER','RUST_INCLUDE_MISSING',name,m[1]);
 }
 if(/\.\.\/(?:repos-hq|tierflow|vivim-web-harness|vivim-labs)(?:\/|["'`])/i.test(src))note('BLOCKER','DONOR_PATH_STRING',name,'Check external donor dependency');
}
try{
 const cfg=JSON.parse(readFileSync(path.join(root,'src-tauri/tauri.conf.json'),'utf8'));
 for(const resource of Object.keys(cfg.bundle?.resources||{})){
  if(/\.apk$|vivim-release\.manifest/.test(resource))note('BLOCKER','PWA_FIRST_APK_RESOURCE','src-tauri/tauri.conf.json',resource);
  if(!existsSync(path.join(root,'src-tauri',resource)))note('BLOCKER','TAURI_RESOURCE_MISSING','src-tauri/tauri.conf.json',resource);
 }
}catch(e){note('BLOCKER','TAURI_CONFIG_READ','src-tauri/tauri.conf.json',String(e));}
const result={schema:'arbor.w01g.source-closure/1',scope:scopes,counts,filesVisited:files.length,method:'Recursive filesystem traversal of complete local checkout; NOT GitHub compare pagination',limitations:['Computed imports need owner review and execution','Third-party resolution, Windows native ABI, donor process isolation and physical device acceptance are separate checks'],findings,blockers:findings.filter(x=>x.severity==='BLOCKER').length,advisories:findings.filter(x=>x.severity==='ADVISORY').length};
console.log(JSON.stringify(result,null,2));
if(result.blockers)process.exitCode=1;
