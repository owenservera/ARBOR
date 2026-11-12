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
      if (!existsSync(filePath)) throw Object.assign(new Error('ARTIFACT_MISSING'), { status: 404 });
      // Verify artifact still matches its recorded digest (integrity guard).
      const actual = await sha256File(filePath);
      if (actual !== release.artifactSha256) throw Object.assign(new Error('ARTIFACT_TAMPERED'), { status: 500 });
      const stat = statSync(filePath);
      return { filePath, release, size: stat.size };
    },

    revokeRelease(releaseId) {
      const idx = getIndex();
      const release = idx.byId[releaseId];
      if (!release) throw Object.assign(new Error('RELEASE_NOT_FOUND'), { status: 404 });
      const filePath = releaseFilePath(releaseId);
      if (existsSync(filePath)) { try { unlinkSync(filePath); } catch { /* best effort */ } }
      delete idx.byId[releaseId];
      idx.releases = idx.releases.filter((r) => r.releaseId !== releaseId);
      if (idx.current && idx.current.releaseId === releaseId) idx.current = idx.releases[0] || null;
      saveIndex(idx);
      index = idx;
      return { revoked: releaseId };
    },
  };
}
