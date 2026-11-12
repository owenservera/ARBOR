import test from 'node:test';
import assert from 'node:assert/strict';
import { projectHviInspector } from '../src/visual-runtime/knowledge/hvi-inspector.mjs';
const A='a'.repeat(64),B='b'.repeat(64),C='c'.repeat(64),D='d'.repeat(64),E='e'.repeat(64);
const sample=(n=3)=>{const ids=[A,B,C,D,E].slice(0,n),target=ids.at(-1);
const comparison={schema:'arbor.hvi.version-comparison/1',targetPinId:target,reproducibilityDigest:'f'.repeat(64),
sourcePins:ids.map((x,i)=>({pinId:x,repoIdentity:'synthetic/repo'+i,resolvedCommitSha:String(i+1).repeat(40),completeness:'complete'})),
sourceDeltas:ids.slice(0,-1).map((x,i)=>({id:'finding-'+i,originPinId:x,targetPinId:target,originPath:'src/a.mjs',targetPaths:['src/b.mjs'],state:'EXACT_RELOCATION',certainty:'source_verified',evidenceRefs:['fixture']})),
coverage:ids.slice(0,-1).map(x=>({sourcePinId:x,targetPinId:target,sourceCompleteness:'complete',targetCompleteness:'complete',totalCompared:1})),
limits:{truncated:false},errors:[]};
return {schema:'arbor.hvi.adapter.comparison-report/1',runtimeAccepted:false,status:'SOURCE_ONLY_UNVERIFIED',sourceComparisonDigest:'f'.repeat(64),originalComparison:comparison,report:{schema:'arbor.hvi.report/1',targetPinId:target}};
};
test('empty does not scan or show phantom results',()=>{let v=projectHviInspector();assert.equal(v.mode,'empty');assert.equal(v.actions.length,0);assert.equal(v.featureEnabled,false)});
test('denied and revoked suppress source metadata',()=>{for(const permission of ['denied','revoked']){let v=projectHviInspector({envelope:sample(),permission});assert.equal(v.mode,'denied');assert.equal(v.pins.length,0)}});
test('three synthetic revision matrix is read-only',()=>{let v=projectHviInspector({envelope:sample(),synthetic:true});assert.equal(v.pins.length,3);assert.equal(v.rows[0].sourceState,'EXACT_RELOCATION');assert.equal(v.rows[0].capabilityState,'UNKNOWN');assert.equal(v.runtimeVerified,false);assert.equal(v.featureEnabled,false)});
test('five synthetic repository matrix retains full selected pin count',()=>{let v=projectHviInspector({envelope:sample(5),synthetic:true});assert.equal(v.pins.length,5);assert.equal(v.coverage.length,4)});
test('incomplete scan stays partial and cannot assert capability absence',()=>{let x=sample();x.originalComparison.sourcePins[0].completeness='partial';let v=projectHviInspector({envelope:x});assert.equal(v.mode,'partial');assert.equal(v.rows[0].capabilityState,'UNKNOWN')});
test('forged runtime accepted and mismatched digest are rejected',()=>{let x=sample();x.runtimeAccepted=true;assert.throws(()=>projectHviInspector({envelope:x}),{code:'UNTRUSTED_REPORT'});let y=sample();y.sourceComparisonDigest='0'.repeat(64);assert.throws(()=>projectHviInspector({envelope:y}),{code:'UNTRUSTED_REPORT'})});
test('invalid selectors and bounds fail closed',()=>{let x=sample();assert.throws(()=>projectHviInspector({envelope:x,selectedPins:[A,A]}),{code:'INVALID_SELECTION'});assert.throws(()=>projectHviInspector({envelope:x,limit:201}),{code:'RESOURCE_LIMIT'})});
