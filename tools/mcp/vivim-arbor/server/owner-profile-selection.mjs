// Local installer-only projection. No MCP route, activation or grant renewal.
// The terminal is not an OS sandbox; never treat cwd selection as confinement.
import {win32 as p} from 'node:path';
import {lstatSync,realpathSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const fail=()=>{throw Error('OWNER_PROFILE_SELECTION_INVALID')};
const exact=(o,ks)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===ks.length&&ks.every(k=>Object.hasOwn(o,k));
const rootId=x=>typeof x==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(x);
const programId=x=>typeof x==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(x);
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const pathKey=x=>p.normalize(x).replace(/\\+$/,'').toLowerCase();
const overlap=(a,b)=>{a=pathKey(a);b=pathKey(b);return a===b||a.startsWith(b+'\\')||b.startsWith(a+'\\')};
function clean(s){
 if(typeof s!=='string'||s.length>1024||! /^[a-z]:\\(?:[^\\/:*?"<>|\x00-\x1f]+\\?)*$/i.test(s)||s.split('\\').slice(1).some(x=>x==='.'||x==='..'||/[. ]$/.test(x)))fail();
 return p.normalize(s);
}
function rejectProtected(path,protectedPaths){if(protectedPaths.some(x=>overlap(path,x)))fail();}
export function resolveOwnerSelection(selection,{baseRoots,basePrograms,protectedPaths,resolvePath,hashProgram}){
 if(!exact(selection,['schema','roots','programs','expiresInMinutes','allowInteractive','allowWrites'])||
 selection.schema!=='vivim.owner-workstation-selection/1'||!Array.isArray(selection.roots)||!Array.isArray(selection.programs)||
 !Number.isInteger(selection.expiresInMinutes)||selection.expiresInMinutes<15||selection.expiresInMinutes>480||
 typeof selection.allowInteractive!=='boolean'||typeof selection.allowWrites!=='boolean'||
 baseRoots.length+selection.roots.length>16||basePrograms.length+selection.programs.length>64||
 selection.roots.length+selection.programs.length===0)fail();
 const protectedCanonical=protectedPaths.map(clean);
 const roots=[...baseRoots],programs=[...basePrograms];
 const rootIds=new Set(roots.map(x=>x.id)),programIds=new Set(programs.map(x=>x.id.toLowerCase()));
 for(const r of selection.roots){
  if(!exact(r,['id','path'])||!rootId(r.id)||rootIds.has(r.id))fail();
  const path=clean(resolvePath(clean(r.path),'directory'));
  rejectProtected(path,protectedCanonical);
  if(roots.some(x=>overlap(path,x.path)))fail();
  rootIds.add(r.id);roots.push({id:r.id,path});
 }
 for(const v of selection.programs){
  if(!exact(v,['id','path','sha256'])||!programId(v.id)||programIds.has(v.id)||!sha(v.sha256))fail();
  const path=clean(resolvePath(clean(v.path),'file'));
  if(p.extname(path).toLowerCase()!=='.exe'||/\\Microsoft\\WindowsApps\\/i.test(path))fail();
  // A program may live inside an approved workspace; it may not live in
  // private authority, credential, or runtime directories.
  rejectProtected(path,protectedCanonical);
  if(programs.some(x=>pathKey(x.path)===pathKey(path)))fail();
  const sha256=hashProgram(path);if(!sha(sha256)||sha256!==v.sha256)fail();
  programIds.add(v.id);programs.push({id:v.id,path,sha256});
 }
 return {schema:'vivim.owner-workstation-selection-result/1',roots,programs,expiresInMinutes:selection.expiresInMinutes,allowInteractive:selection.allowInteractive,allowWrites:selection.allowWrites};
}
function existing(s,kind){
 const full=clean(s),root=p.parse(full).root;let current=root;
 for(const part of full.slice(root.length).split('\\').filter(Boolean)){
  current=p.join(current,part);const st=lstatSync(current);
  if(st.isSymbolicLink()||pathKey(realpathSync(current))!==pathKey(current))fail();
 }
 const st=lstatSync(full);
 if(kind==='directory'?!st.isDirectory():!st.isFile())fail();
 return realpathSync(full);
}
function readJson(s,max=65536){const st=lstatSync(s);if(!st.isFile()||st.isSymbolicLink()||st.size>max)fail();return JSON.parse(readFileSync(s,'utf8'));}
function hashProgram(s){const st=lstatSync(s);if(st.size<1||st.size>256*1024*1024)fail();return createHash('sha256').update(readFileSync(s)).digest('hex');}
export function readOwnerSelection(file,expectedSha){
 if(!sha(expectedSha))fail();
 const st=lstatSync(file);if(!st.isFile()||st.isSymbolicLink()||st.size<1||st.size>65536)fail();
 const bytes=readFileSync(file);
 if(bytes.length!==st.size||createHash('sha256').update(bytes).digest('hex')!==expectedSha)fail();
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
function main(){
 if(process.platform!=='win32'||process.argv.length!==5)fail();
 const selection=readOwnerSelection(process.argv[2],process.argv[4]),context=readJson(process.argv[3]);
 if(!exact(context,['baseRoots','basePrograms','protectedPaths'])||!Array.isArray(context.baseRoots)||!Array.isArray(context.basePrograms)||!Array.isArray(context.protectedPaths)||context.protectedPaths.length<2)fail();
 const result=resolveOwnerSelection(selection,{...context,resolvePath:existing,hashProgram});
 process.stdout.write(JSON.stringify(result)+'\n');
}
if(process.argv[1]&&p.resolve(process.argv[1])===p.resolve(fileURLToPath(import.meta.url)))main();
