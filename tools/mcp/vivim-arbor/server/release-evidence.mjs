// Local operator release evidence, not an authorization or deployment service.
// Bind the staged candidate to its exact completed build and current file hashes.
// A seal never creates/renews a grant, starts a Host, or authorizes promotion.
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,readdirSync,realpathSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const hash=b=>createHash('sha256').update(b).digest('hex');
const sha=(s,n=64)=>typeof s==='string'&&s.length===n&&/^[0-9a-f]+$/.test(s);
const deny=()=>{throw Error('WORKSTATION_RELEASE_EVIDENCE_INVALID')};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const ids=a=>Array.isArray(a)&&a.length>0&&a.length<=32&&a.every(x=>typeof x==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(x))&&new Set(a).size===a.length;
const sorted=a=>[...a].sort();
const helperNames={session:'vivim-workstation-session.exe',files:'vivim-workstation-files.exe',probe:'vivim-workstation-probe.exe'};
export function validateEvidence(manifest,receipt,grant,recipes,roots,now=Date.now()){
 if(manifest?.schema!=='vivim.workstation-runtime/1'||receipt?.schema!=='vivim.workstation-build-receipt/1'||
  !sha(manifest.sourceSha,40)||manifest.nativeBuildSha!==manifest.sourceSha||receipt.sourceSha!==manifest.sourceSha||
  receipt.nativeTests!=='passed'||receipt.hostTests!=='passed'||receipt.promotionPerformed!==false||
  !Number.isFinite(Date.parse(receipt.verifiedAt))||Date.parse(receipt.verifiedAt)>now||
  !sha(manifest.recipeConfigSha)||!sha(manifest.rootConfigSha))deny();
 for(const k of Object.keys(helperNames))
  if(!sha(manifest.helperSha256?.[k])||manifest.helperSha256[k]!==receipt.helpers?.[k])deny();
 if(grant?.schema!=='vivim.workstation-tunnel-grant/1'||!sha(grant.id,32)||grant.port!==43187||
  !Number.isSafeInteger(grant.expiresAt)||grant.expiresAt<=now||grant.expiresAt-now>86400000||
  grant.dataRoot!==manifest.dataRoot||grant.recipeConfigSha!==manifest.recipeConfigSha||grant.rootConfigSha!==manifest.rootConfigSha||
  !ids(grant.recipes)||!ids(grant.roots)||!ids(manifest.recipes)||!ids(manifest.roots)||
  !same(sorted(grant.recipes),sorted(manifest.recipes))||!same(sorted(grant.roots),sorted(manifest.roots))||
  typeof grant.allowWrites!=='boolean'||!Array.isArray(grant.interactiveRecipes)||
  new Set(grant.interactiveRecipes).size!==grant.interactiveRecipes.length)deny();
 if(recipes?.schema!=='vivim.workstation-recipes/1'||roots?.schema!=='vivim.workstation-roots/1'||
  !Array.isArray(recipes.recipes)||!Array.isArray(roots.roots)||
  !ids(recipes.recipes.map(x=>x?.id))||!ids(roots.roots.map(x=>x?.id))||
  !same(sorted(recipes.recipes.map(x=>x.id)),sorted(manifest.recipes))||
  !same(sorted(roots.roots.map(x=>x.id)),sorted(manifest.roots))||
  grant.interactiveRecipes.some(id=>!recipes.recipes.some(r=>r.id===id&&r.interactive===true)))deny();
 return {sourceSha:manifest.sourceSha,recipeCount:manifest.recipes.length,rootCount:manifest.roots.length};
}
function regular(file,limit){
 const st=lstatSync(file);
 if(st.isSymbolicLink()||!st.isFile()||st.size>limit)deny();
 const b=readFileSync(file);if(b.length!==st.size)deny();return b;
}
function json(file,limit=65536){const b=regular(file,limit);return {value:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b)),digest:hash(b)};}
function pinned(file,expected,limit){if(!sha(expected)||hash(regular(file,limit))!==expected)deny();}
function inside(root,p){const rel=path.relative(root,p);return rel!==''&&!path.isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+path.sep);}
// Every staged entry, including config and adapter, is covered; reject links,
// case collisions, non-regular entries and unbounded trees instead of skipping.
export function inventory(root){
 const base=realpathSync(root);if(lstatSync(root).isSymbolicLink())deny();
 const entries=[],seen=new Set();let total=0;
 function walk(dir,prefix,depth){
  if(depth>48)deny();
  for(const name of readdirSync(dir).sort()){
   if(!name||name==='.'||name==='..'||/[\\:\x00-\x1f]/.test(name))deny();
   const rel=prefix+name,fold=rel.toLowerCase(),file=path.join(dir,name);
   if(seen.has(fold)||seen.size>=100000)deny();seen.add(fold);
   const st=lstatSync(file);
   if(st.isSymbolicLink()||!inside(base,realpathSync(file)))deny();
   if(st.isDirectory()){entries.push({path:rel,kind:'directory'});walk(file,rel+'/',depth+1);}
   else if(st.isFile()){
    total+=st.size;if(total>2*1024*1024*1024)deny();
    const bytes=regular(file,128*1024*1024);
    entries.push({path:rel,kind:'file',bytes:bytes.length,sha256:hash(bytes)});
   }else deny();
  }
 }
 walk(base,'',0);return {entries,total};
}
export function inspectCandidate(releaseRoot,buildReceiptPath,now=Date.now()){
 const root=realpathSync(releaseRoot);if(lstatSync(releaseRoot).isSymbolicLink())deny();
 const manifest=json(path.join(root,'manifest.json')),receipt=json(buildReceiptPath);
 const grant=json(path.join(root,'profile','session-authority','grant.json'));
 const recipes=json(path.join(root,'config','recipes.json')),roots=json(path.join(root,'config','roots.json'));
 const m=manifest.value,g=grant.value;
 const info=validateEvidence(m,receipt.value,g,recipes.value,roots.value,now);
 if(recipes.digest!==m.recipeConfigSha||roots.digest!==m.rootConfigSha)deny();
 for(const [k,name]of Object.entries(helperNames))pinned(path.join(root,'bin',name),m.helperSha256[k],64*1024*1024);
 pinned(m.nodeExe,m.nodeSha256,256*1024*1024);
 pinned(path.join(root,'runtime','apps','vivim-host','server.mjs'),m.hostSha256,2*1024*1024);
 const auth=path.join(root,'runtime','apps','vivim-host','bootstrap','owner-auth.mjs');
 if(realpathSync(g.ownerAuthModule)!==realpathSync(auth))deny();pinned(auth,g.ownerAuthSha256,1024*1024);
 const tree=inventory(root);
 return {schema:'vivim.workstation-release-seal/1',...info,manifestSha256:manifest.digest,
  buildReceiptSha256:receipt.digest,grantSha256:grant.digest,treeSha256:hash(JSON.stringify(tree.entries)),
  entries:tree.entries.length,bytes:tree.total,promotionPerformed:false};
}
export function verifyCandidate(releaseRoot,buildReceiptPath,sealPath,now=Date.now()){
 const stored=json(sealPath).value,actual=inspectCandidate(releaseRoot,buildReceiptPath,now);
 if(!same(stored,actual))deny();return actual;
}
function main(){
 const [mode,release,receipt,seal]=process.argv.slice(2);
 if(!['seal','verify'].includes(mode)||!release||!receipt||!seal||process.argv.length!==6)deny();
 // Keep evidence outside the sealed candidate so it cannot hash itself.
 const root=realpathSync(release),target=path.resolve(seal);
 if(root===target||inside(root,target))deny();
 const result=mode==='seal'?inspectCandidate(release,receipt):verifyCandidate(release,receipt,seal);
 if(mode==='seal')writeFileSync(target,JSON.stringify(result)+'\n',{flag:'wx',mode:0o600});
 process.stdout.write(JSON.stringify(result)+'\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
