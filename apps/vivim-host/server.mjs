// VIVIM Host M0: read-only loopback preview. No browser control, worker starts, or sends.
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { appendFile, readFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { nativeOwnerProof } from './bootstrap/native-owner-proof.mjs';
import { fileURLToPath } from 'node:url';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { workerHealth, messageJourney } from './diagnostics.mjs';
import { projectHostRecovery, projectHostRecoveryNative } from './recovery/host-adapter.mjs';
import { workspaceManifestFile } from '../../studio/src/config.mjs';
import { MANIFEST_FILE, MANIFEST_SCHEMA, MANIFEST_VERSION } from '../../studio/src/workspace-manifest.mjs';
import { diagnoseHost } from './insights.mjs';
import { createBootstrapRuntime } from './bootstrap/runtime.mjs';
import { readMemoryParams } from './bootstrap/web-memory.mjs';
import { createMediaPlaybackService } from './media/playback.mjs';
import { createMediaLanguageService } from './media/language-service.mjs';
import { createBootstrapCommandWorker } from './bootstrap/command-worker.mjs';
import { createWorkerSupervisor } from './bootstrap/worker-supervisor.mjs';
import { loadOwnerToken, verifyOwnerToken } from './bootstrap/owner-auth.mjs';
import { createDirectPhoneHandler, serveLoopbackPhoneAsset } from './direct-phone.mjs';
import { createRustChatContext } from './chat/rust-context.mjs';
import {createLiveStateProjection} from './conversations/live-projection.mjs';
import { createProductJournal, projectAppliedControlEffects } from './chat/product-journal.mjs';
import { projectWikiSemantics } from './chat/wiki-semantics.mjs';
import { createEnrollment } from './apk/enrollment.mjs';
import { createApkRegistry } from './apk/registry.mjs';
import { createPairingStore } from './apk/pairing.mjs';
import { createControlDispatcher } from './control/dispatcher.mjs';
import { buildUniversalApi, readIntegrationTargets, searchUniversalApi, describeUniversalCapability, describeCapabilitySources } from './control/universal-api.mjs';
import { createControlBrowserSessions, UI_COOKIE } from './control/browser-session.mjs';
import { createOnboardingService } from './onboarding/service.mjs';
import { createStudioPort, defaultStudioOrigin } from './onboarding/studio-port.mjs';
import { detectEnvironment } from './onboarding/environment.mjs';
import { controlErrorStatus } from './control/http-status.mjs';
import { createLiveSourceSurface } from './control/live-source-surface.mjs';
import { createLiveSystemReadPort } from './control/live-system-read-port.mjs';
import { createFirstContactLiveSource } from './control/first-contact-live-source.mjs';
import { createLiveSystemFileMirror } from './control/live-system-file-mirror.mjs';
import { createLiveSystemDeltaFeed } from './control/live-system-delta-feed.mjs';
import { createHostComposerBridge } from './control/agent-composer-bridge.mjs';
import { createDevelopmentReadPort } from './control/development-read-port.mjs';
import { attachRequestContext } from './control/request-context.mjs';
import { composerResponse, needsWikiDraftContext } from '../mobile-relay/composer-assist.mjs';

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
  '/host/control': 'text/html; charset=utf-8',
  '/mobile-first.css': 'text/css; charset=utf-8',
  '/mobile-first.js': 'text/javascript; charset=utf-8',
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
  '/chat': 'text/html; charset=utf-8',
  '/wiki': 'text/html; charset=utf-8',
  '/chat.js': 'text/javascript; charset=utf-8',
  '/wiki.js': 'text/javascript; charset=utf-8',
  '/chat.css': 'text/css; charset=utf-8',
  '/wiki.css': 'text/css; charset=utf-8',
};
const ASSETS = {
  '/': 'mobile-first.html',
  '/host/control': 'index.html',
  '/mobile-first.css': 'mobile-first.css',
  '/mobile-first.js': 'mobile-first.js',
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
  '/chat': 'pages/chat.html',
  '/wiki': 'pages/wiki.html',
  '/chat.js': 'pages/chat.js',
  '/wiki.js': 'pages/wiki.js',
  '/chat.css': 'pages/chat.css',
  '/wiki.css': 'pages/wiki.css',
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

export function createHostServer({ dataRoot = studioDataDir(), staticRoot = path.join(here, 'public'), bootstrap = null, ownerToken = null, directPhone = null, worker = null, studioUrl = null, studioToken = null, onboarding = null, autoPump = false, developmentSources = null } = {}) {
  // Owner-local initialization preserves existing journal replay; new workspaces are empty.
  const productJournal = createProductJournal({ dataRoot });
  let runtime = bootstrap;
  let token = ownerToken;
  const runtimeFor = () => {
    if (!runtime) runtime = createBootstrapRuntime({ dataRoot });
    return runtime;
  };
  const firstContactSource = createFirstContactLiveSource({dataRoot});
  const liveSystemMirror = createLiveSystemFileMirror({dataRoot});
  const liveSystem = createLiveSystemReadPort({
    readWiki: () => productJournal.readProjection(),
    readPhoneObservations: () => firstContactSource.read(),
    readComposerObservations: () => composerBridge.observation(),
    readStatus: () => hostSnapshot({dataRoot,bootstrap:runtimeFor()})
  });
  // A bounded cursor is a transport projection over the SAME Rust live state,
  // not a second source of truth. Real PWA observations wake owner subscribers.
  const liveSystemFeed=createLiveSystemDeltaFeed();
  const readPublishedLiveSystem=async()=>{
    const observed=await liveSystem.snapshot();
    liveSystemFeed.publish(observed);
    return observed;
  };
  const composerBridge=createHostComposerBridge({
    readSnapshot:readPublishedLiveSystem,
    onVerifiedSnapshot:async state=>{
      liveSystemFeed.publish(state);
      await liveSystemMirror.publish(state);
    }
  });
  const tokenFor = () => {
    if (token) return token;
    token = loadOwnerToken({ dataRoot }).token;
    return token;
  };
  const supervisor = createWorkerSupervisor({
    dataRoot,
    // Feed the supervisor the Host's existing read-only native worker probe
    // (diagnostics.mjs). Roles without a probe stay "missing evidence", which is
    // never reported as a worker failure.
    diagnostics: role => (role === 'relay' || role === 'chatWorker') ? workerHealth(dataRoot, role) : null,
  });
  if (worker) {
    // Lease admission precedes the poller. Only the admitted Host may run the
    // bootstrap command loop: a role already owned by another live Host must not
    // start a second poller, and an uncertain lease is never implicitly resumed.
    const admitted = supervisor.takeover('bootstrap', process.pid);
    if (admitted.state === 'started') worker.start();
  }
  // One Host-owned control dispatcher for desktop text, phone text and GUI (UTC03).
  let control = null;
  const uiSessions = createControlBrowserSessions();
  const controlFor = () => (control ??= createControlDispatcher({ dataRoot, runtime: runtimeFor(), devices: enrollment, productJournal, composerBridge }));
  const nativeContext = createRustChatContext({dataRoot:path.resolve(dataRoot),productJournal,control:controlFor});
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
  // Reuse the existing mapped media identity and streaming authority. The
  // language worker does not register a second file catalog or HTTP listener.
  const mediaPlayback = directPhone?.mediaPlayback ?? createMediaPlaybackService();
  const mediaLanguage = directPhone ? createMediaLanguageService({ dataRoot:path.resolve(dataRoot), media:mediaPlayback }) : null;
  const direct = directPhone ? createDirectPhoneHandler({
    ...directPhone, dataRoot, worldId: runtimeFor().worldId,
    projection: () => runtimeFor().projection(),
    webMemory: opts => runtimeFor().webMemory(opts),
    chatContext: nativeContext,
    providerSnapshot: () => onboardingService.providerSnapshot(),
    providerRefresh: async (selected = null) => {
      // Studio owns the browser. An explicit selected draft checks ONLY that
      // account; full discovery retains the existing serial six-site probe.
      const known=['chatgpt','claude','gemini','qwen','zai','deepseek'];
      if(selected!==null&&!known.includes(selected))throw new Error('INVALID_PROVIDER');
      for(const id of selected===null?known:[selected]){
        try {await onboardingService.check(id)}catch{ /* a failed probe never becomes signed-in */ }
      }
      return onboardingService.providerSnapshot();
    },
    control: controlFor, wikiProjection: () => productJournal.readPhoneWiki(),
    composerBridge,
    mediaPlayback, mediaLanguage,
    apkRegistry: apk, pairingStore: pairing,
    onPhoneSeen: () => onboardingService.phoneSeen(),
    primary: () => onboardingService.primary()
  }) : null;
  const enrollment = createEnrollment({ dataRoot, origin: null, user: null });
  const server = http.createServer(async (req, res) => {
    for (const [k, v] of Object.entries(SECURITY)) res.setHeader(k, v);
    const rawPath = String(req.url || '').split('?')[0];
    const host = String(req.headers.host || '').toLowerCase();
    const localHost = /^(127\.0\.0\.1|localhost)(:\d{1,5})?$/.test(host) &&
      !req.headers['x-forwarded-proto'] && !req.headers['tailscale-user-login'];
    // The desktop PWA preview must win only for an actual loopback peer. Trusted
    // Tailscale Serve requests still enter the original Direct phone handler.
    const loopbackPeer = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
    if (direct && (rawPath === '/mobile' || rawPath.startsWith('/mobile/')) && !(localHost && loopbackPeer)) {
      await direct(req, res); return;
    }
    if (!localHost || !loopbackPeer) { res.writeHead(403); res.end('Forbidden'); return; }
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    // Loopback-only presentation of the *same* PWA source served to paired phones.
    // The embedded host-preview cannot obtain a phone device grant or send commands.
    if (pathname === '/mobile') {
      res.writeHead(308, { location: '/mobile/?host-preview=1' }); res.end(); return;
    }
    if (await serveLoopbackPhoneAsset(req, res, pathname)) return;
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
      await handleControl(req, res, pathname, host, controlFor, tokenFor, uiSessions, enrollment, runtimeFor, productJournal, nativeContext, developmentSources);
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
      await handleOnboarding(req, res, pathname, apk, pairing, onboardingService, enrollment, host, tokenFor, dataRoot);
      return;
    }
    // Retired development surfaces have no static asset or mutation fallback.
    if (pathname === '/demo' || pathname.startsWith('/demo/')) {
      sendJson(res, 404, { code: 'NOT_FOUND' }); return;
    }
    // The one product journal records chat and authorized Wiki edits.
    // A declared actor / loopback Origin is NOT an owner capability.
    if (pathname === '/api/mutate' && req.method === 'POST') {
      let payload;
      try { payload = await readJsonBody(req, 4096); }
      catch (error) { sendJson(res, error.status ?? 400, { code: 'MUTATION_BODY', error: error.message }); return; }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        sendJson(res, 400, { code: 'MUTATION_ENVELOPE' }); return;
      }
      if (req.headers.origin && String(req.headers.origin).toLowerCase() !== 'http://' + host) {
        sendJson(res, 403, { code: 'ORIGIN', error: 'Cross-origin mutation refused' }); return;
      }
      let entry;
      if (Object.hasOwn(payload, 'kind')) {
        // Journal module validates a strict schema/actor/field allowlist for every kind.
        if (['gate-decision', 'feedback-round'].includes(payload.kind)) {
          sendJson(res, 410, { code: 'LEGACY_FEEDBACK_RETIRED' }); return;
        }
        if (!['chat-send', 'wiki-edit'].includes(payload.kind)) {
          sendJson(res, 400, { code: 'MUTATION_KIND' }); return;
        }
        if (Object.hasOwn(payload, 'receivedAt') || Object.hasOwn(payload, 'entryId') ||
            Object.hasOwn(payload, 'sequence')) {
          sendJson(res, 400, { code: 'MUTATION_SERVER_FIELDS' }); return;
        }
        entry = payload;
        if (entry.kind === 'chat-send') {
          // Call the canonical in-process, PURE interpreter only after rejecting
          // caller-provided IR. This never plans or executes a Host effect.
          if (Object.hasOwn(entry, 'intent') || typeof entry.text !== 'string' ||
              !entry.text.trim() || entry.text.length > 1000 ||
              entry.schemaVersion !== 1 ||
              !['human', 'ai', 'owner-browser', 'loop-agent'].includes(entry.actor) ||
              Object.keys(entry).some(k => !['kind', 'actor', 'schemaVersion', 'text'].includes(k))) {
            sendJson(res, 400, { code: 'CHAT_ENVELOPE' }); return;
          }
          try { entry = { ...entry, intent: controlFor().interpret(entry.text) }; }
          catch (error) {
            sendJson(res, controlErrorStatus(error?.code ?? 'CONTROL_INVALID'),
              { code: error?.code ?? 'CONTROL_INVALID', error: 'Chat interpretation failed' }); return;
          }
        }
      } else {
        sendJson(res, 400, { code: 'MUTATION_ENVELOPE' }); return;
      }
      if (entry.kind === 'wiki-edit') {
        if(entry.edit?.action!=='set-section'){sendJson(res,400,{code:'CAPTURE_REQUIRES_CONTROL_PLAN'});return;}
        // Both browser CSRF and the Host's EXISTING owner capability are required.
        // For an owner-browser session, the HttpOnly cookie + x-vivim-ui-csrf
        // must match the same session minted by /api/host/control/ui-exchange.
        // An actor string or x-vivim-control header alone grants NOTHING.
        if (String(req.headers.origin || '').toLowerCase() !== 'http://' + host ||
            req.headers['x-vivim-control'] !== '1') {
          sendJson(res, 403, { code: 'ORIGIN_OR_CSRF' }); return;
        }
        let owner;
        try { owner = tokenFor(); }
        catch { sendJson(res, 503, { code: 'OWNER_TOKEN_UNAVAILABLE' }); return; }
        if (!verifyOwnerToken(req.headers.authorization, owner) &&
            !uiSessions.authorized(req, { mutate: true })) {
          sendJson(res, 401, { code: 'OWNER_AUTH' }); return;
        }
      }
      try {
        const stored = await productJournal.append(entry);
        sendJson(res, 200, stored);
      } catch (error) {
        sendJson(res, Number.isInteger(error?.status) ? error.status : 500,
          { code: error?.status === 409 ? 'REVISION_CONFLICT' : 'PRODUCT_JOURNAL_REFUSED',
            error: String(error?.message || 'Product journal append failed') });
      }
      return;
    }
    // Development source is owner-private, even on loopback. There is no
    // browser-selected filesystem root and no demo fallback, including on HQ failure.
    if (['/api/file-surface', '/api/file-surface/context', '/api/file-surface/index'].includes(pathname)) {
      const indexing = pathname.endsWith('/index');
      const context = pathname.endsWith('/context');
      if (indexing ? req.method !== 'POST' : !['GET','HEAD'].includes(req.method)) {
        res.setHeader('allow', indexing ? 'POST' : 'GET, HEAD');
        sendJson(res, 405, { code: 'METHOD' }); return;
      }
      const sameOrigin = String(req.headers.origin || '').toLowerCase() === 'http://' + host;
      if ((req.headers.origin !== undefined && !sameOrigin) ||
          (indexing && (!sameOrigin || req.headers['x-vivim-control'] !== '1'))) {
        sendJson(res, 403, { code: 'ORIGIN_OR_CSRF' }); return;
      }
      let bearer = false;
      try { bearer = verifyOwnerToken(req.headers.authorization, tokenFor()); } catch { /* session may still be valid */ }
      const session = uiSessions.get(req);
      const sessionOk = session && uiSessions.authorized(req, { mutate: indexing });
      if (!bearer && !sessionOk) { sendJson(res, 401, { code: 'OWNER_AUTH' }); return; }
      const empty = { schema: 'vivim.file-surface/1', generatorVersion: 'hq.source-index/1',
        status: 'unavailable', authority: 'read_only_projection', truncated: false, files: [] };
      try {
        const config = developmentSources ?? {
          approvedRoots: JSON.parse(process.env.VIVIM_HQ_APPROVED_ROOTS || '[]'),
          dataDir: process.env.VIVIM_HQ_DATA_DIR || undefined
        };
        const actorId = 'desktop-owner';
        const sessionId = bearer ? 'owner-token' : session.sessionId;
        const surface = await createLiveSourceSurface({
          approvedRoots: config.approvedRoots, dataDir: config.dataDir, actorId, sessionId,
          authorize: request => request.actorId === actorId && request.sessionId === sessionId &&
            request.domain === 'development' && ['source.read','source.context',
              ...(indexing ? ['source.index'] : [])].includes(request.operation) &&
            (bearer || uiSessions.authorized(req, { mutate: indexing }))
        });
        const params = new URL(req.url, 'http://' + host).searchParams;
        const project = params.get('project') ?? undefined;
        const query = params.get('q') ?? '';
        const sourcePath = params.get('path') ?? undefined;
        const task = params.get('task') ?? '';
        const anchorId=params.get('anchor')??undefined, fingerprint=params.get('fingerprint')??undefined;
        if (query.length > 240 || task.length > 1000 || (project?.length ?? 0) > 128 ||
            (sourcePath?.length ?? 0) > 512 || (context && (!project || !sourcePath)) ||
            ((anchorId!==undefined||fingerprint!==undefined)&&(!context||!/^hq:file-anchor:[a-f0-9]{64}$/.test(anchorId||'')||! /^[a-f0-9]{64}$/.test(fingerprint||'')))) {
          sendJson(res, 400, { code: 'HQ_SOURCE_QUERY_INVALID' }); return;
        }
        const value = indexing ? surface.refresh()
          : context ? surface.context({ project, path: sourcePath, task,anchorId,fingerprint })
          : surface.read({ project, query, path: sourcePath, limit: params.get('limit') ?? undefined });
        if(!bearer&&!uiSessions.authorized(req,{mutate:indexing})){sendJson(res,401,{code:'OWNER_AUTH'});return;}
        res.setHeader('cache-control','private, no-store');
        sendJson(res, 200, value);
      } catch {
        // No credentials, local paths, exception text or old source content in failure responses.
        sendJson(res, 503, context ? { schema: 'vivim.source-context/1', status: 'unavailable', context: null }
          : indexing ? { status: 'unavailable', code: 'HQ_UNAVAILABLE' } : empty);
      }
      return;
    }
    if(pathname==='/api/host/live-system/changes'){
      if(req.method!=='GET'){
        res.setHeader('allow','GET');sendJson(res,405,{code:'METHOD'});return;
      }
      if(req.headers.origin!==undefined&&
         String(req.headers.origin).toLowerCase()!=='http://'+host){
        sendJson(res,403,{code:'ORIGIN'});return;
      }
      if(!ownerAuthorized(req,res,tokenFor))return;
      res.setHeader('cache-control','private, no-store');
      try{
        const params=new URL(req.url||'/', 'http://localhost').searchParams;
        if([...params.keys()].some(k=>!['epoch','after','wait'].includes(k))||
           [...params.keys()].some(k=>params.getAll(k).length!==1))
          throw Object.assign(Error('LIVE_FEED_CURSOR_INVALID'),{status:400});
        const epoch=params.get('epoch'),rawAfter=params.get('after'),
          rawWait=params.get('wait');
        if((epoch===null)!==(rawAfter===null)||
           (rawAfter!==null&&!/^(0|[1-9][0-9]{0,15})$/.test(rawAfter))||
           (rawWait!==null&&!/^(0|[1-9][0-9]{0,4})$/.test(rawWait)))
          throw Object.assign(Error('LIVE_FEED_CURSOR_INVALID'),{status:400});
        const after=rawAfter===null?null:Number(rawAfter);
        const waitMs=rawWait===null?0:Number(rawWait);
        if((after!==null&&!Number.isSafeInteger(after))||
           !Number.isSafeInteger(waitMs)||waitMs<0||waitMs>15000)
          throw Object.assign(Error('LIVE_FEED_CURSOR_INVALID'),{status:400});
        await readPublishedLiveSystem();
        const result=await liveSystemFeed.changes({epoch,after,waitMs});
        sendJson(res,200,result);
      }catch(error){
        sendJson(res,[400,409,429,503].includes(error?.status)?error.status:503,
          {schema:'vivim.host-live-system-changes/1',state:'unavailable',
            code:typeof error?.code==='string'?error.code:'LIVE_FEED_UNAVAILABLE'});
      }
      return;
    }
    if(pathname==='/api/host/live-system/proposal/rebase'){
      if(req.method!=='POST'){res.setHeader('allow','POST');sendJson(res,405,{code:'METHOD'});return;}
      if(String(req.headers.origin||'').toLowerCase()!=='http://'+host||
         req.headers['x-vivim-control']!=='1'){
        sendJson(res,403,{code:'ORIGIN_OR_CSRF'});return;
      }
      if(!ownerAuthorized(req,res,tokenFor))return;
      res.setHeader('cache-control','private, no-store');
      try{
        const body=await readJsonBody(req,1024);
        if(!body||Object.keys(body).some(k=>!['expectedSequence','discardPending'].includes(k))||
           body.discardPending!==true||!Number.isSafeInteger(body.expectedSequence)){
          sendJson(res,400,{code:'LIVE_MIRROR_REBASE_INPUT'});return;
        }
        await liveSystemMirror.publish(await readPublishedLiveSystem());
        const result=await liveSystemMirror.rebaseProposal(body);
        sendJson(res,200,result);
      }catch(error){
        sendJson(res,[400,409,503].includes(error.status)?error.status:409,
          {code:error?.code??'LIVE_MIRROR_REBASE_REFUSED',executionAuthorized:false,effectPerformed:false});
      }
      return;
    }
    if(pathname.startsWith('/api/host/live-system/composer/')){
      const command=pathname.slice('/api/host/live-system/composer/'.length);
      const allowed={stage:'POST','stage-file':'POST',pause:'POST',status:'GET'};
      if(!Object.hasOwn(allowed,command)){sendJson(res,404,{code:'NOT_FOUND'});return;}
      if(req.method!==allowed[command]){
        res.setHeader('allow',allowed[command]);sendJson(res,405,{code:'METHOD'});return;
      }
      if(String(req.headers.origin||'').toLowerCase()!=='http://'+host ||
         (req.method==='POST'&&req.headers['x-vivim-control']!=='1')){
        sendJson(res,403,{code:'ORIGIN_OR_CSRF'});return;
      }
      if(!ownerAuthorized(req,res,tokenFor))return;
      res.setHeader('cache-control','private, no-store');
      try{
        if(command==='status'){sendJson(res,200,composerBridge.status());return;}
        const body=await readJsonBody(req,8192);
        if(command==='stage-file'){
          if(!body||Object.keys(body).length!==1||body.confirm!==true){
            sendJson(res,400,{code:'LIVE_FILE_STAGE_CONFIRMATION_REQUIRED'});return;
          }
          // Files can propose only the same Rust candidate as the authorized
          // terminal caller. Neither a watcher nor this route performs effects.
          await liveSystemMirror.publish(await readPublishedLiveSystem());
          const correlationId='file.'+randomBytes(12).toString('hex');
          const candidateSet=await liveSystemMirror.admitEdited({correlationId});
          const candidates=candidateSet?.commands;
          if(candidateSet?.state!=='candidate'||!Array.isArray(candidates)||
             candidates.length!==1){
            sendJson(res,409,{code:'LIVE_FILE_EDIT_NOT_ADMISSIBLE',
              reason:candidateSet?.reason??'NOT_ONE_EDIT',
              executionAuthorized:false,effectPerformed:false});return;
          }
          const c=candidates[0];
          if(c.regionId!=='phone.composer'||c.pointer!=='/draft'||
             c.actionId!=='pwa.composer.draft.set'||
             c.correlationId!==correlationId||
             typeof c.oldValue!=='string'||typeof c.newValue!=='string'){
            sendJson(res,409,{code:'LIVE_FILE_ACTION_NOT_SUPPORTED',
              executionAuthorized:false,effectPerformed:false});return;
          }
          const current=await liveSystem.snapshot();
          const region=current?.regions?.find(r=>r.id==='phone.composer');
          if(current.revision!==c.expectedSystemSequence||
             region?.viewRevision!==c.expectedRegionRevision||
             region?.sourceRevision!==c.expectedSourceRevision||
             region?.data?.draft!==c.oldValue||
             typeof region?.data?.sessionId!=='string'){
            sendJson(res,409,{code:'LIVE_FILE_SOURCE_STALE',
              executionAuthorized:false,effectPerformed:false});return;
          }
          const staged=await composerBridge.stage({sessionId:region.data.sessionId,
            intent:{epoch:current.epoch,regionId:c.regionId,pointer:'/draft',
              expectedSequence:current.revision,
              expectedViewRevision:c.expectedRegionRevision,
              expectedSourceRevision:c.expectedSourceRevision,
              correlationId,operation:'replace',text:c.newValue}});
          sendJson(res,202,{...staged,origin:'owner-file-proposal'});
          return;
        }
        if(command==='pause'){
          if(Object.keys(body).length!==1||typeof body.paused!=='boolean')
            {sendJson(res,400,{code:'COMPOSER_CONTROL_INVALID'});return;}
          sendJson(res,200,composerBridge.setPaused(body.paused));return;
        }
        sendJson(res,202,await composerBridge.stage(body));
      }catch(error){
        sendJson(res,[400,409,423,503].includes(error?.status)?error.status:503,{
          code:error?.code||'COMPOSER_UNAVAILABLE',executionAuthorized:false,effectPerformed:false});
      }
      return;
    }
    if (pathname === '/api/host/live-system/admit-file') {
      if(req.method!=='POST'){res.setHeader('allow','POST');sendJson(res,405,{code:'METHOD'});return;}
      if(String(req.headers.origin||'').toLowerCase()!=='http://'+host ||
         req.headers['x-vivim-control']!=='1'){
        sendJson(res,403,{code:'ORIGIN_OR_CSRF'});return;
      }
      if(!ownerAuthorized(req,res,tokenFor))return;
      try {sendJson(res,200,await liveSystemMirror.admitEdited())}
      catch {sendJson(res,503,{code:'LIVE_MIRROR_ADMISSION_UNAVAILABLE',executionAuthorized:false,effectPerformed:false})}
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('allow', 'GET, HEAD'); res.writeHead(405); res.end(); return; }
    if (pathname === '/api/host/native-owner-proof') {
      // A native client must prove the listener knows the existing owner
      // capability before ever transmitting the long-lived bearer token.
      // This is read-only and issues no action, session, grant, or receipt.
      if (req.method !== 'GET') { sendJson(res, 405, {code:'METHOD'}); return; }
      const params = new URL(req.url, 'http://localhost').searchParams;
      if (params.size !== 1 || params.getAll('challenge').length !== 1) {
        sendJson(res, 400, {code:'HOST_PROOF_CHALLENGE_INVALID'}); return;
      }
      const challenge = params.get('challenge');
      if (typeof challenge !== 'string' || !/^[0-9a-f]{64}$/.test(challenge)) {
        sendJson(res, 400, {code:'HOST_PROOF_CHALLENGE_INVALID'}); return;
      }
      try {
        sendJson(res, 200, nativeOwnerProof(challenge, tokenFor()));
      } catch {
        sendJson(res, 503, {code:'HOST_PROOF_UNAVAILABLE'});
      }
      return;
    }
    if (pathname === '/api/host/live-system') {
      if (req.method !== 'GET') {
        res.setHeader('allow','GET');sendJson(res,405,{code:'METHOD'});return;
      }
      if (req.headers.origin !== undefined && String(req.headers.origin).toLowerCase() !== 'http://' + host) {
        sendJson(res,403,{code:'ORIGIN'});return;
      }
      if (!ownerAuthorized(req,res,tokenFor)) return;
      try {
        const observed=await readPublishedLiveSystem();
        res.setHeader('cache-control','private, no-store');
        let mirrorState='unavailable';
        try{mirrorState=(await liveSystemMirror.publish(observed)).state}
        catch{/* read-only observation remains available when file mirror fails */}
        sendJson(res,200,{...observed,mirror:{state:mirrorState}});
      } catch (error) {
        // Owner-only, bounded diagnosis; never reveal paths, binary names,
        // credentials, stderr or filesystem details to the PWA client.
        const code=error?.code==='LIVE_SYSTEM_NATIVE_NOT_PACKAGED'
          ? 'LIVE_SYSTEM_NATIVE_NOT_PACKAGED' : 'LIVE_SYSTEM_UNAVAILABLE';
        sendJson(res,503,{schema:'vivim.host-live-system/1',state:'unavailable',
          code,authority:'none',executionAuthorized:false,effectPerformed:false});
      }
      return;
    }
    if (pathname === '/api/host/status') {
      res.setHeader('content-type', 'application/json; charset=utf-8');
      const snapshot=hostSnapshot({dataRoot,bootstrap:runtimeFor()});
      if(req.method==='GET')snapshot.recovery=await projectHostRecoveryNative(snapshot);
      res.writeHead(200);res.end(req.method==='HEAD'?undefined:JSON.stringify(snapshot));return;
    }
    // Product state is projected deterministically from one durable Host journal.
    if (pathname === '/api/state' || pathname === '/api/wiki') {
      try {
        const projected = await productJournal.readProjection();
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.writeHead(200);
        res.end(req.method === 'HEAD' ? undefined :
          JSON.stringify(pathname === '/api/state' ? projected.state : projected.wiki));
      } catch (error) {
        sendJson(res, Number.isInteger(error?.status) ? error.status : 500,
          { error: 'Product projection unavailable' });
      }
      return;
    }
    // Roadmap is a read-through of the maintained single source of truth;
    // only the existing roadmap keeper edits the machine roadmap document.
    if (pathname === '/api/roadmap') {
      try {
        const body = await readFile(path.join(REPO_ROOT, 'docs', 'product', 'roadmap', 'roadmap.v1.json'), 'utf8');
        JSON.parse(body);
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : body); return;
      } catch (error) {
        sendJson(res, error && error.code === 'ENOENT' ? 404 : 502, { error: 'Roadmap read-through failed' });
        return;
      }
    }
    // Human and machine reads share exactly the journal that POST /api/mutate appends.
    if (pathname === '/api/journal') {
      const format = new URL(req.url, 'http://localhost').searchParams.get('format');
      if (format !== null && format !== 'json' && format !== 'jsonl') {
        sendJson(res, 400, { code: 'JOURNAL_FORMAT_INVALID' }); return;
      }
      try {
        const raw = format === 'jsonl';
        const body = raw ? await productJournal.rawJournal() : JSON.stringify(await productJournal.readRecords());
        res.setHeader('content-type', raw
          ? 'application/jsonl; charset=utf-8'
          : 'application/json; charset=utf-8');
        res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : body);
      } catch (error) {
        sendJson(res, Number.isInteger(error?.status) ? error.status : 500,
          { error: 'Journal unavailable' });
      }
      return;
    }
    let asset = ASSETS[pathname];
    // First run remains phone-first. Explicit setup is available at /onboarding.
    if (!asset) { res.writeHead(404); res.end('Not found'); return; }
    try {
      const body = await readFile(path.join(staticRoot, asset));
      res.setHeader('content-type', MIME[pathname] ?? MIME['/']); res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(503); res.end('Host UI unavailable'); }
  });
  // Release the Direct share-maintenance timer with the server. Do not leave
  // background cleanup running after the owning Host instance shuts down.
  server.on('close', () => {
    liveSystemFeed.dispose();
    try { direct?.close?.(); } catch { /* no timer remains */ }
  });
  // The persistent Rust computation child belongs to this Host lifetime.
  server.on('close', () => {
    void import('./control/native-product-kernel.mjs')
      .then(module=>module.closeNativeProductKernel()).catch(()=>{});
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
  if (pathname === '/api/host/bootstrap/corpus') {
    if (req.method !== 'GET') { res.setHeader('allow', 'GET'); sendJson(res, 405, { code: 'METHOD' }); return; }
    let token;
    try { token = tokenFor(); } catch { sendJson(res, 503, { code: 'OWNER_TOKEN_UNAVAILABLE' }); return; }
    if (!verifyOwnerToken(req.headers.authorization, token)) {
      sendJson(res, 401, { code: 'OWNER_AUTH' }); return;
    }
    const query = new URL(req.url, expected).searchParams;
    if ([...query.keys()].some(k => k !== 'limit') || query.getAll('limit').length > 1 ||
      (query.has('limit') && !/^(?:[1-9]|[1-9][0-9]|100)$/.test(query.get('limit')))) {
      sendJson(res, 400, { code: 'ORACLE_CORPUS_QUERY_INVALID' }); return;
    }
    try {
      res.setHeader('cache-control', 'private, no-store');
      sendJson(res, 200, runtime.oracleCorpus({ limit: Number(query.get('limit') ?? 50) }));
    } catch {
      sendJson(res, 503, { code: 'ORACLE_CORPUS_UNAVAILABLE' });
    }
    return;
  }
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
async function handleControl(req, res, pathname, host, controlFor, tokenFor, uiSessions, enrollment, runtimeFor, productJournal, nativeContext, developmentSources) {
  const route = pathname.slice('/api/host/control/'.length);
  const sameOrigin = String(req.headers.origin || '').toLowerCase() === 'http://' + host;
  const isMutation = ['plan', 'interpret', 'execute', 'ui-logout', 'devices/approve', 'devices/revoke','development/register','development/index','development/hvi-grant','development/hvi-revoke'].includes(route);
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
        '; HttpOnly; SameSite=Strict; Path=/api; Max-Age=' + session.maxAge);
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
  // The existing owner session/CSRF gate remains the only authority. Config selects
  // actual approved roots and optional native source adapter, never request paths.
  const developmentBearer=!!owner&&verifyOwnerToken(req.headers.authorization,owner);
  const developmentSession=developmentBearer?null:uiSessions.get(req)?.sessionId;
  const developmentStillOwner=()=>{
    if(developmentBearer){try{return verifyOwnerToken(req.headers.authorization,tokenFor());}catch{return false;}}
    return !!developmentSession&&uiSessions.get(req)?.sessionId===developmentSession&&
      uiSessions.authorized(req,{mutate:isMutation});
  };
  const developmentPort=()=>createDevelopmentReadPort({
    config:developmentSources??{approvedRoots:JSON.parse(process.env.VIVIM_HQ_APPROVED_ROOTS||'[]'),dataDir:process.env.VIVIM_HQ_DATA_DIR||undefined},
    runtime:runtimeFor(),sessionId:developmentSession??'owner-token',
    stillOwner:developmentStillOwner
  });
  if(route.startsWith('development/')){
    const op=route.slice('development/'.length);
    if(!['status','graph','register','index','hvi-grant','hvi-revoke'].includes(op)){sendJson(res,404,{code:'NOT_FOUND'});return;}
    const readOnly=op==='status'||op==='graph';
    if(readOnly?req.method!=='GET':req.method!=='POST'){sendJson(res,405,{code:'METHOD'});return;}
    if((req.headers.origin!==undefined&&!sameOrigin)||(!readOnly&&(!sameOrigin||req.headers['x-vivim-control']!=='1'))){
      sendJson(res,403,{code:'ORIGIN_OR_CSRF'});return;
    }
    try{
      let body;
      if(op==='graph'){
        const query=new URL(req.url,'http://'+host).searchParams;
        if([...query.keys()].some(k=>!['operation','key','depth'].includes(k)||query.getAll(k).length!==1)){
          sendJson(res,400,{code:'HQ_GRAPH_QUERY_INVALID'});return;
        }
        body={operation:query.get('operation'),key:query.get('key')};
        if(query.has('depth'))body.depth=Number(query.get('depth'));
      }else if(!readOnly){body=await readJsonBody(req,8192);}
      const method={'status':'status','graph':'graph','register':'register','index':'refresh',
        'hvi-grant':'issueGrant','hvi-revoke':'revokeGrant'}[op];
      const value=await developmentPort()[method](body);
      if(!developmentStillOwner()){sendJson(res,401,{code:'OWNER_AUTH'});return;}
      res.setHeader('cache-control','private, no-store');sendJson(res,200,value);
    }catch(e){sendJson(res,e.status===401?401:e.status===403?403:e.status===503?503:400,
      {code:typeof e.code==='string'&&/^[A-Z_]+$/.test(e.code)?e.code:'DEVELOPMENT_REFUSED'});}
    return;
  }
  function readStudioOutcomes(){
    try{return createLiveStateProjection({dir:path.dirname(path.dirname(productJournal.journalPath)),
      worldId:runtimeFor().worldId,verifyObservation:()=>false}).studioOutcomes();}
    catch{return {schema:'vivim.studio-outcomes/1',state:'unavailable',items:[]};}
  }
  // Native renderer consumes the SAME validated TierFlow render plan as the PWA.
  // There is no new writer, phone grant, or renderer-side compiler authority.
  if(route==='native-pure'){
    if(req.method!=='POST'){sendJson(res,405,{code:'METHOD'});return;}
    if(!sameOrigin||req.headers['x-vivim-control']!=='1'){
      sendJson(res,403,{code:'ORIGIN_OR_CSRF'});return;
    }
    const bearer=!!owner&&verifyOwnerToken(req.headers.authorization,owner);
    const ownerSession=bearer?null:uiSessions.get(req)?.sessionId;
    const stillOwner=()=>{
      if(bearer){try{return verifyOwnerToken(req.headers.authorization,tokenFor());}catch{return false;}}
      return !!ownerSession&&uiSessions.get(req)?.sessionId===ownerSession&&
        uiSessions.authorized(req,{mutate:false});
    };
    if(!stillOwner()){sendJson(res,401,{code:'OWNER_AUTH'});return;}
    try{
      const body=await readJsonBody(req,262144);
      if(!body||typeof body.operation!=='string'||body.operation.length>50||
        !body.input||typeof body.input!=='object'||Array.isArray(body.input)||
        Object.keys(body).some(k=>!['operation','input'].includes(k))){
        sendJson(res,400,{code:'INVALID_NATIVE_INPUT'});return;
      }
      const {runNativeProductPure}=await import('./control/native-product-pure.mjs');
      const result=await runNativeProductPure(body.operation,body.input);
      if(!stillOwner()){sendJson(res,401,{code:'OWNER_AUTH'});return;}
      res.setHeader('cache-control','private, no-store');
      sendJson(res,result.state==='unavailable'?503:result.state==='refused'?400:200,result);
    }catch{
      sendJson(res,503,{schema:'vivim.product-pure-response/1',state:'unavailable',
        code:'NATIVE_PURE_UNAVAILABLE',authority:'none',
        executionAuthorized:false,effectPerformed:false});
    }
    return;
  }
  if (route === 'native-ui-view' || route === 'native-vec-ir') {
    if (req.method !== 'GET') { sendJson(res,405,{code:'METHOD'});return; }
    if (req.headers.origin !== undefined && !sameOrigin) {sendJson(res,403,{code:'ORIGIN'});return;}
    res.setHeader('cache-control','private, no-store');
    // Bind the request to the original authentication channel, never silently
    // switch from a revoked bearer to a browser session during an async read.
    const bearer=!!owner&&verifyOwnerToken(req.headers.authorization,owner);
    const sessionId=bearer?null:uiSessions.get(req)?.sessionId;
    const stillAuthorized=()=>{
      if(bearer){try{return verifyOwnerToken(req.headers.authorization,tokenFor());}catch{return false;}}
      return !!sessionId&&uiSessions.get(req)?.sessionId===sessionId&&uiSessions.authorized(req,{mutate:false});
    };
    if(!stillAuthorized()){sendJson(res,401,{code:'OWNER_AUTH'});return;}
    try {
      const {projectNativeUi}=await import('./control/native-ui-view.mjs');
      const url=new URL(req.url,'http://'+host);
      if([...url.searchParams.keys()].some(k=>k!=='viewportPx')||url.searchParams.getAll('viewportPx').length>1){sendJson(res,400,{code:'INVALID_VIEWPORT'});return;}
      const width=url.searchParams.get('viewportPx')??'1000';
      if(!/^\d{3,4}$/.test(width)||Number(width)<240||Number(width)>3840){sendJson(res,400,{code:'INVALID_VIEWPORT'});return;}
      let wiki=null;
      try{wiki=await productJournal.readPhoneWiki();}catch{/* no guessed live rows */}
      if(!stillAuthorized()){sendJson(res,401,{code:'OWNER_AUTH'});return;}
      const result=projectNativeUi(runtimeFor().projection(),Number(width),{wiki,outcomes:readStudioOutcomes()});
      const response=route==='native-vec-ir'
        ?await (await import('./control/native-vec-ir.mjs')).compileRustVecView(result)
        :result;
      if(!stillAuthorized()){sendJson(res,401,{code:'OWNER_AUTH'});return;}
      sendJson(res,response?.state==='unavailable'&&route==='native-vec-ir'?503:200,response);
    } catch {
      sendJson(res,503,{schema:route==='native-vec-ir'?'vivim.vec-visual-ir/1':'vivim.native-ui-view/1',
        state:'unavailable',authority:'none',code:'NATIVE_VISUAL_UNAVAILABLE',
        executionAuthorized:false,effectPerformed:false});
    }
    return;
  }
  if(route==='wiki-view'){
    if(req.method!=='GET'){sendJson(res,405,{code:'METHOD'});return;}
    if(req.headers.origin!==undefined&&!sameOrigin){sendJson(res,403,{code:'ORIGIN'});return;}
    try{const wiki=await productJournal.readPhoneWiki();
      if(!verifyOwnerToken(req.headers.authorization,owner)&&!uiSessions.authorized(req,{mutate:false})){sendJson(res,401,{code:'OWNER_AUTH'});return;}
      res.setHeader('cache-control','private, no-store');sendJson(res,200,wiki);
    }catch{sendJson(res,503,{code:'WIKI_VIEW_UNAVAILABLE'});}return;
  }
  // Private observations are never placed in public /api/wiki.
  if (route === 'wiki-context') {
    if (req.method !== 'GET') { res.setHeader('allow', 'GET'); sendJson(res, 405, { code: 'METHOD' }); return; }
    if (req.headers.origin !== undefined && !sameOrigin) { sendJson(res, 403, { code: 'ORIGIN' }); return; }
    res.setHeader('cache-control', 'private, no-store');
    try {
      const context = await productJournal.readWikiContext();
      let applicationEffects;
      try { applicationEffects = projectAppliedControlEffects(controlFor(), context.wikiChanges, context.wikiStructure); }
      catch { applicationEffects = { state: 'unavailable', code: 'CONTROL_RECEIPTS_UNAVAILABLE', items: [] }; }
      const native = await nativeContext('wiki',{owner:true});
      // Recheck an authorized browser session after asynchronous native work.
      if (!verifyOwnerToken(req.headers.authorization, owner) && !uiSessions.authorized(req,{mutate:false})) {
        sendJson(res,401,{code:'OWNER_AUTH'}); return;
      }
      // Oracle uses the existing Host ledger and owner-private Wiki context. Never
      // poll a second corpus endpoint from the browser or merge provider
      // recollections into committed Wiki journal semantics.
      let oracleCorpus;
      try { oracleCorpus = runtimeFor().oracleCorpus({ limit: 16 }); }
      catch { oracleCorpus = { schema:'vivim.oracle-corpus-view/1',state:'unavailable',
        items:[],count:0,sensitiveExcluded:true,code:'ORACLE_CORPUS_UNAVAILABLE' }; }
      const enriched = { ...context, applicationEffects, nativeContext:native, oracleCorpus, studioOutcomes:readStudioOutcomes() };
      sendJson(res, 200, { ...enriched, semantics: projectWikiSemantics(enriched) });
    } catch { sendJson(res, 503, { schema: 'vivim.wiki-context/1', state: 'unavailable', code: 'WIKI_CONTEXT_UNAVAILABLE' }); }
    return;
  }
  // Desktop PWA reads the Host's existing phone-safe projection using ONLY the
  // one-use owner browser session or local owner capability. This is not a phone
  // grant, a relay, a live-message transcript or an execution endpoint.
  if (route === 'pwa-view') {
    if (req.headers.origin !== undefined && !sameOrigin) { sendJson(res, 403, { code: 'ORIGIN' }); return; }
    // Authenticate BEFORE owner projections, grants and media work.
    // The existing post-await check still catches an expired browser session.
    if(!verifyOwnerToken(req.headers.authorization,owner)&&!uiSessions.authorized(req,{mutate:false})){sendJson(res,401,{code:'OWNER_AUTH'});return;}
    if (req.method !== 'GET') { res.setHeader('allow', 'GET'); sendJson(res, 405, { code: 'METHOD' }); return; }
    try {
      const projected = runtimeFor().projection();
      const { cards, preferences, hardNos, ...phoneSafe } = projected;
      // Provenance and private owner preferences never leave through this
      // generic PWA summary. Reuse the existing Host projection; no new store.
      const recent = controlFor().recent(12).map(r => ({
        planId: r.planId, actionId: r.actionId, risk: r.risk,
        state: r.state, createdAt: r.createdAt, source: r.source
      }));
      const grants = enrollment.listGrants();
      // Owner-authenticated read-only PWA can display the same HQ catalog.
      // Desktop preview never gains a phone stream grant or file path.
      const media = await createMediaPlaybackService().list();
      if(!verifyOwnerToken(req.headers.authorization,owner)&&!uiSessions.authorized(req,{mutate:false})){sendJson(res,401,{code:'OWNER_AUTH'});return;}
      res.setHeader('cache-control','private, no-store');
      sendJson(res, 200, {
        schema: 'vivim.host-pwa-view/1', observedAt: new Date().toISOString(),
        media,
        state: projected.state === 'ready' ? 'source-backed' : 'unavailable',
        snapshot: {
          bootstrap: { ...phoneSafe, cards: Array.isArray(cards) ? cards.slice(0, 3).map(c => ({
            id: c.id, title: c.title, basis: c.basis
          })) : [], preferences: [], hardNos: [] },
          control: { schema: 'vivim.control-recent/1', recent },
          studioOutcomes:readStudioOutcomes(),
          devices: { schema: 'vivim.device-counts/1', total: grants.length,
            pending: grants.filter(g => g.status === 'pending').length,
            active: grants.filter(g => g.status === 'active').length }
        }
      });
    } catch {
      // No private internal error body, no guessed Host state.
      sendJson(res, 503, { schema: 'vivim.host-pwa-view/1', state: 'unavailable', code: 'PWA_VIEW_UNAVAILABLE' });
    }
    return;
  }
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
    res.setHeader('set-cookie', UI_COOKIE + '=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0');
    sendJson(res, 200, { revoked: true });
    return;
  }
  const capabilityDetailMatch = route.match(/^capabilities\/([a-z][a-z0-9._-]{2,95})$/);
  if (route === 'capability-sources' || capabilityDetailMatch) {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('allow','GET, HEAD');sendJson(res,405,{code:'METHOD'});return; }
    if (req.headers.origin !== undefined && !sameOrigin) { sendJson(res,403,{code:'ORIGIN'});return; }
    res.setHeader('cache-control','private, no-store');
    try {
      const discovery=controlFor().describe();
      const result=capabilityDetailMatch
        ? describeUniversalCapability(discovery,capabilityDetailMatch[1])
        : await describeCapabilitySources(discovery);
      let currentOwner=null;try{currentOwner=tokenFor();}catch{}
      if (!(currentOwner&&verifyOwnerToken(req.headers.authorization,currentOwner))&&!uiSessions.authorized(req,{mutate:false})) {
        sendJson(res,401,{code:'OWNER_AUTH'});return;
      }
      sendJson(res,200,result);
    } catch(e){sendJson(res,e.status||503,{code:typeof e.code==='string'&&/^API_[A-Z_]+$/.test(e.code)?e.code:'API_DISCOVERY_UNAVAILABLE'});}
    return;
  }
  if (route === 'capabilities' || route === 'integration-targets/search') {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('allow','GET, HEAD'); sendJson(res,405,{code:'METHOD'});return; }
    if (req.headers.origin !== undefined && !sameOrigin) { sendJson(res,403,{code:'ORIGIN'});return; }
    try {
      const secret = owner && verifyOwnerToken(req.headers.authorization,owner) ? owner : uiSessions.get(req)?.sessionId;
      const kind = route === 'capabilities' ? 'actions' : 'targets';
      const result = searchUniversalApi({kind,secret,params:new URL(req.url,'http://'+host).searchParams,
        ...(kind === 'actions' ? {discovery:controlFor().describe()} : {})});
      res.setHeader('cache-control','private, no-store');sendJson(res,200,result);
    } catch (e) { sendJson(res,e.status || 503,{code:typeof e.code === 'string' && /^(API_[A-Z_]+|OWNER_AUTH)$/.test(e.code)?e.code:'API_DISCOVERY_UNAVAILABLE'}); }
    return;
  }
  const reads = { 'openapi.json': c => buildUniversalApi(c.describe()), 'integration-targets': () => readIntegrationTargets(), catalog: c => c.describe(), world: c => c.world(), language: c => c.languagePack(), lexicon: c => c.lexicon(), rules: c => c.ownerRules(), recent: c => ({ items: c.recent(20) }) };
  const planMatch = route.match(/^plans\/(ctl-[a-f0-9]{16})$/);
  try {
    if (Object.hasOwn(reads,route) || planMatch) {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('allow', 'GET, HEAD'); sendJson(res, 405, { error: 'GET only', code: 'METHOD' }); return; }
      if (req.headers.origin !== undefined && String(req.headers.origin).toLowerCase() !== 'http://' + host) { sendJson(res, 403, { error: 'Cross-origin request refused', code: 'ORIGIN' }); return; }
      if(route==='rules')res.setHeader('cache-control','private, no-store');
      if(planMatch)res.setHeader('cache-control','private, no-store');
      sendJson(res, 200, planMatch ? await controlFor().inspectOwnerPlan(planMatch[1]) : reads[route](controlFor())); return;
    }
    if (!['interpret', 'plan', 'execute'].includes(route)) { sendJson(res, 404, { error: 'Unknown control route', code: 'NOT_FOUND' }); return; }
    if (req.method !== 'POST') { res.setHeader('allow', 'POST'); sendJson(res, 405, { error: 'POST only', code: 'METHOD' }); return; }
    if (String(req.headers.origin || '').toLowerCase() !== 'http://' + host || String(req.headers['x-vivim-control'] || '') !== '1') {
      sendJson(res, 403, { error: 'Same-origin control header required', code: 'ORIGIN_OR_CSRF' }); return;
    }
    const body = await readJsonBody(req, 64 * 1024);
    const c = controlFor();
    if (route === 'interpret') {
      if (!body || typeof body!=='object'||Array.isArray(body)||
          Object.keys(body).some(k => !['text','composer'].includes(k)) ||
          (body.composer!==undefined&&body.composer!==true))
        throw Object.assign(new Error('Invalid body'), { code: 'CONTROL_INPUT_INVALID' });
      const interpret=text=>c.interpret(text,{source:'desktop'});
      const meaning=interpret(body.text);
      if(body.composer!==true){sendJson(res,200,meaning);return;}
      let wiki=null;
      if(needsWikiDraftContext(body.text,meaning)){
        try{wiki=await productJournal.readPhoneWiki();}catch{/* no cached or synthetic targets */}
      }
      let currentOwner=null;
      try{currentOwner=tokenFor();}catch{}
      if(!(currentOwner&&verifyOwnerToken(req.headers.authorization,currentOwner))&&
          !uiSessions.authorized(req,{mutate:true})){
        sendJson(res,401,{code:'OWNER_AUTH'});return;
      }
      res.setHeader('cache-control','private, no-store');
      sendJson(res,200,composerResponse(body.text,meaning,{catalog:c.describe(),wiki,interpret,source:'desktop'}));return;
    }
    if (route === 'plan') {
      const plan = await c.plan(body, { source: 'desktop', actor: 'desktop-owner',
        readHvi: selection=>developmentPort().compare(selection) });
      const stillOwner = () => {
        try { if (verifyOwnerToken(req.headers.authorization, tokenFor())) return true; } catch {}
        return uiSessions.authorized(req, { mutate: true });
      };
      // Compile request evidence from the actual canonical result. The command
      // plan/digest is unchanged. Source access stays on the desktop owner path.
      const result = await attachRequestContext(plan, {
        text: body.text,
        readWiki: () => productJournal.readPhoneWiki(),
        compileSources: async params => {
          if (!stillOwner()) throw new Error('OWNER_AUTH');
          const config = developmentSources ?? {
            approvedRoots: JSON.parse(process.env.VIVIM_HQ_APPROVED_ROOTS || '[]'),
            dataDir: process.env.VIVIM_HQ_DATA_DIR || undefined
          };
          if (!Array.isArray(config.approvedRoots) || !config.approvedRoots.length)
            return {status:'not-configured',context:null};
          const session = uiSessions.get(req);
          const actorId = 'desktop-owner';
          const sessionId = session?.sessionId ?? 'owner-token';
          const surface = await createLiveSourceSurface({
            approvedRoots:config.approvedRoots,dataDir:config.dataDir,actorId,sessionId,
            authorize: request => request.actorId===actorId && request.sessionId===sessionId &&
              request.domain==='development' && ['source.read','source.context'].includes(request.operation) &&
              stillOwner()
          });
          return surface.compiledContext(params);
        }
      });
      let currentOwner = null;
      try { currentOwner = tokenFor(); } catch { /* fail closed */ }
      if (!(currentOwner && verifyOwnerToken(req.headers.authorization, currentOwner)) &&
          !uiSessions.authorized(req, { mutate: true })) {
        sendJson(res, 401, { code: 'OWNER_AUTH' }); return;
      }
      res.setHeader('cache-control', 'private, no-store');
      sendJson(res, 200, result); return;
    }
    if (Object.keys(body).some(k => !['planId', 'planDigest'].includes(k))) throw Object.assign(new Error('Invalid body'), { code: 'CONTROL_INPUT_INVALID' });
    sendJson(res, 200, await c.execute({ planId: body.planId, planDigest: body.planDigest, approval: { channel: 'desktop-owner-token', actor: 'desktop-owner' } }));
  } catch (error) {
    const code = error?.code ?? 'CONTROL_INVALID';
    sendJson(res, error?.status ?? controlErrorStatus(code), { error: String(error?.message ?? error).slice(0, 200), code });
  }
}

// First-run onboarding: state (prereqs + manifest), setup (studio setup), start (vivim start),
// verify (doctor). All run on this PC against the owner's installed Chrome profile.
async function handleOnboarding(req, res, pathname, apk, pairing, onboarding, enrollment, host, tokenFor, dataRoot) {
  const studioCli = STUDIO_CLI;
  const send = (status, body) => sendJson(res, status, body);
  const fail = (status, message, code = 'INVALID') => send(status, { ok: false, error: message, code });
  const sameOrigin = () => String(req.headers.origin || '').toLowerCase() === 'http://' + host;
  const isInside = (root, target) => {
    const r = path.resolve(root);
    const t = path.resolve(target);
    return t === r || t.startsWith(r + path.sep);
  };
  const requireOwnerMutation = () => {
    if (!sameOrigin() || String(req.headers['x-vivim-control'] || '') !== '1') {
      send(403, { ok: false, error: 'Cross-origin request refused', code: 'ORIGIN_OR_CSRF' }); return false;
    }
    return ownerAuthorized(req, res, tokenFor);
  };
  const privilegedPost = new Set([
    '/api/onboarding/setup', '/api/onboarding/start', '/api/onboarding/doctor',
    '/api/onboarding/apk/register', '/api/onboarding/pair/register',
    '/api/onboarding/provider/open', '/api/onboarding/provider/check',
    '/api/onboarding/primary', '/api/onboarding/personalize/review', '/api/onboarding/personalize/approve'
  ]);
  if (privilegedPost.has(pathname) && req.method === 'POST' && !requireOwnerMutation()) return;

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

  // Owner-authorized onboarding route (P0 PWA host exposure): register a built APK so
  // the paired phone can download it. Shares <dataRoot>/apk-artifacts with /api/host/apk/register.
  if (pathname === '/api/onboarding/apk/register') {
    if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return fail(405, 'POST only', 'METHOD'); }
    let body;
    try { body = await readJsonBody(req); } catch (e) { return fail(e.status ?? 400, e.message, 'BODY'); }
    const rawPath = typeof body.apkPath === 'string' ? body.apkPath.trim() : '';
    if (!rawPath) return fail(400, 'apkPath required', 'APK_PATH_REQUIRED');
    const apkPath = path.resolve(rawPath);
    const allowedRoots = [path.join(dataRoot, 'apk-artifacts'), REPO_ROOT];
    if (!allowedRoots.some(root => isInside(root, apkPath)) || path.extname(apkPath).toLowerCase() !== '.apk') {
      return fail(403, 'APK path not allowed', 'APK_PATH_NOT_ALLOWED');
    }
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
  const studioUrl = process.env.VIVIM_STUDIO_URL || defaultStudioOrigin();
  const server = createHostServer({ dataRoot, bootstrap: runtime, ownerToken, directPhone, worker, studioUrl, studioToken: process.env.VIVIM_STUDIO_TOKEN || null, autoPump: true });
  server.listen(port, '127.0.0.1', () => console.log(`VIVIM Host preview: http://127.0.0.1:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => { server.close(() => process.exit(0)); });
  }
}
