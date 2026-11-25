import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync,symlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';import path from 'node:path';
import {validateEvidence,inspectCandidate,verifyCandidate,inventory,runtimeBindingDigest} from '../server/release-evidence.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex'),now=Date.parse('2026-11-25T10:00:00Z');
function fixture(t){
 const root=mkdtempSync(path.join(os.tmpdir(),'vivim-release-seal-')),release=path.join(root,'release');
 t.after(()=>rmSync(root,{recursive:true,force:true}));
 const put=(relative,value)=>{const file=path.join(release,relative);mkdirSync(path.dirname(file),{recursive:true});const bytes=typeof value==='string'?value:JSON.stringify(value);writeFileSync(file,bytes);return {file,digest:hash(bytes)}};
 const recipes={schema:'vivim.workstation-recipes/1',recipes:[{id:'node-version',interactive:false}]};
 const roots={schema:'vivim.workstation-roots/1',roots:[{id:'scratch',path:root}]};
 const r=put('config/recipes.json',recipes),d=put('config/roots.json',roots);
 const auth=put('runtime/apps/vivim-host/bootstrap/owner-auth.mjs','auth');
 const host=put('runtime/apps/vivim-host/server.mjs','host');
 const node=put('bin/test-node.exe','node');
 const helpers={session:put('bin/vivim-workstation-session.exe','session').digest,files:put('bin/vivim-workstation-files.exe','files').digest,probe:put('bin/vivim-workstation-probe.exe','probe').digest};
 const manifest={schema:'vivim.workstation-runtime/1',sourceSha:'a'.repeat(40),nativeBuildSha:'a'.repeat(40),dataRoot:root,recipes:['node-version'],roots:['scratch'],recipeConfigSha:r.digest,rootConfigSha:d.digest,helperSha256:helpers,nodeExe:node.file,nodeSha256:node.digest,hostSha256:host.digest};
 const receipt={schema:'vivim.workstation-build-receipt/1',sourceSha:manifest.sourceSha,nativeTests:'passed',hostTests:'passed',promotionPerformed:false,verifiedAt:new Date(now).toISOString(),helpers};
 const grant={schema:'vivim.workstation-tunnel-grant/1',id:'b'.repeat(32),port:43187,expiresAt:now+1000,dataRoot:root,recipeConfigSha:r.digest,rootConfigSha:d.digest,recipes:manifest.recipes,roots:manifest.roots,interactiveRecipes:[],allowWrites:false,ownerAuthModule:auth.file,ownerAuthSha256:auth.digest};
 put('manifest.json',manifest);put('profile/session-authority/grant.json',grant);
 const receiptPath=path.join(root,'build-receipt.json'),sealPath=path.join(root,'seal.json');
 writeFileSync(receiptPath,JSON.stringify(receipt));
 return {root,release,receiptPath,sealPath,manifest,receipt,grant,recipes,roots,put};
}
test('exact staged build seal and verification; no promotion or grant mutation',t=>{
 const f=fixture(t);const seal=inspectCandidate(f.release,f.receiptPath,now);
 assert.equal(seal.sourceSha,f.manifest.sourceSha);assert.equal(seal.promotionPerformed,false);
 writeFileSync(f.sealPath,JSON.stringify(seal));
 assert.deepEqual(verifyCandidate(f.release,f.receiptPath,f.sealPath,now),seal);
 f.put('runtime/apps/vivim-host/extra.mjs','new');
 assert.throws(()=>verifyCandidate(f.release,f.receiptPath,f.sealPath,now),/EVIDENCE_INVALID/);
});
test('reject stale/failed build, changed helper, expanded grant, expired grant',t=>{
 const f=fixture(t);const run=(receipt=f.receipt,grant=f.grant)=>validateEvidence(f.manifest,receipt,grant,f.recipes,f.roots,now);
 assert.throws(()=>run({...f.receipt,nativeTests:'failed'}));
 assert.throws(()=>run({...f.receipt,sourceSha:'c'.repeat(40)}));
 assert.throws(()=>run(f.receipt,{...f.grant,recipes:['node-version','unknown']}));
 assert.throws(()=>run(f.receipt,{...f.grant,expiresAt:now}));
 f.put('bin/vivim-workstation-files.exe','changed');
 assert.throws(()=>inspectCandidate(f.release,f.receiptPath,now));
});
test('inventory refuses junction/symlink escape and changed tree contents',t=>{
 const f=fixture(t);const before=inventory(f.release);f.put('config/extra','extra');
 assert.notDeepEqual(inventory(f.release),before);
 symlinkSync(f.root,path.join(f.release,'escape'),process.platform==='win32'?'junction':'dir');
 assert.throws(()=>inventory(f.release),/EVIDENCE_INVALID/);
});

test('runtime binding excludes only source provenance; data root, executable and unknown fields change digest',t=>{
 const f=fixture(t),m=f.manifest,d=runtimeBindingDigest(m);
 assert.equal(runtimeBindingDigest({...m,sourceSha:'c'.repeat(40),nativeBuildSha:'c'.repeat(40)}),d);
 assert.equal(runtimeBindingDigest(Object.fromEntries(Object.entries(m).reverse())),d);
 for(const changed of [{dataRoot:'other'},{nodeExe:'other'},{futureBinding:'other'}])assert.notEqual(runtimeBindingDigest({...m,...changed}),d);
 assert.equal(inspectCandidate(f.release,f.receiptPath,now).runtimeBindingSha256,d);
});

test('terminal seal binds exact policy, explicit grant, programs and workspace paths',t=>{
 const f=fixture(t);
 const prog=f.put('bin/terminal-node.exe','terminal-node');
 const policy={schema:'vivim.workstation-terminal-policy/1',enabled:true,expiresAt:f.grant.expiresAt,programs:[{id:'node',path:prog.file,sha256:prog.digest,environment:[]}],roots:f.roots.roots,maxTimeoutMs:1000,allowInteractive:true};
 const config=f.put('config/terminal-policy.json',policy);
 f.manifest.terminalConfigSha=config.digest;
 f.grant.terminal={configSha:config.digest,programs:['node'],roots:['scratch'],allowInteractive:true};
 f.put('manifest.json',f.manifest);f.put('profile/session-authority/grant.json',f.grant);
 const seal=inspectCandidate(f.release,f.receiptPath,now);
 assert.equal(seal.promotionPerformed,false);
 assert.notEqual(seal.runtimeBindingSha256,runtimeBindingDigest(Object.fromEntries(Object.entries(f.manifest).filter(([k])=>k!=='terminalConfigSha'))));
 f.grant.terminal.programs.push('foreign');f.put('profile/session-authority/grant.json',f.grant);
 assert.throws(()=>inspectCandidate(f.release,f.receiptPath,now));
});
