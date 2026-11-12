import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {lintSelectedTree} from './w01-f-source-lint.mjs';
test('imported Wave 1F code has no credential-shaped filenames or donor relative imports',()=>{
 for(const p of ['../../contracts','../../capability-spaces','../fixtures/labs'])
   assert.deepEqual(lintSelectedTree(fileURLToPath(new URL(p,import.meta.url))),[]);
});
