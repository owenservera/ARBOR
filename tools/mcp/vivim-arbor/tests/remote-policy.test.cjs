'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createPolicyReader}=require('../server/remote-policy.cjs');
const valid={enabled:true,issuer:'https://issuer.invalid',audience:'https://resource.invalid/mcp',subject:'owner',keyId:'key',publicKeyPem:'fixture-only'};
function fixture(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vivim-policy-'));try{fn(path.join(dir,'policy.json'),dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
test('absolute local path required',()=>{for(const p of [null,'','policy.json'])assert.throws(()=>createPolicyReader(p),/Absolute local policy path required/);});
test('fresh read reflects atomic replacement and removal without restart',()=>fixture((file,dir)=>{const read=createPolicyReader(file);assert.equal(read(),null);fs.writeFileSync(file,JSON.stringify(valid));assert.deepEqual(read(),valid);assert.ok(Object.isFrozen(read()));const next=path.join(dir,'next.json');fs.writeFileSync(next,JSON.stringify({...valid,subject:'replacement'}));fs.renameSync(next,file);assert.equal(read().subject,'replacement');fs.unlinkSync(file);assert.equal(read(),null);}));
test('invalid, disabled, oversized and unknown fields deny',()=>fixture(file=>{const read=createPolicyReader(file);for(const value of ['{','[]',JSON.stringify({...valid,enabled:false}),JSON.stringify({...valid,subject:''}),JSON.stringify({...valid,extra:1}),'x'.repeat(65537)]){fs.writeFileSync(file,value);assert.equal(read(),null);}}));
test('directory is not a policy file',()=>fixture((file,dir)=>{assert.equal(createPolicyReader(dir)(),null);}));
