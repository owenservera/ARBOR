import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTerminalRequest} from '../control/workstation-terminal-request.mjs';
const base={program:'cargo',args:['test','--offline'],root_id:'arbor',cwd:'.',interactive:false,timeout_ms:300000};
test('preserves exact argv including whitespace, empty strings and Unicode',()=>{
 const request={...base,program:'node.exe',args:['C:\\Program Files\\ZCode\\resources\\glm\\zcode.cjs','-p','hello 🧪','','a;b'],cwd:'tools/mcp/vivim-arbor'};
 const result=normalizeTerminalRequest(request);assert.deepEqual(result,request);assert.notEqual(result.args,request.args);
});
test('rejects malformed scope, executable selector and request extensions',()=>{
 for(const r of [{...base,extra:1},{...base,program:'../node'},{...base,root_id:'../x'},{...base,cwd:'../secret'},{...base,cwd:'C:/Windows'},{...base,cwd:'x\\y'},{...base,cwd:'x//y'},{...base,cwd:'x. '},{...base,environment:{}}])assert.throws(()=>normalizeTerminalRequest(r),/WORKSTATION_TERMINAL_REQUEST_INVALID/);
});
test('rejects invalid argv, input controls and timeout',()=>{
 for(const r of [{...base,args:['bad\0']},{...base,args:['\ud800']},{...base,args:Array(65).fill('a')},{...base,args:Array(9).fill('x'.repeat(4096))},{...base,timeout_ms:0},{...base,interactive:'yes'}])assert.throws(()=>normalizeTerminalRequest(r),/WORKSTATION_TERMINAL_REQUEST_INVALID/);
});
