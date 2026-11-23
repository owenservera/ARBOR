// Read-only, loopback-only liveness check for the *existing* Studio chat
// channel's Chrome DevTools endpoint. No WebSocket connection, tab command,
// provider API call, session creation, browser launch or automatic retry.
// A successful result is a precondition for admitting NEW relay claims, NOT
// evidence that the user is signed in or that a provider turn was delivered.
const VALID_BROWSER = /^(?:Chrome|Chromium|HeadlessChrome)\/[0-9]+(?:\.|$)/;
const BROWSER_PATH = /^\/devtools\/browser\/[a-zA-Z0-9-]{8,128}$/;

export async function probeStudioChannelEndpoint({
  port, fetchImpl = fetch, timeoutMs = 1500
} = {}) {
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535 ||
      typeof fetchImpl !== 'function') {
    return {ready:false, reason:'STUDIO_CHANNEL_PORT_INVALID'};
  }
  const timeout = Number.isSafeInteger(timeoutMs) && timeoutMs >= 100 &&
    timeoutMs <= 5000 ? timeoutMs : 1500;
  const origin = 'http://127.0.0.1:' + port;
  try {
    const response = await fetchImpl(origin + '/json/version', {
      method:'GET', redirect:'error', cache:'no-store',
      signal:AbortSignal.timeout(timeout)
    });
    if (!response?.ok) return {ready:false, reason:'STUDIO_CHANNEL_UNAVAILABLE'};
    const version = await response.json();
    if (!version || typeof version !== 'object' ||
        !VALID_BROWSER.test(version.Browser ?? '') ||
        typeof version.webSocketDebuggerUrl !== 'string') {
      return {ready:false, reason:'STUDIO_CHANNEL_IDENTITY_UNVERIFIED'};
    }
    let endpoint;
    try { endpoint = new URL(version.webSocketDebuggerUrl); }
    catch { return {ready:false, reason:'STUDIO_CHANNEL_IDENTITY_UNVERIFIED'}; }
    if (endpoint.protocol !== 'ws:' ||
        !['127.0.0.1','localhost','[::1]'].includes(endpoint.hostname) ||
        Number(endpoint.port) !== port ||
        !BROWSER_PATH.test(endpoint.pathname) ||
        endpoint.search || endpoint.hash || endpoint.username || endpoint.password) {
      return {ready:false, reason:'STUDIO_CHANNEL_IDENTITY_UNVERIFIED'};
    }
    return {ready:true, reason:'STUDIO_CHANNEL_LOOPBACK_AVAILABLE'};
  } catch {
    return {ready:false, reason:'STUDIO_CHANNEL_UNAVAILABLE'};
  }
}
