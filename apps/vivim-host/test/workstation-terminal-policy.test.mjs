import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,realpathSync,readFileSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';import path from 'node:path';
import {createTerminalPolicy,validateTerminalPolicy} from '../control/workstation-terminal-policy.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const request={program:'node',args:['--version'],root_id:'scratch',cwd:'.',interactive:false,timeout_ms:1000};
function fixture(t){
 const base=mkdtempSync(path.join(os.tmpdir(),'vivim-terminal-policy-'));t.after(()=>rmSync(base,{recursive:true,force:true}));
 const root=path.join(base,'workspace');mkdirSync(root);mkdirSync(path.join(root,'sub'));
 const executable=realpathSync(process.execPath),file=path.join(base,'policy.json');
 let now=Date.now();const policy={schema:'vivim.workstation-terminal-policy/1',enabled:true,expiresAt:now+60000,programs:[{id:'node',path:executable,sha256:sha(readFileSync(executable)),environment:['PATH']}],roots:[{id:'scratch',path:root}],maxTimeoutMs:20000,allowInteractive:false};
 const env={};const save=()=>{const bytes=JSON.stringify(policy);writeFileSync(file,bytes,{mode:0o600});env.VIVIM_WORKSTATION_TERMINAL_POLICY=file;env.VIVIM_WORKSTATION_TERMINAL_POLICY_SHA256=sha(bytes);};save();
 return {base,root,file,executable,policy,save,port:createTerminalPolicy({env,now:()=>now}),advance:ms=>{now+=ms;}};
}
test('resolves real executable and exact requested workspace using a pinned policy',t=>{
 const f=fixture(t),r=f.port.bind({...request,cwd:'sub',args:['a b','','🧪']});
 assert.equal(r.executable.path,f.executable);assert.equal(r.workspace,realpathSync(path.join(f.root,'sub')));assert.deepEqual(r.request.args,['a b','','🧪']);assert.equal(r.configSha,f.port.current());
});
test('no legacy implicit authority, unknown programs, wrong roots, interactive or excessive timeout refused',t=>{
 const f=fixture(t);assert.throws(()=>createTerminalPolicy({env:{}}).bind(request),/TERMINAL_DISABLED/);
 for(const r of [{...request,program:'foreign'},{...request,root_id:'foreign'},{...request,interactive:true},{...request,timeout_ms:30000}])assert.throws(()=>f.port.bind(r),/NOT_GRANTED/);
 f.advance(59500);assert.throws(()=>f.port.bind(request),/NOT_GRANTED/);f.advance(500);assert.throws(()=>f.port.bind(request),/POLICY_INVALID/);
});
test('changed config or executable hash and malformed policy fail closed',t=>{
 const f=fixture(t);writeFileSync(f.file,'changed');assert.throws(()=>f.port.bind(request),/POLICY_INVALID/);
 f.policy.programs[0].sha256='0'.repeat(64);f.save();assert.throws(()=>f.port.bind(request),/POLICY_INVALID/);
 assert.throws(()=>validateTerminalPolicy({...f.policy,enabled:false},Date.now()));
 assert.throws(()=>validateTerminalPolicy({...f.policy,programs:[{...f.policy.programs[0],environment:['PATH','Path']}]},Date.now()));
});
test('real junction or symlink does not escape initial working directory',t=>{
 const f=fixture(t),outside=path.join(f.base,'outside');mkdirSync(outside);
 symlinkSync(outside,path.join(f.root,'link'),process.platform==='win32'?'junction':'dir');
 assert.throws(()=>f.port.bind({...request,cwd:'link'}),/CWD_INVALID/);
 assert.throws(()=>f.port.bind({...request,cwd:'../outside'}),/REQUEST_INVALID/);
});
