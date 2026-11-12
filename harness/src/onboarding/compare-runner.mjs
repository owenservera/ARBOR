import { mkdir, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { getProvider } from '../providers/index.mjs';

// Comparison runner: one fresh-thread send per provider, each consuming an owner-issued onboarding grant.
// Never resends: an uncertain, pending, or errored request is recorded and the run moves on.
// Never approves: the router's approval path belongs to the approver the caller injected into the router.
// Privacy: reply text goes only to saveDir/<requestId>.reply.txt; results.json holds metadata only.

const ID = /^[A-Za-z0-9_-]{1,128}$/;
const coded = (code, message) => Object.assign(new Error(message), { code });
const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
const iso = ms => new Date(ms).toISOString();
const defaultIdFor = () => `cmp-${randomUUID()}`;

// Refuses save locations that could sit in a repository or a tracked docs/catalog tree.
// Fail-closed: any '.git', 'catalog' or 'docs' path segment refuses, and so does any directory with a .git entry above it.
export function assertSaveDirAllowed(saveDir) {
  if (typeof saveDir !== 'string' || !saveDir.trim()) throw coded('SAVE_DIR_REFUSED', 'saveDir must be a non-empty path');
  const abs = resolve(saveDir);
  const segments = abs.split(/[\\/]+/).filter(Boolean).map(s => s.toLowerCase());
  if (segments.some(s => s === '.git' || s === 'catalog' || s === 'docs')) throw coded('SAVE_DIR_REFUSED', 'saveDir must not be under .git, catalog/ or docs/');
  let dir = abs;
  for (;;) {
    if (existsSync(join(dir, '.git'))) throw coded('SAVE_DIR_REFUSED', 'saveDir must not be inside a git working tree');
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return abs;
}

// Classifies the journal's thread URL against the provider profile. Only a URL on a profile host whose path matches
// threadPattern is 'native'. A present URL that does not match is 'base' (observed delivery does not prove exact-thread binding).
export function threadUrlKind(url, profile) {
  if (url === null || url === undefined || url === '') return 'none';
  if (typeof url !== 'string') return 'base';
  let u; try { u = new URL(url); } catch { return 'base'; }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return 'base';
  if (!profile || !Array.isArray(profile.hosts) || !profile.hosts.includes(u.hostname) || !(profile.threadPattern instanceof RegExp)) return 'base';
  const pattern = new RegExp(profile.threadPattern.source, profile.threadPattern.flags.replace(/[gy]/g, ''));
  return pattern.test(u.pathname) ? 'native' : 'base';
}

async function writeAtomic(file, data) {
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, data, { mode: 0o600 });
  await rename(tmp, file);
}

export async function runComparison({
  providers, prompt, router, grants, saveDir, getRecord, now = Date.now, idFor = defaultIdFor,
  profileFor = getProvider, profile = 'lab', port = 9333, waitMs = 180000
} = {}) {
  if (!Array.isArray(providers) || !providers.length || providers.some(p => typeof p !== 'string' || !p.trim())) throw new TypeError('providers must be a non-empty array of strings');
  if (new Set(providers).size !== providers.length) throw new TypeError('providers must not repeat');
  if (typeof prompt !== 'string' || !prompt.length) throw new TypeError('prompt must be a non-empty string');
  if (typeof router?.ask !== 'function' || typeof router?.wait !== 'function') throw new TypeError('router must provide ask and wait');
  if (typeof grants?.check !== 'function' || typeof grants?.consume !== 'function') throw new TypeError('grants must provide check and consume');
  if (typeof getRecord !== 'function') throw new TypeError('getRecord(requestId) is required');
  const dir = assertSaveDirAllowed(saveDir);
  await mkdir(dir, { recursive: true, mode: 0o700 });

  const promptDigest = sha256(prompt);
  const results = [];
  const flush = () => writeAtomic(join(dir, 'results.json'), JSON.stringify(results, null, 2));
  const seen = new Set();

  for (const provider of providers) {
    const startedAt = iso(now());
    const finish = (entry) => { results.push({ ...entry, finishedAt: iso(now()) }); };

    const profileObj = await Promise.resolve().then(() => profileFor(provider)).catch(() => null);
    if (!profileObj) {
      finish({ provider, requestId: null, status: 'skipped', replyChars: 0, replyDigest: null, threadUrlKind: 'none', startedAt, error: 'UNSUPPORTED_PROVIDER' });
      await flush(); continue;
    }

    const requestId = idFor(provider);
    if (typeof requestId !== 'string' || !ID.test(requestId) || seen.has(requestId)) throw coded('BAD_REQUEST_ID', 'idFor must return a unique id matching [A-Za-z0-9_-]{1,128}');
    seen.add(requestId);

    const gate = { provider, profile, port, promptDigest, threadUrl: 'new', now: now() };
    const checked = await grants.check(gate);
    const consumed = checked.ok ? await grants.consume({ ...gate, requestId, now: now() }) : checked;
    if (!consumed.ok) {
      finish({ provider, requestId: null, status: 'denied', replyChars: 0, replyDigest: null, threadUrlKind: 'none', startedAt, error: consumed.reason });
      await flush(); continue;
    }

    let status; let reply = null; let error;
    try {
      // Single attempt. No retry of ask or wait, whatever the outcome.
      await router.ask({ provider, threadUrl: 'new', prompt, requestId });
      const waited = await router.wait(requestId, waitMs);
      status = String(waited?.status ?? 'unknown');
      reply = typeof waited?.reply === 'string' ? waited.reply : null;
    } catch (e) {
      status = 'error';
      error = typeof e?.code === 'string' && /^[A-Z0-9_]{1,64}$/.test(e.code) ? e.code : 'RUNNER_ERROR';
    }

    // The thread URL comes from the journal-style record only. wait() may carry a URL that the real router does not.
    let record = null;
    try { record = await getRecord(requestId); } catch { record = null; }
    const kind = threadUrlKind(record?.threadUrl ?? null, profileObj);

    let replyChars = 0; let replyDigest = null;
    if (reply !== null) {
      await writeAtomic(join(dir, `${requestId}.reply.txt`), reply);
      replyChars = reply.length; replyDigest = sha256(reply);
    }
    finish({ provider, requestId, status, replyChars, replyDigest, threadUrlKind: kind, startedAt, ...(error ? { error } : {}) });
    await flush();
  }
  return { results, saveDir: dir };
}
