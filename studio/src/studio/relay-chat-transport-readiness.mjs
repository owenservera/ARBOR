// Read-only owner admission check for the EXISTING Studio-backed relay worker.
// A heartbeat must not claim that a browser send path is live merely because
// the bridge polling loop is still running. Never touches tabs, logs prompts,
// launches Studio, repairs sessions or retries a turn.
const allowedSites = new Set(['chatgpt']);
// Only known non-writing lifecycle states are safe to admit. Unknown states,
// active ownership and unresolved historical sends must never yield READY.
const passiveStates = new Set(['ready','closed','blocked']);
const validLoopback = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' &&
      ['127.0.0.1','localhost','[::1]'].includes(url.hostname) &&
      !url.username && !url.password && url.origin === value;
  } catch { return false; }
};
export async function probeStudioRelayReadiness({ url, fetchImpl = fetch, timeoutMs = 2500 } = {}) {
  if (!validLoopback(url) || typeof fetchImpl !== 'function')
    return { ready:false, reason:'STUDIO_ENDPOINT_INVALID' };
  const timeout = Number.isSafeInteger(timeoutMs) && timeoutMs >= 100 && timeoutMs <= 10000 ? timeoutMs : 2500;
  async function read(route) {
    const response = await fetchImpl(url + '/api/v1' + route, {
      method:'GET', redirect:'error', cache:'no-store', signal:AbortSignal.timeout(timeout)
    });
    if (!response.ok) throw new Error('STUDIO_HTTP_UNAVAILABLE');
    return response.json();
  }
  try {
    const targets = await read('/conversation-targets');
    if (!Array.isArray(targets?.sites) ||
        !targets.sites.some(site => (typeof site === 'string' ? site : site?.id) === 'chatgpt'))
      return { ready:false, reason:'STUDIO_CHATGPT_UNAVAILABLE' };
    const conversations = await read('/conversations');
    if (!Array.isArray(conversations?.conversations))
      return { ready:false, reason:'STUDIO_OWNER_STATE_UNAVAILABLE' };
    // The browser owner is single-writer. Another in-flight capture means
    // this worker must defer, regardless of which provider owns that capture.
    if (conversations.conversations.some(row =>
      !row || typeof row !== 'object' || !passiveStates.has(row.state)))
      return { ready:false, reason:'STUDIO_WRITER_BUSY_OR_UNKNOWN' };
    return { ready:true, reason:'STUDIO_OWNER_IDLE', supportedProviders:[...allowedSites] };
  } catch {
    return { ready:false, reason:'STUDIO_OWNER_UNREACHABLE' };
  }
}
