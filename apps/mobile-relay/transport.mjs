const CLOUD = 'https://vivim-mobile-relay.vercel.app';
// A phone served from a Direct Host never navigates to Cloud implicitly.
const DIRECT_ONLY = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('connection') === 'direct';
const MODE = 'vivim.connection.mode.v1', DIRECT = 'vivim.connection.direct.v1', PENDING = 'vivim.connection.uncertain.v1';

export function directOrigin(value) {
  try {
    const u = new URL(value);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
    if (u.username || u.password || u.pathname !== '/' || u.search || u.hash) return null;
    if (!(u.protocol === 'https:' && u.hostname.endsWith('.ts.net') && u.hostname.length > 7) &&
        !(loopback && (u.protocol === 'http:' || u.protocol === 'https:'))) return null;
    return u.origin;
  } catch { return null; }
}

export function createTransport({ fetchImpl, location, storage, navigate = url => location.assign(url) }) {
  const get = key => { try { return storage.getItem(key); } catch { return null; } };
  const put = (key, value) => { try { storage.setItem(key, value); } catch {} };
  const remove = key => { try { storage.removeItem(key); } catch {} };
  const incomingMode = new URLSearchParams(location.search || '').get('connection');
  if (['auto', 'direct', 'cloud'].includes(incomingMode)) put(MODE, incomingMode);
  const direct = !!directOrigin(location.origin) && location.pathname.startsWith('/mobile/');
  if (direct) put(DIRECT, location.origin);
  const cloudOrigin = direct ? CLOUD : location.origin;
  const mode = () => DIRECT_ONLY || direct ? 'direct' : (['auto', 'direct', 'cloud'].includes(get(MODE)) ? get(MODE) : 'auto');
  const pending = () => get(PENDING) === '1';
  let navigating = false;
  // Ephemeral only: never persist a device bearer session in localStorage.
  let deviceSession = null;
  function setDeviceSession(value) {
    if (value == null) { deviceSession = null; return; }
    if (!direct || !/^[a-f0-9]{32}$/.test(value.grantId || '') || !/^[a-f0-9]{32}$/.test(value.sessionId || '') ||
        !Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now()) throw new Error('Invalid device session');
    deviceSession = { grantId: value.grantId, sessionId: value.sessionId, expiresAt: value.expiresAt };
  }
  function select(next, address, acknowledge = false) {
    if (!['auto', 'direct', 'cloud'].includes(next)) throw new Error('Invalid connection mode');
    if ((DIRECT_ONLY || direct) && next === 'cloud') throw new Error('Cloud mode is disabled on this Direct Host');
    const origin = directOrigin(address || get(DIRECT));
    if (address && !origin) throw new Error('Enter an HTTPS Tailscale origin without a path, or a loopback development origin.');
    if (next === 'direct' && !origin) throw new Error('Enter your Tailscale PC address first.');
    const destination = next === 'direct' || (next === 'auto' && !direct && origin)
      ? origin + '/mobile/?connection=' + next
      : next === 'cloud' ? cloudOrigin + '/mobile?connection=cloud' : null;
    if (destination && new URL(destination).origin !== location.origin && pending() && !acknowledge)
      throw new Error('A send may still be pending on this connection. Check it here before switching.');
    if (origin) put(DIRECT, origin);
    put(MODE, next);
    if (destination && new URL(destination).origin !== location.origin) navigate(destination);
  }
  async function request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase(), mutation = !['GET', 'HEAD'].includes(method);
    if (mutation && pending()) throw Object.assign(new Error('A previous send is uncertain; check this connection before sending again.'), { uncertain: true });
    if (mutation) put(PENDING, '1');
    const fallback = () => {
      if (!mutation && path === 'session' && !DIRECT_ONLY && !direct && mode() === 'auto' && !pending() && !navigating) {
        navigating = true; navigate(CLOUD + '/mobile?connection=auto');
      }
    };
    if (direct && (!deviceSession || deviceSession.expiresAt <= Date.now())) {
      deviceSession = null;
      if (mutation) remove(PENDING);
      throw Object.assign(new Error('Approve this phone on your PC and establish a device session before sending.'), { status: 401 });
    }
    let response;
    try {
      response = await fetchImpl((direct ? '/mobile/api/relay?path=' : '/api/relay?path=') + encodeURIComponent(path), {
        credentials: 'same-origin', cache: 'no-store', ...options,
        headers: { 'content-type': 'application/json', ...(direct ? { 'x-vivim-grant-id': deviceSession.grantId, 'x-vivim-device-session': deviceSession.sessionId } : {}), ...(options.headers || {}) }
      });
    } catch (error) {
      fallback();
      if (mutation) throw Object.assign(new Error('Send uncertain; check this connection before switching or sending again.'), { cause: error, uncertain: true });
      throw Object.assign(new Error('Connection unavailable'), { cause: error });
    }
    if (response.status >= 500) fallback();
    let body = null;
    try { if (response.status !== 204) body = await response.json(); }
    catch {
      if (mutation) throw Object.assign(new Error('Send uncertain; response could not be read.'), { status: response.status, uncertain: true });
      if (response.status !== 401 && response.status !== 403) fallback();
      throw Object.assign(new Error('Invalid relay response (HTTP ' + response.status + ')'), { status: response.status });
    }
    if (mutation && response.status < 500) remove(PENDING);
    // A rejected grant/session is never silently retried with a stale bearer.
    // The Android owner must re-establish proof or request fresh approval.
    if (direct && (response.status === 401 || response.status === 403)) deviceSession = null;
    if (!response.ok) throw Object.assign(new Error(mutation && response.status >= 500 ? 'Send uncertain (HTTP ' + response.status + '); check this connection before switching.' : body?.error || 'Relay HTTP ' + response.status), { status: response.status, uncertain: mutation && response.status >= 500 });
    return body;
  }
  const deviceHeaders = () => direct && deviceSession && deviceSession.expiresAt > Date.now()
    ? { 'x-vivim-grant-id': deviceSession.grantId, 'x-vivim-device-session': deviceSession.sessionId }
    : null;
  return { request, select, mode, pending, deviceHeaders, setDeviceSession, acknowledgePending: () => remove(PENDING), direct, directAddress: () => get(DIRECT) || '', cloudOrigin };
}

export const transport = typeof window === 'undefined' ? null : createTransport({
  fetchImpl: (...args) => fetch(...args), location: window.location, storage: window.localStorage
});
if (transport && new URLSearchParams(window.location.search).has('connection')) {
  const url = new URL(window.location.href);
  url.searchParams.delete('connection');
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}
