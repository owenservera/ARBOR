import test from 'node:test';
import assert from 'node:assert/strict';
import {machinePath,machineTarget,machineBatchTarget,machineProgramSelector,resolveMachineProgram,resolveMachineCwd} from '../control/workstation-machine-path.mjs';
import {normalizeTerminalRequest} from '../control/workstation-terminal-request.mjs';
import {createTerminalPolicy} from '../control/workstation-terminal-policy.mjs';
import {createWorkstationFilePort,FILE_READ,FILES_READ,FILE_WRITE} from '../control/workstation-file-port.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
const scope={schema:'vivim.owner-machine-scope/1',expiresAt:Date.now()+600000,protectedPaths:['C:\\authority','C:\\private']};
const hash=b=>createHash('sha256').update(b).digest('hex');
test('absolute drive paths are normalized; device, UNC, traversal, ADS, reserved names rejected',()=>{
 assert.equal(machinePath('D:/work/a.txt'),'D:\\work\\a.txt');
 assert.equal(machineTarget('C:\\',scope).relative,'.');
 for(const p of ['C:foo','\\\\server\\share','\\\\?\\C:\\x','C:\\..\\x','C:\\a:stream','C:\\nul.txt','C:\\x.','C:\\x\\\\y'])assert.throws(()=>machinePath(p));
});
test('protected paths, batch traversal and expired authority refused',()=>{
 for(const p of ['C:\\authority','c:\\AUTHORITY\\grant.json','C:\\private\\x'])assert.throws(()=>machineTarget(p,scope));
 assert.throws(()=>machineBatchTarget('C:\\','authority/grant.json',scope));
 assert.throws(()=>machineBatchTarget('C:\\work','../private/x',scope));
 assert.throws(()=>machineTarget('D:\\work',{...scope,expiresAt:Date.now()-1}));
 assert.equal(machineTarget('C:\\ordinary\\a.txt',scope).relative,'ordinary/a.txt');
});
test('machine request shape is explicit and legacy still refuses absolute cwd',()=>{
 const r={program:'D:\\tools\\tool.exe',root_id:'machine',cwd:'C:\\work',args:['--version'],interactive:false,timeout_ms:1000};
 assert.deepEqual(normalizeTerminalRequest(r),r);
 assert.throws(()=>normalizeTerminalRequest({...r,root_id:'scratch'}));
 assert.throws(()=>normalizeTerminalRequest({...r,cwd:'../x'}));
 assert.equal(machineProgramSelector('tool.exe'),true);
 assert.equal(machineProgramSelector('C:\\tools\\tool.cmd'),false);
});
test('real Windows unregistered executable and non-workspace cwd are bound only with machine policy',{skip:process.platform!=='win32'},t=>{
 const base=realpathSync(mkdtempSync(path.join(tmpdir(),'vivim-machine-')));t.after(()=>rmSync(base,{recursive:true,force:true}));
 const outside=path.join(base,'outside'),registered=path.join(base,'registered'),secret=path.join(base,'secret');for(const p of [outside,registered,secret])mkdirSync(p);
 const exe=realpathSync(process.execPath),file=path.join(base,'policy.json'),s={...scope,expiresAt:Date.now()+600000,protectedPaths:[secret,path.join(base,'authority')]};
 const policy={schema:'vivim.workstation-terminal-policy/1',enabled:true,expiresAt:s.expiresAt,programs:[{id:'node',path:exe,sha256:hash(readFileSync(exe)),environment:['PATH']}],roots:[{id:'scratch',path:registered}],maxTimeoutMs:20000,allowInteractive:true};
 const env={};const save=()=>{const b=JSON.stringify(policy);writeFileSync(file,b);env.VIVIM_WORKSTATION_TERMINAL_POLICY=file;env.VIVIM_WORKSTATION_TERMINAL_POLICY_SHA256=hash(b)};
 save();const port=createTerminalPolicy({env});const r={program:exe,root_id:'machine',cwd:outside,args:['--version'],interactive:false,timeout_ms:1000};
 assert.throws(()=>port.bind(r),/NOT_GRANTED/);policy.machineScope=s;save();
 const x=port.bind(r);assert.equal(x.executable.path,exe);assert.equal(x.workspace,outside);assert.equal(x.executable.sha,hash(readFileSync(exe)));
 assert.throws(()=>port.bind({...r,cwd:secret}));assert.throws(()=>port.bind({...r,program:path.join(secret,'x.exe')}));
});
test('real native absolute-path read and write preview/apply with explicit root scope',{skip:process.platform!=='win32'||!process.env.VIVIM_WORKSTATION_FILES_EXE},t=>{
 const base=realpathSync(mkdtempSync(path.join(tmpdir(),'vivim-machine-files-')));t.after(()=>rmSync(base,{recursive:true,force:true}));
 const outside=path.join(base,'outside'),secret=path.join(base,'secret');mkdirSync(outside);mkdirSync(secret);
 const config=path.join(base,'roots.json'),exe=process.env.VIVIM_WORKSTATION_FILES_EXE,s={...scope,expiresAt:Date.now()+600000,protectedPaths:[secret,path.join(base,'authority')]};
 const data={schema:'vivim.workstation-roots/1',roots:[{id:'scratch',path:base}]};
 const env={VIVIM_WORKSTATION_FILES_EXE:exe,VIVIM_WORKSTATION_FILES_SHA256:hash(readFileSync(exe)),VIVIM_WORKSTATION_ROOTS:config};
 const save=()=>{const b=JSON.stringify(data);writeFileSync(config,b);env.VIVIM_WORKSTATION_ROOTS_SHA256=hash(b)};save();
 const port=createWorkstationFilePort({env}),target=path.join(outside,'test.txt'),a={root_id:'machine',path:target};
 writeFileSync(target,'fixture');assert.throws(()=>port.read(FILE_READ,a),/ROOT_NOT_GRANTED/);
 data.machineScope=s;save();const first=port.read(FILE_READ,a);assert.equal(first.text,'fixture');
 const w={...a,expected_digest:first.digest,content:'b64:'+Buffer.from('changed').toString('base64')};
 const plan=port.prepare(FILE_WRITE,w);port.mutate(FILE_WRITE,w,plan);assert.equal(port.read(FILE_READ,a).text,'changed');
 assert.throws(()=>port.read(FILE_READ,{root_id:'machine',path:path.join(secret,'hidden.txt')}));
 assert.throws(()=>port.read(FILES_READ,{root_id:'machine',path:base,paths_json:'["secret/hidden.txt"]'}));
});

test('standing owner scope does not relax protected path or expiry validation',()=>{
 const standing={...scope,expiresAt:null};
 assert.equal(machineTarget('D:\\work',standing,Date.now()+365*86400000).relative,'work');
 assert.throws(()=>machineTarget('C:\\authority\\grant.json',standing));
 for(const expiresAt of [undefined,0,'never',Date.now()+2*86400000])assert.throws(()=>machineTarget('D:\\work',{...scope,expiresAt}));
});
