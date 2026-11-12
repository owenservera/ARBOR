// START01: persisted workspace setup manifest and single profile resolver.
// Contract: docs/design/ONE-COMMAND-WORKSPACE-STARTUP.md (ERA 1 and START01).
// The manifest records explicit paths and protected secret-file references only.
// It never stores secret values, and the resolver never falls back to another profile.
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

export const MANIFEST_SCHEMA = 'vivim.workspace-manifest';
export const MANIFEST_VERSION = 1;
export const MANIFEST_FILE = 'vivim-workspace.json';
// Matches the CDP ports already denied by harness/src/interface/target.mjs.
export const DENIED_CDP_PORTS = Object.freeze(new Set([9222]));
const OWNER_POLICY = 'studio-owner';
const SECRET_KEY = /secret|token|password|cookie|credential|api_?key/i;

const pathImpl = platform => (platform === 'win32' ? path.win32 : path.posix);
const coded = (code, message, extra = {}) => Object.assign(new Error(message), { code, ...extra });
const sameProfile = (a, b, platform) => {
  const p = pathImpl(platform);
  const x = p.resolve(a), y = p.resolve(b);
  return platform === 'win32' ? x.toLowerCase() === y.toLowerCase() : x === y;
};

// Returns the dotted paths of any key that looks secret but holds a value inline.
// Keys ending in File or Ref are permitted because they only point at a protected file.
export function findInlineSecrets(node, trail = '') {
  const hits = [];
  if (!node || typeof node !== 'object') return hits;
  for (const [key, value] of Object.entries(node)) {
    const here = trail ? `${trail}.${key}` : key;
    if (SECRET_KEY.test(key) && !/(File|Ref)$/.test(key) && value !== null && value !== undefined) hits.push(here);
    hits.push(...findInlineSecrets(value, here));
  }
  return hits;
}

// Returns { ok, problems[] }. Structural checks always run. Existence checks run only when
// setupComplete is true, because a partial wizard save may legitimately reference paths not yet created.
export function validateManifest(manifest, { platform = process.platform, exists = existsSync } = {}) {
  const p = pathImpl(platform);
  const problems = [];
  const bad = (code, field, message) => problems.push({ code, field, message });
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { ok: false, problems: [{ code: 'MANIFEST_INVALID', field: '', message: 'manifest must be a JSON object' }] };
  }
  if (manifest.schema !== MANIFEST_SCHEMA || manifest.version !== MANIFEST_VERSION) {
    bad('MANIFEST_INVALID', 'schema', `expected ${MANIFEST_SCHEMA} version ${MANIFEST_VERSION}`);
  }
  for (const field of findInlineSecrets(manifest)) {
    bad('SECRET_INLINE', field, 'store secret values in a protected file and reference the file instead');
  }
  const absolute = (field, value) => {
    if (typeof value !== 'string' || !p.isAbsolute(value)) bad('PATH_NOT_ABSOLUTE', field, 'must be an absolute path');
  };
  absolute('workspaceRoot', manifest.workspaceRoot);
  absolute('chrome.executable', manifest.chrome?.executable);
  absolute('chrome.profileDir', manifest.chrome?.profileDir);
  const port = manifest.chrome?.port;
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || DENIED_CDP_PORTS.has(port)) {
    bad('PORT_INVALID', 'chrome.port', `must be an integer from 1024 to 65535, excluding ${[...DENIED_CDP_PORTS].join(', ')}`);
  }
  if (manifest.chrome?.ownerPolicy !== OWNER_POLICY) bad('OWNER_POLICY', 'chrome.ownerPolicy', `must be "${OWNER_POLICY}"`);
  if (manifest.relay?.enabled === true) {
    absolute('relay.hostSecretFile', manifest.relay.hostSecretFile);
    if (typeof manifest.relay.origin !== 'string' || !/^https:\/\/[^/\s]+/.test(manifest.relay.origin)) {
      bad('RELAY_ORIGIN', 'relay.origin', 'must be an https origin when relay is enabled');
    }
  } else if (manifest.relay?.enabled !== false) {
    bad('RELAY_FLAG', 'relay.enabled', 'must be true or false');
  }
  if (typeof manifest.setupComplete !== 'boolean') bad('SETUP_FLAG', 'setupComplete', 'must be true or false');
  if (manifest.setupComplete === true) {
    const check = (code, field, value) => {
      if (typeof value === 'string' && p.isAbsolute(value) && !exists(value)) bad(code, field, `does not exist: ${value}`);
    };
    check('MISSING_WORKSPACE', 'workspaceRoot', manifest.workspaceRoot);
    check('MISSING_CHROME', 'chrome.executable', manifest.chrome?.executable);
    check('MISSING_PROFILE', 'chrome.profileDir', manifest.chrome?.profileDir);
    if (manifest.relay?.enabled === true) check('MISSING_SECRET_FILE', 'relay.hostSecretFile', manifest.relay.hostSecretFile);
  }
  return { ok: problems.length === 0, problems };
}

// Missing file: WORKSPACE_NOT_CONFIGURED. Unparseable file: MANIFEST_INVALID.
// Otherwise returns { manifest, ok, problems } so a partial, resumable setup can still be inspected.
export function readManifest(file, opts = {}) {
  if (!existsSync(file)) throw coded('WORKSPACE_NOT_CONFIGURED', `No workspace manifest at ${file}. Run vivim setup.`, { remedy: 'vivim setup' });
  let manifest;
  try { manifest = JSON.parse(readFileSync(file, 'utf8')); } catch (e) {
    throw coded('MANIFEST_INVALID', `Workspace manifest is not valid JSON: ${e.message}`, { remedy: 'vivim doctor' });
  }
  return { manifest, ...validateManifest(manifest, opts) };
}

// Atomic write through a per-process temp file. Refuses inline secrets always, and refuses
// setupComplete: true unless every check passes, so a partial setup never reports readiness.
export function writeManifest(file, manifest, opts = {}) {
  const { ok, problems } = validateManifest(manifest, opts);
  if (problems.some(p => p.code === 'SECRET_INLINE')) throw coded('SECRET_INLINE', 'Refusing to persist inline secret values', { problems });
  if (manifest.setupComplete === true && !ok) throw coded('SETUP_INCOMPLETE', 'Refusing to mark workspace setup complete', { problems });
  mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;
  try {
    writeFileSync(temp, JSON.stringify(manifest, null, 2) + '\n', { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    renameSync(temp, file);
  } finally {
    rmSync(temp, { force: true });
  }
  return file;
}

// The only resolver `vivim start` may use. It returns exactly the persisted profile.
// A requested profile that differs from the persisted one is a mismatch, never a fallback.
export function resolveStartConfig(manifest, { requestedProfile, platform = process.platform, exists = existsSync } = {}) {
  if (!manifest || manifest.setupComplete !== true) {
    throw coded('SETUP_INCOMPLETE', 'Workspace setup is not complete', { remedy: 'vivim setup' });
  }
  const { ok, problems } = validateManifest(manifest, { platform, exists });
  if (!ok) throw coded('SETUP_INCOMPLETE', 'Workspace manifest failed validation', { problems, remedy: 'vivim doctor' });
  if (requestedProfile !== undefined && !sameProfile(requestedProfile, manifest.chrome.profileDir, platform)) {
    throw coded('PROFILE_MISMATCH', `Requested profile ${requestedProfile} is not the configured profile ${manifest.chrome.profileDir}`, { remedy: 'vivim doctor' });
  }
  return {
    workspaceRoot: manifest.workspaceRoot,
    chrome: { executable: manifest.chrome.executable, profileDir: manifest.chrome.profileDir, port: manifest.chrome.port, ownerPolicy: OWNER_POLICY },
    relay: manifest.relay?.enabled === true
      ? { enabled: true, origin: manifest.relay.origin, hostSecretFile: manifest.relay.hostSecretFile }
      : { enabled: false },
  };
}

// Read-only diagnostic for `vivim doctor`. It reports every check with a remedy and never
// starts a process, opens a browser, or prints the contents of a secret file.
export function diagnoseWorkspace(file, { platform = process.platform, exists = existsSync } = {}) {
  const checks = [];
  const add = (name, status, detail, remedy) => checks.push({ name, status, detail, ...(remedy ? { remedy } : {}) });
  const finish = () => ({ ok: checks.every(c => c.status !== 'fail'), checks });
  if (!exists(file)) {
    add('manifest', 'fail', `missing: ${file}`, 'vivim setup');
    return finish();
  }
  let manifest;
  try { manifest = JSON.parse(readFileSync(file, 'utf8')); } catch (e) {
    add('manifest', 'fail', `not valid JSON: ${e.message}`, 'vivim doctor');
    return finish();
  }
  add('manifest', 'pass', `readable: ${file}`);
  const complete = manifest.setupComplete === true;
  add('setupComplete', complete ? 'pass' : 'fail', complete ? 'workspace setup complete' : 'workspace setup incomplete', complete ? undefined : 'vivim setup');
  const { problems } = validateManifest(manifest, { platform, exists });
  if (problems.length === 0) add('validation', 'pass', 'every structural and path check passes', undefined);
  for (const p of problems) add(p.code.toLowerCase(), 'fail', `${p.field}: ${p.message}`, 'vivim doctor');
  // Report only whether relay is enabled. The secret file's contents are never read or printed.
  add('relay', 'info', manifest.relay?.enabled === true ? 'relay enabled (secret referenced by file)' : 'relay disabled', undefined);
  return finish();
}

// Builds a complete candidate manifest. Setup stays incomplete until the caller verifies it.
export function buildManifest({ workspaceRoot, chrome, relay = { enabled: false }, setupComplete = false }) {
  return {
    schema: MANIFEST_SCHEMA,
    version: MANIFEST_VERSION,
    workspaceRoot,
    chrome: { ownerPolicy: OWNER_POLICY, ...chrome },
    relay,
    setupComplete,
  };
}
