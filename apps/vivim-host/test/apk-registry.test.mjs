import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApkRegistry } from '../apk/registry.mjs';

const dummyBytes = Buffer.from('PK\x03\x04' + Buffer.alloc(200));

test('apk registry register + list + current + download info + revoke', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'apk07-registry-test-'));
  const dummyApk = path.join(root, 'dummy.apk');
  writeFileSync(dummyApk, dummyBytes);
  const reg = createApkRegistry({ dataRoot: root });

  const rel = reg.registerRelease({
    releaseId: 'rel-test-1',
    applicationId: 'inc.vivim.app',
    versionCode: 2,
    versionName: '1.0.1',
    channel: 'personal',
    certSha256: ('aa' + 'bb'.repeat(31)),
    artifactPath: dummyApk,
    fileName: 'vivim-release.apk'
  });
  assert.equal(rel.registered, true);
  assert.equal(rel.releaseId, 'rel-test-1');
  assert.equal(rel.versionCode, 2);
  assert.equal(rel.versionName, '1.0.1');
  assert.equal(rel.bytes, dummyBytes.length);
  assert.equal(rel.artifactSha256.length, 64);

  // Duplicate id rejected.
  assert.throws(() => reg.registerRelease({
    releaseId: 'rel-test-1', applicationId: 'inc.vivim.app', versionCode: 3,
    versionName: '1.0.2', channel: 'personal', certSha256: ('cc'.repeat(32)),
    artifactPath: dummyApk, fileName: 'vivim-release.apk'
  }), /RELEASE_ID_EXISTS/);

  const list = reg.listReleases();
  assert.equal(list.length, 1);
  assert.equal(list[0].releaseId, 'rel-test-1');
  assert.equal(list[0].versionCode, 2);

  const cur = reg.getCurrent();
  assert.equal(cur.releaseId, 'rel-test-1');

  const info = await reg.artifactStreamInfo('rel-test-1');
  assert.equal(info.release.applicationId, 'inc.vivim.app');
  assert.equal(info.size, dummyBytes.length);

  // Tamper detection.
  appendFileSync(info.filePath, 'tamper');
  await assert.rejects(() => reg.artifactStreamInfo('rel-test-1'), /ARTIFACT_TAMPERED/);

  const revoked = reg.revokeRelease('rel-test-1');
  assert.equal(revoked.revoked, 'rel-test-1');
  assert.equal(reg.getRelease('rel-test-1'), null);
  assert.equal(reg.getCurrent(), null);

  rmSync(root, { recursive: true, force: true });
});

test('apk registry empty state', t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'apk07-registry-empty-'));
  try {
    const reg2 = createApkRegistry({ dataRoot: root });
    assert.equal(reg2.listReleases().length, 0);
    assert.equal(reg2.getCurrent(), null);
    assert.equal(reg2.getRelease('nope'), null);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('apk registry tampered-at-registration mismatch rejected', t => {
  // registerRelease computes sha256 from actual file; mismatch not applicable (it records actual).
  // Instead verify missing artifact throws.
  const root = mkdtempSync(path.join(os.tmpdir(), 'apk07-registry-missing-'));
  try {
    const reg3 = createApkRegistry({ dataRoot: root });
    assert.throws(() => reg3.registerRelease({
      releaseId: 'rel-missing', applicationId: 'inc.vivim.app', versionCode: 1,
      versionName: '1.0.0', channel: 'personal', certSha256: 'dd'.repeat(32),
      artifactPath: path.join(root, 'does-not-exist.apk'), fileName: 'x.apk'
    }), /ARTIFACT_NOT_FOUND/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
