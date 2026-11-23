// R07 source-only package integrity verification. Synthetic files, no builds,
// provider calls, live Host, signing or production staging.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
 STAGED_DIRS,STAGED_TOP_FILES,PACKAGED_BINARIES,RUNTIME_MANIFEST_NAME,
 writeFrozenManifest,verifyStagedRuntime
} from '../prepare-host-runtime.mjs';

function stagedFixture(t) {
 const base=mkdtempSync(path.join(os.tmpdir(),'vivim-r07-frozen-'));
 t.after(()=>rmSync(base,{recursive:true,force:true}));
 const put=(name,contents='placeholder\n')=>{
  const p=path.join(base,...name.split('/'));
  mkdirSync(path.dirname(p),{recursive:true});
  writeFileSync(p,contents);
 };
 for(const dir of STAGED_DIRS)mkdirSync(path.join(base,...dir.split('/')),{recursive:true});
 for(const file of STAGED_TOP_FILES)put(file);
 put('apps/vivim-host/server.mjs','export const runtime = true;\n');
 put('node.exe','synthetic-node\n');
 for(const binary of PACKAGED_BINARIES)put('native/bin/'+binary+'.exe','synthetic-'+binary+'\n');
 const manifest=writeFrozenManifest(base);
 const manifestPath=path.join(base,RUNTIME_MANIFEST_NAME);
 return {base,manifest,manifestPath};
}
const strict=(f)=>verifyStagedRuntime(f.base,{manifest:f.manifest,requireManifest:true});

test('R07: complete frozen runtime plus its own regular manifest can pass',t=>{
 const f=stagedFixture(t);
 const result=strict(f);
 assert.deepEqual(result.problems,[]);
 assert.equal(result.ok,true);
 assert.ok(result.checks.manifestFilesVerified>PACKAGED_BINARIES.length);
});

test('R07: supplied evidence for another manifest cannot be substituted',t=>{
 const f=stagedFixture(t);
 const fake=structuredClone(f.manifest);
 fake.files[0].sha256='f'.repeat(64);
 const result=verifyStagedRuntime(f.base,{manifest:fake,requireManifest:true});
 assert.equal(result.ok,false);
 assert.ok(result.problems.includes('installed runtime manifest does not match supplied manifest evidence'));
});

test('R07: corrupted on-disk manifest is a failure, not an exception or PASS',t=>{
 const f=stagedFixture(t);
 writeFileSync(f.manifestPath,'{not-valid-json');
 const result=strict(f);
 assert.equal(result.ok,false);
 assert.ok(result.problems.includes('invalid installed runtime manifest JSON'));
});

test('R07: a directory cannot impersonate the installed manifest',t=>{
 const f=stagedFixture(t);
 rmSync(f.manifestPath);
 mkdirSync(f.manifestPath);
 const result=strict(f);
 assert.equal(result.ok,false);
 assert.ok(result.problems.includes('installed runtime manifest is not a regular standalone file'));
});

test('R07: missing manifest never passes requireManifest',t=>{
 const f=stagedFixture(t);
 rmSync(f.manifestPath);
 const result=strict(f);
 assert.equal(result.ok,false);
 assert.ok(result.problems.includes('missing installed runtime.manifest.json'));
});

test('R07: manifest symlink cannot refer outside staged runtime',t=>{
 const f=stagedFixture(t);
 const outside=path.join(os.tmpdir(),'vivim-r07-outside-'+path.basename(f.base)+'.json');
 writeFileSync(outside,readFileSync(f.manifestPath));
 t.after(()=>rmSync(outside,{force:true}));
 rmSync(f.manifestPath);
 try {symlinkSync(outside,f.manifestPath,'file');}
 catch(error) {
  if(['EPERM','EACCES','ENOTSUP'].includes(error.code)){t.skip('host lacks permission to create file symlink');return;}
  throw error;
 }
 const result=strict(f);
 assert.equal(result.ok,false);
 assert.ok(result.problems.includes('installed runtime manifest is not a regular standalone file'));
});
