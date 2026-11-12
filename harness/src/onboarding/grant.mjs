import { mkdir, readFile, writeFile, rename, unlink, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

// Onboarding grant: an OWNER-issued, bounded permission for the worker to CONSUME sends on fresh threads.
// The worker never issues or approves for itself: issue() needs a confirm callback that returns exactly true,
// and the default confirm needs an interactive TTY plus a typed phrase, so no automated process can issue one.
// Each send claims one exclusive slot file (wx), so consumption is atomic across processes and one-shot per send.
// Records hold no prompt text, no reply, no thread URL and no token: only promptDigest (sha256 hex).

const FILE = 'onboarding-grant.json';
const DIGEST = /^[a-f0-9]{64}$/;
const PORT_REFUSED = 9222;
const MAX_SENDS = 20;
const MAX_EXPIRY_MS = 24 * 3600000;

const coded = (code, message) => Object.assign(new Error(message), { code });
const deny = reason => ({ ok: false, reason, remaining: null });

async function writeAtomic(file, data) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  await rename(tmp, file);
}

// Default confirm: requires an interactive terminal on stdin and stdout, then a typed phrase.
// Throws GRANT_NO_TTY when there is no terminal, so a piped or automated process cannot issue a grant.
export async function ttyConfirm({ summary, stdin = process.stdin, stdout = process.stderr } = {}) {
  if (!stdin?.isTTY || !stdout?.isTTY) throw coded('GRANT_NO_TTY', 'Onboarding grants can only be issued from an interactive terminal');
  const phrase = `ISSUE ${summary.providers.join(',')}`;
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    stdout.write(`Issue onboarding grant: providers=${summary.providers.join(',')} profile=${summary.profile} port=${summary.port} maxSends=${summary.maxSends} expiresInMs=${summary.expiresInMs} (fresh threads only)\n`);
    const typed = await rl.question(`Type exactly "${phrase}" to confirm: `);
    return typed === phrase;
  } finally { rl.close(); }
}

export function createGrantStore({ dir, now = Date.now, confirm = null, stdin = process.stdin, stdout = process.stderr } = {}) {
  if (typeof dir !== 'string' || !dir.trim()) throw new TypeError('grant dir required');
  const file = join(dir, FILE);
  const slot = (id, k) => join(dir, `${id}.slot-${k}.json`);

  // Unreadable or corrupt records are treated as "no grant" (deny by default).
  async function read() {
    try { const r = JSON.parse(await readFile(file, 'utf8')); return r && typeof r === 'object' ? r : null; } catch { return null; }
  }
  const exists = async p => { try { await access(p); return true; } catch { return false; } };
  async function used(r) {
    let n = 0;
    for (let k = 0; k < r.maxSends; k++) if (await exists(slot(r.id, k))) n++;
    return n;
  }
  const wellFormed = r => typeof r.id === 'string' && Array.isArray(r.providers) && typeof r.profile === 'string' && typeof r.port === 'number'
    && typeof r.promptDigest === 'string' && Number.isInteger(r.maxSends) && typeof r.expiresAt === 'number';

  // Pure ordering of denials. Returns a deny result or null when every rule passes.
  function rules(req, r, t) {
    if (r && r.revoked === true) return deny('REVOKED');
    if (!r || !wellFormed(r)) return deny('NO_GRANT');
    if (t >= r.expiresAt) return deny('EXPIRED');
    if (req.port === PORT_REFUSED || req.port !== r.port) return deny('PORT_MISMATCH');
    if (!r.providers.includes(req.provider)) return deny('PROVIDER_NOT_GRANTED');
    if (req.profile !== r.profile) return deny('PROFILE_MISMATCH');
    if (req.promptDigest !== r.promptDigest) return deny('DIGEST_MISMATCH');
    if (req.threadUrl !== 'new') return deny('NEW_THREAD_REQUIRED');
    return null;
  }

  async function gate(req) {
    const r = await read();
    const t = req.now ?? now();
    const d = rules(req, r, t);
    if (d) return { denied: d };
    const n = await used(r);
    if (n >= r.maxSends) return { denied: deny('EXHAUSTED') };
    return { grant: r, remaining: r.maxSends - n };
  }

  return {
    file,
    async issue({ providers, profile, port, promptDigest, maxSends, expiresInMs, fresh, confirm: confirmOpt } = {}) {
      if (!Array.isArray(providers) || !providers.length || providers.some(p => typeof p !== 'string' || !p.trim())) throw coded('GRANT_BAD_PROVIDERS', 'providers must be a non-empty array of strings');
      if (typeof profile !== 'string' || !profile.trim()) throw coded('GRANT_BAD_PROFILE', 'profile must be a non-empty string');
      if (!Number.isInteger(port) || port < 1 || port > 65535) throw coded('GRANT_BAD_PORT', 'port must be an integer port number');
      if (port === PORT_REFUSED) throw coded('GRANT_PORT_REFUSED', 'Port 9222 is VIVIM and is never granted');
      if (typeof promptDigest !== 'string' || !DIGEST.test(promptDigest)) throw coded('GRANT_BAD_DIGEST', 'promptDigest must be a sha256 hex digest');
      if (!Number.isInteger(maxSends) || maxSends < 1 || maxSends > MAX_SENDS) throw coded('GRANT_BAD_MAX', `maxSends must be an integer from 1 to ${MAX_SENDS}`);
      if (!Number.isInteger(expiresInMs) || expiresInMs < 1 || expiresInMs > MAX_EXPIRY_MS) throw coded('GRANT_BAD_EXPIRY', 'expiresInMs must be an integer from 1 to 24 hours');
      if (fresh !== true) throw coded('GRANT_NOT_FRESH', 'Onboarding grants cover fresh threads only: fresh must be true');
      const summary = { providers: [...providers], profile, port, maxSends, expiresInMs, fresh: true };
      const ask = confirmOpt ?? confirm ?? (opts => ttyConfirm({ ...opts, stdin, stdout }));
      // Only an explicit `true` counts as confirmation. Anything else, including a throw from the callback, issues nothing.
      if ((await ask(summary)) !== true) throw coded('GRANT_NOT_CONFIRMED', 'Grant was not confirmed');
      const issuedAt = now();
      const record = { id: randomUUID(), providers: [...providers], profile, port, promptDigest, maxSends, fresh: true, issuedAt, expiresAt: issuedAt + expiresInMs };
      await writeAtomic(file, record);
      return record;
    },
    async check(req = {}) {
      const g = await gate(req);
      return g.denied ? { ...g.denied } : { ok: true, reason: null, remaining: g.remaining };
    },
    // Claims the next free slot with an exclusive create. EEXIST means another send took it: try the next one.
    async consume(req = {}) {
      const g = await gate(req);
      if (g.denied) return { ...g.denied };
      for (let k = 0; k < g.grant.maxSends; k++) {
        try {
          await writeFile(slot(g.grant.id, k), JSON.stringify({ slot: k, provider: req.provider, requestId: typeof req.requestId === 'string' ? req.requestId : null, consumedAt: req.now ?? now() }), { flag: 'wx', mode: 0o600 });
        } catch (e) { if (e.code === 'EEXIST') continue; throw e; }
        return { ok: true, reason: null, remaining: g.grant.maxSends - (k + 1), slot: k };
      }
      return deny('EXHAUSTED');
    },
    // Replaces the grant with a tombstone so later checks say REVOKED rather than NO_GRANT.
    async revoke() {
      const r = await read();
      let exists = true;
      try { await access(file); } catch { exists = false; }
      if (!exists) return { revoked: false };
      await writeAtomic(file, { id: r?.id ?? null, revoked: true, revokedAt: now() });
      return { revoked: true };
    }
  };
}
