// VIVIM Host M0: read-only loopback preview. No browser control, worker starts, or sends.
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { workerHealth, messageJourney } from './diagnostics.mjs';
import { projectHostRecovery } from './recovery/host-adapter.mjs';
import { workspaceManifestFile } from '../../studio/src/config.mjs';
import { MANIFEST_FILE, MANIFEST_SCHEMA, MANIFEST_VERSION } from '../../studio/src/workspace-manifest.mjs';
import { diagnoseHost } from './insights.mjs';
import { createBootstrapRuntime } from './bootstrap/runtime.mjs';
import { readMemoryParams } from './bootstrap/web-memory.mjs';
import { createBootstrapCommandWorker } from './bootstrap/command-worker.mjs';
import { createWorkerSupervisor } from './bootstrap/worker-supervisor.mjs';
import { loadOwnerToken, verifyOwnerToken } from './bootstrap/owner-auth.mjs';
import { createDirectPhoneHandler } from './direct-phone.mjs';
import { createEnrollment } from './apk/enrollment.mjs';
import { createApkRegistry } from './apk/registry.mjs';
import { createPairingStore } from './apk/pairing.mjs';
import { createControlDispatcher } from './control/dispatcher.mjs';
import { createControlBrowserSessions, UI_COOKIE } from './control/browser-session.mjs';
import { createOnboardingService } from './onboarding/service.mjs';
import { createStudioPort } from './onboarding/studio-port.mjs';
import { detectEnvironment } from './onboarding/environment.mjs';
import { controlErrorStatus } from './control/http-status.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, '..', '..');
const STUDIO_CLI = path.join(REPO_ROOT, 'studio', 'bin', 'studio.mjs');
const execFile = promisify(execFileCb);

const SECURITY = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
};
const MIME = {
  '/': 'text/html; charset=utf-8',
  '/onboarding': 'text/html; charset=utf-8',
  '/host.css': 'text/css; charset=utf-8',
  '/host.js': 'text/javascript; charset=utf-8',
  '/control-panel.js': 'text/javascript; charset=utf-8',
  '/onboarding.js': 'text/javascript; charset=utf-8',
  '/qrcode.js': 'text/javascript; charset=utf-8',
  '/vivim-tokens.css': 'text/css; charset=utf-8',
  '/fonts/space-grotesk-latin-wght-normal.woff2': 'font/woff2',
  '/fonts/geist-latin-wght-normal.woff2': 'font/woff2',
  '/fonts/jetbrains-mono-latin-wght-normal.woff2': 'font/woff2',
};
const ASSETS = {
  '/': 'index.html',
  '/onboarding': 'onboarding.html',
  '/host.css': 'host.css',
  '/host.js': 'host.js',
  '/control-panel.js': 'control-panel.js',
  '/onboarding.js': 'onboarding.js',
  '/qrcode.js': 'qrcode.js',
  '/vivim-tokens.css': 'vivim-tokens.css',
  '/fonts/space-grotesk-latin-wght-normal.woff2': 'space-grotesk-latin-wght-normal.woff2',
  '/fonts/geist-latin-wght-normal.woff2': 'geist-latin-wght-normal.woff2',
  '/fonts/jetbrains-mono-latin-wght-normal.woff2': 'jetbrains-mono-latin-wght-normal.woff2',
};
const STATES = ['queued', 'claimed', 'done', 'failed'];

export function studioDataDir(env = process.env, platform = process.platform, home = os.homedir()) {
  const paths = platform === 'win32' ? path.win32 : path.posix;
  if (env.VIVIM_HOST_DATA_DIR) return paths.resolve(env.VIVIM_HOST_DATA_DIR);
  if (env.CAPTURE_STUDIO_HOME) return paths.resolve(env.CAPTURE_STUDIO_HOME);
  if (platform === 'win32') return paths.join(env.LOCALAPPDATA || paths.join(home, 'AppData', 'Local'), 'AION', 'capture-studio');
  if (platform === 'darwin') return paths.join(home, 'Library', 'Application Support', 'AION', 'capture-studio');
  return paths.join(env.XDG_DATA_HOME && paths.isAbsolute(env.XDG_DATA_HOME) ? env.XDG_DATA_HOME : paths.join(home, '.local', 'share'), 'aion-capture-studio');
}

// Resolve the workspace manifest file the same way `studio setup` does: via the installed
// CLI's installation.json (dataDir), falling back to <dataDir>/vivim-workspace.json.
export function manifestFile(env = process.env) {
  const mf = workspaceManifestFile(env);
  if (mf) return mf;
  return path.join(studioDataDir(env), MANIFEST_FILE);
}

// True only when a complete, validated manifest exists (setupComplete: true + all paths present).
export function manifestComplete(env = process.env) {
  const file = manifestFile(env);
  if (!existsSync(file)) return false;
  try {
    const m = JSON.parse(readFileSync(file, 'utf8'));
    return Boolean(m && m.schema === MANIFEST_SCHEMA && m.version === MANIFEST_VERSION && m.setupComplete === true);
  } catch { return false; }
}

// Run a command without a shell (avoids Windows cmd.exe quoting). Returns {ok,stdout,stderr,code?}.
async function runCommand(file, args) {
  try {
    const { stdout, stderr } = await execFile(file, args, { maxBuffer: 10 * 1024 * 1024 });
    return { ok: true, stdout, stderr };
  } catch (e) {
    return { ok: false, stdout: e.stdout || '', stderr: e.stderr || String(e), code: e.code };
  }
}

// Snapshot of onboarding prerequisites + manifest state for the onboarding UI.
function onboardingState() {
  const env = detectEnvironment();
  return {
    platform: env.platform, node: env.node, chrome: { found: env.browser.found, path: env.browser.path, name: env.browser.name },
    canLaunchFromHere: env.canLaunchFromHere,
    manifest: { complete: manifestComplete(), file: manifestFile() },
    defaultWorkspaceRoot: env.defaults.workspaceRoot, defaultChromeExe: env.defaults.chromeExe,
    defaultChromeProfile: env.defaults.chromeProfile, defaultCdpPort: env.defaults.cdpPort, localIps: []
  };
}

// Use the existing append-only bridge records for read-only metadata. Never expose prompts or results.
export function bridgeSnapshot(dataRoot) {
  const file = path.join(dataRoot, 'bridge', 'commands.jsonl');
  if (!existsSync(file)) return { state: 'not_observed', totals: {}, recent: [] };
  try {
    if (statSync(file).size > 8 * 1024 * 1024) return { state: 'unavailable', reason: 'Bridge log exceeds preview limit', totals: {}, recent: [] };
    const records = new Map();
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line);
        if (/^cmd-[0-9a-f]{16}$/.test(r.id) && STATES.includes(r.status)) records.set(r.id, r);
      } catch { /* ignore a torn append-only tail */ }
    }
    const rows = [...records.values()].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    const totals = Object.fromEntries(STATES.map(s => [s, rows.filter(r => r.status === s).length]));
    const recent = rows.slice(0, 12).map(r => ({ id: r.id, consumer: r.consumer === 'harness' ? 'harness' : r.consumer === 'grokbot' ? 'grokbot' : 'unknown', status: r.status, updatedAt: r.updatedAt || null }));
    return { state: 'observed', totals, recent };
  } catch { return { state: 'unavailable', reason: 'Cannot read bridge metadata', totals: {}, recent: [] }; }
}

export function hostSnapshot({ dataRoot, now = () => new Date().toISOString(), journalRoot = path.resolve(here, '../../runtime/journal'), bootstrap = null }) {
  const observedAt = now();
  const bridge = bridgeSnapshot(dataRoot);
  const journey = messageJourney(dataRoot, { now: observedAt, journalRoot });
  const services = {
      relay: workerHealth(dataRoot, 'relay', { now: observedAt }),
      chatWorker: workerHealth(dataRoot, 'chatWorker', { now: observedAt }),
      harness: { state: 'unknown', reason: 'No read-only harness probe connected yet' },
      chrome: { state: 'unknown', reason: 'Chrome session intentionally not inspected by preview' },
  };
  const snapshot = {
    schema: 'vivim.host-status/1', observedAt,
    host: { state: 'online', evidence: 'local HTTP request reached this process' },
    services, bridge, journey,
    diagnosis: diagnoseHost({ journey, services, bridge }),
    bootstrap: bootstrap ? bootstrap.projection() : { state: 'unavailable', code: 'BOOTSTRAP_NOT_STARTED', reason: 'Bootstrap runtime not started' },
    capabilities: { localTalkRead: false, localTalkSend: false, serviceControl: false, relayTransport: false },
  };
  // Additive R0-only diagnosis projection. Not a recoverable effect or new executor.
  return { ...snapshot, recovery: projectHostRecovery(snapshot) };
}

export function createHostServer({ dataRoot = studioDataDir(), staticRoot = path.join(here, 'public'), bootstrap = null, ownerToken = null, directPhone = null, worker = null, studioUrl = null, studioToken = null, onboarding = null, autoPump = false } = {}) {
  let runtime = bootstrap;
  let token = ownerToken;
  const runtimeFor = () => {
    if (!runtime) runtime = createBootstrapRuntime({ dataRoot });
    return runtime;
  };
  const tokenFor = () => {
    if (token) return token;
    token = loadOwnerToken({ dataRoot }).token;
    return token;
  };
  const supervisor = createWorkerSupervisor({ dataRoot });
  if (worker) {
    worker.start();
    supervisor.takeover('bootstrap', process.pid);
  }
  // One Host-owned control dispatcher for desktop text, phone text and GUI (UTC03).
  let control = null;
  const uiSessions = createControlBrowserSessions();
  const controlFor = () => (control ??= createControlDispatcher({ dataRoot, runtime: runtimeFor(), devices: enrollment }));
  // APK07 release registry, shared with the Direct phone handler so a release registered on
  // the PC is immediately downloadable by the phone (same dataRoot/apk-artifacts).
  const apk = createApkRegistry({ dataRoot });
  // The installed MSI supplies immutable release bytes + manifest via Tauri resources.
  // Register only when both exist and the manifest matches the shipped artifact.
  const bundledApk = process.env.VIVIM_BUNDLED_APK;
  const bundledManifest = process.env.VIVIM_BUNDLED_APK_MANIFEST;
  if (bundledApk && bundledManifest && existsSync(bundledApk) && existsSync(bundledManifest)) {
    try {
      const manifest = JSON.parse(readFileSync(bundledManifest, 'utf8').replace(String.fromCharCode(0xfeff), ''));
      const actualSha = createHash('sha256').update(readFileSync(bundledApk)).digest('hex');
      if (manifest.schema !== 'vivim.apk-release/1' || manifest.artifact?.sha256 !== actualSha ||
          !manifest.signing?.certSha256 || manifest.signing.mode === 'debug' ||
          !Number.isInteger(manifest.versionCode) || !manifest.applicationId) {
        throw new Error('BUNDLED_APK_MANIFEST_INVALID');
      }
      const installed = apk.getRelease(manifest.releaseId);
      const current = apk.getCurrent();
      if (!installed && (!current || manifest.versionCode >= current.versionCode)) apk.registerRelease({
        releaseId: manifest.releaseId, applicationId: manifest.applicationId, versionCode: manifest.versionCode,
        versionName: manifest.versionName, channel: manifest.channel,
        certSha256: manifest.signing.certSha256, artifactPath: bundledApk,
        fileName: manifest.artifact.fileName || 'vivim.apk'
      });
    } catch (error) {
      // A broken signed release must not be advertised as downloadable.
      console.error('[apk] bundled release not registered:', String(error.message || error));
    }
  }
  // APK07 PC<->phone pairing store, shared with the Direct phone handler so a token minted by
  // the onboarding wizard is redeemable by the phone without a second source of truth.
  const pairing = createPairingStore({ dataRoot });
  // One Host-owned onboarding service shares Studio, APK and pairing authority.
  const onboardingService = onboarding ?? createOnboardingService({
    dataRoot, getRuntime: runtimeFor, directOrigin: directPhone?.origin ?? null,
    studio: studioUrl ? createStudioPort({ url: studioUrl, token: studioToken }) : null,
    apk, pairing
  });
  if (autoPump) onboardingService.start();
  const direct = directPhone ? createDirectPhoneHandler({ ...directPhone, dataRoot, worldId: runtimeFor().worldId, projection: () => runtimeFor().projection(), webMemory: opts => runtimeFor().webMemory(opts), control: controlFor, apkRegistry: apk, pairingStore: pairing, onPhoneSeen: () => onboardingService.phoneSeen(), primary: () => onboardingService.primary() }) : null;
  const enrollment = createEnrollment({ dataRoot, origin: null, user: null });
  const server = http.createServer(async (req, res) => {
    for (const [k, v] of Object.entries(SECURITY)) res.setHeader(k, v);
    const rawPath = String(req.url || '').split('?')[0];
    if (direct && (rawPath === '/mobile' || rawPath.startsWith('/mobile/'))) { await direct(req, res); return; }
    const host = String(req.headers.host || '').toLowerCase();
    if (!/^(127\.0\.0\.1|localhost)(:\d{1,5})?$/.test(host) || req.headers['x-forwarded-proto'] || req.headers['tailscale-user-login']) { res.writeHead(403); res.end('Forbidden'); return; }
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    if (pathname.startsWith('/api/host/bootstrap')) {
      await handleBootstrap(req, res, pathname, host, runtimeFor(), tokenFor);
      return;
    }
    if (pathname.startsWith('/api/host/apk/')) {
      await handleApk(req, res, pathname, host, apk, tokenFor);
      return;
    }
    if (pathname.startsWith('/api/host/data-intelligence/')) {
      handleDataIntelligence(req, res, pathname, host, runtimeFor, tokenFor);
      return;
    }
    if (pathname.startsWith('/api/host/control/')) {
      await handleControl(req, res, pathname, host, controlFor, tokenFor, uiSessions, enrollment, runtimeFor);
      return;
    }
    const workerMatch = pathname.match(/^\/api\/host\/worker\/([^\/]+)\/(status|recover)$/);
    if (workerMatch) {
      const [, role, action] = workerMatch;
      if (!/^[a-z][a-z0-9_-]{0,63}$/.test(role)) {
        sendJson(res, 400, { code: 'SUPERVISOR_INPUT' }); return;
      }
      // Worker lease/status metadata and recovery are owner-private Host surfaces.
      // A loopback Host header is not sufficient authorization for local processes.
      if (action === 'status' && req.method === 'GET') {
        if (req.headers.origin !== undefined && String(req.headers.origin).toLowerCase() !== 'http://' + host) {
          sendJson(res, 403, { code: 'ORIGIN' }); return;
        }
        if (!ownerAuthorized(req, res, tokenFor)) return;
        sendJson(res, 200, supervisor.status(role));
        return;
      }
      if (action === 'recover' && req.method === 'POST') {
        if (String(req.headers.origin || '').toLowerCase() !== 'http://' + host ||
            String(req.headers['x-vivim-control'] || '') !== '1') {
          sendJson(res, 403, { code: 'ORIGIN_OR_CSRF' }); return;
        }
        if (!ownerAuthorized(req, res, tokenFor)) return;
        // Retire the legacy unjournaled mutation path. A real worker repair must
        // enter a separately authorized typed Host plan with an effect fence and receipt.
        // Lane D may recommend R0 inspection; it cannot call supervisor.recover here.
        sendJson(res, 409, { code: 'CONTROL_ACTION_PLAN_REQUIRED',
          actionId: 'host.worker.lease.recover', executionPerformed: false });
        return;
      }
      res.setHeader('allow', 'GET, POST'); sendJson(res, 405, { error: 'Method not allowed', code: 'METHOD' }); return;
    }
    // First-run onboarding API: state -> setup -> start -> verify (doctor).
    if (pathname.startsWith('/api/onboarding/')) {
      await handleOnboarding(req, res, pathname, apk, pairing, onboardingService, enrollment);
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('allow', 'GET, HEAD'); res.writeHead(405); res.end(); return; }
    if (pathname === '/api/host/status') {
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : JSON.stringify(hostSnapshot({ dataRoot, bootstrap: runtimeFor() }))); return;
    }
    let asset = ASSETS[pathname];
    // First run: no complete workspace manifest -> serve the onboarding wizard instead of Host Control.
    if (pathname === '/' && !manifestComplete()) asset = 'onboarding.html';
    if (!asset) { res.writeHead(404); res.end('Not found'); return; }
    try {
      const body = await readFile(path.join(staticRoot, asset));
      res.setHeader('content-type', MIME[pathname] ?? MIME['/']); res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(503); res.end('Host UI unavailable'); }
  });
  // A runtime this server opened lazily is its own to release; a caller-supplied one is not.
  if (!bootstrap) server.on('close', () => { try { runtime?.close(); } catch { /* already closed */ } });
  return server;
}

const BOOTSTRAP_BODY_LIMIT = 256 * 1024;
const BOOTSTRAP_MUTATIONS = {
  '/api/host/bootstrap/grant': (svc, body) => svc.grantBootstrap({ scope: body.scope }),
  '/api/host/bootstrap/revoke': svc => svc.revokeGrant(),
  '/api/host/bootstrap/f02': (svc, body) => svc.ingestF02({ response: body.response, requestId: body.requestId, generationId: body.generationId ?? null, threadRef: body.threadRef ?? null, activate: body.activate === undefined ? null : body.activate }),
  '/api/host/bootstrap/f01': (svc, body) => svc.ingestF01({ response: body.response, requestId: body.requestId, generationId: body.generationId ?? null, threadRef: body.threadRef ?? null }),
  '/api/host/bootstrap/pass': (svc, body) => svc.ingestPass({ response: body.response, requestId: body.requestId, generationId: body.generationId ?? null, threadRef: body.threadRef ?? null }),
  '/api/host/bootstrap/preset': (svc, body) => svc.choosePreset({ preset: body.preset, requestId: body.requestId }),
  '/api/host/bootstrap/undo': (svc, body) => svc.undoTheme({ requestId: body.requestId }),
  '/api/host/bootstrap/hard-no': (svc, body) => svc.setHardNo({ trait: body.trait, key: body.key ?? null }),
  '/api/host/bootstrap/hard-no/clear': (svc, body) => svc.clearHardNo({ id: body.id }),
  '/api/host/bootstrap/pass-state': (svc, body) => svc.setPassState({ pass: body.pass, status: body.status, requestId: body.requestId ?? null, coverage: body.coverage ?? null, receipt: body.receipt ?? null }),
  '/api/host/bootstrap/ui-proposal': (svc, body) => svc.applyUiProposal({ proposal: body.proposal, surface: body.surface, approvedRefs: body.approvedRefs ?? [], requestId: body.requestId, actor: 'http-owner' })
};

function sendJson(res, status, body) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.writeHead(status); res.end(JSON.stringify(body));
}

function readJsonBody(req, limit = BOOTSTRAP_BODY_LIMIT) {
  return new Promise((resolve, reject) => {
    const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (type !== 'application/json') { reject(Object.assign(new Error('Content-Type application/json required'), { status: 415 })); return; }
    let size = 0, tooLarge = false; const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      // Drain the rest instead of cutting the socket: the caller gets a real 413.
      if (size > limit) { tooLarge = true; chunks.length = 0; return; }
      chunks.push(chunk);
    });
    req.on('error', reject);
    req.on('end', () => {
      if (tooLarge) { reject(Object.assign(new Error('Request body too large'), { status: 413 })); return; }
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text.trim()) { resolve({}); return; }
      try { resolve(JSON.parse(text)); } catch { reject(Object.assign(new Error('Invalid JSON body'), { status: 400 })); }
    });
  });
}

// Every bootstrap mutation is a deliberate local owner action. It must be loopback,
// same-origin, JSON, explicitly marked, and carry the private owner capability token.
// A cross-site form or fetch cannot satisfy the header or the token, and the server
// never answers CORS. Reads stay loopback-only, like the rest of the Host preview.
async function handleBootstrap(req, res, pathname, host, runtime, tokenFor) {
  const origin = req.headers.origin;
  const expected = 'http://' + host;
  if (origin !== undefined && String(origin).toLowerCase() !== expected) { sendJson(res, 403, { error: 'Cross-origin bootstrap request refused', code: 'ORIGIN' }); return; }
  if (pathname === '/api/host/bootstrap/status') {
    if (req.method !== 'GET' && req.method !== 'HEAD') { sendJson(res, 405, { error: 'GET only', code: 'METHOD' }); return; }
    sendJson(res, 200, runtime.status()); return;
  }
  if (pathname === '/api/host/bootstrap/projection') {
    if (req.method !== 'GET' && req.method !== 'HEAD') { sendJson(res, 405, { error: 'GET only', code: 'METHOD' }); return; }
    sendJson(res, 200, runtime.projection()); return;
  }
  if (pathname === '/api/host/bootstrap/ui-revision') {
    if (req.method !== 'GET' && req.method !== 'HEAD') { sendJson(res, 405, { error: 'GET only', code: 'METHOD' }); return; }
    const surface = runtime.uiRevision();
    const revision = surface ? Number(surface.revision) : null;
    const status = revision === null ? null : runtime.uiRevisionStatus(revision)?.status ?? 'applied';
    sendJson(res, 200, {
      ok: true, surface: surface ?? null, revision, status,
      surfaceId: surface?.surfaceId ?? null
    }); return;
  }
  // APK07 device management (PC-only, owner-authorized): approve / revoke device grants.
  const deviceMatch = pathname.match(/^\/api\/host\/devices\/([^\/]+)\/(approve|revoke)$/);
  if (deviceMatch) {
    if (req.method !== 'POST') { res.setHeader('allow', 'POST'); sendJson(res, 405, { error: 'POST only', code: 'METHOD' }); return; }
    if (String(req.headers['x-vivim-bootstrap'] || '') !== '1') { sendJson(res, 403, { error: 'Device action header required', code: 'CSRF' }); return; }
    let ownerToken = null;
    try { ownerToken = tokenFor(); } catch { sendJson(res, 503, { error: 'Owner capability unavailable', code: 'OWNER_TOKEN_UNAVAILABLE' }); return; }
    if (!verifyOwnerToken(req.headers.authorization, ownerToken)) {
      sendJson(res, 401, { error: 'Owner authorization required', code: 'OWNER_AUTH' }); return; }
    // Legacy owner-token routes must not bypass the planned typed action journal.
    // Preserve authenticated reads elsewhere; mutations require Control plan + approve + receipt.
    sendJson(res, 409, {
      error: 'Use the Host Control typed action plan and approval flow to manage devices.',
      code: 'CONTROL_ACTION_PLAN_REQUIRED',
      actionId: deviceMatch[2] === 'approve' ? 'devices.approve' : 'devices.revoke'
    });
    return;
  }
  // APK07 PC-side debug (owner-authenticated, read-only, no secrets).
  const debugMatch = pathname.match(/^\/api\/host\/debug\/(apk|devices)$/);
  if (debugMatch) {
    if (req.method !== 'GET') { res.setHeader('allow', 'GET'); sendJson(res, 405, { error: 'GET only', code: 'METHOD' }); return; }
    if (String(req.headers['x-vivim-bootstrap'] || '') !== '1') { sendJson(res, 403, { error: 'Debug action header required', code: 'CSRF' }); return; }
    let ownerToken = null;
    try { ownerToken = tokenFor(); } catch { sendJson(res, 503, { error: 'Owner capability unavailable', code: 'OWNER_TOKEN_UNAVAILABLE' }); return; }
    if (!verifyOwnerToken(req.headers.authorization, ownerToken)) {
      sendJson(res, 401, { error: 'Owner authorization required', code: 'OWNER_AUTH' }); return; }
    const kind = debugMatch[1];
    if (kind === 'apk') {
      sendJson(res, 200, {
        schema: 'vivim.apk07-debug-registry/1',
        current: apk.getCurrent(),
        releases: apk.listReleases().map(({ releaseId, channel, applicationId, versionCode, versionName, certSha256, bytes, createdAt }) =>
          ({ releaseId, channel, applicationId, versionCode, versionName, certSha256, bytes, createdAt })),
      });
      return;
    }
    if (kind === 'devices') {
      sendJson(res, 200, {
        schema: 'vivim.apk07-debug-devices/1',
        grants: enrollment.listGrants(),
      });
      return;
    }
  }
  const mutate = BOOTSTRAP_MUTATIONS[pathname];
  if (!mutate) { sendJson(res, 404, { error: 'Unknown bootstrap route', code: 'NOT_FOUND' }); return; }
  if (req.method !== 'POST') { res.setHeader('allow', 'POST'); sendJson(res, 405, { error: 'POST only', code: 'METHOD' }); return; }
  if (String(req.headers['x-vivim-bootstrap'] || '') !== '1') { sendJson(res, 403, { error: 'Bootstrap action header required', code: 'CSRF' }); return; }
  let ownerToken = null;
  try { ownerToken = tokenFor(); }
  catch { sendJson(res, 503, { error: 'Owner capability unavailable', code: 'OWNER_TOKEN_UNAVAILABLE' }); return; }
  if (!verifyOwnerToken(req.headers.authorization, ownerToken)) {
    sendJson(res, 401, { error: 'Owner authorization required', code: 'OWNER_AUTH' }); return;
  }
  let body;
  try { body = await readJsonBody(req); }
  catch (error) { sendJson(res, error.status ?? 400, { error: error.message, code: 'BODY' }); return; }
  try {
    const out = await mutate(runtime, body);
    sendJson(res, 200, { ok: true, ...out });
  } catch (error) {
    const code = error?.code ?? 'INVALID';
    const status = code === 'LEDGER_UNAVAILABLE' ? 503 : code === 'GRANT_REQUIRED' || code === 'GRANT_SCOPE' ? 403 : code === 'IDEMPOTENCY_CONFLICT' ? 409 : 400;
    sendJson(res, status, { error: String(error?.message ?? error).slice(0, 240), code });
  }
}

// APK07 release registry administration (PC-only, owner-authorized).
// Registration binds a built+signed APK into the registry: the artifact is copied into
// <dataRoot>/apk-artifacts/ and content-addressed by SHA-256, so the caller's path is
// never served later. The release id is derived from the artifact when the caller omits it,
// which makes re-registering the same file idempotent instead of a 409 during setup retries.
const APK_REGISTER_BODY_LIMIT = 64 * 1024;
const APK_APPLICATION_ID = 'inc.vivim.app';
const apkSlug = (value, max) => String(value ?? '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-')
  .replace(/^-+|-+$/g, '').slice(0, max) || 'apk';

// UTC03 machine-readable data inventory: owner-authenticated, loopback-only,
// read-only aggregates from the existing Host bootstrap ledger (port of the
// 987d8513 route block that never reached main with its test).
function handleDataIntelligence(req, res, pathname, host, runtimeFor, tokenFor) {
  res.setHeader('cache-control', 'no-store');
  if (req.headers.origin !== undefined && String(req.headers.origin).toLowerCase() !== 'http://' + host) {
    sendJson(res, 403, { code: 'ORIGIN', error: 'Cross-origin inventory request refused' }); return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('allow', 'GET, HEAD'); sendJson(res, 405, { code: 'METHOD' }); return;
  }
  if (!ownerAuthorized(req, res, tokenFor)) return;
  let body;
  if (pathname === '/api/host/data-intelligence/summary') body = runtimeFor().dataInventory();
  else if (pathname === '/api/host/data-intelligence/registry') body = runtimeFor().dataIngressRegistry();
  else { sendJson(res, 404, { code: 'NOT_FOUND' }); return; }
  if (req.method === 'HEAD') { res.setHeader('content-type', 'application/json; charset=utf-8'); res.writeHead(200); res.end(); return; }
  sendJson(res, 200, body);
}

async function handleApk(req, res, pathname, host, apk, tokenFor) {
  const origin = req.headers.origin;
  if (origin !== undefined && String(origin).toLowerCase() !== 'http://' + host) {
    sendJson(res, 403, { error: 'Cross-origin APK request refused', code: 'ORIGIN' }); return;
  }
  if (pathname === '/api/host/apk/register') {
    if (req.method !== 'POST') { res.setHeader('allow', 'POST'); sendJson(res, 405, { error: 'POST only', code: 'METHOD' }); return; }
    if (String(req.headers['x-vivim-bootstrap'] || '') !== '1') { sendJson(res, 403, { error: 'APK action header required', code: 'CSRF' }); return; }
    if (!ownerAuthorized(req, res, tokenFor)) return;
    let body;
    try { body = await readJsonBody(req, APK_REGISTER_BODY_LIMIT); }
    catch (error) { sendJson(res, error.status ?? 400, { error: error.message, code: 'BODY' }); return; }
    const rawPath = typeof body.apkPath === 'string' ? body.apkPath.trim() : '';
    if (!rawPath) { sendJson(res, 400, { error: 'apkPath required', code: 'APK_PATH_REQUIRED' }); return; }
    const apkPath = path.resolve(rawPath);
    if (!existsSync(apkPath) || !statSync(apkPath).isFile()) { sendJson(res, 404, { error: 'APK artifact not found', code: 'APK_NOT_FOUND' }); return; }
    let sha = null;
    try { sha = createHash('sha256').update(await readFile(apkPath)).digest('hex'); }
    catch { sendJson(res, 400, { error: 'APK artifact unreadable', code: 'APK_UNREADABLE' }); return; }
    const versionCode = Number(body.versionCode) || 1;
    const versionName = typeof body.versionName === 'string' && body.versionName.trim() ? body.versionName.trim() : '1.0.0';
    const releaseId = typeof body.releaseId === 'string' && body.releaseId.trim()
      ? body.releaseId.trim()
      : `vivim-${apkSlug(versionName, 24)}-vc${versionCode}-${sha.slice(0, 8)}`;
    const existing = apk.getRelease(releaseId);
    if (existing) {
      // Same id + same bytes: already registered, report it instead of failing a retried setup.
      if (existing.artifactSha256 === sha) { sendJson(res, 200, { ok: true, registered: false, duplicate: true, release: existing }); return; }
      sendJson(res, 409, { error: 'RELEASE_ID_EXISTS', code: 'RELEASE_ID_EXISTS' }); return;
    }
    try {
      const release = apk.registerRelease({
        releaseId,
        applicationId: typeof body.applicationId === 'string' && body.applicationId.trim() ? body.applicationId.trim() : APK_APPLICATION_ID,
        versionCode,
        versionName,
        channel: typeof body.channel === 'string' && body.channel.trim() ? body.channel.trim() : 'personal',
        certSha256: typeof body.certSha256 === 'string' && body.certSha256.trim() ? body.certSha256.trim() : undefined,
        artifactPath: apkPath,
        fileName: path.basename(apkPath),
      });
      sendJson(res, 201, { ok: true, release });
    } catch (error) {
      sendJson(res, error.status ?? 400, { error: String(error?.message ?? error).slice(0, 240), code: error.code ?? 'APK_REGISTER_FAILED' });
    }
    return;
  }
  if (pathname === '/api/host/apk/releases') {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('allow', 'GET, HEAD'); sendJson(res, 405, { error: 'GET only', code: 'METHOD' }); return; }
    if (!ownerAuthorized(req, res, tokenFor)) return;
    sendJson(res, 200, { schema: 'vivim.apk-release-index/1', current: apk.getCurrent(), releases: apk.listReleases() });
    return;
  }
  if (pathname === '/api/host/apk/download') {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('allow', 'GET, HEAD'); sendJson(res, 405, { error: 'GET only', code: 'METHOD' }); return; }
    if (!ownerAuthorized(req, res, tokenFor)) return;
    const releaseId = new URL(req.url || '/', 'http://localhost').searchParams.get('releaseId');
    if (!releaseId) { sendJson(res, 400, { error: 'releaseId required', code: 'RELEASE_ID_REQUIRED' }); return; }
    let streamInfo;
    try { streamInfo = await apk.artifactStreamInfo(releaseId); }
    catch (error) { sendJson(res, error.status ?? 500, { error: String(error?.message ?? error).slice(0, 240), code: error.code ?? 'APK_DOWNLOAD_FAILED' }); return; }
    const { filePath, release, size } = streamInfo;
    res.setHeader('content-type', 'application/vnd.android.package-archive');
    res.setHeader('content-disposition', `attachment; filename="${release.fileName}"`);
    res.setHeader('content-length', String(size));
    res.setHeader('cache-control', 'private, no-store');
    res.writeHead(200);
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', () => { try { res.end(); } catch { /* ignore */ } });
    return;
  }
  sendJson(res, 404, { error: 'Unknown APK route', code: 'NOT_FOUND' });
}

// Owner-capability check shared by the private read and control routes.
function ownerAuthorized(req, res, tokenFor) {
  let ownerToken = null;
  try { ownerToken = tokenFor(); }
  catch { sendJson(res, 503, { error: 'Owner capability unavailable', code: 'OWNER_TOKEN_UNAVAILABLE' }); return false; }
  if (!verifyOwnerToken(req.headers.authorization, ownerToken)) {
    sendJson(res, 401, { error: 'Owner authorization required', code: 'OWNER_AUTH' }); return false;
  }
  return true;
}

// UTC03 desktop surface. Reads: loopback + owner token. Writes additionally require the exact
// same Origin and an explicit header, like bootstrap mutations. Execution happens only in the
// dispatcher, bound to a previously returned plan digest.
async function handleControl(req, res, pathname, host, controlFor, tokenFor, uiSessions, enrollment, runtimeFor) {
  const route = pathname.slice('/api/host/control/'.length);
  const sameOrigin = String(req.headers.origin || '').toLowerCase() === 'http://' + host;
  const isMutation = ['plan', 'interpret', 'execute', 'ui-logout', 'devices/approve', 'devices/revoke'].includes(route);
  if (route === 'ui-session') {
    // Only the native owner process or local CLI can mint a browser launch code.
    if (req.method !== 'POST') { sendJson(res, 405, { code: 'METHOD' }); return; }
    if (!sameOrigin || req.headers['x-vivim-control'] !== '1') { sendJson(res, 403, { code: 'ORIGIN_OR_CSRF' }); return; }
    if (!ownerAuthorized(req, res, tokenFor)) return;
    sendJson(res, 201, uiSessions.issue());
    return;
  }
  if (route === 'ui-exchange') {
    if (req.method !== 'POST') { sendJson(res, 405, { code: 'METHOD' }); return; }
    if (!sameOrigin || req.headers['x-vivim-control'] !== '1') { sendJson(res, 403, { code: 'ORIGIN_OR_CSRF' }); return; }
    try {
      const body = await readJsonBody(req, 4096);
      if (!body || Object.keys(body).length !== 1 || typeof body.code !== 'string') {
        sendJson(res, 400, { code: 'CONTROL_INPUT_INVALID' }); return;
      }
      const session = uiSessions.exchange(body.code);
      res.setHeader('set-cookie', UI_COOKIE + '=' + session.sessionId +
        '; HttpOnly; SameSite=Strict; Path=/api/host/control; Max-Age=' + session.maxAge);
      sendJson(res, 200, { schema: 'vivim.control-ui-session/1', csrf: session.csrf, expiresAt: session.expiresAt });
    } catch (e) { sendJson(res, e.status || 400, { code: e.code || 'CONTROL_UI_INVALID' }); }
    return;
  }
  if (route === 'ui-state') {
    if (req.method !== 'GET') { sendJson(res, 405, { code: 'METHOD' }); return; }
    if (req.headers.origin && !sameOrigin) { sendJson(res, 403, { code: 'ORIGIN' }); return; }
    const session = uiSessions.get(req);
    if (!session) { sendJson(res, 401, { code: 'OWNER_AUTH' }); return; }
    sendJson(res, 200, { schema: 'vivim.control-ui-session/1',
      csrf: session.csrf, expiresAt: session.expiresAt });
    return;
  }
  let authorized = false;
  let owner = null;
  try { owner = tokenFor(); } catch { /* checked below; no token is leaked */ }
  if (owner && verifyOwnerToken(req.headers.authorization, owner)) authorized = true;
  if (!authorized && uiSessions.authorized(req, { mutate: isMutation })) authorized = true;
  if (!authorized) { sendJson(res, 401, { code: 'OWNER_AUTH', error: 'Owner authorization required' }); return; }
  // Private read-only web memory: identical Host read model as the paired phone.
  // The existing owner token or short-lived HttpOnly control cookie is mandatory.
  if (route === 'web-memory') {
    if (req.method !== 'GET') { sendJson(res, 405, { code: 'METHOD' }); return; }
    if (req.headers.origin !== undefined && !sameOrigin) { sendJson(res, 403, { code: 'ORIGIN' }); return; }
    try {
      const params = readMemoryParams(new URL(req.url, 'http://' + host).searchParams);
      sendJson(res, 200, await runtimeFor().webMemory(params));
    } catch (error) {
      sendJson(res, 400, { code: error?.code ?? 'WEB_QUERY_INVALID', error: 'Invalid memory filter' });
    }
    return;
  }
  // Desktop owner's short-lived authenticated session may manage devices.
  // A phone bearer or unpaired QR code cannot enter these PC-only routes.
  if (route === 'devices') {
    if (req.method !== 'GET') { sendJson(res, 405, { code: 'METHOD' }); return; }
    sendJson(res, 200, { schema: 'vivim.devices/1', grants: enrollment.listGrants() });
    return;
  }
  if (route === 'devices/approve' || route === 'devices/revoke') {
    if (req.method !== 'POST') { sendJson(res, 405, { code: 'METHOD' }); return; }
    if (!sameOrigin || req.headers['x-vivim-control'] !== '1') {
      sendJson(res, 403, { code: 'ORIGIN_OR_CSRF' }); return;
    }
    // Legacy direct-mutation endpoints are deliberately non-executable:
    // device management now follows the same typed plan → R2 PC approval →
    // claimed-effect journal → durable receipt as every other Host action.
    sendJson(res, 409, { code: 'CONTROL_ACTION_PLAN_REQUIRED',
      actionId: route === 'devices/approve' ? 'devices.approve' : 'devices.revoke' });
    return;
  }
  if (route === 'ui-logout') {
    if (req.method !== 'POST') { sendJson(res, 405, { code: 'METHOD' }); return; }
    if (!sameOrigin || req.headers['x-vivim-control'] !== '1') { sendJson(res, 403, { code: 'ORIGIN_OR_CSRF' }); return; }
    uiSessions.revoke(req);
    res.setHeader('set-cookie', UI_COOKIE + '=; HttpOnly; SameSite=Strict; Path=/api/host/control; Max-Age=0');
    sendJson(res, 200, { revoked: true });
    return;
  }
  const reads = { catalog: c => c.describe(), world: c => c.world(), language: c => c.languagePack(), lexicon: c => c.lexicon(), recent: c => ({ items: c.recent(20) }) };
  const planMatch = route.match(/^plans\/(ctl-[a-f0-9]{16})$/);
  try {
    if (reads[route] || planMatch) {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('allow', 'GET, HEAD'); sendJson(res, 405, { error: 'GET only', code: 'METHOD' }); return; }
      if (req.headers.origin !== undefined && String(req.headers.origin).toLowerCase() !== 'http://' + host) { sendJson(res, 403, { error: 'Cross-origin request refused', code: 'ORIGIN' }); return; }
      sendJson(res, 200, planMatch ? controlFor().status(planMatch[1]) : reads[route](controlFor())); return;
    }
    if (!['interpret', 'plan', 'execute'].includes(route)) { sendJson(res, 404, { error: 'Unknown control route', code: 'NOT_FOUND' }); return; }
    if (req.method !== 'POST') { res.setHeader('allow', 'POST'); sendJson(res, 405, { error: 'POST only', code: 'METHOD' }); return; }
    if (String(req.headers.origin || '').toLowerCase() !== 'http://' + host || String(req.headers['x-vivim-control'] || '') !== '1') {
      sendJson(res, 403, { error: 'Same-origin control header required', code: 'ORIGIN_OR_CSRF' }); return;
    }
    const body = await readJsonBody(req, 64 * 1024);
    const c = controlFor();
    if (route === 'interpret') {
      if (Object.keys(body).some(k => k !== 'text')) throw Object.assign(new Error('Invalid body'), { code: 'CONTROL_INPUT_INVALID' });
      sendJson(res, 200, c.interpret(body.text)); return;
    }
    if (route === 'plan') { sendJson(res, 200, c.plan(body, { source: 'desktop', actor: 'desktop-owner' })); return; }
    if (Object.keys(body).some(k => !['planId', 'planDigest'].includes(k))) throw Object.assign(new Error('Invalid body'), { code: 'CONTROL_INPUT_INVALID' });
    sendJson(res, 200, c.execute({ planId: body.planId, planDigest: body.planDigest, approval: { channel: 'desktop-owner-token', actor: 'desktop-owner' } }));
  } catch (error) {
    const code = error?.code ?? 'CONTROL_INVALID';
    sendJson(res, error?.status ?? controlErrorStatus(code), { error: String(error?.message ?? error).slice(0, 200), code });
  }
}

// First-run onboarding: state (prereqs + manifest), setup (studio setup), start (vivim start),
// verify (doctor). All run on this PC against the owner's installed Chrome profile.
async function handleOnboarding(req, res, pathname, apk, pairing, onboarding, enrollment) {
  const studioCli = STUDIO_CLI;
  const send = (status, body) => sendJson(res, status, body);
  const fail = (status, message, code = 'INVALID') => send(status, { ok: false, error: message, code });

  if (pathname === '/api/onboarding/state') {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('allow', 'GET'); return fail(405, 'GET only', 'METHOD'); }
    return send(200, { ok: true, ...onboardingState(), onboarding: await onboarding.status() });
  }

  if (pathname === '/api/onboarding/setup') {
    if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return fail(405, 'POST only', 'METHOD'); }
    let body;
    try { body = await readJsonBody(req); } catch (e) { return fail(e.status ?? 400, e.message, 'BODY'); }
    const { workspaceRoot, chromeExe, chromeProfile, cdpPort } = body || {};
    if (!workspaceRoot || !chromeExe || !chromeProfile) return fail(400, 'workspaceRoot, chromeExe and chromeProfile are required.');
    const port = Number(cdpPort) || 38702;
    const out = await runCommand(process.execPath, [
      studioCli, 'setup', '--yes',
      '--workspace-root', workspaceRoot,
      '--chrome-exe', chromeExe,
      '--chrome-profile', chromeProfile,
      '--cdp-port', String(port)
    ]);
    if (!out.ok) return fail(500, 'studio setup failed: ' + (out.stderr || out.stdout || String(out.code)), 'SETUP_FAILED');
    return send(200, { ok: true, manifestFile: manifestFile(), stdout: out.stdout, stderr: out.stderr });
  }

  if (pathname === '/api/onboarding/start') {
    if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return fail(405, 'POST only', 'METHOD'); }
    const mf = manifestFile();
    let dataDir = 'C:\\VIVIM';
    try {
      const m = JSON.parse(readFileSync(mf, 'utf8'));
      if (m && m.workspaceRoot) dataDir = m.workspaceRoot;
    } catch { /* use default */ }
    const ps1 = path.join(REPO_ROOT, 'studio', 'scripts', 'windows', 'VIVIM.ps1');
    const out = await runCommand('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, '-DataDir', dataDir]);
    if (!out.ok) return fail(500, 'vivim start failed: ' + (out.stderr || out.stdout || String(out.code)), 'START_FAILED');
    return send(200, { ok: true, stdout: out.stdout, stderr: out.stderr });
  }

  if (pathname === '/api/onboarding/doctor') {
    if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return fail(405, 'POST only', 'METHOD'); }
    const out = await runCommand(process.execPath, [studioCli, 'doctor', '--json']);
    let report;
    try { report = JSON.parse(out.stdout || '{}'); } catch { report = { ok: false, raw: out.stdout, stderr: out.stderr }; }
    report.ok = report.ok && out.ok;
    if (!out.ok) report.error = out.stderr || out.stdout || String(out.code);
    return send(200, { ok: out.ok, report });
  }

  // Unauthenticated DEV onboarding route (consistent with setup/start/doctor): register
  // the built APK so the paired phone can download it. No bearer token — the wizard runs
  // as the owner on this PC. Shares the same <dataRoot>/apk-artifacts registry as
  // /api/host/apk/register, so a release registered here is immediately downloadable.
  if (pathname === '/api/onboarding/apk/register') {
    if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return fail(405, 'POST only', 'METHOD'); }
    let body;
    try { body = await readJsonBody(req); } catch (e) { return fail(e.status ?? 400, e.message, 'BODY'); }
    const rawPath = typeof body.apkPath === 'string' ? body.apkPath.trim() : '';
    if (!rawPath) return fail(400, 'apkPath required', 'APK_PATH_REQUIRED');
    const apkPath = path.resolve(rawPath);
    if (!existsSync(apkPath) || !statSync(apkPath).isFile()) return fail(404, 'APK artifact not found', 'APK_NOT_FOUND');
    let sha;
    try { sha = createHash('sha256').update(await readFile(apkPath)).digest('hex'); }
    catch { return fail(400, 'APK artifact unreadable', 'APK_UNREADABLE'); }
    const versionCode = Number(body.versionCode) || 1;
    const versionName = typeof body.versionName === 'string' && body.versionName.trim() ? body.versionName.trim() : '1.0.0';
    const releaseId = typeof body.releaseId === 'string' && body.releaseId.trim()
      ? body.releaseId.trim()
      : `vivim-${String(versionName).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24) || 'apk'}-vc${versionCode}-${sha.slice(0,8)}`;
    const existing = apk.getRelease(releaseId);
    if (existing) {
      if (existing.artifactSha256 === sha) { return send(200, { ok: true, registered: false, duplicate: true, release: existing, downloadUrl: '/api/onboarding/apk/download?releaseId=' + releaseId }); }
      return fail(409, 'RELEASE_ID_EXISTS', 'RELEASE_ID_EXISTS');
    }
    try {
      const release = apk.registerRelease({
        releaseId,
        applicationId: typeof body.applicationId === 'string' && body.applicationId.trim() ? body.applicationId.trim() : 'inc.vivim.app',
        versionCode,
        versionName,
        channel: typeof body.channel === 'string' && body.channel.trim() ? body.channel.trim() : 'personal',
        certSha256: typeof body.certSha256 === 'string' && body.certSha256.trim() ? body.certSha256.trim() : undefined,
        artifactPath: apkPath,
        fileName: path.basename(apkPath),
      });
      return send(201, { ok: true, release, downloadUrl: '/api/onboarding/apk/download?releaseId=' + releaseId });
    } catch (error) {
      return fail(error.status ?? 400, String(error?.message ?? error).slice(0, 240), error.code ?? 'APK_REGISTER_FAILED');
    }
  }

  // Unauthenticated DEV onboarding route: download a registered APK artifact (digest-verified).
  if (pathname === '/api/onboarding/apk/download') {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('allow', 'GET, HEAD'); return fail(405, 'GET only', 'METHOD'); }
    const releaseId = new URL(req.url || '/', 'http://localhost').searchParams.get('releaseId');
    if (!releaseId) return fail(400, 'releaseId required', 'RELEASE_ID_REQUIRED');
    let streamInfo;
    try { streamInfo = await apk.artifactStreamInfo(releaseId); }
    catch (error) { return fail(error.status ?? 500, String(error?.message ?? error).slice(0, 240), error.code ?? 'APK_DOWNLOAD_FAILED'); }
    const { filePath, release, size } = streamInfo;
    res.setHeader('content-type', 'application/vnd.android.package-archive');
    res.setHeader('content-disposition', `attachment; filename="${release.fileName}"`);
    res.setHeader('content-length', String(size));
    res.setHeader('cache-control', 'private, no-store');
    res.writeHead(200);
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', () => { try { res.end(); } catch { /* ignore */ } });
    return;
  }

  // Unauthenticated DEV onboarding routes: phone pairing (APK07). The PC wizard mints a
  // short-lived single-use token, renders it as a QR code, and polls pair-status until the
  // phone redeems it. No bearer token — the wizard runs as the owner on this PC.
  if (pathname === '/api/onboarding/pair-status') {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('allow', 'GET, HEAD'); return fail(405, 'GET only', 'METHOD'); }
    const grants = enrollment.listGrants();
    const active = grants.find(g => g.status === 'active' && !g.revokedAt);
    const pending = grants.filter(g => g.status === 'pending').length;
    return send(200, { ok: true, paired: Boolean(active), deviceId: active?.deviceId ?? null, pendingApprovals: pending });
  }

  if (pathname === '/api/onboarding/pair/register') {
    if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return fail(405, 'POST only', 'METHOD'); }
    const { token, expiresAt } = pairing.createToken();
    return send(201, { ok: true, token, expiresAt });
  }


  // Owner-initiated guided onboarding, separate from unchanged APK and pairing endpoints.
  const guided = {
    '/api/onboarding/provider/open': body => onboarding.openSignIn(body.provider),
    '/api/onboarding/provider/check': body => onboarding.check(body.provider),
    '/api/onboarding/primary': body => ({ primary: onboarding.setPrimary(body.provider) }),
    '/api/onboarding/personalize/review': () => onboarding.review(),
    '/api/onboarding/personalize/approve': async body => {
      const result = onboarding.approveAndStart({ generationId: body.generationId });
      void onboarding.pump();
      return result;
    }
  };
  if (guided[pathname]) {
    if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return fail(405, 'POST only', 'METHOD'); }
    if (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host)
      return fail(403, 'Cross-origin request refused', 'ORIGIN');
    if (String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase() !== 'application/json')
      return fail(415, 'JSON required', 'CONTENT_TYPE');
    let body;
    try { body = await readJsonBody(req); } catch(error) { return fail(error.status || 400, error.message, 'BODY'); }
    try { return send(200, { ok: true, ...(await guided[pathname](body || {})) }); }
    catch(error) { return fail(error?.code === 'STUDIO_UNAVAILABLE' ? 503 : 400, String(error.message || error).slice(0, 240), String(error.code || 'ONBOARDING_FAILED')); }
  }

  return fail(404, 'Unknown onboarding route', 'NOT_FOUND');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.VIVIM_HOST_PORT || 43187);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('VIVIM_HOST_PORT must be 1024..65535');
  const dataRoot = studioDataDir();
  // The real process is the single trusted local writer: it opens the ledger, loads the
  // owner capability and supervises one worker per role with a verified lease.
  // Tests construct their own server and never start this worker.
  const runtime = createBootstrapRuntime({ dataRoot });
  const worker = createBootstrapCommandWorker({
    root: dataRoot, runtime,
    log: (line) => console.log('[bootstrap] ' + line),
  });
  let ownerToken = null;
  try {
    const loaded = loadOwnerToken({ dataRoot });
    ownerToken = loaded.token;
    console.log(`Owner capability: ${loaded.source === 'env' ? 'VIVIM_BOOTSTRAP_TOKEN' : loaded.path}`);
  } catch (error) {
    console.log('Owner capability unavailable: ' + String(error?.message ?? error));
  }
  const directPhone = process.env.VIVIM_DIRECT_ORIGIN || process.env.VIVIM_DIRECT_USER
    ? { origin: process.env.VIVIM_DIRECT_ORIGIN, user: process.env.VIVIM_DIRECT_USER } : null;
  const studioUrl = process.env.VIVIM_STUDIO_URL || 'http://127.0.0.1:7878';
  const server = createHostServer({ dataRoot, bootstrap: runtime, ownerToken, directPhone, worker, studioUrl, studioToken: process.env.VIVIM_STUDIO_TOKEN || null, autoPump: true });
  server.listen(port, '127.0.0.1', () => console.log(`VIVIM Host preview: http://127.0.0.1:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => { server.close(() => process.exit(0)); });
  }
}
