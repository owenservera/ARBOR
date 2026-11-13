import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveUiTokenPackage,resolveUiTokenReference,TOKEN_PACKAGE_SCHEMA} from '../src/index.mjs';
const pkg=tokens=>({schema:TOKEN_PACKAGE_SCHEMA,tokens});
test('valid DTCG-style type and alias resolves to identical value',()=>{
  const input=pkg({colors:{base:{$type:'color',$value:'#AB12CD'},
    accent:{$type:'color',$value:'{colors.base}'}}});
  const x=resolveUiTokenPackage(input);
  assert.equal(x.outcome,'resolved');
  assert.equal(x.tokens['colors.base'].value,'#ab12cd');
  assert.equal(x.tokens['colors.accent'].value,'#ab12cd');
  assert.deepEqual(resolveUiTokenReference(x,'colors.base','color').outcome,'resolved');
});
test('aliases with cycles, wrong type and unknown ref fail closed',()=>{
  const cycle=pkg({a:{$type:'color',$value:'{b}'},b:{$type:'color',$value:'{a}'}});
  assert.equal(resolveUiTokenPackage(cycle).code,'ALIAS_CYCLE');
  const mismatch=pkg({a:{$type:'color',$value:'#000000'},b:{$type:'dimension',$value:'{a}'}});
  assert.equal(resolveUiTokenPackage(mismatch).code,'ALIAS_TYPE_MISMATCH');
  assert.equal(resolveUiTokenPackage(pkg({a:{$type:'color',$value:'{missing}'}})).code,'UNKNOWN_TOKEN_REFERENCE');
});
test('unsupported DTCG token types never infer type by inspection',()=>{
  assert.equal(resolveUiTokenPackage(pkg({size:{$value:{value:10,unit:'px'}}})).code,'UNKNOWN_TOKEN_TYPE');
  assert.equal(resolveUiTokenPackage(pkg({color:{$type:'string',$value:'#AABBCC'}})).code,'UNKNOWN_TOKEN_TYPE');
  assert.equal(resolveUiTokenPackage(pkg({foo:{$type:'color',$value:'url(https://bad)' }})).code,'INVALID_TOKEN_VALUE');
});
test('unknown root fields, getters, cycles and invalid token paths refuse',()=>{
  assert.equal(resolveUiTokenPackage({...pkg({}),code:'run()'}).code,'INVALID_TOKEN_PACKAGE');
  const evil=Object.defineProperty({},'token',{get(){throw new Error('getter');}});
  assert.equal(resolveUiTokenPackage(pkg(evil)).code,'INVALID_TOKEN_PACKAGE');
  const cyclic={};cyclic.foo=cyclic;
  assert.equal(resolveUiTokenPackage(pkg(cyclic)).code,'INVALID_TOKEN_PACKAGE');
  assert.equal(resolveUiTokenPackage(pkg({'__proto__':{$type:'color',$value:'#123456'}})).outcome,'resolved'); // JS literal changes prototype, no own token
});
test('resolved token refs do not install runtime values',()=>{
  const x=resolveUiTokenPackage(pkg({a:{$type:'color',$value:'#112233'}}));
  assert.equal(x.installed,false);
  assert.equal(resolveUiTokenReference(x,'a','dimension').code,'TOKEN_TYPE_MISMATCH');
  assert.equal(resolveUiTokenReference(x,'unknown','color').code,'TOKEN_UNKNOWN');
});
