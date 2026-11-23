import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyChangedPath,assessBranchContent} from './branch-content-risk.mjs';
const A='a'.repeat(40),B='b'.repeat(40);
const sample=(files,overrides={})=>({name:'work/test',tipSha:B,baseSha:A,ahead:2,
 comparison:{base_commit:{sha:A},ahead_by:2,files:files.map(filename=>({filename,status:'modified'})),too_large:false,...overrides}});
test('recognizes product-critical directories without interpreting contents',()=>{
 assert.equal(classifyChangedPath('studio/lib/actions.mjs'),'provider-studio');
 assert.equal(classifyChangedPath('apps/vivim-host/server.mjs'),'host-authority');
 assert.equal(classifyChangedPath('native/gpui-desktop/src/main.rs'),'native-desktop');
 assert.equal(classifyChangedPath('apps/mobile-relay/app.js'),'mobile-visual');
 assert.equal(classifyChangedPath('core/programmability/src/lib.rs'),'core-contracts');
});
test('dangerous or unknown file names do not receive a safe area',()=>{
 assert.equal(classifyChangedPath('../escape'),'unsafe-or-unknown');
 assert.equal(classifyChangedPath('C:\\secret'),'unsafe-or-unknown');
});
test('full compare produces manual review only, never branch effects',()=>{
 const x=assessBranchContent(sample(['native/gpui-desktop/src/main.rs','studio/lib/actions.mjs']));
 assert.equal(x.fileListComplete,true);assert.equal(x.disposition,'MANUAL_CONTENT_REVIEW_REQUIRED');
 assert.equal(x.canDelete,false);assert.equal(x.canMerge,false);
 assert.deepEqual(x.areas,['native-desktop','provider-studio']);
});
test('source pin mismatch is incomplete, and cannot be claimed safe',()=>{
 const x=assessBranchContent(sample(['docs/README.md'],{base_commit:{sha:B}}));
 assert.equal(x.fileListComplete,false);assert.equal(x.disposition,'INCOMPLETE_COMPARE_PRESERVE');
});
test('large compare or 300-file cap preserves unseen changes',()=>{
 const x=assessBranchContent(sample(['docs/README.md'],{too_large:true}));
 assert.equal(x.fileListComplete,false);assert.equal(x.canDelete,false);
});
test('ahead-only branch with empty visible diff still needs review',()=>{
 const x=assessBranchContent(sample([]));
 assert.equal(x.listedFiles,0);assert.equal(x.canDelete,false);
});
test('cannot classify a branch without positive unique commits',()=>{
 assert.throws(()=>assessBranchContent({...sample([]),ahead:0}),/NOT_PINNED_UNIQUE_BRANCH/);
});
