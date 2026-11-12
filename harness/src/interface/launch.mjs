import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const runtime = resolve(fileURLToPath(new URL('../../../runtime/', import.meta.url)));
// The only profiles the harness may drive: its own, or the owner's signed-in profile (user-directed).
// Same resolution as vivim-harness (src/config.mjs): <CAPTURE_STUDIO_HOME or C:\VIVIM>\chrome-profile.
export const OWNER_PROFILE = resolve(process.env.CAPTURE_STUDIO_HOME || 'C:\\VIVIM', 'chrome-profile');
export const LAB_PROFILE = resolve(runtime, 'chrome-profile');
const inside = (root, dir) => { const rel = relative(root, resolve(dir)); return !!rel && !rel.startsWith('..') && !isAbsolute(rel); };
const same = (a, b) => resolve(a).toLowerCase() === resolve(b).toLowerCase();

// Chrome discovery mirrors vivim-harness src/chrome/launch.mjs: CHROME_PATH, then standard install dirs.
export function findChrome(env = process.env, platform = process.platform, exists = existsSync) {
  if (platform !== 'win32') {
    const c = [env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/opt/google/chrome/chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
    return c.find(p => exists(p)) || '/usr/bin/google-chrome';
  }
  const bases = [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean);
  const c = [env.CHROME_PATH, ...bases.map(b => resolve(b, 'Google', 'Chrome', 'Application', 'chrome.exe'))].filter(Boolean);
  return c.find(p => existsSync(p)) || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
}

// Default profile is the signed-in VIVIM profile (user-directed); the lab-local one is opt-in via LAB_PROFILE.
export function buildLaunchCommand({ chrome = findChrome(), host = '127.0.0.1', port = 9333, userDataDir = OWNER_PROFILE } = {}) {
  const allowed = inside(runtime, userDataDir) || same(userDataDir, OWNER_PROFILE);
  if (host !== '127.0.0.1' || port !== 9333 || !allowed) throw new Error('Unsafe Chrome launch configuration');
  return { command: chrome, args: [`--remote-debugging-address=${host}`, `--remote-debugging-port=${port}`, `--user-data-dir=${resolve(userDataDir)}`, '--no-first-run', '--no-default-browser-check'] };
}

// Single-driver guard. Returns a list of reasons the profile is NOT free (empty = free).
export function profileBusyReasons({ userDataDir, leaseRoot = resolve(process.env.LOCALAPPDATA || '', 'AION', 'drive-leases'), runCim = defaultCim } = {}) {
  const reasons = [];
  try {
    for (const line of runCim()) if (line.toLowerCase().includes(`--user-data-dir=${resolve(userDataDir).toLowerCase()}`) || line.toLowerCase().includes(`--user-data-dir="${resolve(userDataDir).toLowerCase()}"`)) { reasons.push('A Chrome process already uses this profile'); break; }
  } catch { reasons.push('Could not inspect running Chrome processes'); }
  try { if (existsSync(leaseRoot) && readdirSync(leaseRoot).length) reasons.push('A VIVIM drive lease directory is present (VIVIM may be driving a browser)'); } catch { /* none */ }
  return reasons;
}
// Linux/macOS: every process command line via ps (no PowerShell).
export function parsePsOutput(out) { return String(out).split(/\r?\n/).map(l => l.trim()).filter(l => /chrom/i.test(l)); }
function defaultCim() {
  if (process.platform !== 'win32') return parsePsOutput(execFileSync('ps', ['-eo', 'args='], { encoding: 'utf8', timeout: 20000 }));
  const out = execFileSync('powershell.exe', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | ForEach-Object { $_.CommandLine }"], { encoding: 'utf8', timeout: 20000 });
  return out.split(/\r?\n/).filter(Boolean);
}
