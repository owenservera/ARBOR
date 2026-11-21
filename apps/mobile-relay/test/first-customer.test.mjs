import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const from = name => readFileSync(new URL('../'+name,import.meta.url),'utf8');
const app=from('app.js'),html=from('index.html');
const kernel=readFileSync(new URL('../../../core/programmability/src/product_kernel.rs',import.meta.url),'utf8');
const bridge=readFileSync(new URL('../../../packages/vec-ui-engines/src/rust-wasm.mjs',import.meta.url),'utf8');

test('first-contact is Direct-only, opt-in, and uses existing paired Host composer',()=>{
  assert.match(app,/const FIRST_CONTACT = transport\.direct && !HOST_PREVIEW/);
  assert.match(app,/get\('first'\) === '1'/);
  assert.match(app,/mountUniversalDock\(\);\s*mountFirstWiki\(\);/);
  assert.match(app,/void vivimChat\.send\(body\)/);
  assert.match(app,/admitted\.executionAuthorized !== false/);
  assert.match(app,/admitted\.effectPerformed !== false/);
  assert.match(app,/rustFirstContact\(\{text:field\.value\}\)/);
  assert.match(html,/body\.first-contact\.paired #top/);
  assert.match(html,/#msgs > \.vivim-intro/);
  assert.match(html,/#msgs > section\.vivim-plan/);
  assert.match(html,/#chat-composer \.row > :not\(#text\):not\(#send\)/);
});
test('first-contact computation is implemented in canonical Rust product kernel',()=>{
  assert.match(kernel,/"first-contact"=>crate::first_contact::project\(input\)/);
  assert.match(bridge,/export function rustFirstContact\(input\)/);
  assert.match(bridge,/invoke\('first-contact',input\)/);
});
test('typing searches only an authorized, source-admitted Wiki with no effect or provider calls',()=>{
  assert.match(app,/function firstWikiScope\(\)/);
  assert.match(app,/S\.device\.scopes\?\.includes\('control:read'\)/);
  assert.match(app,/firstWikiAbort=new AbortController\(\)/);
  assert.match(app,/fetch\('\/mobile\/api\/wiki'/);
  assert.match(app,/verifyWikiSourceStamp\(wiki,/);
  assert.match(app,/admitted\.state!=='accepted'\|\|!admitted\.native/);
  assert.match(app,/rustWikiSearch\?\.\(source\.wiki,text\.slice\(0,160\)\)/);
  assert.match(app,/found\.results\.slice\(0,6\)/);
  assert.match(app,/window\.addEventListener\('vivim:paired',\(\)=>resetFirstWiki\(\)\)/);
  assert.match(app,/if\(document\.hidden\)resetFirstWiki\(\)/);
});
