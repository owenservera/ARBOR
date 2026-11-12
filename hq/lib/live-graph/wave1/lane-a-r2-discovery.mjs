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
/** Convert existing validated discovery to the inventory contract; retains reason. */
export function discoveryAsInventory(report) {
  if(report?.schema!==DISCOVERY_SCHEMA || !Array.isArray(report.items))throw Error('DISCOVERY_REPORT_INVALID');
  return report.items.map(({rootId,path,decision,reason})=>({rootId,path,decision,...(reason?{reason}:{} )}));
}
