import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../server.mjs',import.meta.url),'utf8');
test('legacy PC device mutation endpoint is fail closed, not a competing grant authority',()=>{
 const a=source.indexOf('const deviceMatch = pathname.match(');
 const b=source.indexOf('// APK07 PC-side debug',a);
 assert.ok(a>=0&&b>a);
 const route=source.slice(a,b);
 assert.match(route,/CONTROL_ACTION_PLAN_REQUIRED/);
 assert.doesNotMatch(route,/enrollment\.(approveGrant|revokeGrant)\s*\(/);
 assert.match(route,/verifyOwnerToken/);
});
