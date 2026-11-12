import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {sha256Hex,digestJson,utf8Length} from '../generative-ui/portable-digest.mjs';
import {createSurface} from '../generative-ui/catalog.mjs';
import {compileUiProposal} from '../generative-ui/compiler.mjs';
import {projectVisualIntent} from '../generative-ui/semantic-projection.mjs';
const expected=x=>createHash('sha256').update(x,'utf8').digest('hex');
test('browser SHA-256 equals Node for UTF-8 and block boundaries',()=>{
 for(const s of ['','abc','Hola 👋','😀'.repeat(100),'0123456789'.repeat(500)])
  assert.equal(sha256Hex(s),expected(s));
 assert.equal(sha256Hex('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('JSON digest and UTF-8 length',()=>{
 const x={name:'Personal ✨',values:[1,2,3]};
 assert.equal(digestJson(x),expected(JSON.stringify(x)));
 assert.equal(utf8Length('é'),2);
});
test('all shared GUI modules contain no Node-only browser imports or globals',()=>{
 for(const name of ['catalog','compiler','semantic-projection','renderer','bootstrap-adapters','portable-digest']){
  const s=readFileSync(new URL('../generative-ui/'+name+'.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(s,/\bfrom\s*['"]node:|\bBuffer\s*\.|\bprocess\s*\.|\brequire\s*\(/);
 }
});
test('UI preview retains exact SHA-256 digest and has no effect',()=>{
 const surface=createSurface(),proposal={
  schema:'vivim.ui-proposal/1',surfaceId:surface.surfaceId,baseRevision:0,
  operations:[{opId:'a',type:'insert',parentId:'root',component:{id:'item',type:'text',props:{value:'Hi'},children:[]}}],
  explanation:'Edit',assumptions:[],unknowns:[]};
 const out=compileUiProposal({proposal,surface});
 assert.equal(out.proposalDigest,expected(JSON.stringify(proposal)));
 assert.equal(out.previewDigest,expected(JSON.stringify(out.surface)));
 assert.equal(out.persisted,false);
});
test('visual intent SHA256 remains stable across Node and phone',()=>{
 const semantic={schema:'vivim.semantic-projection/1',surfaceId:'my-space',views:[{componentId:'root'}]};
 const result=projectVisualIntent({source:'tap',targetId:'root',intent:'select',semantic});
 const {source,meaningDigest,effects,authorization,parsedBy,...meaning}=result;
 assert.equal(meaningDigest,expected(JSON.stringify(meaning)));
});
