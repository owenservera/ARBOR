import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createCodingContext} from '../control/workstation-coding-context.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
function setup(t){
 const root=mkdtempSync(join(tmpdir(),'vivim-coding-')),project=join(root,'project');
 mkdirSync(project);const file=join(project,'lib.rs'),text='//! @hq:context Actual source\nfn main() {}\n';writeFileSync(file,text);
 const sdk=process.env.VIVIM_TEST_PROTOCOL_EXE||join(root,'vivim-protocol.exe');
 if(!process.env.VIVIM_TEST_PROTOCOL_EXE)writeFileSync(sdk,'fixture binary');
 const config=join(root,'binding.json');
 const instructions=['Use the incumbent @hq grammar. Preserve actual implementation and verify changes.'];
 writeFileSync(config,JSON.stringify({schema:'vivim.coding-context-binding/1',sdkPath:sdk,sdkSha256:hash(readFileSync(sdk)),sdkSource:'612cd15a37e76f4ca0d870abe15b7bba44172d6d',projects:[{id:'product',root:project,instructions}]}));
 const env={VIVIM_META_VLANG_CONFIG:config,VIVIM_META_VLANG_CONFIG_SHA256:hash(readFileSync(config))};
 t.after(()=>rmSync(root,{recursive:true,force:true}));return {root,project,file,text,config,env,result:{text,digest:hash(text)},instructions};
}
test('exact scoped file context separates trusted local policy and source observations',t=>{
 const x=setup(t);const read=createCodingContext({env:x.env,compile:args=>({sourceDigest:args.digest,declarations:[{value:'Untrusted source text',assurance:'source-assertion'}]})});
 const c=read(x.project,'lib.rs',x.result);assert.equal(c.status,'compiled');assert.deepEqual(c.policy.instructions,x.instructions);
 assert.equal(c.sourceDigest,x.result.digest);assert.equal(c.semantic.declarations[0].assurance,'source-assertion');
 const foreign=join(x.root,'foreign.rs');writeFileSync(foreign,x.text);
 assert.equal(read(x.root,'foreign.rs',x.result),null);
 assert.equal(read(x.project,'lib.rs',{...x.result,digest:'a'.repeat(64)}).status,'binding_unavailable');
 writeFileSync(x.config,'{}');assert.equal(read(x.project,'lib.rs',x.result).status,'binding_unavailable');
});
test('native SDK compiles the exact already-read file', {skip:!process.env.VIVIM_TEST_PROTOCOL_EXE},t=>{
 const x=setup(t);const result=createCodingContext({env:x.env})(x.project,'lib.rs',x.result);
 assert.equal(result.status,'compiled',JSON.stringify(result));assert.equal(result.semantic.protocolGeneration,1);
 assert.equal(result.semantic.declarations[0].value,'Actual source');assert.equal(result.semantic.declarations[0].scope,'unbound');
 assert.equal(result.semantic.language.availableTags.length,18);
 assert.equal(result.semantic.language.definitions.find(d=>d.id==='annotation.context').revision,1);
 assert.equal(result.semantic.language.definitions.find(d=>d.id==='annotation.context').meaning,'Purpose and semantic orientation');
});
