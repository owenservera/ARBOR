import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('phone Control is an actual reachable tab with a panel',()=>{
 assert.match(html,/data-tab="control"/);
 assert.match(html,/id="v-control"/);
 assert.match(html,/id="control-text"/);
 assert.match(html,/src="control-phone\.mjs"/);
 assert.match(app,/\$\('v-control'\)\.hidden\s*=\s*S\.tab\s*!==\s*'control'/);
 assert.match(app,/\$\('v-soon'\)\.hidden\s*=\s*\[[^\]]*'control'[^\]]*\]\.includes\(S\.tab\)/);
});
