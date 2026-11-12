// Deterministic synthetic committed Git objects: no checkout, network or donor code.
import { gitBlobSha } from './common.mjs';
import { createGitObjectAdapter } from './adapters.mjs';

export const SYNTHETIC_SHAS = Object.freeze({
  v1: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  v2: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  v3: 'cccccccccccccccccccccccccccccccccccccccc',
});
export const SYNTHETIC_TREES = Object.freeze({
  v1: '1111111111111111111111111111111111111111',
  v2: '2222222222222222222222222222222222222222',
  v3: '3333333333333333333333333333333333333333',
});

export function syntheticSource({ flipped = false, malicious = null } = {}) {
  const bytes = new Map();
  const blob = (path, value, mode = '100644') => {
    const data = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8');
    const sha = gitBlobSha(data);
    bytes.set(sha, data);
    return { path, mode, sha, type: 'blob', size: data.length };
  };
  const link = blob('links/outside', '../../private', '120000');
  const lfs = blob('assets/big.dat',
    'version https://git-lfs.github.com/spec/v1\n'
    + 'oid sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n'
    + 'size 987654321\n');
  const secret = blob('.env.production', 'MUST_NOT_READ_SECRET');
  const binary = blob('assets/binary.bin', Buffer.from([0, 255, 13]));
  const shared = blob('src/shared.mjs', 'export const shared = 1;\n');
  const records = {
    [SYNTHETIC_SHAS.v1]: [
      blob('src/first.mjs', 'export const version = 1;\n'),
      shared, secret, link, lfs, binary,
    ],
    [SYNTHETIC_SHAS.v2]: [
      blob('src/first.mjs', 'export const version = 2;\n'),
      shared, blob('src/new.mjs', 'export const newThing = true;\n'),
      { path: 'vendor/submodule', type: 'commit', mode: '160000',
        sha: 'dddddddddddddddddddddddddddddddddddddddd', size: null },
    ],
    [SYNTHETIC_SHAS.v3]: [
      blob('src/moved.mjs', 'export const version = 2;\n'),
      shared, blob('src/new.mjs', 'export const newThing = true;\n'),
    ],
  };
  const refTable = new Map([
    ['main', SYNTHETIC_SHAS.v1],
    ['v1', SYNTHETIC_SHAS.v1],
    ['v2', SYNTHETIC_SHAS.v2],
    ['v3', SYNTHETIC_SHAS.v3],
  ]);
  const commits = new Map([
    [SYNTHETIC_SHAS.v1, SYNTHETIC_TREES.v1],
    [SYNTHETIC_SHAS.v2, SYNTHETIC_TREES.v2],
    [SYNTHETIC_SHAS.v3, SYNTHETIC_TREES.v3],
  ]);
  const calls = { blobs: [], tree: [], refs: [] };
  const adapter = createGitObjectAdapter({
    resolveRef: ({ ref }) => {
      calls.refs.push(ref);
      const commitSha = refTable.get(ref);
      return commitSha ? { commitSha } : null;
    },
    readCommit: ({ commitSha }) => {
      const treeSha = commits.get(commitSha);
      return treeSha ? { sha: commitSha, treeSha } : null;
    },
    listTree: ({ commitSha, cursor, pageSize }) => {
      calls.tree.push({ commitSha, cursor });
      if (!records[commitSha]) throw new Error('missing');
      const items = flipped ? [...records[commitSha]].reverse() : records[commitSha];
      const list = malicious ? [...items, malicious] : items;
      const start = cursor ? Number(cursor) : 0;
      const page = list.slice(start, start + pageSize);
      const next = start + pageSize < list.length ? String(start + pageSize) : null;
      return { verified: true, entries: page, nextCursor: next };
    },
    readBlob: ({ blobSha }) => {
      calls.blobs.push(blobSha);
      if (!bytes.has(blobSha)) throw new Error('not found');
      return bytes.get(blobSha);
    },
  });
  return {
    adapter, calls, records, bytes, refTable, commits,
    authorize: () => true,
    scope: { repo: 'owenservera/ARBOR', provider: 'github',
      approvedScope: 'development', ref: 'main' },
  };
}
