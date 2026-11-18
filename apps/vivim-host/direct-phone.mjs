// Direct phone traffic is accepted only behind a trusted local Tailscale Serve proxy.
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { createRelay, COOKIE, sessionValue } from '../mobile-relay/lib/relay-core.mjs';
import { createBridgeStore } from '../../studio/src/studio/bridge-commands.mjs';
import { createSourceVerifiedLiveProjection } from './conversations/live-projection.mjs';
import { createPhoneSessions } from './phone-sessions.mjs';
import { createControlPlanner } from './control/intent-planner.mjs';
import { attachRequestContext } from './control/request-context.mjs';
import { composerResponse, needsWikiDraftContext } from '../mobile-relay/composer-assist.mjs';
import { createApkRegistry } from './apk/registry.mjs';
import { createEnrollment } from './apk/enrollment.mjs';
import { createPairingStore } from './apk/pairing.mjs';
import { readMemoryParams } from './bootstrap/web-memory.mjs';
import { createMediaPlaybackService, parseMediaRange } from './media/playback.mjs';
import { createMediaStreamGrantGuard } from './media/stream-guard.mjs';
import { projectChatProviders } from './chat/provider-projection.mjs';
import { controlErrorStatus } from './control/http-status.mjs';

const root = fileURLToPath(new URL('../mobile-relay/', import.meta.url));
const assets = new Map(Object.entries({
  '': ['index.html', 'text/html; charset=utf-8'],
  'index.html': ['index.html', 'text/html; charset=utf-8'],
  'app.js': ['app.js', 'text/javascript; charset=utf-8'],
  // app.js imports these two canonical Today/World/Me modules; Direct must serve them.
  'ux/model.mjs': ['ux/model.mjs', 'text/javascript; charset=utf-8'],
  'ux/mission-experience.mjs': ['ux/mission-experience.mjs', 'text/javascript; charset=utf-8'],
  'ux/render.mjs': ['ux/render.mjs', 'text/javascript; charset=utf-8'],
  'ux/readiness.mjs': ['ux/readiness.mjs', 'text/javascript; charset=utf-8'],
  'ux/launcher.mjs': ['ux/launcher.mjs', 'text/javascript; charset=utf-8'],
  'ux/launcher-ui.mjs': ['ux/launcher-ui.mjs', 'text/javascript; charset=utf-8'],
  'ux/local-notes.mjs': ['ux/local-notes.mjs', 'text/javascript; charset=utf-8'],
  'ux/local-notes-ui.mjs': ['ux/local-notes-ui.mjs', 'text/javascript; charset=utf-8'],
  'ux/voice-capture.mjs': ['ux/voice-capture.mjs', 'text/javascript; charset=utf-8'],
  'pairing-link.mjs': ['pairing-link.mjs', 'text/javascript; charset=utf-8'],
  'device-enrollment.mjs': ['device-enrollment.mjs', 'text/javascript; charset=utf-8'],
  'browser-device-key.mjs': ['browser-device-key.mjs', 'text/javascript; charset=utf-8'],
  'control-phone.mjs': ['control-phone.mjs', 'text/javascript; charset=utf-8'],
  'control-client.mjs': ['control-client.mjs', 'text/javascript; charset=utf-8'],
  'control-chat.mjs': ['control-chat.mjs', 'text/javascript; charset=utf-8'],
  'control-language.mjs': ['control-language.mjs', 'text/javascript; charset=utf-8'],
  'composer-assist.mjs': ['composer-assist.mjs', 'text/javascript; charset=utf-8'],
  ...Object.fromEntries(['frames','grammar','ground','index','interpret','lexer','project','recognize','symbols','text','types']
    .map(n => [`nlcl/${n}.mjs`, [`nlcl/${n}.mjs`, 'text/javascript; charset=utf-8']])),
  'grokbot.html': ['grokbot.html', 'text/html; charset=utf-8'],
  'grokbot.js': ['grokbot.js', 'text/javascript; charset=utf-8'],
  'sw.js': ['sw.js', 'text/javascript; charset=utf-8'],
  'transport.mjs': ['transport.mjs', 'text/javascript; charset=utf-8'],
  'transport.js': ['transport.js', 'text/javascript; charset=utf-8'],
  'visual-bootstrap.mjs': ['visual-bootstrap.mjs', 'text/javascript; charset=utf-8'],
  'visual-theme.mjs': ['visual-theme.mjs', 'text/javascript; charset=utf-8'],
  'bootstrap-phone.mjs': ['bootstrap-phone.mjs', 'text/javascript; charset=utf-8'],
  'build-composer.mjs': ['build-composer.mjs', 'text/javascript; charset=utf-8'],
  'build-canvas.mjs': ['build-canvas.mjs', 'text/javascript; charset=utf-8'],
  'vec/compiler.mjs': ['vec/compiler.mjs', 'text/javascript; charset=utf-8'],
  'vec/ui-adapter.mjs': ['vec/ui-adapter.mjs', 'text/javascript; charset=utf-8'],
  // Serve the reviewed VEC engine sources verbatim, not a duplicated browser compiler.
  ...Object.fromEntries(['compiler','registry','catalog','validators','enum-choices']
    .map(n => [`vec-engines/${n}.mjs`,
      [`../../packages/vec-ui-engines/src/${n}.mjs`, 'text/javascript; charset=utf-8']])),
  // Same TierFlow source for local and authorized Direct PWA, with types erased.
  'tierflow-runtime/document/schema.ts': ['../../packages/tierflow/src/visual-runtime/document/schema.ts', 'text/javascript; charset=utf-8'],
  'tierflow-runtime/document/validate.ts': ['../../packages/tierflow/src/visual-runtime/document/validate.ts', 'text/javascript; charset=utf-8'],
  'tierflow-runtime/document/import-legacy.ts': ['../../packages/tierflow/src/visual-runtime/document/import-legacy.ts', 'text/javascript; charset=utf-8'],
  'tierflow-runtime/render/dom.ts': ['../../packages/tierflow/src/visual-runtime/render/dom.ts', 'text/javascript; charset=utf-8'],
  'tierflow-runtime/render/spatial-fallback.ts': ['../../packages/tierflow/src/visual-runtime/render/spatial-fallback.ts', 'text/javascript; charset=utf-8'],
  'vec/ui-taxonomy/catalog.mjs': ['vec/ui-taxonomy/catalog.mjs', 'text/javascript; charset=utf-8'],
  'vec/ui-taxonomy/registry.mjs': ['vec/ui-taxonomy/registry.mjs', 'text/javascript; charset=utf-8'],
  'welcome.mjs': ['welcome.mjs', 'text/javascript; charset=utf-8'],
  'generative-ui/design-composer.mjs': ['generative-ui/design-composer.mjs', 'text/javascript; charset=utf-8'],
  'bootstrap-f02.mjs': ['bootstrap-f02.mjs', 'text/javascript; charset=utf-8'],
  'generative-ui/catalog.mjs': ['generative-ui/catalog.mjs', 'text/javascript; charset=utf-8'],
  'generative-ui/compiler.mjs': ['generative-ui/compiler.mjs', 'text/javascript; charset=utf-8'],
  'generative-ui/renderer.mjs': ['generative-ui/renderer.mjs', 'text/javascript; charset=utf-8'],
  'generative-ui/bootstrap-adapters.mjs': ['generative-ui/bootstrap-adapters.mjs', 'text/javascript; charset=utf-8'],
  'generative-ui/semantic-projection.mjs': ['generative-ui/semantic-projection.mjs', 'text/javascript; charset=utf-8'],
  'generative-ui/portable-digest.mjs': ['generative-ui/portable-digest.mjs', 'text/javascript; charset=utf-8'],
  'generative-ui/phone-surface.mjs': ['generative-ui/phone-surface.mjs', 'text/javascript; charset=utf-8'],
  'generative-ui/host-revision-guard.mjs': ['generative-ui/host-revision-guard.mjs', 'text/javascript; charset=utf-8'],
  'fonts/space-grotesk-latin-wght-normal.woff2': ['fonts/space-grotesk-latin-wght-normal.woff2', 'font/woff2'],
  'fonts/geist-latin-wght-normal.woff2': ['fonts/geist-latin-wght-normal.woff2', 'font/woff2'],
  'fonts/jetbrains-mono-latin-wght-normal.woff2': ['fonts/jetbrains-mono-latin-wght-normal.woff2', 'font/woff2'],
  'manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json'],
  'icon.svg': ['icon.svg', 'image/svg+xml'],
  'icon-192.png': ['icon-192.png', 'image/png'],
  'icon-512.png': ['icon-512.png', 'image/png'],
  'icon-maskable-512.png': ['icon-maskable-512.png', 'image/png'],
}));
// Exposed so tests can assert the loopback preview asset allowlist stays complete.
export const PHONE_ASSETS = assets;
async function readPhoneAsset(asset) {
  const filename = path.join(root, asset[0]);
  // Only allowlisted TierFlow files have the .ts suffix. No runtime input is
  // compiled and no additional path is exposed.
  return asset[0].endsWith('.ts')
    ? stripTypeScriptTypes(await readFile(filename,'utf8'))
    : readFile(filename);
}
// Desktop preview serves only static PWA assets on local loopback. All phone APIs
// remain behind the independently authorized Direct/Tailscale phone handler.
export async function serveLoopbackPhoneAsset(req, res, pathname) {
  if (!pathname.startsWith('/mobile/')) return false;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('allow', 'GET, HEAD'); res.writeHead(405); res.end(); return true;
  }
  const relative = pathname.slice('/mobile/'.length);
  if (!relative && new URL(req.url || '/', 'http://localhost').searchParams.get('host-preview') !== '1') {
    res.writeHead(404); res.end('Use the authorized Direct phone URL'); return true;
  }
  const asset = assets.get(relative);
  if (!asset) { res.writeHead(404); res.end('Not found'); return true; }
  // The existing phone document contains inline styles; scripts still load only from self.
  // Unlike the remote phone endpoint, this static preview permits same-origin framing
  // by the new loopback Host presentation shell only.
  res.setHeader('x-frame-options', 'SAMEORIGIN');
  res.setHeader('content-security-policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; media-src 'self' blob:; frame-src 'none'; object-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'");
  try {
    const content = await readPhoneAsset(asset);
    res.setHeader('content-type', asset[1]);
    res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    res.writeHead(503); res.end('Phone PWA asset unavailable');
  }
  return true;
}

const json = (res, status, body) => { res.setHeader('content-type', 'application/json; charset=utf-8'); res.writeHead(status); res.end(JSON.stringify(body)); };
const failure = (status, message) => Object.assign(new Error(message), { status });
// The VIVIM phone session route. The VIVIM-native path is `sessions*`; the
// `opencode/` prefix is only a client-compatibility alias for the shipped phone
// PWA and resolves to the same VIVIM-owned route. No CLI is involved.
const PHONE_SESSION_ID = 'c-[a-f0-9]{16}';
const PHONE_SESSIONS = new RegExp(`^(?:opencode/)?sessions(?:/${PHONE_SESSION_ID}/(?:messages|prompt))?$`);
const RELAY_PATH = new RegExp(`^(?:session|commands|commands/cmd-[0-9a-f]{16}|status|agent/status|(?:opencode/)?sessions(?:/${PHONE_SESSION_ID}/(?:messages|prompt))?)$`);

async function readBody(req) {
  if (String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase() !== 'application/json') throw failure(415, 'JSON required');
  let size = 0, oversized = false; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > 65536) { oversized = true; chunks.length = 0; } else if (!oversized) chunks.push(chunk); }
  if (oversized) throw failure(413, 'Request body too large');
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw failure(400, 'Invalid JSON'); }
}

export function createDirectPhoneHandler({ origin, user, dataRoot, worldId = 'world-local', projection, control = null, apkRegistry = null, pairingStore = null, onPhoneSeen = () => {}, primary = () => null, providerSnapshot = () => [], providerRefresh = null,
  webMemory = null, mediaPlayback = null, chatContext = null, wikiProjection = null }) {
  let url;
  try { url = new URL(origin); } catch { throw new TypeError('Direct phone origin must be an HTTPS origin'); }
  if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password || !user || typeof user !== 'string' || user.trim() !== user) throw new TypeError('Direct phone requires an exact HTTPS origin and user');
  const bridge = createBridgeStore({ root: dataRoot });
  // Source-backed metadata projection; bridge remains the sole queue authority.
  const live = createSourceVerifiedLiveProjection({dataRoot,worldId});
  const secret = randomBytes(32).toString('hex');
  const media = mediaPlayback ?? createMediaPlaybackService();
  // Short-lived stream capability is confined to this Host process and the
  // authenticated Tailscale owner, then checked against the live device grant.
  // Native HTML media elements cannot attach the device headers; the ticket
  // is therefore an HttpOnly Secure cookie, never a URL query or JS bearer.
  const mediaTickets = new Map();
  const MEDIA_COOKIE = 'vivim_media_stream';
  const mediaTtlMs = 4 * 60 * 60_000;
  const pruneMediaTickets = () => {
    const now = Date.now();
    for (const [id, record] of mediaTickets)
      if (record.expiresAt <= now) mediaTickets.delete(id);
  };
  const mediaCookie = req => String(req.headers.cookie || '').split(';')
    .map(value => value.trim()).find(value => value.startsWith(MEDIA_COOKIE + '='))?.slice(MEDIA_COOKIE.length + 1);

  const store = {
    async listCommands() { return bridge.list({ limit: 200 }).items.map(({ claimToken, ...record }) => record); },
    async putCommand(record) {
      if (record.mode === 'bootstrap' && record.action === 'personalize') throw failure(501, 'Personalize is not supported by direct phone');
      // 'messageId' is the owner message id of the VIVIM phone session route.
      // The relay command route never sets it, so it cannot be injected there.
      const chat = { ...Object.fromEntries(['mode', 'conversationId', 'newChat', 'target', 'attachments', 'action', 'preset', 'proposal', 'messageId'].filter(k => record[k] !== undefined).map(k => [k, record[k]])), transport: 'direct' };
      bridge.create({ id: record.id, origin: 'relay', text: record.text, kind: record.kind, consumer: record.consumer, stage: record.stage, chat });
      if (record.mode === 'relay-chat' && record.conversationId) {
        // The command has already been durably accepted. A projection failure
        // must NOT make the phone retry a possibly executing send.
        try { await live.recordAcceptedRelay(record.id); }
        catch (e) { console.warn('[vivim-live] queued metadata not yet projected:',e.code||'SOURCE_STATE_CHANGED'); }
      }
    },
    async latestStatus() {
      const { cards, preferences, hardNos, ...visual } = await projection();
      const phoneCards = Array.isArray(cards) ? cards.slice(0, 3).map(({ id, title, basis }) => ({ id, title, basis })) : [];
      // A read refresh can reconcile a verified bridge claim, never a provider effect.
      // Projection failures do not interrupt the phone's established transport.
      let liveSummary = {schema:'vivim.world-conversation-timeline/1',state:'unavailable',conversations:[]};
      try {
        const reconciliation=await live.reconcileBridgeClaims();
        const studio=await live.reconcileStudioJournal();
        const timeline=live.worldTimeline();
        const verifiedDisplays=new Set(studio.verifiedReplyDisplayCommands);
        liveSummary={schema:timeline.schema,state:reconciliation.failed||studio.failed?'needs-review':'source-backed',
          worldId:timeline.worldId,revision:timeline.revision,
          conversations:timeline.conversations.slice(-30).map(c=>({
            id:c.id,provider:c.provider,model:c.model,revision:c.revision,
            messages:c.messages.slice(-30).map(m=>({
              ...m,
              replyDisplayVerified:verifiedDisplays.has(m.commandId) &&
                ['reply_observed','delivered'].includes(m.state)
            }))
          }))};
      } catch (e) {
        console.warn('[vivim-live] timeline read unavailable:',e.code||'PROJECTION_ERROR');
      }
      // Checked Studio observations only. A model cache or open tab is not
      // proof that the owner is signed into a provider.
      let providerRecords=[];
      try {providerRecords=providerSnapshot()}catch{providerRecords=[]}
      const manifest=projectChatProviders(providerRecords);
      return { at: new Date().toISOString(), snapshot: {
        bootstrap: { ...visual, cards: phoneCards, preferences: [], hardNos: [] },
        onboarding: { primary: primary() }, manifest, live: liveSummary } };
    },
  };
  const relay = createRelay({ store, env: { VIVIM_RELAY_PAIR_SECRET: secret } });
  // The phone session route is VIVIM-owned (WO-034). It reads the canonical
  // bridge ledger and the source-verified projection; it never starts a CLI.
  const phoneSessions = createPhoneSessions({ dataRoot, worldId, bridge, live, store });
  const apk = apkRegistry ?? createApkRegistry({ dataRoot });
  const pairing = pairingStore ?? createPairingStore({ dataRoot });
  const enrollment = createEnrollment({ dataRoot, origin, user });
  // Tailscale authenticates the network user, not the installed phone. All
  // privileged operations additionally require the owner's approved device grant.
  const authorizeDevice = (req, scope) => {
    const grantId = req.headers['x-vivim-grant-id'];
    const sessionId = req.headers['x-vivim-device-session'];
    if (typeof grantId !== 'string' || typeof sessionId !== 'string') throw failure(401, 'DEVICE_SESSION_REQUIRED');
    const grant = enrollment.validateGrant({ grantId, sessionId });
    if (!Array.isArray(grant.scopes) || !grant.scopes.includes(scope)) throw failure(403, 'DEVICE_SCOPE_DENIED');
    return grant;
  };

  return async function directPhone(req, res) {
    const remote = req.socket.remoteAddress;
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote) || req.headers.host !== url.host || req.headers['x-forwarded-proto'] !== 'https' || req.headers['tailscale-user-login'] !== user) { json(res, 403, { error: 'Forbidden' }); return; }
    res.setHeader('content-security-policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; media-src 'self' blob:; frame-src 'none'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    const rawPath = (req.url || '').split('?')[0];
    if (rawPath === '/mobile') { res.writeHead(308, { location: '/mobile/' }); res.end(); return; }
    if (!rawPath.startsWith('/mobile/')) { json(res, 404, { error: 'Not found' }); return; }
    const route = rawPath.slice('/mobile/'.length);
    // The existing Host journal is the only Wiki authority. Never expose it to
    // an unpaired phone, cloud relay or a device without control:read.
    if (route === 'api/wiki') {
      if (req.method !== 'GET') {
        res.setHeader('allow', 'GET');
        json(res, 405, { code: 'METHOD' });
        return;
      }
      try {
        authorizeDevice(req, 'control:read');
        if (typeof wikiProjection !== 'function') throw failure(503, 'WIKI_UNAVAILABLE');
        const wiki = await wikiProjection();
        res.setHeader('cache-control', 'private, no-store');
        json(res, 200, wiki);
      } catch (error) {
        const status = error.status || 503;
        res.setHeader('cache-control', 'private, no-store');
        json(res, status, { code: status === 503 ? 'WIKI_UNAVAILABLE' : error.message,
          error: status === 503 ? 'Wiki unavailable' : error.message });
      }
      return;
    }
    if (route === 'api/live/ack') {
      // The phone reports an actually rendered verified reply, never a fetch
      // or bridge completion. Origin + CSRF + device-scoped grant required.
      if(req.method!=='POST'){json(res,405,{code:'METHOD'});return;}
      if(req.headers.origin!==origin||req.headers['x-vivim-ack']!=='1'){
        json(res,403,{code:'ORIGIN_OR_CSRF'});return;
      }
      try {
        const device=authorizeDevice(req,'relay:write');
        const body=await readBody(req);
        if(!body||typeof body!=='object'||Array.isArray(body)||
            Object.keys(body).some(k=>!['commandId','messageId','conversationId','replyRevision'].includes(k)))
          throw failure(400,'PHONE_ACK_BODY_INVALID');
        const receipt=await live.recordPhoneDelivery({
          commandId:body.commandId,messageId:body.messageId,
          conversationId:body.conversationId,replyRevision:body.replyRevision,
          deviceId:device.deviceId
        });
        json(res,receipt.replayed?200:201,{
          schema:'vivim.phone-delivery-receipt/1',...receipt
        });
      }catch(error){
        const code=error.code??'PHONE_ACK_UNAVAILABLE';
        const status=/_(?:INVALID|FIELDS_INVALID|ID_INVALID)$/.test(code)?400:
          /(?:STALE|CONFLICT|NOT_VERIFIED)/.test(code)?409:error.status??503;
        json(res,status,{code,error:status===503?'Phone acknowledgment unavailable':code});
      }
      return;
    }
    if (route === 'api/chat/providers/refresh') {
      // Explicit owner gesture. Studio performs existing read-only account
      // checks using its browser owner. No model is asked and nothing is sent.
      if (req.method !== 'POST') {json(res,405,{code:'METHOD'});return}
      try {
        authorizeDevice(req,'control:read');
        if(req.headers.origin!==origin||req.headers['x-vivim-providers']!=='1')
          throw failure(403,'ORIGIN_OR_CSRF');
        if(typeof providerRefresh!=='function')throw failure(503,'STUDIO_PROVIDER_CHECK_UNAVAILABLE');
        const result=await providerRefresh();
        res.setHeader('cache-control','private, no-store');
        json(res,200,projectChatProviders(result));
      }catch(error){
        json(res,error.status||503,{schema:'vivim.chat-provider-projection/1',
          state:'unavailable',reason:error.status?error.message:'PROVIDER_CHECK_UNAVAILABLE',providers:[]});
      }
      return;
    }
    if (route === 'api/chat/context') {
      // Read-only context projection: Tailscale identity and a live approved
      // control:read grant are both required. The phone supplies only a fixed
      // surface name; the Host selects the Rust binary, journal and graph seed.
      if (req.method !== 'GET') { json(res,405,{code:'METHOD'});return; }
      try {
        authorizeDevice(req,'control:read');
        const query = [...new URL(req.url,origin).searchParams.entries()];
        if (query.length!==1 || query[0][0]!=='focus' ||
          !['today','talk','build','world','wiki','me','control'].includes(query[0][1]))
          throw failure(400,'CHAT_FOCUS_INVALID');
        const result=chatContext
          ? await chatContext(query[0][1])
          : {schema:'vivim.hqkg-chat-context/1',state:'unavailable',reason:'RUST_CORE_NOT_CONFIGURED',items:[]};
        // A grant can be revoked while the native subprocess is running.
        authorizeDevice(req,'control:read');
        res.setHeader('cache-control','private, no-store');
        json(res,200,result);
      }catch(error){
        json(res,error.status||503,{schema:'vivim.hqkg-chat-context/1',
          state:'unavailable',reason:error.status?error.message:'CHAT_CONTEXT_UNAVAILABLE',items:[]});
      }
      return;
    }
    if (route === 'api/memory/recent') {
      // Direct-only. Tailscale ownership is insufficient without a device-bound
      // session and explicit control:read scope; never expose through cloud relay.
      if (req.method !== 'GET') { json(res, 405, { code: 'METHOD' }); return; }
      try {
        authorizeDevice(req, 'control:read');
        if (!webMemory) { json(res, 503, { schema: 'vivim.web-memory-view/1', state: 'unavailable', items: [] }); return; }
        const params = readMemoryParams(new URL(req.url, origin).searchParams);
        json(res, 200, await webMemory(params));
      } catch (error) {
        json(res, error.status || (error.code ? 400 : 503),
          { code: error.code || 'WEB_MEMORY_UNAVAILABLE', error: error.status ? error.message : 'Web memory unavailable' });
      }
      return;
    }
    // Playback begins with a POST authenticated by the device's existing
    // control:read grant. Neither the catalog ID nor this route is a file path.
    if (route === 'api/media/open') {
      if (req.method !== 'POST') { res.setHeader('allow','POST'); json(res,405,{code:'METHOD'}); return; }
      try {
        const device = authorizeDevice(req,'control:read');
        if (req.headers.origin !== origin || req.headers['x-vivim-media'] !== '1')
          throw failure(403,'ORIGIN_OR_CSRF');
        const body = await readBody(req);
        if (!body || typeof body !== 'object' || Array.isArray(body) ||
            Object.keys(body).length !== 1 || typeof body.mediaId !== 'string')
          throw failure(400,'MEDIA_OPEN_INPUT_INVALID');
        const mediaId = body.mediaId;
        const info = await media.resolve(mediaId);
        await info.handle.close();
        pruneMediaTickets();
        // One currently selected native video per approved device session.
        // Replace its obsolete ticket instead of accumulating four-hour grants.
        for (const [priorId, prior] of mediaTickets) {
          if (prior.grantId === req.headers['x-vivim-grant-id'] &&
              prior.sessionId === req.headers['x-vivim-device-session'])
            mediaTickets.delete(priorId);
        }
        if (mediaTickets.size >= 32) throw failure(429,'MEDIA_STREAM_CAPACITY');
        const ticket = randomBytes(32).toString('hex');
        const expiresAt = Date.now() + mediaTtlMs;
        mediaTickets.set(ticket, {
          mediaId, fingerprint: info.fingerprint, expiresAt,
          grantId: req.headers['x-vivim-grant-id'],
          sessionId: req.headers['x-vivim-device-session'],
          deviceId: device.deviceId
        });
        res.setHeader('set-cookie', MEDIA_COOKIE + '=' + ticket +
          '; Secure; HttpOnly; SameSite=Strict; Path=/mobile/api/media/stream/; Max-Age=14400');
        res.setHeader('cache-control','private, no-store');
        json(res,200,{schema:'vivim.media-playback-ticket/1',
          url:'/mobile/api/media/stream/' + mediaId, mime:info.mime,
          bytes:info.size, expiresAt:new Date(expiresAt).toISOString()});
      } catch (cause) {
        json(res,cause.status || 503,{code:cause.status ? cause.message : 'MEDIA_OPEN_UNAVAILABLE'});
      }
      return;
    }
    if (route === 'api/media/close') {
      if (req.method !== 'POST') { res.setHeader('allow','POST'); json(res,405,{code:'METHOD'}); return; }
      try {
        authorizeDevice(req, 'control:read');
        if (req.headers.origin !== origin || req.headers['x-vivim-media'] !== '1')
          throw failure(403,'ORIGIN_OR_CSRF');
        // Discard only this device session's ephemeral stream capabilities;
        // this does not mutate the HQ library, grants or any Host effect.
        for (const [id, record] of mediaTickets) {
          if (record.grantId === req.headers['x-vivim-grant-id'] &&
              record.sessionId === req.headers['x-vivim-device-session']) mediaTickets.delete(id);
        }
        res.setHeader('set-cookie', MEDIA_COOKIE +
          '=; Secure; HttpOnly; SameSite=Strict; Path=/mobile/api/media/stream/; Max-Age=0');
        res.setHeader('cache-control','private, no-store');
        json(res,200,{schema:'vivim.media-playback-closed/1',closed:true});
      } catch (cause) {
        json(res,cause.status || 503,{code:cause.status ? cause.message : 'MEDIA_CLOSE_UNAVAILABLE'});
      }
      return;
    }
    const streamId = /^api\/media\/stream\/([a-f0-9]{32})$/.exec(route);
    if (streamId) {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('allow','GET, HEAD'); json(res,405,{code:'METHOD'}); return;
      }
      let info = null;
      try {
        if (new URL(req.url,origin).search) throw failure(400,'MEDIA_QUERY_UNSUPPORTED');
        pruneMediaTickets();
        const ticket = mediaCookie(req);
        const record = /^[a-f0-9]{64}$/.test(ticket || '') ? mediaTickets.get(ticket) : null;
        if (!record || record.mediaId !== streamId[1])
          throw failure(401,'MEDIA_STREAM_SESSION_REQUIRED');
        // A revoked or expired device must stop streaming even with the cookie.
        const grant = enrollment.validateGrant({grantId:record.grantId,sessionId:record.sessionId});
        if (!Array.isArray(grant.scopes) || !grant.scopes.includes('control:read'))
          throw failure(403,'MEDIA_STREAM_SCOPE_DENIED');
        info = await media.resolve(streamId[1],record.fingerprint);
        let bytes;
        try { bytes = parseMediaRange(req.headers.range,info.size); }
        catch (cause) {
          if (cause.status === 416) {
            res.setHeader('content-range','bytes */' + info.size);
            res.setHeader('accept-ranges','bytes');
            res.setHeader('cache-control','private, no-store');
            res.writeHead(416); res.end();
            await info.handle.close(); return;
          }
          throw cause;
        }
        res.setHeader('content-type',info.mime);
        res.setHeader('content-length',String(bytes.end - bytes.start + 1));
        res.setHeader('accept-ranges','bytes');
        res.setHeader('cache-control','private, no-store');
        res.setHeader('x-content-type-options','nosniff');
        res.setHeader('etag',info.etag);
        if (bytes.partial)
          res.setHeader('content-range','bytes ' + bytes.start + '-' + bytes.end + '/' + info.size);
        res.writeHead(bytes.partial ? 206 : 200);
        if (req.method === 'HEAD') { res.end(); await info.handle.close(); return; }
        const reader = info.handle.createReadStream({
          start:bytes.start,end:bytes.end,autoClose:true
        });
        // Check the same Host grant again during long-running streams. A
        // revocation closes the pipeline even after initial headers were sent.
        const guard = createMediaStreamGrantGuard({
          validateGrant: args => enrollment.validateGrant(args),
          grantId: record.grantId, sessionId: record.sessionId
        });
        // pipeline handles backpressure and aborts both ends on disconnect.
        await pipeline(reader,guard,res);
      } catch (cause) {
        try { await info?.handle.close(); } catch {}
        if (res.headersSent) { res.destroy(); return; }
        json(res,cause.status || 503,{code:cause.status ? cause.message : 'MEDIA_STREAM_UNAVAILABLE'});
      }
      return;
    }
    if (route === 'api/media/library') {
      // Private metadata only: a device-approved control:read capability is required.
      // This is not a streaming endpoint; never expose local paths or torrent URLs.
      if (req.method !== 'GET') { json(res, 405, { code: 'METHOD' }); return; }
      try {
        authorizeDevice(req, 'control:read');
        const query = [...new URL(req.url, origin).searchParams.entries()];
        if (query.length > 1 || (query.length === 1 && query[0][0] !== 'offset'))
          throw failure(400,'MEDIA_QUERY_UNSUPPORTED');
        const rawOffset = query.length ? query[0][1] : '0';
        if (!/^(?:0|[1-9][0-9]{0,5})$/.test(rawOffset) || Number(rawOffset) > 100000)
          throw failure(400,'MEDIA_OFFSET_INVALID');
        json(res, 200, await media.list({offset:Number(rawOffset)}));
      } catch (error) {
        json(res, error.status || 503, { schema: 'vivim.media-library-summary/1',
          state: 'unavailable', reason: error.status ? error.message : 'MEDIA_READ_UNAVAILABLE',
          total: 0, shown: 0, hasMore: false, favorites: 0, items: [],
          // The read failed, so no playback state is knowable. The success path
          // reports not-configured / none-mapped / available; 'not-integrated'
          // would describe the feature rather than this failure.
          playback: 'unavailable' });
      }
      return;
    }
    if (route.startsWith('api/control/')) {
      // UTC04 phone surface. Identity: the Tailscale owner login checked above. Every POST also
      // requires the exact Direct origin and an explicit header. Execution goes only through the
      // Host dispatcher, bound to a digest the phone received from a prior /plan call.
      const sub = route.slice('api/control/'.length);
      const planMatch = sub.match(/^plans\/(ctl-[a-f0-9]{16})$/);
      const reads = { catalog: 1, world: 1, language: 1, lexicon: 1, recent: 1 };
      try {
        const c = control ? control() : null;
        const device = authorizeDevice(req, 'control:read');
        if (reads[sub] || planMatch) {
          if (req.method !== 'GET') { json(res, 405, { code: 'METHOD' }); return; }
          const planner = c ?? createControlPlanner();
          if (sub === 'catalog') { json(res, 200, planner.describe()); return; }
          if (sub === 'world') { json(res, 200, planner.world()); return; }
          if (sub === 'language') { json(res, 200, planner.languagePack()); return; }
          if (!c) { json(res, 404, { code: 'CONTROL_DISPATCH_UNAVAILABLE' }); return; }
          json(res, 200, planMatch ? c.status(planMatch[1]) : sub === 'lexicon' ? c.lexicon() : { items: c.recent(20) }); return;
        }
        if (!['plan', 'interpret', 'execute'].includes(sub)) { json(res, 404, { code: 'NOT_FOUND' }); return; }
        if (req.method !== 'POST') { json(res, 405, { code: 'METHOD' }); return; }
        if (req.headers.origin !== origin || req.headers['x-vivim-control'] !== '1') { json(res, 403, { code: 'ORIGIN_OR_CSRF' }); return; }
        if (sub === 'execute') authorizeDevice(req, 'control:execute');
        const body = await readBody(req);
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw failure(400, 'Invalid control body');
        if (sub === 'interpret' || (sub === 'plan' && !c)) {
          if (Object.keys(body).some(k => k !== 'text' && !(sub==='interpret'&&k==='composer')) ||
              (body.composer!==undefined&&body.composer!==true))throw failure(400,'Invalid control body');
          const planner = c ?? createControlPlanner();
          if(sub!=='interpret'){json(res,200,planner.planText(body.text,{source:'mobile'}));return;}
          const interpret=text=>c?c.interpret(text,{source:'mobile'}):planner.interpretText(text,{source:'mobile'});
          const meaning=interpret(body.text);
          if(body.composer!==true){json(res,200,meaning);return;}
          let wiki=null;
          if(c&&typeof wikiProjection==='function'&&needsWikiDraftContext(body.text,meaning)){
            try{wiki=await wikiProjection();}catch{/* no fallback targets */}
          }
          authorizeDevice(req,'control:read');
          res.setHeader('cache-control','private, no-store');
          json(res,200,composerResponse(body.text,meaning,{catalog:c?c.describe():{actions:[]},wiki,interpret,source:'mobile'}));return;
        }
        if (!c) { json(res, 404, { code: 'CONTROL_DISPATCH_UNAVAILABLE' }); return; }
        if (sub === 'plan') {
          const plan = await c.plan(body, { source: 'mobile', actor: device.deviceId });
          // Reuse the phone-safe Wiki projection; never open owner-private HQ
          // sources, native personal context, statements or effect history here.
          const result = await attachRequestContext(plan,{text:body.text,readWiki:wikiProjection});
          // A device grant may be revoked during an asynchronous Wiki read.
          authorizeDevice(req, 'control:read');
          res.setHeader('cache-control', 'private, no-store');
          json(res, 200, result); return;
        }
        if (Object.keys(body).some(k => !['planId', 'planDigest'].includes(k))) throw failure(400, 'Invalid control body');
        json(res, 200, await c.execute({ planId: body.planId, planDigest: body.planDigest, approval: { channel: 'direct-phone', actor: device.deviceId } }));
      } catch (error) {
        json(res, error.status || controlErrorStatus(error.code), { code: error.code || 'CONTROL_INVALID', error: String(error.message ?? error).slice(0, 160) });
      }
      return;
    }
    if (route === 'api/relay') {
      try {
        const params = new URL(req.url, origin).searchParams;
        if (params.getAll('path').length !== 1) throw failure(400, 'Invalid path');
        const relayPath = params.get('path');
        authorizeDevice(req, req.method === 'GET' ? 'relay:read' : 'relay:write');
        // Only an active, scope-authorized device may advance phone presence.
        try { onPhoneSeen(); } catch { /* presence must not block requests */ }
        if (!RELAY_PATH.test(relayPath)) throw failure(404, 'Not found');
        if (req.method === 'POST' && req.headers.origin !== origin) throw failure(403, 'Cross-origin request refused');
        const body = req.method === 'POST' ? await readBody(req) : {};
        if (relayPath === 'agent/status') {
          if (req.method !== 'GET') throw failure(405, 'GET only');
          const queued = bridge.list({consumer:'grokbot',limit:200}).items;
          let health=null;
          try {
            const h=JSON.parse(await readFile(path.join(dataRoot,'bridge','grokbot-worker.json'),'utf8'));
            if (h?.schema==='vivim.grokbot-worker-health/1' && h.available === true &&
                Number.isFinite(Date.parse(h.at)) && Date.now()-Date.parse(h.at)<15000 && Date.now()>=Date.parse(h.at))
              health=h;
          } catch { /* no verified native runner heartbeat */ }
          json(res,200,{schema:'vivim.grokbot-direct-status/1',host:url.host,transport:'direct',nativeWorker:health ?
            {available:true,protocol:health.protocol,at:health.at} :
            {available:false,reason:'No fresh verified Grokbot native worker heartbeat'},jobs:{queued:queued.filter(c=>c.status==='queued').length,claimed:queued.filter(c=>c.status==='claimed').length,done:queued.filter(c=>c.status==='done').length,failed:queued.filter(c=>c.status==='failed').length}});
          return;
        }
        if (PHONE_SESSIONS.test(relayPath)) { json(res, 200, await phoneSessions({ method: req.method, relayPath, body })); return; }
        const out = await relay({ method: req.method, path: relayPath, req: { headers: { cookie: `${COOKIE}=${sessionValue(secret)}` } }, body });
        json(res, out.status, out.body);
      } catch (error) { json(res, error.status || 500, { error: error.status ? error.message : 'Relay error' }); }
      return;
    }

    // ---- APK07 enrollment (FR-C01-C06) - must be before the GET-only guard so POST prove/start/session work.
    if (route.startsWith('api/enrollment/')) {
      const sub = route.slice('api/enrollment/'.length);
      if (sub === 'start' && req.method === 'POST') {
        try { const body = await readBody(req); json(res, 200, enrollment.startChallenge(body)); } catch (e) { json(res, e.status || 400, { error: e.message }); }
        return;
      }
      if (sub === 'prove' && req.method === 'POST') {
        try { const body = await readBody(req); json(res, 201, enrollment.prove(body)); } catch (e) { json(res, e.status || 400, { error: e.message }); }
        return;
      }
      if (sub === 'status' && req.method === 'GET') {
        const params = new URL(req.url, origin).searchParams;
        try { json(res, 200, enrollment.status({ challengeId: params.get('id') })); } catch (e) { json(res, e.status || 400, { error: e.message }); }
        return;
      }
      if (sub === 'grant-status' && req.method === 'GET') {
        try { json(res, 200, enrollment.grantStatus({ grantId: new URL(req.url, origin).searchParams.get('id') })); }
        catch (e) { json(res, e.status || 400, { error: e.message }); }
        return;
      }
      if (sub === 'session' && req.method === 'POST') {
        try { const body = await readBody(req); json(res, 201, enrollment.createSession(body)); } catch (e) { json(res, e.status || 400, { error: e.message }); }
        return;
      }
      if (sub === 'grants' && req.method === 'GET') {
        try { authorizeDevice(req, 'devices:read'); } catch (e) { json(res, e.status || 403, { error: e.message }); return; }
        json(res, 200, { schema: 'vivim.apk07-debug-grants/1', grants: enrollment.listGrants() });
        return;
      }
      json(res, 404, { error: 'Not found' });
      return;
    }

    // ---- APK07 PC<->phone pairing - must be before the GET-only guard so POST works.
    // The PC mints a single-use, short-lived token (rendered as a QR code); the phone
    // redeems it exactly once and receives the persistent deviceId.
    if (route === 'api/pair') {
      if (req.method !== 'POST') { json(res, 405, { error: 'POST only' }); return; }
      try {
        const body = await readBody(req);
        const token = body && typeof body === 'object' && !Array.isArray(body) ? body.token : undefined;
        if (typeof token !== 'string' || !token) throw failure(400, 'token required');
        // QR redemption is discovery only; it must not mint a trusted device ID.
        if (!pairing.consume(token)) throw failure(410, 'PAIR_TOKEN_INVALID_OR_USED');
        const challenge = enrollment.startChallenge({ deviceHint: 'android-qr' });
        json(res, 202, { ok: true, paired: false, enrollmentRequired: true, ...challenge });
      } catch (error) {
        const reason = error.code || error.message;
        const known = { TOKEN_REQUIRED: 400, TOKEN_UNKNOWN: 404, TOKEN_EXPIRED: 410, TOKEN_ALREADY_USED: 409, ALREADY_PAIRED: 409 };
        const status = known[reason] || error.status || 500;
        json(res, status, { ok: false, error: status === 500 ? 'PAIRING_FAILED' : reason });
      }
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') { json(res, 405, { error: 'GET only' }); return; }

    // ---- APK07 artifact registry (FR-B01/B02/B04/B05/B06) ----
    if (route === 'api/apk/releases') {
      if (req.method !== 'GET') { json(res, 405, { error: 'GET only' }); return; }
      json(res, 200, { schema: 'vivim.apk-release-index/1', current: apk.getCurrent(), releases: apk.listReleases() });
      return;
    }
    if (route === 'api/apk/download') {
      if (req.method !== 'GET' && req.method !== 'HEAD') { json(res, 405, { error: 'GET only' }); return; }
      const params = new URL(req.url, origin).searchParams;
      const releaseId = params.get('releaseId');
      if (!releaseId) { json(res, 400, { error: 'releaseId required' }); return; }
      try {
        const { filePath, release, size } = await apk.artifactStreamInfo(releaseId);
        res.setHeader('content-type', 'application/vnd.android.package-archive');
        res.setHeader('content-disposition', `attachment; filename="${release.fileName}"`);
        res.setHeader('content-length', String(size));
        res.setHeader('x-content-type-options', 'nosniff');
        res.setHeader('cache-control', 'private, no-store');
        res.writeHead(200);
        if (req.method === 'HEAD') { res.end(); return; }
        const stream = createReadStream(filePath);
        stream.pipe(res);
        stream.on('error', () => { try { res.end(); } catch { /* ignore */ } });
        return;
      } catch (error) {
        json(res, error.status || 500, { error: error.status ? error.message : 'download failed' });
        return;
      }
    }
    if (route === 'connection.json') { json(res, 200, { direct: true, directOnly: true, host: url.host, identity: 'tailscale-user-login', cloudEnabled: false }); return; }

    // ---- APK07 phone-side debug (read-only, redacted, no secrets) ----
    if (route === 'api/apk/debug' && req.method === 'GET') {
      json(res, 200, {
        schema: 'vivim.apk07-debug-registry/1',
        current: apk.getCurrent(),
        releases: apk.listReleases().map(({ releaseId, channel, applicationId, versionCode, versionName, certSha256, bytes, createdAt }) =>
          ({ releaseId, channel, applicationId, versionCode, versionName, certSha256, bytes, createdAt })),
      });
      return;
    }

    const asset = assets.get(route);
    if (!asset) { json(res, 404, { error: 'Not found' }); return; }
    try { const content = await readPhoneAsset(asset); res.setHeader('content-type', asset[1]); res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : content); }
    catch { json(res, 503, { error: 'Mobile UI unavailable' }); }
  };
}
