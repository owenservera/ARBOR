# File: hq/lib/live-graph/wave1/lane-a-r2-discovery.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | hq/lib/live-graph/wave1/lane-a-r2-discovery.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6573 B |
| Lines | 85 |
| Hash | 344630e84b66 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DISCOVERY_SCHEMA | const | 11 | yes | export const DISCOVERY_SCHEMA = &#39;vivim.wave1.lane-a.r2-discovery/1&#39;; |
| hash | function | 12 | no | const hash = x =&gt; createHash(&#39;sha256&#39;).update(x).digest(&#39;hex&#39;); |
| CODE_EXT | const | 13 | no | const CODE_EXT = new Set([&#39;mjs&#39;,&#39;js&#39;,&#39;cjs&#39;,&#39;jsx&#39;,&#39;ts&#39;,&#39;tsx&#39;,&#39;mts&#39;,&#39;cts&#39;,&#39;rs&#39;,&#39;py&#39;,&#39;pyi&#39;,&#39;go&#39;,&#39;java&#39;,&#39;kt&#39;,&#39;kts&#39;,&#39;scala&#39;,&#39;cs&#39;,&#39;fs&#39;,&#39;vb&#39;,&#39;c&#39;,&#39;h&#39;,&#39;cc&#39;,&#39;cpp&#39;,&#39;cxx&#39;,&#39;hpp&#39;,&#39;hh&#39;,&#39;hxx&#39;,&#39;rb&#39;,&#39;php&#39;,&#39;swift&#39;,&#39;lua… |
| META_EXT | const | 14 | no | const META_EXT = new Set([&#39;md&#39;,&#39;mdx&#39;,&#39;markdown&#39;,&#39;txt&#39;,&#39;rst&#39;,&#39;json&#39;,&#39;jsonc&#39;,&#39;json5&#39;,&#39;yaml&#39;,&#39;yml&#39;,&#39;toml&#39;,&#39;ini&#39;,&#39;cfg&#39;,&#39;conf&#39;,&#39;properties&#39;,&#39;xml&#39;,&#39;html&#39;,&#39;htm&#39;,&#39;css&#39;,&#39;scss&#39;,&#39;sass&#39;,&#39;less&#39;,&#39;csv&#39;,&#39;tsv&#39;]); |
| GENERATED | const | 15 | no | const GENERATED = new Set([&#39;node_modules&#39;,&#39;dist&#39;,&#39;build&#39;,&#39;out&#39;,&#39;.next&#39;,&#39;.nuxt&#39;,&#39;.svelte-kit&#39;,&#39;.turbo&#39;,&#39;.parcel-cache&#39;,&#39;coverage&#39;,&#39;.hq&#39;,&#39;.hq-tool&#39;,&#39;__pycache__&#39;,&#39;target&#39;,&#39;vendor&#39;,&#39;third_party&#39;,&#39;.venv&#39;… |
| SECRET | const | 16 | no | const SECRET = /^(?:\\.env[^/]*\|[^/]*\\.env\|[^/]*\\.(?:pem\|p12\|keystore)\|cookies\|login data\|session\\.json\|storage-state\\.json\|release-profile\\.json)$/i; |
| VALID_SHA | const | 17 | no | const VALID_SHA = /^[a-f0-9]{40}$/i; |
| enc | function | 18 | no | const enc = v =&gt; JSON.stringify(v); |
| cmp | function | 19 | no | const cmp = (a,b) =&gt; a&lt;b?-1:a&gt;b?1:0; |
| git | function | 20 | no | function git(root, args) { return execFileSync(&#39;git&#39;, args, { cwd: root, timeout:20000, maxBuffer: 32*1024*1024, windowsHide:true }); } |
| linesZ | function | 21 | no | function linesZ(x) { return Buffer.from(x).toString(&#39;utf8&#39;).split(&#39;\\0&#39;).filter(Boolean); } |
| enclosed | function | 22 | no | function enclosed(base,file) { const d=relative(base,file);return d===&#39;&#39; \|\| (d!==&#39;..&#39; &amp;&amp; !d.startsWith(&#39;..&#39;+sep) &amp;&amp; !isAbsolute(d)); } |
| filterPath | function | 23 | no | function filterPath(path) { |
| ext | const | 29 | no | const ext=path.includes(&#39;.&#39;)?path.split(&#39;.&#39;).at(-1).toLowerCase():&#39;&#39;; |
| discoverPinnedRoot | function | 34 | yes | export function discoverPinnedRoot({rootId,rootPath,headSha,maxFileBytes=1_500_000,maxRecords=200_000}, deps={}) { |
| fs | const | 37 | no | const fs = {lstatSync,realpathSync,readFileSync,statSync,...deps.fs}; |
| runGit | const | 38 | no | const runGit = deps.git \|\| git; |
| root | const | 39 | no | const root = resolve(rootPath); |
| realRoot | const | 41 | no | const realRoot = fs.realpathSync(root); |
| top | const | 42 | no | const top=Buffer.from(runGit(root,[&#39;rev-parse&#39;,&#39;--show-toplevel&#39;])).toString(&#39;utf8&#39;).trim(); |
| initialHead | const | 44 | no | const initialHead=Buffer.from(runGit(root,[&#39;rev-parse&#39;,&#39;HEAD&#39;])).toString(&#39;utf8&#39;).trim(); |
| tracked | const | 47 | no | const tracked=linesZ(runGit(root,[&#39;ls-files&#39;,&#39;-z&#39;,&#39;--cached&#39;,&#39;--full-name&#39;])); |
| seen | const | 49 | no | const seen=new Set(), items=[]; |
| cls | variable | 52 | no | let cls=filterPath(path); |
| absolute | variable | 55 | no | let absolute=realRoot; |
| physical | const | 57 | no | const physical=fs.realpathSync(absolute); |
| stat | const | 59 | no | const stat=fs.statSync(physical); |
| bytes | const | 63 | no | const bytes=fs.readFileSync(physical); |
| finishHead | const | 72 | no | const finishHead=Buffer.from(runGit(root,[&#39;rev-parse&#39;,&#39;HEAD&#39;])).toString(&#39;utf8&#39;).trim(); |
| dirty | const | 73 | no | const dirty=Buffer.from(runGit(root,[&#39;status&#39;,&#39;--porcelain=v1&#39;,&#39;-z&#39;,&#39;--untracked-files=all&#39;])).length&gt;0; |
| counts | const | 75 | no | const counts={total:items.length,eligible:0,excluded:0,unsupported:0,unknown:0}; |
| report | const | 77 | no | const report={schema:DISCOVERY_SCHEMA,rootId,headSha,trackedOnly:true,sourceBytesHashVerified:counts.eligible,rootHeadCheckedBeforeAndAfter:true,counts,items}; |
| discoveryAsInventory | function | 82 | yes | export function discoveryAsInventory(report) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 6 | external |
| node:crypto | import | 7 | external |
| node:fs | import | 8 | external |
| node:path | import | 9 | external |
| ./lane-a-r2-audit.mjs | import | 10 | [hq/lib/live-graph/wave1/lane-a-r2-audit.mjs](./lane-a-r2-audit.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/test/live-graph-wave1-a-r2-discovery.test.mjs](../../../test/live-graph-wave1-a-r2-discovery.test.mjs.md) | ../lib/live-graph/wave1/lane-a-r2-discovery.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Opt-in read-only Git-pinned discovery for Lane A Round 2. |
| 3 | invariant | — | — | Does not change the Wave 1 Lane A scanner, indexer, or defaults. |
| 4 | invariant | — | — | Secret/unknown/oversized/untracked files are not accepted as eligible. |

## Excerpt

```javascript
/**
 * @hq:context Opt-in read-only Git-pinned discovery for Lane A Round 2.
 * @hq:invariant Does not change the Wave 1 Lane A scanner, indexer, or defaults.
 * @hq:invariant Secret/unknown/oversized/untracked files are not accepted as eligible.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, realpathSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, isAbsolute, sep } from 'node:path';
import { safeRelativePath, classifyRelativePath } from './lane-a-r2-audit.mjs';
export const DISCOVERY_SCHEMA = 'vivim.wave1.lane-a.r2-discovery/1';
const hash = x => createHash('sha256').update(x).digest('hex');
const CODE_EXT = new Set(['mjs','js','cjs','jsx','ts','tsx','mts','cts','rs','py','pyi','go','java','kt','kts','scala','cs','fs','vb','c','h','cc','cpp','cxx','hpp','hh','hxx','rb','php','swift','lua','sh','bash','zsh','ps1','psm1','sql','vue','svelte','graphql','gql','proto']);
const META_EXT = new Set(['md','mdx','markdown','txt','rst','json','jsonc','json5','yaml','yml','toml','ini','cfg','conf','properties','xml','html','htm','css','scss','sass','less','csv','tsv']);
const GENERATED = new Set(['node_modules','dist','build','out','.next','.nuxt','.svelte-kit','.turbo','.parcel-cache','coverage','.hq','.hq-tool','__pycache__','target','vendor','third_party','.venv','venv','generated','__generated__','.git']);
const SECRET = /^(?:\.env[^/]*|[^/]*\.env|[^/]*\.(?:pem|p12|keystore)|cookies|login data|session\.json|storage-state\.json|release-profile\.json)$/i;
const VALID_SHA = /^[a-f0-9]{40}$/i;
const enc = v => JSON.stringify(v);
const cmp = (a,b) => a<b?-1:a>b?1:0;
function git(root, args) { return execFileSync('git', args, { cwd: root, timeout:20000, maxBuffer: 32*1024*1024, windowsHide:true }); }
function linesZ(x) { return Buffer.from(x).toString('utf8').split('\0').filter(Boolean); }
function enclosed(base,file) { const d=relative(base,file);return d==='' || (d!=='..' && !d.startsWith('..'+sep) && !isAbsolute(d)); }
function filterPath(path) {
  if (!safeRelativePath(path)) return {decision:'excluded',reason:'unsafe-or-secret-path'};
  if (path.split('/').some(x=>GENERATED.has(x.toLowerCase()))) return {decision:'excluded',reason:'generated-or-vendor'};
  if (path.split('/').some(x=>SECRET.test(x))) return {decision:'excluded',reason:'secret-path'};
  if (classifyRelativePath(path)==='sensitive-name-review') return {decision:'unknown',reason:'sensitive-name-review'};
  if (/\.(?:min|bundle)\.(?:js|mjs|css)$|\.map$|\.lock$|^(?:package-lock\.json|bun\.lockb)$/i.test(path)) return {decision:'excluded',reason:'generated-or-lock'};
  const ext=path.includes('.')?path.split('.').at(-1).toLowerCase():'';
  if(!CODE_EXT.has(ext) && !META_EXT.has(ext)) return {decision:'unsupported',reason:'unknown-or-binary-extension'};
  return {decision:'eligible',reason:null};
}
/** Scans only git tracked files, requires a clean exact Git HEAD and bounded scan. */
export function discoverPinnedRoot({rootId,rootPath,headSha,maxFileBytes=1_500_000,maxRecords=200_000}, deps={}) {
  if(typeof rootId!=='string'||!rootId||typeof rootPath!=='string'||!isAbsolute(rootPath)||!VALID_SHA.test(headSha||''))throw Error('DISCOVERY_SCOPE_INVALID');
  if(!Number.isSafeInteger(maxFileBytes)||maxFileBytes<=0||!Number.isSafeInteger(maxRecords)||maxRecords<=0)throw Error('DISCOVERY_LIMIT_INVALID');
  const fs = {lstatSync,realpathSync,readFileSync,statSync,...deps.fs};
  const runGit = deps.git || git;
  const root = resolve(rootPath);
  if(fs.lstatSync(root).isSymbolicLink())throw Error('DISCOVERY_ROOT_SYMLINK');
  const realRoot = fs.realpathSync(root);
  const top=Buffer.from(runGit(root,['rev-parse','--show-toplevel'])).toString('utf8').trim();
  if(resolve(top)!==root)throw Error('DISCOVERY_NOT_GIT_TOP');
  const initialHead=Buffer.from(runGit(root,['rev-parse','HEAD'])).toString('utf8').trim();
  if(initialHead.toLowerCase()!==headSha.toLowerCase())throw Error('DISCOVERY_HEAD_STALE');
  if(Buffer.from(runGit(root,['status','--porcelain=v1','-z','--untracked-files=all'])).length)throw Error('DISCOVERY_DIRTY_ROOT');
  const tracked=linesZ(runGit(root,['ls-files','-z','--cached','--full-name']));
  if(tracked.length>maxRecords)throw Error('DISCOVERY_TOO_MANY_FILES');
  const seen=new Set(), items=[];
  for(const path of [...tracked].sort(cmp)) {
    if(seen.has(path))throw Error('DISCOVERY_DUPLICATE_PATH');seen.add(path);
    let cls=filterPath(path);
    if(cls.decision==='eligible') {
      try {
        let absolute=realRoot;
        for(const part of path.split('/')) {absolute=join(absolute,part);if(fs.lstatSync(absolute).isSymbolicLink())throw Error('symlink');}
        const physical=fs.realpathSync(absolute);
        if(!enclosed(realRoot,physical))throw Error('outside');
        const stat=fs.statSync(physical);
        if(!stat.isFile())throw Error('not-file');
        if(stat.size>maxFileBytes)cls={decision:'excluded',reason:'file-too-large'};
        else {
          const bytes=fs.readFileSync(physical);
          if(!Buffer.isBuffer(bytes)&&!(bytes instanceof Uint8Array))throw Error('not-bytes');
          if(Buffer.from(bytes).includes(0))cls={decision:'excluded',reason:'binary-nul'};
          else cls={decision:'eligible',reason:null,bytes:bytes.length,sha256:hash(bytes)};
        }
      }catch{cls={decision:'unknown',reason:'unverified-physical-source'};}
    }
    items.push({rootId,path,...cls});
  }
  const finishHead=Buffer.from(runGit(root,['rev-parse','HEAD'])).toString('utf8').trim();
  const dirty=Buffer.from(runGit(root,['status','--porcelain=v1','-z','--untracked-files=all'])).length>0;
  if(finishHead.toLowerCase()!==headSha.toLowerCase() || dirty)throw Error('DISCOVERY_CHANGED_DURING_SCAN');
  const counts={total:items.length,eligible:0,excluded:0,unsupported:0,unknown:0};
  for(const i of items)counts[i.decision]++;
  const report={schema:DISCOVERY_SCHEMA,rootId,headSha,trackedOnly:true,sourceBytesHashVerified:counts.eligible,rootHeadCheckedBeforeAndAfter:true,counts,items};
  report.digest=hash(enc(report));
  return report;
}
```

_First 80 of 86 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
