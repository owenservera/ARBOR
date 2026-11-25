'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildRemoteManifest}=require('../server/remote-manifest.cjs');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
// Test fixture DNS names are not contacted or asserted provisioned.
test('remote-only portable manifest with official OAuth shape',()=>{
 const m=buildRemoteManifest('https://mcp.fixture-vivim.dev/mcp');
 assert.deepEqual(Object.keys(m.mcpServers),['vivim-arbor-remote']);
 const r=m.mcpServers['vivim-arbor-remote'];
 assert.deepEqual(r,{type:'streamable-http',url:'https://mcp.fixture-vivim.dev/mcp',extensions:{'com.openai':{auth:{type:'oauth',client:{mode:'cimd'}}}}});
 assert.ok(!JSON.stringify(m).includes('clientSecret'));
});
test('reject insecure, local, literal-IP, placeholder and non-MCP endpoints',()=>{
 for(const u of ['http://mcp.fixture-vivim.dev/mcp','https://localhost/mcp','https://x.local/mcp','https://x.internal/mcp','https://127.0.0.1/mcp','https://[::1]/mcp','https://example.com/mcp','https://sub.example.org/mcp','https://x.invalid/mcp','https://mcp.fixture-vivim.dev/','https://mcp.fixture-vivim.dev:8443/mcp','https://mcp.fixture-vivim.dev./mcp',null]) assert.throws(()=>buildRemoteManifest(u));
});
test('reject secrets or routing data in endpoint URL',()=>{
 for(const u of ['https://user:secret@mcp.fixture-vivim.dev/mcp','https://mcp.fixture-vivim.dev/mcp?token=secret','https://mcp.fixture-vivim.dev/mcp#secret']) assert.throws(()=>buildRemoteManifest(u));
});
test('CLI fails closed without printing partial manifest or supplied credential',()=>{
 const p=spawnSync(process.execPath,[path.join(__dirname,'../server/remote-manifest.cjs'),'https://user:secret@mcp.fixture-vivim.dev/mcp'],{encoding:'utf8'});
 assert.equal(p.status,1);assert.equal(p.stdout,'');assert.ok(!p.stderr.includes('user:secret'));
});
