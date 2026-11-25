'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), os=require('node:os'), path=require('node:path'), {spawnSync}=require('node:child_process');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'vivim-plugin-test-'));
const ops=path.join(root,'vivim-labs','ZCODE-DESKTOP-COMMANDER-OPERATIONS');
const lanes=path.join(ops,'FIVE-LANE-OPERATIONS-R001');
const wiki=path.join(root,'ARBOR','wiki');
for(const p of [lanes,wiki,path.join(root,'ARBOR','native','gpui-desktop')])fs.mkdirSync(p,{recursive:true});
fs.writeFileSync(path.join(ops,'TASK-CLAIMS.md'),'claim ledger fixture');
fs.writeFileSync(path.join(lanes,'LANE-BOARD.md'),'lane plan fixture');
fs.writeFileSync(path.join(wiki,'capabilities.md'),'wiki fixture');
const outside=fs.mkdtempSync(path.join(os.tmpdir(),'vivim-outside-'));
fs.writeFileSync(path.join(outside,'outside.md'),'must not escape');
if(process.platform==='win32')fs.symlinkSync(outside,path.join(wiki,'index.md'),'junction');
else fs.symlinkSync(path.join(outside,'outside.md'),path.join(wiki,'index.md'),'file');
const call=(name,args={})=>({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}});
function rpc(m){const r=spawnSync(process.execPath,[path.join(__dirname,'../server/operations.cjs')],{input:JSON.stringify(m)+'\n',encoding:'utf8',env:{...process.env,VIVIM_PROJECT_ROOT:root},timeout:10000});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout).result;}
function body(r){assert.notEqual(r.isError,true);return JSON.parse(r.content[0].text)}
test('initialize negotiates protocol and release',()=>{const r=rpc({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26'}});assert.equal(r.serverInfo.version,'0.4.0');assert.equal(r.protocolVersion,'2025-03-26')});
test('discovery preserves twelve and adds four, read only',()=>{const r=rpc({jsonrpc:'2.0',id:1,method:'tools/list'});assert.equal(r.tools.length,16);assert.equal(new Set(r.tools.map(x=>x.name)).size,16);assert.ok(r.tools.every(x=>x.annotations.readOnlyHint));});
test('claims source',()=>assert.equal(body(rpc(call('vivim_task_claims'))).content,'claim ledger fixture'));
test('lane planning source',()=>assert.equal(body(rpc(call('vivim_lane_plan',{document:'LANE-BOARD.md'}))).content,'lane plan fixture'));
test('wiki source',()=>assert.equal(body(rpc(call('vivim_wiki_source',{document:'capabilities.md'}))).content,'wiki fixture'));
test('private session Wiki rejected',()=>assert.equal(rpc(call('vivim_wiki_source',{document:'sessions.md'})).isError,true));
test('path traversal rejected',()=>assert.equal(rpc(call('vivim_lane_plan',{document:'../../secret'})).isError,true));
test('symlink or junction escape rejected',()=>{const r=rpc(call('vivim_wiki_source',{document:'index.md'}));assert.equal(r.isError,true);assert.match(r.content[0].text,/outside approved project scope/)});
test('native directory presence and missing state',()=>{const r=body(rpc(call('vivim_native_inventory')));assert.equal(r.components.find(x=>x.name==='gpui-desktop').present,true);assert.equal(r.components.find(x=>x.name==='hqkg').present,false)});
test('missing observer fails closed',()=>assert.equal(rpc(call('vivim_zcode_observe')).isError,true));
test('extra args rejected',()=>assert.equal(rpc(call('vivim_task_claims',{path:'other'})).isError,true));
test('capabilities differentiates live action from source',()=>{const r=body(rpc(call('vivim_capabilities')));assert.equal(r.version,'0.4.0');assert.ok(r.notImplemented.includes('remote HTTPS/tunnel'))});
process.on('exit',()=>{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(outside,{recursive:true,force:true})});

test('catalog distinguishes targets from active adapters',()=>{const r=body(rpc(call('vivim_ecosystem_catalog')));assert.equal(r.targets.length,13);assert.equal(r.targets.filter(x=>x.implementation!=='planned').length,1);assert.equal(r.targets.find(x=>x.id==='claude-web').kind,'web');assert.equal(r.targets.find(x=>x.id==='antigravity-cli').command,'agy')});
test('CLI discovery reports no execution or auth claims',()=>{const r=body(rpc(call('vivim_cli_inventory')));assert.equal(r.cli.length,6);assert.ok(r.cli.every(x=>x.health==='unverified'&&x.authenticated==='unknown'&&Number.isInteger(x.candidateCount)));assert.ok(r.cli.every(x=>!('path' in x)))});
test('inventory rejects arbitrary commands',()=>assert.equal(rpc(call('vivim_cli_inventory',{command:'unknown'})).isError,true));
