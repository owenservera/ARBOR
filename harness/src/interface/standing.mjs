import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { devAutoApprove } from './dev-auto-approve.mjs';

// Standing approval: one-time, time- and count-limited permission for routine sends on the LAB profile.
// It replaces only the per-request `wh approve` step. sendOnce (draft, binding, no-resend) still runs for every send.
// Records hold no prompts, replies, or tokens.

const harness = fileURLToPath(new URL('../../', import.meta.url));
const LAB_PROFILE = resolve(harness, '..', 'runtime', 'chrome-profile');
const OWNER_PROFILE_LITERAL = 'C:\\VIVIM\\chrome-profile';
const HOUR = 3600000;
const MAX_PROMPT = 2000;
const MAX_THREADS = 10;

const coded = (code, message) => Object.assign(new Error(message), { code });
const deny = reason => ({ ok: false, reason });

// Pure check on a process command line: must use the lab profile and must not reference the owner profile.
export function isLabCommandLine(commandLine, labProfile = LAB_PROFILE) {
  const line = String(commandLine || '').toLowerCase();
  if (line.includes(OWNER_PROFILE_LITERAL.toLowerCase())) return false;
  const lab = resolve(labProfile).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`--user-data-dir=["']?${lab}["']?(\\s|$)`).test(line);
}

// Finds the process listening on 127.0.0.1:9333 and checks its --user-data-dir. Any error -> false.
const LISTENER_SCRIPT = "$c = Get-NetTCPConnection -State Listen -LocalPort 9333 -ErrorAction SilentlyContinue | Where-Object { $_.LocalAddress -eq '127.0.0.1' } | Select-Object -First 1; if ($c) { (Get-CimInstance Win32_Process -Filter ('ProcessId=' + $c.OwningProcess)).CommandLine }";
// Linux: `ss -ltnpH` lists listeners with owning pid; pick the one bound to 127.0.0.1:9333. Pure parser for tests.
export function parseSsListenerPid(out, port = 9333) {
  for (const line of String(out).split(/\r?\n/)) {
    const cols = line.trim().split(/\s+/);
    if (!cols.some(c => c === `127.0.0.1:${port}`)) continue;
    const m = line.match(/pid=(\d+)/);
    if (m) return Number(m[1]);
  }
  return null;
}
export async function linuxListenerCommandLine({ run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', timeout: 20000 }), readCmdline = pid => readFileSync(`/proc/${pid}/cmdline`, 'utf8') } = {}) {
  const pid = parseSsListenerPid(run('ss', ['-ltnpH']));
  if (!pid) return '';
  return readCmdline(pid).split('\0').filter(Boolean).join(' ');
}
export async function defaultVerifyLabProfile() {
  if (process.platform !== 'win32') {
    try { return isLabCommandLine(await linuxListenerCommandLine()); } catch { return false; }
  }
  try {
    const out = execFileSync('powershell.exe', ['-NoProfile', '-Command', LISTENER_SCRIPT], { encoding: 'utf8', timeout: 20000, windowsHide: true });
    return isLabCommandLine(out.trim());
  } catch { return false; }
}

async function writeAtomic(file, data) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  await rename(tmp, file);
}

export function createStanding({ dir, now = Date.now, verifyLabProfile = defaultVerifyLabProfile, env = process.env } = {}) {
  const file = join(dir, 'standing.json');
  // Unreadable or corrupt records are treated as "no standing" (deny by default).
  async function read() {
    try { return JSON.parse(await readFile(file, 'utf8')); } catch { return null; }
  }
  const active = (r, t = now()) => !!r && (r.expiresAt === null || t < r.expiresAt) && (r.maxSends === null || r.sent < r.maxSends);
  return {
    async enable({ provider, hours, maxSends, threads = [], confirmText } = {}) {
      if (typeof provider !== 'string' || !provider.trim()) throw coded('STANDING_BAD_PROVIDER', 'provider must be a non-empty string');
      // The typed confirmation is the human gate; VIVIM_DEV_AUTO_APPROVE=1 waives it for development.
      if (confirmText !== `ENABLE ${provider}` && !devAutoApprove(env)) throw coded('STANDING_CONFIRM_MISMATCH', `Confirmation must be exactly: ENABLE ${provider}`);
      const unlimitedHours = hours === null;
      const unlimitedMax = maxSends === null;
      if (!unlimitedHours && (!Number.isInteger(hours) || hours < 1 || hours > 24)) throw coded('STANDING_BAD_HOURS', 'hours must be an integer from 1 to 24, or null for no time limit');
      if (!unlimitedMax && (!Number.isInteger(maxSends) || maxSends < 1 || maxSends > 20)) throw coded('STANDING_BAD_MAX', 'maxSends must be an integer from 1 to 20, or null for no send limit');
      if (!Array.isArray(threads) || threads.length > MAX_THREADS) throw coded('STANDING_BAD_THREAD', `threads must be an array of at most ${MAX_THREADS} https URLs`);
      for (const thread of threads) {
        let url = null; try { url = new URL(thread); } catch { url = null; }
        if (!url || url.protocol !== 'https:') throw coded('STANDING_BAD_THREAD', `thread must be an https URL: ${String(thread)}`);
      }
      const createdAt = now();
      const record = { provider, createdAt, expiresAt: unlimitedHours ? null : createdAt + hours * HOUR, maxSends, sent: 0, threads: [...threads] };
      await writeAtomic(file, record);
      return record;
    },
    async revoke() {
      try { await unlink(file); return { revoked: true }; } catch (e) { if (e.code === 'ENOENT') return { revoked: false }; throw e; }
    },
    async status() {
      const record = await read();
      return { record, active: active(record) };
    },
    async check({ provider, threadUrl, prompt } = {}) {
      const r = await read();
      if (!r) return deny('NO_STANDING');
      if (r.expiresAt !== null && now() >= r.expiresAt) return deny('EXPIRED');
      if (r.provider !== '*' && provider !== r.provider) return deny('PROVIDER_MISMATCH');
      if (r.maxSends !== null && r.sent >= r.maxSends) return deny('SEND_LIMIT');
      if (threadUrl !== 'new' && !r.threads.includes(threadUrl)) return deny('THREAD_NOT_ALLOWED');
      if (typeof prompt !== 'string' || prompt.length > MAX_PROMPT) return deny('PROMPT_TOO_LONG');
      let verified = false;
      try { verified = (await verifyLabProfile()) === true; } catch { verified = false; }
      if (!verified) return deny('LAB_PROFILE_NOT_VERIFIED');
      return { ok: true };
    },
    async recordSend() {
      const r = await read();
      if (!r) throw coded('NO_STANDING', 'No standing approval is enabled');
      if (r.maxSends !== null && r.sent >= r.maxSends) throw coded('SEND_LIMIT', 'Standing approval send limit reached');
      await writeAtomic(file, { ...r, sent: r.sent + 1 });
      return { sent: r.sent + 1 };
    }
  };
}
