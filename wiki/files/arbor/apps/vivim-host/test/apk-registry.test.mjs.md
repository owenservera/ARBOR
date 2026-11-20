# File: apps/vivim-host/test/apk-registry.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/apk-registry.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3505 B |
| Lines | 86 |
| Hash | d9d2446509e1 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| dummyBytes | const | 8 | no | const dummyBytes = Buffer.from(&#39;PK\\x03\\x04&#39; + Buffer.alloc(200)); |
| root | const | 11 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;apk07-registry-test-&#39;)); |
| dummyApk | const | 12 | no | const dummyApk = path.join(root, &#39;dummy.apk&#39;); |
| reg | const | 14 | no | const reg = createApkRegistry({ dataRoot: root }); |
| rel | const | 16 | no | const rel = reg.registerRelease({ releaseId: &#39;rel-test-1&#39;, applicationId: &#39;inc.vivim.app&#39;, versionCode: 2, versionName: &#39;1.0.1&#39;, |
| list | const | 40 | no | const list = reg.listReleases(); |
| cur | const | 45 | no | const cur = reg.getCurrent(); |
| info | const | 48 | no | const info = await reg.artifactStreamInfo(&#39;rel-test-1&#39;); |
| revoked | const | 56 | no | const revoked = reg.revokeRelease(&#39;rel-test-1&#39;); |
| root | const | 65 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;apk07-registry-empty-&#39;)); |
| reg2 | const | 67 | no | const reg2 = createApkRegistry({ dataRoot: root }); |
| root | const | 77 | no | const root = mkdtempSync(path.join(os.tmpdir(), &#39;apk07-registry-missing-&#39;)); |
| reg3 | const | 79 | no | const reg3 = createApkRegistry({ dataRoot: root }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../apk/registry.mjs | import | 6 | [apps/vivim-host/apk/registry.mjs](../apk/registry.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
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
```

_First 80 of 87 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
