import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {parseInstallerArgs} from '../build-gpui-installer.mjs';
test('installer requires explicit verified portable source and ISCC path',()=>{
  const root=path.resolve('/tmp/ISCC.exe');
  assert.throws(()=>parseInstallerArgs([]),/Expected/);
  assert.throws(()=>parseInstallerArgs(['--portable','x','--iscc','iscc.exe']),/explicit absolute/);
  const opts=parseInstallerArgs(['--portable','x','--iscc',root]);
  assert.ok(opts.portable.endsWith('x'));
  assert.equal(opts.iscc,root);
});
