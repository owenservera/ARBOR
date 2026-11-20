# File: integration/scripts/w01g-r001-source-closure.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/scripts/w01g-r001-source-closure.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5457 B |
| Lines | 67 |
| Hash | 0492b52678da |
| Test | no |
| Generated | no |
| Component | integration |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 6 | no | const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),&#39;../..&#39;); |
| scopes | const | 7 | no | const scopes=[&#39;src-tauri&#39;,&#39;native/hqkg&#39;,&#39;core/programmability&#39;,&#39;apps/vivim-host&#39;,&#39;apps/mobile-relay&#39;,&#39;studio&#39;,&#39;harness&#39;,&#39;hq&#39;,&#39;packages/tierflow&#39;,&#39;contracts&#39;]; |
| ignored | const | 8 | no | const ignored=new Set([&#39;.git&#39;,&#39;node_modules&#39;,&#39;target&#39;,&#39;.next&#39;,&#39;dist&#39;,&#39;coverage&#39;,&#39;.cache&#39;,&#39;.venv&#39;]); |
| codeExt | const | 9 | no | const codeExt=new Set([&#39;.mjs&#39;,&#39;.js&#39;,&#39;.cjs&#39;,&#39;.ts&#39;,&#39;.tsx&#39;,&#39;.jsx&#39;]); |
| findings | const | 10 | no | const findings=[],files=[],counts={}; |
| rel | function | 11 | no | const rel=p=&gt;path.relative(root,p).replaceAll(&#39;\\\\&#39;,&#39;/&#39;); |
| inside | function | 12 | no | const inside=p=&gt;{const r=path.relative(root,path.resolve(p));return r!==&#39;..&#39;&amp;&amp;!r.startsWith(&#39;..&#39;+path.sep)&amp;&amp;!path.isAbsolute(r);}; |
| note | function | 13 | no | const note=(severity,code,file,detail)=&gt;findings.push({severity,code,file,detail}); |
| walk | function | 14 | no | function walk(dir,scope){ |
| p | const | 16 | no | const p=path.join(dir,e.name),s=lstatSync(p); |
| resolveImport | function | 32 | no | function resolveImport(from,spec){ |
| base | const | 34 | no | const base=path.resolve(path.dirname(from),spec); |
| opts | const | 36 | no | const opts=[base,...[&#39;.mjs&#39;,&#39;.js&#39;,&#39;.cjs&#39;,&#39;.ts&#39;,&#39;.tsx&#39;,&#39;.jsx&#39;,&#39;.json&#39;,&#39;.node&#39;].map(e=&gt;base+e),...[&#39;index.mjs&#39;,&#39;index.js&#39;,&#39;index.ts&#39;,&#39;index.tsx&#39;,&#39;package.json&#39;].map(e=&gt;path.join(base,e))]; |
| found | const | 37 | no | const found=opts.find(p=&gt;existsSync(p)&amp;&amp;lstatSync(p).isFile()); |
| ext | const | 42 | no | const ext=path.extname(file),name=rel(file); |
| src | const | 44 | no | const src=readFileSync(file,&#39;utf8&#39;); |
| patterns | const | 46 | no | const patterns=[/(?:^\|[;\\n])\\s*(?:import\|export)\\s+(?:[\\s\\S]*?\\s+from\\s+)?[&quot;&#39;]([^&quot;&#39;]+)[&quot;&#39;]/gm,/\\bimport\\s*\\(\\s*[&quot;&#39;]([^&quot;&#39;]+)[&quot;&#39;]\\s*\\)/g,/\\brequire\\s*\\(\\s*[&quot;&#39;]([^&quot;&#39;]+)[&quot;&#39;]\\s*\\)/g,/\\bnew\\s+URL\\s*\\(\\s*[&quot;… |
| p | const | 51 | no | const p=path.resolve(path.dirname(file),m[1]);if(!inside(p))note(&#39;BLOCKER&#39;,&#39;CARGO_EXTERNAL_PATH&#39;,name,m[1]);else if(!existsSync(p))note(&#39;BLOCKER&#39;,&#39;CARGO_PATH_MISSING&#39;,name,m[1]); |
| p | const | 54 | no | const p=path.resolve(path.dirname(file),m[1]);if(!inside(p)\|\|!existsSync(p))note(&#39;BLOCKER&#39;,&#39;RUST_INCLUDE_MISSING&#39;,name,m[1]); |
| cfg | const | 59 | no | const cfg=JSON.parse(readFileSync(path.join(root,&#39;src-tauri/tauri.conf.json&#39;),&#39;utf8&#39;)); |
| result | const | 65 | no | const result={schema:&#39;arbor.w01g.source-closure/1&#39;,scope:scopes,counts,filesVisited:files.length,method:&#39;Recursive filesystem traversal of complete local checkout; NOT GitHub compare pagination&#39;,limi… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| node:url | import | 5 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
