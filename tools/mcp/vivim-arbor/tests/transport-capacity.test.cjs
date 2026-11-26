'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
test('large exact text codec roundtrip and bounds',async()=>{
 const {decodeWorkstationText,encodeWorkstationText}=await import('../../../../apps/vivim-host/control/workstation-text-codec.mjs');
 const n=4*1024*1024,s='x'.repeat(n-4)+'🧪';
 assert.equal(decodeWorkstationText(encodeWorkstationText(s)),s);
 assert.throws(()=>decodeWorkstationText(encodeWorkstationText(s+'x')));
 assert.throws(()=>decodeWorkstationText('b64:eA='));
});
