# File: apps/vivim-host/apk/registry.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/apk/registry.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5152 B |
| Lines | 103 |
| Hash | 633df68cab5e |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ARTIFACT_DIR_NAME | const | 10 | no | const ARTIFACT_DIR_NAME = &#39;apk-artifacts&#39;; |
| INDEX_FILE | const | 11 | no | const INDEX_FILE = &#39;releases.json&#39;; |
| MAX_ARTIFACT_BYTES | const | 12 | no | const MAX_ARTIFACT_BYTES = 200 * 1024 * 1024; // 200 MB cap |
| sha256File | function | 14 | no | const sha256File = async (filePath) =&gt; { |
| data | const | 15 | no | const data = await readFile(filePath); |
| createApkRegistry | function | 19 | yes | export function createApkRegistry({ dataRoot }) { |
| dir | const | 20 | no | const dir = path.join(dataRoot, ARTIFACT_DIR_NAME); |
| indexPath | const | 21 | no | const indexPath = path.join(dir, INDEX_FILE); |
| index | variable | 22 | no | let index = null; |
| ensureDir | function | 24 | no | const ensureDir = () =&gt; { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); }; |
| loadIndex | function | 25 | no | const loadIndex = () =&gt; { |
| parsed | const | 29 | no | const parsed = JSON.parse(readFileSync(indexPath, &#39;utf8&#39;)); |
| saveIndex | function | 37 | no | const saveIndex = (idx) =&gt; { |
| getIndex | function | 41 | no | const getIndex = () =&gt; { if (!index) index = loadIndex(); return index; }; |
| releaseFilePath | function | 43 | no | const releaseFilePath = (releaseId) =&gt; path.join(dir, `${releaseId}.apk`); |
| stat | const | 53 | no | const stat = statSync(artifactPath); |
| sha | const | 55 | no | const sha = createHash(&#39;sha256&#39;).update(readFileSync(artifactPath)).digest(&#39;hex&#39;); |
| idx | const | 56 | no | const idx = getIndex(); |
| dest | const | 58 | no | const dest = releaseFilePath(releaseId); |
| release | const | 60 | no | const release = { |
| release | const | 78 | no | const release = this.getRelease(releaseId); |
| filePath | const | 80 | no | const filePath = releaseFilePath(releaseId); |
| actual | const | 83 | no | const actual = await sha256File(filePath); |
| stat | const | 85 | no | const stat = statSync(filePath); |
| idx | const | 90 | no | const idx = getIndex(); |
| release | const | 91 | no | const release = idx.byId[releaseId]; |
| filePath | const | 93 | no | const filePath = releaseFilePath(releaseId); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 5 | external |
| node:fs | import | 6 | external |
| node:fs/promises | import | 7 | external |
| node:path | import | 8 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/direct-phone.mjs](../direct-phone.mjs.md) | ./apk/registry.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./apk/registry.mjs |
| [apps/vivim-host/test/apk-registry.test.mjs](../test/apk-registry.test.mjs.md) | ../apk/registry.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// APK07 release artifact registry.
// Immutable, content-addressed APK artifacts served only through the authenticated
// Direct phone handler. Never serves arbitrary filesystem paths: releaseId -> file
// mapping is allowlisted at registration time and verified by SHA-256 on every read.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, copyFileSync, statSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ARTIFACT_DIR_NAME = 'apk-artifacts';
const INDEX_FILE = 'releases.json';
const MAX_ARTIFACT_BYTES = 200 * 1024 * 1024; // 200 MB cap

const sha256File = async (filePath) => {
  const data = await readFile(filePath);
  return createHash('sha256').update(data).digest('hex');
};

export function createApkRegistry({ dataRoot }) {
  const dir = path.join(dataRoot, ARTIFACT_DIR_NAME);
  const indexPath = path.join(dir, INDEX_FILE);
  let index = null;

  const ensureDir = () => { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); };
  const loadIndex = () => {
    ensureDir();
    if (!existsSync(indexPath)) return { releases: [], byId: {}, current: null };
    try {
      const parsed = JSON.parse(readFileSync(indexPath, 'utf8'));
      return {
        releases: Array.isArray(parsed.releases) ? parsed.releases : [],
        byId: parsed.byId || {},
        current: parsed.current || null,
      };
    } catch { return { releases: [], byId: {}, current: null }; }
  };
  const saveIndex = (idx) => {
    ensureDir();
    writeFile(indexPath, JSON.stringify(idx, null, 2));
  };
  const getIndex = () => { if (!index) index = loadIndex(); return index; };

  const releaseFilePath = (releaseId) => path.join(dir, `${releaseId}.apk`);

  return {
    // Register a built+signed APK. Caller supplies a precomputed releaseId and the
    // signer certificate fingerprint. The artifact is copied into the registry and
    // bound to its SHA-256; registration rejects mismatched hashes.
    registerRelease({ releaseId, applicationId, versionCode, versionName, channel,
      certSha256, artifactPath, fileName }) {
      if (!releaseId || !/^[a-z0-9_-]{3,64}$/.test(releaseId)) throw Object.assign(new Error('INVALID_RELEASE_ID'), { status: 400 });
      if (!artifactPath || !existsSync(artifactPath)) throw Object.assign(new Error('ARTIFACT_NOT_FOUND'), { status: 404 });
      const stat = statSync(artifactPath);
      if (!stat.isFile() || stat.size > MAX_ARTIFACT_BYTES) throw Object.assign(new Error('ARTIFACT_INVALID'), { status: 400 });
      const sha = createHash('sha256').update(readFileSync(artifactPath)).digest('hex');
      const idx = getIndex();
      if (idx.byId[releaseId]) throw Object.assign(new Error('RELEASE_ID_EXISTS'), { status: 409 });
      const dest = releaseFilePath(releaseId);
      copyFileSync(artifactPath, dest);
      const release = {
        releaseId, channel: channel || 'personal', applicationId, versionCode: Number(versionCode) || 1,
        versionName: versionName || '1.0.0', certSha256, fileName: fileName || `${releaseId}.apk`,
        artifactSha256: sha, bytes: stat.size, createdAt: new Date().toISOString(),
      };
      idx.releases.push(release);
      idx.byId[releaseId] = release;
      if (!idx.current || release.versionCode >= (idx.current.versionCode || 0)) idx.current = release;
      saveIndex(idx);
      index = idx;
      return { ...release, registered: true };
    },

    listReleases() { return [...getIndex().releases].sort((a, b) => b.versionCode - a.versionCode); },
    getRelease(releaseId) { return getIndex().byId[releaseId] || null; },
    getCurrent() { return getIndex().current || null; },

    async artifactStreamInfo(releaseId) {
      const release = this.getRelease(releaseId);
      if (!release) throw Object.assign(new Error('RELEASE_NOT_FOUND'), { status: 404 });
      const filePath = releaseFilePath(releaseId);
```

_First 80 of 104 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
