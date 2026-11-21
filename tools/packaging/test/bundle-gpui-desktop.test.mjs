import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../bundle-gpui-desktop.mjs';

test('GPUI bundler demands explicit source and destination', () => {
  assert.throws(() => parseArgs(['--bundle','--out','release']),/Missing/);
  assert.throws(() => parseArgs(['--bundle','--out','release','--runtime','one','--runtime','two','--binary','native.exe']),/unique/);
  assert.throws(() => parseArgs(['--bundle','--runtime','one','--binary','native.exe']),/Missing/);
});
test('GPUI bundler does not imply MSI or Tauri packaging', () => {
  const args=parseArgs(['--bundle','--runtime','runtime','--binary','native.exe','--out','portable']);
  assert.equal(args.mode,'--bundle');
  assert.ok(args.output.endsWith('portable'));
  assert.ok(args.binary.endsWith('native.exe'));
  const verify=parseArgs(['--verify','--out','portable']);
  assert.equal(verify.mode,'--verify');
});
