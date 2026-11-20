# File: studio/scripts/architecture-inventory.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/architecture-inventory.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 2424 B |
| Lines | 42 |
| Hash | 56e4010410ca |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| root | const | 6 | no | const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;..&#39;); |
| slash | function | 7 | no | const slash = p =&gt; p.split(path.sep).join(&#39;/&#39;); |
| ignored | const | 8 | no | const ignored = new Set([&#39;.git&#39;,&#39;node_modules&#39;,&#39;.cache&#39;,&#39;coverage&#39;,&#39;sessions&#39;,&#39;captures&#39;,&#39;data&#39;,&#39;chrome-profile&#39;]); |
| walk | function | 9 | no | async function walk(rel=&#39;&#39;) { |
| dir | const | 10 | no | const dir=path.join(root,rel); |
| files | const | 11 | no | const files=[]; |
| next | const | 14 | no | const next=slash(path.join(rel,d.name)); |
| info | const | 17 | no | const info=await stat(path.join(root,next)); |
| manifest | const | 23 | no | const manifest=JSON.parse(await readFile(path.join(root,&#39;architecture&#39;,&#39;components.json&#39;),&#39;utf8&#39;)); |
| files | const | 24 | no | const files=await walk(); |
| code | const | 25 | no | const code=files.filter(f=&gt;f.path.startsWith(&#39;src/&#39;)); |
| isOwned | function | 26 | no | const isOwned=(file,component)=&gt;component.codePaths.some(p=&gt;file.path.startsWith(p)); |
| summary | const | 27 | no | const summary=manifest.components.map(c=&gt;{ const owned=files.filter(f=&gt;isOwned(f,c)); return {id:c.id,name:c.name,files:owned.length,bytes:owned.reduce((n,f)=&gt;n+f.bytes,0), codePaths:c.codePaths,matu… |
| owned | const | 28 | no | const owned=files.filter(f=&gt;isOwned(f,c)); |
| uncovered | const | 32 | no | const uncovered=code.filter(f=&gt;!manifest.components.some(c=&gt;isOwned(f,c))).map(f=&gt;f.path); |
| missing | const | 33 | no | const missing=manifest.components.flatMap(c=&gt;c.codePaths.filter(p=&gt;!files.some(f=&gt;f.path.startsWith(p))).map(p=&gt;c.id+&#39;: &#39;+p)); |
| result | const | 34 | no | const result={schemaVersion:1,source:manifest.source,totalFiles:files.length,studioSourceFiles:code.length, |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 3 | external |
| node:path | import | 4 | external |
| node:url | import | 5 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Self-contained architecture ownership and footprint inventory.
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slash = p => p.split(path.sep).join('/');
const ignored = new Set(['.git','node_modules','.cache','coverage','sessions','captures','data','chrome-profile']);
async function walk(rel='') {
  const dir=path.join(root,rel);
  const files=[];
  for (const d of await readdir(dir,{withFileTypes:true})) {
    if (d.isSymbolicLink() || (d.isDirectory() && ignored.has(d.name))) continue;
    const next=slash(path.join(rel,d.name));
    if (d.isDirectory()) files.push(...await walk(next));
    else if (d.isFile()) {
      const info=await stat(path.join(root,next));
      files.push({path:next,bytes:info.size});
    }
  }
  return files;
}
const manifest=JSON.parse(await readFile(path.join(root,'architecture','components.json'),'utf8'));
const files=await walk();
const code=files.filter(f=>f.path.startsWith('src/'));
const isOwned=(file,component)=>component.codePaths.some(p=>file.path.startsWith(p));
const summary=manifest.components.map(c=>{
  const owned=files.filter(f=>isOwned(f,c));
  return {id:c.id,name:c.name,files:owned.length,bytes:owned.reduce((n,f)=>n+f.bytes,0),
    codePaths:c.codePaths,maturity:c.maturity};
});
const uncovered=code.filter(f=>!manifest.components.some(c=>isOwned(f,c))).map(f=>f.path);
const missing=manifest.components.flatMap(c=>c.codePaths.filter(p=>!files.some(f=>f.path.startsWith(p))).map(p=>c.id+': '+p));
const result={schemaVersion:1,source:manifest.source,totalFiles:files.length,studioSourceFiles:code.length,
  unitTestFiles:files.filter(f=>f.path.startsWith('test/')).length,
  components:summary,uncoveredSourceFiles:uncovered,missingComponentPaths:missing};
if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(result,null,2)+'\n');
else {
  for(const c of summary) process.stdout.write(c.id.padEnd(20)+' '+String(c.files).padStart(4)+' files '+String(c.bytes).padStart(9)+' bytes\n');
  process.stdout.write('Uncovered source files: '+uncovered.length+'; missing ownership paths: '+missing.length+'\n');
}
if (process.argv.includes('--check') && (uncovered.length || missing.length)) process.exitCode=1;
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
